import React, { useState, useEffect } from 'react';
import { Mic, X, Volume2, Sparkles, AlertCircle, Compass, Hospital, Scan, MapPin } from 'lucide-react';
import { SpeechRecognitionService, parseVoiceCommand } from '../services/sttService';
import { useAccessibility } from '../context/AccessibilityContext';

export const VoiceAssistantModal = ({ isOpen, onClose, onNavigate }) => {
  const { speak, stopSpeech, triggerHaptic } = useAccessibility();
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('idle'); // 'listening', 'processing', 'speaking', 'idle'
  const [lastResponse, setLastResponse] = useState('');
  const [sttService, setSttService] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      if (sttService) sttService.stop();
      return;
    }

    // Initialize speech recognition
    const service = new SpeechRecognitionService(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 0) {
          processCommand(text);
        }
      },
      (error) => {
        console.warn('STT Error:', error);
        setStatus('idle');
      },
      (newStatus) => {
        setStatus(newStatus);
      }
    );

    setSttService(service);
    setTranscript('');
    setLastResponse('Listening... Speak your command now.');

    // Auto start recognition
    setTimeout(() => {
      service.start();
    }, 300);

    return () => {
      service.stop();
    };
  }, [isOpen]);

  const processCommand = (text) => {
    setStatus('processing');
    triggerHaptic('medium');
    
    const parsed = parseVoiceCommand(text);
    setLastResponse(parsed.text);
    speak(parsed.text, true);

    if (parsed.screen) {
      onNavigate(parsed.screen);
      onClose();
    } else {
      setTimeout(() => {
        setStatus('idle');
      }, 1500);
    }
  };

  const handleMicClick = () => {
    triggerHaptic('light');
    stopSpeech();
    if (status === 'listening') {
      sttService?.stop();
    } else {
      setTranscript('');
      setLastResponse('Listening...');
      sttService?.start();
    }
  };

  const handleShortcutClick = (cmdText) => {
    triggerHaptic('light');
    setTranscript(cmdText);
    processCommand(cmdText);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice Assistant Interaction Screen"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* Top Close Bar */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img
            src="/logo.png"
            alt="WellNest Logo"
            style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '8px' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>WellNest Voice AI</span>
        </div>
        <button
          onClick={() => {
            triggerHaptic();
            stopSpeech();
            onClose();
          }}
          aria-label="Close Voice Assistant"
          style={{
            padding: '0.6rem',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-color)'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Central Visual Waveform & Big Mic Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', margin: '2rem 0' }}>
        <button
          onClick={handleMicClick}
          className={`mic-hero-btn ${status === 'listening' ? 'listening' : ''}`}
          aria-label={status === 'listening' ? 'Listening to voice. Tap to stop.' : 'Tap to start voice recognition.'}
          style={{ width: '130px', height: '130px' }}
        >
          <Mic size={48} />
          <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 800 }}>
            {status === 'listening' ? 'LISTENING' : 'TAP TO SPEAK'}
          </span>
        </button>

        {/* Live Audio Spectrum Bars simulation */}
        {status === 'listening' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '30px' }}>
            {[0.4, 0.9, 0.6, 1.0, 0.7, 0.5, 0.8].map((h, i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: `${h * 28}px`,
                  backgroundColor: 'var(--accent-primary)',
                  borderRadius: '3px',
                  animation: `micWave 0.8s ease-in-out infinite alternate ${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Speech Transcript Display */}
        <div style={{
          textAlign: 'center',
          maxWidth: '360px',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          {transcript && (
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontStyle: 'italic',
              background: 'var(--bg-card)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-active)'
            }}>
              "{transcript}"
            </p>
          )}

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--accent-secondary)',
            fontWeight: 600,
            lineHeight: 1.4
          }}>
            {lastResponse}
          </p>
        </div>
      </div>

      {/* Example Command Quick Chips */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
          Or tap a voice command:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            onClick={() => handleShortcutClick('Describe what is around me')}
            aria-label="Voice Command: Describe what is around me"
            style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Compass size={18} color="var(--accent-primary)" />
            <span>"Describe surroundings"</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => handleShortcutClick('Find the nearest hospital')}
            aria-label="Voice Command: Find the nearest hospital"
            style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Hospital size={18} color="var(--danger)" />
            <span>"Find nearest hospital"</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => handleShortcutClick('Read this product label')}
            aria-label="Voice Command: Read this product label"
            style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Scan size={18} color="var(--warning)" />
            <span>"Scan product"</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => handleShortcutClick('Take me to the bus stop')}
            aria-label="Voice Command: Take me to the bus stop"
            style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <MapPin size={18} color="var(--success)" />
            <span>"Take me to bus stop"</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes micWave {
          0% { height: 6px; }
          100% { height: 28px; }
        }
      `}</style>
    </div>
  );
};
