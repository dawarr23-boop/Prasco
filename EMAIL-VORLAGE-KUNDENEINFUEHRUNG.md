# E-Mail-Vorlage: PRASCO Digital Signage – Kundeneinführung

---

**An:** [Empfänger E-Mail]
**Betreff:** PRASCO Digital Signage – Zugang, Bedienung & Android TV Client

---

Guten Tag [Anrede / Name],

im Folgenden erhalten Sie alle Informationen zum Zugriff und zur Nutzung des digitalen Anzeigesystems **PRASCO Digital Signage**, einschließlich der nativen Android TV App.

---

## Was ist das System?

PRASCO Digital Signage ist eine webbasierte Lösung zur Verwaltung und Anzeige von Inhalten auf digitalen Bildschirmen. Über ein zentrales Admin-Panel pflegen Sie Beiträge, die automatisch auf einem oder mehreren Displays im Haus angezeigt werden. Beiträge können Texte, Bilder, Videos, PDFs oder PowerPoint-Präsentationen sein und per Zeitsteuerung automatisch ein- und ausgeblendet werden.

---

## Zugang – Admin-Panel

Das Admin-Panel ist über jeden handelsüblichen Browser erreichbar (Chrome, Edge, Firefox):

> **https://prasco.zapto.org/admin**

| Feld | Wert |
|------|------|
| Benutzername | [E-Mail-Adresse] |
| Passwort | [Initiales Passwort] |

Wir empfehlen, das Passwort nach dem ersten Login unter dem Benutzer-Symbol oben rechts zu ändern.

---

## Beiträge erstellen

1. Im Admin-Panel links auf **Beiträge** klicken
2. **+ Neuer Beitrag** wählen
3. Titel, Typ (Text / Bild / Video / PDF / PowerPoint) und Inhalt eingeben
4. Optional: Anzeigedauer, Zeitraum (Start-/Enddatum) und Ziel-Display festlegen
5. **Beitrag speichern** – der Beitrag erscheint umgehend auf dem Display

---

## Option 1 – Display im Browser (PC / Tablet)

Die Anzeige kann direkt im Browser geöffnet werden:

> **https://prasco.zapto.org/display/display01**

Drücken Sie **F11** für den Vollbildmodus. Die Anzeige aktualisiert sich vollautomatisch.

---

## Option 2 – Android TV Client App (empfohlen für Fernseher)

Für Android-TV-Geräte und TV-Sticks (z. B. Amazon Fire TV, Chromecast mit Google TV, NVIDIA Shield) steht eine native **Android TV App** zur Verfügung. Diese startet automatisch beim Einschalten des Geräts, läuft im echten Vollbild-Kiosk-Modus und ist für 4K-Displays optimiert.

### Installation

1. Die APK-Datei (`prasco-tv.apk`) ist dieser E-Mail beigefügt.
2. Auf dem Android TV Gerät unter **Einstellungen → Sicherheit** die Option „Unbekannte Quellen" aktivieren.
3. Die APK per USB-Stick oder über den Dateimanager auf das Gerät übertragen und installieren.
4. Alternativ per ADB (für IT-Administratoren):
   ```
   adb connect <TV-IP-Adresse>
   adb install prasco-tv.apk
   ```
5. Die App erscheint danach im TV-Launcher unter dem Namen **PRASCO Display TV**.

### Einmalige Konfiguration nach Installation

Beim ersten Start muss einmalig die Server-Adresse hinterlegt werden. Geben Sie in der App folgende URL ein:

> **https://prasco.zapto.org/display/display01**

Die App merkt sich diese Einstellung dauerhaft. Ab da startet auf dem Fernseher automatisch die zugehörige Anzeige.

### Voraussetzungen

- Android TV oder Google TV ab Android 5.0
- Internetzugang am TV-Gerät
- Kompatible Geräte: Fire TV Stick 4K, NVIDIA Shield, Chromecast mit Google TV oder jedes Android TV Gerät

---

## Live-Daten (ÖPNV / Wetter / Verkehr)

Das System zeigt in einstellbaren Abständen automatisch aktuelle Live-Informationen an – ÖPNV-Abfahrten, Wetterdaten und Verkehrsmeldungen für Autobahnen. Die Konfiguration erfolgt im Admin-Panel unter **Live-Daten**.

---

## Wichtige Hinweise

- Die Verbindung ist SSL-verschlüsselt (HTTPS) und von außen über das Internet erreichbar.
- Der Server läuft permanent und benötigt keinen manuellen Start.
- Änderungen im Admin-Panel werden innerhalb weniger Sekunden auf dem Display sichtbar.
- Für technische Fragen oder Zugangsprobleme stehen wir gerne zur Verfügung.

---

Mit freundlichen Grüßen

**Christian Pöser**
IT Westfalen
kontakt@it-westfalen.de

---

*Hinweise zur Vorlage:*
- `[Anrede / Name]` → durch den Namen des Empfängers ersetzen
- `[E-Mail-Adresse]` → durch die Login-E-Mail ersetzen
- `[Initiales Passwort]` → durch das vergebene Passwort ersetzen
- `display01` → ggf. durch den tatsächlichen Display-Identifier ersetzen
- APK-Datei als Anhang beifügen
