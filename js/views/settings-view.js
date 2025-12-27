import { OPENAI_HELP } from '../data/help-text.js';

export default {
    render: async () => {
        // Load current settings from localStorage
        const useCustomPlayer = localStorage.getItem('use_custom_player') !== 'false'; // Default true
        const keepScreenOn = localStorage.getItem('keep_screen_on') !== 'false'; // Default true
        const transcriptionEnabled = localStorage.getItem('transcription_enabled') === 'true';
        const aiEnhanceEnabled = localStorage.getItem('ai_enhance_enabled') === 'true';
        const defaultPrompt = `You are a transcript formatter. Your ONLY task is to add markdown headings and paragraph breaks to the following sermon transcript.

CRITICAL RULES:
1. Keep 100% of the original spoken words in their exact order, EXCEPT you should remove obvious stuttering or immediately repeated duplicate words (e.g. \"the the\").
2. Identify when the speaker is quoting Bible text or a quote from someone else, and format these clearly (e.g. using blockquotes or italics).
3. Change obvious number words to numerical digits (e.g. "forty-two" to "42", "one hundred" to "100").
4. DO NOT summarize or rewrite the content.
5. DO NOT fix general grammar - leave the speaker's natural voice intact.
6. ONLY add:
   - ## Heading titles where major topic changes occur.
   - Blank lines between paragraphs for readability.
   - Specific formatting for quotes and Bible verses.

Here is the transcript to format:`;

        const aiEnhancePrompt = localStorage.getItem('ai_enhance_prompt') || defaultPrompt;
        const deepgramApiKey = localStorage.getItem('deepgram_api_key') || '';
        const deepgramKeywords = localStorage.getItem('deepgram_keywords') || 'Scripture, ministry, sermon, gospel';
        const replacementPhrases = localStorage.getItem('replacement_phrases') || 'gonna|going to\nwanna|want to';

        // OpenAI Settings
        const openaiApiKey = localStorage.getItem('openai_api_key') || '';

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
                            <span class="setting-description">Transcribe sermons to text</span>
                        </div>
                        <div class="setting-actions">
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggle-transcription" ${transcriptionEnabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Transcription Settings Container -->
                    <div id="transcription-settings" class="${transcriptionEnabled ? '' : 'hidden'}">
                        
                        <!-- MISSING KEYS PROMPT -->
                        <div id="missing-keys-container" class="setting-item setting-item-block hidden" style="background-color: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); padding: 15px; border-radius: 8px;">
                            <div class="setting-info">
                                <span class="setting-label" style="color: var(--text-color);">Request Transcription Keys</span>
                                <span class="setting-description">To use transcription, you need access keys. Request them from the administrator.</span>
                            </div>
                            <label for="request-keys-email" style="display: block; margin-top: 10px; font-size: 0.9em; color: var(--text-color);">Enter your email address</label>
                            <input type="email" id="request-keys-email" class="setting-input" placeholder="Your Email Address" style="margin-top: 5px;">
                            <button id="btn-request-keys" class="btn-primary full-width-btn" style="margin-top: 10px;">Request Keys</button>
                            <div id="request-keys-feedback" style="margin-top: 10px; font-size: 0.9em;"></div>
                        </div>

                        <!-- KEYS INPUTS -->
                        <div id="keys-inputs-container">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <span class="setting-label">Transcription Key</span>
                                    <span class="setting-description">Basic transcription returning paragraphs of text</span>
                                </div>
                                <input type="password" id="deepgram-api-key" class="setting-input" value="${deepgramApiKey}" placeholder="Enter Key...">
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <span class="setting-label">Enhanced readability Key</span>
                                    <span class="setting-description">Formats text with headings and identifies scripture/quotes</span>
                                </div>
                                <input type="password" id="openai-api-key" class="setting-input" value="${openaiApiKey}" placeholder="sk-...">
                            </div>
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



                <!-- OpenAI Help Modal -->
                <div id="openai-help-modal" class="modal hidden">
                    <div class="modal-content help-modal-content">
                        ${OPENAI_HELP}
                        <button class="btn-primary full-width-btn" style="margin-top: 10px;" id="close-openai-help">Got It</button>
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

        // Toggle handler for Custom Player
        const toggle = document.getElementById('toggle-custom-player');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                localStorage.setItem('use_custom_player', e.target.checked);
            });
        }

        const screenToggle = document.getElementById('toggle-keep-screen-on');
        if (screenToggle) {
            screenToggle.addEventListener('change', (e) => {
                localStorage.setItem('keep_screen_on', e.target.checked);
            });
        }

        // Transcription UI Logic
        const transcriptionToggle = document.getElementById('toggle-transcription');
        const transcriptionSettings = document.getElementById('transcription-settings');
        const apiKeyInput = document.getElementById('deepgram-api-key');
        const openaiKeyInput = document.getElementById('openai-api-key');

        // Request Keys Logic
        const missingKeysContainer = document.getElementById('missing-keys-container');
        const requestKeysEmail = document.getElementById('request-keys-email');
        const requestKeysBtn = document.getElementById('btn-request-keys');
        const requestKeysFeedback = document.getElementById('request-keys-feedback');

        // Function to check visibility of "Request Keys"
        const updateRequestKeysVisibility = () => {
            const key = localStorage.getItem('deepgram_api_key');
            // If enabled, and key is missing/empty, show request UI
            const isEnabled = transcriptionToggle ? transcriptionToggle.checked : false;

            if (isEnabled && (!key || key.trim() === '')) {
                if (missingKeysContainer) missingKeysContainer.classList.remove('hidden');
            } else {
                if (missingKeysContainer) missingKeysContainer.classList.add('hidden');
            }
        };

        if (transcriptionToggle) {
            transcriptionToggle.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('transcription_enabled', isEnabled);
                if (transcriptionSettings) {
                    if (isEnabled) transcriptionSettings.classList.remove('hidden');
                    else transcriptionSettings.classList.add('hidden');
                }
                updateRequestKeysVisibility();
            });
        }

        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', (e) => {
                localStorage.setItem('deepgram_api_key', e.target.value.trim());
                updateRequestKeysVisibility();
            });
            // Also update on change to be safe
            apiKeyInput.addEventListener('change', updateRequestKeysVisibility);
        }

        if (openaiKeyInput) {
            openaiKeyInput.addEventListener('input', (e) => {
                localStorage.setItem('openai_api_key', e.target.value.trim());
            });
        }

        // Initial check
        updateRequestKeysVisibility();


        // Handle "Request Keys" Click
        if (requestKeysBtn) {
            requestKeysBtn.addEventListener('click', async () => {
                const email = requestKeysEmail.value.trim();
                if (!email) {
                    alert('Please enter your email address.');
                    return;
                }

                requestKeysBtn.disabled = true;
                requestKeysBtn.textContent = 'Sending...';
                requestKeysFeedback.textContent = '';
                requestKeysFeedback.className = '';

                try {
                    const { data, error } = await window.app.supabase.client.functions.invoke('send-keys-request', {
                        body: { userEmail: email }
                    });

                    if (error) throw error;

                    requestKeysFeedback.textContent = 'Request sent successfully! The administrator will contact you.';
                    requestKeysFeedback.style.color = 'green';
                    requestKeysBtn.textContent = 'Sent!';
                } catch (err) {
                    console.error('Failed to request keys:', err);
                    requestKeysFeedback.textContent = 'Failed to send request. ' + (err.message || 'Unknown error');
                    requestKeysFeedback.style.color = 'red';
                    requestKeysBtn.textContent = 'Request Keys';
                    requestKeysBtn.disabled = false;
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



        // OpenAI Help Modal
        const openaiHelpBtn = document.getElementById('btn-openai-help');
        const openaiHelpModal = document.getElementById('openai-help-modal');
        const closeOpenaiHelpBtn = document.getElementById('close-openai-help');

        if (openaiHelpBtn && openaiHelpModal) {
            openaiHelpBtn.addEventListener('click', () => {
                openaiHelpModal.classList.remove('hidden');
            });
        }

        if (closeOpenaiHelpBtn && openaiHelpModal) {
            closeOpenaiHelpBtn.addEventListener('click', () => {
                openaiHelpModal.classList.add('hidden');
            });
        }

        if (openaiHelpModal) {
            openaiHelpModal.addEventListener('click', (e) => {
                if (e.target === openaiHelpModal) {
                    openaiHelpModal.classList.add('hidden');
                }
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
