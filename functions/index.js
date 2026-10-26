const { onCall, HttpsError } = require('firebase-functions/v2/https');

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK.
admin.initializeApp();

const db = admin.firestore();

// Check whether the account is Master Admin.
function isMasterAdmin(token) {
	return token?.role === 'masterAdmin' || token?.masterAdmin === true;
}

// Check whether the account is Admin or Master Admin.
function isAdmin(token) {
	return isMasterAdmin(token) || token?.role === 'admin' || token?.admin === true;
}

// Get the role from Firebase Authentication claims.
function getRole(user) {
	if (user.customClaims?.role === 'masterAdmin' || user.customClaims?.masterAdmin === true) {
		return 'masterAdmin';
	}

	if (user.customClaims?.role === 'admin' || user.customClaims?.admin === true) {
		return 'admin';
	}

	return 'user';
}

/*
 * Create an in-app notification.
 *
 * All notification types use the same document structure.
 */
async function notify(userId, type, title, body, link) {
	if (!userId || typeof userId !== 'string') {
		return;
	}

	await db.collection('notifications').add({
		userId,
		type,
		title,
		body,
		link,
		read: false,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	});
}

/*
 * 1. MASTER ADMIN: CHANGE USER ROLE
 *
 * Master Admin can:
 * - Appoint an Admin
 * - Revoke Admin access
 * - Disable an Admin
 * - Re-enable an Admin
 *
 * Master Admin accounts cannot be modified here.
 */
exports.setUserRole = onCall(async (request) => {
	if (!request.auth) {
		throw new HttpsError('unauthenticated', 'Please sign in.');
	}

	if (!isMasterAdmin(request.auth.token)) {
		throw new HttpsError('permission-denied', 'Master Admin access required.');
	}

	const { uid, role } = request.data || {};

	if (typeof uid !== 'string' || !uid.trim() || !['admin', 'user', 'disabled'].includes(role)) {
		throw new HttpsError('invalid-argument', 'Valid UID and role are required.');
	}

	if (uid === request.auth.uid) {
		throw new HttpsError('failed-precondition', 'You cannot change your own role.');
	}

	const target = await admin.auth().getUser(uid);
	const targetRole = getRole(target);

	if (targetRole === 'masterAdmin') {
		throw new HttpsError('permission-denied', 'Master Admin accounts are protected.');
	}

	if (role === 'disabled' && targetRole !== 'admin') {
		throw new HttpsError('failed-precondition', 'Only Admin accounts can be disabled here.');
	}

	// Update the Firebase Authentication account.
	await admin.auth().updateUser(uid, {
		disabled: role === 'disabled',
	});

	// Preserve existing claims when changing a role.
	if (role !== 'disabled') {
		await admin.auth().setCustomUserClaims(uid, {
			...target.customClaims,
			role,
			admin: role === 'admin',
			masterAdmin: false,
		});
	}

	// Update the public directory record.
	await db
		.collection('publicUsers')
		.doc(uid)
		.set(
			{
				role: role === 'disabled' ? 'admin' : role,
				disabled: role === 'disabled',
			},
			{ merge: true },
		);

	// Force the user to obtain a fresh token.
	await admin.auth().revokeRefreshTokens(uid);

	// Record the administrator action.
	await db.collection('adminAudit').add({
		actor: request.auth.uid,
		target: uid,
		action: 'setUserRole',
		role,
		at: admin.firestore.FieldValue.serverTimestamp(),
	});

	return { ok: true };
});

/*
 * 2. ADMIN DIRECTORY
 *
 * Both Admin and Master Admin can view registered accounts.
 */
exports.listPlatformUsers = onCall(async (request) => {
	if (!request.auth) {
		throw new HttpsError('unauthenticated', 'Please sign in.');
	}

	if (!isAdmin(request.auth.token)) {
		throw new HttpsError('permission-denied', 'Administrator access required.');
	}

	const pageToken = request.data?.pageToken;

	if (pageToken !== undefined && (typeof pageToken !== 'string' || pageToken.length > 2048)) {
		throw new HttpsError('invalid-argument', 'Invalid page token.');
	}

	const page = await admin.auth().listUsers(500, pageToken || undefined);

	const users = page.users.map((user) => ({
		uid: user.uid,
		email: user.email || '',
		displayName: user.displayName || '',
		role: getRole(user),
		disabled: user.disabled,
		createdAt: user.metadata.creationTime,
	}));

	return {
		users,
		nextPageToken: page.pageToken || null,
	};
});

/*
 * 3. ACCOUNT MODERATION
 *
 * Admin can manage regular users.
 * Master Admin can manage regular users and Admins.
 * Neither can modify Master Admin accounts.
 */
exports.moderateAccount = onCall(async (request) => {
	if (!request.auth) {
		throw new HttpsError('unauthenticated', 'Please sign in.');
	}

	const caller = request.auth.token;

	if (!isAdmin(caller)) {
		throw new HttpsError('permission-denied', 'Administrator access required.');
	}

	const { uid, action } = request.data || {};

	if (typeof uid !== 'string' || !uid.trim() || !['suspend', 'activate', 'delete'].includes(action)) {
		throw new HttpsError('invalid-argument', 'Invalid account or action.');
	}

	if (uid === request.auth.uid) {
		throw new HttpsError('failed-precondition', 'You cannot moderate your own account.');
	}

	const target = await admin.auth().getUser(uid);
	const targetRole = getRole(target);

	if (targetRole === 'masterAdmin') {
		throw new HttpsError('permission-denied', 'Master Admin accounts are protected.');
	}

	if (targetRole === 'admin' && !isMasterAdmin(caller)) {
		throw new HttpsError('permission-denied', 'Only Master Admin can moderate administrators.');
	}

	if (action === 'delete') {
		// Delete Authentication account and associated profiles.
		// Historical requests remain for auditing.
		await admin.auth().deleteUser(uid);

		await db.collection('profiles').doc(uid).delete();
		await db.collection('publicUsers').doc(uid).delete();
	} else {
		const disabled = action === 'suspend';

		await admin.auth().updateUser(uid, {
			disabled,
		});

		await db.collection('publicUsers').doc(uid).set({ disabled }, { merge: true });

		await admin.auth().revokeRefreshTokens(uid);
	}

	await db.collection('adminAudit').add({
		actor: request.auth.uid,
		target: uid,
		action: `account:${action}`,
		at: admin.firestore.FieldValue.serverTimestamp(),
	});

	return { ok: true };
});

