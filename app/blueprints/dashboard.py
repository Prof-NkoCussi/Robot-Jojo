# proyojo/app/blueprints/dashboard.py

from flask import Blueprint, render_template
from flask_login import login_required, current_user
from app.models import Robot

# El nombre 'dashboard_bp' es el que importaremos
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@dashboard_bp.route('/dashboard')
@login_required
def index():
    # Obtener robots del usuario
    user_robots = current_user.robots
    
    # Calcular estadísticas
    total_robots = len(user_robots)
    robots_online = sum(1 for robot in user_robots if robot.is_online)
    robots_offline = total_robots - robots_online
    
    # Promedio de batería
    avg_battery = sum(robot.battery_level for robot in user_robots) / total_robots if total_robots > 0 else 0
    
    stats = {
        'total_robots': total_robots,
        'robots_online': robots_online,
        'robots_offline': robots_offline,
        'avg_battery': round(avg_battery, 1)
    }
    
    return render_template('dashboard/index.html', 
                         title="Dashboard", 
                         user=current_user,
                         robots=user_robots,
                         stats=stats)

@dashboard_bp.route('/mapeado')
@login_required
def mapeado():
    """Página de mapeado del entorno del robot."""
    return render_template('dashboard/mapeado.html', title="Mapeado", user=current_user)

@dashboard_bp.route('/recordatorios')
@login_required
def recordatorios():
    """Página de gestión de recordatorios."""
    return render_template('dashboard/recordatorios.html', title="Recordatorios", user=current_user)

@dashboard_bp.route('/videollamada')
@login_required
def videollamada():
    """Página de videollamada en vivo."""
    return render_template('dashboard/videollamada.html', title="Videollamada", user=current_user)