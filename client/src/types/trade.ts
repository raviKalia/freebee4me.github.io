export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type ChatMessage = { id: string; senderId: string; text: string; sentAt: string };
export type DonorDetails = {
 displayName: string; phone: string; street: string; unit: string;
 city: string; province: string; postalCode: string;
};
export type Trade = {
 id: string; itemId: string; status: TradeStatus; canChat: boolean;
 isDonor: boolean; pickupArea: string; donorDetails: DonorDetails | null;
 messages: ChatMessage[];
};
export type DemoRole = 'demo-donor' | 'demo-recipient';
