/* script.js - Versión FINAL con API integrada */
// ✅ MODIFICADO API: URL de tu API en la nube.
const API_URL = 'https://api-dental.onrender.com/api'; 

const jsPDF = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jspdf;
let dienteSeleccionado = null;
let tratamientos = [];
let pacientes = []; // MODIFICADO API: Ya no se carga de localStorage
let descuentoPorcentaje = 0;
let totalConDescuento = 0;
let historiaClinica = {
  antecedentes: '',
  motivo: '',
  diagnostico: '',
  evolucion: [],
  radiografias: []
};
let pacienteActualId = null;
let idioma = localStorage.getItem('idioma') || 'es';

// ✅ NUEVO: Tratamientos globales por idioma (6 idiomas)
const tratamientosPorIdioma = {
  es: JSON.parse(localStorage.getItem('tratamientosGlobales_es')) || [
    { nombre: "Resina", precio: 800 },
    { nombre: "Extracción", precio: 600 },
    { nombre: "Implante", precio: 12000 },
    { nombre: "Corona", precio: 3500 }
  ],
  en: JSON.parse(localStorage.getItem('tratamientosGlobales_en')) || [
    { nombre: "Filling", precio: 800 },
    { nombre: "Extraction", precio: 600 },
    { nombre: "Implant", precio: 12000 },
    { nombre: "Crown", precio: 3500 }
  ],
  pt: JSON.parse(localStorage.getItem('tratamientosGlobales_pt')) || [
    { nome: "Resina", preco: 800 },
    { nome: "Extração", preco: 600 },
    { nome: "Implante", preco: 12000 },
    { nome: "Coroa", preco: 3500 }
  ],
  fr: JSON.parse(localStorage.getItem('tratamientosGlobales_fr')) || [
    { nom: "Obturation", prix: 800 },
    { nom: "Extraction", prix: 600 },
    { nom: "Implant", prix: 12000 },
    { nom: "Couronne", prix: 3500 }
  ],
  de: JSON.parse(localStorage.getItem('tratamientosGlobales_de')) || [
    { name: "Füllung", preis: 800 },
    { name: "Extraktion", preis: 600 },
    { name: "Implantat", preis: 12000 },
    { name: "Krone", preis: 3500 }
  ],
  it: JSON.parse(localStorage.getItem('tratamientosGlobales_it')) || [
    { nome: "Otturazione", prezzo: 800 },
    { nome: "Estrazione", prezzo: 600 },
    { nome: "Impianto", prezzo: 12000 },
    { nome: "Corona", prezzo: 3500 }
  ]
};

// Guardar tratamientos iniciales si no existen
['es', 'en', 'pt', 'fr', 'de', 'it'].forEach(lang => {
  const key = `tratamientosGlobales_${lang}`;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(tratamientosPorIdioma[lang]));
  }
});

// ✅ Función para obtener tratamientos según idioma actual
function getTratamientosGlobales() {
  return tratamientosPorIdioma[idioma] || tratamientosPorIdioma.es;
}

// ✅ Función para guardar tratamientos por idioma
function guardarTratamientosGlobales() {
  localStorage.setItem(`tratamientosGlobales_${idioma}`, JSON.stringify(tratamientosPorIdioma[idioma]));
}

const mapaTratamientos = {
  "Resina": { simbolo: "🪥", clase: "resina" },
  "Extracción": { simbolo: "🔴", clase: "extraccion" },
  "Implante": { simbolo: "⚪", clase: "implante" },
  "Corona": { simbolo: "🦷", clase: "corona" },
  "Filling": { simbolo: "🪥", clase: "resina" },
  "Extraction": { simbolo: "🔴", clase: "extraccion" },
  "Implant": { simbolo: "⚪", clase: "implante" },
  "Crown": { simbolo: "🦷", clase: "corona" },
  "Resina": { simbolo: "🪥", clase: "resina" },
  "Extração": { simbolo: "🔴", clase: "extraccion" },
  "Implante": { simbolo: "⚪", clase: "implante" },
  "Coroa": { simbolo: "🦷", clase: "corona" },
  "Obturation": { simbolo: "🪥", clase: "resina" },
  "Extraction": { simbolo: "🔴", clase: "extraccion" },
  "Implant": { simbolo: "⚪", clase: "implante" },
  "Couronne": { simbolo: "🦷", clase: "corona" },
  "Füllung": { simbolo: "🪥", clase: "resina" },
  "Extraktion": { simbolo: "🔴", clase: "extraccion" },
  "Implantat": { simbolo: "⚪", clase: "implante" },
  "Krone": { simbolo: "🦷", clase: "corona" },
  "Otturazione": { simbolo: "🪥", clase: "resina" },
  "Estrazione": { simbolo: "🔴", clase: "extraccion" },
  "Impianto": { simbolo: "⚪", clase: "implante" },
  "Corona": { simbolo: "🦷", clase: "corona" }
};

const dientesAdultosSuperior = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
const dientesAdultosInferior = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];
const dientesTemporalesSuperior = [55,54,53,52,51, 61,62,63,64,65];
const dientesTemporalesInferior = [85,84,83,82,81, 71,72,73,74,75];

// ✅ Imágenes reales - DIENTES PERMANENTES (11-48)
const IMAGENES_DIENTES_PERMANENTES = {
  11: "https://utfs.io/f/5BN0V4mlt4NUnNUYppXD4gRZpGckqudINzYHoSJ80Lxef57O",
  12: "https://utfs.io/f/5BN0V4mlt4NUOIs39v6PNsLblzaKv5U1QEjxYIHfWDRJ7XSo",
  13: "https://utfs.io/f/5BN0V4mlt4NU0V8yAvReXK1e7fx2toMJsnUB0SuRjmzqgk85",
  14: "https://utfs.io/f/5BN0V4mlt4NUMBhx7tidyc538gnZeSE0T1rq2okvXVGzR96H",
  15: "https://utfs.io/f/5BN0V4mlt4NUlTVZIWB0Lm1jND8A5svMyJbOHCQpwklPaiWK",
  16: "https://utfs.io/f/5BN0V4mlt4NUhiFPSfVmf29XURODBcEq3deYjaixbCFJ7rSk",
  17: "https://utfs.io/f/5BN0V4mlt4NUUAWhwfy1cuiEHpRa42vFsthdbTYZfAz8QKD6",
  18: "https://utfs.io/f/5BN0V4mlt4NU46YPqMEX8vAzdB0fUp3eiFV5rP1bGcnZLxly",
  21: "https://utfs.io/f/5BN0V4mlt4NUe6G02ShXdTtPbIQSl8AwLzBJ4HKqm0aYk6Nv",
  22: "https://utfs.io/f/5BN0V4mlt4NUga78Rk66BqOy1kIKDulX9hfbSMRcVdnzC4ZA",
  23: "https://utfs.io/f/5BN0V4mlt4NU4rFX5wpEX8vAzdB0fUp3eiFV5rP1bGcnZLxl",
  24: "https://utfs.io/f/5BN0V4mlt4NUY7q64UOLeOq4DvtXzCRBycKuiUjboW5QFAIG",
  25: "https://utfs.io/f/5BN0V4mlt4NUunf2RqA59gF0jSNiIaobTk63MY75pshlO2Vw",
  26: "https://utfs.io/f/5BN0V4mlt4NUh2kdKWVmf29XURODBcEq3deYjaixbCFJ7rSk",
  27: "https://utfs.io/f/5BN0V4mlt4NUmPo6C2ndxzUtKyGsF9JqRNCaY1Dw4EZmhOLT",
  28: "https://utfs.io/f/5BN0V4mlt4NU2NI7UK4sQo0JTH7AukizlrgBVm35SqKPFYX1",
  31: "https://utfs.io/f/5BN0V4mlt4NUvTINLRgBR16k35MnVrP0c7Ga2UAXCSLEINHZ",
  32: "https://utfs.io/f/5BN0V4mlt4NU9Hw1KcoBQTn7AuyhxYLzkWvC4j5sVSU3IeGw",
  33: "https://utfs.io/f/5BN0V4mlt4NU7KzSE75pLDr6ig2VBIX0cFltA5mjbJwMHaN1",
  34: "https://utfs.io/f/5BN0V4mlt4NUhu3gfFBVmf29XURODBcEq3deYjaixbCFJ7rS",
  35: "https://utfs.io/f/5BN0V4mlt4NU8xNgpPupU65JDEFiRj97n2lrQyNcobuZdm3s",
  36: "https://utfs.io/f/5BN0V4mlt4NU8Yh3yqupU65JDEFiRj97n2lrQyNcobuZdm3s",
  37: "https://utfs.io/f/5BN0V4mlt4NUsDSJELlNYxrdB2pXWune8Et3HLT9vKyR5bOG",
  38: "https://utfs.io/f/5BN0V4mlt4NURyvOK1ZVHgi3IwrhbkdUz4Ql7nP8S1mBjRuE",
  41: "https://utfs.io/f/5BN0V4mlt4NULX7VpCDKRkDx1UI07uyMbS3wvZWCaH6nolme",
  42: "https://utfs.io/f/5BN0V4mlt4NUnhHcUnXD4gRZpGckqudINzYHoSJ80Lxef57O",
  43: "https://utfs.io/f/5BN0V4mlt4NUkbWr2iKcYeEWHJagI08DSuKnXwL9ZRzGv7xy",
  44: "https://utfs.io/f/5BN0V4mlt4NUw8oE7OJEvHaeJkps951bVfunNqPDtzMjSdcR",
  45: "https://utfs.io/f/5BN0V4mlt4NUlX7svJB0Lm1jND8A5svMyJbOHCQpwklPaiWK",
  46: "https://utfs.io/f/5BN0V4mlt4NUVBr3F58SCIW2EdUXm9zrBTZogQ5HR6nkVpPJ",
  47: "https://utfs.io/f/5BN0V4mlt4NUnjAscdQXD4gRZpGckqudINzYHoSJ80Lxef57",
  48: "https://utfs.io/f/5BN0V4mlt4NU7valOapLDr6ig2VBIX0cFltA5mjbJwMHaN1U"
};

