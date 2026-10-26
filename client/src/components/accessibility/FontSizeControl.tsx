import { useAccessibility } from '../../hooks/useAccessibility';
import type { FontSize } from '../../context/AccessibilityContext';
export default function FontSizeControl() {
	const { settings, update } = useAccessibility();
	return (
		<fieldset className="accessibility-fieldset">
			<legend>Text size</legend>
			<div className="accessibility-options">
				{(
					[
						['normal', 'Normal'],
						['large', 'Large'],
						['extra', 'Extra large'],
					] as [FontSize, string][]
				).map(([value, label]) => (
					<label key={value} className="accessibility-choice">
						<input type="radio" name="text-size" value={value} checked={settings.fontSize === value} onChange={() => update({ fontSize: value })} />{' '}
						{label}
					</label>
				))}
			</div>
		</fieldset>
	);
}
