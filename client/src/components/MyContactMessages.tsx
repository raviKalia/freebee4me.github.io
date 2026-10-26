import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { auth, db } from '../firebase/config';

type Ticket = {
	id: string;
	subject: string;
	message: string;
};

type Reply = {
	id: string;
	text: string;
};

export default function MyContactMessages() {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [error, setError] = useState('');

	// Only load messages created by the signed-in user.
	useEffect(() => {
		const uid = auth.currentUser?.uid;

		if (!uid) {
			return;
		}

		const ticketsQuery = query(collection(db, 'contactMessages'), where('userId', '==', uid));

		return onSnapshot(
			ticketsQuery,
			(snapshot) => {
				setTickets(
					snapshot.docs.map(
						(document) =>
							({
								id: document.id,
								...document.data(),
							}) as Ticket,
					),
				);
			},
			(error) => {
				setError(error.message);
			},
		);
	}, []);

	if (!auth.currentUser) {
		return <p>Sign in to receive support replies in your notifications.</p>;
	}

	return (
		<section className="my-contact-messages">
			<h3>Your support messages</h3>

			{error && <p role="alert">{error}</p>}

			{tickets.length === 0 && <p>No support messages sent from this account yet.</p>}

			{tickets.map((ticket) => (
				<article className="support-ticket" key={ticket.id}>
					<strong>{ticket.subject}</strong>

					<p>{ticket.message}</p>

					<MyReplies ticketId={ticket.id} />
				</article>
			))}
		</section>
	);
}

// Display live support replies for a specific message.
function MyReplies({ ticketId }: { ticketId: string }) {
	const [replies, setReplies] = useState<Reply[]>([]);

	useEffect(() => {
		return onSnapshot(
			collection(db, 'contactMessages', ticketId, 'replies'),
			(snapshot) => {
				setReplies(
					snapshot.docs.map(
						(document) =>
							({
								id: document.id,
								...document.data(),
							}) as Reply,
					),
				);
			},
			(error) => {
				console.error('Support reply listener:', error);
			},
		);
	}, [ticketId]);

	return (
		<div className="support-replies">
			{replies.length === 0 ? (
				<small>Awaiting a reply</small>
			) : (
				replies.map((reply) => (
					<p key={reply.id}>
						<strong>Team response:</strong> {reply.text}
					</p>
				))
			)}
		</div>
	);
}
