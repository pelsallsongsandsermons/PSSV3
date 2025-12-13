/**
 * Router Class
 * Handles client-side navigation
 */
export class Router {
    constructor() {
        this.routes = {
            'home': () => import('./views/home-view.js'),
            'songs': () => import('./views/songs-list-view.js'),
            'sermons': () => import('./views/sermons-list-view.js'),
            'series': () => import('./views/series-view.js'),
            'series-details': () => import('./views/series-details-view.js'),
            'song-player': () => import('./views/song-player-view.js'),
        };
        this.contentContainer = document.getElementById('app-content');
        this.navItems = document.querySelectorAll('.nav-item');
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Handle initial load
    }

    async handleRoute() {
        const fullHash = window.location.hash.slice(1) || 'home';
        const [route, queryString] = fullHash.split('?');

        const params = new URLSearchParams(queryString);

        // Update Nav
        this.navItems.forEach(item => {
            if (item.getAttribute('href') === `#${route}`) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Load View
        const viewLoader = this.routes[route];
        if (viewLoader) {
            this.contentContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
            try {
                const module = await viewLoader();
                if (module.default && typeof module.default.render === 'function') {
                    // Check if it's an async render
                    const content = await module.default.render(params);
                    this.contentContainer.innerHTML = content;

                    // Call afterRender if exists (for event listeners)
                    if (typeof module.default.afterRender === 'function') {
                        module.default.afterRender();
                    }
                } else {
                    this.contentContainer.innerHTML = 'Error: View not found';
                }
            } catch (err) {
                console.error(err);
                this.contentContainer.innerHTML = 'Error loading view';
            }
        } else {
            this.contentContainer.innerHTML = '404 - Not Found';
        }
    }
}
