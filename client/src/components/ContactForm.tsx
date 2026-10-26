import { useState, type SubmitEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import type { ContactMessage } from '../services/contactService';
import { auth, db } from '../firebase/config';

// Default values for the contact form.
const blank: ContactMessage = {
	name: '',
	email: '',
	subject: 'General question',
	message: '',
};

export default function ContactForm() {
	const [form, setForm] = useState<ContactMessage>(blank);
	const [status, setStatus] = useState('');
	const [sending, setSending] = useState(false);

	// Save the message and reset the form after a successful submission.
	async function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		setSending(true);
		setStatus('');

		try {
			await addDoc(collection(db, 'contactMessages'), {
				name: form.name.trim(),
				email: form.email.trim(),
				subject: form.subject,
				message: form.message.trim(),

				// Identify the user who submitted this message.
				userId: auth.currentUser?.uid ?? null,

				createdAt: serverTimestamp(),
			});

			setStatus('Your message has been submitted to the support team.');
			setForm(blank);
		} catch {
			setStatus('Unable to submit your message. Please try again.');
		} finally {
			setSending(false);
		}
	}

	return (
		<form className="contact-form" onSubmit={(event) => void submit(event)}>
			{/* Contact details */}
			<div className="form-grid">
				<label>
					Your name
					<input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
				</label>

				<label>
					Email
					<input required type="email" maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
				</label>
			</div>

			{/* Message subject */}
			<label>
				Subject
				<select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
					<option>General question</option>
					<option>Account help</option>
					<option>Item listing</option>
					<option>Report a problem</option>
					<option>Feedback</option>
				</select>
			</label>

			{/* Message content */}
			<label>
				Message
				<textarea required minLength={10} maxLength={2000} rows={6} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
			</label>

			<button className="save" disabled={sending} type="submit">
				{sending ? 'Sending...' : 'Send message'}
			</button>

			{/* Submission feedback */}
			{status && (
				<p role="status" className="form-status">
					{status}
				</p>
			)}
		</form>
	);
}
