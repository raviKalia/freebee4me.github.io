import './styles/features-added.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AccessibilityProvider } from './context/AccessibilityContext';
import './styles/global.css';
import './styles/header.css';
import './styles/hero.css';
import './styles/browse.css';
import './styles/profile.css';
import './styles/info.css';
import './styles/trade.css';
import './styles/accessibility.css';
import './styles/notifications.css';
import './styles/modern.css';
import './styles/responsive-header.css';
import './styles/admin.css';
import './styles/polish.css';

createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<AccessibilityProvider>
			<App />
		</AccessibilityProvider>
	</React.StrictMode>,
);
