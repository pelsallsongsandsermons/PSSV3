/**
 * Sermon Player View
 * Custom in-app audio player for sermons
 */
import { PodbeanService } from '../services/podbean-service.js';
import { TranscriptionService } from '../services/transcription-service.js';

let podbeanService = null;
let transcriptionService = null;

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
                            <button id="btn-delete-transcript" class="icon-btn delete-btn" title="Delete Transcription">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <div class="transcript-scroll-box">
                            <div id="transcript-text"></div>
                        </div>
                        <div class="download-group">
                            <button class="download-btn" data-format="txt"><i class="fas fa-file-alt"></i> .txt</button>
                            <button class="download-btn" data-format="docx"><i class="fas fa-file-word"></i> .docx</button>
                            <button class="download-btn" data-format="pdf"><i class="fas fa-file-pdf"></i> .pdf</button>
                        </div>
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
                        transcriptText.textContent = cachedTranscript;
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
                        const transcript = await transcriptionService.transcribeAudio(episode.mp3Url, apiKey, keywords);

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
                    const text = transcriptText.textContent;
                    const currentTitle = viewEl.dataset.title || 'Sermon';
                    const filename = currentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    transcriptionService.downloadTranscript(text, filename, format);
                });
            });
        }
    }
};
