import { categories } from '../data/categories';

type Props = {
	value: string;
	onChange: (value: string) => void;
};

export default function CategoryFilter({ value, onChange }: Props) {
	return (
		<label>
			Category
			<select value={value} onChange={e => onChange(e.target.value)}>
				{categories.map(category => (
					<option key={category}>
						{category}
					</option>
				))}
			</select>
		</label>
	);
}