import { DataService } from '../services/data-service.js';

let currentSermons = [];
let isDescending = true; // Default: Latest first

export default {
    render: async (params) => {
        const title = params.get('title') || '';
        const tag = params.get('tag') || '';
        const type = params.get('type') || 'book'; // 'book' or 'topic'

        const dataService = new DataService();

        // 1. Fetch Series Metadata to get Image and Dates
        // We know the tag/title, we need to find the series object from the lists
        let seriesObj = null;
        if (type === 'book') {
            const books = await dataService.getBookSeries();
            // Try matching by tag first (more robust), then title
            seriesObj = books.find(s => s.series_tag === tag) || books.find(s => s.seriesTitle === title);
        } else {
            const topics = await dataService.getTopicSeries();
            seriesObj = topics.find(s => s.SeriesTag === tag) || topics.find(s => s.seriesTitle === title);
        }

        // 2. Fetch Sermons
        const sermons = await dataService.getSermonsBySeries(tag);

        // Pre-process dates for robust sorting
        // Format: "DD MMM YYYY" (e.g. "21 Feb 2021")
        currentSermons = sermons.map(s => {
            return {
                ...s,
                _timestamp: new Date(s.date).getTime()
            };
        });

        // 3. Initial Sort (Descending)
        isDescending = true;
        sortSermons();

        // 4. Prepare Header Data
        const displayTitle = seriesObj ? (seriesObj.seriesTitle || seriesObj.title) : (title || 'Series Details');
        const subtitle = seriesObj ? (seriesObj.series_tag || '') : ''; // e.g. "Strength in weakness"

        let imgUrl = seriesObj ? (seriesObj.seriesGraphic || seriesObj.artUri) : '';
        if (imgUrl && !imgUrl.includes('/') && !imgUrl.startsWith('http')) {
            imgUrl = `https://wsrv.nl/?url=https://drive.google.com/uc?id=${imgUrl}&w=400&output=jpg`;
        } else if (!imgUrl) {
            imgUrl = 'assets/images/PechLogoRound.png';
        }

        const dateRange = seriesObj ? `${seriesObj.dateFrom || ''} - ${seriesObj.dateTo || ''}` : '';

        return `
            <div class="view series-details-view">
                <!-- Header -->
                <div class="series-details-header">
                    <div class="header-content">
                        <h2>${displayTitle}</h2>
                        <h4 class="series-subtitle">${subtitle}</h4>
                        
                        <div class="header-meta">
                            <div class="meta-img" style="background-image: url('${imgUrl}')"></div>
                            <div class="meta-text">
                                <span class="date-range">${dateRange}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button id="sort-btn" class="sort-btn" title="Reverse Sort Order">
                        <i class="fas fa-sort"></i>
                    </button>
                </div>

                <!-- List -->
                <div class="list-container" id="sermons-list-container">
                    ${generateListHtml()}
                </div>
            </div>
        `;
    },

    afterRender: () => {
        // 1. Sort Button Listener
        const sortBtn = document.getElementById('sort-btn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                isDescending = !isDescending;
                sortSermons();
                updateList();
            });
        }

        // 2. Item Click Listeners
        addClickListeners();
    }
}

// --- Helpers ---

function sortSermons() {
    currentSermons.sort((a, b) => {
        return isDescending
            ? b._timestamp - a._timestamp
            : a._timestamp - b._timestamp;
    });
}

function generateListHtml() {
    if (currentSermons.length === 0) {
        return `<p class="error-msg" style="text-align:center; margin-top:50px; color:#aaa;">No sermons found for this series.</p>`;
    }

    return currentSermons.map(sermon => {
        // Robust check for YouTube URL
        const hasYoutube = sermon.youtube_url &&
            sermon.youtube_url !== 'null' &&
            sermon.youtube_url.trim() !== '' &&
            sermon.youtube_url.length > 10; // "https://..." is usually longer

        const ytIcon = hasYoutube ? `<i class="fas fa-tv monitor-icon" data-youtube-url="${sermon.youtube_url}" title="Watch on YouTube"></i>` : '';

        return `
            <div class="sermon-card-dark"
                 data-url="${sermon.permalink_url || ''}" 
                 data-title="${sermon.title}" 
                 data-artist="${sermon.speaker || ''}">
                 
                <div class="card-left">
                    <span class="sermon-title-text">${sermon.title}</span>
                </div>
                
                <div class="card-right">
                    ${ytIcon}
                </div>
            </div>
        `;
    }).join('');
}

function updateList() {
    const listContainer = document.getElementById('sermons-list-container');
    if (listContainer) {
        listContainer.innerHTML = generateListHtml();
        addClickListeners();
    }
}

function addClickListeners() {
    const list = document.getElementById('sermons-list-container');
    if (!list) return;

    list.querySelectorAll('.sermon-card-dark').forEach(item => {
        // YouTube Icon Click
        const ytIcon = item.querySelector('.monitor-icon');
        if (ytIcon) {
            ytIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const ytUrl = ytIcon.dataset.youtubeUrl;
                if (ytUrl) {
                    window.open(ytUrl, '_blank');
                }
            });
        }

        // Card Click (Podbean)
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            if (url) {
                // Open Sermon on Podbean logic matches legacy behavior
                const podbeanUrl = `https://pecharchive.podbean.com/e/${url}`;
                window.open(podbeanUrl, '_blank');
            } else {
                alert('No audio URL for this sermon');
            }
        });
    });
}
