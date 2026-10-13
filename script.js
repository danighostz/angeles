/* ================= CONFIGURACIÓN ================= */
const WA_NUMBER = "5217442861594";
const DIAS_MINIMOS = 2;
const PORCENTAJE_ANTICIPO = 0.5; // 50%

const DATOS_BANCO = {
  banco: 'Santander',
  titular: 'Wendy Laura Cruz Cruz',
  tarjeta: '5579 0700 7210 0376',
  clabe: '0142 6160 5534 3834 81'
};

/* ================= CATÁLOGO DE PASTELES ================= */
const PASTELES = {
  'Planca Sencillo · 25 porciones': {
    img: 'img/pastel_plancha.png',
    tipos: { 'Básico': 450, 'Sin Leches': 500, '3 Leches': 700, 'Gourmet': 850 }
  },
  'Pastel Chico · 8-10 porciones': {
    img: 'img/pastel_chico.png',
    tipos: { 'Básico': 250, 'Sin Leches': 300, '3 Leches': 350, 'Gourmet': 400 }
  },
  'Pastel Alto · 30 porciones': {
    img: 'img/pastel_alto.png',
    tipos: { 'Básico': 800, 'Sin Leches': 950, '3 Leches': 1100, 'Gourmet': 1400 }
  },
  'Pastel de Pisos · 100 porciones': {
    img: 'img/pastel_pisos.png',
    tipos: { 'Básico': 2500, 'Sin Leches': 3000, '3 Leches': 4000, 'Gourmet': 5000 }
  },
  'K-POP HUNTERS · 50 porciones': {
    img: 'img/pastel_kpop.png',
    tipos: { 'Básico': 1000, 'Sin Leches': 1200, '3 Leches': 1500, 'Gourmet': 1800 }
  }
};

/* ================= CATÁLOGO DE POSTRES ================= */
const POSTRES = {
  'Gelatina Mosaico':    { precio: 150, desc: 'Gelatina de mosaico artesanal' },
  'Chocoflan':           { precio: 400, desc: 'Pastel de chocolate con flan' },
  'Gelatina con Fruta':  { precio: 350, desc: 'Gelatina con fruta fresca' },
  'Pudín':               { precio: 370, desc: 'Pudín casero con caramelo' },
  'Flan Chico':          { precio: 400, desc: 'Flan individual casero' }
};

/* ================= SABORES POR TIPO ================= */
const SABORES = {
  'Básico': [
    'Crema Pastelera',
    'Mermelada de Fresa',
    'Mermelada de Frutos Rojos',
    'Mermelada de Zarzamora',
    'Mermelada de Durazno',
    'Mermelada de Manzana',
    'Tipo Americano Vainilla (no húmedo)',
    'Tipo Americano Chocolate (no húmedo)'
  ],
  'Sin Leches': [
    'Moka (húmedo sin leches)',
    'Red Velvet (no húmedo)',
    'Bajos en Azúcar (no húmedo)',
    'Gluten Free (no húmedo)'
  ],
  '3 Leches': [
    'Coco', 'Fresa', 'Mazapán', 'Vainilla',
    'Chocolate', 'Café', 'Rompope', 'Chocomilk'
  ],
  'Gourmet': [
    'Queso',
    'Naranja'
  ]
};

const ORDEN_TIPOS = ['Básico', 'Sin Leches', '3 Leches', 'Gourmet'];

/* ================= ESTADO ================= */
let pastelSeleccionado = null;
let tipoSeleccionado = null;
let precioSeleccionado = 0;
let anticipoSeleccionado = 0;
let restanteSeleccionado = 0;

// Estado para postres
let postreSeleccionado = null;
let precioPostre = 0;
let anticipoPostre = 0;
let restantePostre = 0;

/* ================= HELPERS ================= */
const val = id => {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
};

function setTxt(id, texto){
  const el = document.getElementById(id);
  if(el) el.textContent = texto;
}

function formatearPrecio(n){
  return '$' + n.toLocaleString('es-MX');
}

