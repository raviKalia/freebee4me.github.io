import { useCallback, useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { auth, db } from '../../firebase/config';

// Donation information stored in Firestore.
type Item = {
	id: string;
	title: string;
	ownerId: string;
	status: string;
	city: string;
	description?: string;
	category?: string;
	condition?: string;
	postalCode?: string;
	imageUrls?: string[];
};

// Request information for administrator monitoring.
type ItemRequest = {
	id: string;
	itemTitle: string;
	status: string;
	donorId: string;
	requesterId: string;
};

// Firebase Authentication account information.
type Member = {
	uid: string;
	displayName: string;
	email: string;
	disabled: boolean;
	role: string;
	createdAt?: string;
};

type ContactMessage = {
	id: string;
	name: string;
	email: string;
	subject: string;
	message: string;
};

type Reply = {
	id: string;
	text: string;
};

type Props = {
	masterAdmin: boolean;
};

type DirectoryResponse = {
	users: Member[];
	nextPageToken: string | null;
};

const functions = getFunctions(undefined, 'us-central1');

export default function AdminPage({ masterAdmin }: Props) {
	const [tab, setTab] = useState('overview');

	const [items, setItems] = useState<Item[]>([]);
	const [requests, setRequests] = useState<ItemRequest[]>([]);
	const [users, setUsers] = useState<Member[]>([]);
	const [messages, setMessages] = useState<ContactMessage[]>([]);

	const [directory, setDirectory] = useState<Member[]>([]);
	const [directoryLoading, setDirectoryLoading] = useState(false);
	const [directoryLoaded, setDirectoryLoaded] = useState(false);

	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [selectedUser, setSelectedUser] = useState<string | null>(null);

	const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

	const [busy, setBusy] = useState('');
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');

	// Read registered accounts through a protected Cloud Function.
	const loadDirectory = useCallback(async () => {
		setDirectoryLoading(true);
		setError('');

		try {
			const listUsers = httpsCallable<{ pageToken?: string }, DirectoryResponse>(
				functions,
				'listPlatformUsers',
			);

			const allUsers: Member[] = [];
			let pageToken: string | null = null;

			do {
				const result: { data: DirectoryResponse } = await listUsers(pageToken ? { pageToken } : {});

				allUsers.push(...result.data.users);
				pageToken = result.data.nextPageToken;
			} while (pageToken);

			setDirectory(allUsers);
			setDirectoryLoaded(true);
		} catch (error) {
			setDirectory([]);
			setDirectoryLoaded(false);
			setError('Unable to load account directory: ' + String(error));
		} finally {
			setDirectoryLoading(false);
		}
	}, []);

	// Listen to platform information in real time.
	useEffect(() => {
		const stopItems = onSnapshot(
			collection(db, 'items'),
			(snapshot) => {
				setItems(
					snapshot.docs.map(
						(item) =>
							({
								id: item.id,
								...item.data(),
							}) as Item,
					),
				);
			},
			(error) => setError('Items: ' + error.message),
		);

		const stopRequests = onSnapshot(
			collection(db, 'requests'),
			(snapshot) => {
				setRequests(
					snapshot.docs.map(
						(request) =>
							({
								id: request.id,
								...request.data(),
							}) as ItemRequest,
					),
				);
			},
			(error) => setError('Requests: ' + error.message),
		);

		const stopMessages = onSnapshot(
			collection(db, 'contactMessages'),
			(snapshot) => {
				setMessages(
					snapshot.docs.map(
						(message) =>
							({
								id: message.id,
								...message.data(),
							}) as ContactMessage,
					),
				);
			},
			(error) => setError('Contact messages: ' + error.message),
		);

		const stopUsers = onSnapshot(
			collection(db, 'publicUsers'),
			(snapshot) => {
				setUsers(
					snapshot.docs.map(
						(user) =>
							({
								uid: user.id,
								...user.data(),
							}) as Member,
					),
				);
			},
			(error) => setError('Public users: ' + error.message),
		);

		// Remove listeners when the component closes.
		return () => {
			stopItems();
			stopRequests();
			stopMessages();
			stopUsers();
		};
	}, []);

	// Load the account directory when the dashboard opens.
	useEffect(() => {
		void loadDirectory();
	}, [loadDirectory, masterAdmin]);

	// Open Contact when a notification sends this event.
	useEffect(() => {
		function openContact() {
			setTab('contact');
		}

		window.addEventListener('freebee4me:contact-alert', openContact);

		return () => {
			window.removeEventListener('freebee4me:contact-alert', openContact);
		};
	}, []);

	// Send a support reply to a contact message.
	async function sendReply(messageId: string) {
		const reply = (replyDrafts[messageId] || '').trim();

		if (!reply) {
			setError('Please write a reply first.');
			return;
		}

		if (reply.length > 2000) {
			setError('Reply must be under 2000 characters.');
			return;
		}

		setBusy(messageId);
		setError('');
		setNotice('');

		try {
			// Save the reply under the original contact message.
			const replyRef = await addDoc(collection(db, 'contactMessages', messageId, 'replies'), {
				text: reply,
				createdAt: serverTimestamp(),
			});

			console.log('Reply saved:', replyRef.id);

			// Clear the input after Firestore confirms success.
			setReplyDrafts((previous) => ({
				...previous,
				[messageId]: '',
			}));

			setNotice('Reply sent successfully.');
		} catch (error: unknown) {
			console.error('Contact reply error:', error);

			if (
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				error.code === 'permission-denied'
			) {
				setError('Permission denied. Check Firestore rules for contact replies.');
			} else {
				setError('Unable to confirm the reply was saved. Check Firestore before retrying.');
			}
		} finally {
			setBusy('');
		}
	}

	// Hide or restore a donation listing.
	async function changeItem(item: Item, status: string) {
		setBusy(item.id);
		setError('');
		setNotice('');

		try {
			await updateDoc(doc(db, 'items', item.id), {
				status,
			});

			setNotice('Listing status updated.');
		} catch (error) {
			setError('Unable to update item: ' + String(error));
		} finally {
			setBusy('');
		}
	}

	// Permanently delete a listing through the backend.
	async function deleteItem(item: Item) {
		if (!window.confirm(`Permanently delete "${item.title}"?`)) {
			return;
		}

		setBusy(item.id);
		setError('');
		setNotice('');

		try {
			const deleteListing = httpsCallable(functions, 'deleteModeratedItem');

			await deleteListing({
				itemId: item.id,
			});

			setNotice('Listing deleted successfully.');
		} catch (error) {
			setError('Unable to delete listing: ' + String(error));
		} finally {
			setBusy('');
		}
	}

	// Master Admin can appoint or revoke administrators.
	async function changeRole(user: Member, role: 'admin' | 'user' | 'disabled') {
		if (!masterAdmin || user.role === 'masterAdmin' || user.uid === auth.currentUser?.uid) {
			return;
		}

		if (!window.confirm(`Change ${user.email || user.uid} to ${role}?`)) {
			return;
		}

		setBusy(user.uid);
		setError('');
		setNotice('');

		try {
			const setRole = httpsCallable(functions, 'setUserRole');

			await setRole({
				uid: user.uid,
				role,
			});

			setNotice('Administrator role updated.');

			await loadDirectory();
		} catch (error) {
			setError('Unable to change role: ' + String(error));
		} finally {
			setBusy('');
		}
	}

	// Admins can moderate regular users.
	// Only Master Admin can moderate other administrators.
	async function moderateAccount(user: Member, action: 'suspend' | 'activate' | 'delete') {
		if (
			user.uid === auth.currentUser?.uid ||
			user.role === 'masterAdmin' ||
			(!masterAdmin && user.role === 'admin')
		) {
			return;
		}

		if (!window.confirm(`${action.toUpperCase()} account: ${user.email || user.uid}?`)) {
			return;
		}

		setBusy(user.uid);
		setError('');
		setNotice('');

		try {
			const moderate = httpsCallable(functions, 'moderateAccount');

			await moderate({
				uid: user.uid,
				action,
			});

			setNotice(`Account ${action} completed.`);

			await loadDirectory();
		} catch (error) {
			setError('Account action failed: ' + String(error));
		} finally {
			setBusy('');
		}
	}

	// Display only the account actions allowed for the current role.
	function accountButtons(user: Member) {
		const protectedAccount =
			user.uid === auth.currentUser?.uid ||
			user.role === 'masterAdmin' ||
			(!masterAdmin && user.role === 'admin');

		if (protectedAccount) {
			return <span>Protected account</span>;
		}

		return (
			<div className="action-row">
				{user.disabled ? (
					<button disabled={!!busy} onClick={() => void moderateAccount(user, 'activate')}>
						Reactivate
					</button>
				) : (
					<button disabled={!!busy} onClick={() => void moderateAccount(user, 'suspend')}>
						Suspend
					</button>
				)}

				<button className="danger-action" disabled={!!busy} onClick={() => void moderateAccount(user, 'delete')} >
					Delete account
				</button>
			</div>
		);
	}

	const tabs = [
		'overview',
		'items',
		'requests',
		'users',
		'contact',
		...(masterAdmin ? ['appoint admins'] : []),
	];

	return (
		<section className="admin-dashboard">
			<span className="eyebrow">FREEBEE4ME ADMINISTRATION</span>

			<h1>{masterAdmin ? 'Master Admin' : 'Admin'} Dashboard</h1>

			<p>Manage registered accounts, donated items, requests, and support messages.</p>

			{/* Dashboard statistics */}
			<div className="admin-stats">
				<article className="admin-card">
					<h2>Listings</h2>

					<strong>{items.length}</strong>
				</article>

				<article className="admin-card">
					<h2>Requests</h2>

					<strong>{requests.length}</strong>
				</article>

				<article className="admin-card">
					<h2>Registered users</h2>

					<strong>{directoryLoaded ? directory.length : users.length}</strong>
				</article>
			</div>

			{/* Dashboard navigation */}
			<nav className="admin-tabs" aria-label="Admin sections">
				{tabs.map((name) => (
					<button key={name} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}>
						{name}
					</button>
				))}
			</nav>

			{error && (
				<p className="form-error" role="alert">
					{error}
				</p>
			)}

			{notice && <p role="status">{notice}</p>}

			{/* Overview */}
			{tab === 'overview' && (
				<div className="admin-card">
					<h2>Platform overview</h2>

					<p>Available items: {items.filter((item) => item.status === 'available').length}</p>

					<p>Reserved items: {items.filter((item) => item.status === 'reserved').length}</p>

					<p>Completed exchanges: {items.filter((item) => item.status === 'completed').length}</p>

					<p>Pending requests: {requests.filter((request) => request.status === 'pending').length}</p>
				</div>
			)}

			{/* Item management */}
			{tab === 'items' && (
				<div>
					<h2>Manage donated items</h2>

					<div className="moderation-grid">
						{items.map((item) => (
							<article className="moderation-card" key={item.id}>
								{item.imageUrls?.[0] && (
									<img className="moderation-image" src={item.imageUrls[0]} alt={item.title} />
								)}

								<div className="moderation-card-body">
									<span className="moderation-status">{item.status}</span>

									<h3>{item.title}</h3>

									<p>
										{item.city} · {item.category || 'Other'}
									</p>

									<div className="action-row">
										<button onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}>
											{selectedItem === item.id ? 'Hide details' : 'Full item details'}
										</button>

										<button onClick={() => { setTab('users'); setSelectedUser(item.ownerId); }} >
											View owner
										</button>
									</div>

									{selectedItem === item.id && (
										<div className="moderation-details">
											<p>
												<b>Description:</b> {item.description || 'Not provided'}
											</p>

											<p>
												<b>Condition:</b> {item.condition || 'Not provided'}
											</p>

											<p>
												<b>Category:</b> {item.category || 'Other'}
											</p>

											<p>
												<b>Location:</b> {item.city} {item.postalCode || ''}
											</p>

											<p>
												<b>Owner UID:</b> {item.ownerId}
											</p>

											<p>
												<b>Item ID:</b> {item.id}
											</p>

											<div className="moderation-gallery">
												{item.imageUrls?.map((url, index) => (
													<img key={url} src={url} alt={`${item.title} ${index + 1}`} />
												))}
											</div>
										</div>
									)}

									<div className="action-row">
										{item.status === 'available' && (
											<button disabled={!!busy} onClick={() => void changeItem(item, 'hidden')}>
												Hide listing
											</button>
										)}

										{item.status === 'hidden' && (
											<button disabled={!!busy} onClick={() => void changeItem(item, 'available')}>
												Restore listing
											</button>
										)}

										<button className="danger-action" disabled={!!busy} onClick={() => void deleteItem(item)}>
											Delete
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			)}

			{/* Request monitoring */}
			{tab === 'requests' && (
				<div>
					<h2>Request monitoring</h2>

					{requests.length === 0 && <p>No requests found.</p>}

					{requests.map((request) => (
						<article className="request-card" key={request.id}>
							<h3>{request.itemTitle}</h3>

							<p>Status: {request.status}</p>

							<p>Donor UID: {request.donorId}</p>

							<p>Requester UID: {request.requesterId}</p>

							<small>Request ID: {request.id}</small>
						</article>
					))}
				</div>
			)}

			{/* Registered accounts */}
			{tab === 'users' && (
				<div>
					<h2>All registered accounts</h2>

					<p>Admins can view all accounts. Only Master Admin can manage other administrators.</p>

					<button disabled={directoryLoading} onClick={() => void loadDirectory()}>
						{directoryLoading ? 'Loading...' : 'Refresh accounts'}
					</button>

					{!directoryLoaded && !directoryLoading && <p>Account directory is unavailable.</p>}

					<div className="admin-member-grid">
						{directory.map((user) => (
							<article className="admin-member" key={user.uid}>
								<h3>{user.displayName || user.email || 'Unnamed account'}</h3>

								<p>
									{user.email || 'No email'} · {user.role}
									{user.disabled ? ' · Suspended' : ''}
								</p>

								<div className="action-row">
									<button onClick={() => setSelectedUser(selectedUser === user.uid ? null : user.uid)}>
										{selectedUser === user.uid ? 'Hide information' : 'View user information'}
									</button>

									{accountButtons(user)}
								</div>

								{selectedUser === user.uid && (
									<div className="moderation-details">
										<p>
											<b>UID:</b> {user.uid}
										</p>

										<p>
											<b>Email:</b> {user.email || 'Not provided'}
										</p>

										<p>
											<b>Name:</b> {user.displayName || 'Not provided'}
										</p>

										<p>
											<b>Role:</b> {user.role}
										</p>

										<p>
											<b>Status:</b> {user.disabled ? 'Suspended' : 'Active'}
										</p>

										<p>
											<b>Joined:</b> {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
										</p>

										<p>
											<b>Listings:</b> {items.filter((item) => item.ownerId === user.uid).length}
										</p>

										<p>
											<b>Requests:</b>{' '}
											{
												requests.filter(
													(request) => request.donorId === user.uid || request.requesterId === user.uid,
												).length
											}
										</p>
									</div>
								)}
							</article>
						))}
					</div>
				</div>
			)}

			{/* Contact messages and support replies */}
			{tab === 'contact' && (
				<div>
					<h2>Contact and support messages</h2>

					{messages.length === 0 && <p>No contact messages received.</p>}

					{messages.map((message) => (
						<article className="request-card" key={message.id}>
							<h3>{message.subject}</h3>

							<p>
								{message.name} · {message.email}
							</p>

							<p>{message.message}</p>

							<ContactReplyHistory messageId={message.id} />

							<label className="support-reply-label">
								Reply to this message
								<textarea rows={3} maxLength={2000} value={replyDrafts[message.id] || ''} placeholder="Write your reply..." onChange={(event) => setReplyDrafts((previous) => ({ ...previous, [message.id]: event.target.value })) } />
							</label>

							<button disabled={!!busy || !(replyDrafts[message.id] || '').trim()} onClick={() => void sendReply(message.id)} >
								Send reply
							</button>
						</article>
					))}
				</div>
			)}

			{/* Master Admin management */}
			{tab === 'appoint admins' && masterAdmin && (
				<div className="admin-card">
					<h2>Manage administrators</h2>

					<p>
						Appoint administrators directly from registered accounts. Master Admin accounts are protected.
					</p>

					<button disabled={directoryLoading} onClick={() => void loadDirectory()}>
						Refresh list
					</button>

					<div className="admin-member-grid">
						{directory.map((user) => (
							<article className="admin-member" key={user.uid}>
								<h3>{user.displayName || user.email || 'Unnamed account'}</h3>

								<p>{user.email || user.uid}</p>

								<p>
									Role: <b>{user.role}</b>
									{user.disabled ? ' · Disabled' : ''}
								</p>

								{user.role === 'masterAdmin' || user.uid === auth.currentUser?.uid ? (
									<span>Protected Master Admin</span>
								) : (
									<div className="action-row">
										{(user.role !== 'admin' || user.disabled) && (
											<button disabled={!!busy} onClick={() => void changeRole(user, 'admin')}>
												Appoint / Enable Admin
											</button>
										)}

										{user.role === 'admin' && (
											<button disabled={!!busy} onClick={() => void changeRole(user, 'user')}>
												Revoke Admin
											</button>
										)}

										{user.role === 'admin' && !user.disabled && (
											<button disabled={!!busy} onClick={() => void changeRole(user, 'disabled')}>
												Disable Admin
											</button>
										)}
									</div>
								)}
							</article>
						))}
					</div>
				</div>
			)}
		</section>
	);
}

// Display replies under their original contact message.
function ContactReplyHistory({ messageId }: { messageId: string }) {
	const [replies, setReplies] = useState<Reply[]>([]);

	useEffect(() => {
		const stop = onSnapshot(
			collection(db, 'contactMessages', messageId, 'replies'),
			(snapshot) => {
				setReplies(
					snapshot.docs.map(
						(reply) =>
							({
								id: reply.id,
								...reply.data(),
							}) as Reply,
					),
				);
			},
			(error) => {
				console.error('Unable to load support replies:', error);
			},
		);

		return () => stop();
	}, [messageId]);

	return (
		<div className="support-replies">
			{replies.map((reply) => (
				<p key={reply.id}>
					<strong>Support reply:</strong> {reply.text}
				</p>
			))}
		</div>
	);
}
