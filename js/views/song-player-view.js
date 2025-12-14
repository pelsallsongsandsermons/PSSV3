import { DataService } from '../services/data-service.js';

export default {
    render: async (params) => {
        const title = decodeURIComponent(params.get('title') || '');
        const dataService = new DataService();
        // Since we don't have a direct "getSongByTitle" method yet, we'll fetch all and find it. 
        // Optimization: Add getSongByTitle to DataService later.
        const songs = await dataService.getSongs();
        const foundSong = songs.find(s => s.songTitle.trim().toLowerCase() === title.trim().toLowerCase());
        // Use the found object, even if casing was slightly different
        const song = foundSong;

        if (!song) {
            return `<div class="view"><p class="error-msg">Song not found</p></div>`;
        }

        // Helper to get property case-insensitively
        const getProp = (obj, key) => {
            if (!obj) return undefined;
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
            return foundKey ? obj[foundKey] : undefined;
        }

        console.log('DEBUG: Full Song Object:', song);
        console.log('DEBUG: lyricsUrl:', getProp(song, 'lyricsUrl'));
        console.log('DEBUG: youtube_url:', getProp(song, 'youtube_url'));

        const lyricsUrl = getProp(song, 'lyricsUrl');
        const youtubeUrl = getProp(song, 'youtube_url');

        // --- 1. Lyrics (Google Slides) ---
        // Expected format: https://docs.google.com/presentation/d/[FILE_ID]/... OR just [FILE_ID]
        let slideEmbedUrl = '';
        let fileId = '';
        if (lyricsUrl) {
            // Check if it's a URL or just an ID
            if (lyricsUrl.includes('docs.google.com') && lyricsUrl.includes('/d/')) {
                const match = lyricsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    fileId = match[1];
                }
            } else {
                // Assume the field contains the raw File ID
                fileId = lyricsUrl.trim();
            }

            if (fileId) {
                // Removing rm=minimal to show controls (Previous/Next buttons)
                // This allows the user to go back, which isn't possible via swipe on the iframe.
                slideEmbedUrl = `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false`;
            }
        }

        // --- 2. YouTube ---
        // User confirmed 'youtube_url' column contains the Video ID (e.g., "DswWiHUwYjw")
        let videoId = '';
        if (youtubeUrl && youtubeUrl !== 'emptyUrl') {
            videoId = youtubeUrl.trim();
        }

        const start = song.startAt || 0;
        const end = song.endAt || '';

        // Launch URL for external app
        const launchUrl = videoId
            ? `https://www.youtube.com/watch?v=${videoId}${song.startAt ? `&t=${song.startAt}s` : ''}`
            : '#';

        return `
            <div class="view song-player-view">
                <!-- Header -->
                <!-- Header Removed (Using Global Header) -->

                <!-- Song Title Banner -->
                <div class="song-banner">
                    <h2>${song.songTitle.toUpperCase()}</h2>
                </div>

                <!-- Lyrics/Slides Container -->
                <div class="lyrics-container">
                    ${fileId ? `
                        <div class="slide-wrapper" id="slide-wrapper-container" data-file-id="${fileId}">
                             <canvas id="pdf-canvas" style="width: 100%; display: block;"></canvas>
                             <div id="pdf-loading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666;">
                                Loading Slides...
                             </div>
                             
                             <div class="pdf-controls-container">
                                <button id="prev-slide-btn" class="slide-nav-btn prev">❮</button>
                                <button id="next-slide-btn" class="slide-nav-btn next">❯</button>
                             </div>
                        </div>
                    ` : '<div class="no-content">No lyrics available</div>'}
                    
                    <div class="attribution-box">
                        <p>${song.copyRight || 'Copyright info not available'}</p>
                    </div>
                </div>

                <!-- YouTube Container -->
                <div class="youtube-container">
                    ${videoId ? `
                        <div id="yt-player-placeholder" 
                             data-video-id="${videoId}" 
                             data-start="${start}" 
                             data-end="${end}">
                        </div>
                         <a href="${launchUrl}" target="_blank" class="yt-launch-btn">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : '<div class="no-content">No video available</div>'}
                </div>
            </div>
        `;
    },
    afterRender: async () => {
        // 1. Update Header
        const headerTitle = document.querySelector('#main-header h1');
        if (headerTitle) headerTitle.textContent = 'Song Player';

        // 2. Hide Footer and Pause Audio
        if (window.app.player && window.app.player.audio) window.app.player.audio.pause();
        const footer = document.getElementById('player-footer');
        if (footer) footer.classList.add('hidden');

        // 3. YouTube API Logic
        const ytPlaceholder = document.getElementById('yt-player-placeholder');
        if (ytPlaceholder) {
            const videoId = ytPlaceholder.dataset.videoId;
            const start = parseInt(ytPlaceholder.dataset.start) || 0;
            const end = parseInt(ytPlaceholder.dataset.end) || undefined;

            if (videoId) {
                // Define the init function
                const initPlayer = () => {
                    new YT.Player('yt-player-placeholder', {
                        height: '100%',
                        width: '100%',
                        videoId: videoId,
                        playerVars: {
                            'playsinline': 1,
                            'autoplay': 1,
                            'start': start,
                            'end': end
                        },
                        events: {
                            'onStateChange': (event) => {
                                // YT.PlayerState.ENDED is 0
                                if (event.data === 0) {
                                    console.log('Video ended. Navigating back.');
                                    // Use router history or window.history
                                    window.history.back();
                                }
                            }
                        }
                    });
                };

                // Load API if not present
                if (!window.YT) {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                    // API will call this global function when ready
                    window.onYouTubeIframeAPIReady = () => {
                        initPlayer();
                    };
                } else if (window.YT && window.YT.Player) {
                    // API already loaded
                    initPlayer();
                }
            }
        }

        // 4. PDF Logic
        const slideWrapper = document.getElementById('slide-wrapper-container');
        const canvas = document.getElementById('pdf-canvas');
        const loadingIndicator = document.getElementById('pdf-loading');
        const prevBtn = document.getElementById('prev-slide-btn');
        const nextBtn = document.getElementById('next-slide-btn');

        if (!slideWrapper || !canvas) return;

        const fileId = slideWrapper.dataset.fileId;
        if (!fileId) {
            console.log("No file ID found for PDF, skipping PDF logic.");
            return;
        }

        // Load PDF.js library if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                console.log('PDF.js loaded dynamically.');
                // Set worker source after PDF.js is loaded
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                initPdfViewer(fileId, canvas, loadingIndicator, prevBtn, nextBtn, slideWrapper);
            };
            script.onerror = () => console.error('Failed to load PDF.js');
            document.head.appendChild(script);
        } else {
            console.log('PDF.js already loaded.');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            initPdfViewer(fileId, canvas, loadingIndicator, prevBtn, nextBtn, slideWrapper);
        }

        async function initPdfViewer(fileId, canvas, loadingIndicator, prevBtn, nextBtn, slideWrapper) {
            const googleDocsPdfUrl = `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
            const ctx = canvas.getContext('2d');

            let pdfDoc = null;
            let pageNum = 1;
            let pageRendering = false;
            let pageNumPending = null;

            /**
             * Get page info from document, resize canvas accordingly, and render page.
             * @param num Page number.
             */
            async function renderPage(num) {
                pageRendering = true;
                loadingIndicator.style.display = 'block'; // Show loading indicator

                // Using a try-catch for rendering to handle potential errors
                try {
                    const page = await pdfDoc.getPage(num);
                    const viewport = page.getViewport({ scale: 1 });

                    // Calculate scale to fit the canvas within the wrapper
                    const wrapperWidth = slideWrapper.clientWidth;
                    const wrapperHeight = slideWrapper.clientHeight;

                    let scale = 1;
                    if (viewport.width > wrapperWidth || viewport.height > wrapperHeight) {
                        scale = Math.min(wrapperWidth / viewport.width, wrapperHeight / viewport.height);
                    }

                    // If the viewport is smaller than the wrapper, scale up to fill width
                    if (viewport.width * scale < wrapperWidth && viewport.height * scale < wrapperHeight) {
                        scale = wrapperWidth / viewport.width;
                    }

                    const scaledViewport = page.getViewport({ scale: scale });

                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;

                    const renderContext = {
                        canvasContext: ctx,
                        viewport: scaledViewport,
                    };
                    await page.render(renderContext).promise;
                    pageRendering = false;
                    loadingIndicator.style.display = 'none'; // Hide loading indicator

                    if (pageNumPending !== null) {
                        // New page rendering is pending
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                } catch (error) {
                    console.error('Error rendering PDF page:', error);
                    loadingIndicator.style.display = 'none'; // Hide loading indicator on error
                    // Optionally display an error message on the canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = "20px Arial";
                    ctx.fillStyle = "red";
                    ctx.textAlign = "center";
                    ctx.fillText("Error loading page", canvas.width / 2, canvas.height / 2);
                }
            }

            /**
             * If another page rendering is pending, waits until the
             * current page rendering is finished. Otherwise, executes rendering immediately.
             */
            function queueRenderPage(num) {
                if (pageRendering) {
                    pageNumPending = num;
                } else {
                    renderPage(num);
                }
            }

            /**
             * Displays previous page.
             */
            function onPrevPage() {
                if (pageNum <= 1) {
                    return;
                }
                pageNum--;
                queueRenderPage(pageNum);
            }

            /**
             * Displays next page.
             */
            function onNextPage() {
                if (pageNum >= pdfDoc.numPages) {
                    return;
                }
                pageNum++;
                queueRenderPage(pageNum);
            }

            // Event listeners for buttons
            if (prevBtn) prevBtn.addEventListener('click', onPrevPage);
            if (nextBtn) nextBtn.addEventListener('click', onNextPage);

            // Load the PDF document
            try {
                loadingIndicator.style.display = 'block';
                const pdf = await pdfjsLib.getDocument(googleDocsPdfUrl).promise;
                pdfDoc = pdf;
                loadingIndicator.style.display = 'none';
                renderPage(pageNum);
            } catch (error) {
                console.error('Error loading PDF document:', error);
                loadingIndicator.style.display = 'none';
                canvas.style.display = 'none'; // Hide canvas on error
                if (slideWrapper) {
                    slideWrapper.innerHTML = '<div class="no-content">Failed to load lyrics PDF.</div>';
                }
            }

            // Swipe gesture for navigation
            let touchStartX = 0;
            let touchEndX = 0;
            const minSwipeDistance = 50; // pixels

            slideWrapper.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchEndX = 0; // Reset end position
            }, { passive: true });

            slideWrapper.addEventListener('touchmove', (e) => {
                touchEndX = e.changedTouches[0].screenX;
            }, { passive: true });

            slideWrapper.addEventListener('touchend', () => {
                if (!touchStartX || !touchEndX) return;

                const swipeDistance = touchEndX - touchStartX;

                // Swipe Left (drag finger left) -> Next Page (Legacy App behavior)
                // Swipe Right (drag finger right) -> Previous Page

                if (swipeDistance > minSwipeDistance) {
                    // Swiped Right -> Previous Page
                    onPrevPage();
                } else if (swipeDistance < -minSwipeDistance) {
                    // Swiped Left -> Next Page
                    onNextPage();
                }
                // Reset touch positions
                touchStartX = 0;
                touchEndX = 0;
            });

            // Handle window resize to re-render page with correct scaling
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (pdfDoc) {
                        renderPage(pageNum);
                    }
                }, 200); // Debounce resize event
            });
        }
    }
}

