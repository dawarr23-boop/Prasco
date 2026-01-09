# ProGuard Rules for PRASCO Display TV

# Keep WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView
-keep class android.webkit.** { *; }

# Keep Activity
-keep class net.prasco.display.tv.MainActivity { *; }

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }

# General Android
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Leanback
-keep class androidx.leanback.** { *; }