// ✅ Imágenes reales - DIENTES TEMPORALES (51-85)
const IMAGENES_DIENTES_TEMPORALES = {
  51: "https://utfs.io/f/5BN0V4mlt4NUeOUNEzhXdTtPbIQSl8AwLzBJ4HKqm0aYk6Nv",
  52: "https://utfs.io/f/5BN0V4mlt4NUXQyWJj3ikVqSE2R0lvYyWceT5uxfm3UMzsrB",
  53: "https://utfs.io/f/5BN0V4mlt4NUrYi3IbGz5NPcaAgwizpdKqn4rb3Q1IHGDuV6",
  54: "https://utfs.io/f/5BN0V4mlt4NU3VbzmOj6Jy2pdlUv0WDFR5fOBtkEiPmZCNQ9",
  55: "https://utfs.io/f/5BN0V4mlt4NUm1jcwHndxzUtKyGsF9JqRNCaY1Dw4EZmhOLT",
  61: "https://utfs.io/f/5BN0V4mlt4NUoUSA9K7Ra4Yu6KWb18xgTpVGjSBHieoZOQzU",
  62: "https://utfs.io/f/5BN0V4mlt4NUS2KFZ2NlVg6pqOXDdhwYsGCTZ8mbkI0cAWae",
  63: "https://utfs.io/f/5BN0V4mlt4NUk1dbmAKcYeEWHJagI08DSuKnXwL9ZRzGv7xy",
  64: "https://utfs.io/f/5BN0V4mlt4NUJ6yUwntvGqKoVFrLehBNUdQRSHzCijwgbE2v",
  65: "https://utfs.io/f/5BN0V4mlt4NU2AJG7V4sQo0JTH7AukizlrgBVm35SqKPFYX1",
  71: "https://utfs.io/f/5BN0V4mlt4NUm397hOgndxzUtKyGsF9JqRNCaY1Dw4EZmhOL",
  72: "https://utfs.io/f/5BN0V4mlt4NUpZ2U87kLw9yMHK4F5tXqaNhSAE8ijboR2ecu",
  73: "https://utfs.io/f/5BN0V4mlt4NUh5fXc8Vmf29XURODBcEq3deYjaixbCFJ7rSk",
  74: "https://utfs.io/f/5BN0V4mlt4NUcky5Odz7aELj6pnFhwbNzH9I4D58t0OSC73m",
  75: "https://utfs.io/f/5BN0V4mlt4NUmMcJqZndxzUtKyGsF9JqRNCaY1Dw4EZmhOLT",
  81: "https://utfs.io/f/5BN0V4mlt4NUHR5bhywJawI05ZiQ2fKRPnjdOV4lGbr3ATFx",
  82: "https://utfs.io/f/5BN0V4mlt4NUlm6jSLB0Lm1jND8A5svMyJbOHCQpwklPaiWK",
  83: "https://utfs.io/f/5BN0V4mlt4NU7ZBGFjpLDr6ig2VBIX0cFltA5mjbJwMHaN1U",
  84: "https://utfs.io/f/5BN0V4mlt4NULmgh8jDKRkDx1UI07uyMbS3wvZWCaH6nolme",
  85: "https://utfs.io/f/5BN0V4mlt4NUe88GdMfhXdTtPbIQSl8AwLzBJ4HKqm0aYk6N"
};

function obtenerSimboloYClase(tratamiento) {
  return mapaTratamientos[tratamiento] || { simbolo: "•", clase: "con-tratamiento" };
}

function sanitizarNombre(nombre) {
  return (nombre || 'sin_nombre').replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_');
}

function quitarAcentos(texto) {
  if (!texto) return '';
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function limpiarTextoExport(texto) {
  if (texto === undefined || texto === null) return '';
  return String(texto);
}

function formatearFechaDDMMYYYY(fechaISO) {
  if (!fechaISO) return '';
  const [año, mes, dia] = fechaISO.split('-');
  return `${dia}/${mes}/${año}`;
}

function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr) return '';
  const partes = fechaStr.split('/');
  if (partes.length !== 3) return '';
  const [dia, mes, año] = partes;
  const fecha = new Date(`${año}-${mes}-${dia}`);
  if (isNaN(fecha)) return '';
  return fecha.toISOString().split('T')[0];
}

function actualizarDiente(num) {
  const dienteEl = document.querySelector(`.contenedor-diente[data-numero="${num}"]`);
  if (!dienteEl) return;
  const tratamientosDiente = tratamientos.filter(t => t.diente == num);
  if (tratamientosDiente.length > 0) {
    const ultimo = tratamientosDiente[tratamientosDiente.length - 1];
    const { simbolo, clase } = obtenerSimboloYClase(ultimo.tratamiento);
    const overlay = dienteEl.querySelector('.overlay-diente');
    if (overlay) {
      overlay.textContent = simbolo;
    }
    dienteEl.className = 'contenedor-diente ' + clase;
    const tooltip = tratamientosDiente.map(t => `${t.tratamiento} ($${t.precio})`).join('\n');
    dienteEl.dataset.tooltip = tooltip;
  } else {
    const overlay = dienteEl.querySelector('.overlay-diente');
    if (overlay) {
      overlay.textContent = num;
    }
    dienteEl.className = 'contenedor-diente';
    dienteEl.dataset.tooltip = '';
  }
}

