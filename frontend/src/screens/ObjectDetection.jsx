import React, { useState, useEffect } from 'react';
import { CameraFeed } from '../components/CameraFeed';
import { aiVisionService } from '../services/aiVisionService';
import { useAccessibility } from '../context/AccessibilityContext';
import { Camera, Volume2, Pause, Play, CheckCircle2 } from 'lucide-react';

export const ObjectDetection = () => {
  const { speak, triggerHaptic } = useAccessibility();
  const [isScanning, setIsScanning] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState([]);
  const [lastSummary, setLastSummary] = useState('');

  const handleFrameCapture = async (canvas) => {
    triggerHaptic('medium');
    speak("Detecting objects in view...", true);

    const res = await aiVisionService.detectObjects(canvas);
    setDetectedBoxes(res.objects);
    setLastSummary(res.summaryText);

    // Announce detected objects with spatial audio info
    speak(res.summaryText, true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Object Detection
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Identifies objects, people, and obstacles with spatial position & audio alerts.
        </p>
      </div>

      {/* Camera Feed with bounding box overlay */}
      <CameraFeed onFrameCapture={handleFrameCapture} overlays={detectedBoxes} />

      {/* Detection Results */}
      {lastSummary && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', border: '3px solid var(--border-active)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              <CheckCircle2 size={16} /> Live Detected Objects ({detectedBoxes.length})
            </span>

            <button
              onClick={() => {
                triggerHaptic();
                speak(lastSummary, true);
              }}
              className="btn-secondary"
              aria-label="Repeat object announcements"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <Volume2 size={18} color="var(--accent-primary)" />
              <span>Announce</span>
            </button>
          </div>

          <div style={{ backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              "{lastSummary}"
            </p>
          </div>

          {/* List of Detected Objects with Bounding Coordinates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {detectedBoxes.map((obj, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.875rem',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '4px solid var(--warning)'
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    {obj.label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    Confidence: {Math.round(obj.confidence * 100)}%
                  </span>
                </div>
                <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                  {obj.position} • {obj.distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
