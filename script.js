// Initialize WebSocket connection
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.hostname === 'taskdev.netlify.app' ? 'taskdev.netlify.app' : window.location.hostname}${window.location.hostname === 'localhost' ? ':3000' : ''}/ws`;
let ws = null;

// Authentication state
let currentUser = null;
let authToken = null;

// Login function
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        authToken = data.token;
        currentUser = { username };
        updateUIAfterLogin();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
        return false;
    }
}

// Logout function
function logout() {
    authToken = null;
    currentUser = null;
    updateUIAfterLogout();
}

// Update UI after login
function updateUIAfterLogin() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('current-user').textContent = currentUser.username;
}

// Update UI after logout
function updateUIAfterLogout() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('current-user').textContent = '';
}


// Add event listener for login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const success = await login(username, password);
    if (success) {
        document.getElementById('login-error').textContent = '';
    } else {
        document.getElementById('login-error').textContent = 'Invalid username or password';
    }
});

// Initialize data structure with persistent storage
const getStoredData = (key, defaultValue) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error('Error loading stored data:', e);
        return defaultValue;
    }
};

// Initialize data structure
let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'user1', password: 'user123', role: 'user' }
];

let tasks = [];
let messages = JSON.parse(localStorage.getItem('messages')) || [];
let selectedChatUser = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingStartTime = null;

// Fetch tasks from server on load
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        tasks = await response.json();
        loadTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

function connectWebSocket() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        if (currentUser) {
            ws.send(JSON.stringify({
                type: 'login',
                username: currentUser.username
            }));
        }
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'call_offer':
                handleIncomingCall(data);
                break;
            case 'call_answer':
                handleCallAnswer(data);
                break;
            case 'call_ice_candidate':
                handleNewICECandidate(data);
                break;
            case 'call_end':
                handleRemoteCallEnd();
                break;
            case 'task_notification':
                // Add the new task to local storage
                const newTask = data.taskData;
                if (!tasks.some(t => t.id === newTask.id)) {
                    tasks.push(newTask);
                    saveData();
                }
                // Notify user about the new task
                alert(`New task assigned: ${newTask.title}`);
                break;
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };
}

// Rest of the existing script.js content remains the same...

// Initialize data and fetch tasks on load
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    fetchTasks();
    
    // Add event listener for chat input
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
