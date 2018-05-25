#!/usr/bin/env node
'use strict';

const jstp = require('./lib/jstp');
const restServer = require('./config/rest-api');

restServer.init((err, server) => {
  if (err) {
    return console.error(err);
  }
  server.listen(8081);
});
jstp.init();
require('./config/mongoose').init();
