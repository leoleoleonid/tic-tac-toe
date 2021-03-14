class GameIdStore {
  constructor() {
    this.games = [];
  }

  deleteGameForCouple (player1, player2) {
    const couple = [player1, player2];
    let gameId;
    let indexToRemove;
    for (let i = 0 ; i < this.games.length; i++) {
      if (couple.includes(this.games[i].player1) && couple.includes(this.games[i].player2)) {
        indexToRemove = i;
        gameId = this.games[i].gameId;
        break;
      }
    }

    this.games.pop(indexToRemove);
    return gameId;
  }

  saveGame(player1, player2, gameId) {
    this.games.push({
      player1,
      player2,
      gameId
    });
  }

  findGamesForUser(userID) {
    const gamesForUser = new Map();
    this.games.forEach(({player1, player2, gameId}) => {
      if (player1 === userID || player2 === userID) {
        const opponent = userID === player1 ? player2 : player1;
        gamesForUser.set(opponent,gameId)
      }
    });

    return gamesForUser
  }
}

module.exports = GameIdStore;
