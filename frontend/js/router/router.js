class Router {
    static instance = null;
    
    constructor(routes = {}) {
        if (Router.instance) {
            return Router.instance;
        }
        
        this.routes = routes;
        this.currentPath = window.location.pathname;
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });
        
        Router.instance = this;
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    }

    handleRoute(pathname) {
        console.log('Handling route:', pathname);
        console.log('Available routes:', Object.keys(this.routes));
        const route = this.routes[pathname] || this.routes['*'];
        if (route) {
            console.log('Executing route handler for:', pathname);
            route();
        } else {
            console.log('No route handler found for:', pathname);
        }
    }
}

export default Router; 