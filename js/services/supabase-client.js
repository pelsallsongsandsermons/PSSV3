import { CONFIG } from '../config.js';

export class SupabaseService {
    constructor() {
        if (!window.supabase) {
            console.error('Supabase library not loaded');
            return;
        }

        this.client = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
        console.log('Supabase Initialized');
    }

    getClient() {
        return this.client;
    }
}
