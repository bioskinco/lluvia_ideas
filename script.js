// Configuración
const STORAGE_KEY = 'lluviaIdeasPalabras';
const CONFIG_KEY = 'lluviaIdeasConfig';

// Estado global
let estadoRecepcion = 'inactivo'; // 'inactivo', 'activo', 'pausado'
let temaSesion = '';

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
    console.log('Iniciando presentador...');
    cargarConfiguracion();
    generarQR();
    actualizarUI();
    
    // Actualizar cada segundo
    setInterval(function() {
        actualizarNube();
        actualizarUI();
    }, 1000);
}

function cargarConfiguracion() {
    try {
        const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
        estadoRecepcion = config.estadoRecepcion || 'inactivo';
        temaSesion = config.temaSesion || '';
        
        console.log('Configuración cargada:', config);
        
        if (temaSesion) {
            document.getElementById('temaInput').value = temaSesion;
            document.getElementById('tituloPresentador').textContent = temaSesion;
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
        estadoRecepcion = 'inactivo';
        temaSesion = '';
    }
}

function guardarConfiguracion() {
    const config = {
        estadoRecepcion: estadoRecepcion,
        temaSesion: temaSesion,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    console.log('Configuración guardada:', config);
}

function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim();
    
    if (!temaSesion) {
        alert('Por favor ingresa un tema para la sesión');
        temaInput.focus();
        return;
    }
    
    estadoRecepcion = 'activo';
    guardarConfiguracion();
    
    // Actualizar UI
    document.getElementById('tituloPresentador').textContent = temaSesion;
    actualizarUI();
    
    console.log('Lluvia de ideas INICIADA:', temaSesion);
    alert('✅ Lluvia de ideas INICIADA\n\nLa audiencia ya puede enviar sus ideas.');
}

function pausarLluvia() {
    estadoRecepcion = 'pausado';
    guardarConfiguracion();
    actualizarUI();
    console.log('Lluvia de ideas PAUSADA');
}

function pararLluvia() {
    estadoRecepcion = 'inactivo';
    guardarConfiguracion();
    actualizarUI();
    console.log('Lluvia de ideas DETENIDA');
}

function limpiarTodo() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras?')) {
        localStorage.removeItem(STORAGE_KEY);
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
    
    // Actualizar tema en localStorage para la audiencia
    localStorage.setItem('lluviaIdeasTema', temaSesion);
    localStorage.setItem('lluviaIdeasEstado', estadoRecepcion);
}

// ===== QR =====
function generarQR() {
    try {
        // Obtener la URL correcta para el QR
        let urlBase = window.location.origin + window.location.pathname;
        urlBase = urlBase.replace('presentador.html', 'index.html');
        
        // Si estamos en local, usar la ruta relativa
        if (urlBase.includes('file://')) {
            urlBase = './index.html';
        }
        
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
        let urlBase = window.location.origin + window.location.pathname;
        urlBase = urlBase.replace('presentador.html', 'index.html');
        
        if (urlBase.includes('file://')) {
            urlBase = './index.html';
        }
        
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
        document.execCommand('copy');
        alert('✅ URL copiada al portapapeles');
    } catch (error) {
        console.error('Error copiando URL:', error);
        // Fallback para navegadores modernos
        navigator.clipboard.writeText(urlInput.value).then(function() {
            alert('✅ URL copiada al portapapeles');
        }).catch(function() {
            alert('❌ Error al copiar la URL');
        });
    }
}

// ===== NUBE DE PALABRAS =====
function actualizarNube() {
    try {
        const palabras = obtenerPalabras();
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
    console.log('Iniciando página de audiencia...');
    
    // Cargar tema y estado
    verificarEstadoRecepcion();
    
    // Verificar estado cada 2 segundos
    setInterval(verificarEstadoRecepcion, 2000);
    
    // Configurar input
    const input = document.getElementById('palabraInput');
    if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') enviarPalabra();
        });
    }
}

function verificarEstadoRecepcion() {
    try {
        const tema = localStorage.getItem('lluviaIdeasTema') || 'Lluvia de Ideas';
        const estado = localStorage.getItem('lluviaIdeasEstado') || 'inactivo';
        
        document.getElementById('tituloTema').textContent = tema;
        document.getElementById('subtitulo').textContent = `Tema: ${tema}`;
        
        const estadoElement = document.getElementById('estado');
        const input = document.getElementById('palabraInput');
        const boton = document.getElementById('btnEnviar');
        
        if (!estadoElement || !input || !boton) return;
        
        switch(estado) {
            case 'activo':
                estadoElement.textContent = '✅ Recepción ACTIVA - ¡Envía tus ideas!';
                estadoElement.className = 'estado-activo';
                input.disabled = false;
                boton.disabled = false;
                input.placeholder = 'Escribe tu idea aquí...';
                break;
                
            case 'pausado':
                estadoElement.textContent = '⏸️ Recepción PAUSADA';
                estadoElement.className = 'estado-pausado';
                input.disabled = true;
                boton.disabled = true;
                input.placeholder = 'Recepción pausada...';
                break;
                
            default:
                estadoElement.textContent = '❌ Recepción INACTIVA';
                estadoElement.className = 'estado-desconectado';
                input.disabled = true;
                boton.disabled = true;
                input.placeholder = 'Esperando que inicie la sesión...';
        }
    } catch (error) {
        console.error('Error verificando estado:', error);
    }
}

function enviarPalabra() {
    try {
        const estado = localStorage.getItem('lluviaIdeasEstado') || 'inactivo';
        if (estado !== 'activo') {
            mostrarMensaje('❌ La recepción de ideas no está activa en este momento', 'error');
            return;
        }
        
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
        
        // Guardar palabra
        const palabras = obtenerPalabras();
        palabras.push({
            palabra: palabra,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(palabras));
        
        // Mostrar confirmación
        mostrarMensaje(`✅ ¡Ideas enviada: "<strong>${palabra}</strong>"!`, 'success');
        
        // Limpiar input
        input.value = '';
        input.focus();
        
        console.log('Palabra enviada:', palabra);
        
    } catch (error) {
        console.error('Error enviando palabra:', error);
        mostrarMensaje('❌ Error al enviar la palabra', 'error');
    }
}

// ===== FUNCIONES UTILITARIAS =====
function obtenerPalabras() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Error obteniendo palabras:', error);
        return [];
    }
}

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
    }, 3000);
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
    console.log('Palabras:', obtenerPalabras());
    console.log('Config:', JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'));
};