function dibujarOdontograma() {
  const supAdultos = document.getElementById('superior-adultos');
  const supTemporales = document.getElementById('superior-temporales');
  const infTemporales = document.getElementById('inferior-temporales');
  const infAdultos = document.getElementById('inferior-adultos');
  if (!supAdultos || !supTemporales || !infTemporales || !infAdultos) return;
  supAdultos.innerHTML = '';
  supTemporales.innerHTML = '';
  infTemporales.innerHTML = '';
  infAdultos.innerHTML = '';

  const supDerAdultos = dientesAdultosSuperior.slice(0, 8);
  const supIzqAdultos = dientesAdultosSuperior.slice(8);
  const supDerTemporales = dientesTemporalesSuperior.slice(0, 5);
  const supIzqTemporales = dientesTemporalesSuperior.slice(5);
  const infDerTemporales = dientesTemporalesInferior.slice(0, 5);
  const infIzqTemporales = dientesTemporalesInferior.slice(5);
  const infDerAdultos = dientesAdultosInferior.slice(0, 8);
  const infIzqAdultos = dientesAdultosInferior.slice(8);

  function crearCuadrante(dientes, esTemporal = false) {
    const div = document.createElement('div');
    div.className = 'cuadrante';
    dientes.forEach(num => {
      const diente = document.createElement('div');
      diente.className = 'contenedor-diente';
      diente.dataset.numero = num;
      diente.setAttribute('role', 'button');
      diente.setAttribute('tabindex', '0');
      diente.setAttribute('aria-label', `Diente ${num}`);
      const esPermanente = num >= 11 && num <= 48;
      const esTemporalReal = num >= 51 && num <= 85;
      let imagenSrc = null;
      if (esPermanente && IMAGENES_DIENTES_PERMANENTES[num]) {
        imagenSrc = IMAGENES_DIENTES_PERMANENTES[num];
      } else if (esTemporalReal && IMAGENES_DIENTES_TEMPORALES[num]) {
        imagenSrc = IMAGENES_DIENTES_TEMPORALES[num];
      }
      if (imagenSrc) {
        const img = document.createElement('img');
        img.src = imagenSrc;
        img.alt = `Diente ${num}`;
        img.classList.add('imagen-diente');
        img.onerror = function() {
          this.outerHTML = `
            <svg viewBox="0 0 100 130" class="imagen-diente">
              <path d="M50,10 C60,10 70,20 70,40 C70,60 65,80 50,90 C35,80 30,60 30,40 C30,20 40,10 50,10 Z" 
                    fill="var(--diente-fondo)" stroke="#555" stroke-width="2"/>
              <text x="50%" y="70%" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--texto)">
                ${num}
              </text>
            </svg>
          `;
        };
        diente.appendChild(img);
        const numeroEtiqueta = document.createElement('div');
        numeroEtiqueta.className = 'numero-diente-etiqueta';
        numeroEtiqueta.textContent = num;
        diente.appendChild(numeroEtiqueta);
      } else {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 130');
        svg.classList.add('imagen-diente');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#diente-${num}`);
        svg.appendChild(use);
        diente.appendChild(svg);
        const overlay = document.createElement('div');
        overlay.className = 'overlay-diente';
        overlay.textContent = num;
        diente.appendChild(overlay);
      }
      diente.onclick = () => seleccionarDiente(num);
      div.appendChild(diente);
    });
    return div;
  }

  supAdultos.appendChild(crearCuadrante(supDerAdultos, false));
  supAdultos.appendChild(crearCuadrante(supIzqAdultos, false));
  supTemporales.appendChild(crearCuadrante(supDerTemporales, true));
  supTemporales.appendChild(crearCuadrante(supIzqTemporales, true));
  infTemporales.appendChild(crearCuadrante(infDerTemporales, true));
  infTemporales.appendChild(crearCuadrante(infIzqTemporales, true));
  infAdultos.appendChild(crearCuadrante(infDerAdultos, false));
  infAdultos.appendChild(crearCuadrante(infIzqAdultos, false));
}

function seleccionarDiente(num) {
  dienteSeleccionado = num;
  document.getElementById('dienteActual').textContent = num;
  const contenedor = document.getElementById('opciones-tratamientos');
  contenedor.innerHTML = '';
  const listaActual = getTratamientosGlobales();
  listaActual.forEach(t => {
    const nombre = t.nombre || t.name || t.nom || t.nome;
    const precio = t.precio || t.preco || t.prix || t.preis;
    const div = document.createElement('div');
    div.className = 'opcion-tratamiento';
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.innerHTML = `<span>${nombre}</span> <span>$${precio}</span>`;
    div.onclick = () => aplicarTratamiento(nombre, precio);
    contenedor.appendChild(div);
  });
  document.getElementById('modalTratamiento').style.display = 'flex';
}

function aplicarTratamiento(nombre, precio) {
  if (!dienteSeleccionado) return;
  tratamientos.push({
    diente: dienteSeleccionado,
    tratamiento: nombre,
    precio: precio
  });
  renderizarTratamientos();
  actualizarDiente(dienteSeleccionado);
  cerrarModalTratamientos();
}

function cerrarModalTratamientos() {
  document.getElementById('modalTratamiento').style.display = 'none';
  dienteSeleccionado = null;
}

// ✅ NUEVAS FUNCIONES PARA TRATAMIENTOS GENERALES PERSONALIZADOS
function abrirModalTratamientoGeneral() {
  let modal = document.getElementById('modalTratamientoGeneralPersonalizado');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalTratamientoGeneralPersonalizado';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3 id="titulo-modal-tratamiento-general-personalizado">Agregar Tratamiento General</h3>
        <label id="label-tratamiento-general">Tratamiento:</label>
        <input type="text" id="tratamiento-general" placeholder="Nombre del tratamiento" />
        <label id="label-precio-general">Precio:</label>
        <input type="number" id="precio-general" placeholder="0.00" step="0.01" min="0" />
        <br><br>
        <button class="btn-guardar" onclick="guardarTratamientoGeneralPersonalizado()">Agregar</button>
        <button class="btn-cerrar" onclick="cerrarModalTratamientoGeneralPersonalizado()">Cancelar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('tratamiento-general').value = '';
  document.getElementById('precio-general').value = '';
  modal.style.display = 'flex';
}

function cerrarModalTratamientoGeneralPersonalizado() {
  const modal = document.getElementById('modalTratamientoGeneralPersonalizado');
  if (modal) modal.style.display = 'none';
}

function guardarTratamientoGeneralPersonalizado() {
  const nombre = document.getElementById('tratamiento-general').value.trim();
  const precio = parseFloat(document.getElementById('precio-general').value);
  if (!nombre) {
    mostrarNotificacion('Por favor ingrese un nombre para el tratamiento', 'error');
    return;
  }
  if (isNaN(precio) || precio < 0) {
    mostrarNotificacion('Por favor ingrese un precio válido', 'error');
    return;
  }
  tratamientos.push({
    diente: 'General',
    tratamiento: nombre,
    precio: precio
  });
  renderizarTratamientos();
  cerrarModalTratamientoGeneralPersonalizado();
  mostrarNotificacion('Tratamiento general agregado correctamente');
}

window.addEventListener('click', (event) => {
  const modales = ['modalTratamiento', 'modalPacientes', 'modalHistoria', 'modalRadiografias', 'modalEvolucion', 'modalAdeudos', 'modalAbono', 'modalAmpliarRadio', 'modalCargaExcel', 'modalGestionTratamientos', 'modalNuevoTratamiento', 'modalTratamientoGeneralPersonalizado'];
  modales.forEach(id => {
    const modal = document.getElementById(id);
    if (modal && event.target === modal) {
      modal.style.display = 'none';
      if (id === 'modalTratamiento') dienteSeleccionado = null;
    }
  });
});

function renderizarTratamientos() {
  const tbody = document.getElementById('cuerpo-tabla');
  tbody.innerHTML = '';
  let total = 0;
  tratamientos.forEach((t, i) => {
    const tr = document.createElement('tr');
    const precioText = `$${Number(t.precio || 0).toFixed(2)}`;
    tr.innerHTML = `
      <td>${t.diente}</td>
      <td>${t.tratamiento}</td>
      <td>${precioText}</td>
      <td>
        <button onclick="eliminarTratamiento(${i})">Eliminar</button>
        <button class="btn-historia-mini" onclick="agregarATratamientoAHistoria(${i})">A Evolución</button>
      </td>
    `;
    tbody.appendChild(tr);
    total += Number(t.precio || 0);
  });
  document.getElementById('total-monto').textContent = total.toFixed(2);
  if (descuentoPorcentaje > 0) {
    totalConDescuento = total * (1 - descuentoPorcentaje / 100);
    document.getElementById('total-con-descuento').textContent =
      `Total con descuento: $${totalConDescuento.toFixed(2)}`;
  } else {
    document.getElementById('total-con-descuento').textContent = '';
    totalConDescuento = total;
  }
}

function eliminarTratamiento(index) {
  const diente = tratamientos[index] ? tratamientos[index].diente : null;
  tratamientos.splice(index, 1);
  renderizarTratamientos();
  if (diente !== null) actualizarDiente(diente);
}

function renderizarTratamientosGlobales(idiomaModal = null) {
  const contenedor = document.getElementById('lista-tratamientos-globales');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  const usarIdioma = idiomaModal || idioma;
  const lista = tratamientosPorIdioma[usarIdioma] || tratamientosPorIdioma.es;
  lista.forEach((t, i) => {
    const nombre = t.nombre || t.name || t.nom || t.nome;
    const precio = t.precio || t.preco || t.prix || t.preis;
    const span = document.createElement('div');
    span.className = 'tratamiento-global';
    span.style.display = 'flex';
    span.style.justifyContent = 'space-between';
    span.style.alignItems = 'center';
    span.innerHTML = `
      <span>${nombre} ($${precio})</span>
      <div>
        <button class="btn-editar" onclick="editarTratamientoGlobal(${i}, '${usarIdioma}')">✏️</button>
        <button class="btn-eliminar" onclick="eliminarTratamientoGlobal(${i}, '${usarIdioma}')">🗑️</button>
      </div>
    `;
    contenedor.appendChild(span);
  });
}

