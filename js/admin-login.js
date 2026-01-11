// Admin Login JavaScript

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const remember = document.querySelector('input[name="remember"]').checked;

  const errorMessage = document.getElementById('error-message');
  const submitButton = e.target.querySelector('button[type="submit"]');

  errorMessage.style.display = 'none';
  submitButton.disabled = true;
  submitButton.textContent = 'Anmelden...';

  try {
    // API-Authentifizierung mit REST Backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: username, // Backend erwartet 'email' statt 'username'
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login fehlgeschlagen');
    }

    // Erfolgreicher Login - Token speichern
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    if (remember) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    // Weiterleitung zum Dashboard
    window.location.href = '/admin/dashboard';
  } catch (error) {
    console.error('Login error:', error);
    
    // Fehlermeldung anzeigen
    errorMessage.textContent =
      error.message || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.';
    errorMessage.style.display = 'block';

    // Beide Felder zurücksetzen
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    // Focus zurück auf Username-Feld
    document.getElementById('username').focus();

    // Button wieder aktivieren
    submitButton.disabled = false;
    submitButton.textContent = 'Anmelden';
  }
});

// Auto-Login prüfen bei Remember Me
window.addEventListener('load', async () => {
  // SSO Status prüfen und Button anzeigen
  await checkSSOStatus();

  // URL-Parameter für Fehler prüfen
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const message = urlParams.get('message');

  if (error) {
    const errorMessage = document.getElementById('error-message');
    const errorMessages = {
      sso_init_failed: 'SSO-Initialisierung fehlgeschlagen.',
      sso_denied: 'Der Zugriff wurde verweigert.',
      sso_domain_not_allowed: 'Ihre E-Mail-Domain ist nicht zugelassen.',
      sso_user_not_found: 'Kein Benutzerkonto gefunden. Bitte kontaktieren Sie den Administrator.',
      sso_user_inactive: 'Ihr Benutzerkonto ist deaktiviert.',
    };
    errorMessage.textContent =
      message || errorMessages[error] || `Anmeldung fehlgeschlagen: ${error}`;
    errorMessage.style.display = 'block';

    // URL bereinigen
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const accessToken = localStorage.getItem('accessToken');
  const rememberMe = localStorage.getItem('rememberMe');

  if (accessToken && rememberMe === 'true') {
    // Token validieren
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = '/admin/dashboard';
        } else {
          // Token ungültig - aufräumen
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      })
      .catch((err) => {
        console.error('Token validation failed:', err);
      });
  }
});

// SSO Status prüfen und Button anzeigen/verstecken
async function checkSSOStatus() {
  try {
    const response = await fetch('/api/auth/sso/status');
    const data = await response.json();

    if (data.success && data.data.enabled && data.data.configured) {
      const ssoSection = document.getElementById('sso-section');
      const ssoButton = document.getElementById('sso-login-btn');

      if (ssoSection && ssoButton) {
        ssoSection.style.display = 'block';

        // Click Handler für SSO Login
        ssoButton.addEventListener('click', () => {
          ssoButton.disabled = true;
          ssoButton.innerHTML = '<span class="spinner-small"></span> Weiterleitung...';
          window.location.href = '/api/auth/sso/login';
        });
      }
    }
  } catch (error) {
    console.log('SSO nicht verfügbar:', error.message);
  }
}

console.log('Admin Login geladen');
console.log('Login-Credentials: admin@prasco.net / admin123 oder editor@prasco.net / editor123');
