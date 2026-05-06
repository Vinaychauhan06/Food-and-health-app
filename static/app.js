// Global state
window.appState = {
    voiceEnabled: false,
    noseEnabled: false
};

// UI Elements
const msgPanel = document.getElementById('system-message');
const loadingIndicator = document.getElementById('loading-indicator');
const btnWater = document.getElementById('btn-water');
const btnHack = document.getElementById('btn-hack');
const photoInput = document.getElementById('water-photo-input');

// --- Helper Functions ---
function showMessage(text, isError = false) {
    msgPanel.innerHTML = text;
    msgPanel.style.color = isError ? 'var(--secondary)' : 'var(--text-main)';
    
    // Auto speak if voice is enabled
    if (window.appState.voiceEnabled && window.speak) {
        // Strip HTML tags for speaking
        const plainText = text.replace(/<[^>]*>?/gm, '');
        window.speak(plainText);
    }
}

function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// --- API Calls ---
async function fetchContextualHack() {
    showMessage("Locating coordinates...");
    showLoading(true);
    
    try {
        // Mocking user location for demo purposes (usually requires Geolocation API)
        const requestData = {
            latitude: 40.7128, 
            longitude: -74.0060 
        };

        const response = await fetch('/api/v1/hacks/contextual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        showLoading(false);
        
        if (response.ok) {
            showMessage(`<strong>${data.suggestion}</strong><br><span style="color:var(--text-muted)">${data.recipe_or_hack}</span>`);
        } else {
            showMessage(`Error: ${data.detail}`, true);
        }
    } catch (error) {
        showLoading(false);
        showMessage(`Network error: ${error.message}`, true);
    }
}

async function handleWaterPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    showMessage("Analyzing image with Gemini...");
    showLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch('/api/v1/water/estimate', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);
        
        if (response.ok) {
            showMessage(`<strong>Estimated: ${data.estimated_ml} ml</strong><br><span style="color:var(--text-muted)">${data.message}</span>`);
        } else {
            showMessage(`Error: ${data.detail}`, true);
        }
    } catch (error) {
        showLoading(false);
        showMessage(`Network error: ${error.message}`, true);
    }
}

// --- Event Listeners ---
btnHack.addEventListener('click', () => {
    fetchContextualHack();
});

btnWater.addEventListener('click', () => {
    // Programmatically open file dialog
    photoInput.click();
});

photoInput.addEventListener('change', handleWaterPhoto);

// Provide global access for Voice Engine to trigger actions
window.triggerHackAction = fetchContextualHack;
window.triggerWaterAction = () => photoInput.click();
