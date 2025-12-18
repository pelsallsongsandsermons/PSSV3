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
            'settings': () => import('./views/settings-view.js'),
            'sermon-player': () => import('./views/sermon-player-view.js'),
            'playlists': () => import('./views/playlists-view.js'),
            'create-playlist': () => import('./views/create-playlist-view.js'),
            'find-sermons': () => import('./views/find-sermons-view.js'),
        };
        this.contentContainer = document.getElementById('app-content');

        // Initialize Back Button
        this.backBtn = document.getElementById('global-back-btn');
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => {
                const currentHash = window.location.hash;
                if (currentHash === '#home' || !currentHash) {
                    return; // Do nothing on home
                }

                // Simple history back, or fallback to home if external entry
                if (window.history.length > 2) {
                    // > 2 because: 1 is initial, 2 is current page. 
                    // Actually checking history length is unreliable in some browsers.
                    window.history.back();
                } else {
                    // Fallback to home
                    window.location.hash = '#home';
                }
            });
        }
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Handle initial load
    }

    async handleRoute() {
        const fullHash = window.location.hash.slice(1) || 'home';
        const [route, queryString] = fullHash.split('?');

        const params = new URLSearchParams(queryString);

        // Update Back Button Visibility
        if (this.backBtn) {
            console.log('Router: Updating back button for route:', route);
            if (route === 'home') {
                this.backBtn.classList.add('hidden');
                console.log('Router: Hiding back button');
            } else {
                this.backBtn.classList.remove('hidden');
                console.log('Router: Showing back button');
            }
        } else {
            console.error('Router: Back button element not found!');
        }

        // Update Install Button Visibility (Global Helper)
        if (window.app && window.app.updateInstallButtonVisibility) {
            window.app.updateInstallButtonVisibility();
        }

        // Reset Header Title to default (Views can override this)
        const headerTitle = document.querySelector('#main-header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Pelsall Songs and Sermons';
        }

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
