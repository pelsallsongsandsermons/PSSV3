import { DEEPGRAM_HELP, OPENAI_HELP } from '../data/help-text.js';

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

                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">AI Text Enhancement</span>
                                <span class="setting-description">Use OpenAI to reformat transcript (paragraphs, headings)</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggle-ai-enhance" ${aiEnhanceEnabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div id="ai-prompt-container" class="setting-item setting-item-block ${aiEnhanceEnabled ? '' : 'hidden'}">
                            
                            <div class="setting-item setting-item-block" style="margin-bottom: 20px;">
                                <div class="setting-info">
                                    <span class="setting-label">
                                        OpenAI API Key
                                        <button class="icon-btn help-btn" id="btn-openai-help" aria-label="Help"><i class="fas fa-question-circle"></i></button>
                                    </span>
                                    <span class="setting-description">Required for enhancement. Billed directly to you.</span>
                                </div>
                                <input type="password" id="openai-api-key" class="setting-input" value="${openaiApiKey}" placeholder="sk-...">
                            </div>

                            <div class="setting-info">
                                <span class="setting-label">AI Enhancement Prompt</span>
                                <span class="setting-description">Customise how the AI reformats the transcript</span>
                            </div>
                            <textarea id="ai-enhance-prompt" class="setting-textarea" rows="10" placeholder="Enter AI instructions...">${aiEnhancePrompt}</textarea>
                            <button id="reset-ai-prompt" class="btn-secondary" style="margin-top: 10px; font-size: 0.8rem; padding: 5px 10px;">Reset to Default</button>
                            
                            <div class="divider-line" style="margin: 20px 0;"></div>

                            <div class="setting-info">
                                <span class="setting-label">AI Model</span>
                                <span class="setting-description">Select the OpenAI model</span>
                            </div>
                            <select id="ai-enhance-model" class="setting-input" style="margin-bottom: 10px;">
                                <option value="gpt-5.1">GPT-5.1 (Default)</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast/Cheap)</option>
                                <option value="custom">Custom Model...</option>
                            </select>
                            <input type="text" id="ai-custom-model" class="setting-input hidden" placeholder="Enter custom model string (e.g. gpt-4o-2024-05-13)" style="margin-top: 5px;">
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
                        ${DEEPGRAM_HELP}
                        <button class="btn-primary full-width-btn" style="margin-top: 10px;" id="close-deepgram-help">Got It</button>
                    </div>
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

        // Transcription Engine
        const engineSelect = document.getElementById('transcription-engine');
        const deepgramGroup = document.getElementById('deepgram-settings-group');
        if (engineSelect) {
            engineSelect.addEventListener('change', (e) => {
                const engine = e.target.value;
                localStorage.setItem('transcription_engine', engine);

                if (deepgramGroup) {
                    if (engine === 'deepgram') deepgramGroup.classList.remove('hidden');
                    else deepgramGroup.classList.add('hidden');
                }

                const puterWarning = document.getElementById('puter-warning');
                if (puterWarning) {
                    if (engine === 'puter') puterWarning.classList.remove('hidden');
                    else puterWarning.classList.add('hidden');
                }
            });
        }

        // Replacement Phrases
        const replacementInput = document.getElementById('replacement-phrases');
        if (replacementInput) {
            replacementInput.addEventListener('change', (e) => {
                localStorage.setItem('replacement_phrases', e.target.value);
            });
        }

        // AI Enhancement Toggle
        const aiEnhanceToggle = document.getElementById('toggle-ai-enhance');
        const aiPromptContainer = document.getElementById('ai-prompt-container');
        const aiPromptTextarea = document.getElementById('ai-enhance-prompt');
        const resetPromptBtn = document.getElementById('reset-ai-prompt');

        if (aiEnhanceToggle) {
            aiEnhanceToggle.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('ai_enhance_enabled', isEnabled);

                if (aiPromptContainer) {
                    if (isEnabled) aiPromptContainer.classList.remove('hidden');
                    else aiPromptContainer.classList.add('hidden');
                }
            });
        }

        if (aiPromptTextarea) {
            aiPromptTextarea.addEventListener('change', (e) => {
                localStorage.setItem('ai_enhance_prompt', e.target.value);
            });
        }

        if (resetPromptBtn && aiPromptTextarea) {
            resetPromptBtn.addEventListener('click', () => {
                const defaultPrompt = `You are a transcript formatter. Your ONLY task is to add markdown headings and paragraph breaks to the following sermon transcript.

CRITICAL RULES:
1. Keep 100% of the original spoken words in their exact order, EXCEPT you should remove obvious stuttering or immediately repeated duplicate words (e.g. "the the").
2. Identify when the speaker is quoting Bible text or a quote from someone else, and format these clearly (e.g. using blockquotes or italics).
3. Change obvious number words to numerical digits (e.g. "forty-two" to "42", "one hundred" to "100").
4. DO NOT summarize or rewrite the content.
5. DO NOT fix general grammar - leave the speaker's natural voice intact.
6. ONLY add:
   - ## Heading titles where major topic changes occur.
   - Blank lines between paragraphs for readability.
   - Specific formatting for quotes and Bible verses.

Here is the transcript to format:`;
                aiPromptTextarea.value = defaultPrompt;
                localStorage.setItem('ai_enhance_prompt', defaultPrompt);
                alert('Prompt reset to default.');
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

        // AI Model Selection Logic
        const aiModelSelect = document.getElementById('ai-enhance-model');
        const aiCustomModelInput = document.getElementById('ai-custom-model');

        if (aiModelSelect && aiCustomModelInput) {
            // Load saved settings
            const savedModel = localStorage.getItem('ai_enhance_model') || 'gpt-4o-mini';
            const savedCustomModelString = localStorage.getItem('ai_custom_model_string') || '';

            // Set initial state
            aiModelSelect.value = savedModel;
            aiCustomModelInput.value = savedCustomModelString;

            if (savedModel === 'custom') {
                aiCustomModelInput.classList.remove('hidden');
            }

            // Model Selection Change Listener
            aiModelSelect.addEventListener('change', (e) => {
                const selectedModel = e.target.value;
                localStorage.setItem('ai_enhance_model', selectedModel);

                if (selectedModel === 'custom') {
                    aiCustomModelInput.classList.remove('hidden');
                    aiCustomModelInput.focus();
                } else {
                    aiCustomModelInput.classList.add('hidden');
                }
            });

            // Custom Model String Input Listener
            aiCustomModelInput.addEventListener('change', (e) => {
                localStorage.setItem('ai_custom_model_string', e.target.value.trim());
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
