/**
 * Player Controller
 * Manages the persistent audio element and footer UI
 */
export class Player {
    constructor() {
        this.audio = document.getElementById('audio-element');
        this.footer = document.getElementById('player-footer');
        this.titleEl = document.getElementById('player-title');
        this.artistEl = document.getElementById('player-artist');
        this.playBtn = document.getElementById('btn-play');

        this.currentTrack = null;
        this.isPlaying = false;

        this.bindEvents();
    }

    bindEvents() {
        this.playBtn.addEventListener('click', () => this.togglePlay());

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateUI();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateUI();
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updateUI();
        });
    }

    playTrack(track) {
        // track: { url, title, artist }
        this.currentTrack = track;
        this.audio.src = track.url;
        this.titleEl.textContent = track.title;
        this.artistEl.textContent = track.artist || '';

        this.footer.classList.remove('hidden');
        this.audio.play();
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    updateUI() {
        this.playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    }
}
