import { trades } from '../data/trades.js';
import { notify } from '../services/notificationService.js';
import { randomUUID } from 'node:crypto';
function access(req, res) {
 const trade = trades.get(req.params.id);
 if (!trade) { res.status(404).json({ error: 'Trade not found.' }); return null; }
 if (![trade.donorId, trade.recipientId].includes(req.user.id)) {
   res.status(403).json({ error: 'Not a participant.' }); return null;
 }
 return trade;
}
function publicTrade(trade, userId) {
 const accepted = trade.status === 'accepted';
 const completed = trade.status === 'completed';
 return {
   id: trade.id, itemId: trade.itemId, status: trade.status,
   canChat: accepted, isDonor: userId === trade.donorId,
   pickupArea: trade.donor.area,
   // Recipient sees no contact details until donor accepts.
   // Details remain visible after completion for recordkeeping, but chat is locked.
   donorDetails: (userId === trade.donorId || accepted || completed)
     ? { displayName: trade.donor.displayName, phone: trade.donor.phone,
         street: trade.donor.street, unit: trade.donor.unit, city: trade.donor.city,
         province: trade.donor.province, postalCode: trade.donor.postalCode }
     : null,
   messages: accepted || completed ? trade.messages : []
 };
}
export function getTrade(req, res) {
 const trade = access(req, res); if (!trade) return;
 res.json(publicTrade(trade, req.user.id));
}
export function addMessage(req, res) {
 const trade = access(req, res); if (!trade) return;
 if (trade.status !== 'accepted')
   return res.status(403).json({ error: 'Chat is available only during an accepted trade.' });
 const body = req.body?.text;
 if (typeof body !== 'string' || !body.trim() || body.trim().length > 1000)
   return res.status(400).json({ error: 'Message must contain 1–1000 characters.' });
 const message = { id: randomUUID(), senderId: req.user.id,
   text: body.trim(), sentAt: new Date().toISOString() };
 trade.messages.push(message);
 notify(req.user.id === trade.donorId ? trade.recipientId : trade.donorId, 'newMessage', 'New trade message', 'You have a new message about an accepted trade. Open the app to read it.', trade.id);
 res.status(201).json(message);
}
export function updateStatus(req, res) {
 const trade = access(req, res); if (!trade) return;
 const next = req.body?.status;
 const donor = req.user.id === trade.donorId;
 const recipient = req.user.id === trade.recipientId;
 // Explicit allowed transitions. A recipient cannot accept a request.
 const allowed = (donor && trade.status === 'pending' && ['accepted','rejected'].includes(next)) ||
   (recipient && trade.status === 'pending' && next === 'cancelled') ||
   (donor && trade.status === 'accepted' && next === 'completed');
 if (!allowed) return res.status(403).json({ error: 'This status change is not allowed.' });
 trade.status = next;
 if (next === 'accepted') notify(trade.recipientId, 'requestUpdate', 'Request accepted', 'Your item request was accepted. Chat is now available.', trade.id);
 if (next === 'rejected') notify(trade.recipientId, 'requestUpdate', 'Request rejected', 'Your item request was not accepted.', trade.id);
 if (next === 'cancelled') notify(trade.donorId, 'requestUpdate', 'Request cancelled', 'The recipient cancelled their request.', trade.id);
 if (next === 'completed') {
   notify(trade.recipientId, 'tradeCompleted', 'Trade completed', 'The trade has been completed and chat is now closed.', trade.id);
   notify(trade.donorId, 'tradeCompleted', 'Trade completed', 'The trade has been completed and chat is now closed.', trade.id);
 }
 res.json(publicTrade(trade, req.user.id));
}
