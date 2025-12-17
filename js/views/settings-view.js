/**
 * Settings View
 * User preferences and app settings
 */
export default {
    render: async () => {
        // Load current settings from localStorage
        const useCustomPlayer = localStorage.getItem('use_custom_player') !== 'false'; // Default true
        const keepScreenOn = localStorage.getItem('keep_screen_on') !== 'false'; // Default true

        return `
            <div class="view settings-view">
                <h2>Settings</h2>
                
                <div class="settings-section">
                    <h3>Display</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Dark Mode</span>
                            <span class="setting-description">Switch between Light and Dark themes</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="toggle-theme">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Sermon Player</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Use Custom Player</span>
                            <span class="setting-description">Play sermons in the app instead of opening Podbean</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="toggle-custom-player" ${useCustomPlayer ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>App</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Keep Screen On</span>
                            <span class="setting-description">Prevent screen from sleeping while playing music</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="toggle-keep-screen-on" ${keepScreenOn ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item" id="install-container">
                        <div class="setting-info">
                            <span class="setting-label">Install App</span>
                            <span class="setting-description">Install as a native app on your device</span>
                        </div>
                        <button class="action-btn" onclick="window.app.installPWA()">Install</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Version</span>
                            <span class="setting-description" id="settings-version">Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="about-text">
                    <p>Pelsall Songs and Sermons v3.0</p>
                    <p>&copy; 2025 Pelsall Evangelical Church</p>
                </div>

                <!-- iOS Install Instructions Modal -->
                <div id="ios-install-modal" class="modal hidden" onclick="this.classList.add('hidden')">
                    <div class="modal-content" onclick="event.stopPropagation()">
                        <h3>Install on iOS</h3>
                        <p>To install this app on your iPhone or iPad:</p>
                        <ol style="text-align: left; margin-bottom: 20px; padding-left: 20px; color: var(--secondary-text);">
                            <li style="margin-bottom: 10px;">Tap the <strong>Share</strong> button <i class="fas fa-share-square"></i> in your browser toolbar.</li>
                            <li>Scroll down and select <strong>"Add to Home Screen"</strong> <i class="fas fa-plus-square"></i>.</li>
                        </ol>
                        <button class="btn-primary full-width-btn" onclick="document.getElementById('ios-install-modal').classList.add('hidden')">Got it</button>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender: () => {
        // Update version display
        const versionEl = document.getElementById('settings-version');
        if (versionEl && window.app?.version) {
            versionEl.textContent = window.app.version;
        }

        // Toggle handler
        const toggle = document.getElementById('toggle-custom-player');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                localStorage.setItem('use_custom_player', e.target.checked);
                console.log('Custom player setting:', e.target.checked);
            });
        }

        const screenToggle = document.getElementById('toggle-keep-screen-on');
        if (screenToggle) {
            screenToggle.addEventListener('change', (e) => {
                localStorage.setItem('keep_screen_on', e.target.checked);
                console.log('Keep screen on setting:', e.target.checked);
            });
        }
        // Theme Toggle
        const themeToggle = document.getElementById('toggle-theme');
        if (themeToggle) {
            const currentTheme = localStorage.getItem('theme') || 'light';
            themeToggle.checked = currentTheme === 'dark';

            themeToggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                localStorage.setItem('theme', newTheme);

                if (newTheme === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            });
        }
    }
};
