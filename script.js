// 👉 SCRIPT.JS MODIFICADO
// ----------------------------------------------
// ✔ gistId queda FIJO en el código
// ✔ Token sí se puede introducir desde la página
// ✔ NO se generan nuevos QR; siempre se usa el mismo
// ----------------------------------------------

// 🟦 CONFIGURACIÓN FIJA
const gistId = "54887f05f30068b809593420f98c4b99"; // ← tu Gist fijo
let githubToken = ""; // se cargará desde el input

// 🟦 OTRAS VARIABLES
let palabras = [];
let estadoRecepcion = "inactivo";
let temaSesion = "Lluvia de Ideas";
let sesionId = generarIdSesion();
let modoArrastre = true;

// 🟩 CARGA CONFIGURACIÓN (solo token)
function cargarConfiguracion() {
    const tokenInput = document.getElementById("githubToken");
    const tokenLS = localStorage.getItem("lluviaIdeas_token") || "";
    githubToken = tokenLS;
    if (tokenInput) tokenInput.value = githubToken;

    // Mostrar el gist fijo
    const gistActual = document.getElementById("gistActual");
    if (gistActual) gistActual.textContent = gistId;
}

// 🟩 GUARDAR TOKEN
function guardarConfig() {
    githubToken = document.getElementById("githubToken").value.trim();
    localStorage.setItem("lluviaIdeas_token", githubToken);
    alert("Token guardado correctamente");
}

// 🟦 FUNCIÓN PARA CARGAR TU GIST FIJO
async function cargarGistExistente() {
    try {
        const url = `https://api.github.com/gists/${gistId}`;
        const headers = githubToken ? { "Authorization": `Bearer ${githubToken}` } : {};

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("No se pudo leer el Gist");

        const data = await response.json();

        const archivo = data.files["db.json"];
        if (!archivo) throw new Error("El archivo db.json no existe en el Gist");

        palabras = JSON.parse(archivo.content).items || [];
        actualizarContador();
        actualizarNube();

    } catch (error) {
        alert("❌ Error cargando base de datos. Verifica Token si es privado.");
    }
}

// 🟦 GUARDAR EN EL GIST
async function guardarPalabrasEnGist() {
    try {
        const url = `https://api.github.com/gists/${gistId}`;
        const headers = {
            "Content-Type": "application/json",
        };
        if (githubToken) headers["Authorization"] = `Bearer ${githubToken}`;

        const body = {
            files: {
                "db.json": {
                    content: JSON.stringify({ items: palabras })
                }
            }
        };

        const response = await fetch(url, {
            method: "PATCH",
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error("Error guardando en el gist");
        actualizarContador();

    } catch (error) {
        console.error(error);
    }
}

// 🟦 FUNCIÓN PARA ENVIAR UNA PALABRA
async function enviarPalabra() {
    const input = document.getElementById("palabraInput");
    const palabra = input.value.trim();
    if (palabra === "") return;

    palabras.push(palabra);
    input.value = "";

    await guardarPalabrasEnGist();
    actualizarNube();
}

// ---------------------------------
// 🟨 QR SIEMPRE EL MISMO (NO CAMBIA)
// ---------------------------------
function generarNuevoQR() {
    generarQR(); // simple, no cambia nada
}

function generarQR() {
    const url = window.location.href.replace("presentador", "audiencia");
    document.getElementById("urlInput").value = url;

    const qr = qrcode(0, "L");
    qr.addData(url);
    qr.make();

    document.getElementById("qrCode").innerHTML = qr.createImgTag();
    document.getElementById("qrAmpliado").innerHTML = qr.createImgTag(8);
}

// ---------------------------------
// UTILIDADES
// ---------------------------------
function generarIdSesion() {
    return Math.random().toString(36).substr(2, 8);
}

function actualizarContador() {
    const contador = document.getElementById("contadorPalabras");
    if (contador) contador.textContent = palabras.length;
}

function actualizarNube() {
    const contenedor = document.getElementById("nubePalabras");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    palabras.forEach(p => {
        const el = document.createElement("div");
        el.className = "palabra";
        el.textContent = p;
        contenedor.appendChild(el);
    });
}

// 🟦 INICIALIZACIÓN
window.onload = function () {
    cargarConfiguracion();
    cargarGistExistente();
    generarQR();
};
