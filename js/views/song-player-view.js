import { DataService } from '../services/data-service.js';

export default {
    render: async (params) => {
        const title = decodeURIComponent(params.get('title') || '');
        const dataService = new DataService();
        // Since we don't have a direct "getSongByTitle" method yet, we'll fetch all and find it. 
        // Optimization: Add getSongByTitle to DataService later.
        const songs = await dataService.getSongs();
        const foundSong = songs.find(s => s.songTitle.trim().toLowerCase() === title.trim().toLowerCase());
        // Use the found object, even if casing was slightly different
        const song = foundSong;

        if (!song) {
            return `<div class="view"><p class="error-msg">Song not found</p></div>`;
        }

        // Helper to get property case-insensitively
        const getProp = (obj, key) => {
            if (!obj) return undefined;
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
            return foundKey ? obj[foundKey] : undefined;
        }

        console.log('DEBUG: Full Song Object:', song);
        console.log('DEBUG: lyricsUrl:', getProp(song, 'lyricsUrl'));
        console.log('DEBUG: youtube_url:', getProp(song, 'youtube_url'));

        const lyricsUrl = getProp(song, 'lyricsUrl');
        const youtubeUrl = getProp(song, 'youtube_url');

        // --- 1. Lyrics (Google Slides) ---
        // Expected format: https://docs.google.com/presentation/d/[FILE_ID]/... OR just [FILE_ID]
        let slideEmbedUrl = '';
        if (lyricsUrl) {
            let fileId = '';
            // Check if it's a URL or just an ID
            if (lyricsUrl.includes('docs.google.com') && lyricsUrl.includes('/d/')) {
                const match = lyricsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    fileId = match[1];
                }
            } else {
                // Assume the field contains the raw File ID
                fileId = lyricsUrl.trim();
            }

            if (fileId) {
                slideEmbedUrl = `https://docs.google.com/presentation/d/${fileId}/embed?rm=minimal&start=false&loop=false`;
            }
        }

        // --- 2. YouTube ---
        // User confirmed 'youtube_url' column contains the Video ID (e.g., "DswWiHUwYjw")
        let youtubeEmbedUrl = '';
        if (youtubeUrl && youtubeUrl !== 'emptyUrl') {
            const videoId = youtubeUrl.trim();

            // Construct the Embed URL
            // Format: https://www.youtube.com/embed/[VIDEO_ID]
            const start = song.startAt || 0;
            const end = song.endAt || '';

            // Legacy uses autoplay=1. We match it EXACTLY.
            // Legacy URL: https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1
            // We put autoplay last to match legacy structure if strictness matters, though order shouldn't.
            // Using: .../embed/${videoId}?start=${start}...&autoplay=1 (Legacy order seems to be start/end/autoplay)

            let params = `start=${start}`;
            if (end) params += `&end=${end}`;
            params += '&autoplay=1';

            youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?${params}`;
        }

        // Launch URL for external app
        const launchUrl = youtubeUrl && youtubeUrl !== 'emptyUrl'
            ? `https://www.youtube.com/watch?v=${youtubeUrl.trim()}${song.startAt ? `&t=${song.startAt}s` : ''}`
            : '#';

        return `
            <div class="view song-player-view">
                <!-- Header -->
                <div class="song-player-header">
                    <button class="back-btn" onclick="history.back()"><i class="fas fa-arrow-left"></i></button>
                    <h1>Song Player</h1>
                </div>

                <!-- Song Title Banner -->
                <div class="song-banner">
                    <h2>${song.songTitle.toUpperCase()}</h2>
                </div>

                <!-- Lyrics/Slides Container -->
                <div class="lyrics-container">
                    ${slideEmbedUrl ? `
                        <div class="slide-wrapper">
                            <iframe 
                                src="${slideEmbedUrl}" 
                                frameborder="0" 
                                class="slide-iframe" 
                                allowfullscreen="true" 
                                mozallowfullscreen="true" 
                                webkitallowfullscreen="true">
                            </iframe>
                        </div>
                    ` : '<div class="no-content">No lyrics available</div>'}
                    
                    <div class="attribution-box">
                        <p>${song.copyRight || 'Copyright info not available'}</p>
                    </div>
                </div>

                <!-- YouTube Container -->
                <div class="youtube-container">
                    ${youtubeEmbedUrl ? `
                        <iframe 
                            src="${youtubeEmbedUrl}" 
                            title="YouTube video player" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                         <a href="${launchUrl}" target="_blank" class="yt-launch-btn">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : '<div class="no-content">No video available</div>'}
                </div>
            </div>
        `;
    },
    afterRender: () => {
        // Hide the persistent footer player for this view since we have a video?
        // Or keep it? The requirement mentions playing a video. Usually you don't want double audio.
        // Let's pause the global player if it's playing.
        if (window.app.player && window.app.player.audio) {
            window.app.player.audio.pause();
        }

        // Hide footer
        const footer = document.getElementById('player-footer');
        if (footer) footer.classList.add('hidden');
    }
}
