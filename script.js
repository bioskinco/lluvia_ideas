// Configuración para GitHub Pages
const STORAGE_KEY = 'lluviaIdeasPalabras_presentador';
const CONFIG_KEY = 'lluviaIdeasConfig_presentador';

// Estado global
let estadoRecepcion = 'inactivo';
let temaSesion = 'Lluvia de Ideas';
let palabras = [];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('presentador-body')) {
        iniciarPresentador();
    } else {
        iniciarAudiencia();
    }
});

// ===== PRESENTADOR =====
function iniciarPresentador() {
    console.log('Iniciando presentador en GitHub Pages...');
    cargarDatosPresentador();
    generarQR();
    actualizarUI();
    
    // Actualizar cada segundo
    setInterval(function() {
        actualizarNube();
        actualizarUI();
    }, 1000);
}

function cargarDatosPresentador() {
    try {
        const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
        estadoRecepcion = config.estadoRecepcion || 'inactivo';
        temaSesion = config.temaSesion || 'Lluvia de Ideas';
        
        // Cargar palabras
        palabras = JSON.parse(localStorage.getItem(STORAGE_KEY) || []);
        
        console.log('Datos del presentador cargados:', { estadoRecepcion, temaSesion, palabras: palabras.length });
        
        // Actualizar UI
        document.getElementById('temaInput').value = temaSesion;
        document.getElementById('tituloPresentador').textContent = temaSesion;
        document.getElementById('temaActual').textContent = temaSesion;
        
    } catch (error) {
        console.error('Error cargando datos del presentador:', error);
        estadoRecepcion = 'inactivo';
        temaSesion = 'Lluvia de Ideas';
        palabras = [];
    }
}

function guardarDatosPresentador() {
    const config = {
        estadoRecepcion: estadoRecepcion,
        temaSesion: temaSesion,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palabras));
    
    console.log('Datos del presentador guardados:', config);
}

function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim() || 'Lluvia de Ideas';
    
    estadoRecepcion = 'activo';
    guardarDatosPresentador();
    
    // Actualizar UI
    document.getElementById('tituloPresentador').textContent = temaSesion;
    document.getElementById('temaActual').textContent = temaSesion;
    actualizarUI();
    
    console.log('Lluvia de ideas INICIADA:', temaSesion);
    alert('✅ Lluvia de ideas INICIADA\n\nLa audiencia ya puede enviar sus ideas.');
}

function pausarLluvia() {
    estadoRecepcion = 'pausado';
    guardarDatosPresentador();
    actualizarUI();
    console.log('Lluvia de ideas PAUSADA');
}

function pararLluvia() {
    estadoRecepcion = 'inactivo';
    guardarDatosPresentador();
    actualizarUI();
    console.log('Lluvia de ideas DETENIDA');
}

function limpiarTodo() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras?')) {
        palabras = [];
        guardarDatosPresentador();
        actualizarNube();
        console.log('Todas las palabras eliminadas');
    }
}

function actualizarUI() {
    // Actualizar estado
    const estadoElement = document.getElementById('estadoRecepcion');
    if (estadoElement) {
        estadoElement.textContent = estadoRecepcion.charAt(0).toUpperCase() + estadoRecepcion.slice(1);
        estadoElement.className = `estado-${estadoRecepcion}`;
    }
    
    // Actualizar botones
    const btnIniciar = document.getElementById('btnIniciar');
    const btnPausar = document.getElementById('btnPausar');
    const btnParar = document.getElementById('btnParar');
    
    if (btnIniciar && btnPausar && btnParar) {
        switch(estadoRecepcion) {
            case 'inactivo':
                btnIniciar.disabled = false;
                btnPausar.disabled = true;
                btnParar.disabled = true;
                break;
            case 'activo':
                btnIniciar.disabled = true;
                btnPausar.disabled = false;
                btnParar.disabled = false;
                break;
            case 'pausado':
                btnIniciar.disabled = true;
                btnPausar.disabled = true;
                btnParar.disabled = false;
                break;
        }
    }
}