function abrirModalGestionTratamientos(idiomaModal = null) {
  window.idiomaModalActivo = idiomaModal || idioma;
  renderizarTratamientosGlobales(idiomaModal);
  document.getElementById('modalGestionTratamientos').style.display = 'flex';
  const titulo = document.getElementById('titulo-modal-gestion');
  if (titulo) {
    titulo.textContent = 'Gestionar Tratamientos' + ` (${idiomaModal?.toUpperCase() || idioma.toUpperCase()})`;
  }
}

function cerrarModalGestionTratamientos() {
  document.getElementById('modalGestionTratamientos').style.display = 'none';
}

function abrirModalNuevoTratamiento() {
  document.getElementById('modalNuevoTratamiento').style.display = 'flex';
}

function cerrarModalNuevoTratamiento() {
  document.getElementById('modalNuevoTratamiento').style.display = 'none';
}

function agregarTratamientoGlobal() {
  const nombre = document.getElementById('nuevoNombreTratamiento').value.trim();
  const precio = parseFloat(document.getElementById('nuevoPrecioTratamiento').value);
  if (!nombre || isNaN(precio)) {
    mostrarNotificacion('Por favor complete todos los campos', 'error');
    return;
  }
  const usarIdioma = window.idiomaModalActivo || idioma;
  tratamientosPorIdioma[usarIdioma].push({ 
    nombre, 
    precio,
    // Normalizar claves por idioma
    ...(usarIdioma === 'pt' && { nome: nombre, preco: precio }),
    ...(usarIdioma === 'fr' && { nom: nombre, prix: precio }),
    ...(usarIdioma === 'de' && { name: nombre, preis: precio }),
    ...(usarIdioma === 'it' && { nome: nombre, prezzo: precio })
  });
  guardarTratamientosGlobales();
  renderizarTratamientosGlobales(usarIdioma);
  cerrarModalNuevoTratamiento();
  document.getElementById('nuevoNombreTratamiento').value = '';
  document.getElementById('nuevoPrecioTratamiento').value = '';
}

function editarTratamientoGlobal(index, idiomaEdicion) {
  const lista = tratamientosPorIdioma[idiomaEdicion] || tratamientosPorIdioma.es;
  const item = lista[index];
  const nombreActual = item.nombre || item.name || item.nom || item.nome;
  const precioActual = item.precio || item.preco || item.prix || item.preis;
  const nuevoNombre = prompt('Nuevo nombre:', nombreActual);
  const nuevoPrecio = prompt('Nuevo precio:', precioActual);
  if (nuevoNombre !== null && nuevoPrecio !== null) {
    const nuevoPrecioNum = parseFloat(nuevoPrecio) || 0;
    lista[index] = {
      nombre: nuevoNombre.trim(),
      precio: nuevoPrecioNum,
      ...(idiomaEdicion === 'pt' && { nome: nuevoNombre.trim(), preco: nuevoPrecioNum }),
      ...(idiomaEdicion === 'fr' && { nom: nuevoNombre.trim(), prix: nuevoPrecioNum }),
      ...(idiomaEdicion === 'de' && { name: nuevoNombre.trim(), preis: nuevoPrecioNum }),
      ...(idiomaEdicion === 'it' && { nome: nuevoNombre.trim(), prezzo: nuevoPrecioNum })
    };
    localStorage.setItem(`tratamientosGlobales_${idiomaEdicion}`, JSON.stringify(lista));
    renderizarTratamientosGlobales(idiomaEdicion);
  }
}

function eliminarTratamientoGlobal(index, idiomaEdicion) {
  if (confirm('¿Está seguro de eliminar este tratamiento?')) {
    tratamientosPorIdioma[idiomaEdicion].splice(index, 1);
    localStorage.setItem(`tratamientosGlobales_${idiomaEdicion}`, JSON.stringify(tratamientosPorIdioma[idiomaEdicion]));
    renderizarTratamientosGlobales(idiomaEdicion);
  }
}

// MODIFICADO API: Función para cargar pacientes desde el servidor
async function cargarPacientesDesdeAPI() {
  try {
    const response = await fetch(`${API_URL}/pacientes`);
    if (!response.ok) throw new Error('Error al cargar pacientes');
    pacientes = await response.json();
    console.log('Pacientes cargados desde la API:', pacientes);
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al conectar con el servidor. Revisa tu conexión.', 'error');
    pacientes = []; // Dejar la lista vacía si hay error
  }
}

// MODIFICADO API: Función para guardar un paciente (crear o actualizar)
async function guardarPacienteEnAPI(pacienteData) {
  try {
    let response;
    if (pacienteActualId) {
      // Actualizar paciente existente
      response = await fetch(`${API_URL}/pacientes/${pacienteActualId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacienteData)
      });
    } else {
      // Crear nuevo paciente
      response = await fetch(`${API_URL}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacienteData)
      });
    }

    if (!response.ok) throw new Error('Error al guardar el paciente');
    
    const pacienteGuardado = await response.json();
    pacienteActualId = pacienteGuardado._id; // Asignar el nuevo ID si se creó
    await cargarPacientesDesdeAPI(); // Recargar la lista de pacientes

    return pacienteGuardado;
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al guardar el paciente. Inténtalo de nuevo.', 'error');
    return null;
  }
}

