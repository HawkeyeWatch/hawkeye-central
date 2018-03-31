'use strict';

const jstp = require('metarhia-jstp');
const config = require('./');
const localNode = require('../models/localNode');

const _nodes = new Map();

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
          _nodes.set(connection.username, proxy);
          connection.on('close', () => _nodes.delete(connection.username));
          return callback();
        });
      },
    },
  }, {
    serverService: {
      // TODO: Implement events
      someEvent(connection, data) {
        console.log('received event from client:');
        console.log(data);
      },
    },
  });

  const auth = {
    authenticate: (connection, application, strategy, credentials, cb) => {
      localNode.findOne({ 'jstpLogin': credentials[0] })
        .then(localNode => {
          if (!localNode) {
            return cb(new Error('not authorized'));
          }
          localNode.verifyPassword(credentials[1], (err, match) => {
            if (err) {
              return cb(err);
            }

            if (!match) {
              return cb(new Error('wrong password'));
            }

            return cb(null, credentials[0]);
          });
        })
        .catch(err => cb(err));
    }
  };

  const server = jstp.net.createServer({
    applications: [app],
    authPolicy: auth
  });

  server.listen(config.jstpPort, () => {
    console.log(`JSTP TCP server listening on port ${config.jstpPort}`);
  });
};

// TODO: Implement node interaction methods

methods.isNodeConnected = (jstpLogin) => _nodes.has(jstpLogin);
methods.initDeploy = (jstpLogin, deploy) => null;
methods.startApp = (jstpLogin, deployId) => null;
methods.stopApp = (jstpLogin, deployId) => null;
methods.fetchDeploy = (jstpLogin, deployId) => null;
methods.getDeployStatus = (jstpLogin, deployId) => null;
methods.removeDeploy = (jstpLogin, deployId) => null;
