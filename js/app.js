/* ============================================================
   AGROMEDIC - APP.JS  v2.1 FINAL
   Fixes: ;[] removido, DEMO_MODE:false, todas las funciones UI incluidas
   ============================================================ */
'use strict';

const KONT = {
  BASE_URL:  'https://api.kont.lat',
  SLUG:      'agromedic-3',
  API_KEY:   '1abd0015-e02d-4f97-8b39-91f354c75317',
  WS_NUMBER: '584226396237',
  DEMO_MODE: false,
};

// === MÓDULO API =====================================================
const KontAPI = (() => {
  const BASE  = KONT.BASE_URL + '/api/ecommerce/' + KONT.SLUG;
  const HEADS = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KONT.API_KEY };
  async function request(url, opts = {}) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || e.error || 'HTTP ' + res.status); }
      return await res.json();
    } catch (err) { clearTimeout(t); throw err; }
  }
  return {
    getCatalog: (p = {}) => { const qs = new URLSearchParams(p).toString(); return request(BASE + '/catalogo' + (qs ? '?' + qs : ''), { headers: HEADS }); },
    getProduct: (id) => request(BASE + '/catalogo/' + encodeURIComponent(id), { headers: HEADS }),
    getPaymentMethods: () => request(BASE + '/metodos-pago', { headers: HEADS }),
    createOrder: (data) => request(BASE + '/pedidos', { method: 'POST', headers: HEADS, body: JSON.stringify(data) }),
    getOrderStatus: (ref) => request(KONT.BASE_URL + '/api/ecommerce/' + KONT.SLUG + '/pedidos/' + encodeURIComponent(ref)),
  };
})();

// === DEMO DATA ======================================================
const DEMO_CATALOG = [
  { id: 1, nombre: 'Suplemento Mineral FOS', categoria: 'ganado', precio: 15.50, imagen: 'img/productos/organew-pet-suplemento-removebg-preview.png', descripcion: 'Suplemento mineral de alta concentracion con FOS para bovinos.', etiquetas: ['ganado','suplemento','destacado'], disponible: true, destacado: true },
  { id: 2, nombre: 'Shampoo Antialergia Pet', categoria: 'mascotas', precio: 8.99, imagen: 'img/productos/champu-pet-care.png-removebg-preview.png', descripcion: 'Formula dermatologica libre de parabenos para piel sensible.', etiquetas: ['mascotas','higiene'], disponible: true, destacado: false },
  { id: 3, nombre: 'Ivermectina Forte 3.5%', categoria: 'ganado', precio: 22.00, imagen: 'img/productos/rich_0005s_0003_Prazoquntel-removebg-preview.png', descripcion: 'Antiparasitario de amplio espectro para bovinos, equinos y ovinos.', etiquetas: ['ganado','medicina','destacado'], disponible: true, destacado: true },
  { id: 4, nombre: 'Antipulgas Plus 4en1', categoria: 'mascotas', precio: 12.00, imagen: 'img/productos/antipulgas-removebg-preview.png', descripcion: 'Elimina pulgas, garrapatas, piojos y acaros en 24 horas.', etiquetas: ['mascotas','medicina'], disponible: true, destacado: false },
];
const DEMO_PAYMENT_METHODS = [
  { method_key: 'PAGO_MOVIL', label: 'Pago Movil', sort_order: 0, account_data: { banco: 'Banesco', telefono: '0412-XXXXXXX', cedula: 'V-XXXXXXXX', titular: 'Agromedic CA' }, fields_config: [{ key: 'banco_origen', label: 'Banco de origen', type: 'select-bancos', required: true },{ key: 'telefono', label: 'Telefono que pago', type: 'tel', required: true },{ key: 'referencia', label: 'Ultimos 8 digitos', type: 'text', required: true }] },
  { method_key: 'TRANSFERENCIA', label: 'Transferencia', sort_order: 1, account_data: { banco: 'Mercantil', cuenta: '0105-XXXX', rif: 'J-XXXXXXXX', titular: 'Agromedic CA' }, fields_config: [{ key: 'banco_origen', label: 'Banco de origen', type: 'select-bancos', required: true },{ key: 'referencia', label: 'Numero de referencia', type: 'text', required: true }] },
  { method_key: 'ZELLE', label: 'Zelle', sort_order: 2, account_data: { email: 'pagos@agromedic.com', titular: 'Agromedic' }, fields_config: [{ key: 'referencia', label: 'Nombre de quien envio', type: 'text', required: true }] },
  { method_key: 'CRIPTO', label: 'Cripto (USDT)', sort_order: 3, account_data: { red: 'TRC20', wallet: 'TXXXXxxxxxx...', moneda: 'USDT' }, fields_config: [{ key: 'hash_tx', label: 'Hash de la transaccion', type: 'text', required: true }] },
];

