import type { Trade, DemoRole } from '../types/trade';

import { changeTradeStatus } from '../services/tradeService';

type Props = {
	trade: Trade;
	role: DemoRole;
	refresh: () => void;
	setError: (value: string) => void;
};

export default function TradeStatus({ trade, role, refresh, setError }: Props) {
	// Update the request status and refresh the trade.
	async function change(status: string) {
		try {
			await changeTradeStatus(trade.id, role, status);
			refresh();
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unable to update request.');
		}
	}

	return (
		<section className="trade-status">
			<h3>
				Request status: {trade.status}
			</h3>

			{trade.status === 'pending' && (
				<p>
					The recipient can see only the approximate pickup area until the donor accepts.
				</p>
			)}

			{trade.status === 'accepted' && (
				<p>
					Chat is available until the donor marks the trade completed.
				</p>
			)}

			{trade.status === 'completed' && (
				<p>
					This trade is complete. The conversation is now read-only.
				</p>
			)}

			{/* Donor actions for a pending request */}
			{trade.isDonor && trade.status === 'pending' && (
				<>
					<button onClick={() => void change('accepted')}>
						Accept request
					</button>

					<button onClick={() => void change('rejected')}>
						Reject request
					</button>
				</>
			)}

			{/* Recipient action for a pending request */}
			{!trade.isDonor && trade.status === 'pending' && (
				<button onClick={() => void change('cancelled')}>
					Cancel request
				</button>
			)}

			{/* Donor action for an accepted request */}
			{trade.isDonor && trade.status === 'accepted' && (
				<button onClick={() => void change('completed')}>
					Mark trade completed
				</button>
			)}
		</section>
	);
}