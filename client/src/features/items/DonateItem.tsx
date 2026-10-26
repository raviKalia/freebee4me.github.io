import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';
import { validateImage } from '../../utils/imageValidation';

const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Home', 'Other'];
export default function DonateItem({ done }: { done: () => void }) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState('Other');
	const [condition, setCondition] = useState('Good');
	const [city, setCity] = useState('');
	const [postalCode, setPostalCode] = useState('');
	const [photos, setPhotos] = useState<File[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	// Upload photos to Firebase Storage and store only public item details in Firestore.
	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const user = auth.currentUser;
		if (!user) {
			setError('Please log in first.');
			return;
		}
		if (photos.length > 5) {
			setError('Select up to 5 images.');
			return;
		}
		for (const photo of photos) {
			const issue = validateImage(photo);
			if (issue) {
				setError(`${photo.name}: ${issue}`);
				return;
			}
		}
		setBusy(true);
		setError('');
		try {
			const imageUrls: string[] = [];

			for (const photo of photos) {
				// Create the image path inside the user's folder.
				const fileRef = ref(
					storage,
					`items/${user.uid}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '')}`,
				);

				// Upload the image to Firebase Storage.
				await uploadBytes(fileRef, photo, {
					contentType: photo.type,
				});

				// Save the uploaded image URL.
				imageUrls.push(await getDownloadURL(fileRef));
			}

			await addDoc(collection(db, 'items'), {
				title: title.trim(),
				description: description.trim(),
				category,
				condition,
				city: city.trim(),
				postalCode: postalCode.trim().toUpperCase().slice(0, 3),
				imageUrls,
				ownerId: user.uid,
				status: 'available',
				createdAt: serverTimestamp(),
			});
			done();
			// console check for successful Firestore save

			console.log('Donation saved successfully!');
		} catch (err) {
			console.error('Donation failed:', err);
			setError(err instanceof Error ? err.message : 'Unable to publish item.');
		} finally {
			setBusy(false);
		}
	}
	return (
		<section className="feature-panel">
			<h1>Donate an item</h1>
			<p>Give your item a second home. Your exact address is never published.</p>
			<form className="feature-form" onSubmit={submit}>
				<label>
					Item name
					<input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
				</label>
				<label>
					Category
					<select value={category} onChange={(e) => setCategory(e.target.value)}>
						{categories.map((c) => (
							<option key={c}>{c}</option>
						))}
					</select>
				</label>
				<label>
					Condition
					<select value={condition} onChange={(e) => setCondition(e.target.value)}>
						{['New', 'Like New', 'Good', 'Fair'].map((c) => (
							<option key={c}>{c}</option>
						))}
					</select>
				</label>
				<label>
					Description
					<textarea required maxLength={2000} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
				</label>
				<label>
					City
					<input required value={city} onChange={(e) => setCity(e.target.value)} />
				</label>
				<label>
					Postal code (first 3 characters shown publicly)
					<input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
				</label>
				<label>
					Item photos (up to 5, maximum 5 MB each; JPG, PNG or WebP only)
					<input
						type="file"
						accept="image/png,image/jpeg,image/webp"
						multiple
						onChange={(e) => {
							const files = Array.from(e.target.files || []);
							if (files.length > 5) {
								setPhotos([]);
								setError('Select up to 5 images.');
								e.target.value = '';
								return;
							}
							const invalid = files.find((file) => validateImage(file));
							if (invalid) {
								setPhotos([]);
								setError(`${invalid.name}: ${validateImage(invalid)}`);
								e.target.value = '';
								return;
							}
							setError('');
							setPhotos(files);
						}}
					/>
				</label>
				{error && (
					<p className="form-error" role="alert">
						{error}
					</p>
				)}
				<button disabled={busy} type="submit">
					{busy ? 'Publishing…' : 'Publish donation'}
				</button>
			</form>
		</section>
	);
}
