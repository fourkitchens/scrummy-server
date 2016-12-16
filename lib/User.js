/** Class representing a user */
module.exports = class User {
  /**
   * constructor - description
   *
   * @param  {String}    { game }            The name of the game the User belongs to
   * @param  {String}    { nickname }        The nickname of the User
   * @param  {Boolean}   { [watch = false] } Whether the User is watching the game
   * @param  {WebSocket} { ws }              The websocket for communicating with the User
   * @return {undefined}
   */
  constructor({ game, nickname, watch = false, ws }) {
    this.game = game;
    this.nickname = nickname;
    this.watch = watch;
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
