/* ============================================================
   AGROMEDIC — APP.JS  v2.1
   BUGS CORREGIDOS EN ESTA VERSION:
   ✅ BUG 1: eliminado ";[]" al final de la config KONT (causaba SyntaxError fatal)
   ✅ BUG 2: DEMO_MODE cambiado a false
   ============================================================ */

'use strict';

const KONT = {
  BASE_URL:  'https://api.kont.lat',
  SLUG:      'agromedic-3',
  API_KEY:   '1abd0015-e02d-4f97-8b39-91f354c75317',
  WS_NUMBER: '584226396237',
  DEMO_MODE: false,
};
// NOTA: NO debe haber NADA después del ";" que cierra el objeto

// ─── MÓDULO API ──────────────────────────────────────────────
const KontAPI = (() => {
  const BASE  = `${KONT.BASE_URL}/api/ecommerce/${KONT.SLUG}`;
  const HEADS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KONT.API_KEY}` };

  async function request(url, opts = {}) {
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || e.error || `HTTP ${res.status}`); }
      return await res.json();
    } catch (err) { clearTimeout(timeout); throw err; }
  }

  return {
    getCatalog:        (p = {}) => { const qs = new URLSearchParams(p).toString(); return request(`${BASE}/catalogo${qs ? '?' + qs : ''}`, { headers: HEADS }); },
    getProduct:        (id)     => request(`${BASE}/catalogo/${encodeURIComponent(id)}`, { headers: HEADS }),
    getPaymentMethods: ()       => request(`${BASE}/metodos-pago`, { headers: HEADS }),
    createOrder:       (data)   => request(`${BASE}/pedidos`, { method: 'POST', headers: HEADS, body: JSON.stringify(data) }),
    getOrderStatus:    (ref)    => request(`${KONT.BASE_URL}/api/ecommerce/${KONT.SLUG}/pedidos/${encodeURIComponent(ref)}`),
  };
})();

// ─── DEMO DATA ───────────────────────────────────────────────
const DEMO_CATALOG = [
  { id: 1, nombre: 'Suplemento Mineral FOS', categoria: 'ganado', precio: 15.50, precio_mayorista: 12.00, imagen: 'img/prueba-agro.jpg', descripcion: 'Suplemento mineral de alta concentración con FOS para bovinos.', etiquetas: ['ganado','suplemento','destacado'], disponible: true, destacado: true },
  { id: 2, nombre: 'Shampoo Antialergia Pet', categoria: 'mascotas', precio: 8.99, precio_mayorista: 7.00, imagen: 'img/prueba-agro-2.png', descripcion: 'Fórmula dermatológica libre de parabenos para piel sensible.', etiquetas: ['mascotas','higiene'], disponible: true, destacado: false },
  { id: 3, nombre: 'Ivermectina Forte 3.5%', categoria: 'ganado', precio: 22.00, precio_mayorista: 18.00, imagen: 'img/prueba-agro-3.jpeg', descripcion: 'Antiparasitario de amplio espectro para bovinos, equinos y ovinos.', etiquetas: ['ganado','medicina','destacado'], disponible: true, destacado: true },
  { id: 4, nombre: 'Antipulgas Plus 4en1', categoria: 'mascotas', precio: 12.00, precio_mayorista: 9.50, imagen: 'img/prueba-agro-4.webp', descripcion: 'Elimina pulgas, garrapatas, piojos y ácaros en 24 horas.', etiquetas: ['mascotas','medicina'], disponible: true, destacado: false },
];

const DEMO_PAYMENT_METHODS = [
  { method_key: 'PAGO_MOVIL', label: 'Pago Móvil', sort_order: 0, account_data: { banco: 'Banesco', telefono: '0412-XXXXXXX', cedula: 'J-XXXXXXXX', titular: 'Agromedic CA' }, fields_config: [{ key: 'banco_origen', label: 'Banco de origen', type: 'select-bancos', required: true }, { key: 'telefono', label: 'Teléfono que pagó', type: 'tel', required: true }, { key: 'referencia', label: 'Últimos 8 dígitos de ref', type: 'text', required: true }] },
  { method_key: 'TRANSFERENCIA', label: 'Transferencia', sort_order: 1, account_data: { banco: 'Mercantil', cuenta: '0105-XXXX', rif: 'J-XXXXXXXX', titular: 'Agromedic CA' }, fields_config: [{ key: 'banco_origen', label: 'Banco de origen', type: 'select-bancos', required: true }, { key: 'referencia', label: 'Número de referencia', type: 'text', required: true }] },
  { method_key: 'ZELLE', label: 'Zelle', sort_order: 2, account_data: { email: 'pagos@agromedic.com', titular: 'Agromedic' }, fields_config: [{ key: 'referencia', label: 'Nombre de quien envió', type: 'text', required: true }] },
  { method_key: 'CRIPTO', label: 'Cripto (USDT)', sort_order: 3, account_data: { red: 'TRC20', wallet: 'TXXXxxxxxx...', moneda: 'USDT' }, fields_config: [{ key: 'hash_tx', label: 'Hash de la transacción', type: 'text', required: true }] },
];

const ESTADOS_VE = {
  "Aragua":["Maracay","Turmero","La Victoria","Cagua"],"Bolívar":["Ciudad Bolívar","Ciudad Guayana"],
  "Carabobo":["Valencia","Puerto Cabello","Guacara","San Diego","Naguanagua"],"Anzoátegui":["Barcelona","Puerto La Cruz","El Tigre"],
  "Distrito Capital":["Caracas"],"Falcón":["Coro","Punto Fijo"],"Lara":["Barquisimeto","Cabudare","Carora"],
  "Miranda":["Los Teques","Guarenas","Guatire","Cúa"],"Monagas":["Maturín"],"Nueva Esparta":["Porlamar","Pampatar"],
  "Táchira":["San Cristóbal","Táriba"],"Trujillo":["Trujillo","Valera"],"Zulia":["Maracaibo","Cabimas","San Francisco"],
};

const BANCOS_VE = ["Banco de Venezuela","Banesco","Mercantil","BBVA Provincial","BNC","Bicentenario","Fondo Común","Bancaribe","BOD","Banco del Tesoro","Bancrecer","Banplus","Sofitasa"];

// ─── ESTADO GLOBAL ───────────────────────────────────────────
const STATE = { carrito: JSON.parse(localStorage.getItem('agro_carrito') || '[]'), productos: [], paymentMethods: [] };

// ─── UTILIDADES ──────────────────────────────────────────────
const $      = (sel, ctx = document) => ctx.querySelector(sel);
const $$     = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt    = (n) => `$${Number(n).toFixed(2)}`;
const safeHtml = (str) => { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; };
const guardarCarrito = () => localStorage.setItem('agro_carrito', JSON.stringify(STATE.carrito));
const getTotalCarrito = () => STATE.carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
const generarIdLocal = () => 'AGR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();

// ─── CATÁLOGO ────────────────────────────────────────────────
async function cargarProductos(params = {}) {
  if (KONT.DEMO_MODE) { STATE.productos = DEMO_CATALOG; return { data: DEMO_CATALOG, meta: { total: DEMO_CATALOG.length, categorias: ['ganado','mascotas'] } }; }
  try {
    const resp = await KontAPI.getCatalog(params);
    STATE.productos = resp.data || [];
    return resp;
  } catch (err) {
    console.warn('[Agromedic] API no disponible — modo demo:', err.message);
    STATE.productos = DEMO_CATALOG;
    return { data: DEMO_CATALOG, meta: { total: DEMO_CATALOG.length, categorias: [] } };
  }
}

// ─── MÉTODOS DE PAGO ─────────────────────────────────────────
async function cargarMetodosPago() {
  if (KONT.DEMO_MODE) { STATE.paymentMethods = DEMO_PAYMENT_METHODS; return DEMO_PAYMENT_METHODS; }
  try { const resp = await KontAPI.getPaymentMethods(); STATE.paymentMethods = resp.data || []; return resp.data; }
  catch (err) { console.warn('[Agromedic] Métodos de pago API no disponible:', err.message); STATE.paymentMethods = DEMO_PAYMENT_METHODS; return DEMO_PAYMENT_METHODS; }
}

function renderMetodosPago(metodos) {
  const btnWrap = $('#pago-metodos-btns'), camposWrap = $('#pago-campos-wrapper');
  if (!btnWrap && !camposWrap) return;
  const iconos = { PAGO_MOVIL:'phone-fill', TRANSFERENCIA:'bank', ZELLE:'currency-dollar', CRIPTO:'currency-bitcoin', EFECTIVO:'cash-coin' };
  if (btnWrap) btnWrap.innerHTML = metodos.map((m,i) => `<button type="button" class="pago-metodo-btn${i===0?' activo':''}" data-metodo="${safeHtml(m.method_key)}" aria-pressed="${i===0}"><i class="bi bi-${iconos[m.method_key]||'credit-card'}"></i><span>${safeHtml(m.label)}</span></button>`).join('');
  if (camposWrap) camposWrap.innerHTML = metodos.map((m,i) => {
    const cuenta = Object.entries(m.account_data||{}).map(([k,v]) => `<tr><th>${safeHtml(k)}</th><td><strong>${safeHtml(v)}</strong></td></tr>`).join('');
    const campos = (m.fields_config||[]).map(f => {
      const n = `pago_${m.method_key.toLowerCase()}_${f.key}`, req = f.required?'required':'';
      return f.type==='select-bancos'
        ? `<div class="form-group"><label for="${n}">${safeHtml(f.label)}${f.required?' <span class="req">*</span>':''}</label><select id="${n}" name="${n}" class="form-control" ${req}><option value="">Selecciona banco</option>${BANCOS_VE.map(b=>`<option value="${safeHtml(b)}">${safeHtml(b)}</option>`).join('')}</select></div>`
        : `<div class="form-group"><label for="${n}">${safeHtml(f.label)}${f.required?' <span class="req">*</span>':''}</label><input type="${f.type||'text'}" id="${n}" name="${n}" class="form-control" autocomplete="off" ${req}></div>`;
    }).join('');
    return `<div class="pago-campos${i===0?' visible':''}" id="pago-campos-${safeHtml(m.method_key)}">${cuenta?`<div class="pago-cuenta-info"><p class="pago-cuenta-titulo"><i class="bi bi-info-circle"></i> Datos para el pago</p><table class="pago-cuenta-table">${cuenta}</table></div>`:''}<div class="pago-campos-fields">${campos}</div></div>`;
  }).join('');
  $$('.pago-metodo-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.pago-metodo-btn').forEach(b => { b.classList.remove('activo'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('activo'); btn.setAttribute('aria-pressed','true');
    $$('.pago-campos').forEach(c => c.classList.remove('visible'));
    const c = $(`#pago-campos-${btn.dataset.metodo}`); if (c) c.classList.add('visible');
  }));
}

