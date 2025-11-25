// Configuración
const CONFIG_KEY = 'lluviaIdeas_config';
const GIST_ID_FIJO = "677fcb435ce8aa6315385b3fdc75df54";
let estadoRecepcion = 'inactivo';
let temaSesion = 'Lluvia de Ideas';
let palabras = [];
let sesionId = null;
let gistId = GIST_ID_FIJO;
let githubToken = null;
let modoArrastre = true;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('presentador-body')) {
        iniciarPresentador();
    } else {
        iniciarAudiencia();
    }
});

// ===== CONFIGURACIÓN Y ALMACENAMIENTO =====
function cargarConfiguracion() {
    try {
        const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
        githubToken = config.githubToken || null;
        temaSesion = config.temaSesion || 'Lluvia de Ideas';
        sesionId = config.sesionId || generarIdSesion();
        
        // Siempre usar el Gist ID fijo
        gistId = GIST_ID_FIJO;
        
        if (document.getElementById('gistId')) {
            document.getElementById('gistId').value = gistId;
        }
        if (document.getElementById('githubToken')) {
            document.getElementById('githubToken').value = githubToken || '';
        }
        if (document.getElementById('temaInput')) {
            document.getElementById('temaInput').value = temaSesion;
        }
        if (document.getElementById('gistActual')) {
            document.getElementById('gistActual').textContent = gistId;
        }
        
        console.log('Configuración cargada:', { gistId, temaSesion, sesionId });
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

function guardarConfiguracion() {
    const config = {
        gistId: gistId,
        githubToken: githubToken,
        temaSesion: temaSesion,
        sesionId: sesionId,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    console.log('Configuración guardada');
}

function guardarConfig() {
    const tokenInput = document.getElementById('githubToken');
    
    if (tokenInput) githubToken = tokenInput.value.trim();
    
    guardarConfiguracion();
    alert('✅ Configuración guardada');
    
    if (gistId) {
        cargarDatosDesdeGist();
    }
}

function generarIdSesion() {
    return 'sesion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== GITHUB GISTS API =====
async function inicializarGistExistente() {
    try {
        const datosIniciales = {
            tema: temaSesion,
            estado: estadoRecepcion,
            sesionId: sesionId,
            palabras: [],
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(githubToken && { 'Authorization': `token ${githubToken}` })
            },
            body: JSON.stringify({
                description: `Lluvia de Ideas - ${temaSesion}`,
                files: {
                    'palabras.json': {
                        content: JSON.stringify(datosIniciales, null, 2)
                    }
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        guardarConfiguracion();
        document.getElementById('gistActual').textContent = gistId;
        
        console.log('Gist inicializado:', gistId);
        return true;
        
    } catch (error) {
        console.error('Error inicializando Gist:', error);
        alert('❌ Error inicializando base de datos. Verifica tu token de GitHub.');
        return false;
    }
}

async function cargarDatosDesdeGist() {
    if (!gistId) {
        console.log('No hay Gist ID configurado');
        return;
    }
    
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('El Gist no existe:', gistId);
                return;
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos crudos del Gist:', data);
        
        // Buscar el archivo correcto
        let contenido;
        if (data.files['palabras.json']) {
            contenido = JSON.parse(data.files['palabras.json'].content);
        } else if (data.files['gistfile1.txt']) {
            contenido = JSON.parse(data.files['gistfile1.txt'].content);
        } else {
            const primerArchivo = Object.keys(data.files)[0];
            if (primerArchivo) {
                contenido = JSON.parse(data.files[primerArchivo].content);
            } else {
                console.log('No se encontró ningún archivo en el Gist');
                return;
            }
        }
        
        console.log('Contenido del Gist:', contenido);
        
        // Actualizar variables globales
        palabras = contenido.palabras || [];
        temaSesion = contenido.tema || temaSesion;
        estadoRecepcion = contenido.estado || estadoRecepcion;
        sesionId = contenido.sesionId || sesionId;
        
        // Actualizar UI
        if (document.getElementById('temaInput')) {
            document.getElementById('temaInput').value = temaSesion;
        }
        if (document.getElementById('tituloPresentador')) {
            document.getElementById('tituloPresentador').textContent = temaSesion;
        }
        if (document.getElementById('sesionId')) {
            document.getElementById('sesionId').textContent = sesionId;
        }
        if (document.getElementById('gistActual')) {
            document.getElementById('gistActual').textContent = gistId;
        }
        if (document.getElementById('ultimaActualizacion')) {
            document.getElementById('ultimaActualizacion').textContent = new Date().toLocaleTimeString();
        }
        
        actualizarUI();
        actualizarNube();
        
        console.log('Datos cargados desde Gist:', { palabras: palabras.length, temaSesion, estadoRecepcion });
        
    } catch (error) {
        console.error('Error cargando desde Gist:', error);
    }
}

async function guardarDatosEnGist() {
    if (!gistId) {
        console.log('No hay Gist ID para guardar');
        return false;
    }
    
    try {
        const datos = {
            tema: temaSesion,
            estado: estadoRecepcion,
            sesionId: sesionId,
            palabras: palabras,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(githubToken && { 'Authorization': `token ${githubToken}` })
            },
            body: JSON.stringify({
                description: `Lluvia de Ideas - ${temaSesion}`,
                files: {
                    'palabras.json': {
                        content: JSON.stringify(datos, null, 2)
                    }
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        if (document.getElementById('ultimaActualizacion')) {
            document.getElementById('ultimaActualizacion').textContent = new Date().toLocaleTimeString();
        }
        console.log('Datos guardados en Gist');
        return true;
        
    } catch (error) {
        console.error('Error guardando en Gist:', error);
        return false;
    }
}

async function limpiarGist() {
    if (!gistId) return;
    
    try {
        palabras = [];
        const datos = {
            tema: temaSesion,
            estado: estadoRecepcion,
            sesionId: sesionId,
            palabras: [],
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(githubToken && { 'Authorization': `token ${githubToken}` })
            },
            body: JSON.stringify({
                files: {
                    'palabras.json': {
                        content: JSON.stringify(datos, null, 2)
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        actualizarNube();
        console.log('Gist limpiado');
        
    } catch (error) {
        console.error('Error limpiando Gist:', error);
    }
}

function cargarGistExistente() {
    const gistInput = document.getElementById('gistId');
    if (gistInput && gistInput.value.trim()) {
        gistId = gistInput.value.trim();
        guardarConfiguracion();
        cargarDatosDesdeGist();
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
    cargarConfiguracion();
    actualizarUI();
    
    // Cargar datos existentes del Gist fijo
    if (gistId) {
        await cargarDatosDesdeGist();
    }
    
    generarQR();
    
    // Actualizar cada 3 segundos
    setInterval(async function() {
        await cargarDatosDesdeGist();
    }, 3000);
}

async function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim() || 'Lluvia de Ideas';
    
    estadoRecepcion = 'activo';
    sesionId = generarIdSesion();
    
    // Verificar si tenemos token de GitHub
    if (!githubToken) {
        alert('⚠️ Por favor, ingresa tu token de GitHub en la configuración primero y haz clic en "Guardar".');
        return;
    }
    
    // Inicializar el Gist existente (no crear uno nuevo)
    const exito = await inicializarGistExistente();
    if (exito) {
        guardarConfiguracion();
        generarQR();
        
        document.getElementById('tituloPresentador').textContent = temaSesion;
        document.getElementById('sesionId').textContent = sesionId;
        actualizarUI();
        
        console.log('Lluvia de ideas INICIADA:', temaSesion, sesionId, gistId);
        alert('✅ Lluvia de ideas INICIADA\n\nUsando Gist: ' + gistId);
    }
}

function pararLluvia() {
    estadoRecepcion = 'inactivo';
    guardarConfiguracion();
    guardarDatosEnGist();
    actualizarUI();
    console.log('Lluvia de ideas DETENIDA');
}

async function limpiarTodo() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras de la base de datos?')) {
        palabras = [];
        
        if (gistId) {
            await limpiarGist();
        }
        
        guardarConfiguracion();
        actualizarNube();
        limpiarEnunciado();
        console.log('Base de datos limpiada');
        alert('✅ Base de datos limpiada correctamente');
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
            case 'pausado':
                btnIniciar.disabled = true;
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
        
        const params = new URLSearchParams({
            sesion: sesionId,
            tema: encodeURIComponent(temaSesion),
            estado: estadoRecepcion,
            gist: gistId || ''
        });
        
        const urlConParametros = `${urlBase}?${params.toString()}`;
        
        console.log('Generando QR con parámetros:', urlConParametros);
        
        const qrPequeno = qrcode(0, 'L');
        qrPequeno.addData(urlConParametros);
        qrPequeno.make();
        document.getElementById('qrCode').innerHTML = qrPequeno.createImgTag(3);
        
        document.getElementById('urlInput').value = urlConParametros;
        document.getElementById('sesionId').textContent = sesionId;
        
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
            sesion: sesionId,
            tema: encodeURIComponent(temaSesion),
            estado: estadoRecepcion,
            gist: gistId || '',
            timestamp: Date.now()
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
    const gistParam = urlParams.get('gist');
    
    if (sesionParam) {
        const datosSesion = {
            sesionId: sesionParam,
            tema: temaParam ? decodeURIComponent(temaParam) : 'Lluvia de Ideas',
            estado: estadoParam || 'inactivo',
            gistId: gistParam || '',
            timestamp: Date.now()
        };
        
        localStorage.setItem('lluviaIdeas_sesion_audiencia', JSON.stringify(datosSesion));
        console.log('Sesión cargada desde URL:', datosSesion);
    }
}

async function verificarEstado() {
    try {
        const datosSesion = JSON.parse(localStorage.getItem('lluviaIdeas_sesion_audiencia') || '{}');
        const estado = datosSesion.estado || 'inactivo';
        const tema = datosSesion.tema || 'Lluvia de Ideas';
        const sesionId = datosSesion.sesionId;
        const gistId = datosSesion.gistId;
        
        const estadoElement = document.getElementById('estado');
        const input = document.getElementById('palabraInput');
        const boton = document.getElementById('btnEnviar');
        const tituloTema = document.getElementById('tituloTema');
        const subtitulo = document.getElementById('subtitulo');
        
        if (!estadoElement || !input || !boton) return;
        
        tituloTema.textContent = '🌧️ ' + tema;
        subtitulo.textContent = `Tema: ${tema}`;
        
        if (!sesionId) {
            estadoElement.textContent = '❌ Escanea el QR del presentador';
            estadoElement.className = 'estado-desconectado';
            input.disabled = true;
            boton.disabled = true;
            input.placeholder = 'Escanea el QR para participar...';
            return;
        }
        
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
        
        const datosSesion = JSON.parse(localStorage.getItem('lluviaIdeas_sesion_audiencia') || '{}');
        const sesionId = datosSesion.sesionId;
        const gistId = datosSesion.gistId;
        
        if (!sesionId) {
            mostrarMensaje('❌ No hay sesión activa. Escanea el QR del presentador.', 'error');
            return;
        }
        
        if (!gistId) {
            mostrarMensaje('❌ No hay base de datos configurada.', 'error');
            return;
        }
        
        const nuevaPalabra = {
            palabra: palabra,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            sesionId: sesionId,
            userAgent: navigator.userAgent.substring(0, 50)
        };
        
        console.log('Enviando palabra:', nuevaPalabra);
        
        // Enviar palabra directamente al Gist público
        const exito = await enviarPalabraAGist(nuevaPalabra, gistId);
        
        if (exito) {
            mostrarMensaje(`✅ ¡Ideas enviada: "<strong>${palabra}</strong>"!`, 'success');
        } else {
            mostrarMensaje('❌ Error al enviar la palabra. Intenta nuevamente.', 'error');
        }
        
        input.value = '';
        input.focus();
        
    } catch (error) {
        console.error('Error enviando palabra:', error);
        mostrarMensaje('❌ Error al enviar la palabra', 'error');
    }
}

async function enviarPalabraAGist(palabraData, targetGistId) {
    if (!targetGistId) {
        console.log('No hay Gist ID para enviar');
        return false;
    }
    
    try {
        console.log('Obteniendo datos actuales del Gist:', targetGistId);
        
        // Primero obtener los datos actuales
        const response = await fetch(`https://api.github.com/gists/${targetGistId}`);
        if (!response.ok) {
            throw new Error(`Error HTTP al obtener: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos obtenidos del Gist:', data);
        
        // Buscar el archivo correcto
        let contenido;
        let fileName;
        if (data.files['palabras.json']) {
            contenido = JSON.parse(data.files['palabras.json'].content);
            fileName = 'palabras.json';
        } else if (data.files['gistfile1.txt']) {
            contenido = JSON.parse(data.files['gistfile1.txt'].content);
            fileName = 'gistfile1.txt';
        } else {
            const primerArchivo = Object.keys(data.files)[0];
            if (primerArchivo) {
                contenido = JSON.parse(data.files[primerArchivo].content);
                fileName = primerArchivo;
            } else {
                throw new Error('No se encontró ningún archivo en el Gist');
            }
        }
        
        console.log('Contenido actual:', contenido);
        
        // Asegurar que el array de palabras existe
        if (!contenido.palabras) {
            contenido.palabras = [];
        }
        
        // Agregar nueva palabra
        contenido.palabras.push(palabraData);
        
        console.log('Contenido actualizado:', contenido);
        
        // Guardar de vuelta - SIN TOKEN (Gist público)
        const updateResponse = await fetch(`https://api.github.com/gists/${targetGistId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
                // No incluimos Authorization header porque el Gist es público
            },
            body: JSON.stringify({
                files: {
                    [fileName]: {
                        content: JSON.stringify(contenido, null, 2)
                    }
                }
            })
        });
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Error HTTP al guardar: ${updateResponse.status} - ${errorText}`);
        }
        
        console.log('Palabra enviada exitosamente a Gist:', palabraData.palabra);
        return true;
        
    } catch (error) {
        console.error('Error enviando palabra a Gist:', error);
        return false;
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
