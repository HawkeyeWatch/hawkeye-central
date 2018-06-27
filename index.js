#!/usr/bin/env node
'use strict';

const config = require('./config');
const jstp = require('./lib/jstp');
const restServer = require('./config/rest-api');

restServer.init((err, server) => {
  if (err) {
    return console.error(err);
  }
  server.listen(config.apiPort);
});
jstp.init();
require('./config/mongoose').init();