// ─── CHECKOUT ────────────────────────────────────────────────
function initCheckoutForm() {
  const form = $('#checkout-form'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const ma = $('.pago-metodo-btn.activo'); if (!ma) { showToast('Selecciona un método de pago','error'); return; }
    const btn = $('#btn-checkout-submit'), origHTML = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Procesando...';
    const fd = new FormData(form), metodo = ma.dataset.metodo, datosPago = {};
    const ca = $(`#pago-campos-${metodo}`);
    if (ca) $$('input,select',ca).forEach(inp => { if(inp.name) datosPago[inp.name.replace(`pago_${metodo.toLowerCase()}_`,'')] = inp.value; });
    const payload = { customer: { nombre: fd.get('nombre'), telefono: fd.get('telefono'), email: fd.get('email')||null, estado: fd.get('estado'), ciudad: fd.get('ciudad'), direccion: fd.get('direccion')||null }, items: STATE.carrito.map(i => ({ product_id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })), metodo_pago: metodo, datos_pago: datosPago, notas: fd.get('notas')||'' };
    try {
      let data;
      if (KONT.DEMO_MODE) { await new Promise(r=>setTimeout(r,1200)); data = { ok:true, data: { id: Math.floor(Math.random()*9000)+1000, ref: generarIdLocal(), status:'PENDIENTE', total_usd: getTotalCarrito() } }; }
      else data = await KontAPI.createOrder(payload);
      if (!data.ok) throw new Error(data.message||'Error del servidor');
      STATE.carrito = []; guardarCarrito(); actualizarContadorCarrito();
      const confirmacion = $('#confirmacion-pedido'), layout = $('#carrito-layout');
      if (layout) layout.style.display = 'none';
      if (confirmacion) { confirmacion.style.display = 'block'; const refEl = $('#confirmacion-ref'); if (refEl) refEl.textContent = data.data.ref; confirmacion.scrollIntoView({ behavior:'smooth', block:'start' }); }
    } catch (err) {
      console.error('[Checkout] Error:', err.message);
      showToast('Error al registrar el pedido. Redirigiendo a WhatsApp...', 'error');
      setTimeout(() => { const msg = encodeURIComponent(`*PEDIDO AGROMEDIC*\nCliente: ${payload.customer.nombre}\nTel: ${payload.customer.telefono}\nProductos: ${STATE.carrito.map(i=>`${i.cantidad}× ${i.nombre}`).join(', ')}\nTotal: ${fmt(getTotalCarrito())}\nMétodo: ${metodo}`); window.open(`https://wa.me/${KONT.WS_NUMBER}?text=${msg}`,'_blank'); }, 1500);
    } finally { btn.disabled = false; btn.innerHTML = origHTML; }
  });
}

