import React from 'react';
import { ArrowLeft, Mic, Eye, User } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';

export const Header = ({ title, showBack = false, onBack, onOpenVoice, currentScreen, onNavigate }) => {
  const { highContrast, setHighContrast, speak, triggerHaptic } = useAccessibility();
  const { user } = useAuth();

  const handleToggleContrast = () => {
    triggerHaptic('light');
    const newVal = !highContrast;
    setHighContrast(newVal);
    speak(newVal ? "High contrast mode enabled" : "Standard mode enabled", true);
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0.875rem 1.25rem',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1.5px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {showBack && (
          <button
            onClick={() => {
              triggerHaptic();
              speak("Going back", true);
              if (onBack) onBack();
              else if (onNavigate) onNavigate('home');
            }}
            aria-label="Go back to previous screen"
            style={{
              width: '42px',
              height: '42px',
              minHeight: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              padding: 0
            }}
          >
            <ArrowLeft size={22} color="var(--text-primary)" />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img
            src="/logo.png"
            alt="WellNest Logo"
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <h2 style={{
            fontSize: '1.35rem',
            color: 'var(--text-primary)',
            margin: 0,
            fontWeight: 800
          }}>
            {title || 'WellNest'}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          onClick={handleToggleContrast}
          aria-label={highContrast ? "Switch to standard mode" : "Switch to high contrast mode"}
          style={{
            width: '42px',
            height: '42px',
            minHeight: '42px',
            borderRadius: '50%',
            backgroundColor: highContrast ? '#ffe600' : 'var(--bg-app)',
            color: highContrast ? '#000000' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: 0
          }}
        >
          <Eye size={22} />
        </button>

        {onNavigate && (
          <button
            onClick={() => {
              triggerHaptic();
              speak("Profile screen");
              onNavigate('profile');
            }}
            aria-label="Open Profile"
            style={{
              width: '42px',
              height: '42px',
              minHeight: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-primary)',
              border: '2px solid var(--border-active)',
              padding: 0,
              fontWeight: 800,
              fontSize: '1.1rem'
            }}
          >
            {user?.fullName ? user.fullName.charAt(0) : <User size={22} />}
          </button>
        )}
      </div>
    </header>
  );
};
