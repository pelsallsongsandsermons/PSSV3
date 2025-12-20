/**
 * Sermon Player View
 * Custom in-app audio player for sermons
 */
import { PodbeanService } from '../services/podbean-service.js';
import { TranscriptionService } from '../services/transcription-service.js';

let podbeanService = null;
let transcriptionService = null;

// Default replacements (always applied)
const DEFAULT_REPLACEMENTS = [
    ['gonna', 'going to'],
    ['wanna', 'want to']
];

/**
 * Apply replacement phrases to transcribed text
 * @param {string} text - The transcribed text
 * @returns {string} - Text with replacements applied
 */
function applyReplacements(text) {
    let result = text;

    // Get user-defined replacements from localStorage
    const userReplacements = localStorage.getItem('replacement_phrases') || '';
    const pairs = userReplacements.split('\n').filter(line => line.includes('|'));

    // Combine defaults with user replacements
    const allReplacements = [...DEFAULT_REPLACEMENTS];
    for (const pair of pairs) {
        const [from, to] = pair.split('|').map(s => s.trim());
        if (from && to) {
            allReplacements.push([from, to]);
        }
    }

    // Apply all replacements (case-insensitive)
    for (const [from, to] of allReplacements) {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        result = result.replace(regex, to);
    }

    return result;
}

