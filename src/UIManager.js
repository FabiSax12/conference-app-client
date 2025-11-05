const videoGrid = document.getElementById('videoGrid');

/**
 * Gestiona la creación y eliminación de elementos de video en la interfaz de usuario.
 */
export const UIManager = {
    createVideoElement: (userId) => {
        const videoElement = document.createElement('video');
        videoElement.id = `video-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.backgroundColor = 'black'; // Ayuda a visualizar el contenedor antes de que llegue el stream
        videoGrid.appendChild(videoElement);
        return videoElement;
    },
    removeVideoElement: (userId) => {
        const videoElement = document.getElementById(`video-${userId}`);
        if (videoElement) {
            videoElement.remove();
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