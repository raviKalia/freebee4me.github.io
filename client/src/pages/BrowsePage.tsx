import { useEffect, useMemo, useState } from 'react';
import {
	collection,
	doc,
	onSnapshot,
	query,
	runTransaction,
	serverTimestamp,
	where,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import LocationFilter from '../components/LocationFilter';
import type { Coordinates } from '../types';
type Listing = {
	id: string;
	ownerId: string;
	title: string;
	description: string;
	category: string;
	city: string;
	postalCode?: string;
	imageUrls?: string[];
	status: string;
};
export default function BrowsePage({
	search,
	setMessage,
	goTo,
}: {
	search: string;
	setMessage: (v: string) => void;
	goTo: () => void;
}) {
	const [items, setItems] = useState<Listing[]>([]),
		[category, setCategory] = useState('All'),
		[city, setCity] = useState(''),
		[postalCode, setPostalCode] = useState('');
	const [radius, setRadius] = useState('25'),
		[coords, setCoords] = useState<Coordinates | null>(null),
		[loading, setLoading] = useState(true),
		[busy, setBusy] = useState(''),
		[note, setNote] = useState('');
	useEffect(
		() =>
			onSnapshot(
				query(collection(db, 'items'), where('status', '==', 'available')),
				(snap) => {
					setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing));
					setLoading(false);
				},
				(e) => {
					setLoading(false);
					setMessage(e.message);
				},
			),
		[setMessage],
	);
	const shown = useMemo(
		() =>
			items.filter(
				(i) =>
					`${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase()) &&
					(category === 'All' || i.category === category) &&
					(!city || i.city.toLowerCase().includes(city.toLowerCase())) &&
					(!postalCode || (i.postalCode || '').toLowerCase().startsWith(postalCode.toLowerCase())),
			),
		[items, search, category, city, postalCode],
	);
	async function requestItem(item: Listing) {
		const user = auth.currentUser;
		if (!user) {
			goTo();
			return;
		}
		if (user.uid === item.ownerId) {
			setNote('You cannot request your own item.');
			return;
		}
		const message = window.prompt('Optional message to the donor (max 500 characters):', '');
		if (message === null) return;
		setBusy(item.id);
		setNote('');
		try {
			// Deterministic ID prevents multiple requests by the same recipient for one item.
			const requestRef = doc(db, 'requests', `${item.id}_${user.uid}`),
				itemRef = doc(db, 'items', item.id);
			await runTransaction(db, async (t) => {
				const [existing, listing] = await Promise.all([t.get(requestRef), t.get(itemRef)]);
				if (existing.exists()) throw new Error('You already requested this item.');
				if (!listing.exists() || listing.data().status !== 'available')
					throw new Error('This item is no longer available.');
				t.set(requestRef, {
					itemId: item.id,
					itemTitle: item.title,
					donorId: item.ownerId,
					requesterId: user.uid,
					status: 'pending',
					message: message.slice(0, 500),
					createdAt: serverTimestamp(),
				});
			});
			setNote('Request sent! Check Item Requests to track it.');
		} catch (e) {
			setNote(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy('');
		}
	}
	return (
		<>
			<div className="section-title">
				<div>
					<span className="eyebrow">DISCOVER</span>
					<h2>Explore free items</h2>
				</div>
				<p>Find something useful near you.</p>
			</div>
			<div className="filters">
				<label>
					Category
					<select value={category} onChange={(e) => setCategory(e.target.value)}>
						{['All', 'Electronics', 'Furniture', 'Clothing', 'Books', 'Home', 'Other'].map((c) => (
							<option key={c}>{c}</option>
						))}
					</select>
				</label>
				<LocationFilter {...{ city, postalCode, radius, coords, setCity, setPostalCode, setRadius, setCoords, setMessage }} />
			</div>
			{coords && <p>Distance filtering requires item coordinates; city/postal filtering is active.</p>}
			{note && <p role="status">{note}</p>}
			{loading ? (
				<p>Loading items…</p>
			) : (
				<div className="items">
					{shown.map((item) => (
						<article className="item" key={item.id}>
							{item.imageUrls?.[0] ? (
								<img className="listing-photo" src={item.imageUrls[0]} alt={item.title} />
							) : (
								<div className="item-art">♻</div>
							)}
							<div className="item-body">
								<small>{item.category}</small>
								<h3>{item.title}</h3>
								<p>{item.description}</p>
								<span>📍 {item.city}</span>
								<strong className="free-label">FREE</strong>
								{auth.currentUser?.uid !== item.ownerId && (
									<button disabled={busy === item.id} onClick={() => void requestItem(item)}>
										{busy === item.id ? 'Sending…' : 'Request item'}
									</button>
								)}
							</div>
						</article>
					))}
				</div>
			)}
			{!loading && !shown.length && <p>No items found. Try another category or location.</p>}
		</>
	);
}
