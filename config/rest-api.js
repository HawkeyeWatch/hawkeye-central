'use strict';

const http = require('http');
const Router = require('../lib/router');
const bodyUnpacker = require('../lib/body-unpacker');
const root = require('../routes/root');
const user = require('../routes/user');
const jwtAuth = require('../lib/jwt-auth');


module.exports = {};

function someMiddleware(handler) {
    return (req, res) => {
        res.write("middlewared ");
        handler(req, res);
    }
}

function noRouteHandler(path, method, req, res) {
    res.statusCode = 404;
    res.statusMessage = "Not Found";
    res.write("404 Not Found");
    res.end();
}

function noMethodHandler(path, method, req, res) {
    res.statusCode = 405;
    res.statusMessage = "Method Not Allowed";
    res.write("405 Method Not Allowed");
    res.end();
}

const router = new Router(noRouteHandler, noMethodHandler);

router.assignRoute('GET', '/', jwtAuth(root.get));
router.assignRoute('POST', '/', bodyUnpacker(root.post));
router.assignRoute(
    'GET',
    '/middlewaredemo',
    someMiddleware(require('../routes/root'))
)
router.assignRoute('POST', '/user', bodyUnpacker(user.post));
router.assignRoute('GET', '/user/:login', user.getUserByLogin);


module.exports.init = () => {
    return http.createServer(function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        router.resolveRequest(req.url, req.method, req, res);
    }); 
}