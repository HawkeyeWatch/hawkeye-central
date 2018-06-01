'use strict';

const jstp = require('metarhia-jstp');
const config = require('./');
const LocalNode = require('../models/localNode');

class JSTPServer {
  /**
   Initialises JSTP server instance
   */
  init(serverEmitter) {
    const serverInstance = this;
    const app = new jstp.Application('serverRPC', {
      serverService: {
        subscribe(connection, callback) {
          connection.inspectInterface('clientService', (error, proxy) => {
            if (error) {
              console.error(`Something went wrong: ${error}`);
              return;
            }
            serverInstance._nodes.set(connection.username, proxy);
            connection.on('close', () => serverInstance._nodes
              .delete(connection.username));
            return callback();
          });
        },
      },
    }, {
      serverService: {
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
        LocalNode.findOne({ 'jstpLogin': credentials[0] })
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
  }
  /**
   Check if local node is currently connected
   @param {string} jstpLogin - local node's login
   @returns {boolean} true if node is connected
   */
  isNodeConnected(jstpLogin) {
    return this._nodes.has(jstpLogin);
  }

  _callProcedure(jstpLogin, deployId, procedure) {
    return new Promise((resolve, reject) => {
      if (this.isNodeConnected(jstpLogin)) {
        this._nodes.get(jstpLogin)[procedure](deployId, (err, ...args) => {
          if (err) {
            return reject(JSON.parse(err.message));
          }
          return resolve(args);
        });
      } else {
        return reject(new Error('node disconnected'));
      }
    });
  }

  /**
   Initialise deploy on local node
   @param {string} jstpLogin - local node's login
   @param {object} deploy - object containing deploy's info
   @param {string} deploy.url - git url for deploy
   @param {string} deploy.deployId - deploy's identifier
   @param {string} [deploy.branch] - git repo branch to run deploy from
   @param {string} [deploy.token] - ouath token for private repos
   @returns {Promise} Promise object which rejects if deploy is already created
   or node disconnected
   */
  initDeploy(jstpLogin, deploy) {
    let credentials = null;
    if (deploy.token) {
      credentials = { token };
    }

    return this._callProcedure(jstpLogin, {
         url: deploy.url,
         deployId: deploy._id,
         branch: deploy.branch,
          credentials }, 'initDeploy');
  }

  /**
   Start deploy's application
   @param {string} jstpLogin - local node's login
   @param {string} deploy.deployId - deploy's identifier
   @returns {Promise} Promise object which rejects if deploy is already running
   or node disconnected
   */
  startApp(jstpLogin, deployId) {
    return this._callProcedure(jstpLogin, deployId, 'startApp');
  }

  stopApp(jstpLogin, deployId) {
    return this._callProcedure(jstpLogin, deployId, 'stopApp');
  }

  fetchDeploy(jstpLogin, deployId) {
    return this._callProcedure(jstpLogin, deployId, 'fetch');
  }

  /**
   Get status of deployed application
   @param {string} jstpLogin - local node's login
   @param {string} deploy.deployId - deploy's identifier
   @returns {Promise} Promise object with 'lastState', 'running' and
    'lastDeployLog' fields
   */
  getDeployStatus(jstpLogin, deployId) {
    return this._callProcedure(jstpLogin, deployId, 'getStatus');
  }

  removeApp(jstpLogin, deployId) {
    return this._callProcedure(jstpLogin, deployId, 'removeApp');
  }

  /**
   Check if deploy is initialized
   @param {string} jstpLogin - local node's login
   @param {string} deploy.deployId - deploy's identifier
   @returns {Promise} Promise object with boolean - isInitialized
   */
  isInitialized(jstpLogin, deployId) {
    return this._callProcedure(jstpLogin, deployId, 'isInitialized');
  }
}

const instance = new JSTPServer();
Object.freeze(instance);

module.exports = instance;
