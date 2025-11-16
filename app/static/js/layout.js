// proyojo/app/static/js/layout.js
document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.querySelector('.navbar .menu-toggle');
    const closeBtn = document.querySelector('.sidebar .close-btn');
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;

    function toggleSidebar() {
        // La acción es la misma en móvil y escritorio: mostrar/ocultar el sidebar
        sidebar.classList.toggle('is-visible');

        // Solo en escritorio, añadimos una clase al body para "empujar" el contenido
        if (window.innerWidth > 900) {
            body.classList.toggle('sidebar-is-visible');
        }
    }
    
    // El botón sándwich SIEMPRE abre/cierra
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    // El botón 'X' SIEMPRE cierra
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('is-visible');
            if (window.innerWidth > 900) {
                body.classList.remove('sidebar-is-visible');
            }
        });
    }
});