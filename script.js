// Configuración
const STORAGE_KEY = 'lluviaIdeas_sesion';
const TEMP_LIMIT = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
let estadoRecepcion = 'inactivo';
let temaSesion = 'Lluvia de Ideas';
let palabras = [];
let sesionId = null;
let tiempoInicioSesion = null;
let modoArrastre = true;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('presentador-body')) {
        iniciarPresentador();
    } else {
        iniciarAudiencia();
    }
});

// ===== GESTIÓN DE ALMACENAMIENTO TEMPORAL =====
function generarIdSesion() {
    return 'sesion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function verificarCaducidad() {
    const ahora = Date.now();
    if (tiempoInicioSesion && (ahora - tiempoInicioSesion) > TEMP_LIMIT) {
        if (confirm('La sesión ha caducado (2 horas). ¿Quieres limpiar todas las palabras?')) {
            limpiarTodo();
        }
        tiempoInicioSesion = ahora;
    }
    
    // Actualizar contador
    const tiempoElement = document.getElementById('tiempoLimpiar');
    if (tiempoElement && tiempoInicioSesion) {
        const tiempoRestante = TEMP_LIMIT - (ahora - tiempoInicioSesion);
        if (tiempoRestante > 0) {
            const horas = Math.floor(tiempoRestante / (60 * 60 * 1000));
            const minutos = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));
            tiempoElement.textContent = `${horas}h ${minutos}m`;
        } else {
            tiempoElement.textContent = '¡Caducado!';
        }
    }
}

function limpiarPalabrasCaducadas() {
    const ahora = Date.now();
    const palabrasFiltradas = palabras.filter(palabra => {
        const tiempoPalabra = new Date(palabra.timestamp).getTime();
        return (ahora - tiempoPalabra) < TEMP_LIMIT;
    });
    
    if (palabrasFiltradas.length !== palabras.length) {
        palabras = palabrasFiltradas;
        guardarDatosPresentador();
        console.log('Palabras caducadas eliminadas');
    }
}

// ===== SISTEMA DE ARRASTRE =====
function inicializarArrastre() {
    if (!modoArrastre) return;
    
    const areaEnunciado = document.getElementById('areaEnunciado');
    const nubePalabras = document.getElementById('nubePalabras');
    
    // Hacer todas las palabras arrastrables
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
    
    // Configurar área de enunciado como destino
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
        
        // Remover la clase de arrastre de todas las palabras
        document.querySelectorAll('.arrastrando').forEach(p => {
            p.classList.remove('arrastrando');
            p.style.display = 'block';
        });
    });
}

function agregarPalabraAEnunciado(texto) {
    const areaEnunciado = document.getElementById('areaEnunciado');
    
    // Remover mensaje guía si existe
    const guia = areaEnunciado.querySelector('.enunciado-guia');
    if (guia) guia.remove();
    
    // Crear elemento de palabra en enunciado
    const palabraElement = document.createElement('div');
    palabraElement.className = 'palabra en-enunciado';
    palabraElement.textContent = texto;
    palabraElement.setAttribute('draggable', 'true');
    
    // Hacerla arrastrable también desde el enunciado
    palabraElement.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', texto);
        palabraElement.classList.add('arrastrando');
    });
    
    palabraElement.addEventListener('dragend', function() {
        palabraElement.classList.remove('arrastrando');
    });
    
    // Doble click para remover del enunciado
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
        // Restaurar guía si no hay palabras
        if (!areaEnunciado.querySelector('.enunciado-guia')) {
            const guia = document.createElement('div');
            guia.className = 'enunciado-guia';
            guia.textContent = '💡 Arrastra las palabras para formar un enunciado. Las palabras nuevas aparecen abajo.';
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
    
    // Mezclar aleatoriamente
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
function iniciarPresentador() {
    console.log('Iniciando presentador...');
    cargarDatosPresentador();
    generarNuevoQR();
    actualizarUI();
    
    // Configurar modo arrastre
    const checkboxArrastre = document.getElementById('modoArrastre');
    if (checkboxArrastre) {
        checkboxArrastre.checked = modoArrastre;
        checkboxArrastre.addEventListener('change', function() {
            modoArrastre = this.checked;
        });
    }
    
    // Configurar auto-limpiar
    const checkboxAutoLimpiar = document.getElementById('autoLimpiar');
    if (checkboxAutoLimpiar) {
        checkboxAutoLimpiar.addEventListener('change', function() {
            if (!this.checked) {
                document.getElementById('tiempoLimpiar').textContent = 'Desactivado';
            }
        });
    }
    
    setInterval(function() {
        actualizarNube();
        sincronizarDatos();
        verificarCaducidad();
        
        if (document.getElementById('autoLimpiar')?.checked) {
            limpiarPalabrasCaducadas();
        }
    }, 1000);
}

function cargarDatosPresentador() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        estadoRecepcion = saved.estadoRecepcion || 'inactivo';
        temaSesion = saved.temaSesion || 'Lluvia de Ideas';
        palabras = saved.palabras || [];
        sesionId = saved.sesionId || generarIdSesion();
        tiempoInicioSesion = saved.tiempoInicioSesion || Date.now();
        modoArrastre = saved.modoArrastre !== undefined ? saved.modoArrastre : true;
        
        console.log('Datos cargados:', { estadoRecepcion, temaSesion, palabras: palabras.length, sesionId });
        
        document.getElementById('temaInput').value = temaSesion;
        document.getElementById('tituloPresentador').textContent = temaSesion;
        document.getElementById('sesionId').textContent = sesionId;
        
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
        sesionId: sesionId,
        tiempoInicioSesion: tiempoInicioSesion,
        modoArrastre: modoArrastre,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    return datos;
}

