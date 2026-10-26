import { useCallback, useEffect, useState } from 'react';
import type { DemoRole } from '../types/trade';
import type { Notification, NotificationPreferences } from '../types/notification';
import { getNotifications, getNotificationPreferences, markRead, saveNotificationPreferences } from '../services/notificationService';
import NotificationList from '../components/notifications/NotificationList';
import NotificationSettings from '../components/notifications/NotificationSettings';
export default function NotificationsPage() {
 const [role, setRole] = useState<DemoRole>('demo-recipient');
 const [items, setItems] = useState<Notification[]>([]);
 const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
 const [notice, setNotice] = useState('');
 const refresh = useCallback(() => {
  getNotifications(role).then(setItems).catch(() => setNotice('Could not load notifications. Start the backend.'));
  getNotificationPreferences(role).then(setPrefs).catch(() => setNotice('Could not load preferences.'));
 }, [role]);
 useEffect(() => { refresh(); }, [refresh]);
 async function read(id: string) { try { await markRead(role,id); refresh(); } catch { setNotice('Could not mark as read.'); } }
 async function save() { if (!prefs) return; try { await saveNotificationPreferences(role,prefs); setNotice('Preferences saved. Email delivery requires SMTP configuration.'); } catch { setNotice('Could not save preferences.'); } }
 return <section className="info-page"><span className="eyebrow">UPDATES</span><h2>Notifications</h2>
  <p className="lead">See trade updates and choose how you receive alerts.</p>
  <label>Demo account <select value={role} onChange={e => setRole(e.target.value as DemoRole)}>
   <option value="demo-recipient">Recipient</option><option value="demo-donor">Donor</option>
  </select></label>
  <div className="notification-toolbar"><button onClick={refresh}>Refresh notifications</button>
   <span aria-live="polite">{items.filter(n => !n.read).length} unread</span></div>
  {notice && <p role="status">{notice}</p>}
  <NotificationList items={items} onRead={id => void read(id)} />
  {prefs && <><NotificationSettings value={prefs} onChange={setPrefs}/><button onClick={() => void save()}>Save notification settings</button></>}
  <p className="notification-note">This is a development demo. Email is sent only if SMTP and recipient addresses are configured. Notifications are lost on server restart.</p>
 </section>;
}
