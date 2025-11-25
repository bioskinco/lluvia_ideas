// Firebase v9 imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getDatabase, ref, set, onValue, update, remove } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js';

// Firebase configuration
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('presentador-body')) {
        iniciarPresentador();
    } else {
        iniciarAudiencia();
    }
});

// ===== FIREBASE DATABASE =====
async function inicializarSesionFirebase() {
    try {
        sesionId = 'sesion_' + Date.now();
        
        const datosIniciales = {
            tema: temaSesion,
            estado: 'activo',
            sesionId: sesionId,
            palabras: {},
            timestamp: new Date().toISOString()
        };
        
        await set(ref(database, sesionId), datosIniciales);
        console.log('Sesión Firebase inicializada:', sesionId);
        return sesionId;
        
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        throw error;
    }
}

function escucharCambiosFirebase() {
    if (!sesionId) {
        console.error('No hay sesionId para escuchar cambios');
        return;
    }
    
    console.log('Escuchando cambios para sesión:', sesionId);
    
    const sesionRef = ref(database, sesionId);
    
    onValue(sesionRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // Convertir objeto de palabras a array
            const palabrasObj = data.palabras || {};
            const palabrasArray = Object.values(palabrasObj);
            
            palabras = palabrasArray;
            temaSesion = data.tema || temaSesion;
            estadoRecepcion = data.estado || estadoRecepcion;
            
            // Actualizar interfaz del presentador
            actualizarInterfazPresentador();
            
        } else {
            console.log('No hay datos en Firebase para:', sesionId);
        }
    });
}

async function agregarPalabraFirebase(palabraData) {
    try {
        if (!sesionId) {
            throw new Error('No hay sesión activa');
        }
        
        const palabraId = 'palabra_' + Date.now();
        const palabraRef = ref(database, sesionId + '/palabras/' + palabraId);
        
        await set(palabraRef, palabraData);
        console.log('Palabra agregada a Firebase:', palabraData.palabra);
        return true;
        
    } catch (error) {
        console.error('Error agregando palabra:', error);
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
        console.log('Palabras limpiadas de Firebase');
        return true;
        
    } catch (error) {
        console.error('Error limpiando palabras:', error);
        throw error;
    }
}

// ===== SISTEMA DE ARRASTRE (SOLO PARA PRESENTADOR) =====
function inicializarArrastre() {
    // Solo inicializar arrastre si estamos en el presentador
    if (!document.body.classList.contains('presentador-body')) {
        return;
    }
    
    const areaEnunciado = document.getElementById('areaEnunciado');
    const nubePalabras = document.getElementById('nubePalabras');
    
    if (!areaEnunciado || !nubePalabras) {
        console.log('Elementos de arrastre no encontrados en presentador');
        return;
    }
    
    console.log('Inicializando sistema de arrastre para presentador...');
    
    // Configurar elementos arrastrables
    document.querySelectorAll('.palabra').forEach(palabra => {
        palabra.setAttribute('draggable', 'true');
        
        palabra.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            this.classList.add('arrastrando');
            console.log('Comenzando arrastre de:', this.textContent);
        });
        
        palabra.addEventListener('dragend', function() {
            this.classList.remove('arrastrando');
        });
    });
    
    // Configurar zona de destino
    areaEnunciado.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('palabra-zona-objetivo');
    });
    
    areaEnunciado.addEventListener('dragleave', function() {
        this.classList.remove('palabra-zona-objetivo');
    });
    
    areaEnunciado.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('palabra-zona-objetivo');
        
        const texto = e.dataTransfer.getData('text/plain');
        console.log('Soltando palabra:', texto);
        
        if (texto) {
            agregarPalabraAEnunciado(texto);
        }
    });
}

function agregarPalabraAEnunciado(texto) {
    const areaEnunciado = document.getElementById('areaEnunciado');
    
    // Remover mensaje guía si existe
    const guia = areaEnunciado.querySelector('.enunciado-guia');
    if (guia) guia.remove();
    
    // Crear elemento de palabra en el enunciado
    const palabraElement = document.createElement('div');
    palabraElement.className = 'palabra-enunciado';
    palabraElement.textContent = texto;
    
    // Hacer que también sea arrastrable para reordenar
    palabraElement.setAttribute('draggable', 'true');
    
    palabraElement.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', texto);
        this.classList.add('arrastrando');
    });
    
    palabraElement.addEventListener('dragend', function() {
        this.classList.remove('arrastrando');
    });
    
    // Doble click para eliminar
    palabraElement.addEventListener('dblclick', function() {
        this.remove();
        actualizarEstadoAreaEnunciado();
    });
    
    areaEnunciado.appendChild(palabraElement);
    areaEnunciado.classList.add('con-palabras');
}

