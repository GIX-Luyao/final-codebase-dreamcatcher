#!/usr/bin/env python3
"""
WAN Exclusive Toggle Script (v2)
Switches active WAN by making the gateway group single-member —
only the selected WAN is in the group, so there is literally no
failover path. Quality comparisons between WAN1 and WAN2 are honest.

API Reference: https://pfrest.org/
"""

import requests
import requests.packages.urllib3
import sys
import time
import socket
from typing import Optional

# pfSense uses a self-signed certificate; suppress the resulting warnings
requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)

# Output stream — defaults to stdout for standalone use.
# The bridge sets this to sys.stderr so output appears in the TUI debug panel
# without polluting the NDJSON stream.
_out = sys.stdout


def _print(*args, **kwargs):
    kwargs.setdefault('file', _out)
    print(*args, **kwargs)  # intentional: calls built-in print, not _print

# =============================================================================
# Configuration
# =============================================================================

API_BASE_URL = "https://192.168.2.1/api/v2"  # Replace with your pfSense IP
API_KEY = "YOUR_PFSENSE_API_KEY"              # Replace with your pfSense API key

# Gateway Group name (System → Routing → Gateway Groups)
GATEWAY_GROUP_NAME = "WAN_FAILOVER"

# IPv4 Gateway names (check System → Routing → Gateways for exact names)
WAN1_GATEWAY_NAME = "WAN1_DHCP"
WAN2_GATEWAY_NAME = "WAN2_DHCP"

HEADERS = {
    "accept": "application/json",
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# =============================================================================
# API Functions
# =============================================================================

def get_gateway_groups() -> Optional[list]:
    """Get all gateway groups"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/routing/gateway/groups",
            headers=HEADERS,
            timeout=10,
            verify=False
        )
        response.raise_for_status()
        return response.json().get("data", [])
    except requests.exceptions.RequestException as e:
        _print(f"Error fetching gateway groups: {e}")
        return None


def get_gateway_group(group_name: str) -> Optional[dict]:
    """Find a specific gateway group by name"""
    groups = get_gateway_groups()
    if groups is None:
        return None

    for group in groups:
        if group.get("name") == group_name:
            return group

    _print(f"Gateway group '{group_name}' not found")
    _print(f"Available groups: {[g.get('name') for g in groups]}")
    return None


def set_group_single_member(group_name: str, active_wan: str) -> bool:
    """
    Update the gateway group to contain only the active WAN at Tier 1.
    The inactive WAN is removed from the group entirely — no failover possible.

    Args:
        group_name: The gateway group to update
        active_wan: The sole gateway to keep in the group

    Returns:
        True if successful, False otherwise
    """
    group = get_gateway_group(group_name)
    if group is None:
        return False

    group_id = group.get("id")
    current_priorities = group.get("priorities", [])
    _print(f"  - Current group members: {[p.get('gateway') for p in current_priorities]}")

    # Find the active WAN's existing entry to preserve its virtual_ip setting
    virtual_ip = "address"
    for p in current_priorities:
        if p.get("gateway") == active_wan:
            virtual_ip = p.get("virtual_ip", "address")
            break

    new_priorities = [{"gateway": active_wan, "tier": 1, "virtual_ip": virtual_ip}]
    _print(f"  - New group members: [{active_wan}] (sole member, tier 1)")

    try:
        response = requests.patch(
            f"{API_BASE_URL}/routing/gateway/group",
            headers=HEADERS,
            json={"id": group_id, "priorities": new_priorities},
            timeout=10,
            verify=False
        )
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        _print(f"Error updating gateway group: {e}")
        if hasattr(e, 'response') and e.response is not None:
            _print(f"Response: {e.response.text}")
        return False


def apply_routing_changes() -> bool:
    """Apply routing configuration changes"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/routing/apply",
            headers=HEADERS,
            json={},
            timeout=10,
            verify=False
        )
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        _print(f"Error applying routing changes: {e}")
        return False


# =============================================================================
# Connectivity Testing
# =============================================================================

