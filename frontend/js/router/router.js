export default class Router {
    static instance = null;
    
    constructor() {
        if (Router.instance) {
            return Router.instance;
        }
        Router.instance = this;
        this.routes = new Map();
        this.currentRoute = null;
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }

    navigate(path) {
        // Prevent navigation if we're already on this route
        if (this.currentRoute === path) {
            return;
        }
        
        this.currentRoute = path;
        history.pushState(null, '', path);
        this.handleRoute();
    }

    handleRoute() {
        console.log('Handling route:', this.currentRoute);
        console.log('Available routes:', Array.from(this.routes.keys()));
        const route = this.routes.get(this.currentRoute) || this.routes.get('*');
        if (route) {
            console.log('Executing route handler for:', this.currentRoute);
            route();
        } else {
            console.log('No route handler found for:', this.currentRoute);
        }
    }
} 