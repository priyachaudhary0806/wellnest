import React, { useEffect } from 'react';
import { Eye, Sparkles } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export const Splash = ({ onFinish }) => {
  const { speak } = useAccessibility();

  useEffect(() => {
    speak("Welcome to WellNest. Your intelligent personal accessibility companion.", true);

    const timer = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--bg-app)',
        textAlign: 'center',
        gap: '1.5rem'
      }}
    >
      <div style={{
        width: '130px',
        height: '130px',
        borderRadius: '28px',
        backgroundColor: 'var(--bg-card)',
        padding: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 32px rgba(16, 185, 129, 0.25)',
        border: '2px solid var(--border-active)',
        animation: 'sosPulse 2s infinite'
      }}>
        <img
          src="/logo.png"
          alt="WellNest Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '18px' }}
        />
      </div>

      <div>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          WellNest
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--accent-secondary)', fontWeight: 600, marginTop: '0.4rem' }}>
          Personal Accessibility Companion
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
        <Sparkles size={18} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Powered by Voice & AI Vision</span>
      </div>
    </div>
  );
};