function calcularFechaMinima(){
  const hoy = new Date();
  const minFecha = new Date(hoy);
  minFecha.setDate(minFecha.getDate() + DIAS_MINIMOS);
  return minFecha.toISOString().split('T')[0];
}

function hoyISO(){
  return new Date().toISOString().split('T')[0];
}

/* ================= MODAL DE ERROR ================= */
function mostrarError(mensaje, detalle){
  const modal = document.getElementById('modalError');
  if(!modal){
    console.warn('Error:', mensaje);
    return;
  }
  setTxt('errorTitulo', mensaje || 'Favor de completar todos los campos obligatorios.');
  setTxt('errorTexto', detalle || 'Revisa los campos marcados con (*) e intenta de nuevo.');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModalError(){
  const modal = document.getElementById('modalError');
  if(!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ================= WIZARD ================= */
function mostrarWizard(){
  const wiz = document.getElementById('wizard-pedido');
  if(wiz){
    wiz.hidden = false;
    void wiz.offsetHeight;
  }
}

function ocultarWizard(){
  const wiz = document.getElementById('wizard-pedido');
  if(wiz) wiz.hidden = true;
}

function scrollAlWizard(){
  const wiz = document.getElementById('wizard-pedido');
  if(!wiz || wiz.hidden) return;
  setTimeout(() => {
    const y = wiz.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, 120);
}

/* ================= MODAL PEDIDO (PASTELES Y POSTRES) ================= */
function abrirModalPedido(nombre){
  const modal = document.getElementById('modalPedidoPastel');
  if(!modal) return;

  const form = document.getElementById('formPedido');
  if(form) form.reset();

  const el = document.getElementById('p-pastel');
  if(el) el.value = nombre;

  // Detectar si es postre
  const esPostre = Object.prototype.hasOwnProperty.call(POSTRES, nombre);

  if(esPostre){
    // Configurar modal como POSTRE
    postreSeleccionado = nombre;
    precioPostre = POSTRES[nombre].precio;
    anticipoPostre = Math.round(precioPostre * PORCENTAJE_ANTICIPO);
    restantePostre = precioPostre - anticipoPostre;

    setTxt('pedidoTitulo', `Pedir postre: ${nombre}`);

    // Ocultar campos de pastel
    ocultarCamposPastel();
    // Mostrar campos de postre
    mostrarCamposPostre();

    // Llenar etiqueta de precio fijo
    const lbl = document.getElementById('p-precio-fijo');
    if(lbl) lbl.textContent = `${formatearPrecio(precioPostre)} (anticipo 50%: ${formatearPrecio(anticipoPostre)})`;

    // Fecha mínima: HOY (los postres no requieren anticipación)
    const fechaInput = document.getElementById('p-fecha-postre');
    if(fechaInput) fechaInput.min = hoyISO();

  } else {
    // Configurar modal como PASTEL (comportamiento original)
    postreSeleccionado = null;

    setTxt('pedidoTitulo', `Pedir: ${nombre}`);

    mostrarCamposPastel();
    ocultarCamposPostre();

    const fechaInput = document.getElementById('p-fecha');
    if(fechaInput) fechaInput.min = calcularFechaMinima();

    resetearSaborPedido();
  }

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModalPedido(){
  const modal = document.getElementById('modalPedidoPastel');
  if(!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ================= MOSTRAR / OCULTAR CAMPOS ================= */
function ocultarCamposPastel(){
  document.querySelectorAll('.solo-pastel').forEach(el => el.style.display = 'none');
}

function mostrarCamposPastel(){
  document.querySelectorAll('.solo-pastel').forEach(el => el.style.display = '');
}

function mostrarCamposPostre(){
  document.querySelectorAll('.solo-postre').forEach(el => el.style.display = '');
}

function ocultarCamposPostre(){
  document.querySelectorAll('.solo-postre').forEach(el => el.style.display = 'none');
}

/* ================= SABORES (PASTELES) ================= */
function resetearSaborPedido(){
  const select = document.getElementById('p-sabor');
  if(!select) return;
  select.innerHTML = '<option value="">Primero elige un tipo</option>';
}

function cargarSaboresPedido(tipo){
  const select = document.getElementById('p-sabor');
  if(!select) return;

  select.innerHTML = '<option value="">Selecciona un sabor</option>';

  const lista = SABORES[tipo] || [];
  if(lista.length === 0){
    select.innerHTML = '<option value="">No hay sabores para este tipo</option>';
    return;
  }

  lista.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
}

/* ================= ENVIAR PEDIDO (PASTEL) ================= */
function enviarPedidoPastel(){
  // Si es postre, redirigir al flujo de postre
  if(postreSeleccionado){
    enviarPedidoPostre();
    return;
  }

  const pastel      = val('p-pastel');
  const nombre      = val('p-nombre');
  const telefono    = val('p-telefono');
  const tipo        = val('p-tipo');
  const sabor       = val('p-sabor');
  const porciones   = val('p-porciones');
  const fecha       = val('p-fecha');
  const hora        = val('p-hora');
  const entrega     = val('p-entrega');
  const direccion   = val('p-direccion');
  const dedicatoria = val('p-dedicatoria');

  if(!nombre){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta tu nombre.');
    document.getElementById('p-nombre').focus();
    return;
  }
  if(!tipo){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta elegir el tipo de pastel.');
    document.getElementById('p-tipo').focus();
    return;
  }
  if(!sabor){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta elegir el sabor.');
    document.getElementById('p-sabor').focus();
    return;
  }
  if(!porciones){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta indicar las porciones aproximadas.');
    document.getElementById('p-porciones').focus();
    return;
  }
  if(!fecha){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta elegir la fecha del evento.');
    document.getElementById('p-fecha').focus();
    return;
  }

  const fechaEvento = new Date(fecha + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const diff = Math.ceil((fechaEvento - hoy) / 86400000);
  if(diff < DIAS_MINIMOS){
    mostrarError('Para pedir tu pastel necesitas 2 días de anticipación.', 'Elige una fecha posterior.');
    document.getElementById('p-fecha').focus();
    return;
  }

  const mensaje = `Hola Pastelería Los Ángeles 🎂

Quiero cotizar un *${pastel}*.

*Nombre:* ${nombre}${telefono ? `\n*WhatsApp:* ${telefono}` : ''}
*Tipo:* ${tipo}
*Sabor:* ${sabor}
*Porciones:* ${porciones}
*Fecha del evento:* ${fecha}${hora ? ` a las ${hora}` : ''}
*Tipo de entrega:* ${entrega}${entrega === 'A domicilio' && direccion ? `\n*Dirección:* ${direccion}` : ''}${dedicatoria ? `\n*Dedicatoria:* ${dedicatoria}` : ''}

📸 *Recuerda adjuntar captura del pastel.`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  cerrarModalPedido();
  setTimeout(() => window.open(url, '_blank'), 200);
}

/* ================= ENVIAR PEDIDO (POSTRE) ================= */
function enviarPedidoPostre(){
  const nombre    = val('pr-nombre');
  const telefono  = val('pr-telefono');
  const direccion = val('pr-direccion');
  const fecha     = val('pr-fecha');
  const hora      = val('pr-hora');
  const nota      = val('pr-nota');

  if(!nombre){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta tu nombre.');
    document.getElementById('pr-nombre').focus();
    return;
  }
  if(!direccion){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta la dirección de entrega.');
    document.getElementById('pr-direccion').focus();
    return;
  }
  if(!fecha){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta la fecha en que lo quieres.');
    document.getElementById('pr-fecha').focus();
    return;
  }

  // Mostrar paso de transferencia
  mostrarPasoTransferenciaPostre();
}

/* ================= PASO DE TRANSFERENCIA (POSTRES) ================= */
function mostrarPasoTransferenciaPostre(){
  const modal = document.getElementById('modalPedidoPastel');
  if(!modal) return;

  // Ocultar el formulario de postre
  const form = document.getElementById('formPedido');
  if(form) form.style.display = 'none';

  // Crear o mostrar el bloque de transferencia
  let bloque = document.getElementById('bloqueTransferenciaPostre');
  if(!bloque){
    bloque = document.createElement('div');
    bloque.id = 'bloqueTransferenciaPostre';
    bloque.className = 'bloque-transferencia-postre';
    bloque.innerHTML = `
      <div class="modal-icon">💳</div>
      <h3>Realiza tu anticipo</h3>
      <p>Para apartar tu postre, transfiere el <b>50%</b> de anticipo:</p>

      <div class="bank-card-info">
        <div class="bank-line"><span>Banco</span><b>${DATOS_BANCO.banco}</b></div>
        <div class="bank-line"><span>Titular</span><b>${DATOS_BANCO.titular}</b></div>
        <div class="bank-line"><span>Tarjeta</span><b>${DATOS_BANCO.tarjeta}</b></div>
        <div class="bank-line"><span>CLABE</span><b>${DATOS_BANCO.clabe}</b></div>
        <div class="bank-line bank-line-monto"><span>Monto a transferir (50%)</span><b id="pr-anticipo-monto">${formatearPrecio(anticipoPostre)}</b></div>
      </div>

      <div class="modal-aviso">
        ⚠️ <b>Importante:</b> envía tu comprobante por WhatsApp para que verifiquemos y comencemos a preparar tu postre.
      </div>

      <div class="modal-btns">
        <button type="button" class="btn btn-primary" onclick="copiarDatosBancarios()">📋 Copiar datos bancarios</button>
        <button type="button" class="btn btn-wa btn-wa-grande" onclick="confirmarTransferenciaPostre()">
          <svg class="ico-wa" aria-hidden="true"><use href="#ico-wa"/></svg>
          ✅ Ya transferí, enviar pedido
        </button>
        <button type="button" class="btn btn-ghost" onclick="volverFormularioPostre()">← Volver</button>
      </div>
    `;
    modal.querySelector('.modal').appendChild(bloque);
  } else {
    bloque.style.display = 'block';
    const monto = document.getElementById('pr-anticipo-monto');
    if(monto) monto.textContent = formatearPrecio(anticipoPostre);
  }
}

function volverFormularioPostre(){
  const bloque = document.getElementById('bloqueTransferenciaPostre');
  if(bloque) bloque.style.display = 'none';
  const form = document.getElementById('formPedido');
  if(form) form.style.display = '';
}

function confirmarTransferenciaPostre(){
  const nombre    = val('pr-nombre');
  const telefono  = val('pr-telefono');
  const direccion = val('pr-direccion');
  const fecha     = val('pr-fecha');
  const hora      = val('pr-hora');
  const nota      = val('pr-nota');

  const mensaje = `Hola Pastelería Los Ángeles 🍮

Quiero pedir un *${postreSeleccionado}*.

*Precio:* ${formatearPrecio(precioPostre)}
*Anticipo (50%):* ${formatearPrecio(anticipoPostre)}
*Restante al entregar:* ${formatearPrecio(restantePostre)}

*Nombre:* ${nombre}${telefono ? `\n*WhatsApp:* ${telefono}` : ''}
*Dirección:* ${direccion}
*Fecha de entrega:* ${fecha}${hora ? ` a las ${hora}` : ''}${nota ? `\n*Nota:* ${nota}` : ''}

✅ *Ya realicé la transferencia del anticipo.* Adjunto comprobante.`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`;

  // Cerrar modal y limpiar bloque
  cerrarModalPedido();
  const bloque = document.getElementById('bloqueTransferenciaPostre');
  if(bloque) bloque.remove();
  const form = document.getElementById('formPedido');
  if(form) form.style.display = '';

  setTimeout(() => window.open(url, '_blank'), 200);
}

/* ================= COTIZACIÓN ================= */
function abrirModalCotizacion(){
  const modal = document.getElementById('modalCotizacion');
  if(!modal) return;

  const form = document.getElementById('formCotizacion');
  if(form) form.reset();

  const cFecha = document.getElementById('c-fecha');
  if(cFecha) cFecha.min = calcularFechaMinima();

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModalCotizacion(){
  const modal = document.getElementById('modalCotizacion');
  if(!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function enviarCotizacion(){
  const nombre      = val('c-nombre');
  const tipo        = val('c-tipo');
  const ocasion     = val('c-ocasion');
  const porciones   = val('c-porciones');
  const fecha       = val('c-fecha');
  const descripcion = val('c-descripcion');

  if(!nombre){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta tu nombre.');
    document.getElementById('c-nombre').focus();
    return;
  }
  if(!descripcion){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Cuéntanos qué pastel quieres.');
    document.getElementById('c-descripcion').focus();
    return;
  }

  if(fecha){
    const fechaEvento = new Date(fecha + 'T00:00:00');
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const diff = Math.ceil((fechaEvento - hoy) / 86400000);
    if(diff < DIAS_MINIMOS){
      mostrarError('Para pedir tu pastel necesitas 2 días de anticipación.', 'Elige una fecha posterior.');
      document.getElementById('c-fecha').focus();
      return;
    }
  }

  const mensaje = `Hola Pastelería Los Ángeles 🎂

Quiero cotizar un pastel personalizado:

*Nombre:* ${nombre}
*Tipo:* ${tipo || 'No especificado'}
*Ocasión:* ${ocasion || 'No especificada'}
*Porciones:* ${porciones || 'No especificadas'}
*Fecha:* ${fecha || 'Por definir'}

*Descripción / Idea del pastel:*
${descripcion}

📸 *Voy a adjuntar una fotografía de referencia* para que me puedan dar una cotización más exacta.`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  cerrarModalCotizacion();
  setTimeout(() => window.open(url, '_blank'), 200);
}

/* ================= WIZARD: ELEGIR PASTEL ================= */
function elegirPastelPedido(nombrePastel){
  if(!PASTELES[nombrePastel]){
    mostrarError('Pastel no encontrado.', 'Intenta de nuevo.');
    return;
  }

  mostrarWizard();

  pastelSeleccionado = nombrePastel;
  tipoSeleccionado = null;
  precioSeleccionado = 0;
  anticipoSeleccionado = 0;
  restanteSeleccionado = 0;

  const el = document.getElementById('f-pastel');
  if(el) el.value = nombrePastel;

  document.querySelectorAll('.product-pick').forEach(p => {
    p.classList.toggle('selected', p.dataset.pastel === nombrePastel);
  });

  renderTipos(nombrePastel);
  actualizarPreciosLive();
  goStep(2);
}

function renderTipos(nombrePastel){
  const grid = document.getElementById('tipoGrid');
  if(!grid) return;

  const tipos = PASTELES[nombrePastel].tipos;
  grid.innerHTML = '';

  ORDEN_TIPOS.forEach(tipo => {
    const precio = tipos[tipo];
    if(typeof precio !== 'number') return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tipo-option';
    btn.dataset.tipo = tipo;
    btn.dataset.precio = precio;

    btn.innerHTML = `
      <span class="tipo-nombre">${tipo}</span>
      <span class="tipo-precio">${formatearPrecio(precio)}</span>
      <span class="tipo-nota">${notaTipo(tipo)}</span>
    `;

    btn.addEventListener('click', () => seleccionarTipo(tipo, precio));
    grid.appendChild(btn);
  });
}

function notaTipo(tipo){
  switch(tipo){
    case 'Básico':     return 'Decorado sencillo';
    case 'Sin Leches': return 'Sin lácteos';
    case '3 Leches':   return 'Húmedo clásico';
    case 'Gourmet':    return 'Sabor premium';
    default:           return '';
  }
}

function seleccionarTipo(tipo, precio){
  tipoSeleccionado = tipo;
  precioSeleccionado = precio;
  anticipoSeleccionado = Math.round(precio * PORCENTAJE_ANTICIPO);
  restanteSeleccionado = precio - anticipoSeleccionado;

  document.querySelectorAll('.tipo-option').forEach(b => {
    b.classList.toggle('selected', b.dataset.tipo === tipo);
  });

  actualizarPreciosLive();
}

function actualizarPreciosLive(){
  setTxt('live-total',      formatearPrecio(precioSeleccionado));
  setTxt('live-anticipo',   formatearPrecio(anticipoSeleccionado));
  setTxt('live-restante',   formatearPrecio(restanteSeleccionado));
  setTxt('aviso-anticipo',  formatearPrecio(anticipoSeleccionado));
  setTxt('banco-anticipo',  formatearPrecio(anticipoSeleccionado));
}

/* ================= VALIDACIONES DEL WIZARD ================= */
function validarPaso1(){
  if(!pastelSeleccionado){
    mostrarError('Favor de seleccionar un pastel.', 'Elige un pastel para continuar.');
    return;
  }
  goStep(2);
}

function validarPaso2(){
  if(!tipoSeleccionado){
    mostrarError('Favor de seleccionar el tipo.', 'Elige un tipo de pastel.');
    return;
  }
  cargarSabores(tipoSeleccionado);
  const el = document.getElementById('f-tipo-display');
  if(el) el.value = `${pastelSeleccionado} · ${tipoSeleccionado} — ${formatearPrecio(precioSeleccionado)}`;
  goStep(3);
}

function validarPaso3(){
  const sabor = val('f-sabor');
  if(!sabor){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Falta elegir un sabor.');
    document.getElementById('f-sabor').classList.add('err');
    return;
  }
  goStep(4);
}

function validarPaso4(){
  const campos = ['f-fecha','f-hora','f-nombre'];
  let ok = true;

  campos.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    const vacio = !el.value.trim();
    el.classList.toggle('err', vacio);
    if(vacio && ok){ el.focus(); ok = false; }
  });

  if(!ok){
    mostrarError('Favor de completar todos los campos obligatorios.', 'Revisa los campos marcados con (*).');
    return;
  }

  const fechaStr = document.getElementById('f-fecha').value;
  const fecha = new Date(fechaStr + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const diff = Math.ceil((fecha - hoy) / 86400000);

  if(diff < DIAS_MINIMOS){
    mostrarError('Para pedir tu pastel necesitas 2 días de anticipación.', 'Elige una fecha posterior.');
    document.getElementById('f-fecha').classList.add('err');
    return;
  }

  goStep(5);
}

function cargarSabores(tipo){
  const select = document.getElementById('f-sabor');
  if(!select) return;

  select.innerHTML = '<option value="">Selecciona un sabor</option>';

  const lista = SABORES[tipo] || [];
  if(lista.length === 0){
    select.innerHTML = '<option value="">(Sin sabores para este tipo)</option>';
    return;
  }

  lista.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
}

function goStep(n){
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`.step[data-step="${n}"]`);
  if(target) target.classList.add('active');

  document.querySelectorAll('.step-dot').forEach(d => {
    const i = Number(d.dataset.bar);
    d.classList.toggle('active', i === n);
    d.classList.toggle('done', i < n);
  });

  if(n === 5) pintarBanco();
  if(n === 6) pintarResumen();

  scrollAlWizard();
}

function formatearFecha(){
  const f = val('f-fecha');
  const h = val('f-hora');
  if(!f) return '—';
  const d = new Date(f + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${dd}/${mm}/${d.getFullYear()} - ${h || '17:00'}`;
}

function pintarBanco(){
  setTxt('banco-anticipo', formatearPrecio(anticipoSeleccionado));
}

function pintarResumen(){
  setTxt('r-pastel', pastelSeleccionado || '—');
  setTxt('r-tipo', tipoSeleccionado || '—');
  setTxt('r-sabor', val('f-sabor') || '—');
  setTxt('r-tamano', extraerTamano(pastelSeleccionado) || '—');
  setTxt('r-dedicatoria', val('f-dedicatoria') || 'Sin dedicatoria');
  setTxt('r-nombre', val('f-nombre') || '—');
  setTxt('r-entrega', formatearFecha());

  const tipoEntrega = document.querySelector('input[name="tipo-entrega"]:checked');
  setTxt('r-tipo-entrega', tipoEntrega ? tipoEntrega.value : '—');
  setTxt('r-direccion', val('f-direccion') || '—');

  setTxt('r-total',    formatearPrecio(precioSeleccionado));
  setTxt('r-anticipo', formatearPrecio(anticipoSeleccionado));
  setTxt('r-restante', formatearPrecio(restanteSeleccionado));
  setTxt('aviso-anticipo', formatearPrecio(anticipoSeleccionado));
}

function extraerTamano(nombre){
  const match = String(nombre || '').match(/(\d+[\s-]?\d*\s*porciones)/i);
  return match ? match[1] : '';
}

function construirMensaje(){
  const tipoEntrega = document.querySelector('input[name="tipo-entrega"]:checked');
  const entrega = tipoEntrega ? tipoEntrega.value : 'A domicilio';
  const direccion = val('f-direccion');

  return `Hola Pastelería Los Ángeles 🎂

Quiero hacer un pedido:

*Pastel:* ${pastelSeleccionado || '—'}
*Tipo:* ${tipoSeleccionado || '—'}
*Sabor:* ${val('f-sabor') || '—'}
*Tamaño:* ${extraerTamano(pastelSeleccionado) || '—'}
*Dedicatoria:* ${val('f-dedicatoria') || 'Sin dedicatoria'}
*Recibe:* ${val('f-nombre') || '—'}
*Entrega:* ${formatearFecha()}
*Tipo de entrega:* ${entrega}${entrega === 'A domicilio' && direccion ? `\n*Dirección:* ${direccion}` : ''}

*TOTAL:* ${formatearPrecio(precioSeleccionado)}
*ANTICIPO (50%):* ${formatearPrecio(anticipoSeleccionado)}
*RESTANTE (al entregar):* ${formatearPrecio(restanteSeleccionado)}

⚠️ *Recuerda:* para que iniciemos a preparar tu pastel necesitas hacer la transferencia del 50% de anticipo a la cuenta Santander.`;
}

function enviarPorWhatsApp(){
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(construirMensaje())}`;
  window.open(url, '_blank');
}

/* ================= BOTONES EN SECCIÓN "EN EXISTENCIA" ================= */
function seleccionarSaborExistencia(nombre, precio){
  const partes = String(nombre).split('·').map(p => p.trim());
  const tipo = partes[partes.length - 1];

  const base = Object.keys(PASTELES).find(k => nombre.startsWith(k.split(' · ')[0]));

  if(!base){
    mostrarWizard();
    pastelSeleccionado = nombre;
    tipoSeleccionado = tipo;
    precioSeleccionado = precio;
    anticipoSeleccionado = Math.round(precio * PORCENTAJE_ANTICIPO);
    restanteSeleccionado = precio - anticipoSeleccionado;
    actualizarPreciosLive();
    const el = document.getElementById('f-pastel');
    if(el) el.value = nombre;
    goStep(2);
    return;
  }

  elegirPastelPedido(base);
  setTimeout(() => { seleccionarTipo(tipo, precio); }, 200);
}

/* ================= NUEVO PEDIDO ================= */
function nuevoPedido(){
  pastelSeleccionado = null;
  tipoSeleccionado = null;
  precioSeleccionado = 0;
  anticipoSeleccionado = 0;
  restanteSeleccionado = 0;

  postreSeleccionado = null;
  precioPostre = 0;
  anticipoPostre = 0;
  restantePostre = 0;

  ['f-pastel','f-tipo-display','f-sabor','f-fecha','f-nombre','f-dedicatoria','f-direccion'].forEach(id => {
    const el = document.getElementById(id);
    if(el){ el.value = ''; el.classList.remove('err'); }
  });

  ['pr-nombre','pr-telefono','pr-direccion','pr-fecha','pr-nota'].forEach(id => {
    const el = document.getElementById(id);
    if(el){ el.value = ''; el.classList.remove('err'); }
  });

  const selectSabor = document.getElementById('f-sabor');
  if(selectSabor) selectSabor.innerHTML = '<option value="">Selecciona un sabor</option>';

  const elHora = document.getElementById('f-hora');
  if(elHora) elHora.value = '17:00';

  const elHoraPostre = document.getElementById('pr-hora');
  if(elHoraPostre) elHoraPostre.value = '17:00';

  const radioDom = document.querySelector('input[name="tipo-entrega"][value="A domicilio"]');
  if(radioDom) radioDom.checked = true;

  document.querySelectorAll('.product-pick').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('.tipo-option').forEach(b => b.classList.remove('selected'));

  const grid = document.getElementById('tipoGrid');
  if(grid) grid.innerHTML = '';

  const bloque = document.getElementById('bloqueTransferenciaPostre');
  if(bloque) bloque.remove();

  const form = document.getElementById('formPedido');
  if(form) form.style.display = '';

  actualizarPreciosLive();
  goStep(1);
  ocultarWizard();
}

/* ================= COPIAR DATOS BANCARIOS ================= */
function copiarDatosBancarios(){
  const texto =
`DATOS BANCARIOS - PASTELERÍA LOS ÁNGELES
Banco: ${DATOS_BANCO.banco}
Titular: ${DATOS_BANCO.titular}
Tarjeta: ${DATOS_BANCO.tarjeta}
CLABE: ${DATOS_BANCO.clabe}

Envía tu comprobante por WhatsApp para apartar tu fecha.`;

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(texto)
      .then(() => mostrarError('✅ Datos bancarios copiados.', 'Ya puedes pegarlos donde los necesites.'))
      .catch(() => fallbackCopiar(texto));
  } else {
    fallbackCopiar(texto);
  }
}

function fallbackCopiar(texto){
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); mostrarError('✅ Datos copiados.', 'Ya puedes pegarlos donde los necesites.'); }
  catch(e){ mostrarError('No se pudieron copiar.', 'Intenta de nuevo.'); }
  document.body.removeChild(ta);
}

/* ================= FAQ ================= */
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
const menuEl = document.getElementById('menu');

if(burger && menuEl){
  burger.addEventListener('click', () => {
    const abierto = menuEl.classList.toggle('open');
    burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
}

document.querySelectorAll('#menu a').forEach(a => {
  a.addEventListener('click', () => {
    if(menuEl) menuEl.classList.remove('open');
    if(burger) burger.setAttribute('aria-expanded', 'false');
  });
});

/* ================= EVENTOS AL CARGAR ================= */
document.addEventListener('DOMContentLoaded', () => {

  const pTipo = document.getElementById('p-tipo');
  if(pTipo){
    pTipo.addEventListener('change', () => {
      const tipo = pTipo.value;
      if(tipo){
        cargarSaboresPedido(tipo);
      } else {
        resetearSaborPedido();
      }
    });
  }

  const modalCot = document.getElementById('modalCotizacion');
  if(modalCot){
    modalCot.addEventListener('click', (e) => {
      if(e.target === modalCot) cerrarModalCotizacion();
    });
  }

  const modalPed = document.getElementById('modalPedidoPastel');
  if(modalPed){
    modalPed.addEventListener('click', (e) => {
      if(e.target === modalPed) cerrarModalPedido();
    });
  }

  const modalErr = document.getElementById('modalError');
  if(modalErr){
    modalErr.addEventListener('click', (e) => {
      if(e.target === modalErr) cerrarModalError();
    });
  }

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      cerrarModalCotizacion();
      cerrarModalPedido();
      cerrarModalError();
    }
  });

  const fechaMin = calcularFechaMinima();

  const fFecha = document.getElementById('f-fecha');
  if(fFecha) fFecha.min = fechaMin;

  const cFecha = document.getElementById('c-fecha');
  if(cFecha) cFecha.min = fechaMin;

  const pFecha = document.getElementById('p-fecha');
  if(pFecha) pFecha.min = fechaMin;

  const prFecha = document.getElementById('pr-fecha');
  if(prFecha) prFecha.min = hoyISO();
});

/* ================= AÑO FOOTER ================= */
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();