'use strict';

const rand = require('rand-token');

const LocalNode = require('../models/localNode');
const User = require('../models/user');

const jstpServer = require('../config/jstp');

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

function createDeploy(req, res) {
    const {nodeId, deploy} = JSON.parse(req.body);
    if (!nodeId || !deploy || !deploy.repo || !deploy.branch || !deploy.title) {
        return errors.endBadRequest(res, 'Not enough data');
    }
    LocalNode.findById(nodeId, (err, node) => {
        if (err) {
            return errors.endServerError(res);
        }
        if (!jstpServer.isNodeConnected(node.jstpLogin)) {
            res.write(JSON.stringify({error: 'Node is not connected.'}));
            console.log(jstpServer.isNodeConnected(node.jstpLogin))
            return res.end();
        }
        node.createDeploy(deploy.repo, deploy.branch, deploy.title, deploy.token, (err, deploy) => {
            if (err) {
                return errors.endBadRequest(res, err);
            }
            deploy.status = jstpServer.getDeployStatus(node.jstpLogin, deploy._id);
            res.write(JSON.stringify({success: "Deploy created.", deploy}));
            res.end();
        }, jstpServer);
    });
}
function deleteDeploy(req, res) {
    const {nodeId, deployId} = JSON.parse(req.body);
    if (!nodeId || !deployId) {
        return errors.endBadRequest(res, 'Not enough data');
    }
    LocalNode.findById(nodeId, (err, node) => {
        if (err) {
            return errors.endServerError(res);
        }
        if (!jstpServer.isNodeConnected(node.jstpLogin)) {
            res.write(JSON.stringify({error: 'Node is not connected.'}));
            return res.end();
        }
        const deploy = node.deploys.id(deployId);
        if (!deploy) {
            return errors.endBadRequest(res, 'Deploy is not existing.');
        }
        deploy.remove();
        Promise.all([node.save(), jstpServer.removeApp(node.jstpLogin, deployId)])
            .then((node) => {
                res.write(JSON.stringify({success: "Deploy deleted."}));
                res.end();
            }, (err) => {
                console.error(err);
                return errors.endServerError(res);
            });
    });
};
function getDeploy(req, res) {
    const {nodeId, deployId} = JSON.parse(req.body);
    LocalNode.findById(nodeId, (err, node) => {
        if (err) {
            return errors.endServerError(res);
        }
        if (!jstpServer.isNodeConnected(node.jstpLogin)) {
            res.write(JSON.stringify({error: 'Node is not connected.'}));
            return res.end();
        }
        const deploy = node.deploys.id(deployId);
        if (!deploy) {
            return errors.endBadRequest(res, 'Deploy is not existing.');
        }
        jstpServer.getDeployStatus(node.jstpLogin, deployId)
            .then((status) => {
                res.write(JSON.stringify({
                    _id: deploy._id,
                    title: deploy.title,
                    repo: deploy.repo,
                    branch: deploy.branch,
                    status
                }));
                res.end();
            }, (err) => {
                console.log(err);
                return errors.endServerError(res);
            });
    });
}

function stopDeploy(req, res) {
    const {nodeId, deployId} = JSON.parse(req.body);
    LocalNode.findById(nodeId, (err, node) => {
        if (err) {
            return errors.endServerError(res);
        }
        if (!jstpServer.isNodeConnected(node.jstpLogin)) {
            res.write(JSON.stringify({error: 'Node is not connected.'}));
            return res.end();
        }
        const deploy = node.deploys.id(deployId);
        if (!deploy) {
            return errors.endBadRequest(res, 'Deploy is not existing.');
        }
        jstpServer.stopApp(node.jstpLogin, deployId)
            .then((status) => {
                jstpServer.getDeployStatus(node.jstpLogin, deployId)
                    .then((status) => {
                        res.write(JSON.stringify({
                            _id: deploy._id,
                            title: deploy.title,
                            repo: deploy.repo,
                            branch: deploy.branch,
                            status
                        }));
                        res.end();
                    }, (err)=> {
                        console.log(err);
                        return errors.endServerError(res);
                    });
            }, (err)=> {
                console.log(err);
                return errors.endServerError(res);
            });
    });
}

function startDeploy(req, res) {
    const {nodeId, deployId} = JSON.parse(req.body);
    LocalNode.findById(nodeId, (err, node) => {
        if (err) {
            return errors.endServerError(res);
        }
        if (!jstpServer.isNodeConnected(node.jstpLogin)) {
            res.write(JSON.stringify({error: 'Node is not connected.'}));
            return res.end();
        }
        const deploy = node.deploys.id(deployId);
        if (!deploy) {
            return errors.endBadRequest(res, 'Deploy is not existing.');
        }
        jstpServer.startApp(node.jstpLogin, deployId)
            .then((status) => {
                jstpServer.getDeployStatus(node.jstpLogin, deployId)
                    .then((status) => {
                        res.write(JSON.stringify({
                            _id: deploy._id,
                            title: deploy.title,
                            repo: deploy.repo,
                            branch: deploy.branch,
                            status
                        }));
                        res.end();
                    }, (err)=> {
                        console.log(err);
                        return errors.endServerError(res);
                    });
            }, (err)=> {
                console.log(err);
                return errors.endServerError(res);
            });
    });
}
function fetchDeploy(req, res) {
    const {nodeId, deployId} = JSON.parse(req.body);
    LocalNode.findById(nodeId, (err, node) => {
        if (err) {
            return errors.endServerError(res);
        }
        if (!jstpServer.isNodeConnected(node.jstpLogin)) {
            res.write(JSON.stringify({error: 'Node is not connected.'}));
            return res.end();
        }
        const deploy = node.deploys.id(deployId);
        if (!deploy) {
            return errors.endBadRequest(res, 'Deploy is not existing.');
        }
        jstpServer.fetchDeploy(node.jstpLogin, deployId)
            .then((status) => {
                jstpServer.getDeployStatus(node.jstpLogin, deployId)
                    .then((status) => {
                        res.write(JSON.stringify({
                            _id: deploy._id,
                            title: deploy.title,
                            repo: deploy.repo,
                            branch: deploy.branch,
                            status
                        }));
                        res.end();
                    }, (err)=> {
                        console.log(err);
                        return errors.endServerError(res);
                    });
            }, (err)=> {
                console.log(err);
                return errors.endServerError(res);
            });
    });
}

module.exports = {
    createNode,
    deleteNode,
    createDeploy,
    deleteDeploy,
    getDeploy,
    startDeploy,
    stopDeploy,
    fetchDeploy
}