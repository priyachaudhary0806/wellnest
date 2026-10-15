import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeed } from '../components/CameraFeed';
import { aiVisionService } from '../services/aiVisionService';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ShoppingBag, Camera, Volume2, RefreshCw,
  AlertTriangle, CheckCircle2, MessageCircle, Send
} from 'lucide-react';

/**
 * Grocery Assistant — Grocery/product scanning ONLY.
 * No surroundings detection here.
 * Supports context-aware Q&A after scanning.
 * Flow: Camera → backend /api/vision/grocery → Gemini → product info + TTS
 */
export const GroceryAssistant = () => {
  const { speak, triggerHaptic } = useAccessibility();

  const [isScanning, setIsScanning] = useState(false);
  const [product, setProduct] = useState(null);       // scanned product data
  const [capturedPhoto, setCapturedPhoto] = useState('');

  // Context-aware Q&A state
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);     // [{q, a}]
  const [isAsking, setIsAsking] = useState(false);

  const canvasRef = useRef(null);   // holds the last captured canvas for follow-up Q&A

  useEffect(() => {
    window.__currentScreen = 'grocery';

    const handleVoiceCmd = (e) => {
      const detail = e.detail || {};
      if (detail.intent === 'CAPTURE') {
        triggerScan();
      }
      if (detail.intent === 'ASK_QUESTION' && detail.question) {
        handleAskQuestion(detail.question);
      }
    };

    window.addEventListener('wellnest-voice-cmd', handleVoiceCmd);
    return () => window.removeEventListener('wellnest-voice-cmd', handleVoiceCmd);
  }, []);

  const handleFrameCapture = useCallback((canvas) => {
    canvasRef.current = canvas;
  }, []);

  // ── Scan product ──────────────────────────────────────────────────────────
  const triggerScan = async () => {
    if (isScanning) return;
    if (!canvasRef.current) {
      speak('No camera frame available. Please allow camera access.', true);
      return;
    }

    setIsScanning(true);
    setScanError('');
    setProduct(null);
    setQaHistory([]);
    triggerHaptic('medium');
    const sourceCanvas = canvasRef.current;
const capturedCanvas = document.createElement('canvas');

capturedCanvas.width = sourceCanvas.width;
capturedCanvas.height = sourceCanvas.height;

capturedCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0);
canvasRef.current = capturedCanvas;

setCapturedPhoto(capturedCanvas.toDataURL('image/jpeg', 0.85));

