# proyojo/app/commands.py

import click
from app import db
from app.models import Role, User, Robot  # <-- Añadimos Robot aquí

# El comando seed-roles no necesita cambios, pero lo dejamos para que el archivo esté completo.
@click.command('seed-roles')
def seed_roles_command():
    """Crea los roles iniciales en la base de datos."""
    
    ROLES = [
        {'name': 'user', 'display_name': 'Usuario', 'description': 'Usuario estándar con permisos básicos.'},
        {'name': 'support', 'display_name': 'Soporte', 'description': 'Puede gestionar usuarios y robots.'},
        {'name': 'admin', 'display_name': 'Administrador', 'description': 'Control total del sistema.'}
    ]
    
    click.echo("Buscando y creando roles iniciales...")
    
    for role_data in ROLES:
        role = Role.query.filter_by(name=role_data['name']).first()
        if not role:
            new_role = Role(
                name=role_data['name'],
                display_name=role_data['display_name'],
                description=role_data['description']
            )
            db.session.add(new_role)
            click.echo(click.style(f"Rol '{role_data['name']}' creado.", fg='green'))
        else:
            click.echo(click.style(f"Rol '{role_data['name']}' ya existe.", fg='yellow'))
            
    db.session.commit()
    click.echo(click.style("Proceso de creación de roles finalizado.", fg='blue'))


# --- Este es el comando que fallaba ---
@click.command('create-admin')
@click.option('--username', prompt='Nombre de usuario', help='El nombre de usuario para el nuevo administrador.')
@click.option('--email', prompt='Email', help='El email para el nuevo administrador.')
@click.option('--password', prompt='Contraseña', hide_input=True, confirmation_prompt=True, help='La contraseña para el nuevo administrador.')
def create_admin_command(username, email, password):
    """Crea un usuario administrador inicial."""
    
    click.echo("Iniciando creación de usuario administrador...")

    if User.query.filter((User.username == username) | (User.email == email)).first():
        click.echo(click.style("Error: El nombre de usuario o email ya existe.", fg='red'))
        return

    admin_role = Role.query.filter_by(name='admin').first()
    if not admin_role:
        click.echo(click.style("Error: El rol 'admin' no se encuentra. Ejecuta 'flask seed-roles' primero.", fg='red'))
        return

    new_admin = User(
        username=username,
        email=email
    )
    new_admin.set_password(password)
    new_admin.roles.append(admin_role)

    db.session.add(new_admin)
    db.session.commit()

    click.echo(click.style(f"Usuario administrador '{username}' creado exitosamente.", fg='green'))


# --- Nuevo comando para crear robots ---
@click.command('create-robot')
@click.option('--name', prompt='Nombre del robot', help='Nombre descriptivo del robot.')
@click.option('--serial', prompt='Número de serie', help='Número de serie único del robot.')
@click.option('--username', prompt='Usuario propietario', help='Nombre de usuario del propietario.')
@click.option('--mqtt-topic', default=None, help='Tópico MQTT base (opcional, se generará automáticamente si no se proporciona).')
def create_robot_command(name, serial, username, mqtt_topic):
    """Crea un nuevo robot y lo asocia a un usuario."""
    
    click.echo("Iniciando creación de robot...")
    
    # Verificar que el usuario existe
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(click.style(f"Error: El usuario '{username}' no existe.", fg='red'))
        return
    
    # Verificar que el serial no esté duplicado
    if Robot.query.filter_by(serial_number=serial).first():
        click.echo(click.style(f"Error: Ya existe un robot con el número de serie '{serial}'.", fg='red'))
        return
    
    # Generar tópico MQTT si no se proporcionó
    if not mqtt_topic:
        mqtt_topic = f"jojo/{serial.lower().replace(' ', '_')}"
    
    # Crear el robot
    new_robot = Robot(
        name=name,
        serial_number=serial,
        mqtt_topic=mqtt_topic,
        user_id=user.id,
        is_active=True,
        is_online=False,
        battery_level=100
    )
    
    db.session.add(new_robot)
    db.session.commit()
    
    click.echo(click.style(f"✓ Robot '{name}' creado exitosamente.", fg='green'))
    click.echo(f"  - Número de serie: {serial}")
    click.echo(f"  - Propietario: {username}")
    click.echo(f"  - Tópico MQTT: {mqtt_topic}")
    click.echo(f"  - ID: {new_robot.id}")


@click.command('seed-robots')
def seed_robots_command():
    """Crea robots de prueba en la base de datos."""
    
    ROBOTS = [
        {
            'name': 'JOJO',
            'serial_number': 'JOJO-001',
            'mqtt_topic': 'jojo/jojo',
            'description': 'Robot asistente principal JOJO - Control maestro del sistema.'
        },
        {
            'name': 'Carl',
            'serial_number': 'CARL-001',
            'mqtt_topic': 'jojo/carl',
            'description': 'Robot asistente Carl.'
        },
        {
            'name': 'Tina',
            'serial_number': 'TINA-001',
            'mqtt_topic': 'jojo/tina',
            'description': 'Robot asistente Tina.'
        }
    ]
    
    click.echo("Creando robots de prueba...")
    
    for robot_data in ROBOTS:
        robot = Robot.query.filter_by(serial_number=robot_data['serial_number']).first()
        if not robot:
            new_robot = Robot(
                name=robot_data['name'],
                serial_number=robot_data['serial_number'],
                mqtt_topic=robot_data['mqtt_topic'],
                description=robot_data['description'],
                is_active=True,
                is_online=False,
                battery_level=100
            )
            db.session.add(new_robot)
            click.echo(click.style(f"✓ Robot '{robot_data['name']}' creado.", fg='green'))
        else:
            click.echo(click.style(f"Robot '{robot_data['name']}' ya existe.", fg='yellow'))
    
    db.session.commit()
    click.echo(click.style("Robots de prueba creados exitosamente.", fg='blue'))