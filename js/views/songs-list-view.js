import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();
        const songs = await dataService.getSongs();

        // Get Last Played Song
        let lastPlayedHtml = '';
        try {
            const lastPlayed = JSON.parse(localStorage.getItem('lastPlayedSong'));
            const showLast = lastPlayed && lastPlayed.title;

            // Layout: Title Box | Clear | See New
            // If no last song, we just show See New aligned right or placeholder?
            // Screenshot implies the structure exists.

            lastPlayedHtml = `
                <div class="last-song-section" id="last-song-section">
                    <div class="section-label">Your last song</div>
                    <div class="last-song-row">
                        <div class="last-song-box" style="${showLast ? '' : 'visibility:hidden'}">
                            ${showLast ? lastPlayed.title : ''}
                        </div>
                        <button id="clear-last-song" class="action-btn" style="${showLast ? '' : 'visibility:hidden'}">Clear</button>
                        <button id="filter-new-songs" class="action-btn">See new</button>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('Error reading last played song', e);
        }

        // Generate list HTML
        const listHtml = songs.map(song => {
            const isNew = song.new_song === true;
            return `
            <a href="#song-player?title=${encodeURIComponent(song.songTitle)}" 
               class="song-card" 
               data-title="${song.songTitle}"
               onclick="saveLastPlayed('${song.songTitle.replace(/'/g, "\\'")}')">
                <div class="card-content">
                    <div class="song-title">${song.songTitle}</div>
                </div>
                ${isNew ? '<span class="new-badge">NEW</span>' : ''}
            </a>
            `;
        }).join('');

        return `
            <div class="view songs-view-dark">
                 <!-- Header is handled globally, but we might need to adjust it or hide it if we want full screen look. 
                      For now, we fit inside the standard layout but style the container. -->
                
                <div class="content-wrapper">
                    <!-- Search with Button -->
                    <div class="search-bar-dark">
                        <input type="text" id="song-search" placeholder="Search (enter any part of name)">
                        <!-- Search Icon inside input is common, but user asked for a Search BUTTON -->
                        <!-- The screenshot shows a magnifying glass ICON inside, and a separate "Search" BUTTON on the right -->
                        <i class="fas fa-search search-icon"></i> 
                        <button id="search-btn" class="search-btn">Search</button>
                    </div>

                    ${lastPlayedHtml}

                    <div id="songs-list" class="songs-grid">
                        ${listHtml}
                    </div>
                </div>
            </div>
        `;
    },
    afterRender: () => {
        const list = document.getElementById('songs-list');
        const searchInput = document.getElementById('song-search');
        const clearBtn = document.getElementById('clear-last-song');
        const seeNewBtn = document.getElementById('filter-new-songs');
        const searchBtn = document.getElementById('search-btn');

        // Global helper for the onclick inline attribute
        window.saveLastPlayed = (title) => {
            localStorage.setItem('lastPlayedSong', JSON.stringify({ title: title }));
        };

        const filterList = () => {
            const term = searchInput.value.toLowerCase();
            const items = list.querySelectorAll('.song-card');
            items.forEach(item => {
                const title = item.dataset.title.toLowerCase();
                // If "See New" is active, we also check for badge? 
                // The logic in legacy seems to be: See New filters just new. Search filters all. 
                // Usually search overrides.
                if (title.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        };

        // Search Input (Real-time filtering as per modern standard, even if button exists)
        if (searchInput) {
            searchInput.addEventListener('input', filterList);
        }

        // Search Button (Also triggers filter, or could be strictly manual if requested, but real-time is better UX)
        if (searchBtn) {
            searchBtn.addEventListener('click', filterList);
        }

        // Clear Last Song
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                localStorage.removeItem('lastPlayedSong');
                const box = document.querySelector('.last-song-box');
                if (box) box.style.visibility = 'hidden';
                clearBtn.style.visibility = 'hidden';
                // We keep the row and "See new" button visible
            });
        }

        // See New Filter
        if (seeNewBtn) {
            seeNewBtn.addEventListener('click', () => {
                const isActive = seeNewBtn.classList.toggle('active');
                if (isActive) {
                    seeNewBtn.textContent = 'Show All'; // Or keep "See new" and change style
                    const items = list.querySelectorAll('.song-card');
                    items.forEach(item => {
                        const hasBadge = item.querySelector('.new-badge');
                        if (hasBadge) {
                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                    // Disable search input if filtering by new? Or allow searching within new?
                    // For now simple toggle.
                } else {
                    seeNewBtn.textContent = 'See new';
                    filterList(); // Reset validation
                }
            });
        }
    }
}
