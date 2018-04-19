'use strict';

const rand = require('rand-token');

const LocalNode = require('../models/localNode');
const User = require('../models/user');

const errors = require('../lib/error-res');

function createNode(req, res) {
    const newNode = JSON.parse(req.body);
    if (!newNode || !newNode.title) {
        errors.endBadRequest(res, 'Not enough info.');
        console.log('Not enough info');
        return;
    }
    if (newNode.title.length < 4) {
        res.write(JSON.stringify({error: "Minimal length is 4"}));
        res.end();
        return;
    }
    LocalNode.generateUniqueLogin((err, result) => {
        if (err) {
            return errors.endServerError(res);
        }
        newNode.jstpLogin = result;
        newNode.jstpPassword = rand.generate(8);
        newNode.usersWithAccess = [req.user._id];
        const n = new LocalNode(newNode);
        n.save((error) => {
            if (error) {
                errors.endBadRequest(res, error.message);
                console.log(error.message);
                return;
            }
            req.user.addNode(n, (err) => {
                if (error) {
                    errors.endBadRequest(res, error.message);
                    console.log(error.message);
                    return;
                }
                res.write(JSON.stringify({success: 'Node created.', node: newNode}));
                console.log(`Node created. ${newNode.title} for ${req.user.login}`)
                res.end();
            })
        });
    });
}
function deleteNode(req, res) {
    if (!req.match || !req.match.id) {
        return errors.endBadRequest(res, "No id");
    }
    const nodeId = {_id: req.match.id};

    LocalNode.findById(nodeId._id, (err, node) => {
        if (err || !node || node.deploys.length > 0) {
            return errors.endBadRequest(res, "Node has deploys or is already deleted");
        }
        const userPromises = [];
        node.usersWithAccess.forEach(userId => {
            userPromises.push(User.findById(userId).exec());
        });
        Promise.all(userPromises)
        .then(users => {
            const removePromises = [];
            users.forEach((user) => {
                if (err) {
                    return errors.endServerError(res);
                }
                user.localNodes.remove(nodeId._id);
                removePromises.push(user.save());
            });
            Promise.all(removePromises)
            .then(() => {
                LocalNode.findByIdAndRemove(nodeId._id, (err) => {
                    res.write(JSON.stringify({success: 'Node deleted'}));
                    res.end();
                });
            }, () => {
                return errors.endServerError(res);
            });
        });
    });
}

module.exports = {
    createNode,
    deleteNode
}