const ESTADOS_VE = {
  "Aragua":["Maracay","Turmero","La Victoria","Cagua"],"Anzoategui":["Barcelona","Puerto La Cruz","El Tigre"],"Bolivar":["Ciudad Bolivar","Ciudad Guayana","Upata"],"Carabobo":["Valencia","Puerto Cabello","Guacara","San Diego","Naguanagua"],"Distrito Capital":["Caracas"],"Falcon":["Coro","Punto Fijo"],"Guarico":["San Juan de los Morros","Valle de la Pascua","Calabozo"],"Lara":["Barquisimeto","Cabudare","Carora"],"Merida":["Merida","El Vigia","Tovar"],"Miranda":["Los Teques","Guarenas","Guatire","Cua"],"Monagas":["Maturin","Punta de Mata"],"Nueva Esparta":["Porlamar","Pampatar"],"Portuguesa":["Guanare","Acarigua","Araure"],"Sucre":["Cumana","Carupano"],"Tachira":["San Cristobal","Tariba","Rubio"],"Trujillo":["Trujillo","Valera"],"Yaracuy":["San Felipe","Chivacoa"],"Zulia":["Maracaibo","Cabimas","San Francisco"],"Barinas":["Barinas","Barinitas"],"Cojedes":["San Carlos"],"La Guaira":["La Guaira","Maiquetia"],"Amazonas":["Puerto Ayacucho"],"Apure":["San Fernando de Apure"],"Delta Amacuro":["Tucupita"],
};
const BANCOS_VE = ["Banco de Venezuela","Banesco","Mercantil","BBVA Provincial","BNC","Bicentenario","Fondo Comun","Bancaribe","BOD","Banco del Tesoro","Bancrecer","Banplus","Sofitasa"];

// === ESTADO GLOBAL ==================================================
const STATE = {
  carrito:        JSON.parse(localStorage.getItem('agro_carrito') || '[]'),
  productos:      [],
  paymentMethods: [],
  filtroCateg:    'todos',
  busqueda:       '',
  cargando:       false,
};

// === UTILIDADES =====================================================
const $        = (sel, ctx) => (ctx || document).querySelector(sel);
const $$       = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];
const fmt      = (n) => '$' + Number(n || 0).toFixed(2);
const safeHtml = (str) => { const d = document.createElement('div'); d.textContent = str == null ? '' : str; return d.innerHTML; };
const guardarCarrito   = () => localStorage.setItem('agro_carrito', JSON.stringify(STATE.carrito));
const getTotalCarrito  = () => STATE.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
const generarIdLocal   = () => 'AGR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();

// === CARRITO =======================================================
function actualizarContadorCarrito() {
  const n = STATE.carrito.reduce((s, i) => s + i.cantidad, 0);
  $$('.contador-carrito').forEach(el => { el.textContent = n; el.classList.toggle('tiene-items', n > 0); });
}

function agregarAlCarrito(producto, cantidad) {
  cantidad = cantidad || 1;
  const ex = STATE.carrito.find(i => String(i.id)===String(producto.id));
  if (ex) ex.cantidad = Math.min(ex.cantidad + cantidad, 99);
  else STATE.carrito.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen || '', cantidad: cantidad });
  guardarCarrito();
  actualizarContadorCarrito();
  showToast((cantidad > 1 ? cantidad + 'x ' : '') + producto.nombre + ' anadido al carrito', 'success');
}

