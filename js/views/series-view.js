import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();
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
        // Future: Handle clicks to filter sermons by series
    }
}
