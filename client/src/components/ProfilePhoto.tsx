import { useState } from 'react';

import { imageUrl, uploadProfilePhoto } from '../services/profileService';

type Props = {
	photoUrl?: string;
	onUploaded: (url: string) => void;
	setMessage: (value: string) => void;
};

export default function ProfilePhoto({ photoUrl, onUploaded, setMessage }: Props) {
	const [busy, setBusy] = useState(false);

	// Validate and upload the selected profile picture.
	async function upload(file?: File) {
		if (!file) {
			return;
		}

		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		const maxSize = 2 * 1024 * 1024;

		if (!allowedTypes.includes(file.type) || file.size > maxSize) {
			setMessage('Choose a JPEG, PNG or WebP image under 2 MB.');
			return;
		}

		setBusy(true);

		try {
			const result = await uploadProfilePhoto(file);

			onUploaded(result.photoUrl);
			setMessage('Photo uploaded.');
		} catch {
			setMessage('Unable to upload photo.');
		} finally {
			setBusy(false);
		}
	}

	return (
		<aside className="photo">
			<div className="avatar">
				{photoUrl ? (
					<img src={imageUrl(photoUrl)} alt="Profile" />
				) : (
					'👤'
				)}
			</div>

			<h3>
				Profile picture
			</h3>

			<p>
				JPEG, PNG or WebP · max 2 MB
			</p>

			<label className="upload">
				{busy ? 'Uploading...' : 'Upload picture'}
				<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => void upload(e.target.files?.[0])} hidden />
			</label>
		</aside>
	);
}