import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { emailService } from '../services/emailService';

export const ForgotPassword = ({ onNavigate }) => {
  const { speak, triggerHaptic } = useAccessibility();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef(null);
  const submitFormRef = useRef(null);

  useEffect(() => {
    window.__currentScreen = 'forgot_password';
    window.__activeVoiceField = 'email';

    const handleFormVoiceInput = (e) => {
      const detail = e.detail || {};
      if (detail.intent === 'FORM_FOCUS' && detail.field === 'email' && emailRef.current) {
        emailRef.current.focus();
        speak("Email field focused.", true);
      } else if (detail.intent === 'FORM_FILL' && detail.field === 'email' && detail.value) {
        setEmail(detail.value);
        speak(`Email address set to ${detail.value}`, true);
      } else if (detail.intent === 'FORM_SUBMIT') {
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

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    triggerHaptic('medium');

    if (!email || !email.includes('@')) {
      speak("Please enter a valid email address.", true);
      return;
    }

    await emailService.sendResetPasswordEmail(email);
    setSubmitted(true);
    speak(`Password recovery instructions email sent to ${email}. Check your inbox.`, true);
  };

  submitFormRef.current = handleSubmit;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.25rem',
        backgroundColor: 'var(--bg-app)'
      }}
    >
      <div>
        <button
          onClick={() => onNavigate('login')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginBottom: '1.5rem', fontWeight: 700 }}
        >
          <ArrowLeft size={20} />
          <span>Back to Sign In</span>
        </button>

        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Reset Password
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.4rem', marginBottom: '1.5rem' }}>
          Enter your registered email address to receive password recovery instructions via email.
        </p>

        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>Reset Email Dispatched</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              We dispatched password recovery instructions to <strong>{email}</strong>. Please check your inbox.
            </p>
            <button
              className="btn-primary"
              onClick={() => onNavigate('login')}
              style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Email Address</label>
              <input
                ref={emailRef}
                id="forgot-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onFocus={() => { window.__activeVoiceField = 'email'; }}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', marginTop: '1rem' }}
            >
              Send Reset Instructions Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
