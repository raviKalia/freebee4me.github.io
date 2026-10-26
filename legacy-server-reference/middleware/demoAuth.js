// DEVELOPMENT ONLY. Never use a client-controlled user ID for production authorization.
// Replace with verified session/JWT middleware that sets req.user from the server.
export function demoAuth(req, res, next) {
 const id = req.get('x-demo-user');
 if (!['demo-donor', 'demo-recipient'].includes(id))
   return res.status(401).json({ error: 'Choose a demo user to continue.' });
 req.user = { id };
 next();
}
