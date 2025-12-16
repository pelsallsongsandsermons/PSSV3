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
                        <div class="search-input-wrapper">
                            <input type="text" id="song-search" placeholder="Search (enter any part of name)">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                        <button id="search-btn" class="search-btn">Search</button>
                    </div>

                    <!-- Random Play Button -->
                    <div class="random-play-section">
                        <button id="random-play-btn" class="random-play-btn">
                            <i class="fas fa-random"></i> Random Play
                        </button>
                    </div>

                    ${lastPlayedHtml}

                    <div id="songs-list" class="songs-grid">
                        ${listHtml}
                    </div>
                </div>

                <!-- Random Play Modal -->
                <div id="random-modal" class="modal hidden">
                    <div class="modal-content">
                        <h3>Random Play</h3>
                        <p>How many songs do you want to play?</p>
                        <div class="song-count-options">
                            <button class="count-btn" data-count="5">5</button>
                            <button class="count-btn" data-count="10">10</button>
                            <button class="count-btn" data-count="15">15</button>
                            <button class="count-btn" data-count="20">20</button>
                        </div>
                        <div class="modal-actions">
                            <button id="cancel-random" class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>

                <!-- Random Playlist Display -->
                <div id="random-playlist" class="random-playlist hidden">
                    <div class="playlist-header">
                        <h3>Random Playlist</h3>
                        <button id="close-playlist" class="close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div id="playlist-songs" class="playlist-songs"></div>
                    <div class="playlist-controls">
                        <span id="current-song-info">Song 1 of X</span>
                    </div>
                </div>

                <!-- iOS Tap to Start Modal -->
                <div id="ios-tap-modal" class="modal hidden">
                    <div class="modal-content ios-tap-content">
                        <i class="fas fa-play-circle ios-play-icon"></i>
                        <h3>Tap to Start</h3>
                        <p>iOS requires a tap to enable continuous playback</p>
                        <button id="ios-start-btn" class="ios-start-btn">
                            <i class="fas fa-music"></i> Start Playing
                        </button>
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
        const randomPlayBtn = document.getElementById('random-play-btn');
        const randomModal = document.getElementById('random-modal');
        const cancelRandomBtn = document.getElementById('cancel-random');
        const randomPlaylist = document.getElementById('random-playlist');
        const playlistSongs = document.getElementById('playlist-songs');
        const closePlaylistBtn = document.getElementById('close-playlist');
        const currentSongInfo = document.getElementById('current-song-info');

        // Store all songs for random selection
        let allSongs = [];
        list.querySelectorAll('.song-card').forEach(card => {
            allSongs.push({
                title: card.dataset.title,
                href: card.getAttribute('href')
            });
        });

        // Random playlist state
        let randomQueue = [];
        let currentIndex = 0;

        // Global helper for the onclick inline attribute
        window.saveLastPlayed = (title) => {
            localStorage.setItem('lastPlayedSong', JSON.stringify({ title: title }));
        };

        const filterList = () => {
            const term = searchInput.value.toLowerCase();
            const items = list.querySelectorAll('.song-card');
            items.forEach(item => {
                const title = item.dataset.title.toLowerCase();
                if (title.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        };

        // Search Input
        if (searchInput) {
            searchInput.addEventListener('input', filterList);
        }

        // Search Button
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
            });
        }

        // See New Filter
        if (seeNewBtn) {
            seeNewBtn.addEventListener('click', () => {
                const isActive = seeNewBtn.classList.toggle('active');
                if (isActive) {
                    seeNewBtn.textContent = 'Show All';
                    const items = list.querySelectorAll('.song-card');
                    items.forEach(item => {
                        const hasBadge = item.querySelector('.new-badge');
                        item.style.display = hasBadge ? 'flex' : 'none';
                    });
                } else {
                    seeNewBtn.textContent = 'See new';
                    filterList();
                }
            });
        }

        // --- Random Play Functionality ---

        // Show modal
        if (randomPlayBtn) {
            randomPlayBtn.addEventListener('click', () => {
                randomModal.classList.remove('hidden');
            });
        }

        // Cancel modal
        if (cancelRandomBtn) {
            cancelRandomBtn.addEventListener('click', () => {
                randomModal.classList.add('hidden');
            });
        }

        // Song count selection
        randomModal?.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const count = parseInt(btn.dataset.count);
                startRandomPlay(count);
                randomModal.classList.add('hidden');
            });
        });

        // Close playlist
        if (closePlaylistBtn) {
            closePlaylistBtn.addEventListener('click', () => {
                randomPlaylist.classList.add('hidden');
                randomQueue = [];
                currentIndex = 0;
            });
        }

        // iOS Detection
        function isIOS() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        }

        // iOS Tap Modal Elements
        const iosTapModal = document.getElementById('ios-tap-modal');
        const iosStartBtn = document.getElementById('ios-start-btn');

        // iOS Start Button Handler
        if (iosStartBtn) {
            iosStartBtn.addEventListener('click', () => {
                iosTapModal.classList.add('hidden');
                // This tap satisfies iOS gesture requirement
                playCurrentSong();
            });
        }

        function startRandomPlay(count) {
            // Shuffle and pick 'count' songs
            const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
            randomQueue = shuffled.slice(0, Math.min(count, allSongs.length));
            currentIndex = 0;

            // Render playlist
            renderPlaylist();
            randomPlaylist.classList.remove('hidden');

            // On iOS, show tap prompt first
            if (isIOS()) {
                iosTapModal.classList.remove('hidden');
            } else {
                // Non-iOS: Start playing immediately
                playCurrentSong();
            }
        }

        function renderPlaylist() {
            playlistSongs.innerHTML = randomQueue.map((song, i) => `
                <div class="playlist-item ${i === currentIndex ? 'playing' : ''}" data-index="${i}">
                    <span class="playlist-number">${i + 1}</span>
                    <span class="playlist-title">${song.title}</span>
                    ${i === currentIndex ? '<i class="fas fa-play playing-icon"></i>' : ''}
                </div>
            `).join('');

            currentSongInfo.textContent = `Song ${currentIndex + 1} of ${randomQueue.length}`;

            // Add click handlers for playlist items
            playlistSongs.querySelectorAll('.playlist-item').forEach(item => {
                item.addEventListener('click', () => {
                    currentIndex = parseInt(item.dataset.index);
                    renderPlaylist();
                    playCurrentSong();
                });
            });
        }

        function playCurrentSong() {
            if (currentIndex >= randomQueue.length) {
                // Playlist complete
                currentSongInfo.textContent = 'Playlist Complete!';
                return;
            }

            const song = randomQueue[currentIndex];
            window.saveLastPlayed(song.title);

            // Store random queue info for song player to use
            localStorage.setItem('randomQueue', JSON.stringify({
                queue: randomQueue,
                currentIndex: currentIndex
            }));

            // Navigate to song player
            window.location.hash = song.href;
        }

        // Expose function for song player to call when song ends
        window.playNextInQueue = () => {
            const queueData = JSON.parse(localStorage.getItem('randomQueue') || '{}');
            if (queueData.queue && queueData.currentIndex < queueData.queue.length - 1) {
                queueData.currentIndex++;
                localStorage.setItem('randomQueue', JSON.stringify(queueData));
                const nextSong = queueData.queue[queueData.currentIndex];
                window.location.hash = `#song-player?title=${encodeURIComponent(nextSong.title)}`;
                return true;
            }
            return false;
        };
    }
}
