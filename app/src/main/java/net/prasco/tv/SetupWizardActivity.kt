package net.prasco.tv

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.network.DisplayDto
import net.prasco.tv.network.PrascoApiClient
import net.prasco.tv.util.Logger
import net.prasco.tv.util.enableFullscreen
import net.prasco.tv.util.showToast

/**
 * Setup Wizard für die Ersteinrichtung
 * 3 Schritte: Server-URL → Display-Auswahl → Bestätigung
 */
class SetupWizardActivity : AppCompatActivity() {

    private lateinit var preferencesManager: PreferencesManager

    // Steps
    private lateinit var step1: LinearLayout
    private lateinit var step2: LinearLayout
    private lateinit var step3: LinearLayout

    // Step 1
    private lateinit var editSetupServerUrl: EditText
    private lateinit var btnTestSetupConnection: Button
    private lateinit var textConnectionStatus: TextView

    // Step 2 – Display-Auswahl
    private lateinit var displayListContainer: LinearLayout
    private lateinit var textDisplayLoading: TextView
    private lateinit var textDisplayError: TextView
    private lateinit var editSetupDisplayName: EditText
    private lateinit var btnManualDisplayInput: Button
    private lateinit var manualInputFields: LinearLayout

    // Step 3
    private lateinit var textSetupSummary: TextView

    // Navigation
    private lateinit var btnSetupBack: Button
    private lateinit var btnSetupNext: Button
    private lateinit var stepDot1: View
    private lateinit var stepDot2: View
    private lateinit var stepDot3: View

    private var currentStep = 1
    private var connectionTested = false

    // Verfügbare Displays vom Server
    private var availableDisplays: List<DisplayDto> = emptyList()
    private var selectedDisplay: DisplayDto? = null
    private var isManualInput = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableFullscreen()
        setContentView(R.layout.activity_setup)

        preferencesManager = (application as PrascoApp).preferencesManager

        Logger.info("Setup Wizard gestartet")

