#!/usr/bin/env python3
"""
NDJSON Bridge: Streams flow detections and switch events as NDJSON to stdout.
Designed to be spawned as a child process by dream-catcher-tui.

Each stdout line is a JSON object with:
  {"type": "flow"|"switch"|"status"|"metrics", "ts": <epoch_ms>, "data": {...}}

Debug/diagnostic messages go to stderr so the NDJSON parser only reads stdout.
"""

import sys
import os
import json
import time
import threading
import subprocess
import argparse
from collections import deque
from datetime import datetime

# Add the misc directory to path so we can import wan_toggle-v2
MISC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools')
sys.path.insert(0, MISC_DIR)

from nfstream import NFStreamer
import yaml
import importlib.util

# Import wan_toggle-v2 (hyphen in filename requires importlib)
_spec = importlib.util.spec_from_file_location(
    "wan_toggle_v2",
    os.path.join(MISC_DIR, "wan_toggle-v2.py")
)
_wan_toggle = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_wan_toggle)
_wan_toggle._out = sys.stderr  # route wan_toggle prints to stderr → TUI debug panel
switch_to_wan1 = _wan_toggle.switch_to_wan1
switch_to_wan2 = _wan_toggle.switch_to_wan2

# Seconds of no Conversational Real-time traffic before switching back
COOLDOWN_SECONDS = 30
INTENT_CATEGORY = "Conversational Real-time"

# Protocol numbers to ignore for switch decisions (ICMP=1, ICMPv6=58)
# These are used by the metrics ping and must never trigger a slice switch.
SKIP_PROTOCOLS = frozenset({1, 58})

# ML classifier (loaded at startup, None if unavailable)
_ml_classifier = None

# Thread-safe emit lock
_emit_lock = threading.Lock()

# Shared mutable state — accessed from both the main flow loop and the stdin command thread.
# All reads/writes must hold _state_lock.
_state_lock = threading.Lock()
_shared = {
    'on_wan2': False,
    'auto_enabled': True,
    'last_realtime_seen': 0.0,
}


def emit(event_type: str, data: dict):
    """Emit an NDJSON line to stdout (thread-safe)."""
    line = json.dumps({
        "type": event_type,
        "ts": int(time.time() * 1000),
        "data": data,
    })
    with _emit_lock:
        sys.stdout.write(line + "\n")
        sys.stdout.flush()


def log(msg: str):
    """Debug logging to stderr (not captured by NDJSON parser)."""
    print(f"[{datetime.now()}] {msg}", file=sys.stderr, flush=True)


def load_ml_classifier():
    """Try to load the ML intent classifier. Returns classifier or None."""
    try:
        ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml")
        model_path = os.path.join(ml_dir, "model.joblib")
        if not os.path.exists(model_path):
            log("ML model not found at bridge/ml/ - ML classification disabled")
            return None

        # Import from the bundled inference module
        spec = importlib.util.spec_from_file_location(
            "ml_inference", os.path.join(ml_dir, "inference.py")
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        classifier = mod.IntentClassifier.from_directory(ml_dir)
        log(f"ML classifier loaded ({len(classifier.feature_columns)} features)")
        return classifier
    except Exception as e:
        log(f"ML classifier failed to load: {e}")
        return None


def load_intent_mapping(yaml_path=None):
    """Load intent mapping from YAML file and build reverse lookup dict."""
    if yaml_path is None:
        yaml_path = os.path.join(MISC_DIR, "intent_mapping.yaml")

    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)

    intent_map = {}
    default_intent = config.get('default', 'Background')

    for category in ['Conversational Real-time', 'Interactive Workflows',
                     'Interactive Entertainment', 'Buffered Consumption', 'Background']:
        if category in config:
            for app_name in config[category]:
                intent_map[app_name] = category

    return intent_map, default_intent



