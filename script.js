/* ================= CONFIGURACIÓN ================= */
const WA_NUMBER = "5217441371570";
const BANCO     = "Santander";
const TITULAR   = "Wendy Laura Cruz Cruz";
const CLABE     = "0141 8055 7944 8836 08";
const CUENTA    = "5579 0700 7210 0376";
const LOGO_PATH = "img/logo.png";
const DIAS_MINIMOS = 2;

/* ================= CATÁLOGO DE PASTELES ================= */
const IMG_PASTELES = {
  'Chicas Superpoderosas': 'img/pastel_chicas_superpoderosas.jpg',
  'Dinosaurios':           'img/pastel_dinosaurios.jpg',
  'Modelo':                'img/pastel_modelo.jpg',
  'One Piece':             'img/pastel_onepiece.jpg',
  'Paw Patrol':            'img/pastel_pawpatrol.jpg',
  'XV Años':               'img/pastel_xv.jpg',
  'Rosca':                 'img/rosca.jpg',
  'Boda':                  'img/pastel_boda.jpg',
  'Dragon Ball Z':         'img/pastel_dragonballz.jpg'
};

/* ================= ESTADO ================= */
let folio = "PEDIDO-XXX-XXX-XX-XX-XXXX";
let pastelSeleccionado = null;
let precioSeleccionado = 1500;
let anticipoSeleccionado = 900;
let restanteSeleccionado = 600;
let cotizacionImagen = null;
let modalCallback = null;
let tipoModalActual = 'pedido'; // 'pedido' o 'cotizacion'
let mensajeWhatsAppPendiente = '';
let archivoPDFPendiente = null; // Guarda el último PDF generado (objeto jsPDF)
let tipoPDFPendiente = 'pedido'; // 'pedido' o 'cotizacion'

