# WAN1 Traffic Shaping (pfSense / dummynet)

Artificially degrades WAN1 (`vtnet1`) to demonstrate quality difference vs WAN2.
pfSense is FreeBSD-based and uses `dummynet` via `ipfw` — set this once and leave it.
The rule is interface-specific (`vtnet1` only) and becomes dormant when WAN1 is toggled out.

---

## Apply Degradation (SSH into pfSense)

```bash
# Configure the pipe: 150ms delay, 20ms jitter, 8 Mbit/s cap, 5% packet loss
ipfw pipe 1 config delay 1500ms bw 2Mbit/s plr 0.20

# Attach the pipe to all traffic on WAN1
ipfw add 1000 pipe 1 ip from any to any via vtnet1
```

That's it. The rule persists until you remove it or reboot pfSense.

---

## Remove Degradation

```bash
ipfw delete 1000
ipfw pipe 1 delete
```

---

## Check Current Rules

```bash
# List active firewall rules
ipfw list

# List pipe configurations
ipfw pipe list
```

---

## Adjust Parameters

Edit the pipe without removing it:

```bash
# Example: increase latency and packet loss for a more dramatic demo
ipfw pipe 1 config delay 200ms bw 5Mbit/s plr 0.08
```

Changes take effect immediately — no need to re-add the rule.

---

## Survive Reboots (Optional)

By default `ipfw` rules are lost on reboot. To persist them:

1. **System → Package Manager** → install `shellcmd`
2. **Services → Shellcmd** → add two entries with type `earlyshellcmd`:
   ```
   ipfw pipe 1 config delay 150ms bw 8Mbit/s plr 0.05
   ipfw add 1000 pipe 1 ip from any to any via vtnet1
   ```

---

## Demo Reference Values

| Parameter    | WAN1 (degraded) | WAN2 (clean) |
|--------------|-----------------|--------------|
| Bandwidth    | 8 Mbit/s        | Full speed   |
| Latency      | 150ms ± 20ms    | ~5ms         |
| Packet loss  | 5%              | 0%           |

---

## Notes

- The rule is **interface-scoped** (`via vtnet1`) — WAN2 is completely unaffected.
- When toggled to WAN2, WAN1 is removed from the gateway group and carries no LAN traffic,
  so the pipe sits idle. **No need to remove the rule when toggling.**
- To verify degradation is working, run a speed/ping test while WAN1 is active.
