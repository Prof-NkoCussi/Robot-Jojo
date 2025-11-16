# proyojo/app/__init__.py

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from config import Config

# 1. Creación de instancias de extensiones (sin inicializar)
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

# 2. Configuración de LoginManager
#    A dónde redirigir al usuario si intenta acceder a una página protegida sin estar logueado.
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, inicia sesión para acceder a esta página.'
login_manager.login_message_category = 'warning'


def create_app(config_class=Config):
    """
    Fábrica de la aplicación Flask.
    """
    # 3. Creación y configuración de la instancia de la app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # 4. Inicialización de las extensiones con la app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    # 5. Creación de la carpeta 'instance' si no existe
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # 6. Registro de los Blueprints (módulos de la aplicación)
    with app.app_context():
        from .blueprints import auth, dashboard
        app.register_blueprint(auth.auth_bp)
        app.register_blueprint(dashboard.dashboard_bp)

    # 7. Registro de los Comandos CLI
    from .commands import seed_roles_command, create_admin_command
    app.cli.add_command(seed_roles_command)
    app.cli.add_command(create_admin_command)

    # 8. Importar los modelos para que SQLAlchemy y Flask-Migrate los reconozcan
    from . import models

    # 9. Configuración del cargador de usuario para Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return models.User.query.get(int(user_id))

    # 10. Ruta de prueba (opcional, la podemos quitar más adelante)
    @app.route('/test')
    def test_page():
        return "<h1>¡La fábrica de aplicaciones funciona correctamente!</h1>"

    return app