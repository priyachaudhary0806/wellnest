import React, { useEffect } from 'react';
import { Mic, Eye, ShoppingBag, Navigation, Hospital, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

const FEATURE_CARDS = [
  {
    id: 'voice',
    title: 'Voice Assistant',
    desc: 'Say any command hands-free',
    icon: Mic,
    color: '#7c3aed',
    isVoice: true
  },
  {
    id: 'surroundings',
    title: 'Describe Around',
    desc: 'AI describes your surroundings live',
    icon: Eye,
    color: '#6d28d9'
  },
  {
    id: 'grocery',
    title: 'Grocery',
    desc: 'Scan products, price & expiry',
    icon: ShoppingBag,
    color: '#8b5cf6'
  },
  {
    id: 'travel',
    title: 'Travel',
    desc: 'GPS & audio navigation',
    icon: Navigation,
    color: '#7c3aed'
  },
  {
    id: 'hospitals',
    title: 'Nearby Hospitals',
    desc: 'Find 24/7 medical care',
    icon: Hospital,
    color: '#dc2626'
  },
  {
    id: 'emergency',
    title: 'Emergency SOS',
    desc: 'Send live location alert',
    icon: AlertTriangle,
    color: '#b91c1c'
  }
];

export const Home = ({ onNavigate, onOpenVoice }) => {
  const { user } = useAuth();
  const { speak, triggerHaptic } = useAccessibility();

  const userName = user?.fullName?.split(' ')[0] || 'there';

  useEffect(() => {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
    speak(
      `${greeting}, ${userName}. Voice assistant is ready. Say describe around, open grocery, or emergency.`,
      false
    );
  }, []);

  const handleCardPress = (card) => {
    triggerHaptic('medium');
    if (card.isVoice) {
      onOpenVoice();
    } else {
      speak(`Opening ${card.title}`, false);
      onNavigate(card.id);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      padding: '1.25rem',
      paddingBottom: '2.5rem'
    }}>

      {/* Greeting */}
      <div style={{ paddingTop: '0.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Hello, {userName} 👋
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Speak a command or choose below
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardPress(card)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardPress(card); }}
              aria-label={`${card.title}. ${card.desc}.`}
              className="card card-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.25rem',
                minHeight: '80px'
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: '56px', height: '56px', flexShrink: 0,
                borderRadius: '50%',
                backgroundColor: `${card.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color
              }}>
                <Icon size={28} />
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  {card.desc}
                </p>
              </div>

              {/* Arrow */}
              <span style={{ color: 'var(--text-muted)', fontSize: '1.4rem', flexShrink: 0 }}>›</span>
            </div>
          );
        })}
      </div>

      {/* Voice hint */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--accent-light)',
        borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--border-color)'
      }}>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.4rem' }}>
          💬 Voice commands you can say:
        </p>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          "Describe around" · "Open grocery" · "Open travel" · "Nearby hospitals" · "Emergency" · "Capture" · "Go back"
        </p>
      </div>

    </div>
  );
};
