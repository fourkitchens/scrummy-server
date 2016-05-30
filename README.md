# Scrummy

[![travis](https://travis-ci.org/fourkitchens/scrummy-server.svg)](https://travis-ci.org/fourkitchens/scrummy-server/)
[![codecov](https://codecov.io/gh/fourkitchens/scrummy-server/branch/master/graph/badge.svg)](https://codecov.io/gh/fourkitchens/scrummy-server)
[![doclets](https://doclets.io/fourkitchens/scrummy-server/master.svg)](https://doclets.io/fourkitchens/scrummy-server/master)
[![codeclimate](https://codeclimate.com/github/fourkitchens/scrummy-server/badges/gpa.svg)](https://codeclimate.com/github/fourkitchens/scrummy-server)

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
