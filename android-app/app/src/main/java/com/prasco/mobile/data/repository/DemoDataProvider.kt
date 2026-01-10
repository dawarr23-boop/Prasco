package com.prasco.mobile.data.repository

import com.prasco.mobile.domain.model.Category
import com.prasco.mobile.domain.model.Post
import com.prasco.mobile.domain.model.PostType
import com.prasco.mobile.domain.model.User
import com.prasco.mobile.domain.model.UserRole
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stellt Demo-Daten für Standalone-Modus bereit
 */
@Singleton
class DemoDataProvider @Inject constructor() {

    fun getDemoUser(): User {
        return User(
            id = 1,
            email = "demo@prasco.local",
            name = "Demo User",
            role = UserRole.ADMIN
        )
    }

    fun getDemoCategories(): List<Category> {
        return listOf(
            Category(id = 1, name = "Allgemein", color = "#3B82F6", icon = null),
            Category(id = 2, name = "Wichtig", color = "#EF4444", icon = null),
            Category(id = 3, name = "Events", color = "#10B981", icon = null),
            Category(id = 4, name = "News", color = "#F59E0B", icon = null),
            Category(id = 5, name = "Info", color = "#8B5CF6", icon = null)
        )
    }

    fun getDemoPosts(): List<Post> {
        val now = java.time.LocalDateTime.now()
        val dateFormatter = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME
        
        return listOf(
            Post(
                id = 1,
                title = "Willkommen bei PRASCO",
                content = "Dies ist eine Demo-Installation der PRASCO Digital Signage App. Sie läuft komplett offline ohne Server-Verbindung.",
                type = PostType.TEXT,
                mediaUrl = null,
                duration = 10,
                priority = 5,
                category = Category(id = 1, name = "Allgemein", color = "#3B82F6", icon = null),
                startDate = null,
                endDate = null,
                isActive = true,
                createdAt = now.minusDays(7).format(dateFormatter),
                updatedAt = now.minusDays(7).format(dateFormatter)
            ),
            Post(
                id = 2,
                title = "Wichtige Ankündigung",
                content = "Alle Features der App sind verfügbar. Sie können Posts erstellen, bearbeiten und löschen - alles wird lokal gespeichert.",
                type = PostType.TEXT,
                mediaUrl = null,
                duration = 15,
                priority = 8,
                category = Category(id = 2, name = "Wichtig", color = "#EF4444", icon = null),
                startDate = null,
                endDate = null,
                isActive = true,
                createdAt = now.minusDays(5).format(dateFormatter),
                updatedAt = now.minusDays(5).format(dateFormatter)
            ),
            Post(
                id = 3,
                title = "Team Meeting",
                content = "Das nächste Team Meeting findet am Montag um 10:00 Uhr statt. Agenda: Q1 Review und Planung Q2.",
                type = PostType.TEXT,
                mediaUrl = null,
                duration = 12,
                priority = 7,
                category = Category(id = 3, name = "Events", color = "#10B981", icon = null),
                startDate = null,
                endDate = null,
                isActive = true,
                createdAt = now.minusDays(3).format(dateFormatter),
                updatedAt = now.minusDays(3).format(dateFormatter)
            ),
            Post(
                id = 4,
                title = "Neue Features",
                content = "Die App unterstützt jetzt:\n- Offline-Betrieb\n- Lokale Datenspeicherung\n- Demo-Modus\n- Vollständige CRUD-Operationen",
                type = PostType.TEXT,
                mediaUrl = null,
                duration = 20,
                priority = 6,
                category = Category(id = 4, name = "News", color = "#F59E0B", icon = null),
                startDate = null,
                endDate = null,
                isActive = true,
                createdAt = now.minusDays(2).format(dateFormatter),
                updatedAt = now.minusDays(2).format(dateFormatter)
            ),
            Post(
                id = 5,
                title = "Systeminfo",
                content = "PRASCO Digital Signage v1.0.0\nStandalone-Modus aktiv\nKeine Server-Verbindung erforderlich",
                type = PostType.TEXT,
                mediaUrl = null,
                duration = 8,
                priority = 3,
                category = Category(id = 5, name = "Info", color = "#8B5CF6", icon = null),
                startDate = null,
                endDate = null,
                isActive = true,
                createdAt = now.minusDays(1).format(dateFormatter),
                updatedAt = now.minusDays(1).format(dateFormatter)
            ),
            Post(
                id = 6,
                title = "Inaktiver Post",
                content = "Dieser Post ist deaktiviert und wird nicht auf dem Display angezeigt.",
                type = PostType.TEXT,
                mediaUrl = null,
                duration = 10,
                priority = 1,
                category = Category(id = 1, name = "Allgemein", color = "#3B82F6", icon = null),
                startDate = null,
                endDate = null,
                isActive = false,
                createdAt = now.minusDays(10).format(dateFormatter),
                updatedAt = now.minusDays(10).format(dateFormatter)
            )
        )
    }

    fun isValidDemoCredentials(email: String, password: String): Boolean {
        // Demo-Credentials
        return (email == "demo" || email == "demo@prasco.local" || email == "admin") &&
               (password == "demo" || password == "admin")
    }
}
