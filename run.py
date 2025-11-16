from app import create_app
import os # Añadimos esta línea por si acaso, es buena práctica

# Creamos una instancia de nuestra aplicación llamando a la fábrica
# Pasamos el contexto de la aplicación para que Flask sepa dónde está todo
app = create_app()

if __name__ == '__main__':
    # Ejecutamos la aplicación en modo debug
    app.run(debug=True, host='0.0.0.0', port=5000)