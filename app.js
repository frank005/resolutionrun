// Agora client configuration
let hostClient;
let audienceClient;
let hostAudioTrack;
let hostVideoTrack;
let remoteAudioTrack;
let remoteVideoTrack;
let statsInterval;

// DOM Elements
const agoraLogo = document.getElementById('agoraLogo');
const settingsMenu = document.getElementById('settingsMenu');
const themeTitle = document.getElementById('themeTitle');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const framerateInput = document.getElementById('framerate');
const bitrateInput = document.getElementById('bitrate');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const localStats = document.getElementById('localStats');
const remoteStats = document.getElementById('remoteStats');
const micSelect = document.getElementById('micSelect');
const cameraSelect = document.getElementById('cameraSelect');
const updateConfigBtn = document.getElementById('updateConfigBtn');

// Theme constants
const TORTOISE_THRESHOLD = {
    width: 1280,
    height: 720
};

// Device selection logic (from catProxy)
async function getDevices() {
    try {
        const devices = await AgoraRTC.getDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Clear existing options
        micSelect.innerHTML = '';
        cameraSelect.innerHTML = '';
        
        // Add devices to select elements
        audioDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microphone ${device.deviceId}`;
            micSelect.appendChild(option);
        });
        
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${device.deviceId}`;
            cameraSelect.appendChild(option);
        });

        // Store the first camera as default if none selected
        if (!cameraSelect.value && videoDevices.length > 0) {
            cameraSelect.value = videoDevices[0].deviceId;
        }

        // Store the first mic as default if none selected
        if (!micSelect.value && audioDevices.length > 0) {
            micSelect.value = audioDevices[0].deviceId;
        }

        console.log('Available video devices:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })));
        console.log('Selected camera:', cameraSelect.value);
        console.log('Camera select options:', Array.from(cameraSelect.options).map(o => ({ value: o.value, text: o.text })));
    } catch (error) {
        console.error("Error getting devices:", error);
    }
}

// Create local tracks using selected devices and encoder config
async function createLocalTracksWithDevicesAndConfig() {
    const selectedCamera = cameraSelect.value;
    
    if (!selectedCamera) {
        throw new Error('No camera selected');
    }
    
    console.log('Creating tracks with camera:', selectedCamera);

    try {
        // Get current devices to verify camera is still available
        const devices = await AgoraRTC.getDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Current available video devices:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })));
        
        // Verify selected camera is still in the list
        const cameraExists = videoDevices.some(device => device.deviceId === selectedCamera);
        if (!cameraExists) {
            console.warn('Selected camera no longer available, using first available camera');
            cameraSelect.value = videoDevices[0].deviceId;
        }

        // Create both audio and video tracks together
        [hostAudioTrack, hostVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            {
                encoderConfig: {
                    bitrate: 48,
                    stereo: false,
                    sampleRate: 48000
                },
                deviceId: micSelect.value
            },
            {
                encoderConfig: {
                    width: parseInt(widthInput.value),
                    height: parseInt(heightInput.value),
                    frameRate: parseInt(framerateInput.value),
                    bitrateMax: parseInt(bitrateInput.value)
                },
                cameraId: cameraSelect.value,
                facingMode: "user",
                optimizationMode: "detail"
            }
        );
        
    } catch (e) {
        console.error('Error creating tracks:', e);
        alert('The selected resolution/framerate/bitrate is not supported by your camera. Please try different values.');
        throw e;
    }
}

// Animated confetti
function spawnConfetti() {
    for (let i = 0; i < 20; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = `${Math.random() * 100}vw`;
        conf.style.background = `hsl(${Math.random()*360},80%,60%)`;
        conf.style.top = '-20px';
        conf.style.animationDuration = `${2 + Math.random() * 2}s`;
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 4000);
    }
}

// More floating animals on input click
function spawnFloatingSVG(theme) {
    const svgUrl = theme === 'tortoise' ? 'https://openmoji.org/data/color/svg/1F422.svg' : 'https://openmoji.org/data/color/svg/1F407.svg';
    const img = document.createElement('img');
    img.src = svgUrl;
    img.className = 'floating-svg';
    img.style.position = 'fixed';
    img.style.left = `${Math.random() * 90 + 2}%`;
    img.style.top = `${Math.random() * 80 + 5}%`;
    img.style.width = '48px';
    img.style.opacity = '0.7';
    img.style.zIndex = '0';
    img.style.animation = `floaty-move-${Math.floor(Math.random()*3)} 8s linear infinite alternate`;
    document.body.appendChild(img);
    setTimeout(() => img.remove(), 9000);
}