export default {
    render: async (params) => {
        const slug = params.get('slug') || '';
        const title = params.get('title') || 'Sermon';
        const speaker = params.get('speaker') || '';

        if (!slug) {
            return `
                <div class="view sermon-player-view">
                    <div class="error-msg">No sermon specified</div>
                </div>
            `;
        }

        // Show loading state initially
        return `
            <div class="view sermon-player-view" data-slug="${slug}" data-title="${title}">
                <div class="sermon-player-header">
                    <h2 class="sermon-title">${title}</h2>
                    <p class="sermon-speaker">${speaker}</p>
                </div>
                
                <div class="sermon-player-content">
                    <div class="audio-player-container">
                        <div class="loading-spinner">Loading audio...</div>
                    </div>
                    
                    <div id="transcribe-action-container" class="transcribe-container hidden">
                        <button id="btn-transcribe" class="btn-primary">
                            <i class="fas fa-file-alt"></i> Transcribe Sermon
                        </button>
                    </div>

                    <div class="sermon-description-container">
                        <h3>Description</h3>
                        <div id="sermon-description" class="sermon-description">
                            <div class="loading-spinner">Loading...</div>
                        </div>
                    </div>
                </div>

                <!-- Transcription Result Modal -->
                <div id="transcription-modal" class="modal hidden">
                    <div class="modal-content transcription-modal-content">
                        <div class="modal-header-row">
                            <h3>Sermon Transcription</h3>
                            <div class="header-action-btns">
                                <button id="btn-copy-transcript" class="icon-btn" title="Copy to Clipboard">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button id="btn-delete-transcript" class="icon-btn delete-btn" title="Delete Transcription">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="transcript-scroll-box">
                            <div id="transcript-text"></div>
                        </div>
                        <div class="download-group">
                            <button class="download-btn" data-format="txt"><i class="fas fa-file-alt"></i> .txt</button>
                            <button class="download-btn" data-format="docx"><i class="fas fa-file-word"></i> .docx</button>
                            <button class="download-btn" data-format="pdf"><i class="fas fa-file-pdf"></i> .pdf</button>
                        </div>
                        <button id="btn-enhance-transcript" class="btn-primary full-width-btn hidden"><i class="fas fa-magic"></i> Enhance Readability</button>
                        <button class="btn-secondary full-width-btn" id="close-transcription">Close</button>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender: async () => {
        const viewEl = document.querySelector('.sermon-player-view');
        if (!viewEl) return;

        const slug = viewEl.dataset.slug;
        if (!slug) return;

        // Initialize service
        if (!podbeanService) {
            podbeanService = new PodbeanService();
        }

        // Fetch episode data
        const episode = await podbeanService.getEpisodeBySlug(slug);

        const audioContainer = viewEl.querySelector('.audio-player-container');
        const descriptionEl = document.getElementById('sermon-description');

        if (episode && episode.mp3Url) {
            // Create audio player (autoplay removed)
            audioContainer.innerHTML = `
                <div class="audio-controls">
                    <audio id="sermon-audio" controls>
                        <source src="${episode.mp3Url}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;

            // Update description
            if (descriptionEl) {
                // Parse HTML description and extract text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = episode.description;
                descriptionEl.innerHTML = episode.description || '<p>No description available</p>';
            }
        } else {
            // Fallback - episode not found in RSS
            // The slug might be a full URL or just the episode slug
            // Try constructing a clean Podbean URL
            let podbeanUrl = `https://pecharchive.podbean.com/e/${slug}`;
            // Remove any double slashes (except after https:)
            podbeanUrl = podbeanUrl.replace(/([^:])\/\//g, '$1/');

            audioContainer.innerHTML = `
                <div class="error-msg">
                    <p>Audio not available in custom player.</p>
                    <a href="${podbeanUrl}" target="_blank" class="fallback-link">
                        <i class="fas fa-external-link-alt"></i> Open on Podbean
                    </a>
                </div>
            `;

            if (descriptionEl) {
                descriptionEl.innerHTML = '<p>Description not available</p>';
            }
        }

        // Update header title
        const headerTitle = document.querySelector('#main-header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Sermon Player';
        }

        // Transcription Logic
        const transcriptionEnabled = localStorage.getItem('transcription_enabled') === 'true';
        if (transcriptionEnabled) {
            const transcribeBtnContainer = document.getElementById('transcribe-action-container');
            if (transcribeBtnContainer) transcribeBtnContainer.classList.remove('hidden');

            const transcribeBtn = document.getElementById('btn-transcribe');
            const transcriptionModal = document.getElementById('transcription-modal');
            const transcriptText = document.getElementById('transcript-text');
            const closeTranscription = document.getElementById('close-transcription');
            const deleteBtn = document.getElementById('btn-delete-transcript');

            if (!transcriptionService) transcriptionService = new TranscriptionService();

            // Check for cached transcription
            let cachedTranscript = null;
            try {
                cachedTranscript = await transcriptionService.getTranscript(slug);
            } catch (e) {
                console.warn('IndexedDB error:', e);
            }

            if (cachedTranscript) {
                transcribeBtn.innerHTML = '<i class="fas fa-file-alt"></i> Show Transcription';
                transcribeBtn.dataset.cached = 'true';
            }

            if (transcribeBtn) {
                transcribeBtn.addEventListener('click', async () => {
                    // If cached, just show it
                    if (transcribeBtn.dataset.cached === 'true') {
                        // Check if cached content contains markdown headings
                        const hasMarkdown = cachedTranscript.includes('## ') || cachedTranscript.includes('# ');

                        if (hasMarkdown && typeof marked !== 'undefined') {
                            transcriptText.innerHTML = marked.parse(cachedTranscript);
                            transcriptText.dataset.enhanced = 'true';
                            transcriptText.dataset.markdown = cachedTranscript;
                        } else {
                            transcriptText.textContent = cachedTranscript;
                            transcriptText.dataset.enhanced = 'false';
                        }

                        // Hide enhance button if already enhanced
                        if (enhanceBtn && aiEnhanceEnabled) {
                            if (transcriptText.dataset.enhanced === 'true') enhanceBtn.classList.add('hidden');
                            else enhanceBtn.classList.remove('hidden');
                        }

                        transcriptionModal.classList.remove('hidden');
                        return;
                    }

                    const apiKey = localStorage.getItem('deepgram_api_key');
                    const keywords = localStorage.getItem('deepgram_keywords');

                    if (!apiKey) {
                        alert('Deepgram API Key is missing. Please add it in Settings.');
                        return;
                    }

                    if (!episode || !episode.mp3Url) {
                        alert('Sermon audio URL not found.');
                        return;
                    }

                    transcribeBtn.disabled = true;
                    transcribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transcribing...';

                    try {
                        const aiEnhanceEnabled = localStorage.getItem('ai_enhance_enabled') === 'true';
                        let transcript = await transcriptionService.transcribeAudio(episode.mp3Url, apiKey, keywords, !aiEnhanceEnabled);

                        // Apply replacement phrases
                        transcript = applyReplacements(transcript);

                        // Save to IndexedDB
                        await transcriptionService.saveTranscript(slug, transcript);
                        cachedTranscript = transcript;

                        transcriptText.textContent = transcript;
                        transcriptionModal.classList.remove('hidden');

                        // Update button for next time
                        transcribeBtn.innerHTML = '<i class="fas fa-file-alt"></i> Show Transcription';
                        transcribeBtn.dataset.cached = 'true';
                    } catch (err) {
                        console.error('Transcription error:', err);
                        alert(`Transcription failed: ${err.message}`);
                        transcribeBtn.innerHTML = '<i class="fas fa-file-alt"></i> Transcribe Sermon';
                    } finally {
                        transcribeBtn.disabled = false;
                    }
                });
            }

            // Delete Button
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Delete this saved transcription?')) {
                        try {
                            await transcriptionService.deleteTranscript(slug);
                            cachedTranscript = null;
                            transcribeBtn.innerHTML = '<i class="fas fa-file-alt"></i> Transcribe Sermon';
                            transcribeBtn.dataset.cached = 'false';
                            transcriptionModal.classList.add('hidden');
                        } catch (err) {
                            console.error('Delete error:', err);
                            alert('Failed to delete transcription.');
                        }
                    }
                });
            }

            if (closeTranscription) {
                closeTranscription.addEventListener('click', () => {
                    transcriptionModal.classList.add('hidden');
                });
            }

            // Download Buttons
            document.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const format = btn.dataset.format;
                    const isEnhanced = transcriptText.dataset.enhanced === 'true';
                    const markdown = transcriptText.dataset.markdown || '';
                    const plainText = transcriptText.textContent || transcriptText.innerText;
                    const currentTitle = viewEl.dataset.title || 'Sermon';
                    const filename = currentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

                    // Pass markdown for enhanced content, otherwise plain text
                    transcriptionService.downloadTranscript(
                        isEnhanced ? markdown : plainText,
                        filename,
                        format,
                        isEnhanced
                    );
                });
            });

            // Copy to Clipboard Button
            const copyBtn = document.getElementById('btn-copy-transcript');
            if (copyBtn) {
                copyBtn.addEventListener('click', async () => {
                    const text = transcriptText.textContent;
                    try {
                        await navigator.clipboard.writeText(text);
                        const originalHtml = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied to clipboard';
                        copyBtn.disabled = true;
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHtml;
                            copyBtn.disabled = false;
                        }, 2000);
                    } catch (err) {
                        console.error('Copy failed:', err);
                        alert('Failed to copy to clipboard.');
                    }
                });
            }

            // AI Enhancement Button (Puter.js)
            const enhanceBtn = document.getElementById('btn-enhance-transcript');
            const aiEnhanceEnabled = localStorage.getItem('ai_enhance_enabled') === 'true';

            if (enhanceBtn && aiEnhanceEnabled) {
                enhanceBtn.classList.remove('hidden');

                enhanceBtn.addEventListener('click', async () => {
                    // Strip existing paragraph formatting to send as one block
                    const rawText = transcriptText.textContent || transcriptText.innerText;
                    const singleBlockText = rawText.replace(/\n\n/g, ' ').replace(/\n/g, ' ').trim();

                    if (!singleBlockText || singleBlockText === '') {
                        alert('No transcript text to enhance.');
                        return;
                    }

                    // Check if Puter is available
                    if (typeof puter === 'undefined') {
                        alert('Puter AI is not available. Please reload the app.');
                        return;
                    }

                    enhanceBtn.disabled = true;
                    enhanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enhancing...';

                    try {
                        const userPrompt = localStorage.getItem('ai_enhance_prompt') || `You are a transcript formatter. Your ONLY task is to add markdown headings and paragraph breaks to the following sermon transcript.

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

                        const fullPrompt = `${userPrompt}\n\n${singleBlockText}`;

                        const response = await puter.ai.chat(fullPrompt, {
                            model: 'gpt-4o-mini',
                            temperature: 0.3
                        });

                        if (response && response.message && response.message.content) {
                            const markdownText = response.message.content;

                            // Store the markdown version
                            await transcriptionService.saveTranscript(slug, markdownText);
                            cachedTranscript = markdownText;

                            // Render markdown as HTML for display
                            if (typeof marked !== 'undefined') {
                                transcriptText.innerHTML = marked.parse(markdownText);
                            } else {
                                transcriptText.textContent = markdownText;
                            }

                            // Mark as enhanced for download handling
                            transcriptText.dataset.enhanced = 'true';
                            transcriptText.dataset.markdown = markdownText;

                            enhanceBtn.innerHTML = '<i class="fas fa-check"></i> Enhanced!';
                            // 4. Hide enhance button since it's now enhanced
                            enhanceBtn.classList.add('hidden');
                        } else {
                            throw new Error('No response from AI');
                        }
                    } catch (err) {
                        console.error('AI Enhancement failed:', err);
                        alert('Enhancement failed. Please try again or sign in to Puter.');
                        enhanceBtn.innerHTML = '<i class="fas fa-magic"></i> Enhance Readability';
                        enhanceBtn.disabled = false;
                    }
                });
            }
        }
    }
};
