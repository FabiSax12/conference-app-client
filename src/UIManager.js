const thumbnailStrip = document.getElementById('thumbnailStrip');
const mainVideo = document.getElementById('mainVideo');

/**
 * Gestiona la creación y eliminación de elementos de video en la interfaz de usuario.
 */
export const UIManager = {
    activeVideoId: null,

    createVideoElement: (userId) => {
        // Hide empty state when first video is added
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Create container
        const container = document.createElement('div');
        container.className = 'video-container';
        container.id = `container-${userId}`;

        // Create video element
        const videoElement = document.createElement('video');
        videoElement.id = `video-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><div>Connecting...</div>';
        loadingIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
            font-size: 12px;
        `;

        // Create label
        const label = document.createElement('div');
        label.className = 'video-label';
        label.textContent = userId === 'local' ? 'You' : `User ${userId.substring(0, 6)}`;
        if (userId === 'local') {
            label.classList.add('local');
        }

        // Hide loading indicator when video starts playing
        videoElement.onloadeddata = () => {
            loadingIndicator.style.display = 'none';
        };

        // Assemble
        container.appendChild(videoElement);
        container.appendChild(loadingIndicator);
        container.appendChild(label);

        // Add click handler to make this video the main one
        container.onclick = () => UIManager.setMainVideo(userId);

        // Add to thumbnail strip
        thumbnailStrip.appendChild(container);

        // If this is the first video, make it the main one
        if (!UIManager.activeVideoId) {
            UIManager.setMainVideo(userId);
        }

        // Update participant count
        UIManager.updateParticipantCount();

        return videoElement;
    },

    removeVideoElement: (userId) => {
        const container = document.getElementById(`container-${userId}`);
        if (container) {
            container.remove();
        }

        // If the removed video was the main one, switch to another
        if (UIManager.activeVideoId === userId) {
            const remainingContainers = thumbnailStrip.querySelectorAll('.video-container');
            if (remainingContainers.length > 0) {
                const firstVideoId = remainingContainers[0].querySelector('video').id.replace('video-', '');
                UIManager.setMainVideo(firstVideoId);
            } else {
                mainVideo.srcObject = null;
                UIManager.activeVideoId = null;
            }
        }

        // Update participant count
        UIManager.updateParticipantCount();
    },

    setMainVideo: (userId) => {
        const videoElement = document.getElementById(`video-${userId}`);
        if (!videoElement || !videoElement.srcObject) return;

        // Update main video
        mainVideo.srcObject = videoElement.srcObject;

        // Update active state
        document.querySelectorAll('.video-container').forEach(container => {
            container.classList.remove('active');
        });
        const activeContainer = document.getElementById(`container-${userId}`);
        if (activeContainer) {
            activeContainer.classList.add('active');
        }

        UIManager.activeVideoId = userId;
    },

    updateParticipantCount: () => {
        const count = thumbnailStrip.querySelectorAll('.video-container').length;
        const badge = document.getElementById('participantCount');
        if (badge) {
            badge.textContent = `👥 ${count} participant${count !== 1 ? 's' : ''}`;
        }
    },

    createMuteButton: (userId, onClick) => {
        const button = document.createElement('button');
        button.id = `mute-${userId}`;
        button.className = 'control-button mute-button';
        button.textContent = '🎤 Mute';
        button.onclick = () => onClick(userId);
        return button;
    },

    createTurnOffCameraButton: (userId, onClick) => {
        const button = document.createElement('button');
        button.id = `camera-${userId}`;
        button.className = 'control-button camera-button';
        button.textContent = '📹 Camera Off';
        button.onclick = () => onClick(userId);
        return button;
    },

    createShareScreenButton: (userId, onClick) => {
        const button = document.createElement('button');
        button.id = `share-screen-${userId}`;
        button.className = 'control-button share-screen-button';
        button.textContent = '🖥️ Share Screen';
        button.onclick = () => onClick(userId);
        return button;
    },

    createStopShareScreenButton: (userId, onClick) => {
        const button = document.createElement('button');
        button.id = `stop-share-screen-${userId}`;
        button.className = 'control-button stop-share-screen-button';
        button.textContent = '🛑 Stop Sharing';
        button.onclick = () => onClick(userId);
        button.style.display = 'none'; // Hidden by default
        return button;
    },

    createSharingVideoElement: (userId) => {
        const videoElement = document.createElement('video');
        videoElement.id = `screen-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.backgroundColor = 'black';
        videoElement.style.width = '100%';
        videoElement.style.maxWidth = '800px';
        videoGrid.appendChild(videoElement);
        return videoElement;
    },

    toggleButtonState: (buttonId, isActive, activeText, inactiveText) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.textContent = isActive ? activeText : inactiveText;
            button.classList.toggle('active', isActive);
        }
    },

    removeScreenShareElement: (userId) => {
        const screenElement = document.getElementById(`screen-${userId}`);
        if (screenElement) {
            screenElement.remove();
        }
    }
};