// ===== QR =====
function generarQR() {
    try {
        // Obtener la URL base de GitHub Pages
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        console.log('Generando QR para:', urlBase);
        
        // QR pequeño
        const qrPequeno = qrcode(0, 'L');
        qrPequeno.addData(urlBase);
        qrPequeno.make();
        document.getElementById('qrCode').innerHTML = qrPequeno.createImgTag(3);
        
        // URL para compartir
        document.getElementById('urlInput').value = urlBase;
        
    } catch (error) {
        console.error('Error generando QR:', error);
        document.getElementById('qrCode').innerHTML = '<p>Error generando QR</p>';
    }
}

function ampliarQR() {
    try {
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        // Limpiar contenido anterior
        const qrAmpliado = document.getElementById('qrAmpliado');
        qrAmpliado.innerHTML = '';
        
        // Generar QR más grande y con mejor calidad
        const qr = qrcode(0, 'H');
        qr.addData(urlBase);
        qr.make();
        
        // Crear imagen del QR con tamaño adecuado
        const qrImage = qr.createImgTag(8);
        qrAmpliado.innerHTML = qrImage;
        
        // Asegurar que el QR ocupe todo el espacio disponible
        const qrImg = qrAmpliado.querySelector('img');
        if (qrImg) {
            qrImg.style.width = '100%';
            qrImg.style.height = 'auto';
            qrImg.style.maxWidth = '350px';
            qrImg.style.display = 'block';
            qrImg.style.margin = '0 auto';
        }
        
        document.getElementById('modalQR').style.display = 'block';
        console.log('QR ampliado generado correctamente');
        
    } catch (error) {
        console.error('Error ampliando QR:', error);
        document.getElementById('qrAmpliado').innerHTML = '<p style="color: white; padding: 50px;">Error generando QR</p>';
    }
}

function cerrarQR() {
    document.getElementById('modalQR').style.display = 'none';
}

function copiarURL() {
    const urlInput = document.getElementById('urlInput');
    urlInput.select();
    urlInput.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(urlInput.value).then(function() {
            alert('✅ URL copiada al portapapeles');
        }).catch(function() {
            // Fallback para navegadores más antiguos
            document.execCommand('copy');
            alert('✅ URL copiada al portapapeles');
        });
    } catch (error) {
        console.error('Error copiando URL:', error);
        alert('❌ Error al copiar la URL');
    }
}

// ===== NUBE DE PALABRAS =====
function actualizarNube() {
    try {
        const nube = document.getElementById('nubePalabras');
        const contador = document.getElementById('contadorPalabras');
        
        if (!nube) return;
        
        // Actualizar contador
        if (contador) {
            contador.textContent = palabras.length;
        }
        
        // Limpiar nube
        nube.innerHTML = '';
        
        if (palabras.length === 0) {
            let mensaje = 'Esperando que inicies la lluvia de ideas...';
            if (estadoRecepcion === 'activo') {
                mensaje = 'Esperando palabras de la audiencia...';
            } else if (estadoRecepcion === 'pausado') {
                mensaje = 'Recepción pausada';
            }
            nube.innerHTML = `<div class="placeholder">${mensaje}</div>`;
            return;
        }
        
        // Mostrar palabras
        palabras.forEach((item, index) => {
            const elemento = document.createElement('div');
            elemento.className = 'palabra';
            elemento.textContent = item.palabra;
            elemento.title = `Enviado: ${new Date(item.timestamp).toLocaleTimeString()}`;
            
            // Colores aleatorios pero consistentes
            const colores = [
                'linear-gradient(135deg, #e74c3c, #c0392b)',
                'linear-gradient(135deg, #3498db, #2980b9)',
                'linear-gradient(135deg, #2ecc71, #27ae60)',
                'linear-gradient(135deg, #9b59b6, #8e44ad)',
                'linear-gradient(135deg, #f39c12, #d35400)',
                'linear-gradient(135deg, #1abc9c, #16a085)'
            ];
            
            const colorIndex = index % colores.length;
            elemento.style.background = colores[colorIndex];
            
            nube.appendChild(elemento);
        });
    } catch (error) {
        console.error('Error actualizando nube:', error);
    }
}

