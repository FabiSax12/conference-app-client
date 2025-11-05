/**
 * @file VideoConferenceApp.js
 * Este archivo define la clase principal que orquesta toda la aplicación de videoconferencia.
 * Actúa como el "cerebro" de la aplicación, inicializando y coordinando todos los módulos
 * (WebRTC, WebSocket, UI, etc.) para que funcionen juntos.
 */
import config from './config.js';
import { PeerConnectionManager } from './PeerConnectionManager.js';
import { WebSocketManager } from './WebSocketManager.js';
import { WebRTCManager } from './WebRTCManager.js';
import { UIManager } from './UIManager.js';

/**
 * Clase principal que orquesta toda la aplicación de videoconferencia.
 * Responsabilidades:
 * - Inicializar todos los managers.
 * - Gestionar el flujo de arranque de la aplicación.
 * - Registrar los manejadores de eventos del WebSocket.
 */
export class VideoConferenceApp {
    /**
     * Construye la aplicación, inicializando todos los gestores necesarios.
     * @param {HTMLVideoElement} localVideoElement - El elemento de video donde se mostrará el stream local.
     */
    constructor(localVideoElement) {
        this.localVideoElement = localVideoElement;
        this.peerManager = new PeerConnectionManager();
        this.wsManager = new WebSocketManager(config.WEBSOCKET_URL);
        this.rtcManager = new WebRTCManager(this.peerManager, UIManager, this.wsManager);
        this.controlsInitialized = false;
    }

    /**
     * Inicia la aplicación siguiendo una secuencia ordenada:
     * 1. Configura los medios locales (cámara/micrófono).
     * 2. Registra los manejadores de eventos del WebSocket.
     * 3. Se conecta al servidor WebSocket.
     */
    async start() {
        // Acoplar el rtcManager al peerManager para la notificación del stream.
        this.peerManager.setRtcManager(this.rtcManager);

        await this.setupLocalMedia(); // Paso 1: Configurar medios locales (Cámara/Micrófono).
        this.registerWebSocketHandlers(); // Paso 2: Registrar manejadores de eventos del WebSocket.
        this.wsManager.connect(); // Paso 3: Conectar al servidor WebSocket.
    }

    /**
     * Solicita acceso a la cámara y micrófono del usuario y muestra el video en la UI.
     */
    async setupLocalMedia() {
        try {
            const stream = await this.peerManager.setupLocalStream();
            this.localVideoElement.srcObject = stream;
            console.log('Stream local obtenido y listo.');

            // Initialize controls after media is ready
            this.initializeControls();
        } catch (error) {
            console.error('Error al configurar el stream local:', error);
            alert('No se pudo acceder a la cámara y al micrófono. Por favor, verifica los permisos y refresca la página.');
            throw error; // Detener la ejecución si no se puede obtener el stream.
        }
    }

    /**
     * Initialize media control buttons
     */
    initializeControls() {
        if (this.controlsInitialized) return;

        const controlsContainer = document.getElementById('controls') || this.createControlsContainer();

        // Mute button
        const muteButton = UIManager.createMuteButton('local', () => {
            const isMuted = this.rtcManager.toggleAudio();
            UIManager.toggleButtonState('mute-local', isMuted, '🔇 Unmute', '🎤 Mute');
        });
        controlsContainer.appendChild(muteButton);

        // Camera button
        const cameraButton = UIManager.createTurnOffCameraButton('local', () => {
            const isOff = this.rtcManager.toggleVideo();
            UIManager.toggleButtonState('camera-local', isOff, '📹 Camera On', '📹 Camera Off');
        });
        controlsContainer.appendChild(cameraButton);

        // Share screen button
        const shareScreenButton = UIManager.createShareScreenButton('local', async () => {
            try {
                await this.rtcManager.startScreenShare();
                shareScreenButton.style.display = 'none';
                stopShareButton.style.display = 'inline-block';
                console.log('Screen sharing started successfully');
            } catch (error) {
                console.error('Failed to start screen sharing:', error);
                alert('No se pudo compartir la pantalla. Por favor, intenta nuevamente.');
            }
        });
        controlsContainer.appendChild(shareScreenButton);

        // Stop share screen button
        const stopShareButton = UIManager.createStopShareScreenButton('local', async () => {
            await this.rtcManager.stopScreenShare();
            stopShareButton.style.display = 'none';
            shareScreenButton.style.display = 'inline-block';
            console.log('Screen sharing stopped');
        });
        controlsContainer.appendChild(stopShareButton);

        this.controlsInitialized = true;
    }

