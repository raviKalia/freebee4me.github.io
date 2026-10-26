import type { Item } from '../types';

type Props = {
	item: Item;
};

export default function ItemCard({ item }: Props) {
	return (
		<article className="item">
			<div className="item-art" aria-hidden="true">
				{item.category === 'Electronics' ? '⌁' : '▧'}
			</div>

			<div className="item-body">
				<small>
					{item.category}
				</small>

				<h3>
					{item.title}
				</h3>

				<p>
					{item.description}
				</p>

				<span>
					⌖ {item.city}
				</span>
			</div>
		</article>
	);
}