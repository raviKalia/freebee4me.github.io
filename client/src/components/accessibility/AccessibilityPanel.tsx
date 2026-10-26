import { useAccessibility } from '../../hooks/useAccessibility';
import FontSizeControl from './FontSizeControl';
import ContrastControl from './ContrastControl';
export default function AccessibilityPanel({ close }: { close: () => void }) {
	const { settings, update, reset } = useAccessibility();
	return (
		<section className="accessibility-panel" aria-labelledby="accessibility-heading">
			<div className="accessibility-panel-header">
				<h2 id="accessibility-heading">Accessibility settings</h2>
				<button type="button" onClick={close} aria-label="Close accessibility settings">
					Close
				</button>
			</div>
			<FontSizeControl />
			<ContrastControl />
			<label className="accessibility-toggle">
				<span>
					Reduce animations <small>Minimize motion and transitions</small>
				</span>
				<input type="checkbox" checked={settings.reduceMotion} onChange={(event) => update({ reduceMotion: event.target.checked })} />
			</label>
			<label className="accessibility-toggle">
				<span>
					Underline links <small>Identify text links more easily</small>
				</span>
				<input type="checkbox" checked={settings.underlineLinks} onChange={(event) => update({ underlineLinks: event.target.checked })} />
			</label>
			<button type="button" onClick={reset}>
				Reset settings
			</button>
		</section>
	);
}
