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
      someEvent(connection, data) {
        console.log('received event from client:');
        console.log(data);
      },
      initStart(connection, data) {
        console.log('received deploy init event');
        // TODO: pass event to serverEmitter
      },
      initErr(connection, data) {
        console.log('received deploy init error: ', data);
        // TODO: pass event to serverEmitter
      },
      fetchStart(connection, data) {
        console.log('received deploy fetch event');
        // TODO: pass event to serverEmitter
      },
      fetchErr(connection, data) {
        console.log('received deploy fetch error: ', data);
        // TODO: pass event to serverEmitter
      },
      fetchEnd(connection, data) {
        console.log('received deploy fetch end event');
        // TODO: pass event to serverEmitter
      },
      buildStart(connection, data) {
        console.log('received deploy build event');
        // TODO: pass event to serverEmitter
      },
      buildErr(connection, data) {
        console.log('received deploy build error: ', data);
        // TODO: pass event to serverEmitter
      },
      buildEnd(connection, data) {
        console.log('received deploy build end event');
        // TODO: pass event to serverEmitter
      },
      testStart(connection, data) {
        console.log('received deploy test event');
        // TODO: pass event to serverEmitter
      },
      testErr(connection, data) {
        console.log('received deploy test error: ', data);
        // TODO: pass event to serverEmitter
      },
      testEnd(connection, data) {
        console.log('received deploy test end event');
        // TODO: pass event to serverEmitter
      },
      deployStart(connection, data) {
        console.log('received deploy start event');
        // TODO: pass event to serverEmitter
      },
      deployErr(connection, data) {
        console.log('received deploy error: ', data);
        // TODO: pass event to serverEmitter
      },
      deployEnd(connection, data) {
        console.log('received deploy end event');
        // TODO: pass event to serverEmitter
      },
      runStdout(connection, data) {
        console.log('received deploy stdout:', data);
        // TODO: pass event to serverEmitter
      },
      runStderr(connection, data) {
        console.log('received deploy stderr: ', data);
        // TODO: pass event to serverEmitter
      },
      runErr(connection, data) {
        console.log('received deploy run non-zero exit code event:', data);
        // TODO: pass event to serverEmitter
      },
      runEnd(connection, data) {
        console.log('received deploy run succesfull end event');
        // TODO: pass event to serverEmitter
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

const isNodeConnected = (jstpLogin) => _nodes.has(jstpLogin);

// TODO: Implement node interaction methods
// TODO: Refactor

module.exports.isNodeConnected = isNodeConnected;

module.exports.initDeploy = (jstpLogin, deploy) => {
  return new Promise((resolve, reject) => {
    if (isNodeConnected(jstpLogin)) {
      let credentials = null;
      if (deploy.token) {
        credentials = { token };
      }
      _nodes.get(jstpLogin).initDeploy({
       url: deploy.url,
       deployId: deploy._id,
       branch: deploy.branch,
        credentials }, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        });
    } else {
      return reject(new Error('node disconnected'));
    }
  });
};

module.exports.startApp = (jstpLogin, deployId) => {
  return new Promise((resolve, reject) => {
    if (isNodeConnected(jstpLogin)) {
      _nodes.get(jstpLogin).startApp(deployId, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    }
  });
};

module.exports.stopApp = (jstpLogin, deployId) => {
  return new Promise((resolve, reject) => {
    if (isNodeConnected(jstpLogin)) {
      _nodes.get(jstpLogin).stopApp(deployId, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    }
  });
};

module.exports.fetchDeploy = (jstpLogin, deployId) => null;
module.exports.getDeployStatus = (jstpLogin, deployId) => null;
module.exports.removeApp = (jstpLogin, deployId) => {
  return new Promise((resolve, reject) => {
    if (isNodeConnected(jstpLogin)) {
      _nodes.get(jstpLogin).removeApp(deployId, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    }
  });
};
