/**
 * Sermon Player View
 * Custom in-app audio player for sermons
 */
import { PodbeanService } from '../services/podbean-service.js';

let podbeanService = null;

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
            <div class="view sermon-player-view" data-slug="${slug}">
                <div class="sermon-player-header">
                    <h2 class="sermon-title">${title}</h2>
                    <p class="sermon-speaker">${speaker}</p>
                </div>
                
                <div class="sermon-player-content">
                    <div class="audio-player-container">
                        <div class="loading-spinner">Loading audio...</div>
                    </div>
                    
                    <div class="sermon-description-container">
                        <h3>Description</h3>
                        <div id="sermon-description" class="sermon-description">
                            <div class="loading-spinner">Loading...</div>
                        </div>
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
            // Create audio player
            audioContainer.innerHTML = `
                <div class="audio-controls">
                    <audio id="sermon-audio" controls autoplay>
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
            audioContainer.innerHTML = `
                <div class="error-msg">
                    <p>Audio not available in custom player.</p>
                    <a href="https://pecharchive.podbean.com/e/${slug}/" target="_blank" class="fallback-link">
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
    }
};
