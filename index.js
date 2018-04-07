#!/usr/bin/env node
'use strict';

// TODO: Implement serverEmitter and pass to jstp init
const jstp = require('./config/jstp');
const restServer = require('./config/rest-api')

restServer.init().listen(8080);
jstp.init();
require('./config/mongoose').init();
