/**
 * Random Playlist Player View
 * Uses YouTube IFrame API playlist feature for continuous playback
 */
import { DataService } from '../services/data-service.js';

export default {
    render: async (params) => {
        // Get video IDs from URL params
        const videoIds = params.get('videos')?.split(',') || [];
        const titles = params.get('titles')?.split('|||') || [];

        if (videoIds.length === 0) {
            return `
                <div class="view random-playlist-player">
                    <p class="error-msg">No songs selected</p>
                </div>
            `;
        }

        // First video ID goes in the embed URL, rest go in playlist parameter
        const firstVideoId = videoIds[0];
        const playlistIds = videoIds.join(',');

        return `
            <div class="view random-playlist-player" data-video-ids="${playlistIds}">
                <div class="playlist-player-header">
                    <h2><i class="fas fa-random"></i> Random Playlist</h2>
                    <p>${videoIds.length} songs</p>
                </div>
                
                <div class="playlist-video-container">
                    <div id="random-yt-player"></div>
                </div>
                
                <div class="playlist-track-info">
                    <div id="current-track-title">Loading...</div>
                    <div id="track-progress">Song 1 of ${videoIds.length}</div>
                </div>
                
                <div class="playlist-song-list">
                    <h3>Up Next</h3>
                    <div id="song-list-container">
                        ${titles.map((title, i) => `
                            <div class="playlist-song-item ${i === 0 ? 'now-playing' : ''}" data-index="${i}">
                                <span class="song-number">${i + 1}</span>
                                <span class="song-name">${title}</span>
                                ${i === 0 ? '<i class="fas fa-volume-up now-playing-icon"></i>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    afterRender: async () => {
        // Update header
        const headerTitle = document.querySelector('#main-header h1');
        if (headerTitle) headerTitle.textContent = 'Random Playlist';

        // Get video IDs
        const container = document.querySelector('.random-playlist-player');
        const videoIdsStr = container?.dataset.videoIds || '';
        const videoIds = videoIdsStr.split(',').filter(id => id);

        if (videoIds.length === 0) return;

        let currentIndex = 0;

        // Initialize YouTube player with playlist
        const initPlayer = () => {
            new YT.Player('random-yt-player', {
                height: '100%',
                width: '100%',
                videoId: videoIds[0],
                playerVars: {
                    'playsinline': 1,
                    'autoplay': 1,
                    'playlist': videoIds.slice(1).join(','), // Rest of videos
                    'rel': 0, // Don't show related videos
                    'modestbranding': 1
                },
                events: {
                    'onReady': (event) => {
                        // Try to start playback
                        event.target.playVideo();
                        // iOS retry
                        setTimeout(() => {
                            if (event.target.getPlayerState() !== 1) {
                                event.target.playVideo();
                            }
                        }, 1000);
                    },
                    'onStateChange': (event) => {
                        // Track current video index
                        if (event.target.getPlaylistIndex) {
                            const newIndex = event.target.getPlaylistIndex();
                            if (newIndex !== currentIndex && newIndex >= 0) {
                                currentIndex = newIndex;
                                updateNowPlaying(currentIndex);
                            }
                        }

                        // Check for playlist end
                        if (event.data === 0) { // ENDED
                            // Check if there are more videos
                            const playlistIndex = event.target.getPlaylistIndex();
                            const playlistLength = videoIds.length;

                            if (playlistIndex >= playlistLength - 1) {
                                // Playlist complete
                                document.getElementById('track-progress').textContent = 'Playlist Complete!';
                            }
                        }
                    }
                }
            });
        };

        // Update now playing indicator
        function updateNowPlaying(index) {
            // Update progress text
            const progressEl = document.getElementById('track-progress');
            if (progressEl) {
                progressEl.textContent = `Song ${index + 1} of ${videoIds.length}`;
            }

            // Update list highlighting
            const items = document.querySelectorAll('.playlist-song-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('now-playing');
                    const existingIcon = item.querySelector('.now-playing-icon');
                    if (!existingIcon) {
                        item.innerHTML += '<i class="fas fa-volume-up now-playing-icon"></i>';
                    }
                } else {
                    item.classList.remove('now-playing');
                    const icon = item.querySelector('.now-playing-icon');
                    if (icon) icon.remove();
                }
            });
        }

        // Load YouTube API if needed
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = initPlayer;
        } else {
            initPlayer();
        }
    }
};
