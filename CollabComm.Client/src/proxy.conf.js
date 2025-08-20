const {env} = require('process');

const target = 'http://localhost:13641';

const PROXY_CONFIG = [
  {
    context: [
      "/api",
    ],
    target,
    secure: false
  },
  {
    context: [
      "/WebSocket",
    ],
    target: target,
    ws: true,
    secure: false,

  }
]

module.exports = PROXY_CONFIG;
