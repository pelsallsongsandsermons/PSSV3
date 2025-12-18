/**
 * PSSV3 - Native PWA
 * Main Entry Point
 */
import { CONFIG } from './config.js';
const VERSION = CONFIG.VERSION;
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

    // Initialize Theme
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

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

// PWA Install Logic
window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    window.deferredPrompt = e;
    console.log('beforeinstallprompt fired');
    if (window.app.updateInstallButtonVisibility) {
        window.app.updateInstallButtonVisibility();
    }
});

// Helper to manage button visibility
window.app.updateInstallButtonVisibility = () => {
    const installBtn = document.getElementById('install-btn');
    if (!installBtn) return;

    // 1. Check Route (Only show on Home)
    const currentHash = window.location.hash || '#home';
    const isHome = currentHash === '#home' || currentHash === '';

    if (!isHome) {
        installBtn.classList.add('hidden');
        return;
    }

    // 2. Check Installability
    // Android/Desktop: deferredPrompt exists
    // iOS: Not standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (window.deferredPrompt || (isIOS && !isStandalone)) {
        installBtn.classList.remove('hidden');
    } else {
        installBtn.classList.add('hidden');
    }
};

// Helper to trigger install
window.app.installPWA = async () => {
    // 1. Check for Android/Desktop prompt
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        window.deferredPrompt = null;
        window.app.updateInstallButtonVisibility(); // Update UI
        return;
    }

    // 2. Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIOS && !isStandalone) {
        // Show iOS instructions modal
        const iosModal = document.getElementById('ios-install-modal');
        if (iosModal) {
            iosModal.classList.remove('hidden');
        } else {
            alert('To install: Tap the Share button and select "Add to Home Screen".');
        }
    } else {
        alert('App is already installed or installation not supported on this device.');
    }
};

window.app.forceReload = async () => {
    console.log('Force reloading app (Full Reset)...');
    try {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                console.log('Unregistering SW:', registration.scope);
                await registration.unregister();
            }
        }
        const cacheNames = await caches.keys();
        for (let cacheName of cacheNames) {
            console.log('Deleting cache:', cacheName);
            await caches.delete(cacheName);
        }

        console.log('Clearing stored version and reloading...');
        localStorage.removeItem('app_version');
        sessionStorage.removeItem('last_auto_update_attempt');

        // Give the browser a moment to process unregistrations
        setTimeout(() => {
            window.location.replace(window.location.origin + window.location.pathname + '?v=' + Date.now());
        }, 500);
    } catch (err) {
        console.error('Force reload failed:', err);
        window.location.reload(true);
    }
};

async function checkVersion() {
    try {
        console.log(`Checking version. Current run-time: ${VERSION}`);

        // Fetch config.js with cache-busting timestamp to see the actual server version
        const response = await fetch(`./js/config.js?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;

        const text = await response.text();
        // Regex to match VERSION in CONFIG object (more flexible)
        const match = text.match(/VERSION:\s*['"]([^'"]+)['"]/);
        const serverVersion = match ? match[1] : null;

        console.log(`Server version detected: ${serverVersion}`);

        if (serverVersion && serverVersion !== VERSION) {
            // Loop prevention: check if we've already tried to update to this version
            const lastAttempt = sessionStorage.getItem('last_auto_update_attempt');
            if (lastAttempt === serverVersion) {
                console.warn(`Already attempted update to ${serverVersion}. Skipping reload to avoid loop.`);
                return;
            }

            console.log(`VERSION MISMATCH! Scaling up: local(${VERSION}) != server(${serverVersion})`);
            sessionStorage.setItem('last_auto_update_attempt', serverVersion);
            await window.app.forceReload();
        } else if (serverVersion === VERSION) {
            console.log('App version is up to date.');
            localStorage.setItem('app_version', VERSION);
            sessionStorage.removeItem('last_auto_update_attempt');
        }
    } catch (err) {
        console.warn('Network version check failed:', err);
    }
}

function showUpdatePrompt() {
    // Simple confirm for now, can be a nice UI toast later
    if (confirm(`New version (${VERSION}) available! Reload to update?`)) {
        window.location.reload();
    }
}
