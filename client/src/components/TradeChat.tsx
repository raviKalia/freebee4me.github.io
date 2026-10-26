import { useState, type SubmitEvent } from 'react';

import type { Trade, DemoRole } from '../types/trade';
import { sendMessage } from '../services/tradeService';

type Props = {
	trade: Trade;
	role: DemoRole;
	refresh: () => void;
	setError: (value: string) => void;
};

export default function TradeChat({ trade, role, refresh, setError }: Props) {
	const [text, setText] = useState('');

	// Send a message when the trade allows chatting.
	async function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!trade.canChat || !text.trim()) {
			return;
		}

		try {
			await sendMessage(trade.id, role, text);

			setText('');
			refresh();
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unable to send.');
		}
	}

	return (
		<section className="trade-chat">
			<h3>
				Trade conversation
			</h3>

			{trade.status === 'pending' && (
				<p>
					Chat unlocks when the donor accepts the request.
				</p>
			)}

			{['rejected', 'cancelled'].includes(trade.status) && (
				<p>
					This request is closed. Chat is unavailable.
				</p>
			)}

			{/* Conversation history */}
			<div className="messages" role="log" aria-label="Trade messages" aria-live="polite" aria-relevant="additions">
				{trade.messages.map(message => (
					<div className={message.senderId === role ? 'bubble mine' : 'bubble'} key={message.id}>
						<small>
							{message.senderId === role ? 'You' : 'Other participant'}
						</small>

						<p>
							{message.text}
						</p>

						<small>
							{new Date(message.sentAt).toLocaleString()}
						</small>
					</div>
				))}
			</div>

			{/* Message form */}
			{trade.canChat && (
				<form className="chat-form" onSubmit={event => void submit(event)}>
					<label htmlFor="chat-message">
						Message
					</label>

					<textarea id="chat-message" value={text} maxLength={1000} rows={3} onChange={event => setText(event.target.value)} placeholder="Discuss the pickup details..." />

					<button type="submit" disabled={!text.trim()}>
						Send message
					</button>
				</form>
			)}

			{trade.status === 'completed' && (
				<p>
					Chat closed after completion. Previous messages remain visible in this demo.
				</p>
			)}
		</section>
	);
}