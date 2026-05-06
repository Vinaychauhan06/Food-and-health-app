// Global State
window.appState = {
    voiceEnabled: false,
    user: null,
    roadmap: null
};

// --- View Management ---
const viewLogin = document.getElementById('view-login');
const viewOnboarding = document.getElementById('view-onboarding');
const viewDashboard = document.getElementById('view-dashboard');

function showView(viewElement) {
    [viewLogin, viewOnboarding, viewDashboard].forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    viewElement.classList.remove('hidden');
    viewElement.classList.add('active');
}

// --- Login & Onboarding Logic ---
const btnLogin = document.getElementById('btn-login');
const btnFinishOnboarding = document.getElementById('btn-finish-onboarding');
const btnLogout = document.getElementById('btn-logout');

btnLogin.addEventListener('click', () => {
    // Mock Login - move straight to onboarding
    const email = document.getElementById('login-email').value;
    if(email) {
        window.appState.user = { email };
        showView(viewOnboarding);
    }
});

btnFinishOnboarding.addEventListener('click', () => {
    // Gather contextual data to build the roadmap
    const goal = document.getElementById('ob-goal').value;
    const diet = document.getElementById('ob-diet').value;
    const age = document.getElementById('ob-age').value;
    
    window.appState.roadmap = { goal, diet, age, progress: 25 };
    
    // Update Dashboard UI
    const goalText = goal === 'weight_loss' ? "Fat Loss Journey" : (goal === 'muscle_gain' ? "Muscle Building" : "Fitness Maintenance");
    document.getElementById('user-goal-display').innerText = goalText;
    
    // Update Progress Bar
    document.getElementById('progress-bar').style.width = '25%';
    
    showView(viewDashboard);
});

btnLogout.addEventListener('click', () => {
    window.appState.user = null;
    window.appState.roadmap = null;
    showView(viewLogin);
});

// --- Dashboard AI Logic ---
const msgPanel = document.getElementById('system-message');
const loadingIndicator = document.getElementById('loading-indicator');
const futureSelfContainer = document.getElementById('future-self-container');
const futureSelfImage = document.getElementById('future-self-image');
const futureSelfMotivation = document.getElementById('future-self-motivation');

const photoInput = document.getElementById('water-photo-input');
const bodyPhotoInput = document.getElementById('body-photo-input');
const groceryPhotoInput = document.getElementById('grocery-photo-input');

function showMessage(text, isError = false) {
    msgPanel.innerHTML = text;
    msgPanel.style.color = isError ? 'var(--secondary)' : 'var(--text-main)';
    if (window.appState.voiceEnabled && window.speak) {
        window.speak(text.replace(/<[^>]*>?/gm, ''));
    }
}

function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}

function advanceProgress() {
    if (!window.appState.roadmap) return;
    let newProgress = window.appState.roadmap.progress + 25;
    if (newProgress > 100) newProgress = 100;
    
    window.appState.roadmap.progress = newProgress;
    document.getElementById('progress-bar').style.width = `${newProgress}%`;
    
    if (newProgress >= 50) document.getElementById('ms-2').classList.add('active');
    if (newProgress >= 75) document.getElementById('ms-3').classList.add('active');
    if (newProgress >= 100) document.getElementById('ms-4').classList.add('active');
}

// --- API Calls ---
async function fetchContextualHack() {
    showMessage("Locating coordinates...");
    showLoading(true);
    try {
        const response = await fetch('/api/v1/hacks/contextual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: 40.7128, longitude: -74.0060 })
        });
        const data = await response.json();
        showLoading(false);
        if (response.ok) {
            showMessage(`<strong>${data.suggestion}</strong><br><span style="color:var(--text-muted)">${data.recipe_or_hack}</span>`);
            advanceProgress();
        } else {
            showMessage(`Error: ${data.detail}`, true);
        }
    } catch (error) { showLoading(false); showMessage(`Network error: ${error.message}`, true); }
}

async function handleWaterPhoto(event) {
    if (!event.target.files[0]) return;
    showMessage("Analyzing image with Gemini...");
    showLoading(true);
    const formData = new FormData();
    formData.append("file", event.target.files[0]);

    try {
        const response = await fetch('/api/v1/water/estimate', { method: 'POST', body: formData });
        const data = await response.json();
        showLoading(false);
        if (response.ok) {
            showMessage(`<strong>Estimated: ${data.estimated_ml} ml</strong><br><span style="color:var(--text-muted)">${data.message}</span>`);
            advanceProgress();
        } else { showMessage(`Error: ${data.detail}`, true); }
    } catch (error) { showLoading(false); showMessage(`Network error: ${error.message}`, true); }
}

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
            advanceProgress();
        } else { showMessage(`Motivation Error: ${data.detail}`, true); }
    } catch (error) { showMessage(`Network error: ${error.message}`, true); }
}

async function handleBodyPhoto(event) {
    if (!event.target.files[0]) return;
    showMessage("Analyzing body shape...");
    showLoading(true);
    futureSelfContainer.style.display = 'none';
    const formData = new FormData();
    formData.append("file", event.target.files[0]);

    try {
        const response = await fetch('/api/v1/vision/analyze', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok) {
            showMessage(`<strong>Health Estimate: ${data.health_state_estimate}</strong><br><span style="color:var(--text-muted)">Face Shape: ${data.face_shape} | Recommendation: ${data.recommendation}</span>`);
            await fetchFutureSelf(data);
        } else { showMessage(`Error: ${data.detail}`, true); }
        showLoading(false);
    } catch (error) { showLoading(false); showMessage(`Network error: ${error.message}`, true); }
}

async function handleGroceryPhoto(event) {
    if (!event.target.files[0]) return;
    showMessage("Verifying groceries against Healthy Roadmap...");
    showLoading(true);
    futureSelfContainer.style.display = 'none';
    const formData = new FormData();
    formData.append("file", event.target.files[0]);
    formData.append("healthy_roadmap", window.appState.roadmap ? window.appState.roadmap.diet : "Oats, Apples, Spinach");

    try {
        const response = await fetch('/api/v1/vision/grocery', { method: 'POST', body: formData });
        const data = await response.json();
        showLoading(false);
        if (response.ok) {
            showMessage(`<strong>Status: ${data.verification_status}</strong><br><span style="color:var(--text-muted)">${data.message}</span>`);
            advanceProgress();
        } else { showMessage(`Error: ${data.detail}`, true); }
    } catch (error) { showLoading(false); showMessage(`Network error: ${error.message}`, true); }
}

// --- Event Listeners ---
document.getElementById('btn-hack').addEventListener('click', () => fetchContextualHack());
document.getElementById('btn-water').addEventListener('click', () => photoInput.click());
document.getElementById('btn-body').addEventListener('click', () => bodyPhotoInput.click());
document.getElementById('btn-grocery').addEventListener('click', () => groceryPhotoInput.click());

photoInput.addEventListener('change', handleWaterPhoto);
bodyPhotoInput.addEventListener('change', handleBodyPhoto);
groceryPhotoInput.addEventListener('change', handleGroceryPhoto);

// Voice Hooks
window.triggerHackAction = fetchContextualHack;
window.triggerWaterAction = () => photoInput.click();
window.triggerBodyAction = () => bodyPhotoInput.click();
window.triggerGroceryAction = () => groceryPhotoInput.click();
