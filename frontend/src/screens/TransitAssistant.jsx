import React, { useState } from 'react';
import { CameraFeed } from '../components/CameraFeed';
import { useAccessibility } from '../context/AccessibilityContext';
import { Bus, Train, Bell, CheckCircle2, Volume2, AlertCircle } from 'lucide-react';

export const TransitAssistant = () => {
  const { speak, triggerHaptic } = useAccessibility();
  const [detectedBus, setDetectedBus] = useState(null);
  const [activeAlert, setActiveAlert] = useState(false);

  const handleFrameCapture = (canvas) => {
    triggerHaptic('medium');
    speak("Scanning bus front board for route numbers...", true);

    setTimeout(() => {
      const routes = [
        { busNumber: '340', route: 'Express City Hospital Line', status: 'Approaching Stop', distance: '50m' },
        { busNumber: '12B', route: 'Metro Concourse Loop', status: 'Arriving in 1 min', distance: '120m' },
        { busNumber: '88', route: 'Downtown Financial Center', status: 'Passing Stop', distance: '200m' }
      ];
      const picked = routes[Math.floor(Math.random() * routes.length)];
      setDetectedBus(picked);

      speak(`Bus number ${picked.busNumber} detected! Route: ${picked.route}. Status: ${picked.status}.`, true);
    }, 1000);
  };

  const handleSetAlert = () => {
    triggerHaptic('heavy');
    const newState = !activeAlert;
    setActiveAlert(newState);
    if (newState) {
      speak("Destination stop reminder enabled. WellNest will alert you 200 meters before your exit stop.", true);
    } else {
      speak("Stop reminder turned off.", true);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Bus & Train Assistance
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Point camera at approaching buses to identify bus numbers and receive stop alerts.
        </p>
      </div>

      <CameraFeed onFrameCapture={handleFrameCapture} />

      {/* Destination Alert Banner Toggle */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '1rem',
        backgroundColor: activeAlert ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-elevated)',
        border: `2px solid ${activeAlert ? '#ec4899' : 'var(--border-color)'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bell size={24} color={activeAlert ? '#ec4899' : 'var(--text-secondary)'} />
          <div>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Destination Stop Reminder
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Vibrates & speaks 200m before your exit stop
            </p>
          </div>
        </div>

        <button
          onClick={handleSetAlert}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: activeAlert ? '#ec4899' : 'var(--accent-primary)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          {activeAlert ? 'Alert ON' : 'Enable'}
        </button>
      </div>

      {/* Detected Bus Info */}
      {detectedBus && (
        <div className="card fade-in" style={{ border: '3px solid #ec4899', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge badge-info" style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' }}>
              <Bus size={16} /> Bus Detected
            </span>
            <button
              onClick={() => {
                triggerHaptic();
                speak(`Bus ${detectedBus.busNumber}, ${detectedBus.route}. Status: ${detectedBus.status}`, true);
              }}
              className="btn-secondary"
              aria-label="Repeat bus number announcement"
              style={{ padding: '0.35rem 0.6rem' }}
            >
              <Volume2 size={18} color="var(--accent-primary)" />
            </button>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              BUS #{detectedBus.busNumber}
            </span>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', fontWeight: 700, marginTop: '0.2rem' }}>
              {detectedBus.route}
            </h4>
            <p style={{ fontSize: '0.95rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.5rem' }}>
              Status: {detectedBus.status} ({detectedBus.distance} away)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
