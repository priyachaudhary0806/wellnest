import React, { useState, useEffect, useRef } from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const SignUp = ({ onNavigate }) => {
  const { signup } = useAuth();
  const { speak, triggerHaptic } = useAccessibility();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const submitFormRef = useRef(null);

  useEffect(() => {
    window.__currentScreen = 'signup';
    window.__activeVoiceField = 'fullName';

    const handleFormVoiceInput = (e) => {
      const detail = e.detail || {};

      if (detail.intent === 'FORM_FOCUS') {
        if (detail.field === 'fullName' && nameRef.current) {
          nameRef.current.focus();
          window.__activeVoiceField = 'fullName';
          speak("Full name field focused.", true);
        } else if (detail.field === 'email' && emailRef.current) {
          emailRef.current.focus();
          window.__activeVoiceField = 'email';
          speak("Email field focused.", true);
        } else if (detail.field === 'phone' && phoneRef.current) {
          phoneRef.current.focus();
          window.__activeVoiceField = 'phone';
          speak("Phone field focused.", true);
        } else if (detail.field === 'password' && passwordRef.current) {
          passwordRef.current.focus();
          window.__activeVoiceField = 'password';
          speak("Password field focused.", true);
        }
      } else if (detail.intent === 'FORM_FILL') {
        if (detail.field === 'fullName' && detail.value) {
          setFullName(detail.value);
          speak(`Name set to ${detail.value}`, true);
        } else if (detail.field === 'email' && detail.value) {
          setEmail(detail.value);
          speak(`Email set to ${detail.value}`, true);
        } else if (detail.field === 'phone' && detail.value) {
          setPhone(detail.value);
          speak(`Phone set to ${detail.value}`, true);
        } else if (detail.field === 'password' && detail.value) {
          setPassword(detail.value);
          speak("Password entered.", true);
        }
      } else if (detail.intent === 'FORM_SUBMIT' || detail.intent === 'SIGN_UP') {
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

    if (!fullName.trim()) {
      const err = 'Please enter your full name.';
      setError(err);
      speak(err, true);
      return;
    }

    if (!email || !email.includes('@')) {
      const err = 'Please enter a valid email address.';
      setError(err);
      speak(err, true);
      return;
    }

    if (!phone || phone.length < 8) {
      const err = 'Please enter a valid phone number.';
      setError(err);
      speak(err, true);
      return;
    }

    if (password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setError(err);
      speak(err, true);
      return;
    }

    setError('');
    const user = signup({ fullName, email, phone, password });

    speak(`Account created successfully. Welcome, ${user.fullName}`, true);

    setTimeout(() => {
      onNavigate('home');
    }, 1000);
  };

  submitFormRef.current = handleSubmit;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg-app)'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <img
            src="/logo.png"
            alt="WellNest Logo"
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.25rem'
            }}
          />
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Create Account
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Join WellNest Accessibility Companion
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
              marginBottom: '1.25rem',
              fontWeight: 700,
              fontSize: '1.05rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <input
              ref={nameRef}
              id="signup-name"
              type="text"
              className="form-input"
              placeholder="Full name"
              value={fullName}
              onFocus={() => { window.__activeVoiceField = 'fullName'; }}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <input
              ref={emailRef}
              id="signup-email"
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
            <label className="form-label" htmlFor="signup-phone">Phone Number (For SOS)</label>
            <input
              ref={phoneRef}
              id="signup-phone"
              type="tel"
              className="form-input"
              placeholder="Phone number"
              value={phone}
              onFocus={() => { window.__activeVoiceField = 'phone'; }}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              ref={passwordRef}
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onFocus={() => { window.__activeVoiceField = 'password'; }}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', marginTop: '0.75rem', minHeight: '56px' }}
          >
            <span>Create Account</span>
            <ArrowRight size={22} />
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Already have an account?{' '}
          <button
            onClick={() => {
              speak("Sign In screen");
              onNavigate('login');
            }}
            style={{ color: 'var(--accent-primary)', fontWeight: 800, textDecoration: 'underline' }}
          >
            Sign In Here
          </button>
        </p>
      </div>
    </div>
  );
};
