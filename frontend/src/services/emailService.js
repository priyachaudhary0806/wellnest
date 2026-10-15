/**
 * WellNest Emergency Email Service
 * Sends emergency alerts with live GPS coordinates to the guardian's email.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const emailService = {
  /**
   * Send SOS alert email to guardian
   */
  async sendSosEmail({ to, senderName, phone, location, message }) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sos/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          to,
          senderName,
          phone,
          location,
          message
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }
      return data;
    } catch (err) {
      console.error('[emailService] sendSosEmail failed:', err.message);
      throw err;
    }
  },

  /**
   * Check email service health and configuration status
   */
  async checkStatus() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!res.ok) return { emailConfigured: false, ok: false };
      return await res.json();
    } catch (e) {
      return { emailConfigured: false, ok: false, error: e.message };
    }
  }
};
