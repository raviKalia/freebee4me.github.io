import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { validateImage } from '../utils/imageValidation';

type ProfileData = {
	fullName: string;
	phone: string;
	street: string;
	unit: string;
	city: string;
	province: string;
	postalCode: string;
	country: string;
	photoUrl: string;
};
const emptyProfile: ProfileData = {
	fullName: '',
	phone: '',
	street: '',
	unit: '',
	city: '',
	province: '',
	postalCode: '',
	country: 'Canada',
	photoUrl: '',
};
const fields: { key: Exclude<keyof ProfileData, 'photoUrl'>; label: string; required?: boolean }[] = [
	{ key: 'fullName', label: 'Full name', required: true },
	{ key: 'phone', label: 'Phone number' },
	{ key: 'street', label: 'Street address' },
	{ key: 'unit', label: 'Apartment / Unit' },
	{ key: 'city', label: 'City' },
	{ key: 'province', label: 'Province' },
	{ key: 'postalCode', label: 'Postal code' },
	{ key: 'country', label: 'Country' },
];

type Props = { user: User; setMessage: (value: string) => void };
export default function ProfilePage({ user, setMessage }: Props) {
	const [profile, setProfile] = useState<ProfileData>(emptyProfile);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		let active = true;
		async function load() {
			setLoading(true);
			try {
				// Store each user's private profile under their Firebase Authentication UID.
				const snapshot = await getDoc(doc(db, 'profiles', user.uid));
				if (active)
					setProfile({
						...emptyProfile,
						fullName: user.displayName || '',
						...(snapshot.exists() ? (snapshot.data() as Partial<ProfileData>) : {}),
					});
			} catch (error) {
				console.error('Profile loading failed:', error);
				if (active) setMessage('Unable to load profile. Check Firestore rules.');
			} finally {
				if (active) setLoading(false);
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [user.uid, user.displayName, setMessage]);

	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		try {
			// merge preserves any other profile fields already stored in Firestore.
			await setDoc(doc(db, 'profiles', user.uid), profile, { merge: true });
			setMessage('Profile saved successfully.');
		} catch (error) {
			console.error('Profile saving failed:', error);
			setMessage('Unable to save profile. Check Firestore permissions.');
		} finally {
			setSaving(false);
		}
	}

	async function uploadPhoto(file?: File) {
		if (!file) return;
		const validationError = validateImage(file);
		if (validationError) {
			setMessage(validationError);
			return;
		}
		setUploading(true);
		try {
			// Use a user-specific path so Storage rules can verify ownership.
			const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
			const imageRef = ref(storage, `profile-photos/${user.uid}/avatar.${extension}`);
			await uploadBytes(imageRef, file, { contentType: file.type });
			const photoUrl = await getDownloadURL(imageRef);
			setProfile((current) => ({ ...current, photoUrl }));
			await setDoc(doc(db, 'profiles', user.uid), { photoUrl }, { merge: true });
			setMessage('Profile photo updated.');
		} catch (error) {
			console.error('Photo upload failed:', error);
			setMessage('Unable to upload photo. Check Firebase Storage rules.');
		} finally {
			setUploading(false);
		}
	}

	return (
		<section className="profile-page">
			<div className="section-title">
				<div>
					<span className="eyebrow">YOUR ACCOUNT</span>
					<h2>My Profile</h2>
				</div>
			</div>
			{loading ? (
				<p>Loading profile...</p>
			) : (
				<div className="profile">
					<aside className="photo">
						<div className="avatar">
							{profile.photoUrl ? <img src={profile.photoUrl} alt="Your profile" /> : '👤'}
						</div>
						<h3>Profile picture</h3>
						<p>JPEG, PNG, or WebP · maximum 5 MB</p>
						<label className="upload">
							{uploading ? 'Uploading...' : 'Upload picture'}
							<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.target.value = ''; }} />
						</label>
					</aside>
					<form className="profile-fields" onSubmit={(event) => void save(event)}>
						<h3>Personal information</h3>
						<label>
							Email address
							<input type="email" value={user.email || ''} readOnly />
						</label>
						<div className="form-grid">
							{fields.map((field) => (
								<label key={field.key}>
									{field.label}
									<input required={field.required} value={profile[field.key]} onChange={(event) => setProfile((current) => ({ ...current, [field.key]: event.target.value })) } />
								</label>
							))}
						</div>
						<button className="save" type="submit" disabled={saving}>
							{saving ? 'Saving...' : 'Save profile'}
						</button>
						<p className="privacy">
							Your street address is private and must not be shown on public item listings.
						</p>
					</form>
				</div>
			)}
		</section>
	);
}
