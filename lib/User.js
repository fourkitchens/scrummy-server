const SYMBOLS = {
  WS: Symbol('WS'),
};

module.exports = class User {
  constructor({ game, nickname, ws }) {
    this.game = game;
    this.nickname = nickname;
    this[SYMBOLS.WS] = ws;
  }
  sendMessage(data) {
    this[SYMBOLS.WS].send(data);
  }
};
