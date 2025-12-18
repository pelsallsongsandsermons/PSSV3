// js/views/find-sermons-view.js
import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();
        const speakers = await dataService.getSpeakers();

        const speakerOptions = speakers.map(s =>
            `<option value="${s.speaker}">${s.speaker}</option>`
        ).join('');

        return `
            <div class="view find-sermons-view" data-page-title="Find Sermons">
                <div class="content-wrapper">
                    <div class="search-form">
                        <!-- Title Search -->
                        <div class="search-row">
                            <div class="search-input-wrapper">
                                <input type="text" id="title-search" placeholder="Enter title or part of title">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                            <button id="clear-title" class="clear-btn">Clear</button>
                        </div>

                        <!-- Book Ref Search -->
                        <div class="search-row">
                            <div class="search-input-wrapper">
                                <input type="text" id="bookref-search" placeholder="Book ref">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                            <button id="clear-bookref" class="clear-btn">Clear</button>
                        </div>

                        <!-- Speaker Dropdown -->
                        <div class="search-row">
                            <div class="search-input-wrapper">
                                <select id="speaker-select">
                                    <option value="">Speaker</option>
                                    ${speakerOptions}
                                </select>
                                <i class="fas fa-chevron-down search-icon"></i>
                            </div>
                            <button id="clear-speaker" class="clear-btn">Clear</button>
                        </div>

                        <!-- Action Buttons -->
                        <div class="search-actions">
                            <button id="clear-all-btn" class="search-action-btn secondary">Clear All</button>
                        </div>
                    </div>

                    <!-- Results -->
                    <div id="search-results" class="sermon-results"></div>
                </div>
            </div>
        `;
    },
    afterRender: async () => {
        const dataService = new DataService();

        const titleInput = document.getElementById('title-search');
        const bookrefInput = document.getElementById('bookref-search');
        const speakerSelect = document.getElementById('speaker-select');
        const resultsContainer = document.getElementById('search-results');

        const clearTitleBtn = document.getElementById('clear-title');
        const clearBookrefBtn = document.getElementById('clear-bookref');
        const clearSpeakerBtn = document.getElementById('clear-speaker');
        const clearAllBtn = document.getElementById('clear-all-btn');

        // Update Header Title
        const headerTitle = document.querySelector('#main-header h1');
        if (headerTitle) headerTitle.textContent = 'Find Sermons';

        // Fetch all sermons once for client-side filtering
        let allSermons = await dataService.getAllSermons();

        const renderResults = (sermons) => {
            if (sermons.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No sermons found</div>';
                return;
            }

            resultsContainer.innerHTML = sermons.map(sermon => `
                <div class="sermon-result-card" 
                     data-url="${sermon.permalink_url || ''}"
                     data-title="${sermon.title}"
                     data-speaker="${sermon.speaker || ''}">
                    <div class="sermon-result-info">
                        <h3>${sermon.title}</h3>
                        <p>${sermon.speaker || 'Unknown'} • ${sermon.full_ref || ''}</p>
                        <p class="sermon-date">${sermon.date || ''}</p>
                    </div>
                    <i class="fas fa-play-circle sermon-play-icon"></i>
                </div>
            `).join('');

            // Add click handlers
            resultsContainer.querySelectorAll('.sermon-result-card').forEach(card => {
                card.addEventListener('click', () => {
                    const slug = card.dataset.url;
                    const title = card.dataset.title;
                    const speaker = card.dataset.speaker;

                    if (!slug) {
                        alert('No audio URL for this sermon');
                        return;
                    }

                    // Check if custom player is enabled
                    const useCustomPlayer = localStorage.getItem('use_custom_player') !== 'false';

                    if (useCustomPlayer) {
                        // Navigate to custom sermon player
                        window.location.hash = `#sermon-player?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&speaker=${encodeURIComponent(speaker)}`;
                    } else {
                        // Open Podbean externally
                        const podbeanUrl = `https://pecharchive.podbean.com/e/${slug}`;
                        window.open(podbeanUrl, '_blank');
                    }
                });
            });
        };

        const filterSermons = () => {
            const title = titleInput.value.toLowerCase().trim();
            const bookRef = bookrefInput.value.toLowerCase().trim();
            const speaker = speakerSelect.value;

            let filtered = allSermons;

            if (title) {
                filtered = filtered.filter(s =>
                    s.title && s.title.toLowerCase().includes(title)
                );
            }
            if (bookRef) {
                filtered = filtered.filter(s =>
                    s.full_ref && s.full_ref.toLowerCase().includes(bookRef)
                );
            }
            if (speaker) {
                filtered = filtered.filter(s => s.speaker === speaker);
            }

            renderResults(filtered);
        };

        // Live filtering as user types
        titleInput.addEventListener('input', filterSermons);
        bookrefInput.addEventListener('input', filterSermons);
        speakerSelect.addEventListener('change', filterSermons);


        // Clear buttons
        clearTitleBtn.addEventListener('click', () => {
            titleInput.value = '';
            filterSermons();
        });

        clearBookrefBtn.addEventListener('click', () => {
            bookrefInput.value = '';
            filterSermons();
        });

        clearSpeakerBtn.addEventListener('click', () => {
            speakerSelect.value = '';
            filterSermons();
        });

        clearAllBtn.addEventListener('click', () => {
            titleInput.value = '';
            bookrefInput.value = '';
            speakerSelect.value = '';
            resultsContainer.innerHTML = '';
        });
    }
}