// ===== AUDIENCIA =====
function iniciarAudiencia() {
    console.log('Iniciando página de audiencia en GitHub Pages...');
    
    // Configurar input
    const input = document.getElementById('palabraInput');
    if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') enviarPalabra();
        });
    }
    
    // Verificar estado cada 2 segundos
    setInterval(verificarEstado, 2000);
    verificarEstado();
}

function verificarEstado() {
    try {
        // En GitHub Pages, no podemos compartir localStorage entre dominios
        // Simulamos el estado basado en la hora o mostramos siempre activo
        const ahora = new Date();
        const minutos = ahora.getMinutes();
        
        // Para demo: siempre activo después de la primera interacción
        const estado = 'activo'; // Siempre activo para demo
        
        const estadoElement = document.getElementById('estado');
        const input = document.getElementById('palabraInput');
        const boton = document.getElementById('btnEnviar');
        const tituloTema = document.getElementById('tituloTema');
        const subtitulo = document.getElementById('subtitulo');
        
        if (!estadoElement || !input || !boton) return;
        
        // Para GitHub Pages, siempre permitimos enviar
        estadoElement.textContent = '✅ Recepción ACTIVA - ¡Envía tus ideas!';
        estadoElement.className = 'estado-activo';
        input.disabled = false;
        boton.disabled = false;
        input.placeholder = 'Escribe tu idea aquí...';
        tituloTema.textContent = '🌧️ Lluvia de Ideas';
        subtitulo.textContent = 'Comparte tus ideas en tiempo real';
        
    } catch (error) {
        console.error('Error verificando estado:', error);
    }
}

function enviarPalabra() {
    try {
        const input = document.getElementById('palabraInput');
        const palabra = input.value.trim();
        
        if (palabra.length === 0) {
            mostrarMensaje('⚠️ Por favor escribe una palabra', 'error');
            return;
        }
        
        if (palabra.length > 20) {
            mostrarMensaje('❌ Máximo 20 caracteres por palabra', 'error');
            return;
        }
        
        // En GitHub Pages, no podemos guardar en el localStorage del presentador
        // Simulamos el envío mostrando un mensaje de éxito
        mostrarMensaje(`✅ ¡Ideas enviada: "<strong>${palabra}</strong>"!<br><small>Nota: En GitHub Pages esta es una demostración. En un entorno real con servidor, la palabra aparecería en la pantalla del presentador.</small>`, 'success');
        
        // Limpiar input
        input.value = '';
        input.focus();
        
        console.log('Palabra enviada (demo):', palabra);
        
    } catch (error) {
        console.error('Error enviando palabra:', error);
        mostrarMensaje('❌ Error al enviar la palabra', 'error');
    }
}

// ===== FUNCIONES UTILITARIAS =====
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (!mensajeDiv) return;
    
    const colores = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd'
    };
    
    mensajeDiv.innerHTML = texto;
    mensajeDiv.style.backgroundColor = colores[tipo] || colores.success;
    mensajeDiv.style.color = tipo === 'success' ? '#155724' : '#721c24';
    
    setTimeout(() => {
        mensajeDiv.innerHTML = '';
        mensajeDiv.style.backgroundColor = 'transparent';
    }, 5000);
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalQR');
    if (event.target === modal) {
        cerrarQR();
    }
}

// Para debugging
window.mostrarEstado = function() {
    console.log('Estado:', estadoRecepcion);
    console.log('Tema:', temaSesion);
    console.log('Palabras:', palabras);
};
