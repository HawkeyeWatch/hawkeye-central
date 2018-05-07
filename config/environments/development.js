'use strict';

module.exports = {
  env: 'development',
  mongodb: {
    uri: 'mongodb://localhost/central-watcher'
  },
  session: {
    secret: 'verysecretmagicwords',
    cipherPass: '123123123' // make this as long as it can possibly be.
  },
  jstpPort: 3228,
};
