import React, { useState, useEffect } from 'react';
import { Navigation, Eye, ShieldCheck, Volume2, ArrowRight, Check } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';

const SLIDES = [
  {
    id: 1,
    title: 'Travel Independently',
    subtitle: 'GPS Navigation & Bus Assistance',
    description: 'Get step-by-step turn guidance, identify bus numbers using your camera, and locate nearby transit stops, stations, and public places with continuous voice directions.',
    icon: Navigation,
    color: '#3b82f6'
  },
  {
    id: 2,
    title: 'Understand Your Surroundings',
    subtitle: 'AI Scene, Object & Text Scanner',
    description: 'Point your camera around you to identify obstacles, stairs, doors, vehicles, and people. Read signboards, menus, medicine labels, and grocery packages aloud instantly.',
    icon: Eye,
    color: '#10b981'
  },
  {
    id: 3,
    title: 'Stay Safe Anywhere',
    subtitle: 'Emergency SOS & Nearby Hospitals',
    description: 'One-tap SOS emergency contacts broadcast, instant nearby hospital locator, ambulance dispatch support, and accident assistance designed for your peace of mind.',
    icon: ShieldCheck,
    color: '#ef4444'
  }
];

export const Onboarding = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { speak, stopSpeech, triggerHaptic } = useAccessibility();
  const { completeOnboarding } = useAuth();

  const activeSlide = SLIDES[currentIndex];

  useEffect(() => {
    speakCurrentSlide(0);
  }, []);

  const speakCurrentSlide = (idx) => {
    const slide = SLIDES[idx];
    speak(`Slide ${idx + 1} of 3. ${slide.title}. ${slide.description}`, true);
  };

  const handleNext = () => {
    triggerHaptic('light');
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      speakCurrentSlide(nextIdx);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    triggerHaptic();
    handleComplete();
  };

  const handleComplete = () => {
    stopSpeech();
    completeOnboarding();
    speak("Onboarding complete. Welcome to WellNest.", true);
    onFinish();
  };

  const Icon = activeSlide.icon;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.75rem 1.25rem',
        backgroundColor: 'var(--bg-app)',
        textAlign: 'left'
      }}
    >
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          Step {currentIndex + 1} of 3
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => speakCurrentSlide(currentIndex)}
            aria-label="Read slide content aloud"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--accent-primary)',
              fontSize: '0.85rem',
              border: '1px solid var(--border-color)'
            }}
          >
            <Volume2 size={18} />
            <span>Read</span>
          </button>

          <button
            onClick={handleSkip}
            aria-label="Skip Onboarding"
            style={{
              padding: '0.4rem 0.75rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            Skip
          </button>
        </div>
      </div>

      {/* Main Slide Illustration & Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '2rem 0' }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: `${activeSlide.color}20`,
          border: `3px solid ${activeSlide.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeSlide.color
        }}>
          <Icon size={48} />
        </div>

        <div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            color: activeSlide.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {activeSlide.subtitle}
          </span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginTop: '0.25rem', fontWeight: 800 }}>
            {activeSlide.title}
          </h2>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            marginTop: '0.75rem',
            lineHeight: 1.6
          }}>
            {activeSlide.description}
          </p>
        </div>
      </div>

      {/* Footer Navigation & Slide Dots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? '28px' : '10px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: i === currentIndex ? 'var(--accent-primary)' : 'var(--border-color)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={handleNext}
          aria-label={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next Onboarding Screen'}
          style={{ width: '100%', justifyContent: 'center', fontSize: '1.15rem' }}
        >
          <span>{currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}</span>
          {currentIndex === SLIDES.length - 1 ? <Check size={22} /> : <ArrowRight size={22} />}
        </button>
      </div>
    </div>
  );
};
