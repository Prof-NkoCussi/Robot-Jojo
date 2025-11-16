# proyojo/app/blueprints/dashboard.py

from flask import Blueprint, render_template
from flask_login import login_required, current_user

# El nombre 'dashboard_bp' es el que importaremos
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@dashboard_bp.route('/dashboard')
@login_required
def index():
    # Usamos current_user que nos lo da Flask-Login para acceder al usuario actual
    return render_template('dashboard/index.html', title="Dashboard", user=current_user)