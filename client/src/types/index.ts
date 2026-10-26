export type Item = {
	id: string;
	title: string;
	category: string;
	description: string;
	city: string;
	postalCode?: string;
};
export type Profile = {
	fullName: string;
	email: string;
	phone: string;
	street: string;
	unit: string;
	city: string;
	province: string;
	postalCode: string;
	country: string;
	photoUrl?: string;
};
export type Coordinates = { lat: number; lng: number };
