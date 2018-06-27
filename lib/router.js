'use strict';
const Route = require('route-parser');

class Router {
  constructor(noRoute, noMethod) {
    this.routes = {};
    this.noRoute = noRoute;
    this.noMethod = noMethod;
  }
  /**
  * Assigns a handler to the route
  * @param method
  * @param path
  * @param callback handler, will receive a match object, req and res
  * @returns void
  */
  assignRoute(method, path, callback) {
    if (!this.routes[path]) {
      this.routes[path] = {
        route: new Route(path),
        cbs: {}
      };
    }
    this.routes[path].cbs[method] = callback;
  }
  /**
   * Assigns a handler to a batch of routes
   * @param {*} routes
   * {
   *   'route': {
   *     'method': handler
   *   }
   * }
   */
  assignMultipleRoutes(routes) {
    for (const route in routes) {
      for (const method in routes[route]) {
        this.assignRoute(method, route, routes[route][method]);
      }
    }
  }
  /**
  * Resolves a request by passing it to appropriate handler,
  * or to NoRoute/NoMethod handler
  * @param path
  * @param method
  * @param req
  * @param res
  * @returns boolean, indicates if request was succesfull
  */
  resolveRequest(path, method, req, res) {
    console.log(method, path);
    for (const r in this.routes) {
      const match = this.routes[r].route.match(path);
      if (match) {
        if (this.routes[r].cbs[method]) {
          this.routes[r].cbs[method]({ req, res, match });
          return true;
        } else {
          this.noMethod(path, method, req, res);
          return false;
        }
      }
    }
    this.noRoute(path, method, req, res);
    return false;
  }
}
module.exports = Router;
