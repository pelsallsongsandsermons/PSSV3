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
    console.log('Force reloading app...');
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            await registration.unregister();
        }
    }
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
        await caches.delete(cacheName);
    }
    localStorage.setItem('app_version', VERSION);
    window.location.reload(true);
};

function checkVersion() {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== VERSION) {
        console.log(`Version mismatch: stored ${storedVersion} != current ${VERSION}. Force reloading...`);
        window.app.forceReload();
    } else {
        localStorage.setItem('app_version', VERSION);
    }
}

function showUpdatePrompt() {
    // Simple confirm for now, can be a nice UI toast later
    if (confirm(`New version (${VERSION}) available! Reload to update?`)) {
        window.location.reload();
    }
}
