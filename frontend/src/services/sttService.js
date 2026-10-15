/**
 * WellNest Speech Recognition Service
 * Browser version — uses Web Speech API (works in Chrome/Edge)
 */

export class SpeechRecognitionService {
  constructor(options = {}) {
    this.isListening = false;
    this.isStarting = false;
    this.isSupported = false;
    this.autoRestart = true;
    this._restartTimer = null;
    this._stopped = false;

    this.onResult = options.onResult || null;
    this.onPartialResult = options.onPartialResult || null;
    this.onError = options.onError || null;
    this.onStatus = options.onStatus || null;
    this.lang = options.lang || 'en-IN';

    this._recognition = null;
    this._init();
  }

  _init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.isSupported = false;
      console.warn('[STT] Web Speech API not supported. Use Chrome or Edge.');
      if (this.onError) this.onError('not-supported', 'Please use Chrome or Edge for voice commands.');
      return;
    }

    this.isSupported = true;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = this.lang;
    r.maxAlternatives = 1;

    r.onstart = () => {
      this.isListening = true;
      this.isStarting = false;
      if (this.onStatus) this.onStatus('listening');
    };

    r.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 1;

        if (result.isFinal) {
          // Ignore low confidence results (noise)
          if (confidence < 0.4 && transcript.trim().split(' ').length < 2) {
            console.log('[STT] Ignored low confidence result:', transcript, confidence);
            return;
          }
          final += transcript;
        } else {
          // Only show interim if confidence is reasonable
          if (confidence > 0.3 || transcript.trim().length > 3) {
            interim += transcript;
          }
        }
      }
      if (interim && this.onPartialResult) this.onPartialResult(interim.trim());
      if (final.trim() && final.trim().length > 1) {
        if (this.onResult) this.onResult(final.trim(), true);
      }
    };

    r.onerror = (event) => {
      this.isListening = false;
      this.isStarting = false;
      if (this.onStatus) this.onStatus('error');
      const recoverable = ['no-speech', 'network', 'audio-capture'];
      if (this.autoRestart && recoverable.includes(event.error) && !window.__isTTSSpeaking) {
        this._scheduleRestart(800);
      }
    };

    r.onend = () => {
      this.isListening = false;
      this.isStarting = false;
      if (this.onStatus) this.onStatus('idle');
      if (this.autoRestart && !window.__isTTSSpeaking && !this._stopped) {
        this._scheduleRestart(400);
      }
    };

    this._recognition = r;
  }

  _scheduleRestart(delayMs) {
    if (this._restartTimer) return;
    this._restartTimer = setTimeout(() => {
      this._restartTimer = null;
      if (!this._stopped) this.start();
    }, delayMs);
  }

  start() {
    if (this._stopped) return false;
    if (this.isListening || this.isStarting) return true;
    if (window.__isTTSSpeaking) return false;
    if (!this._recognition) return false;

    try {
      this.isStarting = true;
      this._recognition.start();
      return true;
    } catch (e) {
      this.isStarting = false;
      this.isListening = false;
      return false;
    }
  }

  stop() {
    this._stopped = true;
    this.autoRestart = false;
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }
    this.isStarting = false;
    if (this._recognition && this.isListening) {
      try { this._recognition.stop(); } catch {}
    }
    this.isListening = false;
  }

  resumeAutoListen() {
    this._stopped = false;
    this.autoRestart = true;
    this._scheduleRestart(300);
  }
}

// ─── Email parser ─────────────────────────────────────────────────────────────
export const extractSpokenEmail = (text) => {
  if (!text) return null;
  let lower = text.toLowerCase().trim()
    .replace(/^(?:my\s+)?email(?:\s+address)?(?:\s+is)?\s+/i, '')
    .replace(/\s+at\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+dash\s+/g, '-')
    .replace(/\s+underscore\s+/g, '_')
    .replace(/\s+/g, '');
  const match = lower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
};

