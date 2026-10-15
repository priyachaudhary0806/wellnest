/**
 * WellNest AI Vision Service
 * All Gemini calls go through the Node/Express backend.
 * NO API key in frontend. NO fake data.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function canvasToBase64(canvas, quality = 0.82) {
  if (!canvas || !canvas.width || !canvas.height) return null;
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return dataUrl.split(',')[1] || null;
  } catch {
    return null;
  }
}

async function backendPost(endpoint, body, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Backend error ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out. Check your connection.');
    throw err;
  }
}

let _describeInFlight = false;
let _groceryInFlight = false;

export const aiVisionService = {

  async describeLiveFrame(canvas) {
    if (_describeInFlight) return null;
    const base64 = canvasToBase64(canvas);
    if (!base64) return null;
    _describeInFlight = true;
    try {
      const data = await backendPost('/api/vision/describe', { image: base64 });
      return data.description || null;
    } catch (err) {
      console.warn('[Vision] describeLiveFrame failed:', err.message);
      return null;
    } finally {
      _describeInFlight = false;
    }
  },

  async captureAndDescribe(canvas, question = null) {
    const base64 = canvasToBase64(canvas);
    if (!base64) throw new Error('Could not capture camera frame.');
    const body = question ? { image: base64, question } : { image: base64 };
    const data = await backendPost('/api/vision/capture', body);
    return data.description || 'Could not analyze the image.';
  },

  async scanGroceryProduct(canvas) {
    if (_groceryInFlight) throw new Error('Scan already in progress.');
    const base64 = canvasToBase64(canvas);
    if (!base64) throw new Error('Could not capture camera frame.');
    _groceryInFlight = true;
    try {
      return await backendPost('/api/vision/grocery', { image: base64 }, 25000);
    } finally {
      _groceryInFlight = false;
    }
  },

  async askQuestion(canvas, question, mode = 'surroundings') {
    const base64 = canvasToBase64(canvas);
    if (!base64) throw new Error('No image context available.');
    if (!question || !question.trim()) throw new Error('No question provided.');
    const data = await backendPost('/api/vision/question', {
      image: base64,
      question: question.trim(),
      mode
    });
    return data.answer || 'Could not answer the question.';
  },

  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${BACKEND_URL}/api/health`, {
        signal: controller.signal,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, geminiConfigured: false };
      return res.json();
    } catch {
      return { ok: false, geminiConfigured: false };
    }
  },
  async detectObjects(canvas) {
    const base64 = canvasToBase64(canvas);
    if (!base64) {
      throw new Error('Could not capture camera frame.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('http://127.0.0.1:8000/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`YOLO detection failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('YOLO could not detect objects.');
      }

      return {
        objects: data.objects.map((item) => ({
          label: item.label,
          confidence: item.confidence,
          position: item.position,
          distance: 'unknown'
        })),
        summaryText: data.summary
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('YOLO request timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  },
};