/* ================= HELPERS DE FOLIO ================= */
function limpiarTexto(txt){
  return String(txt || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

/* Solo el PRIMER nombre: "Victor Daniel" → "VICTOR" */
function primerNombre(nombre){
  const limpio = String(nombre || '').trim();
  const partes = limpio.split(/\s+/);
  return limpiarTexto(partes[0]) || 'CLIENTE';
}

function formatearFechaFolio(fechaISO){
  const d = fechaISO ? new Date(fechaISO + 'T00:00:00') : new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function generarFolioPedido(nombre, pastel, fechaISO){
  const n = primerNombre(nombre);
  const p = limpiarTexto(pastel) || 'PASTEL';
  const f = formatearFechaFolio(fechaISO);
  return `PEDIDO-${n}-${p}-${f}`;
}

function generarFolioCotizacion(nombre, sabor, fechaISO){
  const n = primerNombre(nombre);
  const s = limpiarTexto(sabor) || 'PASTEL';
  const f = formatearFechaFolio(fechaISO);
  return `COTIZACION-${n}-${s}-${f}`;
}

/* ================= SELECCIONAR PASTEL ================= */
function seleccionarPastel(nombre, precio){
  pastelSeleccionado = nombre;
  precioSeleccionado = precio;
  anticipoSeleccionado = Math.round(precio * 0.6);
  restanteSeleccionado = precio - anticipoSeleccionado;

  const el = document.getElementById('f-pastel');
  if(el) el.value = nombre;

  document.querySelectorAll('.product-pick').forEach(p => {
    p.classList.toggle('selected', p.dataset.pastel === nombre);
  });

  goStep(2);
}

function validarPaso1(){
  if(!pastelSeleccionado){
    alert('Por favor selecciona un pastel para continuar.');
    return;
  }
  goStep(2);
}

/* ================= NAVEGACIÓN ================= */
function goStep(n){
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`.step[data-step="${n}"]`);
  if(target) target.classList.add('active');

  document.querySelectorAll('.step-dot').forEach(d => {
    const i = Number(d.dataset.bar);
    d.classList.toggle('active', i === n);
    d.classList.toggle('done', i < n);
  });

  if(n === 3) pintarResumen();
  if(n === 4) pintarComprobante();
  if(n === 5) pintarConcepto();

  const w = document.querySelector('.wizard');
  if(w) window.scrollTo({ top: w.offsetTop - 90, behavior: 'smooth' });
}

/* ================= VALIDACIÓN ================= */
function validarPaso2(){
  const campos = ['f-sabor','f-tamano','f-diseno','f-fecha','f-hora','f-nombre'];
  let ok = true;

  campos.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    const vacio = !el.value.trim();
    el.classList.toggle('err', vacio);
    if(vacio && ok){ el.focus(); ok = false; }
  });

  if(!ok){
    alert('Por favor completa todos los campos obligatorios (*)');
    return;
  }

  const fechaStr = document.getElementById('f-fecha').value;
  const fecha = new Date(fechaStr + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const diff = Math.ceil((fecha - hoy) / 86400000);

  if(diff < DIAS_MINIMOS){
    alert(`El pedido requiere mínimo ${DIAS_MINIMOS} días de anticipación. Elige una fecha posterior.`);
    document.getElementById('f-fecha').classList.add('err');
    return;
  }

  folio = generarFolioPedido(val('f-nombre'), pastelSeleccionado, fechaStr);

  goStep(3);
}

/* ================= HELPERS ================= */
const val = id => {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
};

function formatearFecha(){
  const f = val('f-fecha');
  const h = val('f-hora');
  if(!f) return '—';
  const d = new Date(f + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${dd}/${mm}/${d.getFullYear()} - ${h || '17:00'}`;
}

function setTxt(id, texto){
  const el = document.getElementById(id);
  if(el) el.textContent = texto;
}

function pintarResumen(){
  setTxt('r-pastel', pastelSeleccionado || '—');
  setTxt('r-sabor', val('f-sabor') || '—');
  setTxt('r-tamano', val('f-tamano') || '—');
  setTxt('r-diseno', val('f-diseno') || '—');
  setTxt('r-dedicatoria', val('f-dedicatoria') || 'Sin dedicatoria');
  setTxt('r-nombre', val('f-nombre') || '—');
  setTxt('r-entrega', formatearFecha());
  setTxt('r-total', '$' + precioSeleccionado);
  setTxt('r-anticipo', '$' + anticipoSeleccionado);
  setTxt('r-restante', '$' + restanteSeleccionado);
}

function pintarComprobante(){
  setTxt('folio-display', folio);
}

function pintarConcepto(){
  setTxt('concepto', folio);
  setTxt('monto-anticipo', '$' + anticipoSeleccionado + '.00 MXN');
}

/* ================= COPIAR DATOS ================= */
function copiarDatos(){
  const texto =
`DATOS PARA TRANSFERENCIA
Banco: ${BANCO}
Titular: ${TITULAR}
CLABE: ${CLABE}
Cuenta: ${CUENTA}
Monto: $${anticipoSeleccionado}.00 MXN
Concepto: ${folio}

Pastelería Los Ángeles`;

  const btn = document.getElementById('btnCopy');
  const listo = () => {
    if(btn){
      btn.classList.add('ok');
      btn.innerHTML = '✅ ¡DATOS COPIADOS!';
      setTimeout(() => {
        btn.classList.remove('ok');
        btn.innerHTML = '📋 COPIAR DATOS';
      }, 2200);
    }
  };

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(texto).then(listo).catch(() => fallback(texto, listo));
  } else {
    fallback(texto, listo);
  }
}

function copiarDatosGenerales(){
  const texto =
`DATOS BANCARIOS - PASTELERÍA LOS ÁNGELES
Banco: ${BANCO}
Titular: ${TITULAR}
CLABE: ${CLABE}
Cuenta: ${CUENTA}

Recuerda escribir el concepto (número de pedido) que aparece en tu comprobante PDF.`;

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(texto)
      .then(() => alert('✅ Datos copiados al portapapeles'))
      .catch(() => fallback(texto, () => alert('✅ Datos copiados')));
  } else {
    fallback(texto, () => alert('✅ Datos copiados'));
  }
}

function fallback(texto, cb){
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); cb(); }
  catch(e){ alert('Copia manualmente:\n\n' + texto); }
  document.body.removeChild(ta);
}

/* ================= CARGAR IMAGEN ================= */
function cargarImagen(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const timeout = setTimeout(() => {
      reject(new Error('Timeout cargando: ' + src));
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const esPNG = /\.png$/i.test(src);
        const dataURL = esPNG
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.92);

        resolve({ dataURL, esPNG });
      } catch(e){
        reject(e);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('No se pudo cargar: ' + src));
    };

    img.src = src;
  });
}

function cargarImagenDesdeDataURL(dataURL){
  return new Promise((resolve, reject) => {
    const tmpImg = new Image();
    tmpImg.onload = () => resolve({ width: tmpImg.width, height: tmpImg.height });
    tmpImg.onerror = reject;
    tmpImg.src = dataURL;
  });
}

/* ================= MODAL ================= */
function mostrarModal(opciones){
  const overlay    = document.getElementById('modalOverlay');
  const icon       = document.getElementById('modalIcon');
  const title      = document.getElementById('modalTitle');
  const text       = document.getElementById('modalText');
  const fileNameEl = document.getElementById('modalFileName');
  const instructions = document.getElementById('modalInstructions');
  const btnPrincipal = document.getElementById('modalBtnPrincipal');
  const btnReDescargar = document.getElementById('modalBtnReDescargar');

  if(!overlay) return;

  if(icon) icon.textContent = opciones.icon || '📄';
  if(title) title.textContent = opciones.title || '¡Listo!';
  if(text) text.innerHTML = opciones.text || '';
  if(fileNameEl) fileNameEl.textContent = opciones.fileName || 'archivo.pdf';

  tipoModalActual = opciones.tipo || 'pedido';
  mensajeWhatsAppPendiente = opciones.mensajeWA || '';

  // Ocultar instrucciones si es modal de cotización
  if(instructions){
    instructions.style.display = (opciones.showInstructions === false) ? 'none' : 'grid';
  }

  // Cambiar comportamiento del botón principal según el tipo de modal
  if(btnPrincipal){
    if(tipoModalActual === 'cotizacion'){
      btnPrincipal.innerHTML = `
        <svg class="ico-wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
        📲 ENVIAR COTIZACIÓN POR WHATSAPP
      `;
      btnPrincipal.onclick = abrirWhatsAppDesdeModal;
    } else {
      btnPrincipal.innerHTML = `
        <svg class="ico-wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
        ✅ Ya guardé mi PDF, continuar
      `;
      btnPrincipal.onclick = continuarATransferir;
    }
  }

  // Mostrar/ocultar botón de re-descarga según disponibilidad del PDF
  if(btnReDescargar){
    btnReDescargar.style.display = archivoPDFPendiente ? 'block' : 'none';
  }

  modalCallback = opciones.onWhatsApp || null;

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModal(){
  const overlay = document.getElementById('modalOverlay');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function abrirWhatsAppDesdeModal(){
  cerrarModal();
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensajeWhatsAppPendiente)}`;
  window.open(url, '_blank');
}

function continuarATransferir(){
  cerrarModal();
  setTimeout(() => goStep(5), 300);
}

/* ================= VOLVER A DESCARGAR PDF (PARA SAFARI/iOS) ================= */
function volverADescargarPDF(){
  if(!archivoPDFPendiente){
    alert('No hay PDF disponible para descargar. Intenta generar el pedido o cotización de nuevo.');
    return;
  }

  try {
    let nombreArchivo;

    if(tipoPDFPendiente === 'cotizacion'){
      nombreArchivo = archivoPDFPendiente._nombreArchivo || 'Cotizacion.pdf';
    } else {
      nombreArchivo = folio + '.pdf';
    }

    // Intentar descarga con doc.save()
    archivoPDFPendiente.save(nombreArchivo);

    // Feedback visual en el botón
    const btn = document.getElementById('modalBtnReDescargar');
    if(btn){
      const textoOriginal = btn.innerHTML;
      btn.innerHTML = '✅ ¡PDF descargado!';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
      }, 2000);
    }
  } catch(e){
    console.error('Error al re-descargar:', e);
    // Fallback: abrir el PDF en una nueva pestaña (útil en Safari iOS)
    try {
      const blobURL = archivoPDFPendiente.output('bloburl');
      window.open(blobURL, '_blank');
    } catch(err){
      alert('No se pudo descargar el PDF. Intenta de nuevo.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modalOverlay');
  if(overlay){
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) cerrarModal();
    });
  }
});

