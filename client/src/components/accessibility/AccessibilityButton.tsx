import { useRef, useState, useEffect } from 'react';
import AccessibilityPanel from './AccessibilityPanel';
export default function AccessibilityButton() {
	const [open, setOpen] = useState(false);
	const button = useRef<HTMLButtonElement>(null);
	const panel = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!open) return;
		const first = panel.current?.querySelector<HTMLElement>('button');
		first?.focus();
		function escape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setOpen(false);
				button.current?.focus();
			}
		}
		document.addEventListener('keydown', escape);
		return () => document.removeEventListener('keydown', escape);
	}, [open]);
	function close() {
		setOpen(false);
		button.current?.focus();
	}
	return (
		<div className="accessibility-widget">
			<button ref={button} type="button" className="accessibility-trigger" aria-expanded={open} aria-controls="accessibility-controls" onClick={() => setOpen((value) => !value)} >
				Accessibility
			</button>
			{open && (
				<div id="accessibility-controls" ref={panel}>
					<AccessibilityPanel close={close} />
				</div>
			)}
		</div>
	);
}