// MODIFICADO API: Función para eliminar un paciente
async function eliminarPacienteDeAPI(id) {
  try {
    const response = await fetch(`${API_URL}/pacientes/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar el paciente');
    await cargarPacientesDesdeAPI(); // Recargar la lista
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al eliminar el paciente.', 'error');
  }
}

// MODIFICADO API: La función guardarPaciente ahora llama a la API
async function guardarPaciente() {
  const nombre = document.getElementById('nombre').value.trim();
  if (!nombre) {
    mostrarNotificacion('Por favor ingrese el nombre del paciente', 'error');
    return;
  }
  const pacienteData = {
    nombre,
    correo: document.getElementById('correo').value,
    celular: document.getElementById('celular').value,
    edad: document.getElementById('edad').value,
    doctor: document.getElementById('doctor').value,
    fecha: document.getElementById('fecha').value,
    tratamientos: [...tratamientos],
    historiaClinica: {
      antecedentes: document.getElementById('antecedentes').value || '',
      motivo: document.getElementById('motivo').value || '',
      diagnostico: document.getElementById('diagnostico').value || '',
      evolucion: Array.isArray(historiaClinica.evolucion) ? [...historiaClinica.evolucion] : [],
      radiografias: Array.isArray(historiaClinica.radiografias) ? [...historiaClinica.radiografias] : []
    }
  };

  const resultado = await guardarPacienteEnAPI(pacienteData);
  if (resultado) {
    mostrarNotificacion(pacienteActualId ? 'Paciente actualizado correctamente' : 'Paciente guardado correctamente');
  }
}

// MODIFICADO API: La función mostrarListaPacientes ahora carga desde la API
async function mostrarListaPacientes() {
  await cargarPacientesDesdeAPI(); // Asegurarse de tener los datos más recientes

  const contenedor = document.getElementById('lista-pacientes-modal');
  const buscador = document.getElementById('buscador-pacientes');
  contenedor.innerHTML = '';
  if (buscador) buscador.value = '';
  if (pacientes.length === 0) {
    contenedor.innerHTML = `<p>No hay pacientes registrados</p>`;
  } else {
    pacientes.forEach(p => {
      const div = document.createElement('div');
      div.className = 'paciente-item';
      div.dataset.nombre = (p.nombre || '').toLowerCase();
      div.innerHTML = `
        <div>
          <strong>${p.nombre}</strong><br><small>${p.fecha || ''}</small>
        </div>
        <button class="btn-eliminar" onclick="eliminarPaciente('${p._id}')">Eliminar</button>
      `;
      div.querySelector('div').onclick = () => cargarPaciente(p);
      contenedor.appendChild(div);
    });
  }
  document.getElementById('modalPacientes').style.display = 'flex';
}

// MODIFICADO API: La función eliminarPaciente ahora llama a la API
async function eliminarPaciente(id) {
  if (confirm('¿Está seguro de eliminar este paciente?')) {
    await eliminarPacienteDeAPI(id);
    mostrarListaPacientes(); // Refrescar la lista en el modal
    mostrarNotificacion('Paciente eliminado correctamente');
  }
}

function cerrarModalPacientes() {
  document.getElementById('modalPacientes').style.display = 'none';
}

function cargarPaciente(paciente) {
  document.getElementById('nombre').value = paciente.nombre;
  document.getElementById('correo').value = paciente.correo;
  document.getElementById('celular').value = paciente.celular;
  document.getElementById('edad').value = paciente.edad;
  document.getElementById('doctor').value = paciente.doctor;
  document.getElementById('fecha').value = paciente.fecha;
  tratamientos = paciente.tratamientos || [];
  renderizarTratamientos();
  dibujarOdontograma();
  if (paciente.historiaClinica) {
    historiaClinica = { ...paciente.historiaClinica };
  } else {
    historiaClinica = { antecedentes: '', motivo: '', diagnostico: '', evolucion: [], radiografias: [] };
  }
  pacienteActualId = paciente._id;
  cerrarModalPacientes();
  mostrarNotificacion('Paciente cargado correctamente');
}

function nuevoPaciente() {
  if (tratamientos.length > 0) {
    if (!confirm('¿Está seguro de crear un nuevo paciente? Se perderán los cambios no guardados.')) return;
  }
  document.querySelectorAll('input').forEach(inp => inp.value = '');
  tratamientos = [];
  descuentoPorcentaje = 0;
  document.getElementById('descuento-porcentaje').value = '';
  historiaClinica = { antecedentes: '', motivo: '', diagnostico: '', evolucion: [], radiografias: [] };
  pacienteActualId = null;
  renderizarTratamientos();
  dibujarOdontograma();
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fecha').value = hoy;
  mostrarNotificacion('Listo para agregar un nuevo paciente');
}

function limpiarOdontograma() {
  if (confirm('¿Está seguro de limpiar el odontograma?')) {
    tratamientos = [];
    descuentoPorcentaje = 0;
    document.getElementById('descuento-porcentaje').value = '';
    renderizarTratamientos();
    dibujarOdontograma();
    mostrarNotificacion('Odontograma limpiado correctamente');
  }
}

function aplicarDescuento() {
  const input = document.getElementById('descuento-porcentaje');
  const valor = parseFloat(input.value);
  if (isNaN(valor) || valor < 0 || valor > 100) {
    mostrarNotificacion('Por favor ingrese un porcentaje válido (0-100)', 'error');
    return;
  }
  descuentoPorcentaje = valor;
  renderizarTratamientos();
}

function abrirHistoriaClinica() {
  renderizarEvolucion();
  document.getElementById('modalHistoria').style.display = 'flex';
}

function cerrarHistoriaClinica() {
  guardarHistoriaAutomaticamente();
  document.getElementById('modalHistoria').style.display = 'none';
}

function guardarHistoriaAutomaticamente() {
  const nombre = document.getElementById('nombre').value.trim();
  if (!nombre) return;
  const index = pacientes.findIndex(p => p._id === pacienteActualId);
  if (index !== -1) {
    pacientes[index].historiaClinica = {
      ...historiaClinica,
      antecedentes: document.getElementById('antecedentes').value || '',
      diagnostico: document.getElementById('diagnostico').value || ''
    };
    guardarPacienteEnAPI(pacientes[index]);
  }
}

function guardarHistoria() {
  guardarHistoriaAutomaticamente();
  mostrarNotificacion('Evolución guardada correctamente');
}

function abrirRadiografias() {
  renderizarRadiografias();
  document.getElementById('modalRadiografias').style.display = 'flex';
}

function cerrarRadiografias() {
  document.getElementById('modalRadiografias').style.display = 'none';
}

function abrirModalEvolucion() {
  document.getElementById('fecha-evolucion').value = new Date().toISOString().split('T')[0];
  document.getElementById('tratamiento-evolucion').value = '';
  document.getElementById('diente-evolucion').value = '';
  document.getElementById('costo-evolucion').value = '';
  document.getElementById('abono-evolucion').value = '';
  document.getElementById('modalEvolucion').style.display = 'flex';
}

function cerrarModalEvolucion() {
  document.getElementById('modalEvolucion').style.display = 'none';
}

function guardarEvolucion() {
  const evolucion = {
    tipo: 'tratamiento',
    fecha: document.getElementById('fecha-evolucion').value,
    tratamiento: document.getElementById('tratamiento-evolucion').value,
    diente: document.getElementById('diente-evolucion').value,
    costo: parseFloat(document.getElementById('costo-evolucion').value) || 0,
    abono: parseFloat(document.getElementById('abono-evolucion').value) || 0
  };
  if (!evolucion.tratamiento) {
    mostrarNotificacion('Por favor ingrese el tratamiento', 'error');
    return;
  }
  historiaClinica.evolucion.push(evolucion);
  renderizarEvolucion();
  cerrarModalEvolucion();
  mostrarNotificacion('Evolución registrada correctamente');
  guardarHistoriaAutomaticamente();
}

function renderizarEvolucion() {
  const tbody = document.getElementById('cuerpo-evolucion');
  if (!tbody) return;
  tbody.innerHTML = '';
  let saldoAcumulado = 0;
  historiaClinica.evolucion.forEach((e, i) => {
    if (e.tipo === 'abono') {
      saldoAcumulado -= Number(e.monto || 0);
    } else {
      saldoAcumulado += (Number(e.costo || 0) - Number(e.abono || 0));
    }
    const tr = document.createElement('tr');
    const saldoFormateado = `$${Math.abs(saldoAcumulado).toFixed(2)} ${saldoAcumulado > 0 ? 'adeudo' : 'a favor'}`;
    const fechaFormateada = formatearFechaDDMMYYYY(e.fecha);
    const fechaEditable = `
      <span class="fecha-evol">${fechaFormateada}</span>
      <button class="btn-editar btn-editar-fecha" 
              onclick="editarFechaEvolucion(${i})">✏️</button>
    `;
    if (e.tipo === 'abono') {
      tr.innerHTML = `
        <td>${fechaEditable}</td>
        <td>Abono${e.nota ? ': ' + e.nota : ''}</td>
        <td>—</td>
        <td>—</td>
        <td>$${Number(e.monto || 0).toFixed(2)}</td>
        <td style="color: ${saldoAcumulado > 0 ? '#e74c3c' : '#27ae60'}">${saldoFormateado}</td>
        <td><button onclick="eliminarEvolucion(${i})">Eliminar</button></td>
      `;
    } else {
      tr.innerHTML = `
        <td>${fechaEditable}</td>
        <td>${e.tratamiento}</td>
        <td>${e.diente}</td>
        <td>$${Number(e.costo || 0).toFixed(2)}</td>
        <td>$${Number(e.abono || 0).toFixed(2)}</td>
        <td style="color: ${saldoAcumulado > 0 ? '#e74c3c' : '#27ae60'}">${saldoFormateado}</td>
        <td><button onclick="eliminarEvolucion(${i})">Eliminar</button></td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function editarFechaEvolucion(index) {
  const evol = historiaClinica.evolucion[index];
  if (!evol) return;
  const fechaActual = formatearFechaDDMMYYYY(evol.fecha);
  const nuevaFechaStr = prompt('Nueva fecha (DD/MM/AAAA):', fechaActual);
  if (nuevaFechaStr !== null) {
    const nuevaFechaISO = parsearFechaDDMMYYYY(nuevaFechaStr);
    if (nuevaFechaISO) {
      evol.fecha = nuevaFechaISO;
      renderizarEvolucion();
      guardarHistoriaAutomaticamente();
      mostrarNotificacion('Fecha actualizada correctamente');
    } else {
      mostrarNotificacion('Formato de fecha inválido. Use DD/MM/AAAA', 'error');
    }
  }
}

function eliminarEvolucion(index) {
  historiaClinica.evolucion.splice(index, 1);
  renderizarEvolucion();
  guardarHistoriaAutomaticamente();
}

function agregarATratamientoAHistoria(index) {
  const t = tratamientos[index];
  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.id !== 'modalHistoria') modal.style.display = 'none';
  });
  document.getElementById('fecha-evolucion').value = new Date().toISOString().split('T')[0];
  document.getElementById('tratamiento-evolucion').value = t.tratamiento;
  document.getElementById('diente-evolucion').value = t.diente;
  document.getElementById('costo-evolucion').value = t.precio;
  document.getElementById('abono-evolucion').value = '0';
  document.getElementById('modalEvolucion').style.display = 'flex';
}

