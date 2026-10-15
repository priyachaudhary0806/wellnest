/**
 * Runtime Permission Handler — Camera & Microphone
 *
 * On Android (Capacitor WebView) navigator.mediaDevices.getUserMedia()
 * IS the runtime permission prompt. If the user denies it, the promise
 * rejects with NotAllowedError. If they permanently deny (checked
 * "don't ask again"), subsequent calls also reject immediately.
 *
 * States returned:
 *   'granted'           — permission allowed, stream available
 *   'denied'            — user tapped Deny this time (can ask again)
 *   'permanent_denied'  — user tapped Deny + Don't Ask Again
 *   'unavailable'       — hardware not present / API not supported
 *   'error'             — unexpected error
 */

const PERM_STORAGE_KEY = 'wellnest_permissions';

function savePermState(key, state) {
  try {
    const stored = JSON.parse(localStorage.getItem(PERM_STORAGE_KEY) || '{}');
    stored[key] = state;
    localStorage.setItem(PERM_STORAGE_KEY, JSON.stringify(stored));
  } catch {}
}

function loadPermState(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(PERM_STORAGE_KEY) || '{}');
    return stored[key] || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Request a single media permission.
 * @param {'audio'|'video'} kind
 * @returns {'granted'|'denied'|'permanent_denied'|'unavailable'|'error'}
 */
async function requestMediaPermission(kind) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unavailable';
  }

  const constraints = kind === 'audio' ? { audio: true } : { video: { facingMode: 'environment' } };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // Release immediately — we only needed the permission prompt
    stream.getTracks().forEach(t => t.stop());
    savePermState(kind, 'granted');
    return 'granted';
  } catch (err) {
    // NotAllowedError covers both "denied once" and "permanently denied".
    // We distinguish them by checking Permissions API if available.
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      // Try Permissions API to detect permanent denial
      const permName = kind === 'audio' ? 'microphone' : 'camera';
      try {
        const permStatus = await navigator.permissions.query({ name: permName });
        if (permStatus.state === 'denied') {
          savePermState(kind, 'permanent_denied');
          return 'permanent_denied';
        }
      } catch {
        // Permissions API not supported — treat as regular denied
      }
      savePermState(kind, 'denied');
      return 'denied';
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      savePermState(kind, 'unavailable');
      return 'unavailable';
    }
    console.warn(`[Permission] ${kind} error:`, err);
    return 'error';
  }
}

export const permissionService = {
  /**
   * Request both camera and microphone permissions on app startup.
   * Returns a summary object used by App.jsx to decide next steps.
   */
  async requestAppPermissions() {
    const mic = await requestMediaPermission('audio');
    const camera = await requestMediaPermission('video');

    return {
      mic,
      camera,
      allGranted: mic === 'granted' && camera === 'granted',
      micGranted: mic === 'granted',
      cameraGranted: camera === 'granted',
      micPermanentlyDenied: mic === 'permanent_denied',
      cameraPermanentlyDenied: camera === 'permanent_denied'
    };
  },

  /**
   * Check camera only (called by CameraFeed before opening stream).
   */
  async requestCameraPermission() {
    return requestMediaPermission('video');
  },

  /**
   * Check microphone only (called by STT service before starting).
   */
  async requestMicrophonePermission() {
    return requestMediaPermission('audio');
  },

  /**
   * Returns last known permission state from storage (no prompt).
   */
  getCachedState(kind) {
    return loadPermState(kind);
  },

  /**
   * Returns a human-readable guide message for the given denied state.
   */
  getDeniedMessage(kind, state) {
    const label = kind === 'audio' ? 'Microphone' : 'Camera';
    if (state === 'permanent_denied') {
      return `${label} access was permanently denied. Please go to your phone Settings → Apps → WellNest → Permissions and enable ${label}.`;
    }
    if (state === 'denied') {
      return `${label} access was denied. Please tap the button to try again.`;
    }
    if (state === 'unavailable') {
      return `${label} hardware is not available on this device.`;
    }
    return `${label} permission could not be obtained. Please check your device settings.`;
  }
};