function actualizarEstadoAreaEnunciado() {
    const areaEnunciado = document.getElementById('areaEnunciado');
    const tienePalabras = areaEnunciado.querySelector('.palabra-enunciado');
    
    if (!tienePalabras) {
        areaEnunciado.classList.remove('con-palabras');
        if (!areaEnunciado.querySelector('.enunciado-guia')) {
            const guia = document.createElement('div');
            guia.className = 'enunciado-guia';
            guia.textContent = 'Arrastra las palabras aquí para formar un enunciado';
            areaEnunciado.appendChild(guia);
        }
    }
}

function limpiarEnunciado() {
    const areaEnunciado = document.getElementById('areaEnunciado');
    if (areaEnunciado) {
        areaEnunciado.querySelectorAll('.palabra-enunciado').forEach(p => p.remove());
        actualizarEstadoAreaEnunciado();
    }
}

function organizarAleatorio() {
    const nube = document.getElementById('nubePalabras');
    if (nube) {
        const palabrasElements = Array.from(nube.querySelectorAll('.palabra'));
        for (let i = palabrasElements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            nube.appendChild(palabrasElements[j]);
        }
    }
}

function organizarGrid() {
    const nube = document.getElementById('nubePalabras');
    if (nube) {
        nube.style.justifyContent = 'flex-start';
    }
}

// ===== PRESENTADOR =====
async function iniciarPresentador() {
    console.log('Iniciando presentador...');
    actualizarInterfazPresentador();
    generarQR();
}

async function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim() || 'Lluvia de Ideas';
    estadoRecepcion = 'activo';
    
    try {
        await inicializarSesionFirebase();
        escucharCambiosFirebase();
        generarQR();
        actualizarInterfazPresentador();
        
        alert('✅ Lluvia de ideas INICIADA\n\nLos participantes pueden escanear el QR');
        
    } catch (error) {
        console.error('Error iniciando lluvia:', error);
        alert('❌ Error iniciando lluvia de ideas');
    }
}

async function limpiarTodo() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras?')) {
        try {
            await limpiarPalabrasFirebase();
            actualizarInterfazPresentador();
            alert('✅ Palabras limpiadas correctamente');
        } catch (error) {
            console.error('Error limpiando:', error);
            alert('❌ Error limpiando palabras');
        }
    }
}

function actualizarInterfazPresentador() {
    // Actualizar contador
    const contador = document.getElementById('contadorPalabras');
    if (contador) {
        contador.textContent = palabras.length;
    }
    
    // Actualizar estado
    const estadoElement = document.getElementById('estadoRecepcion');
    if (estadoElement) {
        estadoElement.textContent = estadoRecepcion.charAt(0).toUpperCase() + estadoRecepcion.slice(1);
        estadoElement.className = `estado-${estadoRecepcion}`;
    }
    
    // Actualizar tema
    if (document.getElementById('temaInput')) {
        document.getElementById('temaInput').value = temaSesion;
    }
    if (document.getElementById('tituloPresentador')) {
        document.getElementById('tituloPresentador').textContent = temaSesion;
    }
    
    // Actualizar sesión ID
    if (document.getElementById('sesionId')) {
        document.getElementById('sesionId').textContent = sesionId || '-';
    }
    
    // Actualizar timestamp
    if (document.getElementById('ultimaActualizacion')) {
        document.getElementById('ultimaActualizacion').textContent = new Date().toLocaleTimeString();
    }
    
    // Actualizar nube de palabras
    actualizarNubePalabras();
}