function renderListaCarrito() {
  var _f=document.getElementById("checkout-form");if(_f)_f.style.display=STATE.carrito.length>0?"block":"none";
  const lista  = document.getElementById('carrito-lista');
  const subEl  = document.getElementById('subtotal-carrito');
  const totEl  = document.getElementById('total-carrito');
  if (!lista) return;
  if (STATE.carrito.length === 0) {
    lista.innerHTML = '<p class="carrito-vacio">Tu carrito esta vacio.</p>';
    if (subEl) subEl.textContent = fmt(0);
    if (totEl) totEl.textContent = fmt(0);
    return;
  }
  lista.innerHTML = STATE.carrito.map(item =>
    '<div class="carrito-item" data-id="' + item.id + '">' +
    '<img src="' + safeHtml(item.imagen || 'img/placeholder.png') + '" alt="' + safeHtml(item.nombre) + '" class="carrito-item__img" onerror="this.src=\'img/placeholder.png\'">' +
    '<div class="carrito-item__info"><h4 class="carrito-item__nombre">' + safeHtml(item.nombre) + '</h4>' +
    '<p class="carrito-item__precio">' + fmt(item.precio) + '</p></div>' +
    '<div class="carrito-item__acciones">' +
    '<button type="button" class="btn-qty minus" onclick="cambiarCantidadLocal(' + item.id + ',-1)">-</button>' +
    '<span class="carrito-item__cant">' + item.cantidad + '</span>' +
    '<button type="button" class="btn-qty plus" onclick="cambiarCantidadLocal(' + item.id + ',1)">+</button>' +
    '<button type="button" class="btn-eliminar" onclick="eliminarDelCarritoLocal(' + item.id + ')"><i class="bi bi-trash"></i></button>' +
    '</div></div>'
  ).join('');
  const t = getTotalCarrito();
  if (subEl) subEl.textContent = fmt(t);
  if (totEl) totEl.textContent = fmt(t);
}

window.cambiarCantidadLocal = function(id, delta) {
  const item = STATE.carrito.find(i => String(i.id)===String(id));
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) STATE.carrito = STATE.carrito.filter(i => String(i.id)!==String(id));
  guardarCarrito(); actualizarContadorCarrito(); renderListaCarrito();
};
window.eliminarDelCarritoLocal = function(id) {
  STATE.carrito = STATE.carrito.filter(i => String(i.id)!==String(id));
  guardarCarrito(); actualizarContadorCarrito(); renderListaCarrito();
};

// === CATÁLOGO ======================================================
async function cargarProductos(params) {
  params = params || {};
  STATE.cargando = true;
  if (KONT.DEMO_MODE) {
    STATE.productos = DEMO_CATALOG; STATE.cargando = false;
    return { data: DEMO_CATALOG, meta: { total: DEMO_CATALOG.length, categorias: ['ganado','mascotas'] } };
  }
  try {
    const resp = await KontAPI.getCatalog(params);
    STATE.productos = resp.data || []; STATE.cargando = false;
    return resp;
  } catch (err) {
    console.warn('[Agromedic] API no disponible - modo demo:', err.message);
    STATE.productos = DEMO_CATALOG; STATE.cargando = false;
    return { data: DEMO_CATALOG, meta: { total: DEMO_CATALOG.length, categorias: [] } };
  }
}