// Update theme: use aggregate resolution
function updateTheme() {
    const width = parseInt(widthInput.value) || 0;
    const height = parseInt(heightInput.value) || 0;
    const aggregate = width * height;
    const threshold = 1280 * 720;
    let theme = '';
    if (aggregate <= threshold) {
        document.body.className = 'tortoise-theme';
        theme = 'tortoise';
        themeTitle.style.color = 'var(--tortoise-primary)';
    } else {
        document.body.className = 'hare-theme';
        theme = 'hare';
        themeTitle.style.color = 'var(--hare-primary)';
    }
    // Only set backgrounds if we're not in a call
    if (!hostVideoTrack) {
        setVideoTileBackgrounds(theme);
    }
    addFloatingSVGs(theme);
}

function setVideoTileBackgrounds(theme) {
    const tortoiseImg = 'https://openmoji.org/data/color/svg/1F422.svg';
    const hareImg = 'https://openmoji.org/data/color/svg/1F407.svg';
    const img = theme === 'tortoise' ? tortoiseImg : hareImg;
    localVideo.style.background = `center/40% no-repeat url('${img}')`;
    remoteVideo.style.background = `center/40% no-repeat url('${img}')`;
    localVideo.innerHTML = '';
    remoteVideo.innerHTML = '';
    // Add badge
    setVideoBadge(theme);
}

function setVideoBadge(theme) {
    // Remove old badges
    document.querySelectorAll('.video-badge').forEach(el => el.remove());
    const badge = document.createElement('div');
    badge.className = 'video-badge';
    badge.innerText = theme === 'tortoise' ? '🐢' : '🐇';
    badge.style.position = 'absolute';
    badge.style.top = '12px';
    badge.style.left = '12px';
    badge.style.fontSize = '2.5rem';
    badge.style.zIndex = '10';
    badge.style.animation = 'badge-pop 0.7s cubic-bezier(.68,-0.55,.27,1.55)';
    localVideo.appendChild(badge.cloneNode(true));
    remoteVideo.appendChild(badge);
}

async function initializeAgoraClients() {
    hostClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    audienceClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    await hostClient.setClientRole('host');
    await audienceClient.setClientRole('audience');
    setupEventHandlers();
}

function setupEventHandlers() {
    // Host client: not subscribing to anyone
    // Audience client: subscribe to host
    audienceClient.on('user-published', async (user, mediaType) => {
        try {
            await audienceClient.subscribe(user, mediaType);
            if (mediaType === 'video' && user.videoTrack) {
                remoteVideoTrack = user.videoTrack;
                remoteVideo.innerHTML = '';
                remoteVideoTrack.play(remoteVideo);
            }
            if (mediaType === 'audio' && user.audioTrack) {
                remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
            }
        } catch (error) {
            console.error('Audience subscribe error:', error);
        }
    });
    audienceClient.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
            remoteVideoTrack = null;
            remoteVideo.innerHTML = '';
        }
        if (mediaType === 'audio') {
            remoteAudioTrack = null;
        }
    });
}

// Update config button logic
updateConfigBtn.addEventListener('click', async () => {
    if (!hostVideoTrack) return;
    try {
        await hostVideoTrack.setEncoderConfiguration({
            width: parseInt(widthInput.value),
            height: parseInt(heightInput.value),
            frameRate: parseInt(framerateInput.value),
            bitrateMax: parseInt(bitrateInput.value)
        });
        // Ensure video is playing
        setTimeout(() => {
            if (!hostVideoTrack.isPlaying) {
                localVideo.innerHTML = '';
                hostVideoTrack.play(localVideo);
            }
            // Replay remote video if it exists
            if (remoteVideoTrack && !remoteVideoTrack.isPlaying) {
                remoteVideo.innerHTML = '';
                remoteVideoTrack.play(remoteVideo);
            }
        }, 300);
        updateConfigBtn.textContent = 'Updated!';
        setTimeout(() => updateConfigBtn.textContent = 'Update Config', 1200);
    } catch (e) {
        alert('The selected resolution/framerate/bitrate is not supported by your camera. Please try different values.');
        updateConfigBtn.textContent = 'Error!';
        setTimeout(() => updateConfigBtn.textContent = 'Update Config', 1200);
    }
});