class MetricsCollector(threading.Thread):
    """Background thread that measures network metrics every ~2 seconds."""

    DEFAULT_SPEED_TEST_URL = "https://speed.cloudflare.com/__down?bytes=10000000"
    ROLLING_WINDOW = 30  # Number of pings to keep for jitter/loss calculation
    PING_TARGET = "1.1.1.1"  # Cloudflare anycast — measures real internet latency

    def __init__(self, interface: str,
                 throughput_mode: str = "passive", speed_test_url: str = None):
        super().__init__(daemon=True)
        self.interface = interface
        self.throughput_mode = throughput_mode
        self.speed_test_url = speed_test_url or self.DEFAULT_SPEED_TEST_URL
        self._stop_event = threading.Event()
        self._rtt_history = deque(maxlen=self.ROLLING_WINDOW)
        self._last_bytes = None
        self._last_time = None

    def stop(self):
        """Signal the thread to stop."""
        self._stop_event.set()

    def _ping_host(self) -> float | None:
        """Ping PING_TARGET using scapy ICMP and return RTT in ms, or None on failure."""
        try:
            from scapy.all import IP, ICMP, sr1
            start = time.time()
            reply = sr1(IP(dst=self.PING_TARGET) / ICMP(), timeout=1, verbose=0)
            if reply:
                return (time.time() - start) * 1000
        except Exception as e:
            log(f"Ping failed: {e}")
        return None

    def _calculate_jitter(self) -> float:
        """Calculate jitter as mean absolute deviation of consecutive RTTs."""
        rtts = [r for r in self._rtt_history if r is not None]
        if len(rtts) < 2:
            return 0.0
        diffs = [abs(rtts[i] - rtts[i - 1]) for i in range(1, len(rtts))]
        return sum(diffs) / len(diffs)

    def _calculate_packet_loss(self) -> float:
        """Calculate packet loss percentage from rolling window."""
        if not self._rtt_history:
            return 0.0
        failed = sum(1 for r in self._rtt_history if r is None)
        return (failed / len(self._rtt_history)) * 100

    def _measure_passive_throughput(self) -> float:
        """Measure throughput using psutil bytes delta."""
        try:
            import psutil
            counters = psutil.net_io_counters(pernic=True)
            if self.interface not in counters:
                return 0.0

            current_bytes = counters[self.interface].bytes_recv + counters[self.interface].bytes_sent
            current_time = time.time()

            if self._last_bytes is None:
                self._last_bytes = current_bytes
                self._last_time = current_time
                return 0.0

            delta_bytes = current_bytes - self._last_bytes
            delta_time = current_time - self._last_time

            self._last_bytes = current_bytes
            self._last_time = current_time

            if delta_time > 0:
                # Convert bytes/sec to Mbps
                return (delta_bytes * 8) / (delta_time * 1_000_000)
            return 0.0
        except Exception as e:
            log(f"Passive throughput measurement failed: {e}")
            return 0.0

    def _measure_active_throughput(self) -> float:
        """Measure throughput via HTTP download from speed test URL."""
        try:
            import urllib.request
            req = urllib.request.Request(self.speed_test_url, headers={
                "User-Agent": "dream-catcher-tui/1.0",
            })
            start = time.time()
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read()
            elapsed = time.time() - start
            if elapsed > 0:
                # Convert bytes/sec to Mbps
                return (len(data) * 8) / (elapsed * 1_000_000)
        except Exception as e:
            log(f"Active throughput measurement failed: {e}")
        return 0.0

    def run(self):
        """Main loop: measure metrics every ~2 seconds."""
        log(f"MetricsCollector started (ping={self.PING_TARGET}, mode={self.throughput_mode})")

        while not self._stop_event.is_set():
            try:
                # Measure latency
                rtt = self._ping_host()
                self._rtt_history.append(rtt)

                # Calculate metrics
                latency = rtt if rtt is not None else 0.0
                jitter = self._calculate_jitter()
                packet_loss = self._calculate_packet_loss()

                # Measure throughput based on mode
                if self.throughput_mode == "active":
                    throughput = self._measure_active_throughput()
                else:
                    throughput = self._measure_passive_throughput()

                # Emit metrics event
                emit("metrics", {
                    "latencyMs": round(latency, 2),
                    "jitterMs": round(jitter, 2),
                    "packetLossPct": round(packet_loss, 2),
                    "throughputMbps": round(throughput, 2),
                })

            except Exception as e:
                log(f"MetricsCollector error: {e}")

            # Sleep for ~2 seconds (check stop event periodically)
            self._stop_event.wait(2.0)

        log("MetricsCollector stopped")


