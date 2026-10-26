import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from '../../firebase/config';

import '../../styles/admin-profile.css';

type Profile = {
	displayName: string;
	department: string;
	bio: string;
	photoUrl: string;
};

type Props = {
	user: User;
	masterAdmin: boolean;
};

const emptyProfile: Profile = {
	displayName: '',
	department: '',
	bio: '',
	photoUrl: '',
};

// Administrators can edit profile details, but cannot change their role or account status.
export default function AdminProfile({ user, masterAdmin }: Props) {
	const [profile, setProfile] = useState<Profile>(emptyProfile);
	const [photo, setPhoto] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');

	const roleLabel = masterAdmin ? 'Master Admin' : 'Admin';

	// Load the administrator's saved profile.
	useEffect(() => {
		let active = true;

		getDoc(doc(db, 'adminProfiles', user.uid))
			.then((snapshot) => {
				if (!active) {
					return;
				}

				const data = snapshot.data();

				setProfile({
					displayName: String(data?.displayName ?? user.displayName ?? ''),
					department: String(data?.department ?? ''),
					bio: String(data?.bio ?? ''),
					photoUrl: String(data?.photoUrl ?? ''),
				});
			})
			.catch((error) => {
				if (active) {
					setError(`Could not load profile: ${String(error)}`);
				}
			});

		return () => {
			active = false;
		};
	}, [user.uid, user.displayName]);

	// Update an editable profile field.
	function change(field: 'displayName' | 'department' | 'bio', value: string) {
		setProfile((current) => ({
			...current,
			[field]: value,
		}));
	}

	// Upload the photo and save the profile details.
	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError('');
		setNotice('');

		if (!profile.displayName.trim()) {
			setError('Enter your display name.');
			return;
		}

		if (profile.displayName.length > 80 || profile.department.length > 80 || profile.bio.length > 500) {
			setError('One or more fields are too long.');
			return;
		}

		if (
			photo &&
			(!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024)
		) {
			setError('Photo must be JPEG, PNG or WebP, up to 5 MB.');
			return;
		}

		setBusy(true);

		try {
			let photoUrl = profile.photoUrl;

			if (photo) {
				const extension = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg';

				const file = ref(storage, `admin-profile-photos/${user.uid}/avatar.${extension}`);

				await uploadBytes(file, photo, {
					contentType: photo.type,
				});

				photoUrl = await getDownloadURL(file);
			}

			const updated = {
				displayName: profile.displayName.trim(),
				department: profile.department.trim(),
				bio: profile.bio.trim(),
				photoUrl,
			};

			await setDoc(
				doc(db, 'adminProfiles', user.uid),
				{
					...updated,
					updatedAt: serverTimestamp(),
				},
				{
					merge: true,
				},
			);

			setProfile(updated);
			setPhoto(null);
			setNotice('Admin profile saved.');
		} catch (error) {
			setError(`Unable to save admin profile: ${String(error)}`);
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="admin-profile-shell" aria-labelledby="admin-profile-heading">
			{/* Profile summary */}
			<div className="admin-profile-hero">
				<div className="admin-profile-avatar">
					{profile.photoUrl ? (
						<img src={profile.photoUrl} alt="Administrator profile" />
					) : (
						<span aria-hidden="true">
							{(profile.displayName || user.email || 'A').charAt(0).toUpperCase()}
						</span>
					)}
				</div>

				<div>
					<p className="admin-profile-kicker">FREEBEE4ME · VERIFIED ADMINISTRATION</p>

					<h2 id="admin-profile-heading">
						{profile.displayName || user.displayName || 'Your admin profile'}
					</h2>

					<span className="admin-profile-role">{roleLabel}</span>
				</div>
			</div>

			<div className="admin-profile-grid">
				{/* Editable profile details */}
				<div className="admin-profile-panel">
					<h3>Edit your profile</h3>

					<form onSubmit={(e) => void save(e)} className="admin-profile-form">
						<label>
							Display name
							<input required maxLength={80} value={profile.displayName} onChange={(e) => change('displayName', e.target.value)} />
						</label>

						<label>
							Department / designation
							<input maxLength={80} value={profile.department} onChange={(e) => change('department', e.target.value)} placeholder="e.g. Community moderation" />
						</label>

						<label>
							About
							<textarea rows={4} maxLength={500} value={profile.bio} onChange={(e) => change('bio', e.target.value)} placeholder="Short professional introduction" />
						</label>

						<label>
							Profile photo
							<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
						</label>

						<small>JPEG, PNG or WebP · maximum 5 MB</small>

						{error && (
							<p className="form-error" role="alert">
								{error}
							</p>
						)}

						{notice && (
							<p role="status" className="admin-profile-success">
								{notice}
							</p>
						)}

						<button type="submit" disabled={busy}>
							{busy ? 'Saving…' : 'Save profile'}
						</button>
					</form>
				</div>

				{/* Account details */}
				<aside className="admin-profile-panel admin-profile-account">
					<h3>Account information</h3>

					<dl>
						<dt>Email</dt>
						<dd>{user.email || 'Not available'}</dd>

						<dt>Role</dt>
						<dd>{roleLabel}</dd>

						<dt>Account status</dt>
						<dd>Signed in · status managed by Firebase Authentication</dd>

						<dt>Member since</dt>
						<dd>
							{user.metadata.creationTime
								? new Date(user.metadata.creationTime).toLocaleDateString()
								: 'Not available'}
						</dd>

						<dt>Account ID</dt>
						<dd className="admin-profile-uid">{user.uid}</dd>
					</dl>

					<p className="admin-profile-note">
						Your administrator role and suspension status are protected. They cannot be changed from this
						profile.
					</p>
				</aside>
			</div>
		</section>
	);
}
