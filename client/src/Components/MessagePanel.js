import {useState, useEffect} from "react";

function MessagePanel(props) {
	console.log('remoutn all panel')
	const [input, setInput] = useState('');
	const isValid = input.length > 0;
	function onSubmit(event) {
		event.preventDefault();
		props.onMessage(input);
		setInput('');
	}

	function handleChange(event) {
		setInput(event.target.value);
	}

	return (
		<div>
			<div className="header">
				{(props.user.connected ? 'online | ' : 'offline | ') + props.user.username}
			</div>

			<ul className="messages">
				{props.user.messages.map((message,i) => {
					return (
						<li key={i} className="message">
							<div className="sender">
								{message.fromSelf ? "(yourself)" : props.user.username}
							</div>
							{ message.content }
						</li>
					)
				})}
			</ul>

			<form onSubmit={onSubmit} className="form">
				<textarea value={input} onChange={handleChange} placeholder="Your message..." className="input" />
				<button disabled={!isValid} className="send-button">Send</button>
			</form>
		</div>
	)
}

export default MessagePanel;