def _do_manual_force(target_wan: str):
    """
    Execute a manual WAN force from the command reader thread.
    Emits switch + status events just like the auto-switch path.
    """
    with _state_lock:
        currently_on_wan2 = _shared['on_wan2']

    is_to_wan2 = (target_wan == 'wan2')

    if is_to_wan2 == currently_on_wan2:
        log(f"Manual force to {target_wan}: already on that WAN, skipping")
        return

    current_wan = 'wan2' if currently_on_wan2 else 'wan1'
    emit("status", {"activeWan": current_wan, "phase": "switching"})

    start = time.time()
    if is_to_wan2:
        success = switch_to_wan2()
    else:
        success = switch_to_wan1()
    duration_ms = int((time.time() - start) * 1000)

    action = "switch_to_wan2" if is_to_wan2 else "switch_to_wan1"
    emit("switch", {
        "action": action,
        "success": success,
        "reason": "Manual override",
        "trigger": "Manual",
        "durationMs": duration_ms,
    })

    if success:
        with _state_lock:
            _shared['on_wan2'] = is_to_wan2
            # Reset cooldown timer so auto-switch doesn't immediately revert
            _shared['last_realtime_seen'] = time.time() if is_to_wan2 else 0.0
        new_phase = "active" if is_to_wan2 else "idle"
        emit("status", {"activeWan": target_wan, "phase": new_phase})
    else:
        emit("status", {"activeWan": current_wan, "phase": "idle"})


