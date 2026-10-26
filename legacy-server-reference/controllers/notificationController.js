import { notifications, preferences, defaultPreferences } from '../data/notifications.js';
export function listNotifications(req,res) { res.json(notifications.filter(n => n.userId === req.user.id).slice(0,100)); }
export function readNotification(req,res) {
 const notification = notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
 if (!notification) return res.status(404).json({error:'Notification not found.'});
 notification.read = true; res.json(notification);
}
export function getPreferences(req,res) { res.json({ ...defaultPreferences, ...preferences.get(req.user.id) }); }
export function savePreferences(req,res) {
 const updates = req.body || {};
 if (Object.keys(updates).some(key => !(key in defaultPreferences) || typeof updates[key] !== 'boolean'))
   return res.status(400).json({error:'Invalid notification preferences.'});
 const saved = { ...defaultPreferences, ...preferences.get(req.user.id), ...updates };
 preferences.set(req.user.id, saved); res.json(saved);
}
