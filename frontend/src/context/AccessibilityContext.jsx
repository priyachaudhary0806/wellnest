import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [textSize, setTextSize] = useState(() => localStorage.getItem('aurasight_textSize') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('aurasight_highContrast') === 'true');
  const [speechSpeed, setSpeechSpeed] = useState(() => parseFloat(localStorage.getItem('aurasight_speechSpeed')) || 1.0);
  const [speechVolume, setSpeechVolume] = useState(() => parseFloat(localStorage.getItem('aurasight_speechVolume')) || 1.0);
  const [autoSpeech, setAutoSpeech] = useState(() => localStorage.getItem('aurasight_autoSpeech') !== 'false');
  const [hapticFeedback, setHapticFeedback] = useState(() => localStorage.getItem('aurasight_haptic') !== 'false');
  const [theme, setTheme] = useState(() => localStorage.getItem('aurasight_theme') || 'dark');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const body = document.body;
    
    if (highContrast) body.classList.add('high-contrast');
    else body.classList.remove('high-contrast');

    body.classList.remove('text-size-large', 'text-size-xlarge');
    if (textSize === 'large') body.classList.add('text-size-large');
    if (textSize === 'xlarge') body.classList.add('text-size-xlarge');

    body.classList.remove('light-theme', 'oled-theme');
    if (theme === 'light') body.classList.add('light-theme');
    if (theme === 'oled') body.classList.add('oled-theme');

    localStorage.setItem('aurasight_textSize', textSize);
    localStorage.setItem('aurasight_highContrast', highContrast);
    localStorage.setItem('aurasight_speechSpeed', speechSpeed.toString());
    localStorage.setItem('aurasight_speechVolume', speechVolume.toString());
    localStorage.setItem('aurasight_autoSpeech', autoSpeech);
    localStorage.setItem('aurasight_haptic', hapticFeedback);
    localStorage.setItem('aurasight_theme', theme);
  }, [textSize, highContrast, speechSpeed, speechVolume, autoSpeech, hapticFeedback, theme]);

  /**
   * Speak function with explicit TTS global flags & event dispatching
   */
  const speak = async (text, force = false, onFinish = null) => {
    if (!text) { if (onFinish) onFinish(); return; }
    if (!force && !autoSpeech) { if (onFinish) onFinish(); return; }

    // Web Speech Synthesis works for TTS output in Android WebView
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechSpeed;
      utterance.volume = speechVolume;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                           voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        window.__isTTSSpeaking = true;
        // Stop mic completely while TTS is speaking
        if (window.__sttService) {
          try { window.__sttService._recognition?.stop(); } catch {}
        }
      };

      const handleEnd = () => {
        setIsSpeaking(false);
        window.__isTTSSpeaking = false;
        window.dispatchEvent(new CustomEvent('wellnest-tts-ended'));
        window.dispatchEvent(new CustomEvent('aurasight-tts-ended'));
        if (onFinish) onFinish();
      };
      utterance.onend = handleEnd;
      utterance.onerror = (e) => { console.warn('SpeechSynthesis error:', e); handleEnd(); };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onFinish) onFinish();
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    window.__isTTSSpeaking = false;
    window.dispatchEvent(new CustomEvent('wellnest-tts-ended'));
    window.dispatchEvent(new CustomEvent('aurasight-tts-ended'));
  };

  const triggerHaptic = (type = 'light') => {
    if (!hapticFeedback) return;
    if (navigator.vibrate) {
      if (type === 'heavy') navigator.vibrate([100, 50, 100]);
      else if (type === 'warning') navigator.vibrate([200, 100, 200, 100, 200]);
      else navigator.vibrate(40);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        speechSpeed,
        setSpeechSpeed,
        speechVolume,
        setSpeechVolume,
        autoSpeech,
        setAutoSpeech,
        hapticFeedback,
        setHapticFeedback,
        theme,
        setTheme,
        isSpeaking,
        speak,
        stopSpeech,
        triggerHaptic
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