// Enable/disable updateConfigBtn based on call state
function setCallButtonsState(inCall) {
    joinBtn.disabled = inCall;
    leaveBtn.disabled = !inCall;
    updateConfigBtn.disabled = !inCall;
}

async function joinChannel() {
    const appId = document.getElementById('appId').value;
    const channelName = document.getElementById('channelName').value;
    const token = document.getElementById('token').value || null;
    const uid = document.getElementById('uid').value;
    const isStringUid = document.getElementById('stringUid').checked;
    if (!appId || !channelName) {
        alert('Please enter App ID and Channel Name');
        return;
    }
    try {
        await initializeAgoraClients();
        await hostClient.join(appId, channelName, token, isStringUid ? uid : (uid ? parseInt(uid) : null));
        
        await new Promise(res => setTimeout(res, 200)); // Small delay to ensure device list is ready
        
        // Create tracks with selected devices
        await createLocalTracksWithDevicesAndConfig();
        
        await hostClient.publish([hostAudioTrack, hostVideoTrack]);
        localVideo.innerHTML = '';
        localVideo.style.background = '';
        hostVideoTrack.play(localVideo);
        await audienceClient.join(appId, channelName, token, null);
        remoteVideo.innerHTML = '';
        remoteVideo.style.background = '';
        setCallButtonsState(true);
        startStatsMonitoring();
    } catch (error) {
        console.error('Error joining channel:', error);
        alert('Failed to join channel: ' + error.message);
    }
}

// Live camera/mic switching
async function switchCamera() {
    if (!hostVideoTrack || !hostClient) return;
    const selectedCamera = cameraSelect.value;
    await hostVideoTrack.setDevice(selectedCamera);
    // Re-apply encoder config
    await hostVideoTrack.setEncoderConfiguration({
        width: parseInt(widthInput.value),
        height: parseInt(heightInput.value),
        frameRate: parseInt(framerateInput.value),
        bitrateMax: parseInt(bitrateInput.value)
    });
}

async function switchMic() {
    if (!hostAudioTrack || !hostClient) return;
    const selectedMic = micSelect.value;
    const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({ deviceId: selectedMic });
    await hostClient.unpublish(hostAudioTrack);
    await hostClient.publish(newAudioTrack);
    await hostAudioTrack.close();
    hostAudioTrack = newAudioTrack;
}

cameraSelect.addEventListener('change', () => {
    if (hostVideoTrack) switchCamera();
});
micSelect.addEventListener('change', () => {
    if (hostAudioTrack) switchMic();
});

async function leaveChannel() {
    try {
        if (hostAudioTrack) { hostAudioTrack.close(); hostAudioTrack = null; }
        if (hostVideoTrack) { hostVideoTrack.close(); hostVideoTrack = null; }
        if (remoteAudioTrack) { remoteAudioTrack.close(); remoteAudioTrack = null; }
        if (remoteVideoTrack) { remoteVideoTrack.close(); remoteVideoTrack = null; }
        await hostClient.leave();
        await audienceClient.leave();
        const width = parseInt(widthInput.value) || 0;
        const height = parseInt(heightInput.value) || 0;
        let theme = ((width * height) <= (1280 * 720)) ? 'tortoise' : 'hare';
        setVideoTileBackgrounds(theme);
        setCallButtonsState(false);
        stopStatsMonitoring();
        // Clear stats overlays
        localStats.innerHTML = '';
        remoteStats.innerHTML = '';
    } catch (error) {
        console.error('Error leaving channel:', error);
    }
}

// Update remote stats logic (from catProxy)
function getRemoteStats() {
    if (!audienceClient || !hostClient) return null;
    const remoteUser = audienceClient.remoteUsers.find(user => user.uid === hostClient.uid);
    if (!remoteUser) return null;
    const remoteStats = audienceClient.getRemoteVideoStats();
    return remoteStats[remoteUser.uid];
}