        initViews()
        showStep(1)
    }

    private fun initViews() {
        step1 = findViewById(R.id.step1)
        step2 = findViewById(R.id.step2)
        step3 = findViewById(R.id.step3)

        editSetupServerUrl = findViewById(R.id.editSetupServerUrl)
        btnTestSetupConnection = findViewById(R.id.btnTestSetupConnection)
        textConnectionStatus = findViewById(R.id.textConnectionStatus)

        // Step 2 – Display-Auswahl
        displayListContainer = findViewById(R.id.displayListContainer)
        textDisplayLoading = findViewById(R.id.textDisplayLoading)
        textDisplayError = findViewById(R.id.textDisplayError)
        editSetupDisplayName = findViewById(R.id.editSetupDisplayName)
        btnManualDisplayInput = findViewById(R.id.btnManualDisplayInput)
        manualInputFields = findViewById(R.id.manualInputFields)

        textSetupSummary = findViewById(R.id.textSetupSummary)

        btnSetupBack = findViewById(R.id.btnSetupBack)
        btnSetupNext = findViewById(R.id.btnSetupNext)
        stepDot1 = findViewById(R.id.stepDot1)
        stepDot2 = findViewById(R.id.stepDot2)
        stepDot3 = findViewById(R.id.stepDot3)

        // Standard-URL vorladen
        editSetupServerUrl.setText(preferencesManager.serverUrl)
        editSetupDisplayName.setText("PRASCO Display")

        btnTestSetupConnection.setOnClickListener { testConnection() }
        btnSetupNext.setOnClickListener { nextStep() }
        btnSetupBack.setOnClickListener { previousStep() }

        // Manuell-Eingabe Toggle
        btnManualDisplayInput.setOnClickListener {
            isManualInput = !isManualInput
            selectedDisplay = null
            clearDisplaySelection()
            manualInputFields.visibility = if (isManualInput) View.VISIBLE else View.GONE
            btnManualDisplayInput.text = if (isManualInput) {
                getString(R.string.setup_show_display_list)
            } else {
                getString(R.string.setup_manual_input)
            }
            if (isManualInput) {
                editSetupDisplayName.requestFocus()
            }
        }
    }

    private fun showStep(step: Int) {
        currentStep = step

        step1.visibility = if (step == 1) View.VISIBLE else View.GONE
        step2.visibility = if (step == 2) View.VISIBLE else View.GONE
        step3.visibility = if (step == 3) View.VISIBLE else View.GONE

        btnSetupBack.visibility = if (step > 1) View.VISIBLE else View.GONE
        btnSetupNext.text = if (step == 3) {
            getString(R.string.setup_finish)
        } else {
            getString(R.string.btn_next)
        }

        // Step Dots aktualisieren
        val activeDotColor = 0xFF7B8CDE.toInt()
        val inactiveDotColor = 0xFF333366.toInt()
        stepDot1.setBackgroundColor(if (step >= 1) activeDotColor else inactiveDotColor)
        stepDot2.setBackgroundColor(if (step >= 2) activeDotColor else inactiveDotColor)
        stepDot3.setBackgroundColor(if (step >= 3) activeDotColor else inactiveDotColor)

        // Fokus setzen
        when (step) {
            1 -> editSetupServerUrl.requestFocus()
            2 -> {
                // Displays vom Server laden
                fetchDisplays()
            }
            3 -> {
                updateSummary()
                btnSetupNext.requestFocus()
            }
        }
    }

    private fun nextStep() {
        when (currentStep) {
            1 -> {
                val url = editSetupServerUrl.text.toString().trim()
                if (url.isEmpty()) {
                    showToast(getString(R.string.settings_error_url_empty))
                    return
                }
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    showToast(getString(R.string.settings_error_url_invalid))
                    return
                }
                showStep(2)
            }
            2 -> {
                if (selectedDisplay == null && !isManualInput) {
                    showToast(getString(R.string.setup_select_display))
                    return
                }
                if (isManualInput && editSetupDisplayName.text.toString().trim().isEmpty()) {
                    showToast(getString(R.string.setup_enter_display_name))
                    return
                }
                showStep(3)
            }
            3 -> {
                finishSetup()
            }
        }
    }

    private fun previousStep() {
        if (currentStep > 1) {
            showStep(currentStep - 1)
        }
    }

    private fun updateSummary() {
        val serverUrl = editSetupServerUrl.text.toString().trim()
        val displayName = if (selectedDisplay != null) {
            selectedDisplay!!.name
        } else {
            editSetupDisplayName.text.toString().trim().ifEmpty { "PRASCO Display" }
        }
        val displayId = selectedDisplay?.identifier ?: ""
        val location = selectedDisplay?.location
        val connectionStatus = if (connectionTested) "✓ Getestet" else "⚠ Nicht getestet"

        val summary = buildString {
            appendLine("Server: $serverUrl")
            appendLine("Display: $displayName")
            if (displayId.isNotEmpty()) appendLine("Kennung: $displayId")
            if (!location.isNullOrEmpty()) appendLine("Standort: $location")
            appendLine("Verbindung: $connectionStatus")
        }
        textSetupSummary.text = summary.trim()
    }

    private fun testConnection() {
        val serverUrl = editSetupServerUrl.text.toString().trim()

        if (serverUrl.isEmpty()) {
            showToast(getString(R.string.settings_error_url_empty))
            return
        }

        btnTestSetupConnection.isEnabled = false
        btnTestSetupConnection.text = getString(R.string.settings_testing)
        textConnectionStatus.visibility = View.GONE

        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                try {
                    val api = PrascoApiClient.getApi(serverUrl)
                    val health = api.healthCheck()
                    if (health.status == "ok") {
                        // Versuche Server-Version abzurufen
                        val version = try {
                            api.getServerInfo().data.version
                        } catch (_: Exception) {
                            null
                        }
                        Pair(true, version)
                    } else {
                        Pair(false, null)
                    }
                } catch (e: Exception) {
                    Logger.error("Setup Verbindungstest fehlgeschlagen", throwable = e)
                    Pair(false, null)
                }
            }

            btnTestSetupConnection.isEnabled = true
            btnTestSetupConnection.text = getString(R.string.setup_test_connection)
            textConnectionStatus.visibility = View.VISIBLE

            if (result.first) {
                connectionTested = true
                val versionInfo = if (result.second != null) " (v${result.second})" else ""
                textConnectionStatus.text = getString(R.string.setup_connection_ok) + versionInfo
                textConnectionStatus.setTextColor(0xFF4CAF50.toInt())
                Logger.info("Setup: Verbindungstest erfolgreich$versionInfo")
            } else {
                connectionTested = false
                textConnectionStatus.text = getString(R.string.setup_connection_failed)
                textConnectionStatus.setTextColor(0xFFFF5722.toInt())
                Logger.warn("Setup: Verbindungstest fehlgeschlagen")
            }
        }
    }

    private fun finishSetup() {
        val serverUrl = editSetupServerUrl.text.toString().trim().trimEnd('/')
        val displayName: String
        val displayIdentifier: String

        if (selectedDisplay != null) {
            displayName = selectedDisplay!!.name
            displayIdentifier = selectedDisplay!!.identifier
        } else {
            displayName = editSetupDisplayName.text.toString().trim().ifEmpty { "PRASCO Display" }
            displayIdentifier = displayName.lowercase()
                .replace(Regex("[^a-z0-9]"), "-")
                .replace(Regex("-+"), "-")
                .trim('-')
        }

        preferencesManager.serverUrl = serverUrl
        preferencesManager.displayName = displayName
        preferencesManager.displayIdentifier = displayIdentifier
        preferencesManager.isFirstLaunch = false
        preferencesManager.isSetupCompleted = true

        Logger.info("Setup abgeschlossen: Server=$serverUrl, Display=$displayName, Identifier=$displayIdentifier")

        // Zur Hauptseite wechseln
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onBackPressed() {
        if (currentStep > 1) {
            previousStep()
        } else {
            // Auf Step 1 kann man nicht zurück – Setup ist Pflicht
            showToast(getString(R.string.setup_required))
        }
    }

    // ===================== Display-Discovery =====================

    /**
     * Displays vom PRASCO Server abrufen
     */
    private fun fetchDisplays() {
        val serverUrl = editSetupServerUrl.text.toString().trim().trimEnd('/')

        textDisplayLoading.visibility = View.VISIBLE
        textDisplayError.visibility = View.GONE
        displayListContainer.removeAllViews()

        lifecycleScope.launch {
            var displays: List<DisplayDto>? = null
            var error: Exception? = null

            withContext(Dispatchers.IO) {
                try {
                    val response = PrascoApiClient.getApi(serverUrl).getDisplays()
                    displays = response.data
                    Logger.info("${displays?.size ?: 0} Displays vom Server empfangen")
                } catch (e: Exception) {
                    Logger.warn("Displays konnten nicht geladen werden: ${e.message}")
                    error = e
                }
            }

            textDisplayLoading.visibility = View.GONE

            if (error != null) {
                textDisplayError.text = getString(R.string.setup_displays_load_error)
                textDisplayError.visibility = View.VISIBLE
                // Bei Fehler manuell-Eingabe anbieten
                isManualInput = true
                manualInputFields.visibility = View.VISIBLE
                btnManualDisplayInput.visibility = View.GONE
                editSetupDisplayName.requestFocus()
                Logger.error("Display-Abruf fehlgeschlagen", throwable = error)
            } else if (displays.isNullOrEmpty()) {
                textDisplayError.text = getString(R.string.setup_no_displays)
                textDisplayError.visibility = View.VISIBLE
                // Direkt manuell anbieten
                isManualInput = true
                manualInputFields.visibility = View.VISIBLE
                btnManualDisplayInput.visibility = View.GONE
                editSetupDisplayName.requestFocus()
            } else {
                availableDisplays = displays!!
                populateDisplayList(displays!!)
                btnManualDisplayInput.visibility = View.VISIBLE
            }
        }
    }

    /**
     * Display-Liste dynamisch mit fokussierbaren Items aufbauen
     */
    private fun populateDisplayList(displays: List<DisplayDto>) {
        displayListContainer.removeAllViews()
        Logger.info("populateDisplayList: ${displays.size} Displays werden angezeigt")

        for (display in displays) {
            val item = createDisplayItem(display)
            displayListContainer.addView(item)
            Logger.debug("Display-Item hinzugefügt: ${display.name} (${display.identifier})")
        }

        Logger.info("displayListContainer childCount=${displayListContainer.childCount}, " +
                "visibility=${displayListContainer.visibility}, " +
                "parent visibility=${(displayListContainer.parent as? View)?.visibility}")

        // Ersten Eintrag fokussieren
        displayListContainer.getChildAt(0)?.requestFocus()
    }

    /**
     * Ein einzelnes Display-Item als fokussierbares View erstellen (TV D-Pad tauglich)
     */
    private fun createDisplayItem(display: DisplayDto): LinearLayout {
        val item = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 8.dpToPx()
            }
            setPadding(20.dpToPx(), 16.dpToPx(), 20.dpToPx(), 16.dpToPx())

            // Hintergrund-Shape
            background = createItemBackground(false)

            isFocusable = true
            isFocusableInTouchMode = true
            isClickable = true

            // Fokus-Effekte für D-Pad Navigation
            setOnFocusChangeListener { _, hasFocus ->
                background = createItemBackground(hasFocus)
                scaleX = if (hasFocus) 1.02f else 1.0f
                scaleY = if (hasFocus) 1.02f else 1.0f
            }

            setOnClickListener {
                selectDisplay(display, this)
            }
        }

        // Display-Name
        val nameText = TextView(this).apply {
            text = "📺  ${display.name}"
            textSize = 20f
            setTextColor(0xFFFFFFFF.toInt())
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        item.addView(nameText)

        // Detail-Zeile: Identifier + Standort
        val detailParts = mutableListOf<String>()
        detailParts.add("ID: ${display.identifier}")
        display.location?.let { if (it.isNotEmpty()) detailParts.add(it) }
        display.description?.let { if (it.isNotEmpty()) detailParts.add(it) }

        val detailText = TextView(this).apply {
            text = detailParts.joinToString(" · ")
            textSize = 14f
            setTextColor(0xFFBBBBBB.toInt())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 4.dpToPx()
            }
        }
        item.addView(detailText)

        // Status-Badge
        val statusText = TextView(this).apply {
            text = if (display.isActive) "● Aktiv" else "○ Inaktiv"
            textSize = 12f
            setTextColor(if (display.isActive) 0xFF4CAF50.toInt() else 0xFF999999.toInt())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 4.dpToPx()
            }
        }
        item.addView(statusText)

        // Tag für Identifikation
        item.tag = display.identifier

        return item
    }

    private fun createItemBackground(focused: Boolean): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 12f.dpToPxF()
            if (focused) {
                setColor(0xFF3D3D7A.toInt())
                setStroke(3.dpToPx(), 0xFF7B8CDE.toInt())
            } else {
                setColor(0xFF34345A.toInt())
                setStroke(2.dpToPx(), 0xFF5555AA.toInt())
            }
        }
    }

    private fun selectDisplay(display: DisplayDto, itemView: LinearLayout) {
        selectedDisplay = display
        isManualInput = false
        manualInputFields.visibility = View.GONE

        // Visuelle Selektion aktualisieren
        clearDisplaySelection()
        itemView.background = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 12f.dpToPxF()
            setColor(0xFF2E5A2E.toInt())
            setStroke(3.dpToPx(), 0xFF4CAF50.toInt())
        }

        Logger.info("Display ausgewählt: ${display.name} (${display.identifier})")
    }

    private fun clearDisplaySelection() {
        for (i in 0 until displayListContainer.childCount) {
            val child = displayListContainer.getChildAt(i)
            if (child is LinearLayout) {
                child.background = createItemBackground(child.isFocused)
            }
        }
    }

    // DP/PX Hilfsfunktionen
    private fun Int.dpToPx(): Int = (this * resources.displayMetrics.density).toInt()
    private fun Float.dpToPxF(): Float = this * resources.displayMetrics.density
}
