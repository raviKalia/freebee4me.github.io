import type { SubmitEvent } from 'react';
import type { Profile } from '../types';

import { saveProfile } from '../services/profileService';

type Props = {
	profile: Profile;
	setProfile: (value: Profile) => void;
	setMessage: (value: string) => void;
};

const fields: { key: keyof Omit<Profile, 'photoUrl'>; label: string; optional?: boolean }[] = [
	{ key: 'fullName', label: 'Full name' },
	{ key: 'email', label: 'Email address' },
	{ key: 'phone', label: 'Phone number', optional: true },
	{ key: 'street', label: 'Street address' },
	{ key: 'unit', label: 'Apartment / Unit', optional: true },
	{ key: 'city', label: 'City' },
	{ key: 'province', label: 'Province' },
	{ key: 'postalCode', label: 'Postal code' },
	{ key: 'country', label: 'Country' },
];

export default function ProfileForm({ profile, setProfile, setMessage }: Props) {
	// Save the user's profile information.
	async function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			await saveProfile(profile);
			setMessage('Profile saved for this demo session.');
		} catch {
			setMessage('Unable to save profile.');
		}
	}

	return (
		<form className="profile-fields" onSubmit={e => void submit(e)}>
			<h3>
				Personal information
			</h3>

			<div className="form-grid">
				{fields.map(field => (
					<label key={field.key}>
						{field.label}
						<input required={!field.optional} value={profile[field.key] || ''} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} />
					</label>
				))}
			</div>

			<button className="save" type="submit">
				Save profile
			</button>

			<p className="privacy">
				Your full street address should never appear on public listings.
			</p>
		</form>
	);
}