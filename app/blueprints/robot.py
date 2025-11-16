# proyojo/app/blueprints/robot.py

from flask import Blueprint, render_template, redirect, url_for, flash, jsonify, request
from flask_login import login_required, current_user
from app import db
from app.models import Robot

robot_bp = Blueprint('robot', __name__)

@robot_bp.route('/robots')
@login_required
def select():
    """Muestra la lista de robots disponibles para el usuario."""
    user_robots = current_user.robots
    return render_template('robot/select.html', robots=user_robots, title="Mis Robots")

@robot_bp.route('/robot/<int:robot_id>/control')
@login_required
def control(robot_id):
    """Página de control de un robot específico."""
    robot = Robot.query.get_or_404(robot_id)
    
    # Verificar que el robot está en la lista de robots del usuario
    if robot not in current_user.robots:
        flash('No tienes permiso para controlar este robot.', 'danger')
        return redirect(url_for('robot.select'))
    
    return render_template('robot/control.html', robot=robot, title=f"Control - {robot.name}")