'use strict';

const jstp = require('metarhia-jstp');

const app = new jstp.Application('demo', {
  serverService: {
    sayHi(connection, name, callback) {
      callback(null, `Hi, ${name}, I am server!`);
    },
  },
});

const server = jstp.net.createServer({
  applications: [app],
});

module.exports.init = () => {
  server.listen(5000, () => {
    console.log('TCP server listening on port 5000');
  });
};