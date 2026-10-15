import React, { useState, useEffect, useRef } from 'react';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { SpeechRecognitionService, parseVoiceCommand } from './services/sttService';
import { permissionService } from './services/permissionService';
import { Mic, MicOff } from 'lucide-react';

// Screens
import { Splash } from './screens/Splash';
import { Onboarding } from './screens/Onboarding';
import { Login } from './screens/Login';
import { SignUp } from './screens/SignUp';
import { ForgotPassword } from './screens/ForgotPassword';
import { Home } from './screens/Home';
import { Explore } from './screens/Explore';
import { DescribeSurroundings } from './screens/DescribeSurroundings';
import { ObjectDetection } from './screens/ObjectDetection';
import { TextReader } from './screens/TextReader';
import { GroceryAssistant } from './screens/GroceryAssistant';
import { TravelAssistant } from './screens/TravelAssistant';
import { TransitAssistant } from './screens/TransitAssistant';
import { Hospitals } from './screens/Hospitals';
import { EmergencySOS } from './screens/EmergencySOS';
import { EmergencyContacts } from './screens/EmergencyContacts';
import { Profile } from './screens/Profile';
import { AccessibilitySettings } from './screens/AccessibilitySettings';

const AppContent = () => {
  const { user, hasCompletedOnboarding, logout } = useAuth();
  const { speak, isSpeaking, stopSpeech } = useAccessibility();

  const [currentScreen, setCurrentScreen] = useState('splash');
  const [screenHistory, setScreenHistory] = useState(['splash']);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [recognizedText, setRecognizedText] = useState('');

  const sttServiceRef = useRef(null);
  const currentScreenRef = useRef(currentScreen);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
    window.__currentScreen = currentScreen;
  }, [currentScreen]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const navigateTo = (screenId) => {
    if (!screenId || screenId === currentScreenRef.current) return;
    setScreenHistory(prev => [...prev, screenId]);
    setCurrentScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    setScreenHistory(prev => {
      if (prev.length > 1) {
        const next = [...prev];
        next.pop();
        const dest = next[next.length - 1];
        setCurrentScreen(dest);
        return next;
      }
      setCurrentScreen('home');
      return ['home'];
    });
  };

  // ── Request permissions on first real screen ─────────────────────────────
  const requestPermissions = async () => {
    const result = await permissionService.requestAppPermissions();
    if (result.micPermanentlyDenied || result.cameraPermanentlyDenied) {
      const denied = [];
      if (result.cameraPermanentlyDenied) denied.push('Camera');
      if (result.micPermanentlyDenied) denied.push('Microphone');
      speak(
        `${denied.join(' and ')} permission was permanently denied. Please enable it in your phone Settings under Apps, WellNest, Permissions.`,
        true
      );
    }
    return result;
  };

  // ── STT initialization ───────────────────────────────────────────────────
  const lastCommandRef = useRef({ text: '', time: 0 });

  useEffect(() => {
    const service = new SpeechRecognitionService({
      lang: 'en-IN',
      onStatus: (status) => setVoiceStatus(status),
      onPartialResult: (text) => setRecognizedText(text),
      onResult: (finalText) => {
        setVoiceStatus('processing');

        // ── Noise / duplicate filter ─────────────────────────────────────
        const clean = finalText.trim().toLowerCase();

        // Ignore very short gibberish (1 char or less)
        if (clean.length <= 1) return;

        // Ignore duplicate command within 3 seconds
        const now = Date.now();
        if (clean === lastCommandRef.current.text && now - lastCommandRef.current.time < 3000) {
          console.log('[STT] Duplicate ignored:', clean);
          return;
        }
        lastCommandRef.current = { text: clean, time: now };

        // Ignore while TTS is speaking
        if (window.__isTTSSpeaking) {
          console.log('[STT] Ignored during TTS:', clean);
          return;
        }

        setRecognizedText(finalText);

        const parsed = parseVoiceCommand(finalText, {
          currentScreen: currentScreenRef.current,
          activeField: window.__activeVoiceField
        });

        if (!parsed) return;

        // Password privacy
        if (parsed.isPassword) setRecognizedText('••••••••');

        // Stop mic during processing to avoid echo
        service.autoRestart = false;
        if (service._recognition && service.isListening) {
          try { service._recognition.stop(); } catch {}
        }

        // Dispatch to screen-level listeners
        if (parsed.customEvent) {
          window.dispatchEvent(new CustomEvent(parsed.customEvent, { detail: parsed }));
        }

        // Global actions
        if (parsed.action === 'logout') logout();
        if (parsed.action === 'go_back') handleGoBack();
        if (parsed.screen) navigateTo(parsed.screen);

        // Speak feedback — mic restarts after TTS ends
        const ttsText = parsed.isPassword ? 'Password entered.' : parsed.text;
        speak(ttsText, true, () => {
          // Restart mic after TTS finishes speaking
          setTimeout(() => {
            service.autoRestart = true;
            service._stopped = false;
            service.start();
          }, 500);
        });
      },
      onError: () => {
        setVoiceStatus('idle');
      }
    });

    sttServiceRef.current = service;
    window.__sttService = service; // Global reference for TTS sync

    // Start mic after a short delay
    const startTimer = setTimeout(() => {
      if (sttServiceRef.current) sttServiceRef.current.start();
    }, 800);

    return () => {
      clearTimeout(startTimer);
      service.stop();
    };
  }, [logout]);

  // ── Restart mic after TTS finishes ──────────────────────────────────────
  useEffect(() => {
    const onTTSEnded = () => {
      setTimeout(() => {
        if (sttServiceRef.current) sttServiceRef.current.resumeAutoListen();
      }, 350);
    };
    window.addEventListener('wellnest-tts-ended', onTTSEnded);
    return () => window.removeEventListener('wellnest-tts-ended', onTTSEnded);
  }, []);

  // ── Splash / Onboarding finish ───────────────────────────────────────────
  const handleSplashFinish = async () => {
    await requestPermissions();
    if (!hasCompletedOnboarding) {
      setCurrentScreen('onboarding');
    } else if (!user) {
      setCurrentScreen('login');
    } else {
      setCurrentScreen('home');
      speak("Welcome to WellNest. Say open grocery, open camera, describe, or emergency.", true);
    }
  };

  const handleOnboardingFinish = () => {
    if (!user) {
      setCurrentScreen('login');
    } else {
      setCurrentScreen('home');
      speak("Welcome to WellNest. Say open grocery, open camera, or emergency.", true);
    }
  };

  const handleMicClick = () => {
    stopSpeech();
    setRecognizedText('');
    if (sttServiceRef.current?.isListening) {
      sttServiceRef.current.stop();
      setVoiceStatus('idle');
    } else {
      if (sttServiceRef.current) {
        sttServiceRef.current.autoRestart = true;
        sttServiceRef.current.start();
      }
    }
  };

  // ── Screen title map ─────────────────────────────────────────────────────
  const screenTitles = {
    home: 'WellNest', explore: 'Vision Hub',
    surroundings: 'Describe Around', objects: 'Object Detection',
    ocr: 'Text Reader', grocery: 'Grocery', travel: 'Travel',
    transit: 'Transit', hospitals: 'Nearby Hospitals',
    emergency: 'Emergency SOS', emergency_contacts: 'Contacts',
    profile: 'Profile', settings: 'Settings'
  };

  const isAuthScreen = ['splash', 'onboarding', 'login', 'signup', 'forgot_password'].includes(currentScreen);

  const getActiveTab = () => {
    if (currentScreen === 'home') return 'home';
    if (['explore', 'surroundings', 'objects', 'ocr', 'grocery'].includes(currentScreen)) return 'explore';
    if (['travel', 'transit'].includes(currentScreen)) return 'travel';
    if (['emergency', 'hospitals', 'emergency_contacts'].includes(currentScreen)) return 'emergency';
    return 'home';
  };

  const isListening = voiceStatus === 'listening';
  const isProcessing = voiceStatus === 'processing';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {!isAuthScreen && (
        <Header
          title={screenTitles[currentScreen] || 'WellNest'}
          showBack={currentScreen !== 'home'}
          onBack={handleGoBack}
          onOpenVoice={() => setIsVoiceModalOpen(true)}
          currentScreen={currentScreen}
          onNavigate={navigateTo}
        />
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '70px' }}>
        {currentScreen === 'splash'          && <Splash onFinish={handleSplashFinish} />}
        {currentScreen === 'onboarding'      && <Onboarding onFinish={handleOnboardingFinish} />}
        {currentScreen === 'login'           && <Login onNavigate={navigateTo} />}
        {currentScreen === 'signup'          && <SignUp onNavigate={navigateTo} />}
        {currentScreen === 'forgot_password' && <ForgotPassword onNavigate={navigateTo} />}
        {currentScreen === 'home'            && <Home onNavigate={navigateTo} onOpenVoice={() => setIsVoiceModalOpen(true)} />}
        {currentScreen === 'explore'         && <Explore onNavigate={navigateTo} />}
        {currentScreen === 'surroundings'    && <DescribeSurroundings />}
        {currentScreen === 'objects'         && <ObjectDetection />}
        {currentScreen === 'ocr'             && <TextReader />}
        {currentScreen === 'grocery'         && <GroceryAssistant />}
        {currentScreen === 'travel'          && <TravelAssistant />}
        {currentScreen === 'transit'         && <TransitAssistant />}
        {currentScreen === 'hospitals'       && <Hospitals onNavigate={navigateTo} />}
        {currentScreen === 'emergency'       && <EmergencySOS onNavigate={navigateTo} />}
        {currentScreen === 'emergency_contacts' && <EmergencyContacts onNavigate={navigateTo} />}
        {currentScreen === 'profile'         && <Profile onNavigate={navigateTo} />}
        {currentScreen === 'settings'        && <AccessibilitySettings />}
      </main>

      {/* ── Floating voice status bar ──────────────────────────────────── */}
      {currentScreen !== 'splash' && (
        <div style={{
          position: 'fixed',
          bottom: !isAuthScreen ? '72px' : '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-full)',
          padding: '0.6rem 0.875rem',
          boxShadow: 'var(--shadow-lg)',
          border: `2px solid ${isListening ? '#16a34a' : 'var(--border-active)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          {/* Status dot */}
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: isListening ? '#16a34a' : isProcessing ? '#f59e0b' : 'var(--accent-primary)',
            animation: isListening ? 'voicePulse 1.2s infinite' : 'none'
          }} />

          {/* Transcript / prompt */}
          <span style={{
            flex: 1,
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}>
            {recognizedText
              ? `"${recognizedText}"`
              : isListening ? 'Listening...'
              : isProcessing ? 'Processing...'
              : 'Tap mic to speak'}
          </span>

          {/* Mic button */}
          <button
            onClick={handleMicClick}
            aria-label={isListening ? 'Stop listening' : 'Start voice command'}
            style={{
              width: '42px', height: '42px', minHeight: '42px',
              borderRadius: '50%',
              backgroundColor: isListening ? '#16a34a' : 'var(--accent-primary)',
              color: '#ffffff',
              padding: 0, flexShrink: 0, border: 'none'
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
      )}

      {!isAuthScreen && (
        <BottomNav
          activeTab={getActiveTab()}
          onSelectTab={navigateTo}
          onOpenVoice={() => setIsVoiceModalOpen(true)}
        />
      )}

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigate={navigateTo}
      />

      <style>{`
        @keyframes voicePulse {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.3; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;