function abrirModalAbono() {
  let modal = document.getElementById('modalAbono');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalAbono';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Registrar Abono</h3>
        <label>Fecha:</label>
        <input type="date" id="fecha-abono">
        <label>Monto:</label>
        <input type="number" id="monto-abono" placeholder="0.00" step="0.01" min="0">
        <label>Nota:</label>
        <input type="text" id="nota-abono" placeholder="Nota opcional">
        <br><br>
        <button class="btn-guardar" onclick="guardarAbono()">Guardar</button>
        <button class="btn-cerrar" onclick="cerrarModalAbono()">Cancelar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('fecha-abono').value = new Date().toISOString().split('T')[0];
  document.getElementById('monto-abono').value = '';
  document.getElementById('nota-abono').value = '';
  modal.style.display = 'flex';
}

function cerrarModalAbono() {
  const modal = document.getElementById('modalAbono');
  if (modal) modal.style.display = 'none';
}

function guardarAbono() {
  const monto = parseFloat(document.getElementById('monto-abono').value);
  if (isNaN(monto) || monto <= 0) {
    mostrarNotificacion('Por favor ingrese un monto válido', 'error');
    return;
  }
  const abono = {
    tipo: 'abono',
    fecha: document.getElementById('fecha-abono').value,
    monto: monto,
    nota: document.getElementById('nota-abono').value.trim()
  };
  historiaClinica.evolucion.push(abono);
  renderizarEvolucion();
  cerrarModalAbono();
  mostrarNotificacion('Abono registrado correctamente');
  guardarHistoriaAutomaticamente();
}

function subirRadiografias() {
  const input = document.getElementById('archivo-radiografia');
  const files = input.files;
  if (!files || files.length === 0) {
    mostrarNotificacion('Por favor seleccione al menos un archivo', 'error');
    return;
  }
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const radiografia = {
        nombre: file.name,
        data: e.target.result,
        fecha: new Date().toISOString().split('T')[0],
        tipo: file.type || 'application/octet-stream'
      };
      historiaClinica.radiografias.push(radiografia);
      renderizarRadiografias();
      guardarHistoriaAutomaticamente();
    };
    reader.readAsDataURL(file);
  }
  input.value = '';
}

function renderizarRadiografias() {
  const galeria = document.getElementById('galeria-radiografias');
  galeria.innerHTML = '';
  historiaClinica.radiografias.forEach((rad, i) => {
    const div = document.createElement('div');
    div.className = 'miniatura';
    const safeName = sanitizarNombre(rad.nombre);
    if (rad.data && rad.data.startsWith('data:image/')) {
      div.innerHTML = `
        <button class="eliminar-radio" onclick="eliminarRadiografia(${i})">🗑️</button>
        <img src="${rad.data}" alt="${rad.nombre}" onclick="ampliarRadiografia('${rad.data}', 'image')">
        <div class="nombre">${rad.nombre}<br><small>${rad.fecha}</small></div>
      `;
    } else if (rad.data && rad.data.startsWith('data:application/pdf')) {
      div.innerHTML = `
        <button class="eliminar-radio" onclick="eliminarRadiografia(${i})">🗑️</button>
        <div style="height:120px; display:flex; align-items:center; justify-content:center; background:#f1f1f1; font-size:20px; cursor:pointer;" onclick="ampliarRadiografia('${rad.data}', 'pdf')">
          📄 ${rad.nombre}
        </div>
        <div class="nombre">${rad.nombre}<br><small>${rad.fecha}</small></div>
      `;
    } else if (rad.data) {
      div.innerHTML = `
        <button class="eliminar-radio" onclick="eliminarRadiografia(${i})">🗑️</button>
        <div style="height:120px; display:flex; align-items:center; justify-content:center; background:#f1f1f1; font-size:16px; cursor:pointer; padding:12px;">
          <div>
            <div style="font-size:28px; margin-bottom:6px;">📎</div>
            <div style="font-size:13px; max-width:120px; word-wrap:break-word;">${rad.nombre}</div>
            <div style="margin-top:6px;"><button onclick="descargarArchivoRadiografia(${i}); event.stopPropagation();">⬇️ Descargar</button></div>
          </div>
        </div>
        <div class="nombre">${rad.nombre}<br><small>${rad.fecha}</small></div>
      `;
    } else {
      div.innerHTML = `<div class="nombre">Archivo no disponible</div>`;
    }
    galeria.appendChild(div);
  });
}

function eliminarRadiografia(index) {
  if (confirm('¿Está seguro de eliminar esta radiografía?')) {
    historiaClinica.radiografias.splice(index, 1);
    renderizarRadiografias();
    mostrarNotificacion('Radiografía eliminada correctamente');
    guardarHistoriaAutomaticamente();
  }
}

function ampliarRadiografia(src, tipo) {
  let modal = document.getElementById('modalAmpliarRadio');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalAmpliarRadio';
    modal.innerHTML = `
      <span class="close" onclick="document.getElementById('modalAmpliarRadio').style.display='none'">&times;</span>
      <img id="imagenAmpliada" class="imagen-ampliada" style="display:none;">
      <iframe id="pdfAmpliado" style="width:90%; height:90%; margin-top:5%; display:none;"></iframe>
      <a id="descargaArchivo" style="display:none; color:white; text-align:center; margin-top:20px; font-size:18px;" download>⬇️ Descargar archivo</a>
    `;
    document.body.appendChild(modal);
  }
  const img = document.getElementById('imagenAmpliada');
  const iframe = document.getElementById('pdfAmpliado');
  const descarga = document.getElementById('descargaArchivo');
  if (tipo === 'image') {
    img.src = src;
    img.style.display = 'block';
    iframe.style.display = 'none';
    descarga.style.display = 'none';
  } else if (tipo === 'pdf') {
    iframe.src = src;
    iframe.style.display = 'block';
    img.style.display = 'none';
    descarga.style.display = 'none';
  } else {
    img.style.display = 'none';
    iframe.style.display = 'none';
    descarga.href = src;
    descarga.style.display = 'block';
    descarga.textContent = '⬇️ Descargar archivo';
  }
  modal.style.display = 'flex';
}

function descargarArchivoRadiografia(index) {
  const rad = historiaClinica.radiografias[index];
  if (!rad || !rad.data) return;
  const link = document.createElement('a');
  link.href = rad.data;
  link.download = sanitizarNombre(rad.nombre);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function exportarPDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text(quitarAcentos('Presupuesto Dental'), pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Paciente: ${limpiarTextoExport(document.getElementById('nombre').value) || 'N/A'}`, 20, 36);
  doc.text(`Doctor: ${limpiarTextoExport(document.getElementById('doctor').value) || 'N/A'}`, 20, 44);
  doc.text(`Fecha: ${limpiarTextoExport(document.getElementById('fecha').value) || new Date().toLocaleDateString('es-MX')}`, 20, 52);
  // Capturar odontograma como imagen
  let odontoY = 62;
  try {
    const canvas = await html2canvas(document.querySelector('.odontograma-completo'), {
      scale: 0.7,
      useCORS: true,
      allowTaint: true
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, odontoY, imgWidth, imgHeight);
    odontoY += imgHeight + 10;
  } catch (e) {
    console.warn('No se pudo capturar el odontograma:', e);
    odontoY = 62;
  }
  if (tratamientos.length > 0) {
    const data = tratamientos.map(t => [String(t.diente), limpiarTextoExport(t.tratamiento), `$${Number(t.precio || 0).toFixed(2)}`]);
    doc.autoTable({
      startY: odontoY,
      head: [['Diente', 'Tratamiento', 'Precio']],
      body: data,
      theme: 'grid',
      styles: { fontSize: 14 },
      headStyles: { fillColor: [52, 152, 219] }
    });
    let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : odontoY + 60;
    doc.text(`Total: $${document.getElementById('total-monto').textContent}`, 20, finalY);
    if (descuentoPorcentaje > 0) {
      finalY += 10;
      doc.text(`Total con descuento: $${totalConDescuento.toFixed(2)}`, 20, finalY);
    }
  } else {
    doc.text('No hay tratamientos registrados', 20, odontoY + 10);
  }
  const filename = `presupuesto_${sanitizarNombre(document.getElementById('nombre').value || 'paciente')}.pdf`;
  doc.save(filename);
}

function exportarEvolucionPDF() {
  if (!historiaClinica.evolucion || historiaClinica.evolucion.length === 0) {
    mostrarNotificacion('No hay evolución registrada', 'error');
    return;
  }
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text(quitarAcentos('Evolución Clínica'), pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Paciente: ${limpiarTextoExport(document.getElementById('nombre').value) || 'N/A'}`, 20, 34);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, 42);
  let saldoAcumulado = 0;
  const data = historiaClinica.evolucion.map(e => {
    if (e.tipo === 'abono') {
      saldoAcumulado -= Number(e.monto || 0);
      return [
        formatearFechaDDMMYYYY(e.fecha) || '',
        `Abono${e.nota ? ': ' + e.nota : ''}`,
        "—",
        "—",
        `$${Number(e.monto || 0).toFixed(2)}`,
        `$${Math.abs(saldoAcumulado).toFixed(2)} ${saldoAcumulado > 0 ? 'adeudo' : 'a favor'}`
      ];
    } else {
      saldoAcumulado += Number(e.costo || 0) - Number(e.abono || 0);
      return [
        formatearFechaDDMMYYYY(e.fecha) || '',
        e.tratamiento || '',
        e.diente || '',
        `$${Number(e.costo || 0).toFixed(2)}`,
        `$${Number(e.abono || 0).toFixed(2)}`,
        `$${Math.abs(saldoAcumulado).toFixed(2)} ${saldoAcumulado > 0 ? 'adeudo' : 'a favor'}`
      ];
    }
  });
  doc.autoTable({
    startY: 52,
    head: [['Fecha', 'Tratamiento', 'Diente', 'Costo', 'Abono', 'Saldo']],
    body: data,
    theme: 'grid',
    styles: { fontSize: 14 },
    headStyles: { fillColor: [155, 89, 182] }
  });
  doc.save(`evolucion_${sanitizarNombre(document.getElementById('nombre').value || 'paciente')}.pdf`);
}

