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

    async transcribeAudio(audioUrl, apiKey, keywords, includeParagraphs = true) {
        if (!apiKey) throw new Error('API Key is missing');

        const params = new URLSearchParams({
            model: 'nova-3',
            smart_format: 'true',
            paragraphs: includeParagraphs ? 'true' : 'false',
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

    downloadTranscript(text, filename, format, isEnhanced = false) {
        let blob;
        let finalFilename = filename;

        // Convert markdown headings to plain text with indicators for txt format
        const markdownToPlainText = (md) => {
            return md
                .replace(/^## (.+)$/gm, '\n--- $1 ---\n')  // H2 to dashed title
                .replace(/^# (.+)$/gm, '\n=== $1 ===\n')   // H1 to double dashed
                .replace(/\*\*(.+?)\*\*/g, '$1')            // Bold
                .replace(/\*(.+?)\*/g, '$1');               // Italic
        };

        // Convert markdown to HTML
        const markdownToHtml = (md) => {
            if (typeof marked !== 'undefined') {
                return marked.parse(md);
            }
            // Fallback simple conversion
            return md
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
        };

        switch (format) {
            case 'txt':
                const txtContent = isEnhanced ? markdownToPlainText(text) : text;
                blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
                finalFilename += '.txt';
                break;

            case 'docx':
                // Create an HTML-based Word document with formatting
                const bodyContent = isEnhanced ? markdownToHtml(text) : text.replace(/\n/g, '<br>');
                const htmlContent = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head>
                        <meta charset='utf-8'>
                        <style>
                            body { font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.6; }
                            h1 { font-size: 18pt; color: #333; margin-top: 20pt; margin-bottom: 10pt; }
                            h2 { font-size: 14pt; color: #555; margin-top: 16pt; margin-bottom: 8pt; }
                            p { margin-bottom: 10pt; }
                            blockquote { 
                                border-left: 3pt solid #6c5ce7; 
                                padding-left: 10pt; 
                                margin-left: 0; 
                                font-style: italic; 
                                color: #666; 
                            }
                        </style>
                    </head>
                    <body>${bodyContent}</body>
                    </html>
                `;
                blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                finalFilename += '.doc';
                break;

            case 'pdf':
                if (typeof window.jspdf === 'undefined') {
                    alert('PDF library not loaded. Please try again or use .txt format.');
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 15;
                const maxWidth = pageWidth - (margin * 2);
                let y = margin;
                const pageHeight = doc.internal.pageSize.getHeight();

                // Parse markdown for PDF
                const pdfLines = text.split('\n');

                for (const line of pdfLines) {
                    let fontSize = 12;
                    let lineText = line;
                    let isBold = false;
                    let isItalic = false;
                    let isQuote = false;

                    // Detect headings
                    if (line.startsWith('## ')) {
                        fontSize = 14;
                        lineText = line.substring(3);
                        isBold = true;
                        y += 5;
                    } else if (line.startsWith('# ')) {
                        fontSize = 16;
                        lineText = line.substring(2);
                        isBold = true;
                        y += 8;
                    } else if (line.startsWith('> ')) {
                        lineText = line.substring(2);
                        isItalic = true;
                        isQuote = true;
                    }

                    doc.setFontSize(fontSize);
                    if (isBold && isItalic) doc.setFont('helvetica', 'bolditalic');
                    else if (isBold) doc.setFont('helvetica', 'bold');
                    else if (isItalic) doc.setFont('helvetica', 'italic');
                    else doc.setFont('helvetica', 'normal');

                    const currentMargin = isQuote ? margin + 10 : margin;
                    const currentMaxWidth = isQuote ? maxWidth - 10 : maxWidth;
                    const wrappedLines = doc.splitTextToSize(lineText, currentMaxWidth);
                    const lineHeight = fontSize * 0.6;

                    if (isQuote) {
                        doc.setDrawColor(108, 92, 231); // Accent color
                        doc.setLineWidth(1);
                    }

                    for (const wrappedLine of wrappedLines) {
                        if (y + lineHeight > pageHeight - margin) {
                            doc.addPage();
                            y = margin;
                        }

                        if (isQuote) {
                            doc.line(margin + 2, y - (lineHeight * 0.8), margin + 2, y + (lineHeight * 0.2));
                        }

                        doc.text(wrappedLine, currentMargin, y);
                        y += lineHeight;
                    }

                    // Add space after paragraphs
                    if (line === '') {
                        y += 3;
                    }
                }

                doc.save(filename + '.pdf');
                return;

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
