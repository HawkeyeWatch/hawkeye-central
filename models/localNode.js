'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const rand = require('rand-token');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const DeploySchema = new mongoose.Schema({
  repo: {
    type: String,
    required: true,
    // TODO: Validator
  },
  branch: {
    type: String,
    required: true,
    default: 'master',
  },
  title: {
    type: String,
    required: true,
  },
  token: {
    // Oauth token for private repos
    type: String,
  },
  webhookSecret: {
    type: String,
    required: true,
  }
});

const LocalNodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  deploys: {
    type: [DeploySchema],
  },
  jstpLogin: {
    type: String,
    required: true,
    unique: true,
  },
  jstpPassword: {
    type: String,
    required: true,
  },
  usersWithAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
});

LocalNodeSchema.plugin(beautifyUnique); // For easy duplicate handling

LocalNodeSchema.pre('save', function(callback) {
  const node = this;
  if (!node.isModified('jstpPassword')) {
    return callback();
  }

  if (node.jstpPassword.length < 8) {
    const err = new Error('password must be at least 8 symbols long');
    err.name = 'ValidationError';
    return callback(err);
  }

  bcrypt.genSalt(5, (err, salt) => {
    if (err) {
      return callback(err);
    }

    bcrypt.hash(node.jstpPassword, salt, () => {}, (err, hash) => {
      if (err) {
        return callback(err);
      }
      node.jstpPassword = hash;
      callback();
    });
  });
});

mongoose.model('Deploy', DeploySchema);


/**
 Creates deploy and associates it with local node document.
 @param {string} repo - Git repo url
 @param {string} [branch] - git repo branch
 @param {string} title - deploy's title
 @param {string} [token] - git oauth token for private repos
 @param {Function} cb - errback
 @param {JSTPServer} jstp - jstp server instance (cannot be used via import)
 because of circular import :(
  */
LocalNodeSchema.methods.createDeploy = function(
  repo,
  branch,
  title,
  token,
  webhookSecret,
  cb,
  jstp
) {
  const Deploy = mongoose.model('Deploy');
  const newDeploy = new Deploy({ repo, branch, title, token, webhookSecret });
  return newDeploy.save()
    .then(deploy => jstp.initDeploy(this.jstpLogin,
      { url: repo, _id: deploy._id.toString(), branch, token }))
    .then(() => {
      this.deploys.push(newDeploy);
      return this.save();
    })
    .then(() => cb(null, newDeploy))
    .catch(err => {
      newDeploy.remove();
      return cb(err);
    });
};

LocalNodeSchema.methods.verifyPassword = function(pass, cb) {
  bcrypt.compare(pass, this.jstpPassword, (err, isMatch) => {
    if (err) {
      return cb(err);
    }

    return cb(null, isMatch);
  });
};

function generateUniqueLogin(cb) {
  const login = rand.generate(8);
  this.findOne({ login }, (err, res) => {
    if (err) {
      return cb(err);

    }
    if (res) {
      return generateUniqueLogin(cb);
    }
    cb(null, login);
  });
}

LocalNodeSchema.statics.generateUniqueLogin = generateUniqueLogin;


module.exports = mongoose.model('LocalNode', LocalNodeSchema);
