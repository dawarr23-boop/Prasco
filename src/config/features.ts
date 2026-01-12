/**
 * Feature Flags für PRASCO
 * Steuert welche Features aktiviert sind basierend auf Umgebung
 */

export interface FeatureFlags {
  // Erweiterte Admin-Features (CPU/RAM intensiv)
  ENABLE_TRANSITION_PICKER: boolean;
  ENABLE_ANIMATION_TIMELINE: boolean;
  ENABLE_PATH_EDITOR: boolean;
  
  // Performance-Features
  ENABLE_ADVANCED_CACHING: boolean;
  ENABLE_VIDEO_DOWNLOAD: boolean;
  
  // System-Features
  ENABLE_HOTSPOT_MODE: boolean;
  ENABLE_SSO: boolean;
}

// Determine if running on resource-constrained device (Raspberry Pi)
const isLowResource = process.env.NODE_ENV === 'production' && 
                      process.env.DEVICE_TYPE === 'pi';

// Feature configuration based on environment
export const FEATURES: FeatureFlags = {
  // Erweiterte Editor-Features nur auf Desktop
  ENABLE_TRANSITION_PICKER: process.env.ENABLE_ADVANCED_FEATURES === 'true' && !isLowResource,
  ENABLE_ANIMATION_TIMELINE: process.env.ENABLE_ADVANCED_FEATURES === 'true' && !isLowResource,
  ENABLE_PATH_EDITOR: process.env.ENABLE_ADVANCED_FEATURES === 'true' && !isLowResource,
  
  // Performance-Features
  ENABLE_ADVANCED_CACHING: true,
  ENABLE_VIDEO_DOWNLOAD: process.env.ENABLE_VIDEO_DOWNLOAD !== 'false',
  
  // System-Features (immer aktiv wenn konfiguriert)
  ENABLE_HOTSPOT_MODE: true,
  ENABLE_SSO: process.env.ENABLE_SSO === 'true',
};

// Log feature status on startup
export function logFeatureStatus(): void {
  console.log('=== PRASCO Feature Status ===');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Device Type: ${process.env.DEVICE_TYPE || 'standard'}`);
  console.log('Features:');
  Object.entries(FEATURES).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✓' : '✗'}`);
  });
  console.log('============================');
}

export default FEATURES;
