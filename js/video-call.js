// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const startZegoCallBtn = document.getElementById('startZegoCallBtn');
const callStatus = document.getElementById('callStatus');
const patientInfo = document.getElementById('patientInfo');
const doctorInfo = document.getElementById('doctorInfo');
const appointmentInfo = document.getElementById('appointmentInfo');
const notification = document.getElementById('notification');

// Global variables
let localStream;
let remoteStream;
let peerConnection;
let isCallActive = false;
let isVideoEnabled = true;
let isAudioEnabled = true;
let appointment;
let otherUser;
let currentUser;

// Zego Cloud variables
let zegoClient;
let zegoRoom;
let isZegoCallActive = false;

// Zego Cloud configuration from zego-config.js
const zegoConfig = ZEGO_CONFIG || {
    appID: 801785312,
    server: 'wss://webliveroom801785312-api.coolzcloud.com/ws',
    logLevel: 'error'
};

// Configuration for WebRTC connection
const peerConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set up event listeners
    if (startCallBtn) {
        startCallBtn.addEventListener('click', startCall);
    }
    
    if (endCallBtn) {
        endCallBtn.addEventListener('click', endCall);
    }
    
    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', toggleVideo);
    }
    
    if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener('click', toggleAudio);
    }
    
    if (startZegoCallBtn) {
        startZegoCallBtn.addEventListener('click', startZegoCall);
    }
    
    // Initialize page data
    loadAppointmentData();
    initializeMediaDevices();
});

// Function to load appointment data
function loadAppointmentData() {
    const appointmentId = sessionStorage.getItem('activeCallAppointmentId');
    
    if (!appointmentId) {
        showNotification('No appointment selected for video call.');
        return;
    }
    
    // Get users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find appointment and other user
    if (currentUser.userType === 'patient') {
        // If current user is a patient, find appointment in their own data
        const userAppointments = currentUser.appointments || [];
        appointment = userAppointments.find(a => a.id === appointmentId);
        
        if (!appointment) {
            showNotification('Appointment not found.');
            return;
        }
        
        // Find doctor
        otherUser = users.find(u => u.id === appointment.doctorId);
        
        // Display info
        if (patientInfo) {
            patientInfo.querySelector('.user-name').textContent = currentUser.name;
            patientInfo.querySelector('.user-initials').textContent = getInitials(currentUser.name);
        }
        
        if (doctorInfo) {
            if (otherUser) {
                doctorInfo.querySelector('.user-name').textContent = otherUser.name;
                doctorInfo.querySelector('.user-specialization').textContent = otherUser.specialization || '';
                doctorInfo.querySelector('.user-initials').textContent = getInitials(otherUser.name);
            } else {
                doctorInfo.querySelector('.user-name').textContent = 'Unknown Doctor';
                doctorInfo.querySelector('.user-specialization').textContent = '';
                doctorInfo.querySelector('.user-initials').textContent = '?';
            }
        }
    } else {
        // Current user is a doctor, find patient with this appointment
        let foundPatient = null;
        let foundAppointment = null;
        
        for (const user of users) {
            if (user.userType === 'patient') {
                const appointments = user.appointments || [];
                const matchingAppointment = appointments.find(a => a.id === appointmentId);
                
                if (matchingAppointment) {
                    foundPatient = user;
                    foundAppointment = matchingAppointment;
                    break;
                }
            }
        }
        
        if (!foundPatient || !foundAppointment) {
            showNotification('Appointment not found.');
            return;
        }
        
        otherUser = foundPatient;
        appointment = foundAppointment;
        
        // Display info
        if (doctorInfo) {
            doctorInfo.querySelector('.user-name').textContent = currentUser.name;
            doctorInfo.querySelector('.user-specialization').textContent = currentUser.specialization || '';
            doctorInfo.querySelector('.user-initials').textContent = getInitials(currentUser.name);
        }
        
        if (patientInfo) {
            patientInfo.querySelector('.user-name').textContent = otherUser.name;
            patientInfo.querySelector('.user-initials').textContent = getInitials(otherUser.name);
        }
    }
    
    // Display appointment info
    if (appointmentInfo) {
        const appointmentDate = new Date(appointment.date);
        const formattedDate = appointmentDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        appointmentInfo.querySelector('.appointment-title').textContent = appointment.reason || 'Consultation';
        appointmentInfo.querySelector('.appointment-date').textContent = `${formattedDate} at ${appointment.time}`;
        appointmentInfo.querySelector('.appointment-duration').textContent = appointment.duration || '30 minutes';
    }
}

