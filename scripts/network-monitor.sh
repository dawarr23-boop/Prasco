#!/bin/bash
# PRASCO Network Monitor - Auto-failover to Hotspot Mode
# Switches to hotspot mode if no network connection for 5 minutes

LOG_FILE="/var/log/prasco-network-monitor.log"
CHECK_INTERVAL=30  # Check every 30 seconds
FAIL_THRESHOLD=10  # 10 failures = 5 minutes (10 * 30s)
MODE_FILE="/etc/prasco/boot-mode"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

fail_count=0
last_mode=""

log "Network monitor started"

while true; do
    # Read current mode
    current_mode=$(cat "$MODE_FILE" 2>/dev/null || echo "normal")
    
    # Only monitor in normal mode
    if [ "$current_mode" = "normal" ]; then
        # Check internet connectivity (ping Google DNS)
        if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1 || ping -c 1 -W 2 1.1.1.1 >/dev/null 2>&1; then
            # Connection successful
            if [ $fail_count -gt 0 ]; then
                log "✅ Connection restored after $fail_count failed checks"
                fail_count=0
            fi
        else
            # Connection failed
            fail_count=$((fail_count + 1))
            log "⚠️  No connection detected (failure $fail_count/$FAIL_THRESHOLD)"
            
            # Check if threshold reached
            if [ $fail_count -ge $FAIL_THRESHOLD ]; then
                log "🔄 FAILOVER: No connection for 5 minutes, switching to hotspot mode..."
                
                # Update mode file
                echo "hotspot" | sudo tee "$MODE_FILE" > /dev/null
                
                # Update database
                sudo -u postgres psql -d prasco -c "INSERT INTO settings (key, value, type, category, created_at, updated_at) VALUES ('system.networkMode', 'hotspot', 'string', 'system', NOW(), NOW()) ON CONFLICT (key) DO UPDATE SET value = 'hotspot', updated_at = NOW();" 2>&1 | tee -a "$LOG_FILE"
                
                # Configure static IP for wlan0
                if ! grep -q "interface wlan0" /etc/dhcpcd.conf; then
                    log "Configuring static IP for wlan0..."
                    sudo tee -a /etc/dhcpcd.conf > /dev/null << 'DHCP'

interface wlan0
static ip_address=192.168.4.1/24
nohook wpa_supplicant
DHCP
                    sudo systemctl restart dhcpcd
                fi
                
                # Start hotspot services
                log "Starting hotspot services..."
                sudo systemctl enable hostapd dnsmasq
                sudo systemctl start hostapd dnsmasq
                
                log "✅ Hotspot mode activated (SSID: PRASCO-Display, IP: 192.168.4.1)"
                log "   Users can now connect to configure network settings"
                
                # Reset counter
                fail_count=0
            fi
        fi
    else
        # In hotspot mode, reset counter
        if [ $fail_count -gt 0 ]; then
            fail_count=0
        fi
    fi
    
    # Store current mode for change detection
    last_mode="$current_mode"
    
    # Wait before next check
    sleep $CHECK_INTERVAL
done
