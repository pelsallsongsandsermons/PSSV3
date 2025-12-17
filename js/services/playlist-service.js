// js/services/playlist-service.js

export class PlaylistService {
    constructor() {
        this.STORAGE_KEY = 'custom_playlists';
        this.QUEUE_KEY = 'randomQueue'; // Reusing the existing queue key for player compat
    }

    getPlaylists() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error reading playlists from localStorage', e);
            return [];
        }
    }

    savePlaylist(name, songs) {
        if (!name || !songs || songs.length === 0) return false;

        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: Date.now().toString(),
            name: name,
            songs: songs,
            createdAt: new Date().toISOString()
        };

        playlists.push(newPlaylist);
        this._saveToStorage(playlists);
        return true;
    }

    deletePlaylist(id) {
        let playlists = this.getPlaylists();
        playlists = playlists.filter(p => p.id !== id);
        this._saveToStorage(playlists);
        return true;
    }

    getPlaylistById(id) {
        const playlists = this.getPlaylists();
        return playlists.find(p => p.id === id);
    }

    updatePlaylist(id, name, songs) {
        if (!id || !name || !songs || songs.length === 0) return false;

        const playlists = this.getPlaylists();
        const index = playlists.findIndex(p => p.id === id);

        if (index === -1) return false;

        playlists[index] = {
            ...playlists[index],
            name: name,
            songs: songs,
            updatedAt: new Date().toISOString()
        };

        this._saveToStorage(playlists);
        return true;
    }

    _saveToStorage(playlists) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlists));
        } catch (e) {
            console.error('Error saving playlists to localStorage', e);
            alert('Failed to save playlist. Storage might be full.');
        }
    }

    // Prepare a playlist for playback using the existing "Random Play" queue mechanism
    playPlaylist(playlist) {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) return false;

        // The player expects { queue: [], currentIndex: 0 } in 'randomQueue'
        // And songs in the queue need { title: '...', href: '...' }
        const queueData = {
            queue: playlist.songs,
            currentIndex: 0
        };

        try {
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queueData));
            // Return the first song to navigate to
            return playlist.songs[0];
        } catch (e) {
            console.error('Error starting playlist', e);
            return null;
        }
    }
}
