package net.prasco.display;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

/**
 * PRASCO Display - Android App
 * 
 * Hauptactivity für das digitale Schwarze Brett
 * Zeigt die PRASCO Display-Ansicht in einem WebView im Fullscreen-Modus
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;
    
    /**
     * PRASCO Server URL - Hier die eigene Server-URL eintragen!
     * 
     * Beispiele:
     * - Lokales Netzwerk: "http://192.168.1.100:3000"
     * - Hostname: "http://prasco.local:3000"
     * - Cloud-Server: "https://prasco.example.com"
     */
    private static final String SERVER_URL = "http://192.168.1.100:3000";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Fullscreen-Modus aktivieren und Display immer an
        setupFullscreenMode();
        
        // WebView erstellen und konfigurieren
        webView = new WebView(this);
        setContentView(webView);
        
        // WebView Clients konfigurieren
        webView.setWebViewClient(new PrascoWebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        
        // WebView Einstellungen
        setupWebViewSettings();
        
        // URL laden
        webView.loadUrl(SERVER_URL);
    }

    /**
     * Fullscreen-Modus konfigurieren
     */
    private void setupFullscreenMode() {
        // Display immer an
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Vollbild ohne System-UI
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    /**
     * WebView Einstellungen konfigurieren
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebViewSettings() {
        WebSettings webSettings = webView.getSettings();
        
        // JavaScript aktivieren (benötigt für PRASCO Display)
        webSettings.setJavaScriptEnabled(true);
        
        // DOM Storage aktivieren (für LocalStorage)
        webSettings.setDomStorageEnabled(true);
        
        // Database aktivieren
        webSettings.setDatabaseEnabled(true);
        
        // Cache-Modus
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // File Access
        webSettings.setAllowFileAccess(true);
        
        // Medien ohne User-Geste abspielen (für Auto-Play)
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // Hardware-Beschleunigung aktivieren
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        
        // Viewport anpassen
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // Zoom deaktivieren
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
    }

    /**
     * Custom WebViewClient für bessere Kontrolle
     */
    private class PrascoWebViewClient extends WebViewClient {
        
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            // Alle URLs in der App laden (nicht im externen Browser öffnen)
            return false;
        }
        
        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            // Seite geladen - optional: Loading-Indicator ausblenden
        }
        
        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            // Fehlerbehandlung - optional: Fehlerseite anzeigen
        }
    }

    /**
     * Zurück-Taste für Kiosk-Modus deaktivieren
     * 
     * Für normale Navigation kommentiere diese Methode aus oder
     * implementiere WebView.goBack() Funktionalität
     */
    @Override
    public void onBackPressed() {
        // Leer lassen für Kiosk-Modus (Zurück-Taste deaktiviert)
        
        // Alternative: Navigation in WebView
        // if (webView.canGoBack()) {
        //     webView.goBack();
        // } else {
        //     super.onBackPressed();
        // }
        
        // Alternative: Dialog zum Beenden
        // showExitDialog();
    }

    /**
     * Fullscreen-Modus nach Resume wiederherstellen
     */
    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        setupFullscreenMode();
    }

    /**
     * WebView pausieren
     */
    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    /**
     * Cleanup beim Beenden
     */
    @Override
    protected void onDestroy() {
        super.onDestroy();
        webView.destroy();
    }
    
    /**
     * Window Focus für Fullscreen-Modus
     */
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            setupFullscreenMode();
        }
    }
}
