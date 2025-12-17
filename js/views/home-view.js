import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();

        // Fetch "Current" Series based on the 'current' boolean flag in the DB
        const currentSeries = await dataService.getCurrentSeries();

        // Fallback if no series is marked as current (optional, but good for stability)
        if (currentSeries.length === 0) {
            // Logic to fallback or show empty state? 
            // For now, let's just grab the 2 most recent book series as a safety net if desired, 
            // OR just leave it empty if that's the desired behavior.
            // keeping it empty creates a valid "None" state.
        }

        const createSeriesCard = (series) => {
            // Map DB columns to UI fields
            // "seriesTitle" and "seriesGraphic" are the columns in bookSeries
            let imgUrl = series.seriesGraphic || series.artUri || 'assets/images/PechLogoRound.png';

            // Check if imgUrl is a Google Drive ID (contains no slashes and looks like an ID)
            // or explicitly fix known relative paths if any.
            // Google IDs usually alphanumeric, - and _.
            if (imgUrl && !imgUrl.includes('/') && !imgUrl.startsWith('http')) {
                // Use wsrv.nl (caching proxy) to bypass Google Drive rate limits
                // We pass the standard Google Drive link to it.
                imgUrl = `https://wsrv.nl/?url=https://drive.google.com/uc?id=${imgUrl}&w=800&output=jpg`;
            }

            const title = series.seriesTitle || series.title || 'Unknown Series';

            // "series_tag" (bookSeries) vs "SeriesTag" (topicSeries)
            // Schema check confirms bookSeries uses 'series_tag' (snake_case)
            // Schema check confirms topicSeries uses 'SeriesTag' (PascalCase)
            const subtitle = series.series_tag || series.SeriesTag || '';

            return `
                <div class="series-card-home" onclick="location.hash='#series-details?title=${encodeURIComponent(title).replace(/'/g, '%27')}&type=${series.type || 'book'}&tag=${encodeURIComponent(subtitle).replace(/'/g, '%27')}'">
                    <img src="${imgUrl}" alt="${title}">
                    <div class="info">
                        <h4>${title}</h4>
                        <p>${subtitle}</p>
                    </div>
                </div>
             `;
        };

        return `
            <div class="view home-view">
                <!-- Hero Section -->
                <div class="hero-section" style="background-image: url('assets/images/churchColourCompressed.png');"></div>

                <!-- Nav Grid 1 -->
                <div class="home-actions-grid">
                    <a href="#songs" class="home-action-btn">
                        <span>Songs</span>
                    </a>
                    <a href="#series?type=book&testament=old" class="home-action-btn">
                        <span>Old<br>Testament<br>Series</span>
                    </a>
                    <a href="#series?type=book&testament=new" class="home-action-btn">
                        <span>New<br>Testament<br>Series</span>
                    </a>
                </div>

                <!-- Current Sermon Series -->
                <div class="section-header">
                    <div class="section-title-bar">Current sermon series</div>
                    <div class="section-content">
                        ${currentSeries.map(s => createSeriesCard(s)).join('')}
                    </div>
                </div>

                <!-- Nav Grid 2 -->
                <div class="home-actions-grid">
                    <a href="#series?type=topic" class="home-action-btn">
                        <span>Topics</span>
                    </a>
                    <a href="https://www.youtube.com/@pelsallevangelicalchurch" target="_blank" class="home-action-btn">
                        <span>Live<br>Stream</span>
                    </a>
                    <a href="#sermons" class="home-action-btn">
                        <span>Search<br>Sermons</span>
                    </a>
                </div>

                <!-- Footer Info -->
                <div class="footer-info-box">
                    Explore 180 songs, and over 1300 sermons.
                </div>

                <div class="home-footer-text">
                    <p style="margin-bottom: 20px;">
                        Oh come, let us sing to the Lord; let us make a joyful noise to the rock of our salvation! 
                        Let us come into his presence with thanksgiving; let us make a joyful noise to him with songs of praise!
                        <br>(Psalm 95:1-2)
                    </p>
                    <p style="margin-bottom: 20px;">
                        Pelsall Songs and Sermons is a collection of recordings from the Sunday services at Pelsall Evangelical Church...
                    </p>
                    <p style="margin-bottom: 20px;">
                        For further information or support, please contact us at<br>
                        <strong>pelsallsongsandsermons@pech.co.uk</strong>
                    </p>
                    <p>
                        <a href="https://www.pech.co.uk" target="_blank" style="color: #4DB6AC;">www.pech.co.uk</a>
                    </p>
                    <br>
                    <button onclick="location.reload()" style="background: #2A4D55; border: 1px solid #4DB6AC; color: white; padding: 10px 20px; border-radius: 20px;">Run the Tour again next time</button>
                    <br><br>
                    <h3>Soli Deo Gloria</h3>
                </div>
            </div>
        `;
    },
    afterRender: () => {
        // Logic for Tour button or other interactions
    }
}
