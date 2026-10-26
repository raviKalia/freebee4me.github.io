import type { Notification } from '../../types/notification';

type Props = {
	items: Notification[];
	onRead: (id: string) => void;
};

export default function NotificationList({ items, onRead }: Props) {
	return (
		<div className="notification-list">
			{items.length === 0 && (
				<p>
					No notifications yet.
				</p>
			)}

			{items.map(item => (
				<article key={item.id} className={item.read ? 'notification read' : 'notification'}>
					<h3>
						{item.title}

						{!item.read && (
							<span className="unread-label">
								{' · New'}
							</span>
						)}
					</h3>

					<p>
						{item.message}
					</p>

					<small>
						{new Date(item.createdAt).toLocaleString()}
					</small>

					{!item.read && (
						<button onClick={() => onRead(item.id)}>
							Mark as read
						</button>
					)}
				</article>
			))}
		</div>
	);
}