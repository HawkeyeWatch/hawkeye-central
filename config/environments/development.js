'use strict';

const fs = require('fs');

const misc = JSON.parse(fs.readFileSync('./config/misc.json'));


module.exports = {
  env: 'development',
  mongodb: {
    // mongo hostname is set with docker or manually within hosts file
    uri: 'mongodb://mongo/central-watcher'
  },
  session: {
    secret: 'verysecretmagicwords', // jwt secret
    cipherPass: '123123123' // Used for ciphering webhooks.
  },
  jstpPort: 3228,
  apiPort: 8080
};

Object.defineProperty(
  module.exports,
  'registrationAllowed', {
    get: () => misc.registrationAllowed,
    set: (newVal) => {
      misc.registrationAllowed = newVal;
      fs.writeFileSync('./config/misc.json', JSON.stringify(misc));
      console.log('misc.json: ' + fs.readFileSync('./config/misc.json'));
    }
  }
);
