// proyojo/app/static/js/robot_control.js

/**
 * Sistema de control del robot JoJo
 * Maneja la interacción del usuario con los botones y envía comandos a la API
 */

class RobotController {
    constructor(robotId, mqttTopic) {
        this.robotId = robotId;
        this.mqttTopic = mqttTopic;
        this.apiUrl = `/api/robot/${robotId}/command`;
        this.statusUrl = `/api/robot/${robotId}/status`;
        this.isCommandInProgress = false;
        
        // Estado del brazo robótico
        this.armState = {
            base: 90,
            shoulder: 90,
            elbow: 90,
            gripper: 90
        };
        
        // Control de voz
        this.recognition = null;
        this.isRecording = false;
        
        this.init();
    }
    
    init() {
        console.log(`Controlador de robot inicializado - ID: ${this.robotId}`);
        this.attachEventListeners();
        this.initArmControls();
        this.initVoiceControl();
        this.startStatusPolling();
    }
    
    /**
     * Adjunta event listeners a todos los botones de control
     */
    attachEventListeners() {
        // Botones direccionales
        const directionButtons = document.querySelectorAll('.direction-btn[data-direction]');
        directionButtons.forEach(btn => {
            btn.addEventListener('mousedown', () => this.handleDirectionPress(btn.dataset.direction));
            btn.addEventListener('mouseup', () => this.handleDirectionRelease());
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleDirectionPress(btn.dataset.direction);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleDirectionRelease();
            });
        });
        
        // Soporte para teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    /**
     * Inicializa los controles del brazo robótico
     */
    initArmControls() {
        // Joystick 1: Base y Hombro (con drag)
        this.initDraggableJoystick('joystick1Visual', 'joystick1Stick', (x, y) => {
            // x controla la base (-1 a 1), y controla el hombro (-1 a 1)
            this.armState.base = Math.round(90 + (x * 90)); // 0-180
            this.armState.shoulder = Math.round(90 - (y * 90)); // 0-180 (invertido)
            
            // Limitar valores
            this.armState.base = Math.max(0, Math.min(180, this.armState.base));
            this.armState.shoulder = Math.max(0, Math.min(180, this.armState.shoulder));
            
            document.getElementById('baseValue').textContent = `${this.armState.base}°`;
            document.getElementById('shoulderValue').textContent = `${this.armState.shoulder}°`;
            
            this.sendArmCommand('base', this.armState.base);
            this.sendArmCommand('shoulder', this.armState.shoulder);
        });
        
        // Joystick 2: Codo (con drag vertical)
        this.initDraggableJoystick('joystick2Visual', 'joystick2Stick', (x, y) => {
            // Solo y controla el codo (-1 a 1)
            this.armState.elbow = Math.round(90 - (y * 90)); // 0-180 (invertido)
            
            // Limitar valores
            this.armState.elbow = Math.max(0, Math.min(180, this.armState.elbow));
            
            document.getElementById('elbowValue').textContent = `${this.armState.elbow}°`;
            
            this.sendArmCommand('elbow', this.armState.elbow);
        });
        
        // Botón de pinza (toggle)
        const gripperButton = document.getElementById('gripperButton');
        if (gripperButton) {
            gripperButton.addEventListener('click', () => this.toggleGripper());
        }
        
        // Botón de reset del brazo
        const resetButton = document.getElementById('resetArm');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetArm());
        }
    }
    
    /**
     * Inicializa un joystick arrastrable
     */
    initDraggableJoystick(containerId, stickId, callback) {
        const container = document.getElementById(containerId);
        const stick = document.getElementById(stickId);
        let isDragging = false;
        
        const updatePosition = (e) => {
            const rect = container.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            let clientX, clientY;
            if (e.type.includes('touch')) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            let x = clientX - rect.left - centerX;
            let y = clientY - rect.top - centerY;
            
            // Limitar al círculo
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = centerX - 35; // Radio del contenedor - radio del stick
            
            if (distance > maxDistance) {
                const angle = Math.atan2(y, x);
                x = Math.cos(angle) * maxDistance;
                y = Math.sin(angle) * maxDistance;
            }
            
            // Actualizar posición del stick
            stick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            
            // Normalizar valores (-1 a 1)
            const normalizedX = x / maxDistance;
            const normalizedY = y / maxDistance;
            
            callback(normalizedX, normalizedY);
        };
        
        const startDrag = (e) => {
            isDragging = true;
            updatePosition(e);
        };
        
        const stopDrag = () => {
            isDragging = false;
            // Volver al centro
            stick.style.transform = 'translate(-50%, -50%)';
        };
        
        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                updatePosition(e);
            }
        };
        
        // Mouse events
        container.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        // Touch events
        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrag(e);
        });
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                drag(e);
            }
        });
        document.addEventListener('touchend', stopDrag);
    }
    
    /**
     * Toggle de la pinza (abrir/cerrar)
     */
    toggleGripper() {
        const button = document.getElementById('gripperButton');
        const text = document.getElementById('gripperText');
        const angle = document.getElementById('gripperAngle');
        const currentState = button.dataset.state;
        
        if (currentState === 'open') {
            // Cerrar pinza
            this.armState.gripper = 180;
            button.dataset.state = 'closed';
            button.classList.add('closed');
            text.textContent = 'CERRAR';
            angle.textContent = '180°';
        } else {
            // Abrir pinza
            this.armState.gripper = 0;
            button.dataset.state = 'open';
            button.classList.remove('closed');
            text.textContent = 'ABRIR';
            angle.textContent = '0°';
        }
        
        this.sendArmCommand('gripper', this.armState.gripper);
    }
    
    /**
     * Inicializa el control de voz
     */
    initVoiceControl() {
        // Verificar si el navegador soporta reconocimiento de voz
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Reconocimiento de voz no soportado en este navegador');
            const micButton = document.getElementById('micButton');
            if (micButton) {
                micButton.disabled = true;
                micButton.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> No soportado';
            }
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-ES';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        
        const micButton = document.getElementById('micButton');
        
        // Mantener presionado para grabar
        micButton.addEventListener('mousedown', () => this.startRecording());
        micButton.addEventListener('mouseup', () => this.stopRecording());
        micButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        micButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        // Eventos del reconocimiento
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const transcription = document.getElementById('transcription');
            transcription.textContent = `"${transcript}"`;
            transcription.style.fontStyle = 'normal';
            transcription.style.color = '#1E1228';
            
            // Procesar comando de voz
            this.processVoiceCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Error de reconocimiento:', event.error);
            const transcription = document.getElementById('transcription');
            transcription.textContent = `Error: ${event.error}`;
            transcription.style.color = '#ea4335';
            this.isRecording = false;
            micButton.classList.remove('recording');
            document.getElementById('micText').textContent = 'Mantén presionado para hablar';
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                // Si aún está presionado, reiniciar
                this.recognition.start();
            } else {
                micButton.classList.remove('recording');
                document.getElementById('micText').textContent = 'Mantén presionado para hablar';
            }
        };
    }
    
    /**
     * Inicia la grabación de voz
     */
    startRecording() {
        if (!this.recognition || this.isRecording) return;
        
        this.isRecording = true;
        const micButton = document.getElementById('micButton');
        const micText = document.getElementById('micText');
        
        micButton.classList.add('recording');
        micText.textContent = 'Escuchando...';
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error al iniciar grabación:', error);
        }
    }
    
    /**
     * Detiene la grabación de voz
     */
    stopRecording() {
        if (!this.recognition || !this.isRecording) return;
        
        this.isRecording = false;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error al detener grabación:', error);
        }
    }
    
    /**
     * Procesa comandos de voz y los ejecuta
     */
    processVoiceCommand(transcript) {
        const command = transcript.toLowerCase();
        
        // Comandos de movimiento
        if (command.includes('adelante') || command.includes('avanza')) {
            this.sendCommand('forward');
        } else if (command.includes('atrás') || command.includes('retrocede')) {
            this.sendCommand('backward');
        } else if (command.includes('izquierda')) {
            this.sendCommand('left');
        } else if (command.includes('derecha')) {
            this.sendCommand('right');
        } else if (command.includes('detente') || command.includes('para') || command.includes('alto')) {
            this.sendCommand('stop');
        }
        // Comandos de acción
        else if (command.includes('bocina') || command.includes('claxon')) {
            this.sendCommand('horn');
        } else if (command.includes('luces') || command.includes('luz')) {
            this.sendCommand('lights');
        }
        // Comandos del brazo
        else if (command.includes('abre') && command.includes('pinza')) {
            // Simular clic en botón de pinza para abrir
            const gripperBtn = document.getElementById('gripperButton');
            if (gripperBtn && gripperBtn.dataset.state === 'closed') {
                this.toggleGripper();
            }
        } else if (command.includes('cierra') && command.includes('pinza')) {
            // Simular clic en botón de pinza para cerrar
            const gripperBtn = document.getElementById('gripperButton');
            if (gripperBtn && gripperBtn.dataset.state === 'open') {
                this.toggleGripper();
            }
        } else if (command.includes('reset') && command.includes('brazo')) {
            this.resetArm();
        } else {
            console.log('Comando de voz no reconocido:', command);
            this.showFeedback('error', 'Comando no reconocido');
        }
    }
    
    /**
     * Maneja presión de botón direccional
     */
    async handleDirectionPress(direction) {
        if (this.isCommandInProgress) return;
        
        console.log(`Dirección presionada: ${direction}`);
        await this.sendCommand(direction);
    }
    
    /**
     * Maneja liberación de botón direccional
     */
    async handleDirectionRelease() {
        console.log('Botón liberado - enviando comando de parada');
        await this.sendCommand('stop');
    }
    
    /**
     * Maneja teclas del teclado
     */
    handleKeyDown(e) {
        if (this.isCommandInProgress) return;
        
        const keyMap = {
            'ArrowUp': 'forward',
            'w': 'forward',
            'W': 'forward',
            'ArrowDown': 'backward',
            's': 'backward',
            'S': 'backward',
            'ArrowLeft': 'left',
            'a': 'left',
            'A': 'left',
            'ArrowRight': 'right',
            'd': 'right',
            'D': 'right',
            ' ': 'stop'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.handleDirectionPress(direction);
        }
    }
    
    /**
     * Maneja liberación de teclas
     */
    handleKeyUp(e) {
        const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
        if (moveKeys.includes(e.key)) {
            e.preventDefault();
            this.handleDirectionRelease();
        }
    }
    
    /**
     * Envía un comando de movimiento del brazo
     */
    async sendArmCommand(joint, value) {
        console.log(`Moviendo ${joint} a ${value}°`);
        await this.sendCommand(`arm_${joint}`, value);
    }
    
    /**
     * Resetea el brazo a la posición inicial
     */
    resetArm() {
        console.log('Reseteando brazo a posición inicial');
        
        // Resetear todos los valores a 90°
        this.armState.base = 90;
        this.armState.shoulder = 90;
        this.armState.elbow = 90;
        this.armState.gripper = 0; // Pinza abierta
        
        // Actualizar visuales
        document.getElementById('baseValue').textContent = '90°';
        document.getElementById('shoulderValue').textContent = '90°';
        document.getElementById('elbowValue').textContent = '90°';
        
        // Resetear joysticks visualmente
        document.getElementById('joystick1Stick').style.transform = 'translate(-50%, -50%)';
        document.getElementById('joystick2Stick').style.transform = 'translate(-50%, -50%)';
        
        // Resetear pinza
        const button = document.getElementById('gripperButton');
        button.dataset.state = 'open';
        button.classList.remove('closed');
        document.getElementById('gripperText').textContent = 'ABRIR';
        document.getElementById('gripperAngle').textContent = '0°';
        
        // Enviar comandos
        this.sendArmCommand('base', 90);
        this.sendArmCommand('shoulder', 90);
        this.sendArmCommand('elbow', 90);
        this.sendArmCommand('gripper', 0);
        
        this.showFeedback('success', 'Brazo reseteado a posición inicial');
    }
    
    /**
     * Envía un comando al backend mediante fetch
     */
    async sendCommand(action, value = null) {
        this.isCommandInProgress = true;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    value: value
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('Comando enviado exitosamente:', data);
                // Solo mostrar feedback para comandos del brazo y acciones especiales
                if (action.startsWith('arm_') || ['horn', 'lights', 'emergency'].includes(action)) {
                    this.showFeedback('success', `Comando "${action}" enviado`);
                }
            } else {
                console.error('Error en la respuesta:', data);
                this.showFeedback('error', data.error || 'Error al enviar comando');
            }
            
        } catch (error) {
            console.error('Error al enviar comando:', error);
            this.showFeedback('error', 'Error de conexión con el servidor');
        } finally {
            // Pequeño delay para evitar spam de comandos
            setTimeout(() => {
                this.isCommandInProgress = false;
            }, 100);
        }
    }
    
    /**
     * Obtiene el estado actual del robot
     */
    async fetchRobotStatus() {
        try {
            const response = await fetch(this.statusUrl);
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.updateStatusDisplay(data.robot);
            }
        } catch (error) {
            console.error('Error al obtener estado del robot:', error);
        }
    }
    
    /**
     * Actualiza la interfaz con el estado del robot
     */
    updateStatusDisplay(robotData) {
        // Actualizar sensores si hay datos
        if (robotData.sensors) {
            const { temperature, speed, distance } = robotData.sensors;
            
            if (temperature !== undefined) {
                const tempEl = document.getElementById('temperature');
                if (tempEl) tempEl.textContent = `${temperature}°C`;
            }
            
            if (speed !== undefined) {
                const speedEl = document.getElementById('speed');
                if (speedEl) speedEl.textContent = `${speed} m/s`;
            }
            
            if (distance !== undefined) {
                const distEl = document.getElementById('distance');
                if (distEl) distEl.textContent = `${distance} cm`;
            }
        }
        
        // Actualizar badge de estado
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = robotData.is_online ? 
                'status-badge status-online' : 
                'status-badge status-offline';
            statusBadge.innerHTML = robotData.is_online ?
                '<i class="fa-solid fa-circle"></i> En línea' :
                '<i class="fa-solid fa-circle"></i> Desconectado';
        }
    }
    
    /**
     * Inicia el polling periódico del estado del robot
     */
    startStatusPolling() {
        // Obtener estado inmediatamente
        this.fetchRobotStatus();
        
        // Luego cada 5 segundos
        setInterval(() => {
            this.fetchRobotStatus();
        }, 5000);
    }
    
    /**
     * Muestra feedback visual al usuario
     */
    showFeedback(type, message) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Las variables ROBOT_ID y MQTT_TOPIC se inyectan desde el template
    if (typeof ROBOT_ID !== 'undefined') {
        window.robotController = new RobotController(ROBOT_ID, MQTT_TOPIC);
    }
});

// Agregar estilos para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