def test_connectivity_and_show_ip() -> bool:
    """Test internet connectivity and display current public IP"""
    _print("\nTesting internet connectivity...")

    # Brief pause to allow routing to settle
    time.sleep(1)

    # Test DNS resolution
    try:
        socket.gethostbyname("www.google.com")
        _print("  ✓ DNS resolution working")
    except socket.gaierror:
        _print("  ✗ DNS resolution failed")
        return False

    # Get public IP address
    ip_services = [
        "https://api.ipify.org",
        "https://ifconfig.me/ip",
        "https://icanhazip.com",
    ]

    public_ip = None
    for service_url in ip_services:
        try:
            response = requests.get(service_url, timeout=5)
            if response.status_code == 200:
                public_ip = response.text.strip()
                break
        except requests.exceptions.RequestException:
            continue

    if public_ip:
        _print("  ✓ Internet connectivity confirmed")
        _print(f"\n📍 Current Public IP: {public_ip}")
        return True
    else:
        _print("  ✗ Could not retrieve public IP (connectivity may be limited)")
        return False


# =============================================================================
# WAN Switching Functions
# =============================================================================

def switch_exclusive_wan(active_wan: str, label: str) -> bool:
    """
    Switch to a WAN exclusively by making it the sole member of the gateway group.
    The other WAN is removed from the group — no failover path exists.

    Args:
        active_wan: Gateway name to activate
        label: Human-readable label for logging

    Returns:
        True if successful, False otherwise
    """
    _print(f"Switching to {label} exclusively...")

    if not set_group_single_member(GATEWAY_GROUP_NAME, active_wan):
        _print(f"\n❌ Failed to update gateway group")
        return False

    _print("  - Applying routing changes...")
    if not apply_routing_changes():
        return False

    _print(f"  ✓ {active_wan} is the sole member of '{GATEWAY_GROUP_NAME}'")
    return True


def switch_to_wan1() -> bool:
    """Activate WAN1 exclusively — remove WAN2 from the gateway group"""
    _print("=" * 60)
    _print("Activating WAN1 exclusively (WAN2 removed from group)")
    _print("=" * 60)

    success = switch_exclusive_wan(active_wan=WAN1_GATEWAY_NAME, label="WAN1")

    _print("\n" + "=" * 60)
    if success:
        _print("✓ WAN1 is now the sole active gateway")
        test_connectivity_and_show_ip()
    else:
        _print("✗ Failed to switch to WAN1")
    _print("=" * 60)

    return success


def switch_to_wan2() -> bool:
    """Activate WAN2 exclusively — remove WAN1 from the gateway group"""
    _print("=" * 60)
    _print("Activating WAN2 exclusively (WAN1 removed from group)")
    _print("=" * 60)

    success = switch_exclusive_wan(active_wan=WAN2_GATEWAY_NAME, label="WAN2")

    _print("\n" + "=" * 60)
    if success:
        _print("✓ WAN2 is now the sole active gateway")
        test_connectivity_and_show_ip()
    else:
        _print("✗ Failed to switch to WAN2")
    _print("=" * 60)

    return success


def show_status() -> bool:
    """Show which WAN is currently the sole member of the gateway group"""
    _print("Fetching gateway group status...\n")
    _print("=" * 60)

    group = get_gateway_group(GATEWAY_GROUP_NAME)
    if group is None:
        return False

    priorities = group.get("priorities", [])
    members = [p.get("gateway") for p in priorities]

    for wan in [WAN1_GATEWAY_NAME, WAN2_GATEWAY_NAME]:
        if wan in members:
            _print(f"  ✓ {wan}: ACTIVE (in group)")
        else:
            _print(f"  ✗ {wan}: INACTIVE (not in group)")

    _print("\n" + "=" * 60)
    _print("[Connectivity]")
    _print("=" * 60)
    test_connectivity_and_show_ip()

    return True


# =============================================================================
# Main
# =============================================================================

def print_usage():
    _print("Usage: python wan_toggle-v2.py [wan1|wan2|status]")
    _print("")
    _print("Commands:")
    _print("  wan1   - Activate WAN1 exclusively (removes WAN2 from gateway group)")
    _print("  wan2   - Activate WAN2 exclusively (removes WAN1 from gateway group)")
    _print("  status - Show which WAN is currently active in the gateway group")
    _print("")
    _print("Configuration:")
    _print(f"  Gateway Group: {GATEWAY_GROUP_NAME}")
    _print(f"  WAN1: {WAN1_GATEWAY_NAME}")
    _print(f"  WAN2: {WAN2_GATEWAY_NAME}")


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ["wan1", "wan2", "status"]:
        print_usage()
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "wan1":
        success = switch_to_wan1()
    elif command == "wan2":
        success = switch_to_wan2()
    elif command == "status":
        success = show_status()
    else:
        print_usage()
        sys.exit(1)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
