import { DataService } from '../services/data-service.js';

export default {
    render: async (params) => {
        const title = params.get('title');
        const type = params.get('type');
        const tag = params.get('tag');

        const dataService = new DataService();
        // Fallback title for display
        const displayTitle = title ? decodeURIComponent(title) : 'Series Details';

        // Fetch Sermons
        const sermons = await dataService.getSermonsBySeries(tag);

        let listHtml = '';
        if (sermons.length === 0) {
            listHtml = `<div class="view"><p class="error-msg" style="text-align:center; margin-top:50px;">No sermons found for this series.</p></div>`;
        } else {
            listHtml = sermons.map(sermon => `
            <div class="list-item sermon-item"
                 data-url="${sermon.permalink_url || ''}" 
                 data-title="${sermon.title}" 
                 data-artist="${sermon.speaker || ''}">
                <div class="item-icon">
                    <i class="fas fa-microphone"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${sermon.title}</div>
                    <div class="item-subtitle">${sermon.speaker} • ${new Date(sermon.date).toLocaleDateString()}</div>
                </div>
                <i class="fas fa-play-circle" style="color:var(--primary-color); opacity:0.8;"></i>
            </div>
        `).join('');
        }

        return `
            <div class="view series-details-view">
                <div class="header-back">
                    <a href="#series" class="back-link">← Back to Series</a>
                </div>
                <h2>${displayTitle}</h2>
                <div class="list-container">
                    ${listHtml}
                </div>
            </div>
        `;
    },
    afterRender: () => {
        const list = document.querySelector('.series-details-view .list-container');
        if (!list) return;

        list.querySelectorAll('.sermon-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                const title = item.dataset.title;
                const artist = item.dataset.artist;

                if (url) {
                    // Open Sermon on Podbean directly
                    const podbeanUrl = `https://pecharchive.podbean.com/e/${url}`;
                    window.open(podbeanUrl, '_blank');
                } else {
                    alert('No audio URL for this sermon');
                }
            });
        });
    }
}
