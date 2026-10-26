import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

import AccessibilityButton from './accessibility/AccessibilityButton';
import type { Page } from '../types/navigation';

type Props = {
	page: Page;
	goTo: (page: Page) => void;
	user: User | null;
	admin: boolean;
	masterAdmin: boolean;
	signOutUser: () => void;
};

export default function Header({ page, goTo, user, admin, masterAdmin, signOutUser }: Props) {
	const [open, setOpen] = useState(false);
	const [moreOpen, setMoreOpen] = useState(false);

	// Close the menus when switching to desktop.
	useEffect(() => {
		const media = window.matchMedia('(min-width: 761px)');

		function closeMenu() {
			if (media.matches) {
				setOpen(false);
				setMoreOpen(false);
			}
		}

		media.addEventListener('change', closeMenu);

		return () => {
			media.removeEventListener('change', closeMenu);
		};
	}, []);

	// Navigation links for regular users.
	const links: { id: Page; title: string }[] = [{ id: 'browse', title: 'Browse' }];

	if (user && !admin) {
		links.push({ id: 'my-donations', title: 'My Donations' });
		links.push({ id: 'requests', title: 'Requests' });
	}

	function closeMenus() {
		setOpen(false);
		setMoreOpen(false);
	}

	function navigate(destination: Page) {
		goTo(destination);
		closeMenus();
	}

	function handleLogout() {
		signOutUser();
		closeMenus();
	}

	return (
		<header>
			<div className="header">
				{/* App logo */}
				<button type="button" className="brand-button" onClick={() => navigate(admin ? 'admin' : 'browse')} aria-label="Freebee4me home" >
					<img src="/logo.png" className="brand-image" alt="Freebee4me logo" width={176} height={55} />
				</button>

				{/* Mobile menu */}
				<button type="button" className="mobile-menu" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen((value) => !value)} >
					{open ? '✕' : '☰'}
				</button>

				<nav id="main-navigation" className={open ? 'nav-open' : ''} aria-label="Main navigation">
					{admin ? (
						<>
							{/* Admin navigation */}
							<button type="button" aria-current={page === 'admin' ? 'page' : undefined} onClick={() => navigate('admin')} >
								Dashboard
							</button>

							<button type="button" aria-current={page === 'admin-profile' ? 'page' : undefined} onClick={() => navigate('admin-profile')} >
								My Admin Profile
							</button>

							<span className="admin-role-label">{masterAdmin ? 'Master Admin' : 'Admin'}</span>
						</>
					) : (
						<>
							{/* User navigation */}
							{links.map((link) => (
								<button type="button" key={link.id} aria-current={page === link.id ? 'page' : undefined} onClick={() => navigate(link.id)} >
									{link.title}
								</button>
							))}

							{/* Donate picture */}
							<button type="button" className="donate-button" aria-label="Share an item" aria-current={page === 'donate' ? 'page' : undefined} title="Share an item" onClick={() => navigate('donate')} >
								Share an item
							</button>

							{/* More menu */}
							<div className="nav-more">
								<button type="button" aria-expanded={moreOpen} aria-controls="more-navigation" onClick={() => setMoreOpen((value) => !value)} >
									More ▾
								</button>

								{moreOpen && (
									<div id="more-navigation" className="nav-more-menu">
										{user && (
											<button type="button" onClick={() => navigate('profile')}>
												My Profile
											</button>
										)}

										<button type="button" onClick={() => navigate('about')}>
											About
										</button>

										<button type="button" onClick={() => navigate('help')}>
											Help
										</button>

										<button type="button" onClick={() => navigate('contact')}>
											Contact
										</button>

										{/* Accessibility settings */}
										<AccessibilityButton />
									</div>
								)}
							</div>
						</>
					)}

					{/* Account actions */}
					{user ? (
						<button type="button" onClick={handleLogout}>
							Log out
						</button>
					) : (
						<button type="button" onClick={() => navigate('auth')}>
							Log in / Sign up
						</button>
					)}
				</nav>
			</div>
		</header>
	);
}
