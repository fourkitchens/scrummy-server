module.exports = class Game {
  /**
   * constructor
   *   Creates a new Game.
   *
   * @return {undefined}
   */
  constructor({ name }) {
    this.name = name;
    this.clients = [];
    this.users = [];
    this.votes = {};
  }
  /**
   * addUser
   *   Adds a user to the game.
   */
  addUser(user) {
    this.clients.push(user);
    this.users.push(user);
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
  broadcast(data) {
    this.clients.forEach(client => client.sendMessage(data));
  }
  revokeVote({ nickname }) {
    delete this.votes[nickname];
    this.broadcast(JSON.stringify({
      type: 'clientRevoke',
      data: { nickname },
    }));
  }
  hasUser({ nickname }) {
    return this.users.filter(user => user.nickname === nickname).length;
  }
};
