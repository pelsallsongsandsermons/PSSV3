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
                            <button id="search-dates-btn" class="search-action-btn primary">Search Dates</button>
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

        // Date Search Elements
        const searchDatesBtn = document.getElementById('search-dates-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const dateModal = document.getElementById('date-search-modal');
        const fromDateInput = document.getElementById('from-date');
        const toDateInput = document.getElementById('to-date');
        const applyDateBtn = document.getElementById('apply-date-search');
        const last3MonthsBtn = document.getElementById('last-3-months-btn');
        const jumpYearSelect = document.getElementById('jump-year');
        const jumpMonthSelect = document.getElementById('jump-month');

        let startDate = null;
        let endDate = null;

        // Update Header Title
        const headerTitle = document.querySelector('#main-header h1');
        if (headerTitle) headerTitle.textContent = 'Find Sermons';

        // Fetch all sermons once for client-side filtering
        let allSermons = await dataService.getAllSermons();

        // Populate Year Jump Dropdown from data
        const populateYears = () => {
            const years = [...new Set(allSermons.map(s => {
                const parts = s.date ? s.date.split(' ') : [];
                return parts.length === 3 ? parseInt(parts[2]) : null;
            }))].filter(y => y !== null).sort((a, b) => b - a);

            jumpYearSelect.innerHTML = '<option value="">Year</option>' +
                years.map(y => `<option value="${y}">${y}</option>`).join('');
        };
        populateYears();

        // Helper to parse DD MMM YYYY into a Date object
        const parseSermonDate = (dateStr) => {
            if (!dateStr) return new Date(0);
            return new Date(dateStr); // Most browsers handle "18 Dec 2024" correctly
        };

        const renderResults = (sermons) => {
            if (sermons.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No sermons found</div>';
                return;
            }

            // Sort chronologically (Newest first)
            const sorted = [...sermons].sort((a, b) => {
                const dateA = parseSermonDate(a.date);
                const dateB = parseSermonDate(b.date);
                return dateB - dateA;
            });

            resultsContainer.innerHTML = sorted.map(sermon => `
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

            // Date filtering
            if (startDate) {
                filtered = filtered.filter(s => parseSermonDate(s.date) >= startDate);
            }
            if (endDate) {
                // Set endDate to end of day
                const adjustedEnd = new Date(endDate);
                adjustedEnd.setHours(23, 59, 59, 999);
                filtered = filtered.filter(s => parseSermonDate(s.date) <= adjustedEnd);
            }

            renderResults(filtered);
        };

        // Live filtering as user types
        titleInput.addEventListener('input', filterSermons);
        bookrefInput.addEventListener('input', filterSermons);
        speakerSelect.addEventListener('change', filterSermons);

        // Date Search Modal Logic
        searchDatesBtn.addEventListener('click', () => {
            dateModal.classList.remove('hidden');
        });

        const updateInputsFromJump = () => {
            const yearStr = jumpYearSelect.value;
            const monthStr = jumpMonthSelect.value;

            if (!yearStr) return;

            const year = parseInt(yearStr);
            let start, end;

            if (monthStr === "") {
                // Full Year
                start = new Date(year, 0, 1);
                end = new Date(year, 11, 31);
            } else {
                // Specific Month
                const month = parseInt(monthStr);
                start = new Date(year, month, 1);
                end = new Date(year, month + 1, 0); // Last day of month
            }

            fromDateInput.value = start.toISOString().split('T')[0];
            toDateInput.value = end.toISOString().split('T')[0];
        };

        jumpYearSelect.addEventListener('change', updateInputsFromJump);
        jumpMonthSelect.addEventListener('change', updateInputsFromJump);

        applyDateBtn.addEventListener('click', () => {
            startDate = fromDateInput.value ? new Date(fromDateInput.value) : null;
            endDate = toDateInput.value ? new Date(toDateInput.value) : null;

            // Set start of day for start date
            if (startDate) startDate.setHours(0, 0, 0, 0);

            dateModal.classList.add('hidden');
            filterSermons();
        });

        last3MonthsBtn.addEventListener('click', () => {
            const now = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            threeMonthsAgo.setHours(0, 0, 0, 0);

            startDate = threeMonthsAgo;
            endDate = now;

            // Sync inputs with the shortcut values
            fromDateInput.value = startDate.toISOString().split('T')[0];
            toDateInput.value = endDate.toISOString().split('T')[0];
            jumpYearSelect.value = ''; // Reset jump selects for clarity
            jumpMonthSelect.value = '';

            dateModal.classList.add('hidden');
            filterSermons();
        });

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
            startDate = null;
            endDate = null;
            fromDateInput.value = '';
            toDateInput.value = '';
            jumpYearSelect.value = '';
            jumpMonthSelect.value = '';
            resultsContainer.innerHTML = '';
        });
    }
}
