class Router {
  static instance = null;

  constructor(routes = {}) {
    if (Router.instance) {
      return Router.instance;
    }

    this.routes = routes;
    this.currentPath = window.location.pathname;
    this.callbacks = [];

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.handleRoute(window.location.pathname);
    });

    Router.instance = this;
  }

  addNavigationCallback(callback) {
    this.callbacks.push(callback);
  }

  async navigate(path) {
    // Only update history and handle route if path is different
    if (this.currentPath !== path) {
      window.history.pushState({}, "", path);
      this.currentPath = path;
      this.handleRoute(path);

      if (path !== "/loginPage") {
        // After navigation is complete, call all callbacks
        this.callbacks.forEach(callback => callback())
      };
    }
  }

  handleRoute(pathname) {
    const route = this.routes[pathname] || this.routes["*"];
    if (route) {
      route();
    } else {
      console.log("No route handler found for:", pathname);
    }
  }
}

export default Router;
