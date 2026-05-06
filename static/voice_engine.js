// Voice Synthesis (Text-to-Speech)
window.speak = function(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }
};

// Voice Recognition (Speech-to-Text)
const voiceToggleBtn = document.getElementById('voice-toggle');
const voiceStatus = document.getElementById('voice-status');

let recognition;
let isListening = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        voiceStatus.innerText = 'ON';
        voiceToggleBtn.classList.add('active');
        window.speak("Voice Access Activated. Say 'Check Water' or 'Get Hack'.");
        document.getElementById('system-message').innerText = "Listening for voice commands...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Voice heard:", transcript);

        if (transcript.includes('hack') || transcript.includes('meal')) {
            window.speak("Checking location for healthy hack.");
            if (window.triggerHackAction) window.triggerHackAction();
        } else if (transcript.includes('water') || transcript.includes('photo')) {
            window.speak("Opening file selector for water check.");
            if (window.triggerWaterAction) window.triggerWaterAction();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
            window.speak("Microphone permission denied.");
            stopVoice();
        }
    };

    recognition.onend = () => {
        // Auto-restart if it shouldn't have stopped
        if (isListening && window.appState.voiceEnabled) {
            recognition.start();
        }
    };
} else {
    voiceToggleBtn.style.display = 'none';
    console.warn("Speech Recognition API not supported in this browser.");
}

function startVoice() {
    if (recognition) {
        window.appState.voiceEnabled = true;
        recognition.start();
    }
}

function stopVoice() {
    if (recognition) {
        window.appState.voiceEnabled = false;
        isListening = false;
        recognition.stop();
        voiceStatus.innerText = 'OFF';
        voiceToggleBtn.classList.remove('active');
        window.speak("Voice Access Deactivated.");
    }
}

voiceToggleBtn.addEventListener('click', () => {
    if (window.appState.voiceEnabled) {
        stopVoice();
    } else {
        startVoice();
    }
});
