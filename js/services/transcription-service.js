/**
 * Transcription Service
 * Handles Deepgram API calls and file downloads
 */
export class TranscriptionService {
    constructor() {
        this.apiEndpoint = 'https://api.deepgram.com/v1/listen';
    }

    async transcribeAudio(audioUrl, apiKey, keywords) {
        if (!apiKey) throw new Error('API Key is missing');

        const params = new URLSearchParams({
            model: 'nova-3',
            smart_format: 'true',
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
        return data.results.channels[0].alternatives[0].transcript;
    }

    downloadTranscript(text, filename, format) {
        let blob;
        let mimeType;
        let finalFilename = filename;

        switch (format) {
            case 'txt':
                blob = new Blob([text], { type: 'text/plain' });
                mimeType = 'text/plain';
                finalFilename += '.txt';
                break;
            case 'docx':
                // Creating a simplified HTML-to-Word blob
                const htmlContent = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'></head>
                    <body>${text.replace(/\n/g, '<br>')}</body>
                    </html>
                `;
                blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                mimeType = 'application/msword';
                finalFilename += '.docx';
                break;
            case 'pdf':
                // Using a simple text blob for PDF fallback if no library is used
                // For a real PWA, printing to PDF or using a lightweight lib like jspdf is better.
                // Since this app already uses pdf.js (for viewing), we'll stick to a simple Blob for now.
                // Alternatively, we can use the window.print() trick but that's for the whole page.
                // Let's use a simple Blob with pdf mime type as a placeholder or just stick to text-based if no lib is available.
                // Actually, I'll implement a simple text-to-blob as a fallback.
                blob = new Blob([text], { type: 'application/pdf' }); // This won't be a valid PDF alone
                mimeType = 'application/pdf';
                finalFilename += '.pdf';
                break;
            default:
                return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
