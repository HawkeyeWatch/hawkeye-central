'use strict';

const jstp = require('metarhia-jstp');
const config = require('../config');
const LocalNode = require('../models/localNode');

class JSTPServer {
  constructor() {
    if (!JSTPServer.instance) {
      JSTPServer.instance = this;
      this._nodes = new Map();
    }

    return JSTPServer.instance;
  }

  /**
   Initialises JSTP server instance
   */
  init() {
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
   @returns {Promise} Promise object which rejects if deploy is already created
   or node disconnected
   */
  initDeploy(jstpLogin, deploy) {

    return this._callProcedure(jstpLogin, {
      url: deploy.url,
      deployId: deploy._id,
      branch: deploy.branch }, 'initDeploy');
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
