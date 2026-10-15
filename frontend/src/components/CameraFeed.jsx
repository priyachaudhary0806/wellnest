import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import { permissionService } from '../services/permissionService';

/**
 * CameraFeed — renders a live camera preview.
 * Handles: permission granted/denied/permanently denied, init failures,
 * returning from device settings (Page Visibility API), camera flip.
 * Calls onFrameCapture(canvas) every 250ms when active.
 */
export const CameraFeed = ({ onFrameCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameIntervalRef = useRef(null);

  const [permState, setPermState] = useState('unknown'); // unknown|granted|denied|permanent_denied|unavailable|error
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [justCaptured, setJustCaptured] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const stopStream = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async (facing = facingMode) => {
    if (isInitializing) return;
    setIsInitializing(true);
    setErrorMsg('');
    stopStream();

    // First request permission
    const perm = await permissionService.requestCameraPermission();
    setPermState(perm);

    if (perm !== 'granted') {
      setErrorMsg(permissionService.getDeniedMessage('video', perm));
      setIsInitializing(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => {
          console.warn('[Camera] play() error:', e.message);
        });
      }

      setIsActive(true);
      setPermState('granted');
      setIsInitializing(false);

      // Start frame capture loop
      frameIntervalRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) return;

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (onFrameCapture) onFrameCapture(canvas);
        }
      }, 250);

    } catch (err) {
      console.warn('[Camera] getUserMedia error:', err);
      setIsActive(false);
      setIsInitializing(false);
      if (err.name === 'NotAllowedError') {
        setPermState('denied');
        setErrorMsg('Camera access was denied. Tap to try again.');
      } else if (err.name === 'NotFoundError') {
        setPermState('unavailable');
        setErrorMsg('No camera found on this device.');
      } else {
        setPermState('error');
        setErrorMsg(`Camera error: ${err.message}`);
      }
    }
  }, [facingMode, isInitializing, onFrameCapture, stopStream]);

  // Start on mount
  useEffect(() => {
    startCamera(facingMode);
    return () => stopStream();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart when facingMode changes
  useEffect(() => {
    if (permState === 'granted' || permState === 'unknown') {
      startCamera(facingMode);
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-check permission when app comes back to foreground (user may have gone to Settings)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isActive && permState !== 'unavailable') {
        startCamera(facingMode);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isActive, permState, facingMode, startCamera]);

  const handleFlip = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    setJustCaptured(true);
    setTimeout(() => setJustCaptured(false), 700);
    if (canvasRef.current && onFrameCapture) {
      onFrameCapture(canvasRef.current);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>

      {/* Permission / Error message */}
      {(permState !== 'granted' && permState !== 'unknown') && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: permState === 'permanent_denied' ? '#fef2f2' : 'var(--accent-light)',
          border: `2px solid ${permState === 'permanent_denied' ? '#dc2626' : 'var(--accent-primary)'}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {permState === 'permanent_denied'
              ? <AlertTriangle size={26} color="#dc2626" />
              : <Lock size={26} color="var(--accent-primary)" />
            }
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {permState === 'permanent_denied' ? 'Camera Permanently Denied' : 'Camera Access Needed'}
              </p>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                {errorMsg}
              </p>
            </div>
          </div>

          {permState !== 'permanent_denied' && permState !== 'unavailable' && (
            <button
              className="btn-primary"
              onClick={() => startCamera(facingMode)}
              disabled={isInitializing}
              style={{ width: '100%', justifyContent: 'center', minHeight: '52px', fontSize: '1.1rem' }}
              aria-label="Enable camera"
            >
              <Camera size={22} />
              <span>{isInitializing ? 'Opening Camera...' : 'Enable Camera'}</span>
            </button>
          )}

          {permState === 'permanent_denied' && (
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626' }}>
              Go to: Phone Settings → Apps → WellNest → Permissions → Camera → Allow
            </p>
          )}
        </div>
      )}

      {/* Initializing indicator */}
      {isInitializing && permState !== 'denied' && permState !== 'permanent_denied' && (
        <div style={{
          height: '280px',
          backgroundColor: '#0f172a',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '1.05rem',
          fontWeight: 600,
          gap: '0.75rem'
        }}>
          <RefreshCw size={22} className="spin" />
          <span>Starting camera...</span>
        </div>
      )}

      {/* Camera viewport */}
      {(isActive || isInitializing) && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          backgroundColor: '#0f172a',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          display: isInitializing && !isActive ? 'none' : 'block'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Flash effect on capture */}
          {justCaptured && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: '#ffffff',
              opacity: 0.8,
              pointerEvents: 'none',
              animation: 'flashFade 0.6s ease-out forwards'
            }} />
          )}

          {/* Flip camera button */}
          <button
            onClick={handleFlip}
            aria-label="Flip camera"
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              right: '0.75rem',
              width: '44px', height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15,23,42,0.8)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: 0, minHeight: 'unset',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes flashFade { from { opacity: 0.8; } to { opacity: 0; } }
      `}</style>
    </div>
  );
};