function actualizarNubePalabras() {
    const nube = document.getElementById('nubePalabras');
    if (!nube) return;
    
    nube.innerHTML = '';
    
    if (palabras.length === 0) {
        let mensaje = 'Esperando que inicies la lluvia de ideas...';
        if (estadoRecepcion === 'activo') {
            mensaje = 'Esperando palabras de la audiencia...';
        }
        nube.innerHTML = `<div class="placeholder">${mensaje}</div>`;
        return;
    }
    
    // Mostrar todas las palabras
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
    
    // Inicializar sistema de arrastre después de agregar las palabras
    setTimeout(() => inicializarArrastre(), 100);
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
        });
    } catch (error) {
        alert('❌ Error al copiar la URL');
    }
}

// ===== AUDIENCIA =====
function iniciarAudiencia() {
    console.log('Iniciando audiencia...');
    procesarParametrosURL();
    verificarEstado();
    
    const input = document.getElementById('palabraInput');
    const boton = document.getElementById('btnEnviar');
    
    if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                enviarPalabra();
            }
        });
    }
    
    if (boton) {
        boton.addEventListener('click', enviarPalabra);
    }
    
    console.log('Audiencia inicializada. Estado:', estadoRecepcion, 'Sesión:', sesionId);
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
        console.log('Parámetros URL procesados. Sesión:', sesionId, 'Estado:', estadoRecepcion);
    }
}

function verificarEstado() {
    const estadoElement = document.getElementById('estado');
    const input = document.getElementById('palabraInput');
    const boton = document.getElementById('btnEnviar');
    const tituloTema = document.getElementById('tituloTema');
    const subtitulo = document.getElementById('subtitulo');
    
    if (!estadoElement || !input || !boton) return;
    
    if (tituloTema) tituloTema.textContent = '🌧️ ' + temaSesion;
    if (subtitulo) subtitulo.textContent = `Tema: ${temaSesion}`;
    
    if (!sesionId) {
        estadoElement.textContent = '❌ Escanea el QR del presentador';
        estadoElement.className = 'estado-desconectado';
        input.disabled = true;
        boton.disabled = true;
        return;
    }
    
    switch(estadoRecepcion) {
        case 'activo':
            estadoElement.textContent = '✅ Recepción ACTIVA - ¡Envía tus ideas!';
            estadoElement.className = 'estado-activo';
            input.disabled = false;
            boton.disabled = false;
            break;
        default:
            estadoElement.textContent = '❌ Recepción INACTIVA';
            estadoElement.className = 'estado-desconectado';
            input.disabled = true;
            boton.disabled = true;
    }
}

async function enviarPalabra() {
    try {
        const input = document.getElementById('palabraInput');
        const palabra = input.value.trim();
        
        console.log('Intentando enviar palabra:', palabra);
        
        if (!palabra) {
            mostrarMensaje('⚠️ Escribe una idea', 'error');
            return;
        }
        
        if (palabra.length > 20) {
            mostrarMensaje('❌ Máximo 20 caracteres', 'error');
            return;
        }
        
        if (!sesionId) {
            mostrarMensaje('❌ Escanea el QR primero', 'error');
            return;
        }
        
        if (estadoRecepcion !== 'activo') {
            mostrarMensaje('❌ La recepción de ideas está inactiva', 'error');
            return;
        }
        
        const nuevaPalabra = {
            palabra: palabra,
            timestamp: new Date().toISOString(),
            id: 'palabra_' + Date.now(),
            sesionId: sesionId
        };
        
        console.log('Enviando palabra a Firebase:', nuevaPalabra);
        
        await agregarPalabraFirebase(nuevaPalabra);
        mostrarMensaje('✅ Idea enviada correctamente', 'success');
        
        input.value = '';
        input.focus();
        
    } catch (error) {
        console.error('Error enviando palabra:', error);
        mostrarMensaje('❌ Error al enviar la idea: ' + error.message, 'error');
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

// Hacer funciones globales
window.iniciarLluvia = iniciarLluvia;
window.limpiarTodo = limpiarTodo;
window.organizarAleatorio = organizarAleatorio;
window.organizarGrid = organizarGrid;
window.limpiarEnunciado = limpiarEnunciado;
window.enviarPalabra = enviarPalabra;
window.ampliarQR = ampliarQR;
window.cerrarQR = cerrarQR;
window.copiarURL = copiarURL;

window.onclick = function(event) {
    const modal = document.getElementById('modalQR');
    if (event.target === modal) {
        cerrarQR();
    }
};
