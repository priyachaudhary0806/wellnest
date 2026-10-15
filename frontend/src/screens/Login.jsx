import React, { useState, useEffect, useRef } from 'react';
import { Eye, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const Login = ({ onNavigate }) => {
  const { login } = useAuth();
  const { speak, triggerHaptic } = useAccessibility();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const submitFormRef = useRef(null);

  // Focus tracking & Voice Command listener for Login Form
  useEffect(() => {
    window.__currentScreen = 'login';
    window.__activeVoiceField = 'email'; // Default active focus field for voice input

    const handleFormVoiceInput = (e) => {
      const detail = e.detail || {};

      if (detail.intent === 'FORM_FOCUS') {
        if (detail.field === 'email' && emailInputRef.current) {
          emailInputRef.current.focus();
          window.__activeVoiceField = 'email';
          speak("Email field focused.", true);
        } else if (detail.field === 'password' && passwordInputRef.current) {
          passwordInputRef.current.focus();
          window.__activeVoiceField = 'password';
          speak("Password field focused.", true);
        }
      } else if (detail.intent === 'FORM_FILL') {
        if (detail.field === 'email' && detail.value) {
          setEmail(detail.value);
          speak(`Email address entered.`, true);
        } else if (detail.field === 'password' && detail.value) {
          setPassword(detail.value);
          // DO NOT speak actual password back for privacy & security!
          speak("Password entered.", true);
        }
      } else if (detail.intent === 'FORM_SUBMIT' || detail.intent === 'SIGN_IN') {
        if (submitFormRef.current) {
          submitFormRef.current();
        }
      }
    };

    window.addEventListener('wellnest-form-voice-input', handleFormVoiceInput);
    window.addEventListener('aurasight-form-voice-input', handleFormVoiceInput);
    return () => {
      window.removeEventListener('wellnest-form-voice-input', handleFormVoiceInput);
      window.removeEventListener('aurasight-form-voice-input', handleFormVoiceInput);
    };
  }, [speak]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    triggerHaptic('medium');

    if (!email || !email.includes('@')) {
      const err = 'Please enter a valid email address.';
      setError(err);
      speak(err, true);
      return;
    }

    if (!password || password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setError(err);
      speak(err, true);
      return;
    }

    setError('');
    const user = login(email, password);

    speak(`Sign in successful. Welcome, ${user.fullName}`, true);

    setTimeout(() => {
      onNavigate('home');
    }, 800);
  };

  submitFormRef.current = handleSubmit;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem 1.5rem',
        backgroundColor: 'var(--bg-app)'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="WellNest Logo"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.25rem'
            }}
          />
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Sign In
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Welcome back to WellNest
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1.5px solid var(--danger)',
              marginBottom: '1.5rem',
              fontWeight: 700,
              fontSize: '1.05rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              ref={emailInputRef}
              id="login-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onFocus={() => { window.__activeVoiceField = 'email'; }}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              ref={passwordInputRef}
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onFocus={() => { window.__activeVoiceField = 'password'; }}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem' }}>
            <button
              type="button"
              onClick={() => {
                speak("Forgot Password screen");
                onNavigate('forgot_password');
              }}
              style={{ color: 'var(--accent-primary)', fontSize: '1.05rem', fontWeight: 700 }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', minHeight: '56px' }}
          >
            <span>Sign In</span>
            <ArrowRight size={22} />
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Don't have an account?{' '}
          <button
            onClick={() => {
              speak("Create Account screen");
              onNavigate('signup');
            }}
            style={{ color: 'var(--accent-primary)', fontWeight: 800, textDecoration: 'underline' }}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};
