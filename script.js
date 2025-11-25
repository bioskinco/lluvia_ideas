// Firebase v9 imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getDatabase, ref, set, onValue, update, remove, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js';

// Firebase configuration - TU CONFIGURACIÓN
const firebaseConfig = {
    apiKey: "AIzaSyCfdrKJNp96VdFRvR6vULSXc1MuE05Skgo",
    authDomain: "palabras-bdf09.firebaseapp.com",
    databaseURL: "https://palabras-bdf09-default-rtdb.firebaseio.com",
    projectId: "palabras-bdf09",
    storageBucket: "palabras-bdf09.firebasestorage.app",
    messagingSenderId: "627369975568",
    appId: "1:627369975568:web:2cdf9940ef4a6d67180f95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Variables globales
let estadoRecepcion = 'inactivo';
let temaSesion = 'Lluvia de Ideas';
let palabras = [];
let sesionId = null;
let modoArrastre = true;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('presentador-body')) {
        iniciarPresentador();
    } else {
        iniciarAudiencia();
    }
});

// ===== ALMACENAMIENTO LOCAL PARA LA SESIÓN =====
function guardarSesionLocal() {
    const sesionData = {
        sesionId: sesionId,
        temaSesion: temaSesion,
        estadoRecepcion: estadoRecepcion,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('lluviaIdeas_sesion_presentador', JSON.stringify(sesionData));
}

function cargarSesionLocal() {
    try {
        const sesionData = JSON.parse(localStorage.getItem('lluviaIdeas_sesion_presentador') || '{}');
        if (sesionData.sesionId) {
            sesionId = sesionData.sesionId;
            temaSesion = sesionData.temaSesion || temaSesion;
            estadoRecepcion = sesionData.estadoRecepcion || estadoRecepcion;
            console.log('Sesión cargada desde localStorage:', sesionData);
            return true;
        }
    } catch (error) {
        console.error('Error cargando sesión local:', error);
    }
    return false;
}

// ===== FIREBASE DATABASE =====
async function inicializarSesionFirebase() {
    try {
        // Si no hay sesionId, crear uno nuevo
        if (!sesionId) {
            sesionId = 'sesion_' + Date.now();
        }
        
        const datosIniciales = {
            tema: temaSesion,
            estado: estadoRecepcion,
            sesionId: sesionId,
            palabras: {},
            timestamp: new Date().toISOString()
        };
        
        await set(ref(database, sesionId), datosIniciales);
        console.log('Sesión Firebase inicializada:', sesionId);
        
        // Guardar en localStorage
        guardarSesionLocal();
        
        return sesionId;
        
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        throw error;
    }
}

function escucharCambiosFirebase() {
    if (!sesionId) {
        console.log('No hay sesionId para escuchar cambios');
        return;
    }
    
    const sesionRef = ref(database, sesionId);
    
    onValue(sesionRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log('Datos recibidos de Firebase:', data);
            
            // Convertir objeto de palabras a array
            const palabrasArray = data.palabras ? Object.values(data.palabras) : [];
            
            palabras = palabrasArray;
            temaSesion = data.tema || temaSesion;
            estadoRecepcion = data.estado || estadoRecepcion;
            
            // Actualizar UI del presentador
            if (document.body.classList.contains('presentador-body')) {
                actualizarUI();
                actualizarNube();
                
                if (document.getElementById('temaInput')) {
                    document.getElementById('temaInput').value = temaSesion;
                }
                if (document.getElementById('tituloPresentador')) {
                    document.getElementById('tituloPresentador').textContent = temaSesion;
                }
                if (document.getElementById('sesionId')) {
                    document.getElementById('sesionId').textContent = sesionId;
                }
                if (document.getElementById('ultimaActualizacion')) {
                    document.getElementById('ultimaActualizacion').textContent = new Date().toLocaleTimeString();
                }
                if (document.getElementById('estadoConexion')) {
                    document.getElementById('estadoConexion').textContent = 'Conectado ✓';
                }
            }
            
            console.log('Datos actualizados desde Firebase:', { 
                palabras: palabras.length, 
                temaSesion, 
                estadoRecepcion,
                sesionId 
            });
        } else {
            console.log('No se encontraron datos en Firebase para la sesión:', sesionId);
        }
    }, (error) => {
        console.error('Error escuchando cambios de Firebase:', error);
    });
    
    // Escuchar estado de conexión
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
        const estadoConexion = document.getElementById('estadoConexion');
        if (estadoConexion) {
            estadoConexion.textContent = snapshot.val() ? 'Conectado ✓' : 'Desconectado ✗';
            estadoConexion.style.color = snapshot.val() ? '#2ecc71' : '#e74c3c';
        }
    });
}

