import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { User, Mail, Phone, Settings, Users, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';

export const Profile = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { speak, triggerHaptic } = useAccessibility();

  const handleLogout = () => {
    triggerHaptic('medium');
    speak("Logged out successfully.", true);
    logout();
    onNavigate('login');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Personal Profile
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage your account, emergency preferences & accessibility settings.
        </p>
      </div>

      {/* User Info Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 800,
          boxShadow: '0 6px 16px var(--mic-glow)'
        }}>
          {user?.fullName ? user.fullName.charAt(0) : 'A'}
        </div>

        <div>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            {user?.fullName || 'Alex Morgan'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {user?.email || 'alex.morgan@accessibility.org'}
          </p>
          <span className="badge badge-success" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            Verified Accessibility Profile
          </span>
        </div>
      </div>

      {/* Profile Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div
          className="card card-interactive"
          onClick={() => {
            speak("Opening Accessibility Settings");
            onNavigate('settings');
          }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Settings size={24} color="var(--accent-primary)" />
            <div>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Accessibility Settings</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Text size, contrast, speech speed & haptics</p>
            </div>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" />
        </div>

        <div
          className="card card-interactive"
          onClick={() => {
            speak("Opening Emergency Contacts");
            onNavigate('emergency_contacts');
          }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users size={24} color="var(--danger)" />
            <div>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Emergency Contacts</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage your SOS alert phone numbers</p>
            </div>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" />
        </div>

        <div
          className="card card-interactive"
          onClick={handleLogout}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', borderColor: 'var(--danger-bg)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LogOut size={24} color="var(--danger)" />
            <div>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--danger)', fontWeight: 800 }}>Log Out</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign out of your session</p>
            </div>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
};
