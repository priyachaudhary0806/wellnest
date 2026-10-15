import React from 'react';
import { Home, Compass, Mic, Navigation, AlertTriangle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export const BottomNav = ({ activeTab, onSelectTab, onOpenVoice }) => {
  const { speak, triggerHaptic } = useAccessibility();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'voice_center', label: 'Assistant', icon: Mic, isVoiceBtn: true },
    { id: 'travel', label: 'Travel', icon: Navigation },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle, isEmergency: true }
  ];

  const handleTabClick = (tab) => {
    triggerHaptic();
    if (tab.isVoiceBtn) {
      speak("Voice assistant activated", true);
      if (onOpenVoice) onOpenVoice();
    } else {
      speak(`${tab.label} selected`);
      onSelectTab(tab.id);
    }
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1.5px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-around',
        padding: '0.4rem 0.25rem',
        zIndex: 50
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isVoiceBtn) {
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              aria-label="Activate Voice Assistant"
              style={{
                width: '56px',
                height: '56px',
                minHeight: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: '3px solid var(--bg-app)',
                transform: 'translateY(-12px)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <Mic size={26} />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            aria-label={`${tab.label} Tab`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justify: 'center',
              gap: '0.15rem',
              padding: '0.3rem 0',
              color: isActive
                ? (tab.isEmergency ? 'var(--danger)' : 'var(--accent-primary)')
                : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              fontWeight: isActive ? 800 : 600,
              minHeight: '44px'
            }}
          >
            <Icon size={22} color={isActive ? (tab.isEmergency ? 'var(--danger)' : 'var(--accent-primary)') : 'var(--text-secondary)'} />
            <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
