'use strict';

const endUnauthorised = res => {
    res.statusCode = 401;
    res.statusMessage = 'Unauthorised';
    res.write(JSON.stringify({error: '401 Unauthorised'}));
    res.end();
}

const endNotFound = res => {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    res.write(JSON.stringify({error: '404 Not Found'}));
    res.end();
}

const endBadRequest = (res, msg) => {
    res.statusCode = 400;
    res.statusMessage = 'Bad Request';
    res.write(JSON.stringify({error: msg}));
    res.end();
}

module.exports = {
    endUnauthorised,
    endNotFound,
    endBadRequest
}