async function exportarWord() {
  if (!window.docx) {
    mostrarNotificacion('docx library not loaded', 'error');
    return;
  }
  if (tratamientos.length === 0) {
    mostrarNotificacion('No hay tratamientos registrados', 'error');
    return;
  }
  const { Document, Paragraph, Table, TableRow, TableCell, WidthType, ImageRun } = docx;
  // Capturar imagen del odontograma
  let imageBase64 = null;
  try {
    const canvas = await html2canvas(document.querySelector('.odontograma-completo'), { scale: 0.5 });
    imageBase64 = canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('No se pudo capturar el odontograma para Word');
  }
  const nombrePaciente = limpiarTextoExport(document.getElementById('nombre').value) || 'PACIENTE';
  const nombreDoctor = limpiarTextoExport(document.getElementById('doctor').value) || 'Doctor';
  const fecha = limpiarTextoExport(document.getElementById('fecha').value) || new Date().toLocaleDateString('es-MX');
  const children = [
    new Paragraph({
      text: quitarAcentos('Presupuesto Dental'),
      heading: "Heading1",
      alignment: "center"
    }),
    new Paragraph(`Paciente: ${nombrePaciente}`),
    new Paragraph(`Doctor: ${nombreDoctor}`),
    new Paragraph(`Fecha: ${fecha}`),
    new Paragraph("")
  ];
  if (imageBase64) {
    const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: {
              width: 450,
              height: (imageBuffer.length % 300) + 150 // aproximado
            }
          })
        ],
        alignment: "center"
      }),
      new Paragraph("")
    );
  }
  const tableData = [
    ["Diente", "Tratamiento", "Precio"]
  ];
  tratamientos.forEach(t => {
    tableData.push([String(t.diente), t.tratamiento, `$${Number(t.precio || 0).toFixed(2)}`]);
  });
  tableData.push(["", "Total:", `$${document.getElementById('total-monto').textContent}`]);
  if (descuentoPorcentaje > 0) {
    tableData.push(["", "Total con descuento:", `$${totalConDescuento.toFixed(2)}`]);
  }
  children.push(
    new Table({
      rows: tableData.map(row => new TableRow({
        children: row.map(cellText => new TableCell({
          children: [new Paragraph(cellText)]
        }))
      })),
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      }
    })
  );
  const doc = new Document({
    sections: [{
      children: children
    }]
  });
  docx.Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presupuesto_${sanitizarNombre(nombrePaciente)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function exportarEvolucionWord() {
  if (!window.docx) {
    mostrarNotificacion('docx library not loaded', 'error');
    return;
  }
  if (!historiaClinica.evolucion || historiaClinica.evolucion.length === 0) {
    mostrarNotificacion('No hay evolución registrada', 'error');
    return;
  }
  const { Document, Paragraph, Table, TableRow, TableCell, WidthType } = docx;
  const nombrePaciente = limpiarTextoExport(document.getElementById('nombre').value) || 'PACIENTE';
  const children = [
    new Paragraph({
      text: quitarAcentos('Evolución Clínica'),
      heading: "Heading1",
      alignment: "center"
    }),
    new Paragraph(`Paciente: ${nombrePaciente}`),
    new Paragraph(`Fecha: ${new Date().toLocaleDateString('es-MX')}`),
    new Paragraph("")
  ];
  const tableData = [
    ["Fecha", "Tratamiento", "Diente", "Costo", "Abono", "Saldo"]
  ];
  let saldoAcumulado = 0;
  historiaClinica.evolucion.forEach(e => {
    if (e.tipo === 'abono') {
      saldoAcumulado -= Number(e.monto || 0);
      tableData.push([
        formatearFechaDDMMYYYY(e.fecha) || '',
        `Abono${e.nota ? ': ' + e.nota : ''}`,
        "—",
        "—",
        `$${Number(e.monto || 0).toFixed(2)}`,
        `$${Math.abs(saldoAcumulado).toFixed(2)} ${saldoAcumulado > 0 ? 'adeudo' : 'a favor'}`
      ]);
    } else {
      saldoAcumulado += Number(e.costo || 0) - Number(e.abono || 0);
      tableData.push([
        formatearFechaDDMMYYYY(e.fecha) || '',
        e.tratamiento || '',
        e.diente || '',
        `$${Number(e.costo || 0).toFixed(2)}`,
        `$${Number(e.abono || 0).toFixed(2)}`,
        `$${Math.abs(saldoAcumulado).toFixed(2)} ${saldoAcumulado > 0 ? 'adeudo' : 'a favor'}`
      ]);
    }
  });
  children.push(
    new Table({
      rows: tableData.map(row => new TableRow({
        children: row.map(cellText => new TableCell({
          children: [new Paragraph(cellText)]
        }))
      })),
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      }
    })
  );
  const doc = new Document({
    sections: [{
      children: children
    }]
  });
  docx.Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolucion_${sanitizarNombre(nombrePaciente)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function mostrarAdeudos() {
  let modal = document.getElementById('modalAdeudos');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalAdeudos';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Resumen de Adeudos</h3>
        <div id="contenido-adeudos">
          <p>Cargando...</p>
        </div>
        <button class="btn-cerrar" onclick="cerrarModalAdeudos()">Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // Calcular adeudos
  let totalAdeudo = 0;
  const pacientesConAdeudo = [];
  pacientes.forEach(p => {
    let saldoPaciente = 0;
    if (p.historiaClinica && p.historiaClinica.evolucion) {
      p.historiaClinica.evolucion.forEach(e => {
        if (e.tipo === 'abono') {
          saldoPaciente -= Number(e.monto || 0);
        } else {
          saldoPaciente += (Number(e.costo || 0) - Number(e.abono || 0));
        }
      });
    }
    if (saldoPaciente > 0) {
      totalAdeudo += saldoPaciente;
      pacientesConAdeudo.push({
        nombre: p.nombre,
        saldo: saldoPaciente
      });
    }
  });
  // Mostrar resultados
  const contenido = document.getElementById('contenido-adeudos');
  contenido.innerHTML = `
    <h4>Total de adeudos: $${totalAdeudo.toFixed(2)}</h4>
    <table style="width:100%; margin-top:15px;">
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Saldo</th>
        </tr>
      </thead>
      <tbody>
        ${pacientesConAdeudo.map(p => `
          <tr>
            <td>${p.nombre}</td>
            <td>$${p.saldo.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${pacientesConAdeudo.length === 0 ? '<p>No hay pacientes con adeudos</p>' : ''}
  `;
  modal.style.display = 'flex';
}

function cerrarModalAdeudos() {
  document.getElementById('modalAdeudos').style.display = 'none';
}

function descargarRespaldoExcel() {
  if (!window.XLSX) {
    mostrarNotificación('XLSX library not loaded', 'error');
    return;
  }
  // Preparar datos para Excel
  const datosParaExcel = pacientes.map(p => {
    const fila = {
      'ID': p._id || '',
      'Nombre': p.nombre || '',
      'Correo': p.correo || '',
      'Celular': p.celular || '',
      'Edad': p.edad || '',
      'Doctor': p.doctor || '',
      'Fecha': p.fecha || '',
      'Antecedentes': (p.historiaClinica && p.historiaClinica.antecedentes) || '',
      'Motivo': (p.historiaClinica && p.historiaClinica.motivo) || '',
      'Diagnóstico': (p.historiaClinica && p.historiaClinica.diagnostico) || ''
    };
    // Agregar tratamientos como columnas (máximo 10 tratamientos)
    if (p.tratamientos && p.tratamientos.length > 0) {
      p.tratamientos.forEach((t, i) => {
        if (i < 10) {
          fila[`Tratamiento ${i+1}`] = `${t.diente}: ${t.tratamiento} ($${t.precio})`;
        }
      });
    }
    return fila;
  });
  // Crear libro de Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosParaExcel);
  XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
  // Descargar archivo
  XLSX.writeFile(wb, `respaldo_pacientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  mostrarNotificacion('Respaldo descargado correctamente');
}

function abrirModalCargaExcel() {
  document.getElementById('modalCargaExcel').style.display = 'flex';
}

function cerrarModalCargaExcel() {
  document.getElementById('modalCargaExcel').style.display = 'none';
}

function cargarPacientesDesdeExcel() {
  const file = document.getElementById('archivo-excel').files[0];
  if (!file) {
    mostrarNotificacion('Por favor seleccione un archivo Excel', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      let cargados = 0;
      let errores = 0;
      
      jsonData.forEach(async (row, index) => {
        try {
          const pacienteData = {
            nombre: row.nombre || row.Nombre || '',
            correo: row.correo || row.Correo || '',
            celular: row.celular || row.Celular || '',
            edad: row.edad || row.Edad || '',
            doctor: row.doctor || row.Doctor || '',
            fecha: row.fecha || row.Fecha || '',
            tratamientos: [],
            historiaClinica: {
              antecedentes: row.antecedentes || row.Antecedentes || '',
              motivo: row.motivo || row.Motivo || '',
              diagnostico: row.diagnostico || row.Diagnóstico || '',
              evolucion: [],
              radiografias: []
            }
          };
          
          if (pacienteData.nombre) {
            await guardarPacienteEnAPI(pacienteData);
            cargados++;
          } else {
            errores++;
          }
        } catch (error) {
          console.error(`Error procesando fila ${index}:`, error);
          errores++;
        }
        
        // Si es la última fila, mostrar resultados
        if (index === jsonData.length - 1) {
          setTimeout(() => {
            mostrarNotificación(`Proceso completado. ${cargados} pacientes cargados, ${errores} errores.`);
            cerrarModalCargaExcel();
            cargarPacientesDesdeAPI();
          }, 1000);
        }
      });
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      mostrarNotificación('Error al procesar el archivo. Verifique el formato.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function toggleModoOscuro() {
  document.body.classList.toggle('modo-oscuro');
  const esModoOscuro = document.body.classList.contains('modo-oscuro');
  localStorage.setItem('modoOscuro', esModoOscuro);
  document.getElementById('btn-modo-oscuro').textContent = esModoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion';
  notificacion.textContent = mensaje;
  if (tipo === 'error') {
    notificacion.style.background = '#e74c3c';
  }
  document.body.appendChild(notificacion);
  setTimeout(() => {
    notificacion.remove();
  }, 3000);
}

// Funciones de traducción (simplificadas para este ejemplo)
function getTexto(clave) {
  const traducciones = {
    'btnAgregarTratamientoGeneral': 'Agregar Tratamiento General',
    'labelTratamientoGeneral': 'Tratamiento:',
    'placeholderTratamientoGeneral': 'Nombre del tratamiento',
    'labelPrecioGeneral': 'Precio:',
    'btnAgregarTratamiento': 'Agregar',
    'btnCancelar': 'Cancelar',
    'errorNombreTratamiento': 'Por favor ingrese un nombre para el tratamiento',
    'errorPrecioValido': 'Por favor ingrese un precio válido',
    'tratamientoGeneralAgregado': 'Tratamiento general agregado correctamente',
    'btnEliminar': 'Eliminar',
    'accionEvolucion': 'A Evolución',
    'gestionTratamientos': 'Gestionar Tratamientos',
    'errorCamposCompletos': 'Por favor complete todos los campos',
    'promptNuevoNombre': 'Nuevo nombre:',
    'promptNuevoPrecio': 'Nuevo precio:',
    'confirmEliminarTratamiento': '¿Está seguro de eliminar este tratamiento?',
    'errorNombrePaciente': 'Por favor ingrese el nombre del paciente',
    'pacienteActualizado': 'Paciente actualizado correctamente',
    'pacienteGuardado': 'Paciente guardado correctamente',
    'noPacientes': 'No hay pacientes registrados',
    'confirmEliminarPaciente': '¿Está seguro de eliminar este paciente?',
    'pacienteEliminado': 'Paciente eliminado correctamente',
    'pacienteCargado': 'Paciente cargado correctamente',
    'confirmNuevoPaciente': '¿Está seguro de crear un nuevo paciente? Se perderán los cambios no guardados.',
    'listoNuevoPaciente': 'Listo para agregar un nuevo paciente',
    'confirmLimpiarOdontograma': '¿Está seguro de limpiar el odontograma?',
    'odontogramaLimpiado': 'Odontograma limpiado correctamente',
    'errorPorcentajeValido': 'Por favor ingrese un porcentaje válido (0-100)',
    'totalConDescuento': 'Total con descuento',
    'evolucionGuardada': 'Evolución guardada correctamente',
    'errorTratamiento': 'Por favor ingrese el tratamiento',
    'evolucionRegistrada': 'Evolución registrada correctamente',
    'errorNoEvolucion': 'No hay evolución registrada',
    'errorSeleccionarArchivo': 'Por favor seleccione al menos un archivo',
    'confirmEliminarRadiografia': '¿Está seguro de eliminar esta radiografía?',
    'radiografiaEliminada': 'Radiografía eliminada correctamente',
    'btnDescargar': 'Descargar',
    'btnDescargarArchivo': 'Descargar archivo',
    'tituloModalAbono': 'Registrar Abono',
    'labelFechaAbono': 'Fecha:',
    'labelMontoAbono': 'Monto:',
    'placeholderMontoAbono': '0.00',
    'labelNotaAbono': 'Nota:',
    'placeholderNotaAbono': 'Nota opcional',
    'btnGuardarAbono': 'Guardar',
    'errorMontoValido': 'Por favor ingrese un monto válido',
    'abonoRegistrado': 'Abono registrado correctamente',
    'tituloPresupuesto': 'Presupuesto Dental',
    'labelDoctor': 'Doctor',
    'thDiente': 'Diente',
    'thTratamiento': 'Tratamiento',
    'thPrecio': 'Precio',
    'total': 'Total',
    'noTratamientos': 'No hay tratamientos registrados',
    'errorNoTratamientos': 'No hay tratamientos registrados',
    'tituloEvolucionPDF': 'Evolución Clínica',
    'thFechaEvol': 'Fecha',
    'thTratamientoEvol': 'Tratamiento',
    'thDienteEvol': 'Diente',
    'thCostoEvol': 'Costo',
    'thAbonoEvol': 'Abono',
    'thSaldoEvol': 'Saldo',
    'adeudo': 'adeudo',
    'aFavor': 'a favor',
    'promptNuevaFecha': 'Nueva fecha (DD/MM/AAAA):',
    'fechaActualizada': 'Fecha actualizada correctamente',
    'errorFormatoFecha': 'Formato de fecha inválido. Use DD/MM/AAAA'
  };
  return traducciones[clave] || clave;
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar modo oscuro
  const esModoOscuro = localStorage.getItem('modoOscuro') === 'true';
  if (esModoOscuro) {
    document.body.classList.add('modo-oscuro');
    document.getElementById('btn-modo-oscuro').textContent = '☀️ Modo Claro';
  }
  
  // Cargar pacientes desde la API
  await cargarPacientesDesdeAPI();
  
  // Inicializar odontograma
  dibujarOdontograma();
  
  // Establecer fecha actual
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fecha').value = hoy;
});