speak('Capturing product now.', true);


    try {
      const data = await aiVisionService.scanGroceryProduct(capturedCanvas);

      if (!data.found) {
        setScanError(
          data.description ||
          'No grocery product detected. Please point the camera at a product label.'
        );
        speak(
          data.description ||
          'I cannot identify a grocery product. Please point the camera at a product.',
          true
        );
        setIsScanning(false);
        return;
      }

      setProduct(data);
      setIsScanning(false);

      // Build spoken summary
      const parts = [];
      if (data.name) parts.push(`This is ${data.name}`);
      if (data.brand && data.brand !== data.name) parts.push(`by ${data.brand}`);
      if (data.price) parts.push(`Price: ${data.price}`);
      if (data.expiryDate) {
        parts.push(data.isExpired
          ? `Warning: expired on ${data.expiryDate}`
          : `Expires: ${data.expiryDate}`);
      }
      if (parts.length === 0) parts.push(data.description || 'Product identified.');

      speak(parts.join('. ') + '.', true);

    } catch (err) {
      setIsScanning(false);
      const msg = err.message.includes('configured')
        ? 'Gemini API key is not configured. Please set it in the backend.'
        : 'Could not scan the product. Check your connection and try again.';
      setScanError(msg);
      speak(msg, true);
    }
  };

  // ── Context-aware Q&A ──────────────────────────────────────────────────────
  const handleAskQuestion = async (q) => {
    const trimmed = (q || question).trim();
    if (!trimmed) return;

    // Agar product scan nahi hua toh pehle scan karo
    if (!canvasRef.current) {
      speak('Please allow camera access first.', true);
      return;
    }

    // Agar scan nahi hua toh pehle scan trigger karo
    if (!product && !isScanning) {
      speak('Let me scan the product first.', true);
      await triggerScan();
      return;
    }

    setIsAsking(true);
    setQuestion('');
    triggerHaptic();
    speak(`Checking: ${trimmed}`, true);

    try {
      const answer = await aiVisionService.askQuestion(canvasRef.current, trimmed, 'grocery');
      setQaHistory(prev => [...prev, { q: trimmed, a: answer }]);
      speak(answer, true);
    } catch (err) {
      const errMsg = 'Could not answer that. Please try again.';
      setQaHistory(prev => [...prev, { q: trimmed, a: errMsg }]);
      speak(errMsg, true);
    }

    setIsAsking(false);
  };

  // ── Quick Q shortcuts ──────────────────────────────────────────────────────
  const quickQuestions = [
    'What is the price?',
    'What is the expiry date?',
    'What are the ingredients?',
    'Is this product safe to eat?',
    'What is this used for?'
  ];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.25rem',
      paddingBottom: '2.5rem'
    }}>

      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Grocery Assistant
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Scan any product label to identify it and ask questions about it
        </p>
      </div>

      {/* Camera */}
      <CameraFeed onFrameCapture={handleFrameCapture} />
{capturedPhoto && (

  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--border-color, #d8c9f0)'
  }}>
    <p style={{
      fontSize: '1.1rem',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }}>
      Captured Product Photo
    </p>
    <img
      src={capturedPhoto}
      alt="Captured grocery product"
      style={{
        width: '100%',
        maxHeight: '300px',
        objectFit: 'contain',
        borderRadius: '8px'
      }}
    />
  </div>
)}

      {/* Scan button */}
      <button
        className="btn-primary"
        onClick={triggerScan}
        disabled={isScanning}
        aria-label="Scan product label"
        style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', minHeight: '58px' }}
      >
        {isScanning
          ? <><RefreshCw size={24} className="spin" /><span>Capturing product...</span></>
          : <><Camera size={24} /><span>Scan Product</span></>
        }
      </button>

      {/* Scan error */}
      {scanError && !isScanning && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#fef2f2',
          border: '2px solid #dc2626',
          borderRadius: 'var(--radius-md)'
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>
            ⚠ {scanError}
          </p>
        </div>
      )}

      {/* Product result */}
      {product && !isScanning && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Status banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            backgroundColor: product.isExpired ? '#fef2f2' : '#f0fdf4',
            border: `2px solid ${product.isExpired ? '#dc2626' : '#16a34a'}`,
            borderRadius: 'var(--radius-md)'
          }}>
            {product.isExpired
              ? <AlertTriangle size={28} color="#dc2626" />
              : <CheckCircle2 size={28} color="#16a34a" />
            }
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: product.isExpired ? '#dc2626' : '#16a34a'
              }}>
                {product.isExpired ? 'EXPIRED — Do not consume' : 'Product identified'}
              </p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                const text = [
                  product.name,
                  product.brand ? `Brand: ${product.brand}` : null,
                  product.price ? `Price: ${product.price}` : null,
                  product.expiryDate ? `Expiry: ${product.expiryDate}` : null
                ].filter(Boolean).join('. ');
                speak(text, true);
              }}
              aria-label="Read product info aloud"
              style={{ padding: '0.5rem', minHeight: '44px', width: '44px' }}
            >
              <Volume2 size={20} color="var(--accent-primary)" />
            </button>
          </div>

          {/* Product details card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Name & brand */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {product.name || 'Unknown product'}
              </h2>
              {product.brand && (
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {product.brand}
                  {product.category ? ` · ${product.category}` : ''}
                  {product.quantity ? ` · ${product.quantity}` : ''}
                </p>
              )}
            </div>

            {/* Key info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.price && <InfoRow label="Price / MRP" value={product.price} highlight />}
              {product.expiryDate && (
                <InfoRow
                  label="Expiry Date"
                  value={product.expiryDate}
                  highlight={product.isExpired}
                  danger={product.isExpired}
                />
              )}
              {product.mfgDate && <InfoRow label="Manufactured" value={product.mfgDate} />}
              {product.description && (
                <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5, paddingTop: '0.25rem' }}>
                  {product.description}
                </p>
              )}
              {product.ingredients && (
                <InfoRow label="Ingredients" value={product.ingredients} />
              )}
              {product.allergens && (
                <InfoRow label="Allergens" value={product.allergens} danger />
              )}
            </div>
          </div>

          {/* Q&A Section */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MessageCircle size={22} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Ask about this product
              </h3>
            </div>

            {/* Quick question chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskQuestion(q)}
                  disabled={isAsking}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent-primary)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    minHeight: '40px',
                    cursor: isAsking ? 'not-allowed' : 'pointer'
                  }}
                  aria-label={`Ask: ${q}`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Custom question input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type or say your question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAskQuestion(question); }}
                disabled={isAsking}
                style={{ flex: 1, minHeight: '52px', fontSize: '1.05rem' }}
                aria-label="Ask a question about this product"
              />
              <button
                className="btn-primary"
                onClick={() => handleAskQuestion(question)}
                disabled={isAsking || !question.trim()}
                style={{ minHeight: '52px', padding: '0 1rem' }}
                aria-label="Submit question"
              >
                {isAsking
                  ? <RefreshCw size={20} className="spin" />
                  : <Send size={20} />
                }
              </button>
            </div>

            {/* Q&A history */}
            {qaHistory.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                {qaHistory.map((item, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem',
                    borderLeft: '4px solid var(--accent-primary)'
                  }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Q: {item.q}
                    </p>
                    <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {item.a}
                    </p>
                    <button
                      onClick={() => speak(item.a, true)}
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        minHeight: 'unset',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                      aria-label="Repeat answer"
                    >
                      <Volume2 size={16} />
                      Repeat answer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rescan button */}
          <button
            className="btn-secondary"
            onClick={() => { setProduct(null); setScanError(''); setQaHistory([]); }}
            style={{ width: '100%', justifyContent: 'center', fontSize: '1.05rem' }}
            aria-label="Scan a different product"
          >
            <RefreshCw size={20} />
            <span>Scan Different Product</span>
          </button>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Small helper component ────────────────────────────────────────────────────
function InfoRow({ label, value, highlight = false, danger = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '0.5rem',
      padding: '0.5rem 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: danger ? '#dc2626' : highlight ? 'var(--accent-primary)' : 'var(--text-primary)',
        textAlign: 'right'
      }}>
        {value}
      </span>
    </div>
  );
}