// ─── CARRITO ─────────────────────────────────────────────────
function actualizarContadorCarrito() {
  const total = STATE.carrito.reduce((s,i)=>s+i.cantidad,0);
  $$('.contador-carrito').forEach(el => { el.textContent = total; el.classList.toggle('tiene-items', total > 0); });
}

function agregarAlCarrito(producto, cantidad = 1) {
  const existente = STATE.carrito.find(i => i.id === producto.id);
  if (existente) existente.cantidad = Math.min(existente.cantidad + cantidad, 99);
  else STATE.carrito.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen || '', cantidad });
  guardarCarrito(); actualizarContadorCarrito();
  showToast(`${cantidad > 1 ? cantidad + '× ' : ''}${producto.nombre} añadido al carrito`, 'success');
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg, tipo = 'info') {
  const toast = $('#toast-global'); if (!toast) return;
  const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill', warning:'bi-exclamation-triangle-fill' };
  toast.className = `toast toast-${tipo}`;
  const ico = $('#toast-icono'), txt = $('#toast-texto');
  if (ico) ico.className = `bi ${icons[tipo]||icons.info} toast__icon`;
  if (txt) txt.textContent = msg;
  toast.classList.add('visible'); clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

// ─── GEO SELECTS ─────────────────────────────────────────────
function initGeoSelects() {
  const selE = $('#select-estado'), selC = $('#select-ciudad'); if (!selE||!selC) return;
  Object.keys(ESTADOS_VE).sort().forEach(e => selE.innerHTML += `<option value="${safeHtml(e)}">${safeHtml(e)}</option>`);
  selE.addEventListener('change', () => { selC.innerHTML = '<option value="">Selecciona tu Ciudad *</option>'; if (selE.value && ESTADOS_VE[selE.value]) ESTADOS_VE[selE.value].sort().forEach(c => selC.innerHTML += `<option value="${safeHtml(c)}">${safeHtml(c)}</option>`); });
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  actualizarContadorCarrito();
  initGeoSelects();
  if ($('#pago-metodos-btns') || $('#pago-campos-wrapper')) {
    const metodos = await cargarMetodosPago();
    if (metodos?.length) renderMetodosPago(metodos);
  }
  if ($('#checkout-form')) initCheckoutForm();
});

// ─── EXPORTS GLOBALES ────────────────────────────────────────
window.KONT = KONT; window.KontAPI = KontAPI; window.STATE = STATE;
window.DEMO_CATALOG = DEMO_CATALOG; window.BANCOS_VE = BANCOS_VE;
window.showToast = showToast; window.agregarAlCarrito = agregarAlCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.cargarProductos = cargarProductos; window.safeHtml = safeHtml; window.fmt = fmt;
