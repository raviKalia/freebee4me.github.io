import ContactForm from '../components/ContactForm';
import MyContactMessages from '../components/MyContactMessages';
export default function ContactPage() {
	return (
		<section className="info-page">
			<span className="eyebrow">GET IN TOUCH</span>
			<h2>Contact us</h2>
			<p className="lead">
				Have a question, suggestion, or issue? Send a message to the Freebee4me project team.
			</p>
			<div className="contact-layout">
				<div>
					<h3>Send a message</h3>
					<ContactForm />
					<MyContactMessages />
				</div>
				<aside className="contact-aside">
					<h3>Before you send</h3>
					<p>Check the Help page for answers to common questions.</p>
					<p>
						For your privacy, do not include passwords, payment details, or full pickup addresses in your
						message.
					</p>
					<p>
						<strong>Demo notice:</strong> Messages are saved in Firestore for administrators to review.
						Automatic email delivery is not enabled.
					</p>
				</aside>
			</div>
		</section>
	);
}
