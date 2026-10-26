import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

import { auth, db } from '../../firebase/config';

type Alert = {
	id: string;
	title: string;
	body: string;
	read: boolean;
	link: string;
	createdAt?: {
		seconds: number;
	};
};

type Props = {
	onNavigate?: (page: string) => void;
};

export default function LiveNotifications({ onNavigate }: Props) {
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const [open, setOpen] = useState(false);
	const [error, setError] = useState('');

	// Listen for new request and contact notifications.
	useEffect(() => {
		const uid = auth.currentUser?.uid;

		if (!uid) {
			return;
		}

		const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', uid));

		return onSnapshot(
			notificationsQuery,
			(snapshot) => {
				const notifications = snapshot.docs.map(
					(document) =>
						({
							...document.data(),
							id: document.id,
						}) as Alert,
				);

				// Show the newest notifications first.
				notifications.sort((a, b) => {
					const firstTime = a.createdAt?.seconds || 0;
					const secondTime = b.createdAt?.seconds || 0;

					return secondTime - firstTime;
				});

				setError('');
				setAlerts(notifications);
			},
			(error) => {
				console.error('Notifications:', error);
				setError('Notifications could not load. Check the deployed Firestore rules.');
			},
		);
	}, []);

	const unread = alerts.filter((alert) => !alert.read).length;

	// Mark the selected notification as read.
	async function markRead(id: string) {
		try {
			await updateDoc(doc(db, 'notifications', id), {
				read: true,
			});
		} catch (error) {
			console.error(error);
		}
	}

	function viewNotification(alert: Alert) {
		void markRead(alert.id);
		onNavigate?.(alert.link);
		setOpen(false);
	}

	return (
		<div className="live-notifications">
			{/* Notification toggle and unread count */}
			<button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
				🔔 Alerts {unread > 0 ? `(${unread})` : ''}
			</button>

			{open && (
				<div className="live-notification-list">
					<h3>Notifications</h3>

					{error && <p role="alert">{error}</p>}

					{alerts.length === 0 && <p>No notifications yet.</p>}

					{/* Display up to 25 notifications */}
					{alerts.slice(0, 25).map((alert) => (
						<article key={alert.id} className={alert.read ? '' : 'unread-alert'}>
							<strong>{alert.title}</strong>

							<p>{alert.body}</p>

							<button type="button" onClick={() => viewNotification(alert)}>
								View / Mark read
							</button>
						</article>
					))}
				</div>
			)}
		</div>
	);
}