function sincronizarDatos() {
    guardarDatosPresentador();
}

function resetearDatos() {
    estadoRecepcion = 'inactivo';
    temaSesion = 'Lluvia de Ideas';
    palabras = [];
    sesionId = generarIdSesion();
    tiempoInicioSesion = Date.now();
    modoArrastre = true;
    guardarDatosPresentador();
}

function iniciarLluvia() {
    const temaInput = document.getElementById('temaInput');
    temaSesion = temaInput.value.trim() || 'Lluvia de Ideas';
    
    estadoRecepcion = 'activo';
    if (!sesionId) {
        sesionId = generarIdSesion();
    }
    tiempoInicioSesion = Date.now();
    
    guardarDatosPresentador();
    generarNuevoQR();
    
    document.getElementById('tituloPresentador').textContent = temaSesion;
    document.getElementById('sesionId').textContent = sesionId;
    actualizarUI();
    
    console.log('Lluvia de ideas INICIADA:', temaSesion, sesionId);
    alert('✅ Lluvia de ideas INICIADA\n\nNuevo QR generado para la audiencia.');
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
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras y el enunciado?')) {
        palabras = [];
        tiempoInicioSesion = Date.now();
        guardarDatosPresentador();
        actualizarNube();
        limpiarEnunciado();
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
function generarNuevoQR() {
    try {
        if (!sesionId) {
            sesionId = generarIdSesion();
            guardarDatosPresentador();
        }
        
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        const params = new URLSearchParams({
            sesion: sesionId,
            tema: encodeURIComponent(temaSesion),
            estado: estadoRecepcion,
            timestamp: Date.now()
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

function generarQR() {
    generarNuevoQR();
}

function ampliarQR() {
    try {
        const currentUrl = window.location.href;
        let urlBase = currentUrl.replace('presentador.html', 'index.html');
        
        const params = new URLSearchParams({
            sesion: sesionId,
            tema: encodeURIComponent(temaSesion),
            estado: estadoRecepcion,
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
        
        // Inicializar arrastre después de actualizar
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
    
    setInterval(verificarEstado, 1000);
    verificarEstado();
}

function procesarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const sesionParam = urlParams.get('sesion');
    const temaParam = urlParams.get('tema');
    const estadoParam = urlParams.get('estado');
    
    if (sesionParam) {
        const datosSesion = {
            sesionId: sesionParam,
            tema: temaParam ? decodeURIComponent(temaParam) : 'Lluvia de Ideas',
            estado: estadoParam || 'inactivo',
            timestamp: Date.now()
        };
        
        localStorage.setItem('lluviaIdeas_sesion_audiencia', JSON.stringify(datosSesion));
        console.log('Sesión cargada desde URL:', datosSesion);
    }
}

function verificarEstado() {
    try {
        const datosSesion = JSON.parse(localStorage.getItem('lluviaIdeas_sesion_audiencia') || '{}');
        const estado = datosSesion.estado || 'inactivo';
        const tema = datosSesion.tema || 'Lluvia de Ideas';
        const sesionId = datosSesion.sesionId;
        
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
        
        const datosSesion = JSON.parse(localStorage.getItem('lluviaIdeas_sesion_audiencia') || '{}');
        const sesionId = datosSesion.sesionId;
        
        if (!sesionId) {
            mostrarMensaje('❌ No hay sesión activa. Escanea el QR del presentador.', 'error');
            return;
        }
        
        const nuevaPalabra = {
            palabra: palabra,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random(),
            sesionId: sesionId
        };
        
        // Simular envío al presentador
        sincronizarConPresentador(nuevaPalabra);
        
        mostrarMensaje(`✅ ¡Ideas enviada: "<strong>${palabra}</strong>"!`, 'success');
        
        input.value = '';
        input.focus();
        
        console.log('Palabra enviada:', nuevaPalabra);
        
    } catch (error) {
        console.error('Error enviando palabra:', error);
        mostrarMensaje('❌ Error al enviar la palabra', 'error');
    }
}

function sincronizarConPresentador(palabraData) {
    console.log('Sincronizando palabra con presentador:', palabraData);
    
    // En un entorno real, aquí iría la lógica de servidor
    setTimeout(() => {
        console.log('Palabra sincronizada (simulado):', palabraData.palabra);
    }, 500);
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
