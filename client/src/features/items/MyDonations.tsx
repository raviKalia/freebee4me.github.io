import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';
import { validateImage } from '../../utils/imageValidation';
type Listing = {
	id: string;
	ownerId: string;
	title: string;
	description: string;
	category: string;
	condition: string;
	city: string;
	postalCode: string;
	imageUrls: string[];
	status: string;
};
const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Home', 'Other'];
export default function MyDonations() {
	const [items, setItems] = useState<Listing[]>([]),
		[editing, setEditing] = useState<Listing | null>(null);
	const [photos, setPhotos] = useState<File[]>([]),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(''),
		[notice, setNotice] = useState('');
	useEffect(() => {
		const uid = auth.currentUser?.uid;
		if (!uid) return;
		return onSnapshot(
			query(collection(db, 'items'), where('ownerId', '==', uid)),
			(snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing)),
			(err) => setError(err.message),
		);
	}, []);
	async function remove(item: Listing) {
		if (!window.confirm('Permanently delete this donation?')) return;
		try {
			await deleteDoc(doc(db, 'items', item.id));
			setNotice('Donation removed.');
		} catch (e) {
			setError(String(e));
		}
	}
	async function save(e: React.FormEvent) {
		e.preventDefault();
		if (!editing) return;
		const user = auth.currentUser;
		if (!user) return;
		if (editing.imageUrls.length + photos.length > 5) {
			setError('Maximum 5 photos. Remove existing photos first.');
			return;
		}
		for (const photo of photos) {
			const issue = validateImage(photo);
			if (issue) {
				setError(issue);
				return;
			}
		}
		setBusy(true);
		setError('');
		try {
			const urls = [...editing.imageUrls];
			for (const photo of photos) {
				const file = ref(
					storage,
					`items/${user.uid}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '')}`,
				);
				await uploadBytes(file, photo, { contentType: photo.type });
				urls.push(await getDownloadURL(file));
			}
			await updateDoc(doc(db, 'items', editing.id), {
				title: editing.title.trim(),
				description: editing.description.trim(),
				category: editing.category,
				condition: editing.condition,
				city: editing.city.trim(),
				postalCode: editing.postalCode.trim().toUpperCase().slice(0, 3),
				imageUrls: urls,
			});
			setEditing(null);
			setPhotos([]);
			setNotice('Donation updated.');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	}
	async function removePhoto(url: string) {
		if (!editing) return;
		setError('');
		const next = editing.imageUrls.filter((u) => u !== url);
		try {
			await updateDoc(doc(db, 'items', editing.id), { imageUrls: next });
			setEditing({ ...editing, imageUrls: next });
			// Removing the storage object is best effort; the database no longer references it.
			try {
				await deleteObject(ref(storage, url));
			} catch (err) {
				console.warn('Old image cleanup:', err);
			}
		} catch (err) {
			setError(String(err));
		}
	}
	return (
		<section className="feature-panel">
			<h1>My Donations</h1>
			{error && (
				<p role="alert" className="form-error">
					{error}
				</p>
			)}
			{notice && <p role="status">{notice}</p>}
			{!items.length && <p>You have not donated any items yet.</p>}
			{items.map((item) => (
				<article className="donation-row" key={item.id}>
					<div>
						{item.imageUrls?.[0] && <img className="mini-photo" src={item.imageUrls[0]} alt="" />}
						<strong>{item.title}</strong>
						<p>
							{item.city} · {item.status}
						</p>
					</div>
					<div className="action-row">
						<button onClick={() => { setEditing({ ...item, imageUrls: item.imageUrls || [] }); setPhotos([]); setError(''); }} >
							Edit
						</button>
						<button onClick={() => void remove(item)}>Remove</button>
					</div>
				</article>
			))}
			{editing && (
				<form className="feature-form editor" onSubmit={(e) => void save(e)}>
					<h2>Edit donation</h2>
					<label>
						Item name
						<input required maxLength={100} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
					</label>
					<label>
						Description
						<textarea required maxLength={2000} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
					</label>
					<label>
						Category
						<select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} >
							{categories.map((c) => (
								<option key={c}>{c}</option>
							))}
						</select>
					</label>
					<label>
						Condition
						<select value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value })} >
							{['New', 'Like New', 'Good', 'Fair'].map((c) => (
								<option key={c}>{c}</option>
							))}
						</select>
					</label>
					<label>
						City
						<input required value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
					</label>
					<label>
						Postal prefix
						<input maxLength={3} value={editing.postalCode || ''} onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })} />
					</label>
					<div className="photo-strip">
						{editing.imageUrls.map((url) => (
							<div key={url}>
								<img src={url} alt="Donation" />
								<button type="button" onClick={() => void removePhoto(url)}>
									Remove photo
								</button>
							</div>
						))}
					</div>
					<label>
						Add photos (maximum 5 total)
						<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
					</label>
					<div className="action-row">
						<button disabled={busy} type="submit">
							{busy ? 'Saving…' : 'Save changes'}
						</button>
						<button type="button" onClick={() => setEditing(null)}>
							Cancel
						</button>
					</div>
				</form>
			)}
		</section>
	);
}
