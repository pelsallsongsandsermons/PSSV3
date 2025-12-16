/**
 * Podbean Service
 * Fetches and parses the Podbean RSS feed to get MP3 URLs and descriptions
 */
export class PodbeanService {
    constructor() {
        this.feedUrl = 'https://feed.podbean.com/pecharchive/feed.xml';
        this.cachedEpisodes = null;
        this.cacheTimestamp = null;
        this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Fetch and parse the RSS feed
     * @returns {Promise<Array>} Array of episode objects
     */
    async fetchFeed() {
        // Return cached data if still valid
        if (this.cachedEpisodes && this.cacheTimestamp &&
            (Date.now() - this.cacheTimestamp < this.cacheMaxAge)) {
            console.log('PodbeanService: Using cached episodes');
            return this.cachedEpisodes;
        }

        console.log('PodbeanService: Fetching RSS feed...');

        try {
            const response = await fetch(this.feedUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const items = xmlDoc.querySelectorAll('item');
            const episodes = [];

            items.forEach(item => {
                const link = item.querySelector('link')?.textContent || '';
                const enclosure = item.querySelector('enclosure');
                const mp3Url = enclosure?.getAttribute('url') || '';
                const title = item.querySelector('title')?.textContent || '';
                const description = item.querySelector('description')?.textContent || '';

                // Extract slug from link (e.g., "https://pecharchive.podbean.com/e/12-a-profile/" -> "12-a-profile")
                const slugMatch = link.match(/\/e\/([^/]+)\/?$/);
                const slug = slugMatch ? slugMatch[1] : '';

                episodes.push({
                    title,
                    link,
                    slug,
                    mp3Url,
                    description
                });
            });

            console.log(`PodbeanService: Parsed ${episodes.length} episodes`);

            // Cache the results
            this.cachedEpisodes = episodes;
            this.cacheTimestamp = Date.now();

            return episodes;

        } catch (error) {
            console.error('PodbeanService: Error fetching feed:', error);
            return [];
        }
    }

    /**
     * Get episode data by slug (permalink_url from our DB)
     * @param {string} slug - The episode slug/permalink
     * @returns {Promise<Object|null>} Episode object or null if not found
     */
    async getEpisodeBySlug(slug) {
        if (!slug) return null;

        const episodes = await this.fetchFeed();

        // Try exact match first
        let episode = episodes.find(ep => ep.slug === slug);

        // Try partial match (in case slug has trailing slash or different format)
        if (!episode) {
            const cleanSlug = slug.replace(/\/$/, '').toLowerCase();
            episode = episodes.find(ep =>
                ep.slug.toLowerCase() === cleanSlug ||
                ep.link.toLowerCase().includes(cleanSlug)
            );
        }

        if (episode) {
            console.log('PodbeanService: Found episode:', episode.title);
        } else {
            console.warn('PodbeanService: Episode not found for slug:', slug);
        }

        return episode || null;
    }
}
