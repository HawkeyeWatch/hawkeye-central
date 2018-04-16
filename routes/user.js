'use strict';

const User = require('../models/user')
const LocalNode = require('../models/localNode')

const errors = require('../lib/error-res');
/**
 * Creates a new user in the database, according to user model
 * @param {Request} req 
 * @param {Response} res 
 */
function registerUser(req, res) {
    const newUser = JSON.parse(req.body);
    if (!newUser.name || !newUser.password || !newUser.login) {
        errors.endBadRequest(res, 'Not enough info.');
        console.log('Not enough info');
        return;
    }
    const u = new User(newUser);
    u.save((error) => {
        if (error) {
            errors.endBadRequest(res, error.message);
            console.log(error.message);
            return;
        }
        res.write(JSON.stringify({success: 'User created.'}));
        console.log(`User created. ${newUser.name} ${newUser.login}`)
        res.end();
    });
}
/**
 * Checks user login and password, issues a token if all is ok
 * else ends with a 400, 401 or 404 depending on situation
 * @param {Request} req 
 * @param {Response} res 
 */
function getToken(req, res) {
    const user = JSON.parse(req.body);
    if (!user.password || !user.login) {
        errors.endBadRequest(res, 'Not enough info.');
        console.log('Not enough info');
        return;
    }
    User.findOne({login: user.login}).then(
        r => {
            if (r) {
                r.verifyPassword(user.password, (err, match) => {
                    if (err || !match) {
                        errors.endUnauthorised(res);
                        console.log('Login', err, match);
                        return;
                    }
                    res.write(JSON.stringify({name: r.name, login: r.login, token: r.generateJwt(user.extended)}));
                    console.log('Login succesful');
                    res.end();
                })
            } else {
                errors.endNotFound(res);
            }
        }
    );
}
function getNodes(req, res) {
    const nodePromises = [];
    req.user.localNodes.forEach(node => {
        nodePromises.push(LocalNode.findById(node));
    });
    Promise.all(nodePromises).then(
        objects => {
            res.write(JSON.stringify(objects));
            res.end();
        }
    )
}

module.exports = {
    post: registerUser,
    getToken,
    getNodes
}