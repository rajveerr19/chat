// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8l1MSX0_mjZcjbFyhpcu1MLPafFLk0OM",
  authDomain: "taskmanager-caab5.firebaseapp.com",
  projectId: "taskmanager-caab5",
  storageBucket: "taskmanager-caab5.firebasestorage.app",
  messagingSenderId: "299848474236",
  appId: "1:299848474236:web:fe0ef542633f56d75af3f9",
  measurementId: "G-NLVJF8QJBP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize WebSocket connection
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.hostname === 'taskdev.netlify.app' ? 'taskdev.netlify.app' : window.location.hostname}${window.location.hostname === 'localhost' ? ':3000' : ''}/ws`;
let ws = null;

// Authentication state
let currentUser = null;

// Login function
async function login(email, password) {
    try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get the ID token
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        
        currentUser = { email: user.email };
        updateUIAfterLogin();
        connectWebSocket();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed. Please check your credentials.');
        return false;
    }
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        localStorage.removeItem('token');
        currentUser = null;
        updateUIAfterLogout();
        if (ws) {
            ws.close();
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}

// Update UI after login
function updateUIAfterLogin() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('current-user').textContent = currentUser.email;
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
});

function connectWebSocket() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        if (currentUser) {
            ws.send(JSON.stringify({
                type: 'login',
                email: currentUser.email
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
                handleTaskNotification(data);
                break;
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };
}

function handleTaskNotification(data) {
    const newTask = data.taskData;
    if (!tasks.some(t => t.id === newTask.id)) {
        tasks.push(newTask);
        saveData();
    }
    alert(`New task assigned: ${newTask.title}`);
}

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

let tasks = [];
let messages = getStoredData('messages', []);
let selectedChatUser = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingStartTime = null;

// Fetch tasks from server
async function fetchTasks() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        tasks = await response.json();
        loadTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Initialize data and fetch tasks on load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = { email: user.email };
                updateUIAfterLogin();
                connectWebSocket();
                fetchTasks();
            }
        });
    }
    
    // Add event listener for chat input
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Export functions for use in HTML
window.login = login;
window.logout = logout;
