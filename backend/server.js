/**
 * WellNest Backend - Secure Gemini Vision Proxy
 * The Gemini API key lives ONLY here in .env
 * The React frontend never sees the key.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' })); // Allow Capacitor webview origin
app.use((req, res, next) => {
  // ngrok browser warning bypass
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(express.json({ limit: '20mb' })); // Base64 images can be large

// ─── Nodemailer Setup ─────────────────────────────────────────────────────────
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.GUARDIAN_EMAIL || 'chaudharypriya9313@gmail.com';
const SENDER_APP_PASSWORD = process.env.SENDER_APP_PASSWORD;

function createTransporter() {
  if (!SENDER_EMAIL || !SENDER_APP_PASSWORD || SENDER_APP_PASSWORD === 'your_gmail_app_password_here') {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SENDER_EMAIL,
      pass: SENDER_APP_PASSWORD
    }
  });
}

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const geminiConfigured = !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here' && GEMINI_API_KEY.trim().length > 10);
  const transporter = createTransporter();
  let emailConfigured = false;
  let emailError = null;

  if (transporter) {
    try {
      await transporter.verify();
      emailConfigured = true;
    } catch (err) {
      emailError = err.message;
    }
  }

  res.json({
    status: 'ok',
    service: 'WellNest Gemini Vision Proxy',
    geminiConfigured,
    emailConfigured,
    emailError,
    senderEmail: SENDER_EMAIL || null,
    guardianEmail: process.env.GUARDIAN_EMAIL || null
  });
});

// ─── SOS Email Endpoint ──────────────────────────────────────────────────────
app.post('/api/sos/email', async (req, res) => {
  try {
    const { to, senderName, phone, location, message } = req.body;
    const recipient = to || process.env.GUARDIAN_EMAIL;

    if (!recipient) {
      return res.status(400).json({ error: 'No recipient email specified.' });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'Backend email service is not configured. Please set a valid SENDER_APP_PASSWORD in backend/.env.'
      });
    }

    const timeStr = new Date().toLocaleString();
    const address = location?.address || 'Location coordinates attached below';
    const mapsUrl = (location?.lat && location?.lng)
      ? `https://maps.google.com/?q=${location.lat},${location.lng}`
      : null;

    const mailOptions = {
      from: `"WellNest Emergency System" <${SENDER_EMAIL}>`,
      to: recipient,
      subject: `🚨 EMERGENCY SOS ALERT: ${senderName || 'WellNest User'} Needs Assistance!`,
      text: `🚨 EMERGENCY SOS ALERT!\n\n` +
            `From: ${senderName || 'WellNest User'}\n` +
            `Phone: ${phone || 'N/A'}\n` +
            `Time: ${timeStr}\n` +
            `Location: ${address}\n` +
            (mapsUrl ? `GPS Map Link: ${mapsUrl}\n` : '') +
            `\nMessage:\n${message || 'User triggered Emergency SOS alert.'}\n\nPlease check on them immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 3px solid #dc2626; border-radius: 10px; background-color: #fef2f2; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">🚨 EMERGENCY SOS ALERT</h2>
          <p style="font-size: 16px; color: #111827;">
            <strong>${senderName || 'WellNest User'}</strong> has triggered an Emergency SOS alert!
          </p>
          <hr style="border: none; border-top: 2px solid #fca5a5; margin: 15px 0;" />
          <p style="font-size: 15px; margin: 8px 0;"><strong>⏰ Time:</strong> ${timeStr}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>📱 Phone:</strong> ${phone || 'Not provided'}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>📍 Location:</strong> ${address}</p>
          ${mapsUrl ? `<p style="font-size: 16px; margin: 15px 0;"><a href="${mapsUrl}" target="_blank" style="background-color: #dc2626; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📍 View Live Location on Google Maps</a></p>` : ''}
          <div style="margin-top: 15px; padding: 12px; background: #ffffff; border-left: 4px solid #dc2626; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #374151;">Alert Details:</p>
            <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">${message || 'Immediate assistance requested via WellNest app.'}</p>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Sent automatically by WellNest Emergency Service.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[SOS Email] Sent successfully to:', recipient, 'MessageID:', info.messageId);
    res.json({ success: true, messageId: info.messageId, recipient });
  } catch (err) {
    console.error('[SOS Email] Error sending email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Shared Gemini call helper ────────────────────────────────────────────────
async function callGemini(prompt, base64Image) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here' || GEMINI_API_KEY.trim().length < 10) {
    throw new Error('GEMINI_API_KEY is not configured. Set it in backend/.env');
  }

  const models = [
  { model: 'gemini-3.6-flash', api: 'v1beta' },
  { model: 'gemini-3.8-flash', api: 'v1beta' }
];

  for (const { model, api } of models) {
    try {
      const body = {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.2
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] ${model} (${api}) failed (${res.status}):`, errText.substring(0, 200));
        // 503 = high demand, wait and retry same model once
        if (res.status === 503) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const retryController = new AbortController();
            const retryTimeout = setTimeout(() => retryController.abort(), 20000);
            const retry = await fetch(
              `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
              { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: retryController.signal }
            );
            clearTimeout(retryTimeout);
            if (retry.ok) {
              const rj = await retry.json();
              const rt = rj.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rt && rt.trim()) return rt.trim().replace(/[*#`]/g, '');
            }
          } catch {}
        }
        continue;
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim().replace(/[*#`]/g, '');
      }
    } catch (err) {
      console.warn(`[Gemini] ${model} (${api}) error:`, err.message);
      continue;
    }
  }

  throw new Error('All Gemini model attempts failed.');
}

// ─── POST /api/vision/describe ─────────────────────────────────────────────
// Continuous surroundings description for blind/VI users.
// Body: { image: "<base64 jpeg>" }
app.post('/api/vision/describe', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided.' });

    const prompt = `You are an AI assistant helping a blind or visually impaired person understand their surroundings.
Look at this camera frame and describe what is visible in 1-2 short, plain sentences.
Focus on: people, furniture, doors, stairs, vehicles, obstacles, and general environment.
Mention positions using: left, right, center, ahead, behind.
Say if something is close or far.
Do NOT give grocery/product/price/expiry information.
Do NOT use markdown, asterisks, or bullet points.
Be concise and clear. Example: "There is a person standing ahead of you. A chair is on your left."
If nothing meaningful is visible, say: "The view is unclear. Please point the camera at your surroundings."`;

    const result = await callGemini(prompt, image);
    res.json({ description: result });
  } catch (err) {
    console.error('[/api/vision/describe]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/vision/capture ──────────────────────────────────────────────
// One-shot detailed capture for "describe surroundings" or "what is this?"
// Body: { image: "<base64 jpeg>", question?: string }
app.post('/api/vision/capture', async (req, res) => {
  try {
    const { image, question } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided.' });

    const basePrompt = question
      ? `You are an AI assistant for a blind or visually impaired person.
Look at this image and answer the question: "${question}"
Give a clear, short, plain-language answer in 1-3 sentences.
Do NOT use markdown, asterisks, or bullet points.
If you cannot answer from the image, say so honestly.`
      : `You are an AI assistant for a blind or visually impaired person.
Describe everything visible in this camera frame in 2-3 clear sentences.
Include: people, objects, text, environment, spatial positions (left, right, center, ahead).
Do NOT use markdown, asterisks, or bullet points.
Be specific about what you actually see. Do not invent details.`;

    const result = await callGemini(basePrompt, image);
    res.json({ description: result });
  } catch (err) {
    console.error('[/api/vision/capture]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/vision/grocery ─────────────────────────────────────────────
// Grocery/product label analysis.
// Body: { image: "<base64 jpeg>" }
app.post('/api/vision/grocery', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided.' });

    const prompt = `You are an AI assistant helping a blind or visually impaired person identify grocery products.
Look at this image and identify any grocery/retail product visible.
Return ONLY a valid JSON object with these exact keys:
{
  "found": true or false,
  "name": "product name or null",
  "brand": "brand name or null",
  "category": "product category or null",
  "quantity": "size/weight/count or null",
  "price": "MRP/price visible on package or null",
  "expiryDate": "expiry date visible or null",
  "mfgDate": "manufacture date visible or null",
  "isExpired": false,
  "description": "short plain description",
  "ingredients": "ingredients if visible or null",
  "allergens": "allergen warnings if visible or null"
}
Rules:
- If no grocery/retail product is visible, set "found": false and describe what IS visible in "description".
- Never invent a price, expiry date, or product name. If not visible, use null.
- Do not include markdown, asterisks, or extra text outside the JSON.`;

    const rawResult = await callGemini(prompt, image);

    // Parse JSON response from Gemini
    let productData;
    try {
      const cleaned = rawResult
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      productData = JSON.parse(cleaned);
    } catch (parseErr) {
      // If Gemini didn't return valid JSON, wrap it
      productData = {
        found: false,
        name: null,
        brand: null,
        category: null,
        quantity: null,
        price: null,
        expiryDate: null,
        mfgDate: null,
        isExpired: false,
        description: rawResult,
        ingredients: null,
        allergens: null
      };
    }

    res.json(productData);
  } catch (err) {
    console.error('[/api/vision/grocery]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/vision/question ────────────────────────────────────────────
// Context-aware follow-up questions about a previously captured image.
// Body: { image: "<base64 jpeg>", question: string, mode: "grocery"|"surroundings" }
app.post('/api/vision/question', async (req, res) => {
  try {
    const { image, question, mode } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided.' });
    if (!question) return res.status(400).json({ error: 'No question provided.' });

    const context = mode === 'grocery'
      ? 'This is an image of a grocery/retail product.'
      : 'This is a camera frame from a blind person navigating their surroundings.';

    const prompt = `${context}
Answer this specific question about the image: "${question}"
Give a short, direct, plain-language answer in 1-2 sentences.
If the answer is not visible or determinable from the image, say so clearly.
Never guess or invent facts (prices, dates, names) that are not visible.
Do NOT use markdown, asterisks, or bullet points.`;

    const result = await callGemini(prompt, image);
    res.json({ answer: result });
  } catch (err) {
    console.error('[/api/vision/question]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ WellNest Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('\n⚠️  GEMINI_API_KEY not set! Edit backend/.env with your real key.\n');
  } else {
    console.log('   Gemini API key: configured ✓\n');
  }
});
