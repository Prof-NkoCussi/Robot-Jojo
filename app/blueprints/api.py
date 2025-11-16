# proyojo/app/blueprints/api.py

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import Robot
from app.mqtt_client import mqtt_client
import logging
import json

api_bp = Blueprint('api', __name__, url_prefix='/api')

logger = logging.getLogger(__name__)

@api_bp.route('/robot/<int:robot_id>/command', methods=['POST'])
@login_required
def send_command(robot_id):
    """
    Endpoint para enviar comandos al robot.
    Recibe JSON con: {action: 'forward'|'backward'|'left'|'right'|'stop'|etc, value: optional}
    """
    try:
        # Obtener el robot
        robot = Robot.query.get_or_404(robot_id)
        
        # Verificar que el robot está en la lista de robots del usuario
        if robot not in current_user.robots:
            return jsonify({'error': 'No autorizado'}), 403
        
        # Verificar que el robot esté activo
        if not robot.is_active:
            return jsonify({'error': 'Robot inactivo'}), 400
        
        # Obtener datos del comando
        data = request.get_json()
        action = data.get('action')
        value = data.get('value', None)
        
        if not action:
            return jsonify({'error': 'Acción no especificada'}), 400
        
        # Preparar el mensaje MQTT
        mqtt_payload = {
            'action': action,
            'value': value,
            'timestamp': str(db.func.current_timestamp())
        }
        
        # Publicar el comando en el tópico MQTT del robot
        topic = f"{robot.mqtt_topic}/command"
        success = mqtt_client.publish(topic, mqtt_payload, qos=1)
        
        if success:
            logger.info(f"Comando enviado - Robot: {robot.name}, Acción: {action}, Valor: {value}")
            return jsonify({
                'success': True,
                'message': f'Comando {action} enviado a {robot.name}',
                'robot_id': robot_id,
                'action': action,
                'value': value
            }), 200
        else:
            logger.error(f"Error al publicar comando MQTT para robot {robot.name}")
            return jsonify({
                'success': False,
                'error': 'Error al comunicarse con el robot'
            }), 500
        
    except Exception as e:
        logger.error(f"Error al enviar comando: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@api_bp.route('/robot/<int:robot_id>/status', methods=['GET'])
@login_required
def get_robot_status(robot_id):
    """
    Obtiene el estado actual del robot.
    """
    try:
        robot = Robot.query.get_or_404(robot_id)
        
        if robot not in current_user.robots:
            return jsonify({'error': 'No autorizado'}), 403
        
        return jsonify({
            'success': True,
            'robot': {
                'id': robot.id,
                'name': robot.name,
                'serial_number': robot.serial_number,
                'is_online': robot.is_online,
                'is_active': robot.is_active,
                'battery_level': robot.battery_level,
                'last_seen': robot.last_seen.isoformat() if robot.last_seen else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error al obtener estado: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500
