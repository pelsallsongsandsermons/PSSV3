import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();
        const sermons = await dataService.getRecentSermons();

        const listHtml = sermons.map(sermon => `
            <div class="list-item sermon-item" 
                 data-url="${sermon.permalink_url || ''}" 
                 data-title="${sermon.title}" 
                 data-artist="${sermon.speaker || ''}">
                <div class="item-icon">
                    <i class="fas fa-microphone"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${sermon.title}</div>
                    <div class="item-subtitle">${sermon.speaker || 'Unknown Speaker'} • ${sermon.date || ''}</div>
                </div>
                <i class="fas fa-play-circle" style="color:var(--primary-color); font-size:1.5rem;"></i>
            </div>
        `).join('');

        return `
            <div class="view sermons-view">
                <h2>Recent Sermons</h2>
                <div id="sermons-list" class="list-container">
                    ${listHtml}
                </div>
            </div>
        `;
    },
    afterRender: () => {
        const list = document.getElementById('sermons-list');
        list.querySelectorAll('.sermon-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                const title = item.dataset.title;
                const artist = item.dataset.artist;

                if (url) {
                    // Check user preference - default to true if not explicitly 'false'
                    const useCustomPlayer = localStorage.getItem('use_custom_player') !== 'false';

                    if (useCustomPlayer) {
                        // Navigate to custom sermon player
                        const params = new URLSearchParams({
                            slug: url,
                            title: title,
                            speaker: artist
                        });
                        window.location.hash = `#sermon-player?${params.toString()}`;
                    } else {
                        // Open Podbean on Podbean directly
                        const podbeanUrl = `https://pecharchive.podbean.com/e/${url}`;
                        window.open(podbeanUrl, '_blank');
                    }
                } else {
                    alert('No audio URL for this sermon');
                }
            });
        });
    }
}
