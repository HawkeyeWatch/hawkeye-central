'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const config = require('../config');

const DeploySchema = new mongoose.Schema({
  repo: {
    type: String,
    required: true,
    // TODO: Validator
  },
  title: {
    type: String,
    required: true,
  },
  token: {
    // Oauth token for private repos
    type: String,
  },

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
    unique: true
  },
  jstpPassword: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

LocalNodeSchema.plugin(beautifyUnique); // For easy duplicate handling

LocalNodeSchema.pre('save', function(callback) {
  const node = this;
  if (!user.isModified('jstpPassword')) {
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

LocalNodeSchema.methods.verifyPassword = function(pass, cb) {
  bcrypt.compare(pass, this.jstpPassword, (err, isMatch) => {
    if (err) {
      cb(err);
    }

    cb(null, isMatch);
  });
};

mongoose.model('Deploy', DeploySchema);

module.exports = mongoose.model('LocalNode', UserSchema);
