# proyojo/app/commands.py

import click
from app import db
from app.models import Role, User  # <-- IMPORTAMOS User AQUÍ, ESTA ERA LA LÍNEA QUE FALTABA

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