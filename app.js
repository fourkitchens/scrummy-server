const config = require('config');
const server = require('./server');

const logger = require('./util/_logger');
const generateGameName = require('./util/generateGameName');
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
    this.bucket = {};
    this.setupMessageHandling();
    this.exposedMethods = [
      'signIn',
      'placeVote',
    ];
  }
  /**
   * setupMessageHandling
   *   Sets up listeners for messages once a connection to the websocket server has been made.
   *
   *   If the message type is one of the exposed methods, it is executed with the parsed message and
   *   the websocket as arguments. Otherwise, the message is rejected.
   *
   * @return {undefined}
   */
  setupMessageHandling() {
    this.wss.on('connection', ws => {
      ws.on('message', message => {
        logger(`received message: ${message}\n`);
        const data = JSON.parse(message);
        if (this.exposedMethods.includes(data.type)) {
          logger(`performing: ${data.type}\n`);
          this[data.type](data, ws);
        } else {
          this.handleInvalidMessage(data, ws);
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
   * broadcast
   *   Sends the provided message to all matching clients.
   *
   * @param {String} data
   *   The message to send.
   * @param {Array} clients
   *   The clients to send the message to.
   * @return {undefined}
   */
  broadcast(data, clients) {
    clients.forEach(client => client.ws.send(data));
  }
  /**
   * handleInvalidMessage
   *   Sends an error to the client informing them that their message cannot be handled.
   *
   * @param {Object} data
   *   The received message in Object form.
   * @param {Object} ws
   *   The client to send the message to.
   * @return {undefined}
   */
  handleInvalidMessage(data, ws) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `${data.type} is not a message type Scrummy is prepared for!`,
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
      || generateGameName(Object.keys(this.bucket));
    if (typeof this.bucket[requestedGame] === 'undefined') {
      this.bucket[requestedGame] = {
        clients: [],
        users: [],
        votes: {},
      };
      logger(`created game: ${requestedGame}\n`);
    }
    const nickname = getUniqueFormattedEntityName(
      data.nickname,
      this.bucket[requestedGame].users.map(user => user.nickname)
    );
    if (!nickname) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'This username is unavailable; please pick another.',
      }));
      return;
    }
    this.bucket[requestedGame].clients.push({
      nickname,
      game: requestedGame,
      ws,
    });
    this.bucket[requestedGame].users.push({
      nickname,
      game: requestedGame,
    });
    ws.send(JSON.stringify({
      type: 'youSignedIn',
      nickname,
      points: config.get('points'),
      users: this.bucket[requestedGame].users,
      game: requestedGame,
    }));
    this.broadcast(JSON.stringify({
      type: 'someoneSignedIn',
      nickname,
      users: this.bucket[requestedGame].users,
    }), this.bucket[requestedGame].clients);
    logger(`added user ${nickname} to ${requestedGame}\n`);
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
  placeVote(data, ws) {
    if (!this.bucket[data.game]) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `${data.game} does not exist!`,
      }));
      return;
    }
    if (!this.points.includes(data.vote.toString())) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `${data.vote} is not a valid vote!`,
      }));
      return;
    }
    this.bucket[data.game].votes[data.nickname] = data.vote;
    ws.send(JSON.stringify({
      type: 'youVoted',
    }));
    this.broadcast(JSON.stringify({
      type: 'someoneVoted',
      votes: this.bucket[data.game].votes,
    }), this.bucket[data.game].clients);
    logger(`${data.nickname} voted ${data.vote} in ${data.game}\n`);
  }
}

module.exports = Scrummy;
