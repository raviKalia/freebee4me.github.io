import type { Page } from '../types/navigation';
export default function AboutPage({ goTo }: { goTo: (page: Page) => void }) {
	return (
		<section className="info-page">
			<span className="eyebrow">OUR STORY</span>
			<h2>About Freebee4me</h2>
			<p className="lead">
				Give more. Waste less. Freebee4me is a community-sharing project designed to help useful items find
				new homes.
			</p>
			<div className="info-grid">
				<article>
					<h3>Our purpose</h3>
					<p>
						Reduce waste by connecting people who have extra household items with neighbours who can use them.
					</p>
				</article>
				<article>
					<h3>What you can find</h3>
					<p>Browse furniture, electronics, clothing, books, kitchen items, toys, and more.</p>
				</article>
				<article>
					<h3>Local sharing</h3>
					<p>Search by category and approximate location to discover items in your community.</p>
				</article>
				<article>
					<h3>Privacy matters</h3>
					<p>
						Full home addresses should stay private. Public listings should only display approximate pickup
						areas.
					</p>
				</article>
			</div>
			<div className="info-callout">
				<h3>Explore your community</h3>
				<p>See items currently available in the demo.</p>
				<button onClick={() => goTo('browse')}>Browse items →</button>
			</div>
		</section>
	);
}
