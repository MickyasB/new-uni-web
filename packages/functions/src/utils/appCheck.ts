/**
 * Firebase App Check enforcement configuration.
 * 
 * In production, `enforceAppCheck: true` ensures only verified app instances
 * (signed Android APK, iOS IPA, or registered web domain) can call Cloud Functions.
 * 
 * In emulator mode, App Check is automatically bypassed by Firebase.
 * 
 * Spec §4.4: "Enforce on all Cloud Functions — only signed app binaries can call the API"
 */
export const APP_CHECK_OPTIONS = {
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
};

/**
 * Default onCall options that include App Check enforcement.
 * Spread these into every onCall() declaration.
 */
export const SECURE_CALL_OPTIONS = {
  ...APP_CHECK_OPTIONS,
};

/**
 * Secure onCall options with extended timeout (for game loop).
 */
export const SECURE_CALL_OPTIONS_LONG = {
  ...APP_CHECK_OPTIONS,
  timeoutSeconds: 1200,
};