function updateStatsDisplay(element, stats, isLocal) {
    if (!stats) return;
    let html = '';
    if (isLocal) {
        html = `
            <div class='stats-label'>Local Stats</div>
            Resolution: ${stats.sendResolutionWidth}x${stats.sendResolutionHeight}<br>
            FPS: ${stats.sendFrameRate}<br>
            Bitrate: ${Math.round(stats.sendBitrate)} kbps<br>
            Packet Loss: ${stats.packetLossRate}%<br>
            Capture FPS: ${stats.captureFrameRate}<br>
            Encode Delay: ${stats.encodeDelay}ms<br>
            Jitter: ${stats.sendJitterMs}ms<br>
            RTT: ${stats.sendRttMs}ms
        `;
    } else {
        html = `
            <div class='stats-label'>Remote Stats</div>
            Resolution: ${stats.receiveResolutionWidth}x${stats.receiveResolutionHeight}<br>
            Receive FPS: ${stats.receiveFrameRate}<br>
            Decode FPS: ${stats.decodeFrameRate}<br>
            Render FPS: ${stats.renderFrameRate}<br>
            Bitrate: ${Math.round(stats.receiveBitrate)} kbps<br>
            Delay: ${stats.receiveDelay}ms<br>
            Packets Lost: ${stats.receivePacketsLost}<br>
            E2E Delay: ${stats.end2EndDelay}ms<br>
            Transport Delay: ${stats.transportDelay}ms<br>
            Freeze Rate: ${stats.freezeRate}%<br>
            Total Freeze Time: ${stats.totalFreezeTime}s
        `;
    }
    element.innerHTML = html;
}

function startStatsMonitoring() {
    statsInterval = setInterval(async () => {
        if (hostClient && hostVideoTrack) {
            const localStatsData = await hostClient.getLocalVideoStats();
            updateStatsDisplay(localStats, localStatsData, true);
        }
        if (audienceClient && hostClient) {
            const remoteStatsData = getRemoteStats();
            updateStatsDisplay(remoteStats, remoteStatsData, false);
        }
    }, 1000);
}

function stopStatsMonitoring() {
    if (statsInterval) clearInterval(statsInterval);
}

// Playful floating SVGs
function addFloatingSVGs(theme) {
    document.querySelectorAll('.floating-svg').forEach(el => el.remove());
    const svgUrl = theme === 'tortoise' ? 'https://openmoji.org/data/color/svg/1F422.svg' : 'https://openmoji.org/data/color/svg/1F407.svg';
    for (let i = 0; i < 3; i++) {
        const img = document.createElement('img');
        img.src = svgUrl;
        img.className = 'floating-svg';
        img.style.position = 'fixed';
        img.style.left = `${Math.random() * 90 + 2}%`;
        img.style.top = `${Math.random() * 80 + 5}%`;
        img.style.width = '48px';
        img.style.opacity = '0.7';
        img.style.zIndex = '0';
        img.style.animation = `floaty-move-${i} 8s linear infinite alternate`;
        document.body.appendChild(img);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    agoraLogo.addEventListener('click', () => {
        settingsMenu.classList.toggle('hidden');
        // Hide the arrow permanently after first click
        const arrow = document.querySelector('.theme-arrow');
        if (arrow) arrow.style.display = 'none';
    });

    widthInput.addEventListener('input', updateTheme);
    heightInput.addEventListener('input', updateTheme);
    joinBtn.addEventListener('click', joinChannel);
    leaveBtn.addEventListener('click', leaveChannel);

    // Initialize
    updateTheme();
    await getDevices(); // Wait for devices to be loaded before allowing join
    
    // Add input click listeners for floating SVGs and confetti
    document.querySelectorAll('input,select').forEach(el => {
        el.addEventListener('click', () => {
            const width = parseInt(widthInput.value) || 0;
            const height = parseInt(heightInput.value) || 0;
            let theme = (width <= TORTOISE_THRESHOLD.width && height <= TORTOISE_THRESHOLD.height) ? 'tortoise' : 'hare';
            spawnFloatingSVG(theme);
            spawnConfetti();
        });
    });
}); 