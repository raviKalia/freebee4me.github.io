import { useEffect, useState, type FormEvent } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

type Message = { id: string; senderId: string; text: string };

/** Messages are never loaded until the donor accepts a request. Firestore rules enforce this too. */
export default function RequestChat({ requestId, status }: { requestId: string; status: string }) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [text, setText] = useState('');
	const [error, setError] = useState('');
	const [sending, setSending] = useState(false);
	const enabled = status === 'accepted';
	useEffect(() => {
		if (!enabled) {
			setMessages([]);
			return;
		}
		const messagesRef = collection(db, 'requests', requestId, 'messages');
		return onSnapshot(
			query(messagesRef, orderBy('createdAt', 'asc')),
			(snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)),
			(err) => setError(err.message),
		);
	}, [enabled, requestId]);
	async function send(event: FormEvent) {
		event.preventDefault();
		const user = auth.currentUser;
		if (!enabled || !user || !text.trim()) return;
		setSending(true);
		setError('');
		try {
			await addDoc(collection(db, 'requests', requestId, 'messages'), {
				senderId: user.uid,
				text: text.trim().slice(0, 1000),
				createdAt: serverTimestamp(),
			});
			setText('');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSending(false);
		}
	}
	if (!enabled)
		return (
			<p className="privacy-note">
				{status === 'completed'
					? 'Chat closed: exchange completed.'
					: 'Chat is available only after the donor accepts.'}
			</p>
		);
	return (
		<div className="request-chat">
			<h4>Private exchange chat</h4>
			<div className="chat-messages" aria-live="polite">
				{messages.length ? (
					messages.map((m) => (
						<p key={m.id} className={m.senderId === auth.currentUser?.uid ? 'chat-own' : 'chat-other'}>
							<strong>{m.senderId === auth.currentUser?.uid ? 'You' : 'Other person'}:</strong> {m.text}
						</p>
					))
				) : (
					<p>No messages yet. Arrange pickup safely.</p>
				)}
			</div>
			<form onSubmit={(e) => void send(e)} className="chat-send">
				<input aria-label="Message" maxLength={1000} required value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" />
				<button disabled={sending || !text.trim()}>Send</button>
			</form>
			{error && (
				<p role="alert" className="form-error">
					{error}
				</p>
			)}
		</div>
	);
}
