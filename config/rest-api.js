'use strict';

const http = require('http');

const Router = require('../lib/router');
const bodyUnpacker = require('../lib/body-unpacker');
const jwtAuth = require('../lib/jwt-auth');
const errors = require('../lib/error-res');

const user = require('../routes/user');
const localNode = require('../routes/local-node');

module.exports = {};
function noRouteHandler(path, method, req, res) {
  res.statusCode = 404;
  res.statusMessage = 'Not Found';
  res.write('404 Not Found');
  res.end();
}

function noMethodHandler(path, method, req, res) {
  res.statusCode = 405;
  res.statusMessage = 'Method Not Allowed';
  res.write('405 Method Not Allowed');
  res.end();
}

const router = new Router(noRouteHandler, noMethodHandler);

const routes = {
  '/user': {
    'POST': bodyUnpacker(user.post),
    'GET': jwtAuth(user.getUser),
  },
  '/user/login': {
    'POST': bodyUnpacker(user.getToken),
  },
  '/user/nodes': {
    'GET': jwtAuth(user.getNodes),
  },
  '/user/addnode': {
    'POST': jwtAuth(bodyUnpacker(user.addNode)),
  },
  'user/all': {
    'GET': jwtAuth(user.getUsers),
  },
  '/user/promote': {
    'POST': jwtAuth(bodyUnpacker(user.changeUserStatus)),
  },
  '/user/togglereg': {
    'POST': jwtAuth(user.toggleRegistration),
  },
  '/user/regallowed': {
    'GET': user.registrationAllowed,
  },

  '/node': {
    'POST': jwtAuth(bodyUnpacker(localNode.createNode)),
  },
  '/node/deploy': {
    'POST': jwtAuth(bodyUnpacker(localNode.createDeploy)),
  },
  '/node/deploy/delete': {
    'POST': jwtAuth(bodyUnpacker(localNode.deleteDeploy)),
  },
  '/node/deploy/get': {
    'POST': jwtAuth(bodyUnpacker(localNode.getDeploy)),
  },
  '/node/deploy/start': {
    'POST': jwtAuth(bodyUnpacker(localNode.startDeploy)),
  },
  '/node/deploy/stop': {
    'POST': jwtAuth(bodyUnpacker(localNode.stopDeploy)),
  },
  '/node/deploy/fetch': {
    'POST': jwtAuth(bodyUnpacker(localNode.fetchDeploy)),
  },
  '/node/delete/:id': {
    'DELETE': jwtAuth(bodyUnpacker(localNode.deleteNode)),
  },

  '/webhooks': {
    'POST': bodyUnpacker(localNode.webhooks),
  },
};

router.assignMultipleRoutes(routes);

const server = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD');
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');


  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4);
  }
  try {
    router.resolveRequest(req.url, req.method, req, res);
  } catch (e) {
    errors.endServerError(res, e);
  }
};

module.exports.init = (cb) => {
  cb(null, http.createServer(
    server
  ));
};
