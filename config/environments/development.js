'use strict';

module.exports = {
  env: 'development',
  mongodb: {
    uri: 'mongodb://localhost/central-watcher'
  },
  session: {
    secret: 'verysecretmagicwords'
  },
  jstpPort: 3228,
};