async function agregarPalabraFirebase(palabraData) {
    try {
        if (!sesionId) {
            throw new Error('No hay sesión activa');
        }
        
        const palabraId = 'palabra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const palabraRef = ref(database, sesionId + '/palabras/' + palabraId);
        
        await set(palabraRef, palabraData);
        console.log('Palabra agregada a Firebase:', palabraData.palabra);
        return true;
        
    } catch (error) {
        console.error('Error agregando palabra a Firebase:', error);
        throw error;
    }
}

async function actualizarEstadoFirebase() {
    if (!sesionId) return;
    
    try {
        const sesionRef = ref(database, sesionId);
        await update(sesionRef, {
            estado: estadoRecepcion,
            tema: temaSesion,
            timestamp: new Date().toISOString()
        });
        
        // Guardar en localStorage también
        guardarSesionLocal();
        
    } catch (error) {
        console.error('Error actualizando estado:', error);
    }
}

async function limpiarPalabrasFirebase() {
    try {
        if (!sesionId) {
            throw new Error('No hay sesión activa');
        }
        
        const palabrasRef = ref(database, sesionId + '/palabras');
        await remove(palabrasRef);
        console.log('Palabras limpiadas en Firebase');
        return true;
        
    } catch (error) {
        console.error('Error limpiando palabras en Firebase:', error);
        throw error;
    }
}

// ===== SISTEMA DE ARRASTRE =====
function inicializarArrastre() {
    if (!modoArrastre) return;
    
    const areaEnunciado = document.getElementById('areaEnunciado');
    const nubePalabras = document.getElementById('nubePalabras');
    
    document.querySelectorAll('.palabra').forEach(palabra => {
        palabra.setAttribute('draggable', 'true');
        
        palabra.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', palabra.textContent);
            palabra.classList.add('arrastrando');
            setTimeout(() => palabra.style.display = 'none', 0);
        });
        
        palabra.addEventListener('dragend', function() {
            palabra.classList.remove('arrastrando');
            palabra.style.display = 'block';
        });
    });
    
    areaEnunciado.addEventListener('dragover', function(e) {
        e.preventDefault();
        areaEnunciado.classList.add('palabra-zona-objetivo');
    });
    
    areaEnunciado.addEventListener('dragleave', function() {
        areaEnunciado.classList.remove('palabra-zona-objetivo');
    });
    
    areaEnunciado.addEventListener('drop', function(e) {
        e.preventDefault();
        areaEnunciado.classList.remove('palabra-zona-objetivo');
        
        const texto = e.dataTransfer.getData('text/plain');
        agregarPalabraAEnunciado(texto);
        
        document.querySelectorAll('.arrastrando').forEach(p => {
            p.classList.remove('arrastrando');
            p.style.display = 'block';
        });
    });
}

function agregarPalabraAEnunciado(texto) {
    const areaEnunciado = document.getElementById('areaEnunciado');
    
    const guia = areaEnunciado.querySelector('.enunciado-guia');
    if (guia) guia.remove();
    
    const palabraElement = document.createElement('div');
    palabraElement.className = 'palabra en-enunciado';
    palabraElement.textContent = texto;
    palabraElement.setAttribute('draggable', 'true');
    
    palabraElement.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', texto);
        palabraElement.classList.add('arrastrando');
    });
    
    palabraElement.addEventListener('dragend', function() {
        palabraElement.classList.remove('arrastrando');
    });
    
    palabraElement.addEventListener('dblclick', function() {
        palabraElement.remove();
        actualizarEstadoAreaEnunciado();
    });
    
    areaEnunciado.appendChild(palabraElement);
    areaEnunciado.classList.add('con-palabras');
}

function actualizarEstadoAreaEnunciado() {
    const areaEnunciado = document.getElementById('areaEnunciado');
    const tienePalabras = areaEnunciado.querySelector('.palabra');
    
    if (!tienePalabras) {
        areaEnunciado.classList.remove('con-palabras');
        if (!areaEnunciado.querySelector('.enunciado-guia')) {
            const guia = document.createElement('div');
            guia.className = 'enunciado-guia';
            guia.textContent = '💡 Arrastra las palabras para formar un enunciado';
            areaEnunciado.appendChild(guia);
        }
    }
}

