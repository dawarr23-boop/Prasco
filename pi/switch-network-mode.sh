#!/bin/bash
# PRASCO Network Mode Switcher
# Reads system.networkMode from database and activates/deactivates hotspot accordingly

LOG_FILE="/var/log/prasco-mode-switch.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get current mode from database
CURRENT_MODE=$(sudo -u postgres psql -d prasco -t -c "SELECT value FROM settings WHERE key='system.networkMode';" | xargs)

log "Checking network mode: $CURRENT_MODE"

if [ "$CURRENT_MODE" = "hotspot" ]; then
    log "Hotspot mode requested"
    
    # Check if hotspot is already running
    if systemctl is-active --quiet prasco-hotspot.service; then
        log "Hotspot already running"
    else
        log "Starting hotspot..."
        sudo systemctl enable prasco-hotspot.service
        sudo systemctl start prasco-hotspot.service
        log "Hotspot started successfully"
    fi
    
elif [ "$CURRENT_MODE" = "normal" ]; then
    log "Normal mode requested"
    
    # Check if hotspot is running
    if systemctl is-active --quiet prasco-hotspot.service; then
        log "Stopping hotspot..."
        sudo systemctl stop prasco-hotspot.service
        sudo systemctl disable prasco-hotspot.service
        
        # Remove unmanaged configuration
        if [ -f "/etc/NetworkManager/conf.d/unmanage-wlan0.conf" ]; then
            log "Removing unmanage configuration..."
            sudo rm /etc/NetworkManager/conf.d/unmanage-wlan0.conf
        fi
        
        # Restart NetworkManager to reconnect to known networks
        log "Restarting NetworkManager..."
        sudo systemctl restart NetworkManager
        
        log "Normal mode activated, reconnecting to known networks..."
    else
        log "Already in normal mode"
    fi
else
    log "ERROR: Unknown mode '$CURRENT_MODE'"
    exit 1
fi

log "Mode switch completed"