function renderCatalogo(productos, containerId) {
  // Busca el contenedor específico (ej. productos-destacados-grid en el index) o usa el del catálogo por defecto
  const targetId = containerId || 'catalogo-grid';
  const grid = document.getElementById(targetId) || document.querySelector('[data-catalogo]');
  
  if (!grid) return;
  
  // Estado vacío estructurado con tus clases
  if (!productos || productos.length === 0) {
    grid.innerHTML = `
      <div class="productos-vacio">
        <i class="bi bi-inbox productos-vacio__icono"></i>
        <h3 class="productos-vacio__titulo">No hay productos</h3>
        <p class="productos-vacio__desc">No encontramos resultados para mostrar en esta sección.</p>
      </div>`;
    return;
  }
  
  grid.innerHTML = '';
  
  productos.forEach(function(prod) {
    const art = document.createElement('article');
    art.className = 'tarjeta-producto animada';
    art.dataset.id = prod.id;
    art.dataset.categoria = (prod.categoria || '').toLowerCase();
    
    const imgSrc = prod.imagen || 'img/placeholder.png';
    
    // Armar los badges dinámicamente
    let badgesHtml = '';
    if (prod.destacado) {
      badgesHtml += '<span class="badge badge-destacado"><i class="bi bi-star-fill"></i> Destacado</span>';
    }
    
    // Inyectamos el HTML usando EXACTAMENTE las clases de tu nuevo CSS
    art.innerHTML = `
      <div class="tarjeta__img-wrap">
        <img src="${safeHtml(imgSrc)}" alt="${safeHtml(prod.nombre)}" loading="lazy">
        <div class="tarjeta__badges">
          ${badgesHtml}
        </div>
      </div>
      <div class="tarjeta__body">
        <div style="margin-bottom: 4px;">
          <span class="badge badge-categoria">${safeHtml((prod.categoria || '').toUpperCase())}</span>
        </div>
        <h3 class="tarjeta__nombre">${safeHtml(prod.nombre)}</h3>
        <p class="tarjeta__desc">${safeHtml(prod.descripcion || 'Producto certificado para el cuidado animal.')}</p>
        <div class="tarjeta__precio">${fmt(prod.precio)}</div>
        <div class="tarjeta__footer">
          <button type="button" class="btn btn-primary btn-agregar-carrito">
            <i class="bi bi-cart-plus"></i> Agregar
          </button>
          <button type="button" class="btn btn-secondary btn-ver-detalle">
            <i class="bi bi-eye"></i> <span class="btn-label">Ver</span>
          </button>
        </div>
      </div>
    `;
    
    // Lógica del botón de carrito
    const btn = art.querySelector('.btn-agregar-carrito');
    if (prod.disponible === false) {
      btn.disabled = true; 
      btn.innerHTML = '<i class="bi bi-x-circle"></i> Agotado';
      btn.style.background = 'var(--c-surface-2)';
      btn.style.color = 'var(--c-text-muted)';
      btn.style.borderColor = 'var(--c-border)';
    } else {
      btn.addEventListener('click', function() {
        agregarAlCarrito({ id: prod.id, nombre: prod.nombre, precio: prod.precio, imagen: imgSrc });
        btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> Añadido';
        btn.classList.add('en-carrito');
        setTimeout(function() { 
          btn.innerHTML = '<i class="bi bi-cart-plus"></i> Agregar'; 
          btn.classList.remove('en-carrito');
        }, 2000);
      });
    }
    
    grid.appendChild(art);
  });
  
  // Disparar las animaciones de scroll si existen
  if(typeof initScrollAnimations === 'function') initScrollAnimations();
}

// === MÉTODOS DE PAGO ===============================================
async function cargarMetodosPago() {
  if (KONT.DEMO_MODE) { STATE.paymentMethods = DEMO_PAYMENT_METHODS; return DEMO_PAYMENT_METHODS; }
  try {
    const resp = await KontAPI.getPaymentMethods();
    STATE.paymentMethods = resp.data || [];
    return resp.data;
  } catch (err) {
    console.warn('[Agromedic] Metodos pago no disponibles:', err.message);
    STATE.paymentMethods = DEMO_PAYMENT_METHODS;
    return DEMO_PAYMENT_METHODS;
  }
}

function metodoPagoIcon(key) {
  const icons = { PAGO_MOVIL:'phone-fill', TRANSFERENCIA:'bank', ZELLE:'currency-dollar', CRIPTO:'currency-bitcoin', EFECTIVO:'cash-coin' };
  return icons[key] || 'credit-card';
}