// Function to initialize media devices
function initializeMediaDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Your browser does not support video calls.');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            if (localVideo) {
                localVideo.srcObject = stream;
            }
            // Enable start call button
            if (startCallBtn) {
                startCallBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error accessing media devices:', error);
            showNotification('Error accessing camera and microphone. Please check your device permissions.');
        });
}

// Function to start a call
function startCall() {
    if (!localStream) {
        showNotification('Local stream not available. Please check your camera and microphone.');
        return;
    }
    
    if (isCallActive) {
        showNotification('Call is already active.');
        return;
    }
    
    // Create peer connection
    createPeerConnection();
    
    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Update UI
    if (callStatus) {
        callStatus.textContent = 'Connecting...';
        callStatus.className = 'status connecting';
    }
    
    if (startCallBtn) {
        startCallBtn.disabled = true;
    }
    
    if (endCallBtn) {
        endCallBtn.disabled = false;
    }
    
    isCallActive = true;
    
    // Simulate connected call (in a real app, this would involve signaling)
    setTimeout(() => {
        // Simulate receiving a remote stream (in a real app this would come from the other peer)
        simulateRemoteStream();
        
        // Update UI
        if (callStatus) {
            callStatus.textContent = 'Connected';
            callStatus.className = 'status connected';
        }
    }, 2000);
}

// Function to end a call
function endCall() {
    if (!isCallActive) {
        return;
    }
    
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Stop remote stream
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    
    // Update remote video
    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }
    
    // Update UI
    if (callStatus) {
        callStatus.textContent = 'Call Ended';
        callStatus.className = 'status ended';
    }
    
    if (startCallBtn) {
        startCallBtn.disabled = false;
    }
    
    if (endCallBtn) {
        endCallBtn.disabled = true;
    }
    
    isCallActive = false;
}

// Function to toggle video
function toggleVideo() {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    
    if (videoTracks.length === 0) {
        showNotification('No video tracks found.');
        return;
    }
    
    isVideoEnabled = !isVideoEnabled;
    
    videoTracks.forEach(track => {
        track.enabled = isVideoEnabled;
    });
    
    // Update UI
    if (toggleVideoBtn) {
        const icon = toggleVideoBtn.querySelector('i');
        
        if (icon) {
            if (isVideoEnabled) {
                icon.className = 'fas fa-video';
                toggleVideoBtn.classList.remove('disabled');
            } else {
                icon.className = 'fas fa-video-slash';
                toggleVideoBtn.classList.add('disabled');
            }
        }
    }
}

// Function to toggle audio
function toggleAudio() {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    
    if (audioTracks.length === 0) {
        showNotification('No audio tracks found.');
        return;
    }
    
    isAudioEnabled = !isAudioEnabled;
    
    audioTracks.forEach(track => {
        track.enabled = isAudioEnabled;
    });
    
    // Update UI
    if (toggleAudioBtn) {
        const icon = toggleAudioBtn.querySelector('i');
        
        if (icon) {
            if (isAudioEnabled) {
                icon.className = 'fas fa-microphone';
                toggleAudioBtn.classList.remove('disabled');
            } else {
                icon.className = 'fas fa-microphone-slash';
                toggleAudioBtn.classList.add('disabled');
            }
        }
    }
}

// Function to create peer connection
function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(peerConfig);
        
        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.ontrack = handleTrack;
        peerConnection.onnegotiationneeded = handleNegotiationNeeded;
        peerConnection.oniceconnectionstatechange = handleIceConnectionStateChange;
        
        console.log('PeerConnection created');
    } catch (error) {
        console.error('Error creating PeerConnection:', error);
        showNotification('Error creating connection. Please try again.');
    }
}

