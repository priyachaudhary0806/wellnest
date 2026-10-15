import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeed } from '../components/CameraFeed';
import { aiVisionService } from '../services/aiVisionService';
import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, Volume2, Square, Play, Camera } from 'lucide-react';

const LIVE_INTERVAL_MS = 5000;
const MIN_SPEAK_INTERVAL_MS = 6000;

export const DescribeSurroundings = () => {
  const { speak, triggerHaptic } = useAccessibility();

  const [isLive, setIsLive] = useState(false);
  const [statusText, setStatusText] = useState('Press Start to begin live detection');
  const [lastDescription, setLastDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captureResult, setCaptureResult] = useState('');
  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef(null);
  const liveTimerRef = useRef(null);
  const lastDescriptionRef = useRef('');
  const lastSpeakTimeRef = useRef(0);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    window.__currentScreen = 'surroundings';
    speak('Describe Around is open. Press Start or say Capture to analyze your surroundings.', false);

    const handleVoiceCmd = (e) => {
      const { intent } = e.detail || {};
      if (intent === 'START_DETECTION') { setIsLive(true); speak('Live detection started.', true); }
      if (intent === 'STOP_DETECTION') { setIsLive(false); speak('Detection paused.', true); }
      if (intent === 'CAPTURE') handleCapture();
    };

    window.addEventListener('wellnest-voice-cmd', handleVoiceCmd);
    return () => {
      window.removeEventListener('wellnest-voice-cmd', handleVoiceCmd);
      stopLive();
    };
  }, []);

  useEffect(() => {
    if (isLive) {
      setStatusText('Analyzing surroundings...');
      startLive();
    } else {
      stopLive();
      if (!isCaptureMode) setStatusText('Detection paused. Press Start to resume.');
    }
    return () => stopLive();
  }, [isLive]);

  const startLive = () => {
    stopLive();
    liveTimerRef.current = setInterval(runLiveAnalysis, LIVE_INTERVAL_MS);
    // Run immediately once
    setTimeout(runLiveAnalysis, 500);
  };

  const stopLive = () => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
      liveTimerRef.current = null;
    }
  };

  const runLiveAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current || !canvasRef.current) return;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setError('');

    try {
      const description = await aiVisionService.describeLiveFrame(canvasRef.current);
      if (!description) {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        return;
      }

      setLastDescription(description);
      setStatusText(description);

      const now = Date.now();
      const timeSinceLast = now - lastSpeakTimeRef.current;
      const isDifferent = description.toLowerCase() !== lastDescriptionRef.current.toLowerCase();

      if (isDifferent && timeSinceLast >= MIN_SPEAK_INTERVAL_MS) {
        lastDescriptionRef.current = description;
        lastSpeakTimeRef.current = now;
        speak(description, false);
      } else if (isDifferent) {
        lastDescriptionRef.current = description;
      }
    } catch (err) {
      setError('Could not reach backend. Make sure backend is running on port 3001.');
      setIsLive(false);
    }

    setIsAnalyzing(false);
    isAnalyzingRef.current = false;
  }, [speak]);

  const handleFrameCapture = useCallback((canvas) => {
    canvasRef.current = canvas;
  }, []);

  const handleCapture = async () => {
    if (!canvasRef.current) {
      speak('Camera not ready yet. Please allow camera access.', true);
      return;
    }
    triggerHaptic('medium');
    setIsCaptureMode(true);
    setCaptureResult('');
    setError('');
    setIsLive(false);
    speak('Capturing and analyzing current view...', true);

    try {
      const result = await aiVisionService.captureAndDescribe(canvasRef.current);
      setCaptureResult(result);
      speak(result, true);
    } catch (err) {
      const msg = 'Could not analyze image. Make sure backend is running.';
      setCaptureResult(msg);
      setError(msg);
      speak(msg, true);
    }
  };

  const handleResumeLive = () => {
    setIsCaptureMode(false);
    setCaptureResult('');
    setIsLive(true);
    speak('Resuming live detection.', true);
  };

  const toggleLive = () => {
    triggerHaptic('medium');
    setIsLive(prev => !prev);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', paddingBottom: '2.5rem' }}>

      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Describe Around
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          AI describes your real surroundings using camera
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '2px solid #dc2626', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>⚠ {error}</p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.3rem' }}>
            Run: <strong>cd backend → node server.js</strong>
          </p>
        </div>
      )}

      {/* Camera */}
      <CameraFeed onFrameCapture={handleFrameCapture} />

      {/* Status bar */}
      {!isCaptureMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          padding: '1rem 1.25rem', backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: `2px solid ${isLive ? 'var(--border-active)' : 'var(--border-color)'}`,
          minHeight: '64px'
        }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: isAnalyzing ? '#f59e0b' : isLive ? '#16a34a' : '#94a3b8',
            animation: isLive ? 'livePulse 1.4s infinite' : 'none'
          }} />
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>
            {isAnalyzing ? 'Analyzing...' : statusText}
          </span>
        </div>
      )}

      {/* Capture result */}
      {isCaptureMode && captureResult && (
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-active)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Captured View</h3>
          <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6 }}>{captureResult}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.875rem' }}>
            <button className="btn-secondary" onClick={() => speak(captureResult, true)}
              style={{ flex: 1, justifyContent: 'center' }}>
              <Volume2 size={20} color="var(--accent-primary)" />
              <span>Repeat</span>
            </button>
            <button className="btn-primary" onClick={handleResumeLive}
              style={{ flex: 1, justifyContent: 'center' }}>
              <Play size={20} />
              <span>Resume Live</span>
            </button>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!isCaptureMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={handleCapture}
            disabled={isAnalyzing}
            style={{ justifyContent: 'center', fontSize: '1.1rem', minHeight: '56px' }}>
            <Camera size={22} />
            <span>Capture</span>
          </button>

          <button className="btn-secondary" onClick={toggleLive}
            style={{ justifyContent: 'center', fontSize: '1.1rem', minHeight: '56px' }}>
            {isLive
              ? <><Square size={20} color="var(--danger)" /><span>Stop</span></>
              : <><Play size={20} color="var(--accent-primary)" /><span>Start Live</span></>
            }
          </button>
        </div>
      )}

      {/* Last description */}
      {!isCaptureMode && lastDescription && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-primary)' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Last detected:</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>{lastDescription}</p>
          <button onClick={() => speak(lastDescription, true)}
            style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: 'var(--accent-primary)', fontWeight: 700, background: 'none', border: 'none', padding: 0, minHeight: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Volume2 size={16} /> Repeat
          </button>
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.35; transform: scale(1.25); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
