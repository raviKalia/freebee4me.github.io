// Development-only endpoint: messages are validated but not stored or emailed.
export function sendContact(req, res) {
  const { name, email, subject, message } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !['General question', 'Account help', 'Item listing', 'Report a problem', 'Feedback'].includes(subject) ||
      typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) {
    return res.status(400).json({ error: 'Please check your contact form fields.' });
  }
  // Do not log personal messages. Add a database or email provider before real use.
  return res.status(202).json({ success: true, message: 'Message accepted by the demo server. Email delivery is not enabled yet.' });
}
