.PHONY: help hotspot status health restart disable service bootmenu mode bootprogress

# Default target
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  PRASCO Raspberry Pi Management"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Verfügbare Befehle:"
	@echo ""
	@echo "  make hotspot      - WiFi Hotspot einrichten"
	@echo "  make status       - Hotspot Status anzeigen"
	@echo "  make health       - System Health Check"
	@echo "  make restart      - Hotspot Services neu starten"
	@echo "  make disable      - Hotspot deaktivieren"
	@echo "  make service      - PRASCO als systemd Service einrichten"
	@echo ""
	@echo "  make bootmenu     - Boot-Menü installieren"
	@echo "  make bootprogress - Boot-Fortschrittsbalken installieren"
	@echo "  make mode         - Boot-Modus wechseln"
	@echo ""
	@echo "  make install      - Vollständige Installation (Hotspot + Service + Boot-Menü + Progress)"
	@echo "  make update       - PRASCO aktualisieren"
	@echo ""

# WiFi Hotspot einrichten
hotspot:
	@echo "➜ Richte WiFi Hotspot ein..."
	sudo ./scripts/setup-hotspot.sh

# Status anzeigen
status:
	@./scripts/hotspot-status.sh

# Health Check
health:
	@./scripts/health-check.sh

# Services neu starten
restart:
	@echo "➜ Starte Hotspot-Services neu..."
	sudo ./scripts/hotspot-restart.sh

# Hotspot deaktivieren
disable:
	@echo "➜ Deaktiviere Hotspot..."
	sudo ./scripts/hotspot-disable.sh

# systemd Service einrichten
service:
	@echo "➜ Richte systemd Service ein..."
	sudo ./scripts/install-service.sh

# Boot-Menü installieren
bootmenu:
	@echo "➜ Installiere Boot-Menü..."
	sudo ./scripts/setup-boot-menu.sh
Fortschrittsbalken installieren
bootprogress:
	@echo "➜ Installiere Boot-Fortschrittsbalken..."
	sudo ./scripts/install-boot-progress.sh

# Boot-Modus wechseln
mode:
	@sudo prasco-mode 2>/dev/null || sudo ./scripts/boot-mode-selector.sh

# Vollständige Installation
install: hotspot service bootmenu bootprogress
	@echo ""
	@echo "✓ Installation abgeschlossen!"
	@echo ""
	@echo "Nächste Schritte:"
	@echo "  1. sudo reboot"
	@echo "  2. Beim Boot: Wähle Modus im Boot-Menü"
	@echo "  3. Boot-Fortschritt wird angezeigt"
	@echo "  4. Verbinde mit WiFi: PRASCO-Display (falls Hotspot-Modus)"
	@echo "  5. Verbinde mit WiFi: PRASCO-Display (falls Hotspot-Modus)"
	@echo "  4. Öffne Browser: http://192.168.4.1:3000 (Hotspot) oder lokale IP"
	@echo ""

# PRASCO aktualisieren
update:
	@echo "➜ Aktualisiere PRASCO..."
	git pull origin main
	npm install
	@echo "✓ Update abgeschlossen!"
	@echo "Neustart mit: sudo systemctl restart prasco"
