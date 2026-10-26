import { useState } from 'react';
import { faqs } from '../data/faqs';
import type { Page } from '../types/navigation';
export default function HelpPage({ goTo }: { goTo: (page: Page) => void }) {
	const [search, setSearch] = useState('');
	const matches = faqs.filter((faq) =>
		`${faq.question} ${faq.answer}`.toLowerCase().includes(search.toLowerCase()),
	);
	return (
		<section className="info-page">
			<span className="eyebrow">SUPPORT</span>
			<h2>Help center</h2>
			<p className="lead">Find answers to common questions about sharing and finding items.</p>
			<label className="help-search">
				Search help topics
				<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions..." />
			</label>
			<div className="faq-list">
				{matches.map((faq) => (
					<details key={faq.question}>
						<summary>{faq.question}</summary>
						<p>{faq.answer}</p>
					</details>
				))}
			</div>
			{!matches.length && <p>No matching answers found.</p>}
			<div className="info-callout">
				<h3>Still need help?</h3>
				<p>Send us a message and describe the problem.</p>
				<button onClick={() => goTo('contact')}>Contact us →</button>
			</div>
		</section>
	);
}
