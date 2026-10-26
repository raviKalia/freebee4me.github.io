import RequestChat from './RequestChat';
import { useEffect, useState } from 'react';
import { collection, deleteField, doc, onSnapshot, query, runTransaction, where } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
type Request = {
	id: string;
	itemId: string;
	itemTitle: string;
	donorId: string;
	requesterId: string;
	status: string;
	message: string;
};
export default function RequestsPage() {
	const [received, setReceived] = useState<Request[]>([]),
		[sent, setSent] = useState<Request[]>([]),
		[error, setError] = useState(''),
		[busy, setBusy] = useState('');
	useEffect(() => {
		const uid = auth.currentUser?.uid;
		if (!uid) return;
		const a = onSnapshot(
			query(collection(db, 'requests'), where('donorId', '==', uid)),
			(snap) => setReceived(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Request)),
			(e) => setError(e.message),
		);
		const b = onSnapshot(
			query(collection(db, 'requests'), where('requesterId', '==', uid)),
			(snap) => setSent(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Request)),
			(e) => setError(e.message),
		);
		return () => {
			a();
			b();
		};
	}, []);
	async function change(r: Request, status: string) {
		setBusy(r.id);
		setError('');
		try {
			await runTransaction(db, async (t) => {
				const requestRef = doc(db, 'requests', r.id),
					itemRef = doc(db, 'items', r.itemId);
				const requestSnap = await t.get(requestRef),
					itemSnap = await t.get(itemRef);
				if (!requestSnap.exists() || !itemSnap.exists()) throw new Error('Item or request no longer exists.');
				const current = requestSnap.data();
				const item = itemSnap.data();
				const uid = auth.currentUser?.uid;
				if (
					status === 'cancelled' &&
					((current.requesterId !== uid && current.donorId !== uid) ||
						!['pending', 'accepted'].includes(current.status))
				)
					throw new Error('Only participants can cancel a pending or accepted request.');
				if (
					status !== 'cancelled' &&
					(current.donorId !== uid || !['pending', 'accepted'].includes(current.status))
				)
					throw new Error('You cannot change this request.');
				if (status === 'accepted' && (item.status !== 'available' || current.status !== 'pending'))
					throw new Error('Item is not available.');
				if (status === 'completed' && (current.status !== 'accepted' || item.status !== 'reserved'))
					throw new Error('Exchange cannot be completed.');
				t.update(requestRef, { status });
				if (status === 'accepted') t.update(itemRef, { status: 'reserved', acceptedRequestId: r.id });
				if (status === 'completed') t.update(itemRef, { status: 'completed' });
				// An accepted cancellation releases the reserved item for new requests.
				if (status === 'cancelled' && current.status === 'accepted') {
					if (item.status !== 'reserved' || item.acceptedRequestId !== r.id)
						throw new Error('Item reservation has changed.');
					t.update(itemRef, { status: 'available', acceptedRequestId: deleteField() });
				}
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy('');
		}
	}
	function show(r: Request, incoming: boolean) {
		return (
			<article key={r.id} className="request-card">
				<h3>{r.itemTitle}</h3>
				<p>
					Status: <strong>{r.status}</strong>
				</p>
				{incoming && r.message && <p>Message: {r.message}</p>}
				<RequestChat requestId={r.id} status={r.status} />
				<div className="action-row">
					{incoming && r.status === 'pending' && (
						<>
							<button disabled={!!busy} onClick={() => void change(r, 'accepted')}>
								Accept
							</button>
							<button disabled={!!busy} onClick={() => void change(r, 'rejected')}>
								Reject
							</button>
						</>
					)}
					{incoming && r.status === 'accepted' && (
						<button disabled={!!busy} onClick={() => void change(r, 'completed')}>
							Mark exchange complete
						</button>
					)}
					{['pending', 'accepted'].includes(r.status) && (
						<button disabled={!!busy} className="cancel-request" onClick={() => { if ( window.confirm( 'Cancel this request? If accepted, the item becomes available again and private chat closes.', ) ) void change(r, 'cancelled'); }} >
							Cancel request
						</button>
					)}
				</div>
			</article>
		);
	}
	return (
		<section className="feature-panel">
			<h1>Item Requests</h1>
			{error && <p role="alert">{error}</p>}
			<h2>Requests received</h2>
			{received.length ? received.map((r) => show(r, true)) : <p>No requests received yet.</p>}
			<h2>Requests sent</h2>
			{sent.length ? sent.map((r) => show(r, false)) : <p>No requests sent yet.</p>}
		</section>
	);
}
