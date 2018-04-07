'use strict';

const http = require('http');
const Router = require('../lib/router');

module.exports = {};

function someMiddleware(match, req, res, handler) {
    res.write("middlewared ");
    handler(match, req, res);
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

router.assignRoute('GET', '/', require('../routes/root'));
router.assignRoute(
    'GET',
    '/middlewaredemo',
    (m, req, res) => 
        someMiddleware(
            m, 
            req, 
            res, 
            require('../routes/root')
        )
)

module.exports.init = () => {
    return http.createServer(function (req, res) {
        router.resolveRequest(req.url, req.method, req, res)
    }); 
}