'use strict';

const rand = require('rand-token');

const LocalNode = require('../models/localNode');
const User = require('../models/user');

const errors = require('../lib/error-res');

function createNode(req, res) {
    const newNode = JSON.parse(req.body);
    if (!newNode.title) {
        errors.endBadRequest(res, 'Not enough info.');
        console.log('Not enough info');
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
                console.log(`User created. ${newNode.title} for ${req.user.login}`)
                res.end();
            })
        });
    });
}
function deleteNode(req, res) {
    const nodeId = JSON.parse(req.body);
    if (!nodeId || !nodeId._id) {
        return errors.endBadRequest(res, "No id");
    }
    LocalNode.findById(nodeId._id, (err, node) => {
        if (err || !node || node.deploys.length > 0) {
            return errors.endBadRequest(res, "Node has deploys or is already deleted");
        }
        const userPromises = [];
        node.usersWithAccess.forEach(userId => {
            userPromises.push(User.findById(userId).exec());
        });
        console.log(userPromises)
        Promise.all(userPromises)
        .then(users => {
            console.log("Asadasdasd");
            let removePromises = [];
            users.forEach((user) => {
                if (err) {
                    return errors.endServerError(res);
                }
                user.localNodes.remove(nodeId._id);
                removePromises.push(user.save());
                console.log("Asadasdasd");
            });
            console.log("Asadasdasd");
            console.log(removePromises);
            console.log("Asadasdasd")
            Promise.all(removePromises, () => {
                console.log("Asadasdasd")
                LocalNode.findByIdAndRemove(nodeId._id, (err) => {
                    console.log("Asadasdasd")
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