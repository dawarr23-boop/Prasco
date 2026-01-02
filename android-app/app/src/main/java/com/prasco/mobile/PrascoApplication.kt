package com.prasco.mobile

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class PrascoApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        
        // Initialize Timber for Logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        
        Timber.i("PRASCO Mobile App Started")
    }
}
