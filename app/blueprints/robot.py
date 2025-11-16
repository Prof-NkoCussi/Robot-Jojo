# --- AÑADIR ESTA NUEVA RUTA ---
@robot_bp.route('/robots')
@login_required
def select():
    """Muestra la lista de robots disponibles para el usuario."""
    # Obtenemos la lista de robots que pertenecen al usuario actual.
    # La relación 'robots' la definimos en el modelo User con backref.
    user_robots = current_user.robots
    return render_template('robot/select.html', robots=user_robots)