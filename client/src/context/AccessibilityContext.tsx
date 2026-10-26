import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type FontSize = 'normal' | 'large' | 'extra';

export type AccessibilitySettings = {
	fontSize: FontSize;
	highContrast: boolean;
	reduceMotion: boolean;
	underlineLinks: boolean;
};

type AccessibilityContextValue = {
	settings: AccessibilitySettings;
	update: (change: Partial<AccessibilitySettings>) => void;
	reset: () => void;
};

// Default accessibility preferences.
const defaults: AccessibilitySettings = {
	fontSize: 'normal',
	highContrast: false,
	reduceMotion: false,
	underlineLinks: true,
};

const storageKey = 'freebee4me-accessibility';

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

// Load saved preferences, using defaults for missing or invalid values.
function readSettings(): AccessibilitySettings {
	try {
		const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

		return {
			fontSize: ['normal', 'large', 'extra'].includes(saved.fontSize) ? saved.fontSize : defaults.fontSize,
			highContrast: typeof saved.highContrast === 'boolean' ? saved.highContrast : defaults.highContrast,
			reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : defaults.reduceMotion,
			underlineLinks:
				typeof saved.underlineLinks === 'boolean' ? saved.underlineLinks : defaults.underlineLinks,
		};
	} catch {
		return defaults;
	}
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<AccessibilitySettings>(readSettings);

	// Apply preferences to the page and save them for future visits.
	useEffect(() => {
		const html = document.documentElement;

		html.dataset.fontSize = settings.fontSize;
		html.dataset.highContrast = String(settings.highContrast);
		html.dataset.reduceMotion = String(settings.reduceMotion);
		html.dataset.underlineLinks = String(settings.underlineLinks);

		try {
			localStorage.setItem(storageKey, JSON.stringify(settings));
		} catch {
			// Storage may be disabled.
		}
	}, [settings]);

	function update(change: Partial<AccessibilitySettings>) {
		setSettings((previous) => ({
			...previous,
			...change,
		}));
	}

	function reset() {
		setSettings(defaults);
	}

	return (
		<AccessibilityContext.Provider value={{ settings, update, reset }}>
			{children}
		</AccessibilityContext.Provider>
	);
}

// Access settings from a component inside AccessibilityProvider.
export function useAccessibilitySettings() {
	const context = useContext(AccessibilityContext);

	if (!context) {
		throw new Error('AccessibilityProvider is required');
	}

	return context;
}