// Function to handle ICE candidate
function handleIceCandidate(event) {
    if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        // In a real app, you would send this to the other peer via your signaling server
    }
}

// Function to handle incoming track
function handleTrack(event) {
    console.log('Remote track received:', event.streams[0]);
    remoteStream = event.streams[0];
    
    if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
    }
}

// Function to handle negotiation needed
function handleNegotiationNeeded() {
    console.log('Negotiation needed');
    
    // In a real app, you would create an offer and send it to the other peer
    // For this demo, we'll simulate it
}

// Function to handle ICE connection state change
function handleIceConnectionStateChange() {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
    
    if (peerConnection.iceConnectionState === 'disconnected' || 
        peerConnection.iceConnectionState === 'failed' || 
        peerConnection.iceConnectionState === 'closed') {
            
        if (isCallActive) {
            endCall();
            showNotification('Call disconnected. Please try again.');
        }
    }
}

// Function to simulate receiving a remote stream
function simulateRemoteStream() {
    // In a real app, the remote stream would come from the other peer
    // For this demo, we'll create a fake video stream
    
    // Check if we can use userMedia for the simulation
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                // Use this as our "remote" stream for the simulation
                remoteStream = stream;
                
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                }
            })
            .catch(error => {
                console.error('Error creating fake remote stream:', error);
                createFallbackStream();
            });
    } else {
        createFallbackStream();
    }
}