function limpiarEnunciado() {
    const areaEnunciado = document.getElementById('areaEnunciado');
    areaEnunciado.querySelectorAll('.palabra').forEach(p => p.remove());
    actualizarEstadoAreaEnunciado();
}

function exportarEnunciado() {
    const areaEnunciado = document.getElementById('areaEnunciado');
    const palabrasEnunciado = Array.from(areaEnunciado.querySelectorAll('.palabra'))
        .map(p => p.textContent)
        .join(' ');
    
    if (palabrasEnunciado.trim()) {
        const blob = new Blob([palabrasEnunciado], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enunciado-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ Enunciado exportado correctamente');
    } else {
        alert('ℹ️ No hay palabras en el área de enunciado');
    }
}

function organizarAleatorio() {
    const nube = document.getElementById('nubePalabras');
    const palabrasElements = Array.from(nube.querySelectorAll('.palabra'));
    
    for (let i = palabrasElements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        nube.appendChild(palabrasElements[j]);
    }
}

function organizarGrid() {
    const nube = document.getElementById('nubePalabras');
    nube.style.justifyContent = 'flex-start';
}

// ===== PRESENTADOR =====
async function iniciarPresentador() {
    console.log('Iniciando presentador...');
    
    // Primero intentar cargar sesión existente
    const sesionCargada = cargarSesionLocal();
    
    if (sesionCargada) {
        console.log('Sesión existente cargada:', { sesionId, temaSesion, estadoRecepcion });
        // Escuchar cambios de la sesión existente
        escucharCambiosFirebase();
        generarQR();
    }
    
    actualizarUI();
    
    // Si no hay sesión cargada, mostrar estado inicial
    if (!sesionCargada) {
        console.log('No hay sesión existente, mostrando estado inicial');
    }
}

async function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim() || 'Lluvia de Ideas';
    
    estadoRecepcion = 'activo';
    
    try {
        await inicializarSesionFirebase();
        await actualizarEstadoFirebase();
        generarQR();
        
        document.getElementById('tituloPresentador').textContent = temaSesion;
        document.getElementById('sesionId').textContent = sesionId;
        actualizarUI();
        
        console.log('Lluvia de ideas INICIADA:', temaSesion, sesionId);
        alert('✅ Lluvia de ideas INICIADA\n\nBase de datos Firebase activa');
        
    } catch (error) {
        console.error('Error iniciando lluvia de ideas:', error);
        alert('❌ Error iniciando lluvia de ideas');
    }
}

function pararLluvia() {
    estadoRecepcion = 'inactivo';
    actualizarEstadoFirebase();
    actualizarUI();
    console.log('Lluvia de ideas DETENIDA');
}

async function limpiarTodo() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras de la base de datos?')) {
        try {
            await limpiarPalabrasFirebase();
            actualizarNube();
            limpiarEnunciado();
            console.log('Base de datos limpiada');
            alert('✅ Base de datos limpiada correctamente');
        } catch (error) {
            console.error('Error limpiando base de datos:', error);
            alert('❌ Error limpiando base de datos');
        }
    }
}

function actualizarUI() {
    const estadoElement = document.getElementById('estadoRecepcion');
    if (estadoElement) {
        estadoElement.textContent = estadoRecepcion.charAt(0).toUpperCase() + estadoRecepcion.slice(1);
        estadoElement.className = `estado-${estadoRecepcion}`;
    }
    
    const btnIniciar = document.getElementById('btnIniciar');
    const btnParar = document.getElementById('btnParar');
    
    if (btnIniciar && btnParar) {
        switch(estadoRecepcion) {
            case 'inactivo':
                btnIniciar.disabled = false;
                btnParar.disabled = true;
                break;
            case 'activo':
                btnIniciar.disabled = true;
                btnParar.disabled = false;
                break;
        }
    }
    
    const contador = document.getElementById('contadorPalabras');
    if (contador) {
        contador.textContent = palabras.length;
    }
}