function renderAccountInfo(data) {
  if (!data || !Object.keys(data).length) return '';
  const rows = Object.entries(data).map(([k,v]) => '<tr><th>' + safeHtml(k) + '</th><td><strong>' + safeHtml(v) + '</strong></td></tr>').join('');
  return '<div class="pago-cuenta-info"><p class="pago-cuenta-titulo"><i class="bi bi-info-circle"></i> Datos para el pago</p><table class="pago-cuenta-table">' + rows + '</table></div>';
}

function renderPaymentFields(fieldsConfig, methodKey) {
  if (!Array.isArray(fieldsConfig) || !fieldsConfig.length) return '';
  const html = fieldsConfig.map(f => {
    const n   = 'pago_' + methodKey.toLowerCase() + '_' + f.key;
    const req = f.required ? 'required' : '';
    const lbl = safeHtml(f.label) + (f.required ? ' <span class="req">*</span>' : '');
    if (f.type === 'select-bancos') {
      const opts = BANCOS_VE.map(b => '<option value="' + safeHtml(b) + '">' + safeHtml(b) + '</option>').join('');
      return '<div class="form-group"><label for="' + n + '">' + lbl + '</label><select id="' + n + '" name="' + n + '" class="form-control" ' + req + '><option value="">Selecciona banco</option>' + opts + '</select></div>';
    }
    return '<div class="form-group"><label for="' + n + '">' + lbl + '</label><input type="' + (f.type||'text') + '" id="' + n + '" name="' + n + '" class="form-control" autocomplete="off" ' + req + '></div>';
  }).join('');
  return '<div class="pago-campos-fields">' + html + '</div>';
}

function bindMetodosPago() {
  $$('.pago-metodo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pago-metodo-btn').forEach(b => { b.classList.remove('activo'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('activo'); btn.setAttribute('aria-pressed','true');
      $$('.pago-campos').forEach(c => c.classList.remove('visible'));
      const c = document.getElementById('pago-campos-' + btn.dataset.metodo);
      if (c) c.classList.add('visible');
    });
  });
}

function renderMetodosPago(metodos) {
  const container = document.getElementById('pago-metodos-container');
  if (!container) return;
  const btnWrap    = document.getElementById('pago-metodos-btns');
  const camposWrap = document.getElementById('pago-campos-wrapper');
  if (btnWrap) {
    btnWrap.innerHTML = metodos.map((m,i) =>
      '<button type="button" class="pago-metodo-btn' + (i===0?' activo':'') + '" data-metodo="' + safeHtml(m.method_key) + '" aria-pressed="' + (i===0) + '">' +
      '<i class="bi bi-' + metodoPagoIcon(m.method_key) + '"></i><span>' + safeHtml(m.label) + '</span></button>'
    ).join('');
  }
  if (camposWrap) {
    camposWrap.innerHTML = metodos.map((m,i) =>
      '<div class="pago-campos' + (i===0?' visible':'') + '" id="pago-campos-' + safeHtml(m.method_key) + '" data-metodo="' + safeHtml(m.method_key) + '">' +
      renderAccountInfo(m.account_data) + renderPaymentFields(m.fields_config, m.method_key) + '</div>'
    ).join('');
  }
  bindMetodosPago();
}