/*
 * 4. DELETE A DONATED ITEM
 *
 * Admin and Master Admin can remove listings.
 * Reserved items cannot be deleted until the exchange
 * is resolved.
 */
exports.deleteModeratedItem = onCall(async (request) => {
	if (!request.auth || !isAdmin(request.auth.token)) {
		throw new HttpsError('permission-denied', 'Administrator access required.');
	}

	const itemId = request.data?.itemId;

	if (typeof itemId !== 'string' || !itemId.trim() || itemId.length > 200) {
		throw new HttpsError('invalid-argument', 'Invalid item ID.');
	}

	const itemRef = db.collection('items').doc(itemId);
	const itemDoc = await itemRef.get();

	if (!itemDoc.exists) {
		throw new HttpsError('not-found', 'Listing not found.');
	}

	if (itemDoc.data().status === 'reserved') {
		throw new HttpsError('failed-precondition', 'Resolve the active exchange first.');
	}

	await itemRef.delete();

	await db.collection('adminAudit').add({
		actor: request.auth.uid,
		target: itemId,
		action: 'deleteItem',
		at: admin.firestore.FieldValue.serverTimestamp(),
	});

	return { ok: true };
});

/*
 * 5. NEW CONTACT MESSAGE NOTIFICATION
 *
 * When a user sends a contact message, notify all
 * active Admin and Master Admin accounts.
 */
exports.contactNotification = onDocumentCreated('contactMessages/{messageId}', async (event) => {
	const message = event.data?.data();

	if (!message) {
		return;
	}

	let pageToken;

	do {
		const page = await admin.auth().listUsers(1000, pageToken);

		const administrators = page.users.filter((user) => !user.disabled && getRole(user) !== 'user');

		await Promise.all(
			administrators.map((user) =>
				notify(user.uid, 'contact', 'New support message', message.subject || 'Contact form', 'contact'),
			),
		);

		pageToken = page.pageToken;
	} while (pageToken);
});

/*
 * 6. NEW ITEM REQUEST NOTIFICATION
 *
 * When someone requests an item, notify the donor.
 */
exports.newRequestNotification = onDocumentCreated('requests/{requestId}', async (event) => {
	const request = event.data?.data();

	if (!request) {
		return;
	}

	await notify(
		request.donorId,
		'request',
		'New item request',
		`Someone requested ${request.itemTitle || 'your item'}.`,
		'requests',
	);
});

/*
 * 7. REQUEST STATUS NOTIFICATION
 *
 * Notify the requester when the request status changes.
 * For cancellation, notify both participants.
 */
exports.requestStatusNotification = onDocumentUpdated('requests/{requestId}', async (event) => {
	const before = event.data?.before.data();
	const after = event.data?.after.data();

	if (!after || before?.status === after.status) {
		return;
	}

	const recipients = after.status === 'cancelled' ? [after.donorId, after.requesterId] : [after.requesterId];

	// Avoid sending duplicate notifications to one UID.
	const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

	await Promise.all(
		uniqueRecipients.map((userId) =>
			notify(
				userId,
				'request',
				'Request updated',
				`${after.itemTitle || 'Item'}: ${after.status}`,
				'requests',
			),
		),
	);
});

/*
 * 8. CONTACT REPLY NOTIFICATION
 *
 * When Admin or Master Admin sends a reply,
 * notify the original signed-in user.
 *
 * Firestore path:
 * contactMessages/{messageId}/replies/{replyId}
 */
exports.contactReplyNotification = onDocumentCreated(
	'contactMessages/{messageId}/replies/{replyId}',
	async (event) => {
		// Read the new support reply.
		const reply = event.data?.data();

		if (!reply) {
			console.log('Contact reply has no data.');
			return;
		}

		const messageId = event.params.messageId;
		const replyId = event.params.replyId;

		// Read the original contact message.
		const messageDoc = await db.collection('contactMessages').doc(messageId).get();

		if (!messageDoc.exists) {
			console.log('Original contact message not found:', messageId);
			return;
		}

		const message = messageDoc.data();

		// The contact form must save the sender's Firebase UID.
		const userId = message?.userId;

		if (typeof userId !== 'string' || !userId.trim() || userId === 'guest') {
			console.log('Cannot notify: no signed-in userId for message:', messageId);
			return;
		}

		// Create one notification per reply event.
		// Using a fixed ID helps prevent duplicates on retries.
		const notificationId = `contactReply_${replyId}`;

		await db
			.collection('notifications')
			.doc(notificationId)
			.create({
				userId,
				type: 'contact-reply',
				title: 'Support team replied',
				body: `You received a reply about: ${message.subject || 'Your message'}`,
				link: 'contact',
				read: false,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			})
			.catch((error) => {
				// A retried event may already have created the notification.
				if (error.code === 6 || error.code === 'already-exists') {
					console.log('Notification already exists:', notificationId);
					return;
				}

				throw error;
			});

		console.log('Contact reply notification processed:', userId, messageId, replyId);
	},
);
