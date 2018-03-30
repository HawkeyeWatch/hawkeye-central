'use strict';

const jstp = require('metarhia-jstp');

module.exports.init = (serverEmitter) => {
  const app = new jstp.Application('serverRPC', {
    serverService: {
      sayHi(connection, name, callback) {
        callback(null, `Hi, ${name}, I am server!`);
      },

      subscribe(connection, callback) {
        connection.inspectInterface('clientService', (error, proxy) => {
          if (error) {
            console.error(`Something went wrong: ${error}`);
            return;
          }
          // TODO: Save proxy to some map
          //localNodeProxy = proxy;
          return callback();
        });
      },
    },
  }, {
    serverService: {
      someEvent(connection, data) {
        console.log('received event from client:');
        console.log(data);
      },
    },
  });

  const auth = {
    authenticate: (connection, application, strategy, credentials, cb) => {
      console.log('Auth credentials: ', credentials);
      console.log('Strategy: ', strategy);
      console.log(connection.client);
      // TODO: Find with mongoose
      if (credentials[0] !== 'vasya') {
        return cb(new Error('User not allowed'));
      }
      return cb(null, credentials[0]);
    }
  };

  const server = jstp.net.createServer({
    applications: [app],
    authPolicy: auth
  });
  // TODO: Port from config
  server.listen(5000, () => {
    console.log('JSTP TCP server listening on port 5000');
  });
};