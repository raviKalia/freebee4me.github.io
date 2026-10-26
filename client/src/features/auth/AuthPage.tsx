import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
export default function AuthPage({ done }: { done: () => void }) {
	const [signup, setSignup] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	// Firebase handles passwords and persistent login sessions; never store passwords ourselves.
	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError('');
		try {
			if (signup) {
				const result = await createUserWithEmailAndPassword(auth, email, password);
				await updateProfile(result.user, { displayName: name.trim() });
				try {
					await setDoc(doc(db, 'publicUsers', result.user.uid), {
						displayName: name.trim(),
						email: result.user.email || '',
						createdAt: serverTimestamp(),
					});
				} catch (err) {
					console.warn('Directory registration failed:', err);
				}
			} else await signInWithEmailAndPassword(auth, email, password);
			done();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Authentication failed.');
		} finally {
			setBusy(false);
		}
	}
	return (
		<section className="auth-layout">
			<aside className="auth-intro">
				<span className="eyebrow">SHARE MORE. WASTE LESS.</span>
				<h2>Good things deserve a second home.</h2>
				<p>Join your community, discover useful items, and share what you no longer need.</p>
				<div className="auth-benefits">
					<span>✓ Free local sharing</span>
					<span>✓ Private contact until acceptance</span>
					<span>✓ Simple, secure requests</span>
				</div>
			</aside>
			<div className="feature-panel auth-panel">
				<h1>{signup ? 'Create an account' : 'Welcome back'}</h1>
				<p>Browse freely. Sign in to donate or request items.</p>
				<form onSubmit={submit} className="feature-form">
					{signup && (
						<label>
							Full name
							<input required value={name} onChange={(e) => setName(e.target.value)} />
						</label>
					)}
					<label>
						Email
						<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
					</label>
					<label>
						Password
						<div className="password-field">
							<input type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
							<button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} >
								{showPassword ? 'Hide' : 'Show'}
							</button>
						</div>
					</label>
					{error && (
						<p role="alert" className="form-error">
							{error}
						</p>
					)}
					<button disabled={busy} type="submit">
						{busy ? 'Please wait…' : signup ? 'Sign up' : 'Log in'}
					</button>
				</form>
				<button className="text-button" onClick={() => { setSignup(!signup); setError(''); }} >
					{signup ? 'Already registered? Log in' : 'New here? Create an account'}
				</button>
			</div>
		</section>
	);
}
