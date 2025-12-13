import { DataService } from '../services/data-service.js';

export default {
    render: async () => {
        const dataService = new DataService();
        const sermons = await dataService.getRecentSermons(1);
        const latestSermon = sermons[0];

        let latestSermonHtml = '';
        if (latestSermon) {
            // Placeholder image if none exists. logic to pick image based on series or default
            const imageUrl = 'assets/images/churchColourCompressed.png';

            latestSermonHtml = `
                <div class="latest-sermon-card" onclick="location.hash='#sermons'">
                    <div class="latest-sermon-image" style="background-image: url('${imageUrl}');">
                        <!-- Play overlay could go here -->
                    </div>
                    <div class="latest-sermon-content">
                        <div class="latest-sermon-tag">LATEST SERMON</div>
                        <div class="latest-sermon-title">${latestSermon.title}</div>
                        <div class="latest-sermon-speaker">
                            <i class="fas fa-user-circle"></i> ${latestSermon.speaker || 'Unknown'}
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="view home-view">
                ${latestSermonHtml}
                
                <h3 style="font-size: 1rem; margin-top: 10px; margin-left: 5px;">Browse</h3>
                <div class="home-menu-row">
                    <a href="#livestream" class="home-menu-item">
                        <div class="home-icon-circle live">
                           <i class="fas fa-video"></i>
                        </div>
                        <span>Live</span>
                    </a>
                    <a href="#songs" class="home-menu-item">
                        <div class="home-icon-circle songs">
                           <i class="fas fa-music"></i>
                        </div>
                        <span>Songs</span>
                    </a>
                    <a href="#sermons" class="home-menu-item">
                        <div class="home-icon-circle sermons">
                           <i class="fas fa-microphone"></i>
                        </div>
                        <span>Sermons</span>
                    </a>
                    <a href="#series?type=book" class="home-menu-item">
                        <div class="home-icon-circle books">
                           <i class="fas fa-book-bible"></i>
                        </div>
                        <span>Bible</span>
                    </a>
                    <a href="#series?type=topic" class="home-menu-item">
                        <div class="home-icon-circle topics">
                           <i class="fas fa-list"></i>
                        </div>
                        <span>Topics</span>
                    </a>
                </div>
            </div>
        `;
    },
    afterRender: () => {

    }
}
