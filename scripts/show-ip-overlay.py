#!/usr/bin/env python3
"""
IP Address Overlay für Raspberry Pi Desktop
Zeigt IP-Adresse oben rechts bis Chromium Kiosk-Modus startet
"""
import tkinter as tk
import socket
import subprocess
import time
import psutil
import threading

def get_ip_address():
    """Ermittle aktuelle IP-Adresse"""
    try:
        # Versuche Standard-Gateway-Route zu finden
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "Keine Verbindung"

def check_chromium_running():
    """Prüfe ob Chromium im Kiosk-Modus läuft"""
    try:
        for proc in psutil.process_iter(['name', 'cmdline']):
            if proc.info['name'] == 'chromium' or proc.info['name'] == 'chromium-browser':
                cmdline = ' '.join(proc.info['cmdline'] or [])
                if '--kiosk' in cmdline:
                    return True
        return False
    except Exception:
        return False

class IPOverlay:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("IP Address")
        
        # Fenster-Eigenschaften
        self.root.attributes('-topmost', True)  # Immer im Vordergrund
        self.root.overrideredirect(True)  # Keine Fenster-Dekoration
        
        # Transparenter Hintergrund
        self.root.attributes('-alpha', 0.9)
        self.root.configure(bg='black')
        
        # Position oben rechts
        screen_width = self.root.winfo_screenwidth()
        window_width = 300
        window_height = 80
        x_position = screen_width - window_width - 10
        y_position = 10
        
        self.root.geometry(f'{window_width}x{window_height}+{x_position}+{y_position}')
        
        # IP-Label
        self.ip_label = tk.Label(
            self.root,
            text="",
            font=('Arial', 16, 'bold'),
            bg='black',
            fg='#00ff00',
            pady=10,
            padx=15
        )
        self.ip_label.pack(expand=True, fill='both')
        
        # Status-Label
        self.status_label = tk.Label(
            self.root,
            text="Warte auf Kiosk-Modus...",
            font=('Arial', 10),
            bg='black',
            fg='#888888',
            pady=5
        )
        self.status_label.pack()
        
        # Starte Update-Loop
        self.running = True
        self.update_ip()
        self.check_chromium()
        
    def update_ip(self):
        """Aktualisiere IP-Adresse alle 5 Sekunden"""
        if not self.running:
            return
            
        ip = get_ip_address()
        self.ip_label.config(text=f"IP: {ip}")
        
        self.root.after(5000, self.update_ip)
    
    def check_chromium(self):
        """Prüfe alle 2 Sekunden ob Chromium läuft"""
        if not self.running:
            return
            
        if check_chromium_running():
            self.status_label.config(text="Kiosk-Modus gestartet", fg='#00ff00')
            # Warte 3 Sekunden und schließe dann
            self.root.after(3000, self.close)
        else:
            self.root.after(2000, self.check_chromium)
    
    def close(self):
        """Schließe Overlay"""
        self.running = False
        self.root.quit()
        self.root.destroy()
    
    def run(self):
        """Starte Haupt-Loop"""
        self.root.mainloop()

if __name__ == '__main__':
    overlay = IPOverlay()
    overlay.run()
