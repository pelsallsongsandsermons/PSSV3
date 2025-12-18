// js/views/playlists-view.js
import { PlaylistService } from '../services/playlist-service.js';

export default {
    render: async () => {
        const playlistService = new PlaylistService();
        const playlists = playlistService.getPlaylists();

        const playlistsHtml = playlists.length === 0 ?
            '<div class="no-content">No playlists created yet. Tap + to create one.</div>' :
            playlists.map(playlist => `
                <div class="playlist-card" data-id="${playlist.id}">
                    <div class="playlist-info">
                        <h3>${playlist.name}</h3>
                        <p>${playlist.songs.length} songs • Created ${new Date(playlist.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="playlist-actions">
                        <a href="#create-playlist?id=${playlist.id}" class="playlist-edit-btn" data-id="${playlist.id}">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="playlist-delete-btn" data-id="${playlist.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        return `
            <div class="view playlists-view">
                <div class="content-wrapper">
                    <h2 style="margin-bottom: 20px;">Your Playlists</h2>
                    <div id="playlists-list">
                        ${playlistsHtml}
                    </div>
                </div>

                <a href="#create-playlist" class="fab-btn">
                    <i class="fas fa-plus"></i>
                </a>

                <!-- Reusing the bottom bar for consistency if desired, or back button is enough -->
                <!-- The requirement says "Random Play" and "Playlists" are on the Songs page. 
                     On this page, user likely uses the global back button or we can add a nav. 
                     For now, global back button handles return to Songs list. -->
            </div>
        `;
    },
    afterRender: () => {
        const playlistService = new PlaylistService();
        const list = document.getElementById('playlists-list');

        // Handle clicks
        list.addEventListener('click', (e) => {
            // Check for delete button click
            const deleteBtn = e.target.closest('.playlist-delete-btn');
            if (deleteBtn) {
                e.stopPropagation(); // Prevent card click
                const id = deleteBtn.dataset.id;
                if (confirm('Are you sure you want to delete this playlist?')) {
                    playlistService.deletePlaylist(id);
                    // Re-render essentially by reloading current view or just removing element logic
                    // Simplest is generic reload or removing the DOM element
                    const card = deleteBtn.closest('.playlist-card');
                    card.remove();
                    if (list.children.length === 0) {
                        list.innerHTML = '<div class="no-content">No playlists created yet. Tap + to create one.</div>';
                    }
                }
                return;
            }

            // Check for card click (Play)
            const card = e.target.closest('.playlist-card');
            if (card) {
                const id = card.dataset.id;
                const playlists = playlistService.getPlaylists();
                const playlist = playlists.find(p => p.id === id);

                if (playlist) {
                    const firstSong = playlistService.playPlaylist(playlist);
                    if (firstSong) {
                        // Set return route
                        localStorage.setItem('playlistReturn', '#playlists');

                        // Navigate to player
                        window.location.hash = firstSong.href;
                    } else {
                        alert('Playlist is empty or invalid.');
                    }
                }
            }
        });
    }
}