// ===== QR =====
function generarQR() {
    try {
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        const params = new URLSearchParams({
            sesion: sesionId || '',
            tema: encodeURIComponent(temaSesion),
            estado: estadoRecepcion
        });
        
        const urlConParametros = `${urlBase}?${params.toString()}`;
        
        console.log('Generando QR con parámetros:', urlConParametros);
        
        const qrPequeno = qrcode(0, 'L');
        qrPequeno.addData(urlConParametros);
        qrPequeno.make();
        document.getElementById('qrCode').innerHTML = qrPequeno.createImgTag(3);
        
        document.getElementById('urlInput').value = urlConParametros;
        if (document.getElementById('sesionId')) {
            document.getElementById('sesionId').textContent = sesionId || '-';
        }
        
    } catch (error) {
        console.error('Error generando QR:', error);
        document.getElementById('qrCode').innerHTML = '<p>Error generando QR</p>';
    }
}

function ampliarQR() {
    try {
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        const params = new URLSearchParams({
            sesion: sesionId || '',
            tema: encodeURIComponent(temaSesion),
            estado: estadoRecepcion
        });
        
        const urlConParametros = `${urlBase}?${params.toString()}`;
        
        const qrAmpliado = document.getElementById('qrAmpliado');
        qrAmpliado.innerHTML = '';
        
        const qr = qrcode(0, 'H');
        qr.addData(urlConParametros);
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
            elemento.setAttribute('data-id', item.id);
            
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
        
        setTimeout(() => inicializarArrastre(), 100);
        
    } catch (error) {
        console.error('Error actualizando nube:', error);
    }
}

// ===== AUDIENCIA =====
function iniciarAudiencia() {
    console.log('Iniciando página de audiencia...');
    
    procesarParametrosURL();
    
    const input = document.getElementById('palabraInput');
    if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') enviarPalabra();
        });
    }
    
    verificarEstado();
}

function procesarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const sesionParam = urlParams.get('sesion');
    const temaParam = urlParams.get('tema');
    const estadoParam = urlParams.get('estado');
    
    if (sesionParam) {
        sesionId = sesionParam;
        temaSesion = temaParam ? decodeURIComponent(temaParam) : 'Lluvia de Ideas';
        estadoRecepcion = estadoParam || 'inactivo';
        
        console.log('Sesión cargada desde URL:', { sesionId, temaSesion, estadoRecepcion });
    }
}

async function verificarEstado() {
    try {
        const estadoElement = document.getElementById('estado');
        const input = document.getElementById('palabraInput');
        const boton = document.getElementById('btnEnviar');
        const tituloTema = document.getElementById('tituloTema');
        const subtitulo = document.getElementById('subtitulo');
        
        if (!estadoElement || !input || !boton) return;
        
        tituloTema.textContent = '🌧️ ' + temaSesion;
        subtitulo.textContent = `Tema: ${temaSesion}`;
        
        if (!sesionId) {
            estadoElement.textContent = '❌ Escanea el QR del presentador';
            estadoElement.className = 'estado-desconectado';
            input.disabled = true;
            boton.disabled = true;
            input.placeholder = 'Escanea el QR para participar...';
            return;
        }
        
        switch(estadoRecepcion) {
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

async function enviarPalabra() {
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
        
        if (!sesionId) {
            mostrarMensaje('❌ No hay sesión activa. Escanea el QR del presentador.', 'error');
            return;
        }
        
        const nuevaPalabra = {
            palabra: palabra,
            timestamp: new Date().toISOString(),
            id: 'palabra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            sesionId: sesionId,
            userAgent: navigator.userAgent.substring(0, 50)
        };
        
        console.log('Enviando palabra:', nuevaPalabra);
        
        // Enviar palabra directamente a Firebase
        await agregarPalabraFirebase(nuevaPalabra);
        mostrarMensaje(`✅ ¡Ideas enviada: "<strong>${palabra}</strong>"!`, 'success');
        
        input.value = '';
        input.focus();
        
    } catch (error) {
        console.error('Error enviando palabra:', error);
        mostrarMensaje('❌ Error al enviar la palabra. Intenta nuevamente.', 'error');
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

// Hacer funciones globales para los botones HTML
window.iniciarLluvia = iniciarLluvia;
window.pararLluvia = pararLluvia;
window.limpiarTodo = limpiarTodo;
window.organizarAleatorio = organizarAleatorio;
window.organizarGrid = organizarGrid;
window.limpiarEnunciado = limpiarEnunciado;
window.exportarEnunciado = exportarEnunciado;
window.enviarPalabra = enviarPalabra;
window.ampliarQR = ampliarQR;
window.cerrarQR = cerrarQR;
window.copiarURL = copiarURL;