class StdinCommandReader(threading.Thread):
    """
    Reads JSON commands from stdin in a background thread.
    Commands:
      {"cmd": "force_wan1"}              — manually force switch to WAN1
      {"cmd": "force_wan2"}              — manually force switch to WAN2
      {"cmd": "set_auto", "enabled": bool} — enable/disable auto-switching
    """

    def __init__(self):
        super().__init__(daemon=True)

    def run(self):
        log("StdinCommandReader started")
        for raw in sys.stdin:
            line = raw.strip()
            if not line:
                continue
            try:
                cmd = json.loads(line)
            except json.JSONDecodeError:
                log(f"StdinCommandReader: invalid JSON: {line!r}")
                continue

            command = cmd.get('cmd')
            log(f"StdinCommandReader: received cmd={command!r}")

            if command == 'force_wan1':
                _do_manual_force('wan1')
            elif command == 'force_wan2':
                _do_manual_force('wan2')
            elif command == 'set_auto':
                enabled = bool(cmd.get('enabled', True))
                with _state_lock:
                    _shared['auto_enabled'] = enabled
                log(f"Auto-switch {'enabled' if enabled else 'disabled'}")
            else:
                log(f"StdinCommandReader: unknown command {command!r}")

        log("StdinCommandReader: stdin closed")


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="NDJSON Bridge: Streams flow detections and network metrics"
    )
    parser.add_argument(
        "interface",
        nargs="?",
        default="ens19",
        help="Network interface to capture on (default: ens19)"
    )
    parser.add_argument(
        "--throughput-mode",
        choices=["passive", "active"],
        default="passive",
        help="Throughput measurement mode (default: passive)"
    )
    parser.add_argument(
        "--speed-test-url",
        default=None,
        help="URL for active throughput test (default: Cloudflare speed test)"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    interface = args.interface

    log(f"NDJSON bridge starting on interface: {interface}")
    log(f"Cooldown: {COOLDOWN_SECONDS}s | Trigger: {INTENT_CATEGORY}")
    log(f"Throughput mode: {args.throughput_mode}")

    intent_map, default_intent = load_intent_mapping()
    log(f"Loaded {len(intent_map)} application mappings")

    global _ml_classifier
    _ml_classifier = load_ml_classifier()

    # Emit initial status
    emit("status", {
        "activeWan": "wan1",
        "phase": "idle",
        "interface": interface,
        "mappings": len(intent_map),
    })

    # Start metrics collector thread
    metrics_collector = MetricsCollector(
        interface=interface,
        throughput_mode=args.throughput_mode,
        speed_test_url=args.speed_test_url,
    )
    metrics_collector.start()

    streamer = NFStreamer(
        source=interface,
        n_dissections=20,
        statistical_analysis=True,
        idle_timeout=2,
        active_timeout=10,
    )

    # StdinCommandReader is started after NFStreamer begins iterating (i.e., after it has
    # forked its meter worker processes via multiprocessing.get_context("fork")).
    # Starting it before the fork causes fork()+thread unsafety that silently prevents
    # the meter workers from initialising, so no flows are ever captured.
    cmd_reader = StdinCommandReader()

    try:
        for flow in streamer:
            if not cmd_reader.is_alive():
                cmd_reader.start()

            if flow.protocol in SKIP_PROTOCOLS:
                continue

            app = flow.application_name
            now = time.time()

            # --- nDPI classification ---
            nfstream_mapped = app in intent_map
            nfstream_intent = intent_map.get(app, default_intent)

            # --- ML classification (always, for comparison) ---
            ml_intent = None
            ml_confidence = None
            if _ml_classifier is not None:
                try:
                    ml_intent, ml_confidence = _ml_classifier.classify(flow)
                    ml_confidence = round(ml_confidence, 4)
                except Exception as e:
                    log(f"ML classify error: {e}")

            # --- Primary intent: nDPI when mapped, ML fallback for unknown ---
            if nfstream_mapped:
                intent = nfstream_intent
                classified_by = "nDPI"
            elif ml_intent is not None:
                intent = ml_intent
                classified_by = "ML"
            else:
                intent = default_intent
                classified_by = "default"

            # Emit flow event
            emit("flow", {
                "srcIp": flow.src_ip,
                "srcPort": flow.src_port,
                "dstIp": flow.dst_ip,
                "dstPort": flow.dst_port,
                "app": app,
                "intent": intent,
                "classifiedBy": classified_by,
                "nfstreamIntent": nfstream_intent,
                "mlIntent": ml_intent,
                "mlConfidence": ml_confidence,
                "packets": flow.bidirectional_packets,
                "bytes": flow.bidirectional_bytes,
            })

            # Auto-switch logic — skipped entirely when auto_enabled is False
            with _state_lock:
                auto_enabled = _shared['auto_enabled']
                on_wan2 = _shared['on_wan2']
                last_realtime_seen = _shared['last_realtime_seen']

            if not auto_enabled:
                continue

            if intent == INTENT_CATEGORY:
                with _state_lock:
                    _shared['last_realtime_seen'] = now
                if not on_wan2:
                    log(f"Conversational Real-time detected ({app}) - switching to WAN2")
                    emit("status", {"activeWan": "wan1", "phase": "switching"})

                    start = time.time()
                    success = switch_to_wan2()
                    duration_ms = int((time.time() - start) * 1000)

                    emit("switch", {
                        "action": "switch_to_wan2",
                        "success": success,
                        "reason": "Conversational Real-time detected",
                        "trigger": app,
                        "durationMs": duration_ms,
                    })

                    if success:
                        with _state_lock:
                            _shared['on_wan2'] = True
                        emit("status", {"activeWan": "wan2", "phase": "active"})
                    else:
                        emit("status", {"activeWan": "wan1", "phase": "idle"})

            elif on_wan2 and (now - last_realtime_seen) > COOLDOWN_SECONDS:
                log(f"No {INTENT_CATEGORY} for {COOLDOWN_SECONDS}s - switching back to WAN1")
                emit("status", {"activeWan": "wan2", "phase": "reverting"})

                start = time.time()
                success = switch_to_wan1()
                duration_ms = int((time.time() - start) * 1000)

                emit("switch", {
                    "action": "switch_to_wan1",
                    "success": success,
                    "reason": f"No Conversational Real-time for {COOLDOWN_SECONDS}s",
                    "trigger": None,
                    "durationMs": duration_ms,
                })

                if success:
                    with _state_lock:
                        _shared['on_wan2'] = False
                    emit("status", {"activeWan": "wan1", "phase": "idle"})

    except KeyboardInterrupt:
        log("Bridge stopped by user")
        metrics_collector.stop()
        with _state_lock:
            on_wan2 = _shared['on_wan2']
        if on_wan2:
            log("Switching back to WAN1 before exit...")
            switch_to_wan1()
            emit("status", {"activeWan": "wan1", "phase": "idle"})
    except Exception as e:
        log(f"ERROR: {e}")
        metrics_collector.stop()
        with _state_lock:
            on_wan2 = _shared['on_wan2']
        emit("status", {"activeWan": "wan1" if not on_wan2 else "wan2", "phase": "idle"})
        if on_wan2:
            log("Switching back to WAN1 due to error...")
            switch_to_wan1()
        sys.exit(1)


if __name__ == "__main__":
    main()
