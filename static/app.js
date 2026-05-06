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

const btnBody = document.getElementById('btn-body');
const btnGrocery = document.getElementById('btn-grocery');
const bodyPhotoInput = document.getElementById('body-photo-input');
const groceryPhotoInput = document.getElementById('grocery-photo-input');
const futureSelfContainer = document.getElementById('future-self-container');
const futureSelfImage = document.getElementById('future-self-image');
const futureSelfMotivation = document.getElementById('future-self-motivation');

async function fetchFutureSelf(bodyAnalysisData) {
    showMessage("Simulating Future Self (Lalach Dashboard)...");
    
    try {
        const response = await fetch('/api/v1/motivation/future-self', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyAnalysisData)
        });

        const data = await response.json();
        
        if (response.ok) {
            futureSelfImage.src = data.image_url;
            futureSelfMotivation.innerText = data.motivation_message;
            futureSelfContainer.style.display = 'block';
            showMessage("Analysis complete. See your future self below!");
        } else {
            showMessage(`Motivation Error: ${data.detail}`, true);
        }
    } catch (error) {
        showMessage(`Network error: ${error.message}`, true);
    }
}

async function handleBodyPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    showMessage("Analyzing body shape...");
    showLoading(true);
    futureSelfContainer.style.display = 'none';

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch('/api/v1/vision/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage(`<strong>Health Estimate: ${data.health_state_estimate}</strong><br><span style="color:var(--text-muted)">Face Shape: ${data.face_shape} | Recommendation: ${data.recommendation}</span>`);
            
            // Automatically trigger Lalach Dashboard
            await fetchFutureSelf(data);
        } else {
            showMessage(`Error: ${data.detail}`, true);
        }
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showMessage(`Network error: ${error.message}`, true);
    }
}

async function handleGroceryPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    showMessage("Verifying groceries against Healthy Roadmap...");
    showLoading(true);
    futureSelfContainer.style.display = 'none';

    const formData = new FormData();
    formData.append("file", file);
    formData.append("healthy_roadmap", "Oats, Apples, Spinach, Almonds, Lentils");

    try {
        const response = await fetch('/api/v1/vision/grocery', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);
        
        if (response.ok) {
            showMessage(`<strong>Status: ${data.verification_status}</strong><br><span style="color:var(--text-muted)">${data.message}</span>`);
        } else {
            showMessage(`Error: ${data.detail}`, true);
        }
    } catch (error) {
        showLoading(false);
        showMessage(`Network error: ${error.message}`, true);
    }
}

// --- Event Listeners ---
btnHack.addEventListener('click', () => fetchContextualHack());
btnWater.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', handleWaterPhoto);

btnBody.addEventListener('click', () => bodyPhotoInput.click());
bodyPhotoInput.addEventListener('change', handleBodyPhoto);

btnGrocery.addEventListener('click', () => groceryPhotoInput.click());
groceryPhotoInput.addEventListener('change', handleGroceryPhoto);

// Provide global access for Voice Engine to trigger actions
window.triggerHackAction = fetchContextualHack;
window.triggerWaterAction = () => photoInput.click();
window.triggerBodyAction = () => bodyPhotoInput.click();
window.triggerGroceryAction = () => groceryPhotoInput.click();
