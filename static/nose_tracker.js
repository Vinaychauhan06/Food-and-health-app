const video = document.getElementById('webcam');
const noseCursor = document.getElementById('nose-cursor');
const noseToggleBtn = document.getElementById('nose-toggle');
const noseStatus = document.getElementById('nose-status');
const interactiveElements = document.querySelectorAll('.interactive-btn');

let detector;
let trackingLoop;
let isTracking = false;

// Dwell click configuration
const DWELL_TIME_MS = 2000;
let dwellTimer = null;
let currentHoveredElement = null;

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false,
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    } catch (e) {
        console.error("Camera access error:", e);
        if (window.speak) window.speak("Camera access is required for nose tracking.");
        throw e;
    }
}

async function initFaceDetection() {
    if (!detector) {
        document.getElementById('system-message').innerText = "Loading AI models...";
        await tf.setBackend('webgl');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
            runtime: 'tfjs',
        };
        detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    }
    return detector;
}

function checkHover(cursorX, cursorY) {
    // Hide cursor temporarily to use elementFromPoint
    noseCursor.style.display = 'none';
    const element = document.elementFromPoint(cursorX, cursorY);
    noseCursor.style.display = 'block';

    let foundInteractive = false;

    if (element) {
        // Find closest parent that is an interactive button
        const interactiveBtn = element.closest('.interactive-btn');
        
        if (interactiveBtn) {
            foundInteractive = true;
            if (currentHoveredElement !== interactiveBtn) {
                // Hover entered a new element
                clearTimeout(dwellTimer);
                currentHoveredElement = interactiveBtn;
                interactiveBtn.classList.add('hovered');
                
                // Start dwell timer
                dwellTimer = setTimeout(() => {
                    // Trigger click
                    noseCursor.classList.add('dwelling');
                    interactiveBtn.click();
                    if (window.speak) window.speak("Clicked");
                    
                    setTimeout(() => {
                        noseCursor.classList.remove('dwelling');
                    }, 500);
                }, DWELL_TIME_MS);
            }
        }
    }

    if (!foundInteractive && currentHoveredElement) {
        // Hover left
        clearTimeout(dwellTimer);
        currentHoveredElement.classList.remove('hovered');
        currentHoveredElement = null;
        noseCursor.classList.remove('dwelling');
    }
}

async function trackFace() {
    if (!isTracking) return;

    try {
        const faces = await detector.estimateFaces(video);
        
        if (faces.length > 0) {
            // Index 4 is generally the tip of the nose in MediaPipe Face Mesh
            const noseTip = faces[0].keypoints[4];
            
            // Map video coordinates to screen coordinates
            // Assuming video is mirrored, so we invert X
            const videoRatioX = noseTip.x / video.videoWidth;
            const videoRatioY = noseTip.y / video.videoHeight;
            
            // Map to window size
            const cursorX = window.innerWidth - (videoRatioX * window.innerWidth);
            const cursorY = videoRatioY * window.innerHeight;

            // Move cursor
            noseCursor.style.left = `${cursorX}px`;
            noseCursor.style.top = `${cursorY}px`;
            
            checkHover(cursorX, cursorY);
        }
    } catch (e) {
        console.error("Tracking error:", e);
    }

    trackingLoop = requestAnimationFrame(trackFace);
}

async function startTracking() {
    noseToggleBtn.classList.add('active');
    noseStatus.innerText = 'WAITING';
    
    try {
        await setupCamera();
        await initFaceDetection();
        
        isTracking = true;
        window.appState.noseEnabled = true;
        video.play();
        noseCursor.style.display = 'block';
        
        noseStatus.innerText = 'ON';
        if (window.speak) window.speak("Nose tracking activated.");
        document.getElementById('system-message').innerText = "Move your head to control the cursor. Hover over a button for 2 seconds to click.";
        
        trackFace();
    } catch (e) {
        stopTracking();
    }
}

function stopTracking() {
    isTracking = false;
    window.appState.noseEnabled = false;
    cancelAnimationFrame(trackingLoop);
    clearTimeout(dwellTimer);
    
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    noseCursor.style.display = 'none';
    noseStatus.innerText = 'OFF';
    noseToggleBtn.classList.remove('active');
    
    if (currentHoveredElement) {
        currentHoveredElement.classList.remove('hovered');
        currentHoveredElement = null;
    }
    
    if (window.speak) window.speak("Nose tracking deactivated.");
}

noseToggleBtn.addEventListener('click', () => {
    if (isTracking) {
        stopTracking();
    } else {
        startTracking();
    }
});
