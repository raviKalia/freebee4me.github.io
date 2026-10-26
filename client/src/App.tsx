import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase/config';
import Header from './components/Header';
import LiveNotifications from './components/notifications/LiveNotifications';
import SkipToContent from './components/accessibility/SkipToContent';
import Hero from './components/Hero';
import Footer from './components/Footer';
import BrowsePage from './pages/BrowsePage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './features/auth/AuthPage';
import DonateItem from './features/items/DonateItem';
import MyDonations from './features/items/MyDonations';
import RequestsPage from './features/requests/RequestsPage';
import AdminPage from './features/admin/AdminPage';
import AdminProfile from './features/admin/AdminProfile';
import type { Page } from './types/navigation';

type Role = 'guest' | 'user' | 'admin' | 'masterAdmin';

export default function App() {
	const [page, setPage] = useState<Page>('browse');
	const [user, setUser] = useState<User | null>(null);
	const [role, setRole] = useState<Role>('guest');
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [message, setMessage] = useState('');
	const updateMessage = useCallback((text: string) => setMessage(text), []);

	useEffect(() => {
		let active = true;
		const unsubscribe = onAuthStateChanged(auth, async (next) => {
			if (!active) return;
			setLoading(true);
			setUser(next);
			if (!next) {
				setRole('guest');
				setPage('browse');
				setLoading(false);
				return;
			}
			try {
				// Roles come from verified Firebase custom claims, not local storage.
				const token = await next.getIdTokenResult(true);
				if (!active || auth.currentUser?.uid !== next.uid) return;
				const claim = token.claims.role;
				if (claim === 'masterAdmin' || token.claims.masterAdmin === true) {
					setRole('masterAdmin');
					setPage('admin');
				} else if (claim === 'admin' || token.claims.admin === true) {
					setRole('admin');
					setPage('admin');
				} else {
					setRole('user');
					setPage('browse');
				}
			} catch (error) {
				console.error('Could not verify account permissions:', error);
				if (active) {
					setRole('guest');
					setPage('browse');
					setMessage('Could not verify account permissions. Please sign in again.');
				}
			} finally {
				if (active) setLoading(false);
			}
		});
		return () => {
			active = false;
			unsubscribe();
		};
	}, []);

	const isAdmin = role === 'admin' || role === 'masterAdmin';
	function goTo(next: Page) {
		if (loading) return;
		if (isAdmin) next = next === 'admin-profile' ? 'admin-profile' : 'admin';
		else if (next === 'admin') next = 'browse';
		else if (role === 'guest' && ['profile', 'donate', 'my-donations', 'requests'].includes(next))
			next = 'auth';
		setPage(next);
		setMessage('');
		window.scrollTo(0, 0);
	}

	async function signOutUser() {
		try {
			await signOut(auth);
		} catch (error) {
			console.error(error);
			setMessage('Could not log out.');
		}
	}

	if (loading)
		return (
			<main id="main-content" role="status">
				Checking your account...
			</main>
		);

	return (
		<>
			<SkipToContent />
			<Header page={page} goTo={goTo} user={user} admin={isAdmin} masterAdmin={role === 'masterAdmin'} signOutUser={() => void signOutUser()} />
			{user && (
				<LiveNotifications key={user.uid} onNavigate={(target) => { if (!isAdmin && (target === 'requests' || target === 'contact')) goTo(target); else if (isAdmin && target === 'contact') window.dispatchEvent(new Event('freebee4me:contact-alert')); }} />
			)}
			{!isAdmin && page === 'browse' && (
				<Hero search={search} setSearch={setSearch} browse={() => goTo('browse')} />
			)}
			<main id="main-content" tabIndex={-1}>
				{message && (
					<p className="message" role="status">
						{message}
					</p>
				)}
				{isAdmin ? (
					page === 'admin-profile' && user ? (
						<AdminProfile user={user} masterAdmin={role === 'masterAdmin'} />
					) : (
						<AdminPage masterAdmin={role === 'masterAdmin'} />
					)
				) : (
					<>
						{page === 'browse' && (
							<BrowsePage search={search} setMessage={updateMessage} goTo={() => goTo('auth')} />
						)}
						{page === 'auth' && <AuthPage done={() => goTo('browse')} />}
						{page === 'donate' && role === 'user' && <DonateItem done={() => goTo('my-donations')} />}
						{page === 'my-donations' && role === 'user' && <MyDonations />}
						{page === 'requests' && role === 'user' && <RequestsPage />}
						{page === 'profile' && role === 'user' && user && (
							<ProfilePage user={user} setMessage={updateMessage} />
						)}
						{page === 'help' && <HelpPage goTo={goTo} />}
						{page === 'about' && <AboutPage goTo={goTo} />}
						{page === 'contact' && <ContactPage />}
					</>
				)}
			</main>
			{!isAdmin && <Footer goTo={goTo} />}
		</>
	);
}
