'use strict';

// TODO: Implement serverEmitter and pass to jstp init
const jstp = require('./config/jstp');

jstp.init();
require('./config/mongoose').init();
