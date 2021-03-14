import withUser from './Components/withUser';
import User from './Components/User';
import GameBoard from './Components/GameBoard';
import './App.css';
import {useState, useEffect} from "react";
import socket from "./socket";

function App() {
  const [selectedUser, setSelectedUser] = useState({});
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
        for (let i = 0; i < newUsers.length; i++) {
          const existingUser = newUsers[i];
          if (existingUser.userID === receivedUser.userID) {
            existingUser.connected = receivedUser.connected;
            return;
          }
        }
        receivedUser.self = receivedUser.userID === socket.userID;
        receivedUser.hasOngoingGame = Boolean(receivedUser.gameId);
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
      user.hasOngoingGame = false;
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

    socket.on("return game data", ({gameData, gameId, player1, player2}) => {
      const newUsers = [...users];

      for (let i = 0; i < newUsers.length; i++) {
        const existingUser = newUsers[i];
        if (existingUser.userID === player1 || existingUser.userID === player2) {
          existingUser.hasOngoingGame = true;
          existingUser.gameId = gameId;
          existingUser.gameData = gameData;

          if (selectedUser?.userID === existingUser.userID) {
            setSelectedUser(existingUser);
          }
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
      socket.off("return game data");
    }
  }, [selectedUser, users]);

  function startNewGame() {
    socket.emit("get game", {
      opponent: selectedUser.userID,
      generateNew: true
    });
  }

  function onSelectUser(user) {
    const newUsers = [...users];
    socket.emit("get game", {
      opponent: user.userID,
      generateNew: false
    });

    for (let i = 0; i < newUsers.length; i++) {
      const existingUser = newUsers[i];
      if (existingUser.userID === user.userID) {
        existingUser.hasOngoingGame = true;
        break;
      }
    }

    setUsers(newUsers);
    setSelectedUser(user);
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
        {selectedUser.gameData && (
          <GameBoard
            gameData={selectedUser.gameData}
            gameId={selectedUser.gameId}
            startNewGame={startNewGame}
          />
        )}
      </div>
    </div>
  );
}

export default withUser(App);
