/** Class representing a user */
module.exports = class User {
  /**
   * constructor - description
   *
   * @param  {String}    { game }     The name of the game the User belongs to
   * @param  {String}    { nickname } The nickname of the User
   * @param  {WebSocket} { ws }       The websocket for communicating with the User
   * @return {undefined}
   */
  constructor({ game, nickname, ws }) {
    this.game = game;
    this.nickname = nickname;
    Object.defineProperty(this, 'ws', {
      value: ws,
    });
  }
  /**
   * sendMessage - sends a message to the User
   *
   * @param  {String}    data the message to send to the User.
   * @return {undefined}
   */
  sendMessage(data) {
    this.ws.send(data);
  }
};
