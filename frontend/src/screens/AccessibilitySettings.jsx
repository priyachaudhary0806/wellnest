import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, Volume2, Type, Smartphone } from 'lucide-react';

export const AccessibilitySettings = () => {
  const {
    textSize, setTextSize,
    highContrast, setHighContrast,
    speechSpeed, setSpeechSpeed,
    speechVolume, setSpeechVolume,
    autoSpeech, setAutoSpeech,
    hapticFeedback, setHapticFeedback,
    speak, triggerHaptic
  } = useAccessibility();

  const handleTestSpeech = () => {
    triggerHaptic();
    speak('This is a test of your configured voice feedback speed and volume.', true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', paddingBottom: '2.5rem' }}>

      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Accessibility Settings
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Customize text size, speech feedback and display options
        </p>
      </div>

      {/* High Contrast */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Eye size={28} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>High Contrast Mode</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Yellow & black for low vision</p>
          </div>
        </div>
        <button
          onClick={() => {
            triggerHaptic('medium');
            const next = !highContrast;
            setHighContrast(next);
            speak(next ? 'High contrast enabled' : 'Standard mode enabled', true);
          }}
          style={{
            minWidth: '72px',
            minHeight: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: highContrast ? '#ffe600' : 'var(--bg-card-hover)',
            color: highContrast ? '#000000' : 'var(--text-primary)',
            fontWeight: 800,
            fontSize: '1.1rem',
            border: '2px solid var(--border-color)'
          }}
          aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        >
          {highContrast ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Text Size */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Type size={26} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Text Size</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Scales all labels and buttons</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[
            { id: 'normal', label: 'Normal' },
            { id: 'large', label: 'Large' },
            { id: 'xlarge', label: 'Extra Large' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                triggerHaptic();
                setTextSize(opt.id);
                speak(`Text size set to ${opt.label}`, true);
              }}
              style={{
                padding: '0.75rem 0.4rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                backgroundColor: textSize === opt.id ? 'var(--accent-primary)' : 'var(--bg-app)',
                color: textSize === opt.id ? '#ffffff' : 'var(--text-secondary)',
                border: `2px solid ${textSize === opt.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                minHeight: '48px'
              }}
              aria-label={`Set text size to ${opt.label}`}
              aria-pressed={textSize === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speech Speed */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Volume2 size={26} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Speech Speed</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Current: {speechSpeed}x</p>
            </div>
          </div>
          <button
            onClick={handleTestSpeech}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '1rem', minHeight: '44px' }}
            aria-label="Test speech speed"
          >
            <Volume2 size={18} color="var(--accent-primary)" />
            <span>Test</span>
          </button>
        </div>
        <input
          type="range"
          min="0.5" max="2.0" step="0.25"
          value={speechSpeed}
          onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer', height: '12px' }}
          aria-label={`Speech speed: ${speechSpeed}x`}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          <span>0.5x Slow</span>
          <span>1.0x Normal</span>
          <span>2.0x Fast</span>
        </div>
      </div>

      {/* Speech Volume */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Volume2 size={26} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Speech Volume</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Current: {Math.round(speechVolume * 100)}%</p>
          </div>
        </div>
        <input
          type="range"
          min="0.1" max="1.0" step="0.1"
          value={speechVolume}
          onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer', height: '12px' }}
          aria-label={`Speech volume: ${Math.round(speechVolume * 100)}%`}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          <span>10%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Smartphone size={26} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Feedback Options</h3>
        </div>

        <ToggleRow
          label="Auto Read Screen Text"
          desc="Automatically speaks new screen results"
          checked={autoSpeech}
          onChange={(val) => {
            triggerHaptic();
            setAutoSpeech(val);
            speak(val ? 'Auto speech enabled' : 'Auto speech disabled', true);
          }}
        />

        <ToggleRow
          label="Haptic Vibrations"
          desc="Vibrates on button taps and countdowns"
          checked={hapticFeedback}
          onChange={(val) => {
            triggerHaptic();
            setHapticFeedback(val);
            speak(val ? 'Haptic feedback enabled' : 'Haptic feedback disabled', true);
          }}
        />
      </div>

    </div>
  );
};

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '56px',
          height: '30px',
          borderRadius: '15px',
          backgroundColor: checked ? 'var(--accent-primary)' : '#cbd5e1',
          border: 'none',
          padding: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          transition: 'background-color 0.2s',
          flexShrink: 0,
          minHeight: 'unset'
        }}
        aria-label={`${label}: ${checked ? 'on' : 'off'}`}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );
}
