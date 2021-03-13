import React, {useState, useEffect} from "react";
import socket from "../socket";

const withUser = (WrappedComponent) => {
	return ({ children }) => {
		const sessionID = localStorage.getItem("sessionID");

		if (sessionID) {
			socket.auth = { sessionID };
			socket.connect();
		}

		const [username, setUsername] = useState('');
		const [usernameSelected, setUsernameSelected] = useState(Boolean(sessionID));

		function handleChange(event) {
			setUsername(event.target.value);
		}

		function handleSubmit(event) {
			event.preventDefault();
			if (username.length) {
				setUsernameSelected(true);
				socket.auth = { username };
				socket.connect();
			}
		}

		useEffect(() => {

			socket.on("session", ({ sessionID, userID }) => {
				// attach the session ID to the next reconnection attempts
				socket.auth = { sessionID };
				// store it in the localStorage
				localStorage.setItem("sessionID", sessionID);
				// save the ID of the user
				socket.userID = userID;
			});

			socket.on("connect_error", (err) => {
				if (err.message === "invalid username") {
					setUsernameSelected(false);
				}
			});

			return () => {
				socket.off("connect_error");
			}
		}, [usernameSelected]);

		if (!usernameSelected) {
			return (
				<div>
					<p>Please, add username</p>
					<form onSubmit={handleSubmit}>
						<div>
							<label>
								your user:
								<input type="text" value={username} onChange={handleChange} />
							</label>
						</div>
						<input type="submit" value="Submit" />
					</form>
				</div>
			)
		}

		return (
			<WrappedComponent username={username}>
				{children}
			</WrappedComponent>
		)
	}
}

export default withUser;