// === CHECKOUT ======================================================
function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const metodoBtnActivo = $('.pago-metodo-btn.activo');
    if (!metodoBtnActivo) { showToast('Selecciona un metodo de pago', 'error'); return; }
    const btnSubmit = document.getElementById('btn-checkout-submit');
    const origHTML  = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner"></div> Procesando...';
    const fd     = new FormData(form);
    const metodo = metodoBtnActivo.dataset.metodo;
    const datosPago = {};
    const camposActivos = document.getElementById('pago-campos-' + metodo);
    if (camposActivos) {
      $$('input, select', camposActivos).forEach(inp => {
        if (inp.name) datosPago[inp.name.replace('pago_' + metodo.toLowerCase() + '_', '')] = inp.value;
      });
    }
    const payload = {
      customer: { nombre: fd.get('nombre'), telefono: fd.get('telefono'), email: fd.get('email')||null, estado: fd.get('estado'), ciudad: fd.get('ciudad'), direccion: fd.get('direccion')||null },
      items: STATE.carrito.map(i => ({ product_id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
      metodo_pago: metodo, datos_pago: datosPago, notas: fd.get('notas') || '',
    };
    try {
      let data;
      if (KONT.DEMO_MODE) {
        await new Promise(r => setTimeout(r, 1200));
        data = { ok: true, data: { ref: generarIdLocal(), status: 'PENDIENTE', total_usd: getTotalCarrito(), message: 'Pedido recibido. Pronto te contactaremos.' } };
      } else {
        data = await KontAPI.createOrder(payload);
      }
      if (!data.ok) throw new Error(data.message || 'Error del servidor');
      STATE.carrito = []; guardarCarrito(); actualizarContadorCarrito();
      finalizarPedido(data.data.ref, payload, data.data);
    } catch (err) {
      console.error('[Checkout] Error:', err.message);
      const localRef = generarIdLocal();
      if (!KONT.DEMO_MODE) {
        showToast('No pudimos registrar tu pedido. Redirigiendo a WhatsApp...', 'info');
        setTimeout(() => {
          const msg = encodeURIComponent('*PEDIDO AGROMEDIC* Ref: ' + localRef + '\nCliente: ' + payload.customer.nombre + '\nTel: ' + payload.customer.telefono + '\nTotal: ' + fmt(getTotalCarrito()) + '\nMetodo: ' + metodo);
          window.open('https://wa.me/' + KONT.WS_NUMBER + '?text=' + msg, '_blank');
        }, 2000);
      }
      finalizarPedido(localRef, payload, null, true);
    } finally { btnSubmit.disabled = false; btnSubmit.innerHTML = origHTML; }
  });
}

function finalizarPedido(ref, orden, pedidoData, isLocal) {
  const confirmacion = document.getElementById('confirmacion-pedido');
  const layout       = document.getElementById('carrito-layout');
  if (layout)       layout.style.display      = 'none';
  if (confirmacion) confirmacion.style.display = 'block';
  const refEl    = document.getElementById('confirmacion-ref');
  const statusEl = document.getElementById('confirmacion-status');
  if (refEl)    refEl.textContent    = ref;
  if (statusEl) statusEl.textContent = isLocal ? 'Pedido guardado localmente - contactaremos pronto' : (pedidoData && pedidoData.message ? pedidoData.message : 'Pedido recibido correctamente!');
  if (confirmacion) confirmacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === TOAST =========================================================
function showToast(msg, tipo) {
  tipo = tipo || 'info';
  const toast = document.getElementById('toast-global');
  if (!toast) return;
  const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill', warning:'bi-exclamation-triangle-fill' };
  toast.className = 'toast toast-' + tipo;
  const ico = document.getElementById('toast-icono');
  const txt = document.getElementById('toast-texto');
  if (ico) ico.className   = 'bi ' + (icons[tipo] || icons.info) + ' toast__icon';
  if (txt) txt.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

// === UI - TEMA, HEADER, DRAWER, ANIMACIONES ========================
function initThemeToggle() {
  const btn     = document.getElementById('btn-theme-toggle');
  const icon    = document.getElementById('theme-icon');
  const htmlEl  = document.documentElement;
  const saved   = localStorage.getItem('agromedic_theme') || 'light';
  htmlEl.setAttribute('data-theme', saved);
  _applyThemeIcon(icon, saved);
  if (btn) {
    btn.addEventListener('click', () => {
      const next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      htmlEl.setAttribute('data-theme', next);
      localStorage.setItem('agromedic_theme', next);
      _applyThemeIcon(icon, next);
    });
  }
}
function _applyThemeIcon(icon, theme) {
  if (!icon) return;
  icon.classList.toggle('bi-sun-fill',  theme === 'dark');
  icon.classList.toggle('bi-moon-fill', theme !== 'dark');
}

function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__link, .nav-drawer__link').forEach(l => {
    const href = l.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) l.classList.add('activo');
  });
}

