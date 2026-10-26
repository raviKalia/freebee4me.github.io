import { useAccessibility } from '../../hooks/useAccessibility';
export default function ContrastControl() {
	const { settings, update } = useAccessibility();
	return (
		<label className="accessibility-toggle">
			<span>
				High contrast <small>Stronger text and control contrast</small>
			</span>
			<input type="checkbox" checked={settings.highContrast} onChange={(event) => update({ highContrast: event.target.checked })} />
		</label>
	);
}
