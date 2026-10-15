import React, { useState, useEffect, useRef } from 'react';
import { CameraFeed } from '../components/CameraFeed';
import { aiVisionService } from '../services/aiVisionService';
import { useAccessibility } from '../context/AccessibilityContext';
import { Scan, Volume2, Copy, Play, Pause, RefreshCw, Check, FastForward, Camera } from 'lucide-react';

export const TextReader = () => {
  const { speak, stopSpeech, speechSpeed, setSpeechSpeed, triggerHaptic } = useAccessibility();
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    window.__currentScreen = 'ocr';

    const handleVoiceCmd = (e) => {
      const detail = e.detail || {};
      if (detail.intent === 'CAPTURE' || detail.intent === 'READ_TEXT' || detail.intent === 'TEXT_READER') {
        triggerOcrRead();
      }
    };

    window.addEventListener('wellnest-voice-cmd', handleVoiceCmd);
    window.addEventListener('aurasight-voice-cmd', handleVoiceCmd);
    return () => {
      window.removeEventListener('wellnest-voice-cmd', handleVoiceCmd);
      window.removeEventListener('aurasight-voice-cmd', handleVoiceCmd);
    };
  }, []);

  const handleFrameCapture = (canvas) => {
    canvasRef.current = canvas;
  };

  const triggerOcrRead = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic('medium');
    speak("Reading text with optical character recognition...", true);

    try {
      const canvas = canvasRef.current;
      const data = await aiVisionService.readTextFromCanvas(canvas);
      setOcrResult(data);
      setIsProcessing(false);

      speak(`Text detected. ${data.rawText}`, true);
    } catch (err) {
      console.error('OCR Error:', err);
      setIsProcessing(false);
      speak("Could not recognize text clearly. Please hold camera steady and retry.", true);
    }
  };

  const handleCopy = () => {
    if (ocrResult?.rawText) {
      navigator.clipboard.writeText(ocrResult.rawText);
      setCopied(true);
      triggerHaptic();
      speak("Text copied to clipboard", true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleSpeed = () => {
    triggerHaptic();
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(speechSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setSpeechSpeed(newSpeed);
    speak(`Speech speed set to ${newSpeed}x`, true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Text Reader / OCR
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Point camera at signboards, menus, medicine labels or documents to read aloud.
        </p>
      </div>

      <CameraFeed onFrameCapture={handleFrameCapture} />

      <button
        onClick={triggerOcrRead}
        disabled={isProcessing}
        className="btn-primary"
        aria-label="Read text from camera view"
        style={{ width: '100%', justifyContent: 'center', fontSize: '1.15rem', padding: '0.875rem' }}
      >
        <Camera size={24} />
        <span>{isProcessing ? 'Reading Text...' : 'Read Text from Camera'}</span>
      </button>

      {isProcessing && (
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem', borderColor: 'var(--border-active)' }}>
          <RefreshCw size={32} className="spin" color="var(--warning)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Extracting Text...</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Processing optical characters</p>
        </div>
      )}

      {ocrResult && !isProcessing && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '3px solid var(--warning)' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>
              <Scan size={16} /> Confidence {ocrResult.confidence}%
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={toggleSpeed}
                aria-label={`Change speech speed. Current speed ${speechSpeed}x`}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.85rem' }}
              >
                <FastForward size={16} />
                <span>{speechSpeed}x</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic();
                  speak(ocrResult.rawText, true);
                }}
                className="btn-primary"
                aria-label="Read full text aloud"
                style={{ padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}
              >
                <Volume2 size={18} />
                <span>Read</span>
              </button>

              <button
                onClick={handleCopy}
                className="btn-secondary"
                aria-label="Copy extracted text"
                style={{ padding: '0.4rem 0.65rem' }}
              >
                {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Extracted Text Box */}
          <div style={{
            backgroundColor: 'var(--bg-app)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--warning)',
            maxHeight: '220px',
            overflowY: 'auto'
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              fontWeight: 700,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {ocrResult.rawText}
            </p>
          </div>

          {/* Line by line breakdown */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Line-by-line readout ({ocrResult.lines.length} lines):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {ocrResult.lines.map((line, i) => (
                <button
                  key={i}
                  onClick={() => {
                    triggerHaptic();
                    speak(`Line ${i + 1}: ${line}`, true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    fontSize: '0.95rem'
                  }}
                >
                  <span>Line {i + 1}: {line}</span>
                  <Volume2 size={16} color="var(--accent-primary)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
