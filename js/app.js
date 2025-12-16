/**
 * PSSV3 - Native PWA
 * Main Entry Point
 */
import { VERSION } from './version.js';
import { Router } from './router.js';
import { SupabaseService } from './services/supabase-client.js';
import { Player } from './player.js';

// Global App State
window.app = {
    version: VERSION,
    router: null,
    supabase: null,
    player: null
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log(`PSSV3 Starting... Version: ${VERSION}`);

    // 1. Initialize Supabase
    window.app.supabase = new SupabaseService();

    // 2. Initialize Router
    window.app.router = new Router();
    window.app.router.init();

    // 3. Initialize Player
    window.app.player = new Player();

    // 3. Register Service Worker
    if ('serviceWorker' in navigator) {
        try {
            // Use relative path for GitHub Pages compatibility
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registration successful with scope: ', registration.scope);

            // Check for updates
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New update available
                            console.log('New content is available; please refresh.');
                            showUpdatePrompt();
                        } else {
                            // Content is cached for offline use
                            console.log('Content is cached for offline use.');
                        }
                    }
                };
            };
        } catch (err) {
            console.error('ServiceWorker registration failed: ', err);
        }
    }

    // check version match
    checkVersion();
});

function checkVersion() {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== VERSION) {
        console.log(`Version mismatch: stored ${storedVersion} != current ${VERSION}. Cleaning up...`);
        // Optional: clear cache or local storage if needed for breaking changes
        // For now, just update the stored version
    }
    localStorage.setItem('app_version', VERSION);

    // Display version in UI if element exists
    const versionEl = document.getElementById('app-version');
    if (versionEl) versionEl.textContent = VERSION;
}

function showUpdatePrompt() {
    // Simple confirm for now, can be a nice UI toast later
    if (confirm(`New version (${VERSION}) available! Reload to update?`)) {
        window.location.reload();
    }
}
