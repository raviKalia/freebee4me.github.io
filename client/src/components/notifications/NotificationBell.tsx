type Props = {
	count: number;
	open: () => void;
};

export default function NotificationBell({ count, open }: Props) {
	return (
		<button className="notification-bell" onClick={open} aria-label={`Notifications, ${count} unread`}>
			Notifications

			{count > 0 && (
				<span aria-hidden="true">
					{' '}({count})
				</span>
			)}
		</button>
	);
}