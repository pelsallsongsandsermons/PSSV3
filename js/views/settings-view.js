/**
 * Settings View
 * User preferences and app settings
 */
export default {
    render: async () => {
        // Load current settings from localStorage
        const useCustomPlayer = localStorage.getItem('use_custom_player') !== 'false'; // Default true
        const keepScreenOn = localStorage.getItem('keep_screen_on') !== 'false'; // Default true
        const transcriptionEnabled = localStorage.getItem('transcription_enabled') === 'true';
        const deepgramApiKey = localStorage.getItem('deepgram_api_key') || '';
        const deepgramKeywords = localStorage.getItem('deepgram_keywords') || 'Scripture, ministry, sermon, gospel';
        const replacementPhrases = localStorage.getItem('replacement_phrases') || 'gonna|going to\nwanna|want to';

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
                    <h3>Transcription</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Enable Transcription</span>
                            <span class="setting-description">Transcribe sermons to text using Deepgram</span>
                        </div>
                        <div class="setting-actions">
                            <button id="btn-deepgram-help" class="icon-btn help-btn" title="How to get an API Key">
                                <i class="fas fa-question-circle"></i>
                            </button>
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggle-transcription" ${transcriptionEnabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div id="transcription-settings" class="${transcriptionEnabled ? '' : 'hidden'}">
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Deepgram API Key</span>
                                <span class="setting-description">Enter your Deepgram API Key</span>
                            </div>
                            <input type="password" id="deepgram-api-key" class="setting-input" value="${deepgramApiKey}" placeholder="Enter Key...">
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Keyterm Phrases</span>
                                <span class="setting-description">Comma-separated phrases for context</span>
                            </div>
                            <input type="text" id="deepgram-keywords" class="setting-input" value="${deepgramKeywords}" placeholder="e.g. Scripture, ministry...">
                        </div>

                        <div class="setting-item setting-item-block">
                            <div class="setting-info">
                                <span class="setting-label">Replacement Phrases</span>
                                <span class="setting-description">One pair per line: transcribed|replacement</span>
                            </div>
                            <textarea id="replacement-phrases" class="setting-textarea" rows="4" placeholder="gonna|going to">${replacementPhrases}</textarea>
                        </div>
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
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Version</span>
                            <span class="setting-description" id="settings-version">Loading...</span>
                        </div>
                    </div>
                    <div class="setting-item action-item">
                        <div class="setting-info">
                            <span class="setting-label">Troubleshooting</span>
                            <span class="setting-description">Force reload to clear cache and update</span>
                        </div>
                        <button id="btn-force-reload" class="action-btn">Reload App</button>
                    </div>
                </div>

                <div class="about-text">
                    <p>Pelsall Songs and Sermons v3.0</p>
                    <p>&copy; 2025 Pelsall Evangelical Church</p>
                </div>

                <!-- Deepgram Help Modal -->
                <div id="deepgram-help-modal" class="modal hidden">
                    <div class="modal-content help-modal-content">
                        <h3><i class="fas fa-key"></i> Getting a Deepgram API Key</h3>
                        <div class="help-steps">
                            <div class="help-step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <strong>Sign Up</strong>
                                    <p>Visit <a href="https://console.deepgram.com/signup" target="_blank">console.deepgram.com/signup</a> and create a free account.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <strong>Verify Email</strong>
                                    <p>Check your inbox for a verification email from Deepgram and click the link.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <strong>Log In</strong>
                                    <p>Return to <a href="https://console.deepgram.com" target="_blank">console.deepgram.com</a> and log in.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <strong>Create API Key</strong>
                                    <p>Go to <strong>Settings → API Keys</strong>, then click <strong>"Create a New API Key"</strong>.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">5</div>
                                <div class="step-content">
                                    <strong>Copy & Paste</strong>
                                    <p>Copy your new key and paste it into the API Key field in this app. <em>Save it somewhere safe!</em></p>
                                </div>
                            </div>
                        </div>
                        <p class="help-note"><i class="fas fa-info-circle"></i> Deepgram offers free credits to get started.</p>
                        <button class="btn-primary full-width-btn" id="close-deepgram-help">Got It</button>
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

        // Transcription Toggles
        const transcriptionToggle = document.getElementById('toggle-transcription');
        const transcriptionSettings = document.getElementById('transcription-settings');
        const apiKeyInput = document.getElementById('deepgram-api-key');
        const keywordsInput = document.getElementById('deepgram-keywords');

        if (transcriptionToggle) {
            transcriptionToggle.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('transcription_enabled', isEnabled);
                if (transcriptionSettings) {
                    if (isEnabled) transcriptionSettings.classList.remove('hidden');
                    else transcriptionSettings.classList.add('hidden');
                }
            });
        }

        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                localStorage.setItem('deepgram_api_key', e.target.value.trim());
            });
        }

        if (keywordsInput) {
            keywordsInput.addEventListener('change', (e) => {
                localStorage.setItem('deepgram_keywords', e.target.value.trim());
            });
        }

        // Replacement Phrases
        const replacementInput = document.getElementById('replacement-phrases');
        if (replacementInput) {
            replacementInput.addEventListener('change', (e) => {
                localStorage.setItem('replacement_phrases', e.target.value);
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

        // Force Reload button
        const btnReload = document.getElementById('btn-force-reload');
        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                if (confirm('This will clear the app cache and reload. Your playlists will be preserved. Proceed?')) {
                    await window.app.forceReload();
                }
            });
        }

        // Deepgram Help Modal
        const helpBtn = document.getElementById('btn-deepgram-help');
        const helpModal = document.getElementById('deepgram-help-modal');
        const closeHelpBtn = document.getElementById('close-deepgram-help');

        if (helpBtn && helpModal) {
            helpBtn.addEventListener('click', () => {
                helpModal.classList.remove('hidden');
            });
        }

        if (closeHelpBtn && helpModal) {
            closeHelpBtn.addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });
        }

        // Close help modal on background click
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.classList.add('hidden');
                }
            });
        }
    }
};
