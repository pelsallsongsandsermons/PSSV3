import { DataService } from '../services/data-service.js';

export default {
    render: async (params) => {
        const dataService = new DataService();
        const type = params.get('type');
        const testament = params.get('testament');

        // --- 1. Filtered List View (Old/New Testament) ---
        if (type === 'book' && testament) {
            const allBooks = await dataService.getBookSeries();
            let filteredBooks = [];
            let pageTitle = '';

            if (testament === 'old') {
                filteredBooks = allBooks.filter(s => s.sequence < 40);
                pageTitle = 'Old Testament';
            } else if (testament === 'new') {
                filteredBooks = allBooks.filter(s => s.sequence > 39);
                pageTitle = 'New Testament';
            }

            // If valid filter
            if (filteredBooks.length > 0) {
                const listHtml = filteredBooks.map(series => {
                    let imgUrl = series.seriesGraphic || series.artUri || 'assets/images/PechLogoRound.png';
                    // Optimize/Proxy Image
                    if (imgUrl && !imgUrl.includes('/') && !imgUrl.startsWith('http')) {
                        imgUrl = `https://wsrv.nl/?url=https://drive.google.com/uc?id=${imgUrl}&w=400&output=jpg`;
                    }

                    const title = series.seriesTitle || series.title || 'Unknown';
                    const subtitle = series.series_tag || '';
                    const dateRange = `${series.dateFrom || ''} - ${series.dateTo || ''}`;

                    return `
                        <div class="series-list-card" onclick="location.hash='#series-details?title=${encodeURIComponent(title)}&type=book&tag=${encodeURIComponent(series.series_tag)}'">
                            <div class="card-img" style="background-image: url('${imgUrl}')"></div>
                            <div class="card-info">
                                <h3>${title}</h3>
                                <p class="subtitle">${subtitle}</p>
                                <p class="dates">${dateRange}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="view series-list-view" data-page-title="${pageTitle}">
                        <div class="series-list-container">
                            ${listHtml}
                        </div>
                    </div>
                `;
            }
        }

        // --- 2. Default Overview (Combined Grid) ---
        // If no specific testament selected, show the default grid (or what was there before)
        // This handles cases like #series or #series?type=topic (though topic list might also need simple list view?)
        // For now, preserving existing 'grid' logic for default/topics as fallback.

        const [books, topics] = await Promise.all([
            dataService.getBookSeries(),
            dataService.getTopicSeries()
        ]);

        const booksHtml = books.map(series => `
            <a href="#series-details?title=${encodeURIComponent(series.seriesTitle)}&type=book&tag=${encodeURIComponent(series.series_tag)}" class="card series-card" style="display:block; text-decoration:none; color:inherit;">
                <div class="series-title">${series.seriesTitle}</div>
                <div class="series-dates">${series.dateFrom || ''} - ${series.dateTo || ''}</div>
            </a>
        `).join('');

        const topicsHtml = topics.map(series => `
            <a href="#series-details?title=${encodeURIComponent(series.seriesTitle)}&type=topic&tag=${encodeURIComponent(series.SeriesTag)}" class="card series-card" style="display:block; text-decoration:none; color:inherit;">
                <div class="series-title">${series.seriesTitle}</div>
            </a>
        `).join('');

        return `
            <div class="view series-view">
                <h2>Bible Books</h2>
                <div class="series-grid">
                    ${booksHtml}
                </div>
                
                <h2 style="margin-top: 20px;">Topics</h2>
                <div class="series-grid">
                    ${topicsHtml}
                </div>
            </div>
        `;
    },
    afterRender: () => {
        // Update Header Title if we are on a specific list view
        const viewEl = document.querySelector('.series-list-view');
        if (viewEl && viewEl.dataset.pageTitle) {
            const headerTitle = document.querySelector('#main-header h1');
            if (headerTitle) {
                headerTitle.textContent = viewEl.dataset.pageTitle;
            }
        }
    }
}
