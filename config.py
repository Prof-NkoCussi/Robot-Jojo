# proyojo/config.py

import os
from dotenv import load_dotenv

# Carga las variables de entorno del archivo .env
load_dotenv()

class Config:
    """Clase base de configuración."""
    
    # Clave secreta para proteger formularios y sesiones.
    # Es VITAL para la seguridad.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'una-clave-secreta-muy-dificil-de-adivinar'
    
    # Configuración de la Base de Datos
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'jojo.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False