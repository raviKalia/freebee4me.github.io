import type { NotificationPreferences } from '../../types/notification';

type Props = {
	value: NotificationPreferences;
	onChange: (next: NotificationPreferences) => void;
};

const labels: Record<keyof NotificationPreferences, string> = {
	inApp: 'In-app notifications',
	email: 'Email notifications',
	newRequest: 'New item requests',
	requestUpdate: 'Request accepted/rejected',
	newMessage: 'New chat messages',
	tradeCompleted: 'Trade completed',
};

export default function NotificationSettings({ value, onChange }: Props) {
	return (
		<fieldset className="notification-settings">
			<legend>
				Notification preferences
			</legend>

			{(Object.keys(labels) as (keyof NotificationPreferences)[]).map(key => (
				<label key={key}>
					<span>
						{labels[key]}
					</span>

					<input type="checkbox" checked={value[key]} onChange={event => onChange({ ...value, [key]: event.target.checked })} />
				</label>
			))}
		</fieldset>
	);
}