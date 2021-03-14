const expressApp = require("./server/expressApp");
const config = require('./config');
const httpServer = require("http").createServer({}, expressApp);
const crypto = require("crypto");
const { InMemorySessionStore } = require("./server/stores/sessionStore");
const GameIdStore = require("./server/stores/gameIdStore");
const socketIo = require("socket.io");

let io;
if(process.env.NODE_ENV === 'production') {
  io = socketIo(httpServer);
} else {
  io = socketIo(httpServer, {
    cors: {
      origin: config.FRONTEND_ORIGIN,
    },
  });
}

const games = {}; // stores the ongoing game
const winCombinations = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]]
]; // game winning combination index

const sessionStore = new InMemorySessionStore();
const gameIdStore = new GameIdStore();

io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // join the "userID" room
  socket.join(socket.userID);

  // fetch existing users
  const users = [];

  const gamesForUser = gameIdStore.findGamesForUser(socket.userID);

  sessionStore.findAllSessions().forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
      gameId: gamesForUser.get(session.userID),
      gameData: games[gamesForUser.get(session.userID)]
    });
  });
  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    messages: null,
  });

  socket.on("get game", ({ opponent , generateNew}) => {
    let gameId;

    if (generateNew) {
      const oldGameId = gameIdStore.deleteGameForCouple(opponent, socket.userID);
      delete games[oldGameId];
    } else {
      gameId = gameIdStore.findGamesForUser(opponent).get(socket.userID);
    }

    if (gameId) {
      const game = {
        gameData: games[gameId],
        gameId,
        player1: socket.userID,
        player2: opponent,
      };

      io.to(opponent).to(socket.userID).emit("return game data", game);
      return;
    }

    const opponentSession = sessionStore.findSessionByUserId(opponent);
    gameId = uuidv4();

    games[gameId] = {
      player1: socket.userID,
      player2: opponent,
      whose_turn: socket.userID,
      playboard: [["", "", ""], ["", "", ""], ["", "", ""]],
      game_status: "ongoing", // "ongoing","won","draw"
      game_winner: null, // winner_id if status won
      winning_combination: []
    };
    games[gameId][socket.userID] = {
      username: socket.username,
      sign: "x"
    };
    games[gameId][opponent] = {
      username: opponentSession.username,
      sign: "o"
    };
    const game = {
      gameData: games[gameId],
      gameId,
      player1: socket.userID,
      player2: opponent,
    };

    io.to(opponent).to(socket.userID).emit("return game data", game);
    gameIdStore.saveGame(socket.userID, opponent, gameId);
  });

  socket.on('selectCell', data => {
    games[data.gameId].playboard[data.i][data.j] = games[data.gameId][games[data.gameId].whose_turn].sign;

    let isDraw = true;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (games[data.gameId].playboard[i][j] == "") {
          isDraw = false;
          break;
        }
      }
    }
    if (isDraw)
      games[data.gameId].game_status = "draw";

    for (let i = 0; i < winCombinations.length; i++) {
      let tempComb = games[data.gameId].playboard[winCombinations[i][0][0]][winCombinations[i][0][1]] + games[data.gameId].playboard[winCombinations[i][1][0]][winCombinations[i][1][1]] + games[data.gameId].playboard[winCombinations[i][2][0]][winCombinations[i][2][1]];
      if (tempComb === "xxx" || tempComb === "ooo") {
        games[data.gameId].game_winner = games[data.gameId].whose_turn;
        games[data.gameId].game_status = "won";
        games[data.gameId].winning_combination = [[winCombinations[i][0][0], winCombinations[i][0][1]], [winCombinations[i][1][0], winCombinations[i][1][1]], [winCombinations[i][2][0], winCombinations[i][2][1]]];
      }
    }

    games[data.gameId].whose_turn = games[data.gameId].whose_turn == games[data.gameId].player1 ? games[data.gameId].player2 : games[data.gameId].player1;

    const responseData = {
      gameData : games[data.gameId],
      gameId : data.gameId,
      player1 : games[data.gameId].player1,
      player2 : games[data.gameId].player2
    };

    io.to(games[data.gameId].player1).to(games[data.gameId].player2).emit("return game data", responseData);
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
  });
});

const port = config.PORT;
httpServer.listen(port, () => {
  console.log(`App started on port ${port}`);
});

// Generate Game ID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const randomId = () => crypto.randomBytes(8).toString("hex");
