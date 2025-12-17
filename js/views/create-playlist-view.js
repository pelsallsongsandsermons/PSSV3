// js/views/create-playlist-view.js
import { DataService } from '../services/data-service.js';
import { PlaylistService } from '../services/playlist-service.js';

export default {
    render: async () => {
        const dataService = new DataService();
        const songs = await dataService.getSongs();

        // Sort songs alphabetically
        songs.sort((a, b) => a.songTitle.localeCompare(b.songTitle));

        const songsListHtml = songs.map(song => `
            <label class="select-song-item">
                <input type="checkbox" name="selectedSongs" value="${song.songTitle}" data-href="#song-player?title=${encodeURIComponent(song.songTitle)}">
                <span>${song.songTitle}</span>
            </label>
        `).join('');

        return `
            <div class="view create-playlist-view">
                <h2 style="color:white; margin-bottom: 20px;">Create Playlist</h2>
                
                <div class="create-form-group">
                    <label for="playlist-name">Playlist Name</label>
                    <input type="text" id="playlist-name" placeholder="e.g. Sunday Morning Service">
                </div>

                <div class="create-form-group">
                    <label>Select Songs</label>
                    <div class="select-songs-list">
                        ${songsListHtml}
                    </div>
                </div>

                <div class="form-actions-footer">
                    <button id="cancel-create" class="full-width-btn btn-secondary">Cancel</button>
                    <button id="save-playlist" class="full-width-btn btn-primary">Create</button>
                </div>
            </div>
        `;
    },
    afterRender: () => {
        const playlistService = new PlaylistService();
        const saveBtn = document.getElementById('save-playlist');
        const cancelBtn = document.getElementById('cancel-create');
        const nameInput = document.getElementById('playlist-name');

        saveBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter a playlist name');
                return;
            }

            const checkboxes = document.querySelectorAll('input[name="selectedSongs"]:checked');
            if (checkboxes.length === 0) {
                alert('Please select at least one song');
                return;
            }

            const selectedSongs = Array.from(checkboxes).map(chk => ({
                title: chk.value,
                href: chk.dataset.href
            }));

            if (playlistService.savePlaylist(name, selectedSongs)) {
                // Return to playlists view
                window.location.hash = '#playlists';
            } else {
                alert('Error creating playlist');
            }
        });

        cancelBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
}
