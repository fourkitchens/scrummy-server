const config = require('config');
const server = require('./server');

const logger = require('./util/_logger');

const User = require('./lib/User');
const Game = require('./lib/Game');

const gameNameGenerator = require('./util/gameNameGenerator');
const getFormattedEntityName = require('./util/getFormattedEntityName');
const getUniqueFormattedEntityName = require('./util/getUniqueFormattedEntityName');

class Scrummy {
  /**
   * constructor
   *   Creates a new Scrummy server.
   *
   *   Starts a websocket server on the port specified in config, creates an empty bucket for
   *   storing game related data, specifies which methods are available for invocation via websocket
   *   message, and sets up websocket message handling.
   *
   * @return {undefined}
   */
  constructor() {
    this.wss = server(config.get('port'));
    this.points = config.get('points');
    this.bucket = new Map();
    this.setupMessageHandling();
    this.gameNameGenerator = gameNameGenerator();
  }
  /**
   * setupMessageHandling
   *   Sets up listeners for messages once a connection to the websocket server exists.
   *
   *   If the message type is one of the exposed methods, said method executes with the parsed
   *   message and the websocket as arguments. Otherwise, the message gets rejected.
   *
   * @return {undefined}
   */
  setupMessageHandling() {
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        logger(`received message: ${message}\n`);
        const { data, type } = JSON.parse(message);
        if (Scrummy.EXPOSED_METHODS.includes(type)) {
          try {
            logger(`performing: ${type}\n`);
            this[type](data, ws);
          } catch ({ message: errorMessage }) {
            Scrummy.handleError(errorMessage, ws);
          }
        } else {
          Scrummy.handleError(`${type} is not a message type Scrummy is prepared for!`, ws);
        }
      });
    });
  }
  /**
   * shutdown
   *   Shuts down the websocket server.
   *
   * @return {undefined}
   */
  shutdown() {
    this.wss.close();
  }
  /**
   * handleError
   *   Sends an error to the client.
   *
   * @param {string} message
   *   The error message to send.
   * @param {Object} ws
   *   The client to send the message to.
   * @return {undefined}
   */
  static handleError(message, ws) {
    logger(`${message}\n`);
    ws.send(JSON.stringify({
      type: 'error',
      data: { message },
    }));
  }
  /**
   * signIn
   *   Signs a user in if they have provided a valid username.
   *
   * @param {Object} data
   *   The signIn message from the client.
   * @param {Object} ws
   *   The websocket to respond to.
   * @return {undefined}
   */
  signIn(data, ws) {
    const requestedGame = getFormattedEntityName(data.game)
      || this.gameNameGenerator.next().value;
    if (!this.bucket.has(requestedGame)) {
      this.bucket.set(requestedGame, new Game({ name: requestedGame }));
      logger(`created game: ${requestedGame}\n`);
    }
    const game = this.bucket.get(requestedGame);
    const nickname = getUniqueFormattedEntityName(
      data.nickname,
      game.users.map(user => user.nickname)
    );
    if (!nickname) {
      throw new Error('This username is unavailable; please pick another.');
    }
    game.addUser(new User({
      game: game.name,
      nickname,
      ws,
    }));
    ws.send(JSON.stringify({
      type: 'youSignedIn',
      data: {
        nickname,
        points: config.get('points'),
        game: game.name,
        users: game.users,
      },
    }));
    game.broadcast(JSON.stringify({
      type: 'someoneSignedIn',
      data: {
        nickname,
        users: game.users,
      },
    }));
    logger(`added user ${nickname} to ${game.name}\n`);
  }
  /**
   * placeVote
   *   Places a vote on behalf of a client if the vote and game are valid.
   *
   * @param {Object} data
   *   The signIn message from the client.
   * @param {Object} ws
   *   The websocket to respond to.
   * @return {undefined}
   */
  placeVote({ game: gameId, nickname, vote }, ws) {
    const game = this.bucket.get(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    if (!this.points.includes(vote.toString())) {
      throw new Error(`${vote} is not a valid vote!`);
    }
    game.votes[nickname] = vote;
    ws.send(JSON.stringify({
      type: 'youVoted',
    }));
    game.broadcast(JSON.stringify({
      type: 'someoneVoted',
      data: { votes: game.votes },
    }));
    logger(`${nickname} voted ${vote} in ${gameId}\n`);
  }
  /**
   * reset
   *   Resets the given game.
   *
   * @param {Object} data
   *   The message from the client.
   * @return {undefined}
   */
  reset({ game: gameId, nickname }) {
    const game = this.bucket.get(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    game.votes = {};
    game.broadcast(JSON.stringify({
      type: 'reset',
      data: { votes: game.votes },
    }));
    logger(`${nickname} reset ${game}\n`);
  }
  /**
   * reveal
   *   Broadcasts a reveal event to the appropriate game.
   *
   * @param {Object} data
   *   The message from the client.
   * @return {undefined}
   */
  reveal({ game: gameId, nickname }) {
    const game = this.bucket.get(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    // If game has no votes
    if (Object.keys(game.votes).length < 1) {
      throw new Error(`${nickname} has no votes to reveal!`);
    }
    game.broadcast(JSON.stringify({ type: 'reveal' }));
    logger(`${nickname} revealed votes in ${gameId}\n`);
  }
  /**
   * revokeVote
   *   Revokes a vote and broadcasts change.
   *
   * @param {Object} data
   *   The message from the client.
   * @return {undefined}
   */
  revokeVote({ game: gameId, nickname }) {
    const game = this.bucket.get(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    // If user has not voted
    if (!game.votes[nickname]) {
      throw new Error(`${nickname} has no votes to revoke!`);
    }
    game.revokeVote({ nickname });
    logger(`${nickname} revoked his or her vote in ${gameId}\n`);
  }
  /**
   *   Disconnects a client from the given game.
   *
   * @param {Object} data
   *   The message from the client.
   * @return {undefined}
   */
  disconnect({ game: gameId, nickname }) {
    const game = this.bucket.get(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    // If user isn't a part of the game
    if (!game.hasUser({ nickname })) {
      throw new Error(`${nickname} is not a part of ${gameId}!`);
    }
    // Filter out the user that disconnected from the user list.
    game.users = game.users
      .filter(user => user.nickname !== nickname);
    // Filter out the client reference for the user that disconnected from the user list.
    game.clients = game.clients
      .filter(user => user.nickname !== nickname);
    // Remove any votes cast by disconnected user.
    game.revokeVote({ nickname });

    game.broadcast(JSON.stringify({
      type: 'clientDisconnect',
      data: { nickname },
    }));
    logger(`${nickname} disconnected\n`);
  }
}

Object.defineProperty(Scrummy, 'EXPOSED_METHODS', {
  get() {
    return [
      'signIn',
      'placeVote',
      'reset',
      'reveal',
      'revokeVote',
      'disconnect',
    ];
  },
});

module.exports = Scrummy;