// Function to create a fallback stream for simulation
function createFallbackStream() {
    // Create a canvas element to use as a source
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    
    const ctx = canvas.getContext('2d');
    
    // Function to draw to the canvas
    function drawToCanvas() {
        // Fill with a dark blue background
        ctx.fillStyle = '#1a2b3c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a simulated user silhouette
        ctx.fillStyle = '#435566';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 3, 60, 0, Math.PI * 2, true);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 70, 90, 0, Math.PI, false);
        ctx.fill();
        
        // Add some text
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${otherUser ? otherUser.name : 'Remote User'}`, canvas.width / 2, canvas.height - 80);
        ctx.fillText('Video Simulation', canvas.width / 2, canvas.height - 40);
        
        // Add timestamp
        const now = new Date();
        ctx.font = '14px Arial';
        ctx.fillText(now.toLocaleTimeString(), canvas.width / 2, 30);
        
        // Animate
        requestAnimationFrame(drawToCanvas);
    }
    
    // Start drawing
    drawToCanvas();
    
    // Create a stream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Create an audio context for audio simulation
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.frequency.value = 0; // Silence
    gainNode.gain.value = 0; // Mute
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    
    // Add the audio track to the stream
    const audioTrack = audioContext.createMediaStreamDestination().stream.getAudioTracks()[0];
    stream.addTrack(audioTrack);
    
    // Use this as our "remote" stream
    remoteStream = stream;
    
    if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
    }
}

// Function to start a Zego Cloud video call
function startZegoCall() {
    if (!localStream) {
        showNotification('Local stream not available. Please check your camera and microphone.');
        return;
    }
    
    if (isZegoCallActive) {
        showNotification('Zego Cloud call is already active.');
        return;
    }
    
    if (isCallActive) {
        // End the regular WebRTC call first
        endCall();
    }
    
    // Update UI
    if (callStatus) {
        callStatus.textContent = 'Initializing Zego Cloud...';
        callStatus.className = 'status connecting';
    }
    
    if (startZegoCallBtn) {
        startZegoCallBtn.disabled = true;
    }
    
    if (endCallBtn) {
        endCallBtn.disabled = false;
    }
    
    // Generate a unique room ID based on the appointment
    const roomID = appointment ? `med-${appointment.id}` : `med-${Date.now()}`;
    
    // Create a unique user ID
    const userID = currentUser.id;
    
    // Check if Zego Client is loaded
    if (!window.ZegoClient) {
        showNotification('Zego Cloud SDK not loaded. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Initialize Zego Cloud client
        zegoClient = new window.ZegoClient();
        zegoClient.config(zegoConfig);
        
        // Set up event listeners for Zego Client
        zegoClient.on('room-login-success', () => {
            console.log('Successfully logged in to Zego room');
            
            // Start publishing local stream
            publishLocalStream(roomID);
        });
        
        zegoClient.on('room-login-failed', (error) => {
            console.error('Failed to log in to Zego room:', error);
            showNotification('Failed to connect to Zego Cloud. Please try again.');
            
            // Clean up
            endZegoCall();
        });
        
        zegoClient.on('stream-added', (roomID, streamList) => {
            console.log('Remote streams added:', streamList);
            
            // Play the first remote stream
            if (streamList.length > 0) {
                const streamID = streamList[0].stream_id;
                playRemoteStream(streamID);
            }
        });
        
        zegoClient.on('stream-removed', (roomID, streamList) => {
            console.log('Remote streams removed:', streamList);
            
            // Stop playing remote streams
            if (remoteVideo) {
                remoteVideo.srcObject = null;
            }
        });
        
        // Login to the room
        zegoClient.login(roomID, 1, userID, (error, streamList) => {
            if (error) {
                console.error('Login error:', error);
                showNotification('Failed to connect to Zego Cloud. Please try again.');
                return;
            }
            
            console.log('Login success, stream list:', streamList);
            
            // Set active flag
            isZegoCallActive = true;
            
            // Update UI
            if (callStatus) {
                callStatus.textContent = 'Connected via Zego Cloud';
                callStatus.className = 'status connected';
            }
            
            // Play any existing streams in the room
            if (streamList.length > 0) {
                const streamID = streamList[0].stream_id;
                playRemoteStream(streamID);
            }
        });
    } catch (error) {
        console.error('Error initializing Zego Cloud:', error);
        showNotification('Error initializing Zego Cloud. Please try again.');
    }
}

// Function to publish local stream to Zego Cloud
function publishLocalStream(roomID) {
    // Create a unique stream ID
    const streamID = `${currentUser.id}-${Date.now()}`;
    
    // Get media stream
    zegoClient.startPreview(localVideo, { audio: true, video: true }, () => {
        // Start publishing
        zegoClient.publish(streamID, roomID, (error) => {
            if (error) {
                console.error('Publish error:', error);
                showNotification('Failed to publish stream. Please try again.');
                return;
            }
            
            console.log('Publish success');
        });
    }, (error) => {
        console.error('Preview error:', error);
        showNotification('Failed to access camera or microphone. Please check your device permissions.');
    });
}

// Function to play a remote stream from Zego Cloud
function playRemoteStream(streamID) {
    zegoClient.play(streamID, remoteVideo, { audio: true, video: true }, (error) => {
        if (error) {
            console.error('Play error:', error);
            showNotification('Failed to play remote stream. Please try again.');
            return;
        }
        
        console.log('Play success');
    });
}

// Function to end a Zego Cloud call
function endZegoCall() {
    if (!isZegoCallActive) {
        return;
    }
    
    // Stop publishing and playing
    zegoClient.stopPreview();
    zegoClient.stopPublishingStream();
    zegoClient.stopPlayingStream();
    
    // Logout from the room
    zegoClient.logout();
    
    // Clean up
    zegoClient = null;
    
    // Update UI
    if (callStatus) {
        callStatus.textContent = 'Call Ended';
        callStatus.className = 'status ended';
    }
    
    if (startZegoCallBtn) {
        startZegoCallBtn.disabled = false;
    }
    
    if (endCallBtn) {
        endCallBtn.disabled = true;
    }
    
    if (localVideo) {
        localVideo.srcObject = localStream; // Restore local preview
    }
    
    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }
    
    isZegoCallActive = false;
}

// Override the end call function to handle both regular and Zego calls
const originalEndCall = endCall;
endCall = function() {
    if (isZegoCallActive) {
        endZegoCall();
    }
    
    if (isCallActive) {
        originalEndCall();
    }
};

// Function to show a notification
function showNotification(message) {
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    } else {
        alert(message);
    }
}

// Helper function to get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
}
