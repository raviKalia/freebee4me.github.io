import type { Page } from '../types/navigation';

type Props = {
	goTo: (page: Page) => void;
};

export default function Footer({ goTo }: Props) {
	return (
		<footer>
			<p>© Freebee4me · Give more. Waste less.</p>

			<div className="footer-links">
				<button onClick={() => goTo('about')}>About</button>

				<button onClick={() => goTo('help')}>Help</button>

				<button onClick={() => goTo('contact')}>Contact</button>
			</div>
		</footer>
	);
}
