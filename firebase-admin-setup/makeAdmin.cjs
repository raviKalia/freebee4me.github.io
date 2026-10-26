const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Load the private key from your downloaded Firebase file.
const serviceAccount = require('./serviceAccountKey.json');

// Connect securely to your Firebase project.
initializeApp({
	credential: cert(serviceAccount),
});

// Give your existing Firebase user the Master Admin role.
async function makeMasterAdmin() {
	// Replace this with the email you used in Firebase Authentication.
	const email = 'freebee4me@admin.com';

	// Find the existing user.
	const user = await getAuth().getUserByEmail(email);

	// Assign the Master Admin permission.
	await getAuth().setCustomUserClaims(user.uid, {
		...user.customClaims,
		role: 'masterAdmin',
	});

	console.log('Master Admin role assigned successfully!');
}

makeMasterAdmin().catch(console.error);
