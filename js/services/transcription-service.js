/**
 * Transcription Service
 * Handles Deepgram API calls, file downloads, and IndexedDB storage
 */
export class TranscriptionService {
    constructor() {
        this.apiEndpoint = 'https://api.deepgram.com/v1/listen';
        this.dbName = 'TranscriptionsDB';
        this.storeName = 'transcripts';
        this.db = null;
    }

    async initDB() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'slug' });
                }
            };
        });
    }

    async saveTranscript(slug, text) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ slug, text, savedAt: new Date().toISOString() });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getTranscript(slug) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(slug);

            request.onsuccess = () => resolve(request.result?.text || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTranscript(slug) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(slug);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async transcribeAudio(audioUrl, apiKey, keywords) {
        if (!apiKey) throw new Error('API Key is missing');

        const params = new URLSearchParams({
            model: 'nova-3',
            smart_format: 'true',
            paragraphs: 'true',
            keyterm: keywords || ''
        });

        const response = await fetch(`${this.apiEndpoint}?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: audioUrl })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.err_msg || 'Transcription failed');
        }

        const data = await response.json();

        // Check if paragraphs are available in the response
        if (data.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs) {
            // Extract text from paragraph structure with line breaks between paragraphs
            const paragraphs = data.results.channels[0].alternatives[0].paragraphs.paragraphs;
            return paragraphs.map(p =>
                p.sentences.map(s => s.text).join(' ')
            ).join('\n\n');
        }

        // Fallback to simple transcript if paragraphs not available
        return data.results.channels[0].alternatives[0].transcript;
    }

    downloadTranscript(text, filename, format) {
        let blob;
        let finalFilename = filename;

        switch (format) {
            case 'txt':
                blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                finalFilename += '.txt';
                break;

            case 'docx':
                // Create an HTML-based Word document (.doc format, opens in Word)
                const htmlContent = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head>
                        <meta charset='utf-8'>
                        <style>body { font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.5; }</style>
                    </head>
                    <body>${text.replace(/\n/g, '<br>')}</body>
                    </html>
                `;
                blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                finalFilename += '.doc'; // Using .doc for clarity (HTML-based Word format)
                break;

            case 'pdf':
                // Use jsPDF library for proper PDF generation
                if (typeof window.jspdf === 'undefined') {
                    alert('PDF library not loaded. Please try again or use .txt format.');
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Split text into lines that fit the page width
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 15;
                const maxWidth = pageWidth - (margin * 2);
                const lines = doc.splitTextToSize(text, maxWidth);

                // Add text with automatic page breaks
                let y = margin;
                const lineHeight = 7;
                const pageHeight = doc.internal.pageSize.getHeight();

                for (let i = 0; i < lines.length; i++) {
                    if (y + lineHeight > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.text(lines[i], margin, y);
                    y += lineHeight;
                }

                doc.save(filename + '.pdf');
                return; // jsPDF handles download directly

            default:
                return;
        }

        // Download for txt and docx
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
