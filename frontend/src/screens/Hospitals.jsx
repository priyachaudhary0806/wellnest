import React, { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';
import { useAccessibility } from '../context/AccessibilityContext';
import { Phone, Navigation, Share2, Ambulance, Volume2, ShieldAlert } from 'lucide-react';

export const Hospitals = ({ onNavigate }) => {
  const { speak, triggerHaptic } = useAccessibility();
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    const list = locationService.getNearbyPlaces('hospitals');
    setHospitals(list);
    speak(`Found ${list.length} nearby hospitals. Nearest is ${list[0]?.name}, ${list[0]?.distanceKm} kilometers away.`, true);
  }, []);

  const handleCall = (phone, name) => {
    triggerHaptic('heavy');
    speak(`Calling ${name} at ${phone}`, true);
    window.location.href = `tel:${phone}`;
  };

  const handleShareLocation = () => {
    triggerHaptic('medium');
    const msg = "Emergency Location Share: ABESIT Campus area, Ghaziabad, UP.";
    if (navigator.share) {
      navigator.share({ title: 'WellNest Live Location', text: msg });
    } else {
      navigator.clipboard.writeText(msg);
      speak("Emergency location copied to clipboard for sharing.", true);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', paddingBottom: '2.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Nearby Hospitals
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Find 24/7 emergency care & trauma centers nearby
        </p>
      </div>

      {/* Notice Banner */}
      <div style={{
        backgroundColor: 'var(--accent-light)',
        border: '1.5px solid var(--border-color)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem'
      }}>
        <ShieldAlert size={28} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          WellNest assists with location & emergency hospital contacts. Dial 102/112 for ambulance.
        </p>
      </div>

      {/* Emergency Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button
          className="btn-emergency"
          onClick={() => handleCall('102', 'Ambulance Dispatch')}
          aria-label="Call 102 Ambulance Dispatch Services"
          style={{ padding: '0.875rem', fontSize: '1.1rem', justifyContent: 'center' }}
        >
          <Ambulance size={24} />
          <span>Call 102</span>
        </button>

        <button
          className="btn-secondary"
          onClick={handleShareLocation}
          aria-label="Share current GPS location"
          style={{ padding: '0.875rem', fontSize: '1.05rem', justifyContent: 'center' }}
        >
          <Share2 size={22} color="var(--accent-primary)" />
          <span>Share Location</span>
        </button>
      </div>

      {/* Hospitals List */}
      <div>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.75rem' }}>
          Hospitals Near ABESIT Ghaziabad ({hospitals.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    {hosp.name}
                  </h4>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {hosp.address}
                  </p>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic();
                    speak(`${hosp.name}, ${hosp.distanceKm} kilometers away. Travel time ${hosp.etaMinutes} minutes.`, true);
                  }}
                  className="btn-secondary"
                  aria-label="Read hospital details aloud"
                  style={{ padding: '0.5rem' }}
                >
                  <Volume2 size={20} color="var(--accent-primary)" />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                <span>Distance: {hosp.distanceKm} km</span>
                <span>ETA: ~{hosp.etaMinutes} mins</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => handleCall(hosp.phone, hosp.name)}
                  aria-label={`Call ${hosp.name}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '1.05rem' }}
                >
                  <Phone size={20} />
                  <span>Call</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    speak(`Navigating to ${hosp.name}`);
                    onNavigate('travel');
                  }}
                  aria-label={`Navigate to ${hosp.name}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '1.05rem' }}
                >
                  <Navigation size={20} color="var(--accent-primary)" />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