/* ================= GENERAR PDF DEL PEDIDO ================= */
async function generarPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const AZUL_OSCURO = [30, 95, 142];
  const AZUL_PROF   = [15, 58, 92];
  const NARANJA     = [255, 122, 26];
  const DORADO      = [212, 162, 76];
  const GRIS        = [74, 91, 108];
  const VERDE       = [34, 139, 34];

  const pageW = 210;
  let y = 0;

  doc.setFillColor(...AZUL_PROF);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setFillColor(...DORADO);
  doc.rect(0, 40, pageW, 2, 'F');

  try {
    const logoResult = await cargarImagen(LOGO_PATH);
    const logoFormato = logoResult.esPNG ? 'PNG' : 'JPEG';
    doc.addImage(logoResult.dataURL, logoFormato, 12, 8, 26, 26, undefined, 'FAST');
  } catch(e){
    doc.setFillColor(255,255,255);
    doc.circle(25, 21, 13, 'F');
    doc.setTextColor(...AZUL_PROF);
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.text('PAL', 25, 24, { align:'center' });
  }

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text('Pastelería Los Ángeles', 46, 18);

  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(232, 244, 253);
  doc.text('Pasteles con amor - Hechos artesanalmente', 46, 25);
  doc.text('WhatsApp: +52 1 744 137 1570  ·  Facebook: /pastelesconamor2020', 46, 31);

  y = 54;

  doc.setTextColor(...AZUL_PROF);
  doc.setFont('helvetica','bold');
  doc.setFontSize(16);
  doc.text('COMPROBANTE DE PEDIDO', pageW/2, y, { align:'center' });

  y += 4;
  doc.setDrawColor(...DORADO);
  doc.setLineWidth(0.8);
  doc.line(pageW/2 - 35, y, pageW/2 + 35, y);

  y += 12;

  doc.setFillColor(...AZUL_OSCURO);
  doc.roundedRect(14, y, pageW - 28, 16, 3, 3, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text(folio, pageW/2, y + 10.5, { align:'center', maxWidth: pageW - 34 });

  y += 26;

  const imgPath = IMG_PASTELES[pastelSeleccionado];
  let fotoCargada = false;

  if(imgPath){
    try {
      const resultado = await cargarImagen(imgPath);
      const imgData = resultado.dataURL;
      const formato = resultado.esPNG ? 'PNG' : 'JPEG';

      const dims = await cargarImagenDesdeDataURL(imgData);

      const maxW = 90;
      const maxH = 70;
      const ratio = dims.width / dims.height;
      let imgW = maxW;
      let imgH = maxW / ratio;
      if(imgH > maxH){
        imgH = maxH;
        imgW = maxH * ratio;
      }

      const imgX = (pageW - imgW) / 2;

      doc.setDrawColor(...DORADO);
      doc.setLineWidth(1.5);
      doc.roundedRect(imgX - 3, y - 3, imgW + 6, imgH + 6, 3, 3, 'S');

      doc.addImage(imgData, formato, imgX, y, imgW, imgH, undefined, 'FAST');
      fotoCargada = true;

      y += imgH + 12;
    } catch(e){
      console.warn('⚠️ No se pudo cargar la imagen del pastel:', e);
    }
  }

  if(!fotoCargada){
    doc.setDrawColor(...DORADO);
    doc.setLineWidth(1);
    doc.roundedRect(60, y, 90, 30, 3, 3, 'S');
    doc.setTextColor(...GRIS);
    doc.setFont('helvetica','italic');
    doc.setFontSize(10);
    doc.text('(Foto del pastel no disponible)', pageW/2, y + 17, { align:'center' });
    y += 38;
  }

  doc.setFillColor(232, 244, 253);
  doc.roundedRect(14, y, pageW - 28, 10, 2, 2, 'F');
  doc.setTextColor(...AZUL_PROF);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text('DATOS DEL CLIENTE Y DEL PEDIDO', 18, y + 7);

  y += 16;

  const lineas = [
    ['Pastel:',            pastelSeleccionado || '—'],
    ['Sabor:',             val('f-sabor') || '—'],
    ['Tamaño:',            val('f-tamano') || '—'],
    ['Diseño / Temática:', val('f-diseno') || '—'],
    ['Dedicatoria:',       val('f-dedicatoria') || 'Sin dedicatoria'],
    ['Recibe:',            val('f-nombre') || '—'],
    ['Fecha de entrega:',  formatearFecha()]
  ];

  doc.setFontSize(11);
  lineas.forEach(([label, value]) => {
    doc.setFont('helvetica','bold');
    doc.setTextColor(...AZUL_PROF);
    doc.text(label, 18, y);

    doc.setFont('helvetica','normal');
    doc.setTextColor(...GRIS);
    const valorLineas = doc.splitTextToSize(String(value), 110);
    doc.text(valorLineas, 75, y);

    y += 6 * valorLineas.length + 2;
  });

  y += 4;

  if(y > 200){
    doc.addPage();
    y = 20;
    doc.setFillColor(...AZUL_PROF);
    doc.rect(0, 0, pageW, 15, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.text('COMPROBANTE DE PEDIDO - ' + folio, pageW/2, 10, { align:'center' });
    y = 25;
  }

  doc.setDrawColor(...AZUL_OSCURO);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  const totales = [
    ['TOTAL',    '$' + precioSeleccionado,   NARANJA],
    ['ANTICIPO', '$' + anticipoSeleccionado, VERDE],
    ['RESTANTE', '$' + restanteSeleccionado, DORADO]
  ];

  totales.forEach(([label, valor, color]) => {
    doc.setFillColor(245, 250, 254);
    doc.roundedRect(14, y - 1, pageW - 28, 12, 2, 2, 'F');

    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(...AZUL_PROF);
    doc.text(label, 20, y + 7);

    doc.setFontSize(14);
    doc.setTextColor(...color);
    doc.text(valor, pageW - 20, y + 7.5, { align:'right' });

    y += 16;
  });

  if(y > 210){
    doc.addPage();
    y = 20;
    doc.setFillColor(...AZUL_PROF);
    doc.rect(0, 0, pageW, 15, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.text('DATOS BANCARIOS - ' + folio, pageW/2, 10, { align:'center' });
    y = 25;
  }

  y += 4;
  doc.setFillColor(...AZUL_PROF);
  doc.roundedRect(14, y, pageW - 28, 42, 3, 3, 'F');

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text('DATOS PARA TRANSFERENCIA', 20, y + 8);

  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  const bancos = [
    `Banco: ${BANCO}`,
    `Titular: ${TITULAR}`,
    `CLABE: ${CLABE}`,
    `Cuenta: ${CUENTA}`,
    `Concepto: ${folio}`
  ];
  bancos.forEach((linea, i) => {
    doc.text(linea, 20, y + 16 + i * 4.5);
  });

  y += 50;

  doc.setFillColor(255, 247, 227);
  doc.setDrawColor(...DORADO);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, y, pageW - 28, 14, 3, 3, 'FD');

  doc.setTextColor(138, 100, 16);
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text('ESTADO: ANTICIPO POR VERIFICAR', pageW/2, y + 9, { align:'center' });

  y += 22;

  doc.setDrawColor(...AZUL_OSCURO);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setTextColor(...GRIS);
  doc.setFont('helvetica','italic');
  doc.setFontSize(9);
  doc.text('Gracias por tu preferencia. Envía este PDF por WhatsApp para confirmar tu pedido.', pageW/2, y, { align:'center' });
  y += 5;
  doc.text('Pastelería Los Ángeles · Pasteles con amor', pageW/2, y, { align:'center' });

  return doc;
}

/* ================= GENERAR PDF DE COTIZACIÓN ================= */
async function generarPDFCotizacion(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const AZUL_OSCURO = [30, 95, 142];
  const AZUL_PROF   = [15, 58, 92];
  const DORADO      = [212, 162, 76];
  const GRIS        = [74, 91, 108];

  const pageW = 210;
  let y = 0;

  const nombre      = document.getElementById('c-nombre').value.trim() || '—';
  const ocasion     = document.getElementById('c-ocasion').value || 'No especificada';
  const sabor       = document.getElementById('c-sabor') ? (document.getElementById('c-sabor').value || '—') : '—';
  const porciones   = document.getElementById('c-porciones').value || 'No especificadas';
  const descripcion = document.getElementById('c-descripcion').value.trim() || '—';
  const fecha       = document.getElementById('c-fecha').value || 'Por definir';
  const presupuesto = document.getElementById('c-presupuesto').value.trim() || 'Por definir';

  const folioCot = generarFolioCotizacion(
    nombre,
    sabor !== '—' ? sabor : 'PASTEL',
    document.getElementById('c-fecha').value
  );

  doc.setFillColor(...AZUL_PROF);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setFillColor(...DORADO);
  doc.rect(0, 40, pageW, 2, 'F');

  try {
    const logoResult = await cargarImagen(LOGO_PATH);
    const logoFormato = logoResult.esPNG ? 'PNG' : 'JPEG';
    doc.addImage(logoResult.dataURL, logoFormato, 12, 8, 26, 26, undefined, 'FAST');
  } catch(e){
    doc.setFillColor(255,255,255);
    doc.circle(25, 21, 13, 'F');
    doc.setTextColor(...AZUL_PROF);
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.text('PAL', 25, 24, { align:'center' });
  }

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text('Pastelería Los Ángeles', 46, 18);

  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(232, 244, 253);
  doc.text('Cotización de pastel personalizado', 46, 25);
  doc.text('WhatsApp: +52 1 744 137 1570  ·  Facebook: /pastelesconamor2020', 46, 31);

  y = 54;

  doc.setTextColor(...AZUL_PROF);
  doc.setFont('helvetica','bold');
  doc.setFontSize(16);
  doc.text('TICKET DE COTIZACIÓN', pageW/2, y, { align:'center' });

  y += 4;
  doc.setDrawColor(...DORADO);
  doc.setLineWidth(0.8);
  doc.line(pageW/2 - 35, y, pageW/2 + 35, y);

  y += 12;

  doc.setFillColor(...AZUL_OSCURO);
  doc.roundedRect(14, y, pageW - 28, 16, 3, 3, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text(folioCot, pageW/2, y + 10.5, { align:'center', maxWidth: pageW - 34 });

  y += 26;

  let fotoCargada = false;

  if(cotizacionImagen && cotizacionImagen.dataURL){
    try {
      const esPNG = /^data:image\/png/i.test(cotizacionImagen.dataURL);
      const formato = esPNG ? 'PNG' : 'JPEG';

      const dims = await cargarImagenDesdeDataURL(cotizacionImagen.dataURL);

      const maxW = 100;
      const maxH = 80;
      const ratio = dims.width / dims.height;
      let imgW = maxW;
      let imgH = maxW / ratio;
      if(imgH > maxH){
        imgH = maxH;
        imgW = maxH * ratio;
      }

      const imgX = (pageW - imgW) / 2;

      doc.setDrawColor(...DORADO);
      doc.setLineWidth(1.5);
      doc.roundedRect(imgX - 3, y - 3, imgW + 6, imgH + 6, 3, 3, 'S');

      doc.addImage(cotizacionImagen.dataURL, formato, imgX, y, imgW, imgH, undefined, 'FAST');
      fotoCargada = true;

      y += imgH + 8;

      doc.setTextColor(...GRIS);
      doc.setFont('helvetica','italic');
      doc.setFontSize(9);
      doc.text('Imagen de referencia enviada por el cliente', pageW/2, y, { align:'center' });
      y += 10;
    } catch(e){
      console.warn('⚠️ No se pudo cargar la imagen de referencia:', e);
    }
  }

  if(!fotoCargada){
    doc.setDrawColor(...DORADO);
    doc.setLineWidth(1);
    doc.roundedRect(60, y, 90, 25, 3, 3, 'S');
    doc.setTextColor(...GRIS);
    doc.setFont('helvetica','italic');
    doc.setFontSize(10);
    doc.text('(Sin imagen de referencia)', pageW/2, y + 15, { align:'center' });
    y += 33;
  }

  if(y > 200){
    doc.addPage();
    y = 20;
    doc.setFillColor(...AZUL_PROF);
    doc.rect(0, 0, pageW, 15, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.text('TICKET DE COTIZACIÓN - ' + folioCot, pageW/2, 10, { align:'center' });
    y = 25;
  }

  doc.setFillColor(232, 244, 253);
  doc.roundedRect(14, y, pageW - 28, 10, 2, 2, 'F');
  doc.setTextColor(...AZUL_PROF);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text('DATOS DE LA COTIZACIÓN', 18, y + 7);

  y += 16;

  const lineas = [
    ['Nombre:',              nombre],
    ['Ocasión:',             ocasion],
    ['Sabor deseado:',       sabor],
    ['Porciones aprox.:',    porciones],
    ['Fecha tentativa:',     fecha],
    ['Presupuesto aprox.:',  presupuesto]
  ];

  doc.setFontSize(11);
  lineas.forEach(([label, value]) => {
    doc.setFont('helvetica','bold');
    doc.setTextColor(...AZUL_PROF);
    doc.text(label, 18, y);

    doc.setFont('helvetica','normal');
    doc.setTextColor(...GRIS);
    const valorLineas = doc.splitTextToSize(String(value), 100);
    doc.text(valorLineas, 75, y);

    y += 6 * valorLineas.length + 2;
  });

  y += 4;

  doc.setFillColor(232, 244, 253);
  doc.roundedRect(14, y, pageW - 28, 10, 2, 2, 'F');
  doc.setTextColor(...AZUL_PROF);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text('DETALLES DE LO QUE DESEA', 18, y + 7);

  y += 16;

  doc.setFont('helvetica','normal');
  doc.setTextColor(...GRIS);
  doc.setFontSize(11);

  const descLineas = doc.splitTextToSize(descripcion, pageW - 36);
  doc.text(descLineas, 18, y);

  y += descLineas.length * 5.5 + 10;

  if(y > 240){
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(...AZUL_OSCURO);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setFillColor(255, 247, 227);
  doc.setDrawColor(...DORADO);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, y, pageW - 28, 20, 3, 3, 'FD');

  doc.setTextColor(138, 100, 16);
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.text('IMPORTANTE:', 20, y + 7);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  const aviso = doc.splitTextToSize(
    'Adjunta este PDF junto con una captura de pantalla de la conversación de WhatsApp donde enviaste tu idea, para que podamos revisarla y darte una cotización exacta.',
    pageW - 40
  );
  doc.text(aviso, 20, y + 13);

  y += 26;

  doc.setTextColor(...GRIS);
  doc.setFont('helvetica','italic');
  doc.setFontSize(9);
  doc.text('Gracias por tu preferencia. Te contactaremos lo antes posible.', pageW/2, y, { align:'center' });
  y += 5;
  doc.text('Pastelería Los Ángeles · Pasteles con amor', pageW/2, y, { align:'center' });

  return { doc, folioCot };
}

/* ================= DESCARGAR COMPROBANTE (PASO 4) ================= */
async function descargarComprobante(){
  try {
    const doc = await generarPDF();
    const nombreArchivo = folio + '.pdf';

    // Guardar el PDF en variable global para poder re-descargar
    archivoPDFPendiente = doc;
    tipoPDFPendiente = 'pedido';

    doc.save(nombreArchivo);

    guardarPedidoEnStorage();

    setTimeout(() => {
      mostrarModal({
        tipo: 'pedido',
        icon: '📄',
        title: '¡Comprobante descargado!',
        text: 'Guarda este PDF. Después de transferir, lo adjuntarás en WhatsApp.',
        fileName: nombreArchivo,
        showInstructions: true,
        onWhatsApp: null
      });
    }, 300);
  } catch(e){
    console.error(e);
    alert('No se pudo generar el comprobante. Intenta de nuevo.');
  }
}

/* ================= MENSAJE WHATSAPP PEDIDO ================= */
function construirMensaje(){
  return `Hola Pastelería Los Ángeles 🎂

Ya realicé mi transferencia. Adjunto los siguientes archivos:

📎 Comprobante de pedido: ${folio}.pdf
📎 Captura de mi transferencia bancaria

PEDIDO: ${folio}

• Pastel: ${pastelSeleccionado || '—'}
• Sabor: ${val('f-sabor') || '—'}
• Tamaño: ${val('f-tamano') || '—'}
• Diseño: ${val('f-diseno') || '—'}
• Dedicatoria: ${val('f-dedicatoria') || 'Sin dedicatoria'}
• Recibe: ${val('f-nombre') || '—'}
• Entrega: ${formatearFecha()}

TOTAL: $${precioSeleccionado}
ANTICIPO: $${anticipoSeleccionado}
RESTANTE: $${restanteSeleccionado}

Estado: ANTICIPO POR VERIFICAR`;
}

function enviarPorWhatsApp(){
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(construirMensaje())}`;
  window.open(url, '_blank');
}

/* ================= DESCARGAR PDF (LEGACY) ================= */
async function descargarPDF(){
  try {
    const doc = await generarPDF();
    doc.save(`${folio}.pdf`);
  } catch(e){
    console.error(e);
    alert('No se pudo generar el PDF. Intenta de nuevo.');
  }
}

/* ================= NUEVO PEDIDO ================= */
function nuevoPedido(){
  folio = "PEDIDO-XXX-XXX-XX-XX-XXXX";
  pastelSeleccionado = null;
  precioSeleccionado = 1500;
  anticipoSeleccionado = 900;
  restanteSeleccionado = 600;

  // Limpiar PDF pendiente
  archivoPDFPendiente = null;
  tipoPDFPendiente = 'pedido';

  ['f-sabor','f-diseno','f-fecha','f-nombre','f-dedicatoria'].forEach(id => {
    const el = document.getElementById(id);
    if(el){
      el.value = '';
      el.classList.remove('err');
    }
  });
  document.getElementById('f-pastel').value = '';
  document.getElementById('f-tamano').selectedIndex = 1;
  document.getElementById('f-hora').value = '17:00';
  document.querySelectorAll('.product-pick').forEach(p => p.classList.remove('selected'));
  goStep(1);
}

/* ================= COTIZACIÓN: SUBIR IMAGEN ================= */
const fileInput   = document.getElementById('fileInput');
const fileDrop    = document.getElementById('fileDrop');
const filePreview = document.getElementById('filePreview');
const previewImg  = document.getElementById('previewImg');
const fileName    = document.getElementById('fileName');
const fileSize    = document.getElementById('fileSize');

if(fileInput){
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){
      alert('Por favor selecciona una imagen válida (JPG, PNG).');
      return;
    }
    if(file.size > 8 * 1024 * 1024){
      alert('La imagen es muy grande. Máximo 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      cotizacionImagen = {
        dataURL: ev.target.result,
        name: file.name,
        size: file.size
      };
      previewImg.src = ev.target.result;
      fileName.textContent = file.name;
      fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
      filePreview.classList.add('show');
      fileDrop.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

function quitarImagen(){
  cotizacionImagen = null;
  if(fileInput) fileInput.value = '';
  if(filePreview) filePreview.classList.remove('show');
  if(fileDrop) fileDrop.style.display = 'block';
}

if(fileDrop){
  ['dragenter','dragover'].forEach(ev => {
    fileDrop.addEventListener(ev, e => {
      e.preventDefault();
      fileDrop.style.borderColor = '#FF7A1A';
      fileDrop.style.background = 'linear-gradient(135deg,#FFF8F2,#FFF0E0)';
    });
  });
  ['dragleave','drop'].forEach(ev => {
    fileDrop.addEventListener(ev, e => {
      e.preventDefault();
      fileDrop.style.borderColor = '';
      fileDrop.style.background = '';
    });
  });
}

/* ================= ENVIAR COTIZACIÓN ================= */
async function enviarCotizacion(){
  const nombre      = document.getElementById('c-nombre').value.trim();
  const descripcion = document.getElementById('c-descripcion').value.trim();

  if(!nombre){ alert('Por favor escribe tu nombre.'); return; }
  if(!descripcion){ alert('Cuéntanos qué te gustaría que tuviera tu pastel.'); return; }

  const ocasion     = document.getElementById('c-ocasion').value;
  const sabor       = document.getElementById('c-sabor') ? document.getElementById('c-sabor').value : '';
  const porciones   = document.getElementById('c-porciones').value;
  const fecha       = document.getElementById('c-fecha').value;
  const presupuesto = document.getElementById('c-presupuesto').value.trim();

  // Mensaje con formato en negritas para WhatsApp (*texto* = negritas)
  let msg = `Hola Pastelería Los Ángeles 🎂

Quiero cotizar un pastel personalizado:

*Nombre:* ${nombre}
*Ocasión:* ${ocasion || 'No especificada'}
*Sabor deseado:* ${sabor || 'No especificado'}
*Porciones:* ${porciones || 'No especificadas'}
*Fecha tentativa:* ${fecha || 'Por definir'}
*Presupuesto:* ${presupuesto || 'Por definir'}

*Descripción / Lo que me gustaría:*
${descripcion}

📎 Adjunto mi ticket de cotización en PDF${cotizacionImagen ? ' con la imagen de referencia' : ''}.`;

  let pdfNombre = 'Cotizacion.pdf';
  try {
    const resultado = await generarPDFCotizacion();
    pdfNombre = `${resultado.folioCot}.pdf`;

    // Guardar el PDF en variable global para poder re-descargar
    archivoPDFPendiente = resultado.doc;
    archivoPDFPendiente._nombreArchivo = pdfNombre;
    tipoPDFPendiente = 'cotizacion';

    resultado.doc.save(pdfNombre);
  } catch(e){
    console.warn('No se pudo generar el PDF de cotización:', e);
  }

  setTimeout(() => {
    mostrarModal({
      tipo: 'cotizacion',
      icon: '📄',
      title: '¡Ticket de cotización descargado!',
      text: 'Guarda tu PDF. Envíalo por WhatsApp para que podamos revisar tu idea.',
      fileName: pdfNombre,
      showInstructions: false,
      mensajeWA: msg,
      onWhatsApp: null
    });
  }, 400);
}

/* ================= ALMACENAMIENTO DE PEDIDOS ================= */
function guardarPedidoEnStorage(){
  try {
    const pedidos = JSON.parse(localStorage.getItem('pedidos_losangeles') || '{}');

    pedidos[folio] = {
      folio: folio,
      nombre: val('f-nombre'),
      pastel: pastelSeleccionado,
      sabor: val('f-sabor'),
      tamano: val('f-tamano'),
      diseno: val('f-diseno'),
      dedicatoria: val('f-dedicatoria'),
      fecha: val('f-fecha'),
      hora: val('f-hora'),
      precio: precioSeleccionado,
      anticipo: anticipoSeleccionado,
      restante: restanteSeleccionado,
      creado: new Date().toISOString()
    };

    localStorage.setItem('pedidos_losangeles', JSON.stringify(pedidos));
  } catch(e){
    console.warn('No se pudo guardar el pedido:', e);
  }
}

/* ================= FAQ TOGGLE ================= */
function toggleFaq(btn){
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');

  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    const icon = el.querySelector('.faq-icon');
    if(icon) icon.textContent = '+';
  });

  if(!isOpen){
    item.classList.add('open');
    const icon = item.querySelector('.faq-icon');
    if(icon) icon.textContent = '−';
  }
}

/* ================= MENÚ MÓVIL ================= */
const burger = document.getElementById('burger');
if(burger){
  burger.addEventListener('click', () => {
    document.getElementById('menu').classList.toggle('open');
  });
}
document.querySelectorAll('#menu a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('menu').classList.remove('open'));
});

/* ================= FECHAS MÍNIMAS ================= */
(function(){
  const hoy = new Date();

  const minPedido = new Date(hoy);
  minPedido.setDate(minPedido.getDate() + DIAS_MINIMOS);
  const fFecha = document.getElementById('f-fecha');
  if(fFecha) fFecha.min = minPedido.toISOString().split('T')[0];

  const minCot = new Date(hoy);
  minCot.setDate(minCot.getDate() + DIAS_MINIMOS);
  const cFecha = document.getElementById('c-fecha');
  if(cFecha) cFecha.min = minCot.toISOString().split('T')[0];
})();

/* ================= AÑO FOOTER ================= */
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();