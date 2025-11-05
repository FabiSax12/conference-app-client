export class PeerConnectionManager {
    constructor() {
        this.peerConnections = new Map(); // Map of userId -> RTCPeerConnection
        this.localStream = null;
        this.screenStream = null;
        this.rtcManager = null;
        this.isAudioMuted = false;
        this.isVideoOff = false;
        this.isScreenSharing = false;
    }

    setRtcManager(rtcManager) {
        this.rtcManager = rtcManager;
    }

    async setupLocalStream() {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (this.rtcManager) this.rtcManager.setLocalStream(this.localStream);
        return this.localStream;
    }

    createPeerConnection(userId) {
        const peerConnection = new RTCPeerConnection();
        this.peerConnections.set(userId, peerConnection);
        return peerConnection;
    }

    removePeerConnection(userId) {
        const connection = this.peerConnections.get(userId);
        if (connection) {
            connection.close();
            this.peerConnections.delete(userId);
        }
    }

    /**
     * Toggle audio mute state for local stream
     */
    toggleAudio() {
        if (!this.localStream) return false;

        const audioTracks = this.localStream.getAudioTracks();
        this.isAudioMuted = !this.isAudioMuted;

        audioTracks.forEach(track => {
            track.enabled = !this.isAudioMuted;
        });

        console.log(`Audio ${this.isAudioMuted ? 'muted' : 'unmuted'}`);
        return this.isAudioMuted;
    }

    /**
     * Toggle video on/off for local stream
     */
    toggleVideo() {
        if (!this.localStream) return false;

        const videoTracks = this.localStream.getVideoTracks();
        this.isVideoOff = !this.isVideoOff;

        videoTracks.forEach(track => {
            track.enabled = !this.isVideoOff;
        });

        console.log(`Video ${this.isVideoOff ? 'disabled' : 'enabled'}`);
        return this.isVideoOff;
    }

    /**
     * Start screen sharing
     */
    async startScreenShare() {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            this.isScreenSharing = true;

            // Handle when user stops sharing via browser UI
            this.screenStream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };

            // Replace video track in all peer connections
            const screenTrack = this.screenStream.getVideoTracks()[0];
            this.peerConnections.forEach((peerConnection, userId) => {
                const sender = peerConnection.getSenders().find(s =>
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            console.log('Screen sharing started');
            return this.screenStream;
        } catch (error) {
            console.error('Error starting screen share:', error);
            this.isScreenSharing = false;
            throw error;
        }
    }

    /**
     * Stop screen sharing and restore camera
     */
    async stopScreenShare() {
        if (!this.screenStream) return;

        // Stop all screen share tracks
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
        this.isScreenSharing = false;

        // Restore camera video track in all peer connections
        if (this.localStream) {
            const cameraTrack = this.localStream.getVideoTracks()[0];
            this.peerConnections.forEach((peerConnection, userId) => {
                const sender = peerConnection.getSenders().find(s =>
                    s.track && s.track.kind === 'video'
                );
                if (sender && cameraTrack) {
                    sender.replaceTrack(cameraTrack);
                }
            });
        }

        console.log('Screen sharing stopped');
    }

    getAudioMuteState() {
        return this.isAudioMuted;
    }

    getVideoState() {
        return this.isVideoOff;
    }

    getScreenShareState() {
        return this.isScreenSharing;
    }
}