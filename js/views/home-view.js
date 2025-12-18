import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();

        // Fetch "Current" Series based on the 'current' boolean flag in the DB
        const currentSeries = await dataService.getCurrentSeries();

        // Fetch settings for home page content
        const settings = await dataService.getSettings();
        const livestreamUrl = settings?.livestream_url || 'https://www.youtube.com/@pelsallevangelicalchurch';
        const songCount = settings?.songCount || 180;
        const sermonCount = settings?.sermonCount || 1300;
        const introVerse1 = settings?.intro_verse1 || '';
        const introVerse2 = settings?.intro_verse2 || '';

        // Fallback if no series is marked as current (optional, but good for stability)
        if (currentSeries.length === 0) {
            // Logic to fallback or show empty state? 
        }

        const createSeriesCard = (series) => {
            // ... (keep current implementation)
            let imgUrl = series.seriesGraphic || series.artUri || 'assets/images/PechLogoRound.png';
            if (imgUrl && !imgUrl.includes('/') && !imgUrl.startsWith('http')) {
                imgUrl = `https://wsrv.nl/?url=https://drive.google.com/uc?id=${imgUrl}&w=800&output=jpg`;
            }
            const title = series.seriesTitle || series.title || 'Unknown Series';
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
                    <a href="${livestreamUrl}" target="_blank" class="home-action-btn">
                        <span>Live<br>Stream</span>
                    </a>
                    <a href="#find-sermons" class="home-action-btn">
                        <span>Search<br>Sermons</span>
                    </a>
                </div>

                <!-- Footer Info -->
                <div class="footer-info-box">
                    Explore ${songCount} songs, and over ${sermonCount} sermons.
                </div>

                <div class="home-footer-text">
                    ${introVerse1 ? `
                        <div class="bible-verse">${introVerse1}</div>
                        <div class="divider-line"></div>
                    ` : ''}

                    <div class="descriptive-text">
                        <p>Pelsall Songs and Sermons is a collection of recordings from the Sunday services at Pelsall Evangelical Church. The songs are presented with lyrics, for you to use in your personal or family worship at home. New songs will be added regularly.</p>
                        
                        <p>The sermons are recordings of Christ-centred Bible ministry from our services, over several years, and from several different preachers.</p>
                        
                        <p>You can easily follow the current preaching series, or explore previous series. There are also a number of topical series covering various subjects. You can use the "Search" page to find sermons by title, bible book/chapter, and speaker.</p>
                        
                        <p>Any song or sermon can be listened to by tapping on the title. On some entries you will see a red video symbol. If you tap on the symbol you will be taken to the original YouTube recording.</p>
                        
                        <p>We pray that these recordings help you to draw near to our God - Father, Son and Holy Spirit - to give Him glory and know His blessing.</p>
                        
                        <p>For further information or support, please contact us at<br>
                        <strong>pelsallsongsandsermons@pech.co.uk</strong></p>
                        
                        <p><a href="https://www.pech.co.uk" target="_blank" style="color: #4DB6AC;">www.pech.co.uk</a></p>
                    </div>

                    <div class="divider-line"></div>

                    ${introVerse2 ? `
                        <div class="bible-verse">${introVerse2}</div>
                        <div class="divider-line"></div>
                    ` : ''}

                    <h3 style="margin: 20px 0;">Soli Deo Gloria</h3>

                    <div class="attribution-text">
                        <p>All songs are from the Pelsall Evangelical Church streamed services and distributed under the terms and conditions of the CCLI Streaming Licence number 1321213. Used by permission</p>
                        <p>Scripture quotations are from the ESV Bible (The Holy Bible, English Standard Version) © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission.</p>
                        <p>The App does not request, store or share any personal information from you.</p>
                    </div>
                </div>
            </div>
        `;
    },
    afterRender: () => {
        // Logic for Tour button or other interactions
    }
}
