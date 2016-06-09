# Scrummy

[![Four Kitchens](https://img.shields.io/badge/4K-Four%20Kitchens-35AA4E.svg?style=flat-square)](https://fourkitchens.com/)
[![Travis](https://img.shields.io/travis/fourkitchens/scrummy-server.svg?style=flat-square)](https://travis-ci.org/fourkitchens/scrummy-server/)
[![Codecov](https://img.shields.io/codecov/c/github/fourkitchens/scrummy-server.svg?style=flat-square)](https://codecov.io/gh/fourkitchens/scrummy-server)
[![Code Climate](https://img.shields.io/codeclimate/github/fourkitchens/scrummy-server.svg?style=flat-square)](https://codeclimate.com/github/fourkitchens/scrummy-server)

## Getting started

### Prerequisites

- Node 6.x

### Installing

- clone this repository
- install dependencies: `$ npm i`
- start the server: `$ npm start`

## Running the tests

### Tests

- run the tests: `$ npm t`
- generate and view test coverage: `$ npm run view-coverage`

- lint code: `$ npm run lint-code`
- lint writing: `$ npm run lint-writing`

## Usage

This example code ran in Chrome; your mileage may vary.

### Sending messages

```js
const myScrummyClient = new WebSocket('ws://localhost:8080');
myScrummyClient.send(JSON.stringify({
  type: 'signIn',
  nickname: 'tsmith512',
}));
```

### Receiving messages

```js
const myScrummyClient = new WebSocket('ws://localhost:8080');
myScrummyClient.onmessage = response => {
  console.log(JSON.parse(response.data));
};
```