function initDrawer() {
  const btnMenu = document.getElementById('btn-menu');
  const drawer  = document.getElementById('nav-drawer');
  if (!btnMenu || !drawer) return;
  const overlay = drawer.querySelector('.nav-drawer__overlay');
  const toggle  = (open) => {
    btnMenu.classList.toggle('abierto', open);
    drawer.classList.toggle('abierto', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  btnMenu.addEventListener('click', () => toggle(!drawer.classList.contains('abierto')));
  if (overlay) overlay.addEventListener('click', () => toggle(false));
  $$('.nav-drawer__link', drawer).forEach(l => l.addEventListener('click', () => toggle(false)));
  document.addEventListener('keydown', e => e.key === 'Escape' && toggle(false));
}

function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  $$('.tarjeta-producto, .categoria-card, .feature-item, .banner-cta').forEach((el, i) => {
    el.style.opacity = '0'; el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.4s ease ' + (i * 40) + 'ms, transform 0.4s ease ' + (i * 40) + 'ms';
    io.observe(el);
  });
}

function animarContadores() {
  $$('.hero__stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target), suffix = el.dataset.suffix || '';
    let current = 0; const step = Math.ceil(target / 60);
    const t = setInterval(() => { current = Math.min(current + step, target); el.textContent = current.toLocaleString() + suffix; if (current >= target) clearInterval(t); }, 16);
  });
}

// === GEO SELECTS ===================================================
function initGeoSelects() {
  const selE = document.getElementById('select-estado');
  const selC = document.getElementById('select-ciudad');
  if (!selE || !selC) return;
  Object.keys(ESTADOS_VE).sort().forEach(e => { selE.innerHTML += '<option value="' + safeHtml(e) + '">' + safeHtml(e) + '</option>'; });
  selE.addEventListener('change', () => {
    selC.innerHTML = '<option value="">Selecciona tu Ciudad *</option>';
    if (selE.value && ESTADOS_VE[selE.value]) {
      ESTADOS_VE[selE.value].sort().forEach(c => { selC.innerHTML += '<option value="' + safeHtml(c) + '">' + safeHtml(c) + '</option>'; });
    }
  });
}

// === INIT PRINCIPAL ================================================
document.addEventListener('DOMContentLoaded', async function() {
  initThemeToggle();
  initHeader();
  initDrawer();
  initScrollAnimations();
  animarContadores();
  actualizarContadorCarrito();
  initGeoSelects();

  if (document.getElementById('pago-metodos-container') || document.getElementById('pago-metodos-btns')) {
    const metodos = await cargarMetodosPago();
    if (metodos && metodos.length) renderMetodosPago(metodos);
  }

  if (document.getElementById('checkout-form')) {
    renderListaCarrito();
    initCheckoutForm();
  }

  var dg=document.getElementById('productos-destacados-grid');if(dg){var rd=await cargarProductos();var ds=(rd.data||[]).filter(function(p){return p.destacado===true;});if(!ds.length)ds=(rd.data||[]).slice(0,4);renderCatalogo(ds,'productos-destacados-grid');}

    if (document.getElementById('catalogo-grid') || document.querySelector('[data-catalogo]')) {
    await cargarProductos();
    renderCatalogo(STATE.productos);
  }
});

// === EXPORTS GLOBALES ==============================================
window.KontAPI                   = KontAPI;
window.STATE                     = STATE;
window.KONT                      = KONT;
window.DEMO_CATALOG              = DEMO_CATALOG;
window.showToast                 = showToast;
window.renderCatalogo            = renderCatalogo;
window.renderListaCarrito        = renderListaCarrito;
window.agregarAlCarrito          = agregarAlCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.cargarProductos           = cargarProductos;
window.cargarMetodosPago         = cargarMetodosPago;
window.renderMetodosPago         = renderMetodosPago;
window.fmt                       = fmt;
window.safeHtml                  = safeHtml;
