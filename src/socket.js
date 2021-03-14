import { io } from "socket.io-client";

const URL = "http://localhost:8080";
let socket;
if (process.env.NODE_ENV === 'production') {
	socket = io(URL, { autoConnect: false });
} else {
	socket = io({ autoConnect: false });
}

socket.onAny((event, ...args) => {
	console.log("onAny");
	console.log(event, args);
});

export default socket;
