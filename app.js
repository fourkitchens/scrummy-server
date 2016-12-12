const config = require('config');
const server = require('./server');

const logger = require('./util/_logger');

const User = require('./lib/User');
const Game = require('./lib/Game');

const gameNameGenerator = require('./util/gameNameGenerator')();
const getFormattedEntityName = require('./util/getFormattedEntityName');
const getUniqueFormattedEntityName = require('./util/getUniqueFormattedEntityName');

const POINTS = config.get('points');

/** Class representing a Scrummy server */
class Scrummy {
  /**
   * dispatch - description
   *
   * @param  {type} type description
   * @param  {type} data description
   * @param  {type} ws   description
   * @return {type}      description
   */
  static dispatch(type, data, ws) {
    if (Scrummy.EXPOSED_METHODS.includes(type)) {
      try {
        logger.info('performing', type);
        Scrummy[type](data, ws);
      } catch ({ message: errorMessage }) {
        Scrummy.handleError(errorMessage, ws);
      }
    } else {
      Scrummy.handleError(`${type} is not a message type Scrummy is prepared for!`, ws);
    }
  }
  /**
   * getGame - description
   *
   * @param  {type} gameId description
   * @return {type}        description
   */
  static getGame(gameId) {
    return Scrummy.BUCKET.get(gameId);
  }
  /**
   * handleError - Sends an error to the client
   *
   * @param  {String}    message The error message to send
   * @param  {Object}    ws      The client to send the message to
   * @return {undefined}
   */
  static handleError(message, ws) {
    logger.info(`${message}`);
    ws.send(JSON.stringify({
      type: 'error',
      data: { message },
    }));
  }
  /**
   * signIn - Signs a user in if they have provided a valid username
   *
   * @param  {Object}    data The signIn message from the client
   * @param  {Object}    ws   The websocket to respond to
   * @return {undefined}
   */
  static signIn(data, ws) {
    const requestedGame = getFormattedEntityName(data.game)
      || gameNameGenerator.next().value;
    if (!Scrummy.BUCKET.has(requestedGame)) {
      Scrummy.BUCKET.set(requestedGame, new Game({ name: requestedGame }));
      logger.info(`created game: ${requestedGame}`);
    }
    const game = Scrummy.getGame(requestedGame);
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
        users: game.users,
      },
    }));
    logger.info(`added user ${nickname} to ${game.name}`);
  }
  /**
   * placeVote - Places a vote on behalf of a client if the vote and game are valid
   *
   * @param  {Object}    data The signIn message from the client
   * @param  {Object}    ws   The websocket to respond to
   * @return {undefined}
   */
  static placeVote({ game: gameId, nickname, vote }, ws) {
    const game = Scrummy.getGame(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    if (!POINTS.includes(vote.toString())) {
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
    logger.info(`${nickname} voted ${vote} in ${gameId}`);
  }
  /**
   * getPlayerCount
   *   Returns numbers of players for a given game.
   *
   * @param {Object} data
   *   The message from the client.
   * @param {Object} ws
   *   The websocket to respond to.
   * @return {undefined}
   */
  static getPlayerCount({ game: gameId }, ws) {
    let numPlayers = 0;
    const game = Scrummy.getGame(getFormattedEntityName(gameId));
    if (game) {
      numPlayers = game.users.length;
    }
    ws.send(JSON.stringify({
      type: 'playerCount',
      data: { numPlayers },
    }));
    logger.info(`${gameId} reported ${numPlayers} players.\n`);
  }

  /**
   * reset
   *   Resets the given game.
   *
   * @param  {Object}    data The message from the client
   * @return {undefined}
   */
  static reset({ game: gameId, nickname }) {
    const game = Scrummy.getGame(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    game.votes = {};
    game.broadcast(JSON.stringify({
      type: 'reset',
      data: { votes: game.votes },
    }));
    logger.info(`${nickname} reset ${game}`);
  }
  /**
   * reveal - Broadcasts a reveal event to the appropriate game
   *
   * @param  {Object}    data The message from the client
   * @return {undefined}
   */
  static reveal({ game: gameId, nickname }) {
    const game = Scrummy.getGame(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    // If game has no votes
    if (Object.keys(game.votes).length < 1) {
      throw new Error(`${nickname} has no votes to reveal!`);
    }
    game.broadcast(JSON.stringify({ type: 'reveal' }));
    logger.info(`${nickname} revealed votes in ${gameId}`);
  }
  /**
   * disconnect - Disconnects a client from the given game
   *
   * @param  {Object}    data The message from the client
   * @return {undefined}
   */
  static disconnect({ game: gameId, nickname }) {
    const game = Scrummy.getGame(gameId);
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
      data: { users: game.users },
    }));
    logger.info(`${nickname} disconnected\n`);
  }
  /**
   * revokeVote - Revokes a vote and broadcasts change
   *
   * @param  {Object}    data The message from the client
   * @return {undefined}
   */
  static revokeVote({ game: gameId, nickname }) {
    const game = Scrummy.getGame(gameId);
    if (!game) {
      throw new Error(`${gameId} does not exist!`);
    }
    // If user has not voted
    if (!game.votes[nickname]) {
      throw new Error(`${nickname} has no votes to revoke!`);
    }

    game.revokeVote({ nickname });
    logger.info(`${nickname} revoked their vote in ${gameId}`);
  }
  /**
   * constructor
   *   Creates a new Scrummy server.
   *
   *   Starts a websocket server on the port specified in config, creates an empty bucket for
   *   storing game related data, specifies which methods are available for invocation via websocket
   *   message, and sets up websocket message handling.
   *
   *   Sets up listeners for messages once a connection to the websocket server exists.
   *
   *   If the message type is one of the exposed methods, said method executes with the parsed
   *   message and the websocket as arguments. Otherwise, the message gets rejected.
   *
   * @return {undefined}
   */
  constructor() {
    this.wss = server(config.get('port'));
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        logger.log('received message', message);
        const { data, type } = JSON.parse(message);
        Scrummy.dispatch(type, data, ws);
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
}

Object.defineProperties(Scrummy, {
  EXPOSED_METHODS: {
    get() {
      return [
        'signIn',
        'placeVote',
        'reset',
        'reveal',
        'revokeVote',
        'disconnect',
        'getPlayerCount',
      ];
    },
  },
  BUCKET: {
    value: new Map(),
  },
});

module.exports = Scrummy;
