'use strict';

const User = require('../models/user');
const LocalNode = require('../models/localNode');
const jstpServer = require('../lib/jstp');

const config = require('../config');

const errors = require('../lib/error-res');
/**
* Creates a new user in the database, according to user model
* @param {Request} req
* @param {Response} res
*/
function registerUser({ req, res, body, match, user }) {
  if (!config.registrationAllowed) {
    return errors.endBadRequest(
      res,
      'Registration is disabled. Ask your system administrator.'
    );
  }
  const newUser = JSON.parse(body);
  if (!newUser.name || !newUser.password || !newUser.login) {
    errors.endBadRequest(res, 'Not enough info.');
    return;
  }
  const u = new User(newUser);
  User.count({}, (err, c) => {
    if (err) {
      errors.endBadRequest(res);
    }
    u.isAdmin = c === 0;

    u.save((error) => {
      if (error) {
        errors.endBadRequest(res, error.message);
        return;
      }
      res.write(JSON.stringify({ success: 'User created.' }));
      console.log(`User created. ${newUser.name} ${newUser.login}`);
      res.end();
    });
  });
}
/**
* Checks user login and password, issues a token if all is ok
* else ends with a 400, 401 or 404 depending on situation
* @param {Request} req
* @param {Response} res
*/
function getToken({ req, res, body, match }) {
  const user = JSON.parse(body);
  if (!user.password || !user.login) {
    errors.endBadRequest(res, 'Not enough info.');
    return;
  }
  User.findOne({ login: user.login }).then(
    r => {
      if (r) {
        r.verifyPassword(user.password, (err, match) => {
          if (err || !match) {
            errors.endUnauthorised(res);
            return;
          }
          res.write(JSON.stringify({
            name: r.name,
            login: r.login,
            token: r.generateJwt(user.extended),
            isAdmin: r.isAdmin
          }));
          console.log('Login succesful');
          res.end();
        });
      } else {
        errors.endNotFound(res);
      }
    }
  );
}
function getNodes({ req, res, body, match, user }) {
  if (user.isAdmin) {
    LocalNode.find({}, (err, objects) => {
      res.write(JSON.stringify(objects.map(node => ({
        _id: node._id,
        title: node.title,
        jstpLogin: node.jstpLogin,
        deploys: node.deploys.map(deploy => ({
          _id: deploy._id,
          title: deploy.title,
          repo: deploy.repo,
          branch: deploy.branch,
        })),
        isConnected: jstpServer.isNodeConnected(node.jstpLogin),
      }))));
      res.end();
    });
    return;
  }
  const nodePromises = [];
  user.localNodes.forEach(node => {
    nodePromises.push(LocalNode.findById(node));
  });
  Promise.all(nodePromises).then(
    objects => {
      res.write(JSON.stringify(objects.map(node => ({
        _id: node._id,
        title: node.title,
        jstpLogin: node.jstpLogin,
        deploys: node.deploys.map(deploy => ({
          _id: deploy._id,
          title: deploy.title,
          repo: deploy.repo,
          branch: deploy.branch,
        })),
        isConnected: jstpServer.isNodeConnected(node.jstpLogin),
      }))));
      res.end();
    }
  );
}
function addNode({ req, res, body, match, user }) {
  const nodeId = JSON.parse(body);
  if (!nodeId || !nodeId.jstpLogin || !nodeId.jstpPassword) {
    return errors.endBadRequest(res, 'Not enogh info');
  }
  LocalNode.findOne({ jstpLogin: nodeId.jstpLogin }, (err, node) => {
    if (err) {
      return errors.endServerError(res, err);
    }
    if (!node) {
      return errors.endNotFound(res);
    }
    if (user.localNodes.find(i => i === node._id)) {
      res.write(JSON.stringify({ error: 'You already have this node.' }));
      return res.end();
    }
    node.verifyPassword(nodeId.jstpPassword, (err, match) => {
      if (err) {
        return errors.endServerError(res, err);
      }
      if (match) {
        user.localNodes.push(node._id);
        user.save(() => {
          node.usersWithAccess.push(user._id);
          node.save(() => {
            res.write(JSON.stringify({
              success: 'Node added',
              node: {
                _id: node._id,
                title: node.title,
                jstpLogin: node.jstpLogin,
                deploys: node.deploys.map(deploy => ({
                  _id: deploy._id,
                  title: deploy.title,
                  repo: deploy.repo,
                  branch: deploy.branch,
                  webhookSecret: deploy.webhookSecret
                })),
                isConnected: jstpServer.isNodeConnected(node.jstpLogin),
              }
            }));
            res.end();
          });
        });
        return;
      } else {
        res.write(JSON.stringify({ error: 'Password not correct' }));
        res.end();
      }
    });
  });
}

function getUsers({ req, res, body, match, user }) {
  if (!user.isAdmin) {
    return errors.endUnauthorised(res);
  }
  User.find({}, (err, users) => {
    if (err) {
      return errors.endServerError(res, err);
    }
    res.write(JSON.stringify(
      users.map(r => ({
        name: r.name,
        login: r.login,
        isAdmin: r.isAdmin,
        _id: r._id
      }))
    ));
    res.end();
  });
}
function getUser({ req, res, body, match, user }) {
  res.write(JSON.stringify({
    name: user.name,
    login: user.login,
    isAdmin: user.isAdmin
  }));
  res.end();
}
function changeUserStatus({ req, res, body, match, user }) {
  if (!user.isAdmin) {
    return errors.endUnauthorised(res);
  }
  const b = JSON.parse(body);
  if (!b.userId) {
    return errors.endBadRequest(res, 'No id provided');
  }
  User.findById(b.userId, (err, us) => {
    if (err) {
      return errors.endServerError(res, err);
    }
    us.isAdmin = !us.isAdmin;
    us.save()
      .then(
        () => (res.write(JSON.stringify({ isAdmin: us.isAdmin })), res.end()),
        (err) => errors.endServerError(res, err)
      );
  });
}
function toggleRegistration({ req, res, body, match, user }) {
  if (!user.isAdmin) {
    return errors.endUnauthorised(res);
  }
  config.registrationAllowed = !config.registrationAllowed;
  console.log('Registration rules changed: ' + config.registrationAllowed);
  res.write(JSON.stringify({
    allowed: config.registrationAllowed
  }));
  res.end();
}
function registrationAllowed({ req, res, body, match, user }) {
  console.log('Registration allowed: ' + config.registrationAllowed);
  res.write(JSON.stringify({
    allowed: config.registrationAllowed
  }));
  res.end();
}

module.exports = {
  post: registerUser,
  getToken,
  getNodes,
  addNode,
  getUsers,
  changeUserStatus,
  getUser,
  toggleRegistration,
  registrationAllowed
};
