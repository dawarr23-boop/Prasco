package net.prasco.tv.network

import com.google.gson.annotations.SerializedName

/**
 * API-Datenmodelle für die PRASCO Server API
 * Alle Models als data class für automatisches equals/hashCode/toString
 */

// === API Response Wrapper ===
// Der PRASCO Server liefert Daten im Format: { "success": true, "data": [...], "count": N }

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("data") val data: T,
    @SerializedName("count") val count: Int? = null
)

// === Server Info ===

data class ServerInfoDto(
    @SerializedName("name") val name: String? = null,
    @SerializedName("version") val version: String? = null,
    @SerializedName("developer") val developer: String? = null
)

// === Posts ===

data class PostDto(
    @SerializedName("id") val id: Int,
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String? = null,
    @SerializedName("contentType") val contentType: String,          // "text", "image", "video", "html"
    @SerializedName("mediaUrl") val mediaUrl: String? = null,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("duration") val duration: Int? = null,            // Sekunden
    @SerializedName("priority") val priority: Int = 0,
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("startDate") val startDate: String? = null,
    @SerializedName("endDate") val endDate: String? = null,
    @SerializedName("showTitle") val showTitle: Boolean? = true,
    @SerializedName("category") val category: CategoryDto? = null,
    @SerializedName("presentation") val presentation: PresentationDto? = null,
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("updatedAt") val updatedAt: String = ""
)

// === Kategorien ===

data class CategoryDto(
    @SerializedName("id") val id: Int,
    @SerializedName("name") val name: String,
    @SerializedName("color") val color: String? = null,
    @SerializedName("icon") val icon: String? = null
)

// === Präsentationen / Slides ===

data class PresentationDto(
    @SerializedName("presentationId") val presentationId: String,
    @SerializedName("originalName") val originalName: String? = null,
    @SerializedName("slides") val slides: List<SlideDto>? = null
)

data class SlideDto(
    @SerializedName("slideNumber") val slideNumber: Int,
    @SerializedName("imageUrl") val imageUrl: String
)

// === Displays ===

data class DisplayDto(
    @SerializedName("id") val id: Int,
    @SerializedName("name") val name: String,
    @SerializedName("identifier") val identifier: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("location") val location: String? = null,
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("isOnline") val isOnline: Boolean? = null,
    @SerializedName("lastSeen") val lastSeen: String? = null,
    @SerializedName("organization") val organization: String? = null,
    @SerializedName("organizationId") val organizationId: Int? = null
)

// === Einstellungen ===

data class SettingDto(
    @SerializedName("key") val key: String,
    @SerializedName("value") val value: String
)

// === Health Check ===

data class HealthDto(
    @SerializedName("status") val status: String   // "ok"
)

// === Transit / Abfahrten (optional) ===

data class DepartureDto(
    @SerializedName("stationId") val stationId: String? = null,
    @SerializedName("stationName") val stationName: String? = null,
    @SerializedName("departures") val departures: List<DepartureDetail>? = null
)

data class DepartureDetail(
    @SerializedName("line") val line: String,
    @SerializedName("direction") val direction: String,
    @SerializedName("departureTime") val departureTime: String,
    @SerializedName("delay") val delay: Int? = null
)

// === App-Zustandsmodelle (nicht API, intern) ===

/**
 * Verbindungsstatus der App
 */
sealed class ConnectionState {
    /** Verbunden und Server erreichbar */
    data object Connected : ConnectionState()

    /** Kein Netzwerk vorhanden */
    data object NoNetwork : ConnectionState()

    /** Netzwerk vorhanden, Server nicht erreichbar */
    data object ServerUnreachable : ConnectionState()

    /** Verbindung wird hergestellt */
    data object Connecting : ConnectionState()

    /** Reconnect nach Fehler */
    data class Reconnecting(val attempt: Int, val nextRetryMs: Long) : ConnectionState()
}

/**
 * Lade-Status der Display-Seite
 */
sealed class DisplayState {
    data object Loading : DisplayState()
    data object Ready : DisplayState()
    data class Error(val message: String, val code: Int = -1) : DisplayState()
    data object Offline : DisplayState()
}
