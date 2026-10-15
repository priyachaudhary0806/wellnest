import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { locationService } from '../services/locationService';
import { emailService } from '../services/emailService';
import { AlertTriangle, Phone, CheckCircle2, Users, X, MapPin, Mail, AlertCircle } from 'lucide-react';

/**
 * Emergency SOS Screen
 * Sends live GPS location alerts via:
 * 1. Email directly to saved Guardian Email via backend Nodemailer.
 * 2. Pre-filled native SMS intent.
 */
export const EmergencySOS = ({ onNavigate }) => {
  const { emergencyContacts, addEmergencyContact, editEmergencyContact, user } = useAuth();
  const { speak, stopSpeech, triggerHaptic } = useAccessibility();

  const [countdown, setCountdown] = useState(null);
  const [sosState, setSosState] = useState('idle'); // idle | counting | dispatching | sent | failed
  const [sendResult, setSendResult] = useState(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const countdownRef = useRef(null);

  const primaryContact = emergencyContacts?.[0] || {
    id: 'ec-primary',
    name: 'Emergency Contact',
    phone: '+91 9870623857',
    email: 'chaudharypriya9313@gmail.com',
    relationship: 'Primary'
  };

  useEffect(() => {
    window.__currentScreen = 'emergency';

    const handleVoiceCmd = (e) => {
      const { intent } = e.detail || {};
      if (intent === 'TRIGGER_SOS') handleStartSos();
      if (intent === 'CANCEL_SOS') handleCancelSos();
    };

    window.addEventListener('wellnest-voice-cmd', handleVoiceCmd);
    return () => {
      window.removeEventListener('wellnest-voice-cmd', handleVoiceCmd);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Countdown tick
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      triggerHaptic('warning');
      speak(`${countdown}`, true);
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else {
      // Countdown reached zero — dispatch SOS
      dispatchSos();
    }

    return () => clearTimeout(countdownRef.current);
  }, [countdown]);

  const handleStartSos = () => {
    if (sosState !== 'idle') return;
    triggerHaptic('heavy');
    setSosState('counting');
    setSendResult(null);
    setCountdown(5);
    speak('Emergency SOS starting in 5 seconds. Say cancel SOS to stop.', true);
  };

  const handleCancelSos = () => {
    if (countdownRef.current) clearTimeout(countdownRef.current);
    setCountdown(null);
    setSosState('idle');
    setSendResult(null);
    stopSpeech();
    triggerHaptic('light');
    speak('Emergency SOS cancelled.', true);
  };

  const dispatchSos = async () => {
    setCountdown(null);
    setSosState('dispatching');
    triggerHaptic('warning');

    // Get real GPS location
    let loc = null;
    try {
      loc = await locationService.getCurrentLocation();
    } catch {
      loc = { lat: 0, lng: 0, address: 'Location unavailable' };
    }

    const targetPhone = primaryContact.phone;
    const targetName = primaryContact.name;
    const targetEmail = primaryContact.email || 'chaudharypriya9313@gmail.com';
    const senderName = user?.fullName || 'WellNest User';
    const timestamp = new Date().toLocaleString();
    const mapsLink = (loc.lat && loc.lng)
      ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
      : 'GPS unavailable';

    const messageBody =
      `🚨 EMERGENCY SOS from ${senderName}\n` +
      `Time: ${timestamp}\n` +
      `Location: ${loc.address || 'See GPS link'}\n` +
      `GPS: ${mapsLink}\n` +
      `Please respond immediately.`;

    // 1. Send Email to Guardian via backend
    let emailStatus = { success: false, error: null };
    try {
      await emailService.sendSosEmail({
        to: targetEmail,
        senderName,
        phone: targetPhone,
        location: loc,
        message: messageBody
      });
      emailStatus = { success: true, recipient: targetEmail };
    } catch (err) {
      console.warn('[SOS] Email dispatch failed:', err.message);
      emailStatus = { success: false, error: err.message };
    }

    // 2. Build SMS URI — opens native SMS app pre-filled
    const smsUri = `sms:${targetPhone}?body=${encodeURIComponent(messageBody)}`;

    let smsOpened = false;
    try {
      window.location.href = smsUri;
      smsOpened = true;
    } catch (e) {
      console.warn('[SOS] SMS URI failed:', e);
      smsOpened = false;
    }

    await new Promise(r => setTimeout(r, 1200));

    setSosState('sent');
    setSendResult({
      success: true,
      phone: targetPhone,
      name: targetName,
      email: targetEmail,
      emailSent: emailStatus.success,
      emailError: emailStatus.error,
      smsOpened,
      mapsLink,
      message: messageBody
    });

    let voiceMsg = `Emergency SOS triggered! `;
    if (emailStatus.success) {
      voiceMsg += `Email alert sent to guardian ${targetName} at ${targetEmail}. `;
    } else {
      voiceMsg += `Could not send email alert. `;
    }
    if (smsOpened) {
      voiceMsg += `SMS ready on your phone.`;
    }
    speak(voiceMsg, true);
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!editPhone.trim()) return;
    triggerHaptic('medium');

    const updatedData = {
      name: editName,
      phone: editPhone,
      email: editEmail,
      isPrimary: true
    };

    if (emergencyContacts.length > 0) {
      editEmergencyContact(primaryContact.id, updatedData);
    } else {
      addEmergencyContact({ ...updatedData, relationship: 'Guardian / Primary' });
    }

    setIsEditingContact(false);
    speak(`Guardian contact updated. Name ${editName}, phone ${editPhone}, email ${editEmail}`, true);
  };

  const openEditContact = () => {
    setEditName(primaryContact.name);
    setEditPhone(primaryContact.phone);
    setEditEmail(primaryContact.email || 'chaudharypriya9313@gmail.com');
    setIsEditingContact(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', paddingBottom: '2.5rem' }}>

      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--danger)' }}>
          Emergency SOS
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Sends live GPS alerts via Email & SMS to your guardian
        </p>
      </div>

      {/* Emergency contact card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Guardian Emergency Contact</h3>
          </div>
          {!isEditingContact && (
            <button
              onClick={openEditContact}
              style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'none', border: 'none', minHeight: 'auto', padding: '0.25rem' }}
              aria-label="Edit guardian contact details"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingContact ? (
          <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Guardian Name</label>
              <input
                type="text"
                className="form-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                required
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Guardian Email (For SOS Email Alerts)</label>
              <input
                type="email"
                className="form-input"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="guardian@example.com"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Save Guardian Info
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditingContact(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {primaryContact.name}
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              📱 {primaryContact.phone}
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={18} />
              <span>{primaryContact.email || 'chaudharypriya9313@gmail.com'}</span>
            </p>
          </div>
        )}
      </div>

      {/* ── SOS states ───────────────────────────────────────────────────── */}

      {/* Idle — big SOS button */}
      {sosState === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <button
            onClick={handleStartSos}
            className="btn-emergency"
            aria-label="Activate Emergency SOS"
            style={{
              width: '200px', height: '200px',
              borderRadius: '50%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', fontSize: '1.5rem', fontWeight: 900
            }}
          >
            <AlertTriangle size={72} />
            <span>SOS</span>
          </button>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
            Tap or say <strong>"start sos"</strong> to trigger live Email & SMS alert
          </p>
        </div>
      )}

      {/* Counting down */}
      {sosState === 'counting' && (
        <div className="card fade-in" style={{
          textAlign: 'center', padding: '2rem 1.25rem',
          backgroundColor: 'var(--danger-bg)',
          border: '3px solid var(--danger)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem'
        }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>
            DISPATCHING SOS IN...
          </h3>
          <div style={{
            fontSize: '5rem', fontWeight: 900, color: '#ffffff',
            width: '110px', height: '110px', borderRadius: '50%',
            backgroundColor: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {countdown}
          </div>
          <button
            onClick={handleCancelSos}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', padding: '1rem' }}
            aria-label="Cancel SOS"
          >
            <X size={26} color="var(--danger)" />
            <span>Cancel Emergency</span>
          </button>
        </div>
      )}

      {/* Dispatching */}
      {sosState === 'dispatching' && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', border: '2px solid var(--danger)' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>Sending Guardian Email & Opening SMS...</p>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Fetching live GPS coordinates</p>
        </div>
      )}

      {/* Sent — SOS dispatched */}
      {sosState === 'sent' && sendResult && (
        <div className="card fade-in" style={{
          padding: '1.5rem',
          backgroundColor: 'var(--danger-bg)',
          border: '2px solid var(--danger)',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={32} color="var(--danger)" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>
                Emergency SOS Dispatched!
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                Alert sent to guardian {sendResult.name}
              </p>
            </div>
          </div>

          {/* Email result status */}
          <div style={{
            padding: '0.75rem', borderRadius: '8px',
            backgroundColor: sendResult.emailSent ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            border: `1px solid ${sendResult.emailSent ? '#16a34a' : 'var(--danger)'}`,
            display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            {sendResult.emailSent ? (
              <>
                <CheckCircle2 size={20} color="#16a34a" />
                <div>
                  <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>Guardian Email Sent ✓</strong>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                    Delivered to: {sendResult.email}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={20} color="var(--danger)" />
                <div>
                  <strong style={{ color: 'var(--danger)', fontSize: '0.95rem' }}>Email Alert Failed</strong>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                    {sendResult.emailError || 'Configure App Password in backend/.env'}
                  </p>
                </div>
              </>
            )}
          </div>

          {sendResult.mapsLink && sendResult.mapsLink !== 'GPS unavailable' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
              <MapPin size={18} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Live GPS location attached in alert
              </span>
            </div>
          )}

          <button
            className="btn-emergency"
            onClick={() => { window.location.href = `tel:${sendResult.phone}`; }}
            style={{ width: '100%', justifyContent: 'center', minHeight: '56px' }}
            aria-label={`Call ${sendResult.name}`}
          >
            <Phone size={24} />
            <span>Call {sendResult.name}</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => { setSosState('idle'); setSendResult(null); }}
            style={{ width: '100%', justifyContent: 'center' }}
            aria-label="Reset SOS"
          >
            Reset SOS
          </button>
        </div>
      )}
    </div>
  );
};
