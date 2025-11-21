// Configuración
const STORAGE_KEY = 'lluviaIdeasPalabras';
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
    console.log('Iniciando presentador...');
    cargarDatosPresentador();
    generarQR();
    actualizarUI();
    
    // Actualizar cada segundo
    setInterval(function() {
        actualizarNube();
        sincronizarEstado();
    }, 1000);
}

function cargarDatosPresentador() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        estadoRecepcion = saved.estadoRecepcion || 'inactivo';
        temaSesion = saved.temaSesion || 'Lluvia de Ideas';
        palabras = saved.palabras || [];
        
        console.log('Datos cargados:', { estadoRecepcion, temaSesion, palabras: palabras.length });
        
        document.getElementById('temaInput').value = temaSesion;
        document.getElementById('tituloPresentador').textContent = temaSesion;
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        resetearDatos();
    }
}

function guardarDatosPresentador() {
    const datos = {
        estadoRecepcion: estadoRecepcion,
        temaSesion: temaSesion,
        palabras: palabras,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    console.log('Datos guardados:', datos);
}

function sincronizarEstado() {
    // Guardar estado actual en localStorage
    guardarDatosPresentador();
}

function resetearDatos() {
    estadoRecepcion = 'inactivo';
    temaSesion = 'Lluvia de Ideas';
    palabras = [];
    guardarDatosPresentador();
}

function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim() || 'Lluvia de Ideas';
    
    estadoRecepcion = 'activo';
    guardarDatosPresentador();
    
    document.getElementById('tituloPresentador').textContent = temaSesion;
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
    const estadoElement = document.getElementById('estadoRecepcion');
    if (estadoElement) {
        estadoElement.textContent = estadoRecepcion.charAt(0).toUpperCase() + estadoRecepcion.slice(1);
        estadoElement.className = `estado-${estadoRecepcion}`;
    }
    
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
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        console.log('Generando QR para:', urlBase);
        
        const qrPequeno = qrcode(0, 'L');
        qrPequeno.addData(urlBase);
        qrPequeno.make();
        document.getElementById('qrCode').innerHTML = qrPequeno.createImgTag(3);
        
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
        
        const qrAmpliado = document.getElementById('qrAmpliado');
        qrAmpliado.innerHTML = '';
        
        const qr = qrcode(0, 'H');
        qr.addData(urlBase);
        qr.make();
        
        const qrImage = qr.createImgTag(8);
        qrAmpliado.innerHTML = qrImage;
        
        const qrImg = qrAmpliado.querySelector('img');
        if (qrImg) {
            qrImg.style.width = '100%';
            qrImg.style.height = 'auto';
            qrImg.style.maxWidth = '350px';
            qrImg.style.display = 'block';
            qrImg.style.margin = '0 auto';
        }
        
        document.getElementById('modalQR').style.display = 'block';
        
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
            document.execCommand('copy');
            alert('✅ URL copiada al portapapeles');
        });
    } catch (error) {
        alert('❌ Error al copiar la URL');
    }
}

// ===== NUBE DE PALABRAS =====
function actualizarNube() {
    try {
        const nube = document.getElementById('nubePalabras');
        const contador = document.getElementById('contadorPalabras');
        
        if (!nube) return;
        
        if (contador) {
            contador.textContent = palabras.length;
        }
        
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
        
        palabras.forEach((item, index) => {
            const elemento = document.createElement('div');
            elemento.className = 'palabra';
            elemento.textContent = item.palabra;
            elemento.title = `Enviado: ${new Date(item.timestamp).toLocaleTimeString()}`;
            
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
    
    const input = document.getElementById('palabraInput');
    if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') enviarPalabra();
        });
    }
    
    setInterval(verificarEstado, 1000);
    verificarEstado();
}

function verificarEstado() {
    try {
        // Intentar leer el estado del presentador
        const datosPresentador = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const estado = datosPresentador.estadoRecepcion || 'inactivo';
        const tema = datosPresentador.temaSesion || 'Lluvia de Ideas';
        
        const estadoElement = document.getElementById('estado');
        const input = document.getElementById('palabraInput');
        const boton = document.getElementById('btnEnviar');
        const tituloTema = document.getElementById('tituloTema');
        const subtitulo = document.getElementById('subtitulo');
        
        if (!estadoElement || !input || !boton) return;
        
        tituloTema.textContent = '🌧️ ' + tema;
        subtitulo.textContent = `Tema: ${tema}`;
        
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
        
        // Leer datos actuales del presentador
        const datosPresentador = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const palabrasActuales = datosPresentador.palabras || [];
        
        // Agregar nueva palabra
        palabrasActuales.push({
            palabra: palabra,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
        });
        
        // Guardar de vuelta en localStorage
        datosPresentador.palabras = palabrasActuales;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datosPresentador));
        
        mostrarMensaje(`✅ ¡Ideas enviada: "<strong>${palabra}</strong>"!`, 'success');
        
        input.value = '';
        input.focus();
        
        console.log('Palabra enviada:', palabra);
        
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
    }, 3000);
}

window.onclick = function(event) {
    const modal = document.getElementById('modalQR');
    if (event.target === modal) {
        cerrarQR();
    }
}
