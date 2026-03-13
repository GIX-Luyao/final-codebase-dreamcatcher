import { spawn, ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { BridgeEvent } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PythonBridgeOptions {
  interface: string;
  pythonPath?: string;
  throughputMode?: 'passive' | 'active';
}

export type BridgeEventHandler = (event: BridgeEvent) => void;
export type BridgeLogHandler = (message: string) => void;
export type BridgeCloseHandler = (code: number | null) => void;

export class PythonBridge {
  private proc: ChildProcess | null = null;
  private onEvent: BridgeEventHandler | null = null;
  private onLog: BridgeLogHandler | null = null;
  private onClose: BridgeCloseHandler | null = null;

  setEventHandler(handler: BridgeEventHandler) { this.onEvent = handler; }
  setLogHandler(handler: BridgeLogHandler) { this.onLog = handler; }
  setCloseHandler(handler: BridgeCloseHandler) { this.onClose = handler; }

  /** Send a JSON command to the bridge's stdin. Returns false if bridge isn't running. */
  sendCommand(cmd: Record<string, unknown>): boolean {
    if (!this.proc?.stdin?.writable) return false;
    try {
      this.proc.stdin.write(JSON.stringify(cmd) + '\n');
      return true;
    } catch {
      return false;
    }
  }

  start(options: PythonBridgeOptions) {
    const scriptPath = join(__dirname, '..', '..', 'bridge', 'ndjson_bridge.py');
    const pythonPath = options.pythonPath || 'python3';

    const args = [scriptPath, options.interface];
    if (options.throughputMode) {
      args.push('--throughput-mode', options.throughputMode);
    }

    this.proc = spawn(pythonPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse NDJSON from stdout
    if (this.proc.stdout) {
      const rl = createInterface({ input: this.proc.stdout });
      rl.on('line', (line) => {
        try {
          const event = JSON.parse(line) as BridgeEvent;
          this.onEvent?.(event);
        } catch {
          // Malformed line, skip
        }
      });
    }

    // Forward stderr for debugging
    if (this.proc.stderr) {
      const rl = createInterface({ input: this.proc.stderr });
      rl.on('line', (line) => {
        this.onLog?.(line);
      });
    }

    this.proc.on('close', (code) => {
      this.onClose?.(code);
    });

    this.proc.on('error', (err) => {
      this.onLog?.(`Bridge process error: ${err.message}`);
    });
  }

  stop() {
    if (this.proc) {
      this.proc.kill('SIGTERM');
      this.proc = null;
    }
  }

  get running(): boolean {
    return this.proc !== null && this.proc.exitCode === null;
  }
}
