type Props = {
	search: string;
	setSearch: (text: string) => void;
	browse: () => void;
};

export default function Hero({ search, setSearch, browse }: Props) {
	return (
		<section className="hero">
			<div className="hero-inner">
				<span className="eyebrow">GIVE MORE. WASTE LESS.</span>

				<h1>
					Good things deserve
					<br />a second home.
				</h1>

				<p>Find useful items shared by people in your community — or pass on something you no longer need.</p>

				<div className="hero-search">
					<input aria-label="Search items" placeholder="What are you looking for?" value={search} onChange={(e) => { setSearch(e.target.value); browse(); }} />

					<button onClick={browse}>Explore items →</button>
				</div>
			</div>
		</section>
	);
}