    /**
     * Create controls container if it doesn't exist
     */
    createControlsContainer() {
        const container = document.createElement('div');
        container.id = 'controls';
        container.style.cssText = 'display: flex; gap: 10px; margin: 20px 0; justify-content: center;';

        // Insert after local video
        if (this.localVideoElement.parentNode) {
            this.localVideoElement.parentNode.insertBefore(
                container,
                this.localVideoElement.nextSibling
            );
        } else {
            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * Registra todos los manejadores para los mensajes del WebSocket.
     * Aquí es donde la aplicación reacciona a los eventos de señalización del servidor.
     */
    registerWebSocketHandlers() {
        // Evento: El servidor nos asigna un ID único al conectarnos.
        this.wsManager.onMessage('assign-id', (message) => {
            console.log('Evento recibido: assign-id', message);
            this.rtcManager.setMyUserId(message.userId);
            console.log(`ID de usuario asignado: ${message.userId}`);
        });

        // Evento: Un nuevo usuario se ha unido a la sala.
        this.wsManager.onMessage('user-joined', (message) => {
            console.log('Procesando evento: user-joined', message);
            this.rtcManager.handleUserJoined(message.userId);
        });

        // Evento: Al entrar, el servidor nos envía una lista de los usuarios que ya estaban en la sala.
        this.wsManager.onMessage('existing-users', (message) => {
            console.log('Procesando evento: existing-users', message);
            message.userIds.forEach(userId => this.rtcManager.handleUserJoined(userId));
        });

        // Evento: Un usuario ha abandonado la sala.
        this.wsManager.onMessage('user-left', (message) => {
            console.log('Procesando evento: user-left', message);
            this.rtcManager.handleUserLeft(message.userId);
        });

        // Evento: Recibimos una "oferta" de otro par para iniciar una conexión WebRTC.
        // Una 'offer' es un mensaje (con formato SDP) que describe cómo un par quiere comunicarse
        // (qué codecs de audio/video soporta, etc.). Es el primer paso para establecer una conexión.
        this.wsManager.onMessage('offer', (message) => {
            console.log('Procesando evento: offer (oferta)', message);
            this.rtcManager.handleOffer(message.fromUserId, message.offer);
        });

        // Evento: Recibimos una "respuesta" a una oferta que enviamos previamente.
        // Una 'answer' es la respuesta a una 'offer'. El par que la recibe confirma los parámetros
        // de comunicación y envía su propia descripción de sesión (SDP). Con la oferta y la respuesta,
        // ambos pares saben cómo comunicarse.
        this.wsManager.onMessage('answer', (message) => {
            console.log('Procesando evento: answer (respuesta)', message);
            this.rtcManager.handleAnswer(message.fromUserId, message.answer);
        });

        // Evento: Recibimos un "candidato ICE".
        // ICE (Interactive Connectivity Establishment) es el protocolo que usa WebRTC para encontrar
        // la mejor ruta de conexión posible entre dos pares, incluso si están detrás de firewalls o NAT.
        // Un 'candidato ICE' es una dirección de red (IP y puerto) que podría usarse para la conexión.
        // Los pares intercambian múltiples candidatos y eligen el que funcione.
        this.wsManager.onMessage('ice-candidate', (message) => {
            console.log('Procesando evento: ice-candidate (candidato ICE)', message);
            this.rtcManager.handleIceCandidate(message.fromUserId, message.candidate);
        });
    }
}