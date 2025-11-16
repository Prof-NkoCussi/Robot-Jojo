# 🤖 JoJo - AsisTECH: Sistema de Control de Robot Asistente

> Aplicación web Flask para control y gestión de robots asistenciales para adultos mayores

## 📋 Índice

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API REST](#-api-rest)
- [Próximos Pasos](#-próximos-pasos)

---

## ✨ Características

### ✅ Implementado

- **Autenticación completa**: Sistema de login/logout con Flask-Login
- **Sistema de roles**: Admin, Support, User
- **Gestión de robots**: CRUD completo de robots asociados a usuarios
- **Control en tiempo real**: Interfaz web para controlar robots mediante botones direccionales
- **Comunicación MQTT**: Integración con paho-mqtt para envío de comandos
- **API REST**: Endpoints para comandos y estado de robots
- **Interfaz profesional**: Dashboard y páginas estilizadas
- **Comandos CLI**: Herramientas para crear usuarios, roles y robots

### 🔄 En Desarrollo

- Transmisión de video en vivo desde la cámara del robot
- Sistema de recordatorios y alertas
- Mapeado del hogar
- Videollamadas integradas
- Telemetría avanzada de sensores

---

## 🔧 Requisitos

- **Python 3.8+**
- **Broker MQTT** (opcional, para probar comunicación real)
  - Mosquitto (recomendado)
  - HiveMQ
  - EMQX

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyjojo
```

### 2. Crear y activar entorno virtual

```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Edita el archivo `.env` con tu configuración:

```env
SECRET_KEY='tu-clave-secreta-super-segura'

# Configuración MQTT
MQTT_BROKER_HOST='localhost'
MQTT_BROKER_PORT=1883
MQTT_USERNAME=''
MQTT_PASSWORD=''
MQTT_KEEPALIVE=60
```

### 5. Inicializar la base de datos

```bash
# Aplicar migraciones
flask db upgrade

# Crear roles iniciales
flask seed-roles

# Crear usuario administrador
flask create-admin
```

---

## ⚙️ Configuración

### Crear un robot de prueba

```bash
flask create-robot
```

El comando te pedirá:
- **Nombre del robot**: Ej. "JoJo-001"
- **Número de serie**: Ej. "SN-12345"
- **Usuario propietario**: Username del usuario que creaste
- **Tópico MQTT** (opcional): Se genera automáticamente si no lo proporcionas

### Instalar broker MQTT (opcional)

#### Windows - Mosquitto

```bash
# Descargar desde: https://mosquitto.org/download/
# O usar Chocolatey:
choco install mosquitto

# Iniciar el broker
mosquitto -v
```

#### Linux

```bash
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

---

## 🚀 Uso

### Iniciar la aplicación

```bash
python run.py
```

La aplicación estará disponible en:
- Local: http://127.0.0.1:5000
- Red: http://192.168.1.X:5000

### Flujo de uso

1. **Login**: Accede con las credenciales que creaste
2. **Dashboard**: Verás el panel principal con acciones rápidas
3. **Mis Robots**: Haz clic en "Buscar mi Asistente" o ve a `/robots`
4. **Controlar robot**: Selecciona un robot para acceder a la interfaz de control
5. **Enviar comandos**: Usa los botones o las teclas WASD/Flechas

### Teclas de control

- **W / ↑**: Adelante
- **S / ↓**: Atrás
- **A / ←**: Izquierda
- **D / →**: Derecha
- **Espacio**: Detener

---

## 📁 Estructura del Proyecto

```
proyjojo/
├── app/
│   ├── __init__.py              # Fábrica de la aplicación
│   ├── models.py                # Modelos de BD (User, Role, Robot)
│   ├── commands.py              # Comandos CLI
│   ├── mqtt_client.py           # Cliente MQTT singleton
│   ├── blueprints/
│   │   ├── auth.py             # Autenticación
│   │   ├── dashboard.py        # Dashboard principal
│   │   ├── robot.py            # Gestión de robots
│   │   └── api.py              # API REST
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/               # Login, registro
│   │   ├── dashboard/          # Páginas del dashboard
│   │   └── robot/              # Selección y control
│   └── static/
│       ├── css/                # Estilos
│       └── js/
│           ├── layout.js
│           └── robot_control.js # Lógica de control
├── migrations/                  # Migraciones de BD
├── instance/                    # Base de datos SQLite
├── config.py                    # Configuración
├── run.py                       # Punto de entrada
├── requirements.txt
└── .env                         # Variables de entorno
```

---

## 🔌 API REST

### Enviar comando al robot

**POST** `/api/robot/<robot_id>/command`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "action": "forward",
  "value": null
}
```

**Acciones disponibles:**
- `forward`, `backward`, `left`, `right`, `stop`
- `speed-up`, `speed-down`
- `horn`, `lights`, `emergency`

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Comando forward enviado a JoJo-001",
  "robot_id": 1,
  "action": "forward",
  "value": null
}
```

### Obtener estado del robot

**GET** `/api/robot/<robot_id>/status`

**Respuesta:**
```json
{
  "success": true,
  "robot": {
    "id": 1,
    "name": "JoJo-001",
    "serial_number": "SN-12345",
    "is_online": false,
    "is_active": true,
    "battery_level": 100,
    "last_seen": null
  }
}
```

---

## 🎯 Próximos Pasos

### Funcionalidades Prioritarias

1. **Streaming de video**
   - Integrar WebRTC o MJPEG stream
   - Implementar en la plantilla `robot/control.html`

2. **Telemetría en tiempo real**
   - Suscripción a tópicos MQTT de sensores
   - Actualización dinámica de valores en la interfaz

3. **Sistema de recordatorios**
   - Modelo `Reminder` en la base de datos
   - CRUD de recordatorios
   - Notificaciones programadas

4. **Mapeado del hogar**
   - Integración con SLAM (mapa 2D del hogar)
   - Visualización en el dashboard

5. **Mejoras de seguridad**
   - Implementar HTTPS
   - Autenticación MQTT con certificados
   - Rate limiting en la API

### Comandos CLI Adicionales

```bash
# Listar todos los robots
flask list-robots

# Eliminar un robot
flask delete-robot --id 1

# Resetear contraseña de usuario
flask reset-password --username juan
```

---

## 🛠️ Desarrollo

### Ejecutar migraciones

```bash
# Crear nueva migración
flask db migrate -m "Descripción del cambio"

# Aplicar migraciones
flask db upgrade

# Revertir última migración
flask db downgrade
```

### Debug

El modo debug está activado por defecto en `run.py`. Desactívalo en producción:

```python
app.run(debug=False, host='0.0.0.0', port=5000)
```

---

## 📝 Notas Técnicas

### MQTT Topics Structure

```
jojo/<serial_number>/command    # Comandos hacia el robot
jojo/<serial_number>/status     # Estado del robot
jojo/<serial_number>/telemetry  # Datos de sensores
jojo/<serial_number>/video      # Stream de video (futuro)
```

### Base de Datos

- **SQLite** en desarrollo
- Para producción, cambiar a PostgreSQL o MySQL en `config.py`

---

## 📄 Licencia

Este proyecto es parte de AsisTECH y está protegido por derechos de autor.

---

## 👥 Contacto

Para dudas o sugerencias sobre el desarrollo del proyecto, contacta al equipo de desarrollo.

---

**Versión:** 0.2.0  
**Última actualización:** Noviembre 2025