// ─── Voice Command Router ─────────────────────────────────────────────────────
export const parseVoiceCommand = (commandText, activeContext = {}) => {
  if (!commandText) return null;

  const raw = commandText.trim();
  const lower = raw.toLowerCase();
  const activeScreen = activeContext.currentScreen || window.__currentScreen || null;
  const activeField = activeContext.activeField || window.__activeVoiceField || null;
  const isAuthScreen = ['login', 'signup', 'forgot_password'].includes(activeScreen);

  // FORM FOCUS
  if (/email field|go to email|enter email|focus email/.test(lower))
    return { intent: 'FORM_FOCUS', field: 'email', text: 'Email field focused.', customEvent: 'wellnest-form-voice-input' };
  if (/password field|go to password|enter password|focus password/.test(lower))
    return { intent: 'FORM_FOCUS', field: 'password', text: 'Password field focused.', customEvent: 'wellnest-form-voice-input' };
  if (/name field|go to name|enter name|focus name/.test(lower))
    return { intent: 'FORM_FOCUS', field: 'fullName', text: 'Name field focused.', customEvent: 'wellnest-form-voice-input' };

  // FORM FILL
  if (isAuthScreen) {
    const email = extractSpokenEmail(raw);
    if (email) return { intent: 'FORM_FILL', field: 'email', value: email, text: `Email set.`, customEvent: 'wellnest-form-voice-input' };

    const passMatch = raw.match(/^(?:my\s+)?password(?:\s+is)?\s+(.+)$/i);
    if (passMatch) return { intent: 'FORM_FILL', field: 'password', value: passMatch[1].trim(), isPassword: true, text: 'Password entered.', customEvent: 'wellnest-form-voice-input' };

    const nameMatch = raw.match(/^(?:my\s+)?(?:full\s+)?name(?:\s+is)?\s+(.+)$/i);
    if (nameMatch) return { intent: 'FORM_FILL', field: 'fullName', value: nameMatch[1].trim(), text: `Name set.`, customEvent: 'wellnest-form-voice-input' };

    if (activeField === 'password' && !/(sign|camera|open|home|back)/.test(lower))
      return { intent: 'FORM_FILL', field: 'password', value: raw, isPassword: true, text: 'Password entered.', customEvent: 'wellnest-form-voice-input' };
  }

  // FORM SUBMIT
  if (/^(sign in|login|log in|submit)$/.test(lower)) {
    if (isAuthScreen) return { intent: 'FORM_SUBMIT', text: 'Signing in...', customEvent: 'wellnest-form-voice-input' };
    return { intent: 'SIGN_IN', text: 'Opening sign in.', screen: 'login' };
  }
  if (/^(sign up|create account|register)$/.test(lower)) {
    if (activeScreen === 'signup') return { intent: 'FORM_SUBMIT', text: 'Creating account...', customEvent: 'wellnest-form-voice-input' };
    return { intent: 'SIGN_UP', text: 'Opening sign up.', screen: 'signup' };
  }

  // NAVIGATION
  if (/\bhome\b|go home|dashboard/.test(lower))
    return { intent: 'GO_HOME', text: 'Going home.', screen: 'home' };

  if (/go back|^back$|^return$/.test(lower))
    return { intent: 'GO_BACK', text: 'Going back.', action: 'go_back' };

  // CAPTURE / DESCRIBE
  if (/\bcapture\b|take (a )?(photo|picture)|snap/.test(lower))
    return { intent: 'CAPTURE', text: 'Capturing view.', customEvent: 'wellnest-voice-cmd' };

  if (/describe (around|surroundings|what)|what('?s| is) (around|in front|this)|what do you see/.test(lower)) {
    if (activeScreen === 'surroundings')
      return { intent: 'CAPTURE', text: 'Analyzing view.', customEvent: 'wellnest-voice-cmd' };
    return { intent: 'DESCRIBE_SURROUNDINGS', text: 'Opening camera.', screen: 'surroundings' };
  }

  // OPEN SCREENS
  if (/open (camera|describe|surroundings|describe around)/.test(lower))
    return { intent: 'DESCRIBE_SURROUNDINGS', text: 'Opening camera.', screen: 'surroundings' };

  if (/open grocery|grocery|scan (product|item)/.test(lower))
    return { intent: 'OPEN_GROCERY', text: 'Opening Grocery.', screen: 'grocery' };

  if (/open travel|travel|navigate|navigation|where am i/.test(lower))
    return { intent: 'OPEN_TRAVEL', text: 'Opening Travel.', screen: 'travel' };

  if (/open transit|transit|\bbus\b|\btrain\b|\bmetro\b/.test(lower))
    return { intent: 'OPEN_TRANSIT', text: 'Opening Transit.', screen: 'transit' };

  if (/nearby hospital|find hospital|open hospital|hospital|doctor|clinic|medical/.test(lower))
    return { intent: 'OPEN_HOSPITALS', text: 'Opening Nearby Hospitals.', screen: 'hospitals' };

  if (/read text|text reader|ocr|read this/.test(lower))
    return { intent: 'TEXT_READER', text: 'Opening Text Reader.', screen: 'ocr' };

  if (/emergency contacts|contacts/.test(lower))
    return { intent: 'OPEN_CONTACTS', text: 'Opening Contacts.', screen: 'emergency_contacts' };

  // Edit emergency contact email
  if (/edit (emergency |guardian )?(contact|email)|change (emergency |guardian )?(contact|email)|update (emergency |guardian )?(contact|email)/.test(lower))
    return { intent: 'EDIT_EMERGENCY_EMAIL', text: 'Opening Emergency Contacts to edit.', screen: 'emergency_contacts', customEvent: 'wellnest-voice-cmd' };

  // Location search and navigation
  if (/navigate to (.+)|take me to (.+)|go to (.+)|directions to (.+)|how to reach (.+)/.test(lower)) {
    const match = lower.match(/(?:navigate to|take me to|go to|directions to|how to reach) (.+)/);
    const destination = match ? match[1].trim() : '';
    return { intent: 'NAVIGATE_TO', text: `Navigating to ${destination}.`, screen: 'travel', destination, customEvent: 'wellnest-voice-cmd' };
  }

  if (/search (.+)|find (.+) near me|where is (.+)/.test(lower)) {
    const match = lower.match(/(?:search|find|where is) (.+?)(?:\s+near me)?$/);
    const query = match ? match[1].trim() : '';
    return { intent: 'SEARCH_PLACE', text: `Searching for ${query}.`, screen: 'travel', query, customEvent: 'wellnest-voice-cmd' };
  }

  if (/open profile|my profile/.test(lower))
    return { intent: 'OPEN_PROFILE', text: 'Opening Profile.', screen: 'profile' };

  if (/open settings|settings/.test(lower))
    return { intent: 'OPEN_SETTINGS', text: 'Opening Settings.', screen: 'settings' };

  // SOS
  if (/send sos|start sos|trigger sos/.test(lower))
    return { intent: 'TRIGGER_SOS', text: 'Triggering SOS.', screen: 'emergency', customEvent: 'wellnest-voice-cmd' };

  if (/\bsos\b|emergency|help me/.test(lower))
    return { intent: 'OPEN_EMERGENCY', text: 'Opening Emergency SOS.', screen: 'emergency' };

  if (/cancel sos|stop sos/.test(lower))
    return { intent: 'CANCEL_SOS', text: 'Cancelling SOS.', customEvent: 'wellnest-voice-cmd' };

  // DETECTION CONTROLS
  if (/start (detection|vision|live)|resume detection/.test(lower))
    return { intent: 'START_DETECTION', text: 'Starting detection.', customEvent: 'wellnest-voice-cmd' };

  if (/stop (detection|vision)|pause detection/.test(lower))
    return { intent: 'STOP_DETECTION', text: 'Stopping detection.', customEvent: 'wellnest-voice-cmd' };

  // GROCERY Q&A — specific questions
  if (activeScreen === 'grocery') {
    // Specific product questions — always handle on grocery screen
    if (/what is the price|price|cost|how much|mrp|rate/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking price...', question: 'What is the price or MRP of this product?', customEvent: 'wellnest-voice-cmd' };

    if (/what is the product|what product|identify|what is this|what am i holding/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Identifying product...', question: 'What is this product? Give the full name and brand.', customEvent: 'wellnest-voice-cmd' };

    if (/expiry|expiry date|expire|best before|use by|when does it expire/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking expiry date...', question: 'What is the expiry date or best before date on this product?', customEvent: 'wellnest-voice-cmd' };

    if (/mfg|manufacturing date|manufacture|made on|when was it made/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking manufacturing date...', question: 'What is the manufacturing date or date of manufacture on this product?', customEvent: 'wellnest-voice-cmd' };

    if (/ingredient|ingredients|contents|what is in it|what does it contain/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Reading ingredients...', question: 'What are the ingredients or contents of this product?', customEvent: 'wellnest-voice-cmd' };

    if (/brand|company|manufacturer|made by|who makes/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking brand...', question: 'What is the brand or company that makes this product?', customEvent: 'wellnest-voice-cmd' };

    if (/quantity|weight|size|how much is|how many|grams|ml|kg|litre/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking quantity...', question: 'What is the quantity, weight or size of this product?', customEvent: 'wellnest-voice-cmd' };

    if (/allergen|allergy|contains|warning|gluten|nut|dairy/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking allergens...', question: 'Are there any allergen warnings on this product?', customEvent: 'wellnest-voice-cmd' };

    if (/is it expired|is this expired|is it safe|can i eat|is it fresh/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Checking if expired...', question: 'Is this product expired or safe to consume based on the visible date?', customEvent: 'wellnest-voice-cmd' };

    if (/calorie|calories|nutrition|nutritional|fat|protein|carb/.test(lower))
      return { intent: 'ASK_QUESTION', text: 'Reading nutrition info...', question: 'What are the nutritional values or calories in this product?', customEvent: 'wellnest-voice-cmd' };

  if (/scan|capture|take photo|take picture/.test(lower))
  return { intent: 'CAPTURE', text: 'Capturing product now.', customEvent: 'wellnest-voice-cmd' };
  return { intent: 'CAPTURE', text: 'Capturing product...', customEvent: 'wellnest-voice-cmd' };

    // Any other question on grocery screen — send as-is to Gemini
    if (lower.length > 3)
      return { intent: 'ASK_QUESTION', text: `Asking: ${raw}`, question: raw, customEvent: 'wellnest-voice-cmd' };
  }

  // SURROUNDINGS Q&A — questions while on camera screen
  if (activeScreen === 'surroundings') {
    if (/what is (that|this|there)|what do you see|describe|what is in front|what is around/.test(lower))
      return { intent: 'CAPTURE', text: 'Analyzing current view...', customEvent: 'wellnest-voice-cmd' };

    if (/is (there|it) (a |an )?(person|people|someone|anyone)/.test(lower))
      return { intent: 'CAPTURE', text: 'Checking for people...', customEvent: 'wellnest-voice-cmd' };

    if (/is (the |my )?(path|way|road) clear|any obstacle|anything in the way/.test(lower))
      return { intent: 'CAPTURE', text: 'Checking path...', customEvent: 'wellnest-voice-cmd' };
  }

  // AUTH
  if (/sign out|log out|logout/.test(lower))
    return { intent: 'SIGN_OUT', text: 'Signing out.', action: 'logout', screen: 'login' };

  if (/forgot password|reset password/.test(lower))
    return { intent: 'FORGOT_PASSWORD', text: 'Opening Forgot Password.', screen: 'forgot_password' };

  return {
    intent: 'UNKNOWN',
    text: 'Command not recognized. Try: open grocery, open camera, capture, describe, emergency, or go home.',
    screen: null
  };
};
