#!/bin/bash
# PRASCO Network Mode Monitor
# Continuously monitors database for mode changes and applies them

LOG_FILE="/var/log/prasco-mode-monitor.log"
STATE_FILE="/var/run/prasco-mode.state"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create state file if it doesn't exist
if [ ! -f "$STATE_FILE" ]; then
    echo "normal" > "$STATE_FILE"
fi

LAST_MODE=$(cat "$STATE_FILE")

while true; do
    # Get current mode from database
    CURRENT_MODE=$(sudo -u postgres psql -d prasco -t -c "SELECT value FROM settings WHERE key='system.networkMode';" 2>/dev/null | xargs)
    
    if [ -z "$CURRENT_MODE" ]; then
        CURRENT_MODE="normal"
    fi
    
    # Check if mode has changed
    if [ "$CURRENT_MODE" != "$LAST_MODE" ]; then
        log "Mode changed from '$LAST_MODE' to '$CURRENT_MODE'"
        
        if [ "$CURRENT_MODE" = "hotspot" ]; then
            log "Activating hotspot mode..."
            
            # Enable and start hotspot
            systemctl enable prasco-hotspot.service 2>&1 | tee -a "$LOG_FILE"
            systemctl start prasco-hotspot.service 2>&1 | tee -a "$LOG_FILE"
            
            log "Hotspot mode activated"
            
        elif [ "$CURRENT_MODE" = "normal" ]; then
            log "Activating normal mode..."
            
            # Stop and disable hotspot
            systemctl stop prasco-hotspot.service 2>&1 | tee -a "$LOG_FILE"
            systemctl disable prasco-hotspot.service 2>&1 | tee -a "$LOG_FILE"
            
            # Remove unmanaged configuration if it exists
            if [ -f "/etc/NetworkManager/conf.d/unmanage-wlan0.conf" ]; then
                log "Removing unmanage configuration..."
                rm /etc/NetworkManager/conf.d/unmanage-wlan0.conf
            fi
            
            # Restart NetworkManager
            log "Restarting NetworkManager..."
            systemctl restart NetworkManager 2>&1 | tee -a "$LOG_FILE"
            
            log "Normal mode activated"
        fi
        
        # Update state file and local variable
        echo "$CURRENT_MODE" > "$STATE_FILE"
        LAST_MODE="$CURRENT_MODE"
