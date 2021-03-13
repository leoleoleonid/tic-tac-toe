import withUser from './Components/withUser';
import User from './Components/User';
import MessagePanel from './Components/MessagePanel';
import './App.css';
import {useState, useEffect} from "react";
import socket from "./socket";

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);


  useEffect(() => {

    socket.on("connect", () => {
      const usersNew = [...users];
      usersNew.forEach((user) => {
        if (user.self) {
          user.connected = true;
        }
      });
      setUsers(usersNew);
    });

    socket.on("disconnect", () => {
      const usersNew = [...users];
      usersNew.forEach((user) => {
        if (user.self) {
          user.connected = false;
        }
      });
      setUsers(usersNew);
    });

    socket.on("users", (receivedUsers) => {
      const newUsers = [...users];
      receivedUsers.forEach((receivedUser) => {
        receivedUser.messages.forEach((message) => {
          message.fromSelf = message.from === socket.userID;
        });
        for (let i = 0; i < newUsers.length; i++) {
          const existingUser = newUsers[i];
          if (existingUser.userID === receivedUser.userID) {
            existingUser.connected = receivedUser.connected;
            existingUser.messages = receivedUser.messages;
            return;
          }
        }
        receivedUser.self = receivedUser.userID === socket.userID;
        receivedUser.hasNewMessages = false;
        newUsers.push(receivedUser);
      });
      // put the current user first, and sort by username
      newUsers.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      });

      setUsers(newUsers);
    });

    socket.on("user connected", (user) => {
      const newUsers = [...users];
      for (let i = 0; i < newUsers.length; i++) {
        const existingUser = newUsers[i];
        if (existingUser.userID === user.userID) {
          existingUser.connected = true;
          setUsers(newUsers);
          return;
        }
      }
      user.hasNewMessages = false;
      newUsers.push(user);

      setUsers(newUsers);
    });

    socket.on("user disconnected", (id) => {
      const newUsers = [...users];
      for (let i = 0; i < newUsers.length; i++) {
        const user = newUsers[i];
        if (user.userID === id) {
          user.connected = false;
          break;
        }
      }
      setUsers(newUsers);
    });

    socket.on("private message", ({ content, from, to }) => {
      const newUsers = [...users];

      for (let i = 0; i < newUsers.length; i++) {
        const user = newUsers[i];
        const fromSelf = socket.userID === from;
        if (user.userID === (fromSelf ? to : from)) {
          user.messages.push({
            content,
            fromSelf,
          });
          if (user !== selectedUser) {
            user.hasNewMessages = true;
          }
          break;
        }
      }

      setUsers(newUsers);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("users");
      socket.off("user connected");
      socket.off("user disconnected");
      socket.off("private message");
    }
  }, [selectedUser, users]);

  function onSelectUser(user) {
    const newUsers = [...users];
    for (let i = 0; i < newUsers.length; i++) {
      const existingUser = newUsers[i];
      if (existingUser.userID === user.userID) {
        existingUser.hasNewMessages = false;
        break;
      }
    }
    setUsers(newUsers);
    setSelectedUser(user);
  }

  function onMessage(content) {
    if (selectedUser) {
      socket.emit("private message", {
        content,
        to: selectedUser.userID,
      });
      const updatedSelectedUser = {...selectedUser};

      updatedSelectedUser.messages.push({
        content,
        fromSelf: true,
      });

      setSelectedUser(updatedSelectedUser);
    }
  }

  return (
    <div className="App">
      <div className="left-panel">
        {users.map(user => {
          return (
            <User
              key={user.userID}
              user={user}
              selected={JSON.stringify(selectedUser) === JSON.stringify(user)}
              onSelectUser={onSelectUser}
            />
          )
        })}
      </div>
      <div className="right-panel">
        {selectedUser && (
          <MessagePanel
            onMessage={onMessage}
            user={selectedUser}
          />
        )}
      </div>
    </div>
  );
}

export default withUser(App);
