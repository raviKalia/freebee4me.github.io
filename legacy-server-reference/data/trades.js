// DEMO ONLY: trade records and messages are lost when Node restarts.
// In production store these in a database and get user identity from verified auth.
export const trades = new Map([
 ['demo-trade', {
   id: 'demo-trade', itemId: '1', donorId: 'demo-donor', recipientId: 'demo-recipient',
   status: 'pending', messages: [],
   donor: { displayName: 'Demo Donor', phone: '555-0100',
     street: 'Private pickup street', unit: '', city: 'Toronto', province: 'Ontario',
     postalCode: 'M5V', area: 'Downtown Toronto' }
 }]
]);
export const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
