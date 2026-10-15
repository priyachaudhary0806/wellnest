import React from 'react';
import { Eye, Camera, Scan, ShoppingBag, Bus, Hospital, Navigation, Sparkles } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export const Explore = ({ onNavigate }) => {
  const { speak, triggerHaptic } = useAccessibility();

  const exploreTools = [
    {
      id: 'surroundings',
      title: 'Describe Surroundings',
      desc: 'AI Scene & Hazards',
      icon: Eye,
      color: '#2563eb',
      badge: 'Vision AI'
    },
    {
      id: 'objects',
      title: 'Object Detection',
      desc: 'Spatial Audio Alerts',
      icon: Camera,
      color: '#16a34a',
      badge: 'Live Audio'
    },
    {
      id: 'ocr',
      title: 'Text Reader / OCR',
      desc: 'Signs, Menus & Labels',
      icon: Scan,
      color: '#d97706',
      badge: 'OCR Read'
    },
    {
      id: 'grocery',
      title: 'Grocery Assistant',
      desc: 'Expiry Date Scanner',
      icon: ShoppingBag,
      color: '#9333ea',
      badge: 'Expiry Check'
    },
    {
      id: 'transit',
      title: 'Bus & Train',
      desc: 'Bus 340 & Stop Alerts',
      icon: Bus,
      color: '#db2777',
      badge: 'Transit'
    },
    {
      id: 'hospitals',
      title: 'Nearby Hospitals',
      desc: '24/7 Trauma Care',
      icon: Hospital,
      color: '#dc2626',
      badge: 'Emergency'
    }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
          <Sparkles size={18} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Vision AI Hub</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.2rem' }}>
          Explore AI Tools
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Select an AI vision tool box to start camera scanning.
        </p>
      </div>

      {/* 2-Column Small Box Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.875rem'
      }}>
        {exploreTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => {
                triggerHaptic();
                speak(`Opening ${tool.title}`);
                onNavigate(tool.id);
              }}
              className="card card-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                padding: '1rem',
                gap: '0.75rem',
                minHeight: '135px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: `${tool.color}15`,
                  border: `2px solid ${tool.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tool.color
                }}>
                  <Icon size={22} />
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                  {tool.badge}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.25 }}>
                  {tool.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {tool.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
