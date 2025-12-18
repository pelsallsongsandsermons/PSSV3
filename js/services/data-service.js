/**
 * Data Service
 * Handles all database interactions
 */
import { CONFIG } from '../config.js';

export class DataService {
    constructor() {
        this.supabase = window.app.supabase.getClient();
    }

    // --- Songs ---
    async getSongs() {
        // Table: "songsList" (Strict CamelCase as requested)
        const { data, error } = await this.supabase
            .from('songsList')
            .select('*')
            .order('songTitle', { ascending: true });

        if (error) {
            console.error('Error fetching songs from songsList:', error);
            return [];
        }
        return data;
    }


    // --- Sermons ---
    async getRecentSermons(limit = 20) {
        // Table: "sermonList"
        const { data, error } = await this.supabase
            .from('sermonList')
            .select('*')
            .order('date', { ascending: false }) // Assuming date is sortable
            .limit(limit);

        if (error) {
            console.error('Error fetching sermons:', error);
            return [];
        }
        return data;
    }

    async getSermonsBySeries(seriesTag) {
        if (!seriesTag) return [];

        const { data, error } = await this.supabase
            .from('sermonList')
            .select('*')
            .eq('episode_tag', seriesTag) // Relationship defined by user
            .order('publish_time', { ascending: false }); // Corrected column name based on schema

        if (error) {
            console.error('Error fetching sermons in series:', error);
            return [];
        }
        return data;
    }

    async searchSermons(criteria = {}) {
        const { title, bookRef, speaker } = criteria;

        let query = this.supabase
            .from('sermonList')
            .select('*');

        if (title) {
            query = query.ilike('title', `%${title}%`);
        }
        if (bookRef) {
            query = query.ilike('full_ref', `%${bookRef}%`);
        }
        if (speaker) {
            query = query.eq('speaker', speaker);
        }

        query = query.order('date', { ascending: false });

        const { data, error } = await query;
        if (error) {
            console.error('Error searching sermons:', error);
            return [];
        }
        return data || [];
    }

    async getAllSermons() {
        const { data, error } = await this.supabase
            .from('sermonList')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching all sermons:', error);
            return [];
        }
        return data || [];
    }

    async getSpeakers() {
        const { data, error } = await this.supabase
            .from('speakerNames')
            .select('speaker')
            .order('speaker', { ascending: true });

        if (error) {
            console.error('Error fetching speakers:', error);
            return [];
        }
        return data || [];
    }

    // --- Series ---
    async getBookSeries() {
        const { data, error } = await this.supabase
            .from('bookSeries')
            .select('*')
            .order('sequence', { ascending: true });
        return data || [];
    }

    async getCurrentSeries() {
        const { data, error } = await this.supabase
            .from('bookSeries')
            .select('*')
            .eq('current', true)
            .order('sequence', { ascending: true });

        if (error) {
            console.error('Error fetching current series:', error);
            return [];
        }
        return data || [];
    }

    async getTopicSeries() {
        const { data, error } = await this.supabase
            .from('topicSeries')
            .select('*')
            .order('sequence', { ascending: true });
        return data || [];
    }
}
