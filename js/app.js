/* ============================================================
   AGROMEDIC — APP.JS  (Integración Kont E-commerce)
   Versión: 2.0 — Conectado a API real de Kont SaaS
   Arquitectura: Módulo API aislado + Estado global + Fallback demo
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE LA API KONT
// Estos son los únicos 3 valores que debes cambiar al activar la integración.
// Los obtienes en el panel de Kont: Configuración → Canal Web.
// ─────────────────────────────────────────────────────────────────────────────
const KONT = {
  BASE_URL:     'https://api.kont.lat',              // URL base del backend
  SLUG:         'agromedic-3',                          // payment_slug de tu empresa
  API_KEY:      '1abd0015-e02d-4f97-8b39-91f354c75317',  // tenants.public_api_key
  WS_NUMBER:    '584226396237',                       // WhatsApp fallback
  DEMO_MODE:    true,                                 // ← Cambiar a false en producción
};[]

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO API — Todas las llamadas al backend pasan por aquí.
// Si la API falla, cada función activa su propio fallback de demo.
// ─────────────────────────────────────────────────────────────────────────────
const KontAPI = (() => {

  const BASE  = `${KONT.BASE_URL}/api/ecommerce/${KONT.SLUG}`;
  const HEADS = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${KONT.API_KEY}`,
  };

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // Obtener catálogo con filtros opcionales
  async function getCatalog(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`${BASE}/catalogo${qs ? '?' + qs : ''}`, { headers: HEADS });
  }

  // Obtener detalle de un producto
  async function getProduct(id) {
    return request(`${BASE}/catalogo/${encodeURIComponent(id)}`, { headers: HEADS });
  }

  // Obtener métodos de pago activos
  async function getPaymentMethods() {
    return request(`${BASE}/metodos-pago`, { headers: HEADS });
  }

  // Crear un pedido web
  async function createOrder(orderData) {
    return request(`${BASE}/pedidos`, {
      method:  'POST',
      headers: HEADS,
      body:    JSON.stringify(orderData),
    });
  }

  // Consultar estado de un pedido (sin API key)
  async function getOrderStatus(ref) {
    return request(
      `${KONT.BASE_URL}/api/ecommerce/${KONT.SLUG}/pedidos/${encodeURIComponent(ref)}`
    );
  }

  return { getCatalog, getProduct, getPaymentMethods, createOrder, getOrderStatus };
})();


// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO DEMO — Se activa si KONT.DEMO_MODE=true o si la API no responde
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_CATALOG = [
  {
    id: 1, nombre: 'Suplemento Mineral FOS', categoria: 'ganado',
    precio: 15.50, precio_mayorista: 12.00, imagen: 'img/productos/organew-pet-suplemento-removebg-preview.png',
    descripcion: 'Suplemento mineral de alta concentración con FOS para bovinos en todas las etapas productivas.',
    etiquetas: ['ganado', 'suplemento', 'destacado'], disponible: true, destacado: true,
  },
  {
    id: 2, nombre: 'Shampoo Antialergia Pet', categoria: 'mascotas',
    precio: 8.99, precio_mayorista: 7.00, imagen: 'img/productos/champu-pet-care.png-removebg-preview.png',
    descripcion: 'Fórmula dermatológica libre de parabenos, diseñada para perros y gatos con piel sensible.',
    etiquetas: ['mascotas', 'higiene'], disponible: true, destacado: false,
  },
  {
    id: 3, nombre: 'Ivermectina Forte 3.5%', categoria: 'ganado',
    precio: 22.00, precio_mayorista: 18.00, imagen: 'img/productos/rich_0005s_0003_Prazoquntel-removebg-preview.png',
    descripcion: 'Antiparasitario de amplio espectro para bovinos, equinos, ovinos y caprinos.',
    etiquetas: ['ganado', 'medicina', 'destacado'], disponible: true, destacado: true,
  },
  {
    id: 4, nombre: 'Antipulgas Plus 4en1', categoria: 'mascotas',
    precio: 12.00, precio_mayorista: 9.50, imagen: 'img/productos/antipulgas-removebg-preview.png',
    descripcion: 'Antiparasitario externo que elimina pulgas, garrapatas, piojos y ácaros en 24 horas.',
    etiquetas: ['mascotas', 'medicina'], disponible: true, destacado: false,
  },
];

const DEMO_PAYMENT_METHODS = [
  {
    method_key: 'PAGO_MOVIL',
    label: 'Pago Móvil',
    sort_order: 0,
    account_data: { banco: 'Banesco', telefono: '0412-XXXXXXX', cedula: 'V-XXXXXXXX', titular: 'Agromedic CA' },
    fields_config: [
      { key: 'banco_origen',  label: 'Banco de origen',         type: 'select-bancos', required: true },
      { key: 'telefono',      label: 'Teléfono que realizó el pago', type: 'tel',   required: true },
      { key: 'referencia',    label: 'Últimos 8 dígitos de la referencia', type: 'text', required: true },
    ],
  },
  {
    method_key: 'TRANSFERENCIA',
    label: 'Transferencia',
    sort_order: 1,
    account_data: { banco: 'Mercantil', cuenta: '0105-XXXX-XXXX', cedula: 'J-XXXXXXXX', titular: 'Agromedic CA' },
    fields_config: [
      { key: 'banco_origen',  label: 'Banco de origen',         type: 'select-bancos', required: true },
      { key: 'referencia',    label: 'Número de referencia',     type: 'text', required: true },
    ],
  },
  {
    method_key: 'ZELLE',
    label: 'Zelle',
    sort_order: 2,
    account_data: { email: 'pagos@agromedic.com', titular: 'Agromedic' },
    fields_config: [
      { key: 'referencia',    label: 'Nombre de quien envió el Zelle', type: 'text', required: true },
    ],
  },
  {
    method_key: 'CRIPTO',
    label: 'Cripto (USDT/BTC)',
    sort_order: 3,
    account_data: { red: 'TRC20', wallet: 'TXXXXXXXXxxxxxx...', moneda: 'USDT' },
    fields_config: [
      { key: 'hash_tx',       label: 'Hash / ID de transacción', type: 'text', required: true },
      { key: 'moneda',        label: 'Moneda usada',             type: 'text', required: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RENDERIZAR CATÁLOGO DE PRODUCTOS (Inyecta el HTML en la tienda)
// ─────────────────────────────────────────────────────────────────────────────
function renderCatalogo(productos) {
  const grid = $('#catalogo-grid') || $('[data-catalogo]');
  if (!grid) return;

  // Si no hay productos, mostramos un mensaje
  if (!productos || productos.length === 0) {
    grid.innerHTML = '<div class="catalogo-vacio"><p>No hay productos disponibles en este momento.</p></div>';
    return;
  }

  // Generamos el HTML para cada tarjeta (preparado para tu CSS Mobile-First)
  grid.innerHTML = productos.map(prod => `
    <article class="tarjeta-producto" data-id="${prod.id}" data-categoria="${safeHtml(prod.categoria)}">
      <div class="tarjeta-producto__img-wrap">
        <img src="${prod.imagen || 'img/placeholder.png'}" alt="${safeHtml(prod.nombre)}" class="tarjeta-producto__img" loading="lazy">
        ${prod.destacado ? '<span class="tarjeta-producto__badge">Destacado</span>' : ''}
      </div>
      <div class="tarjeta-producto__info">
        <span class="tarjeta-producto__categoria">${safeHtml(prod.categoria).toUpperCase()}</span>
        <h3 class="tarjeta-producto__nombre">${safeHtml(prod.nombre)}</h3>
        <p class="tarjeta-producto__precio">${fmt(prod.precio)}</p>
        
        <button type="button" class="btn-agregar-carrito" 
          onclick="agregarAlCarrito({
            id: ${prod.id}, 
            nombre: '${safeHtml(prod.nombre.replace(/'/g, "\\'"))}', 
            precio: ${prod.precio}, 
            imagen: '${prod.imagen || ''}'
          }, 1)">
          <i class="bi bi-cart-plus"></i> Agregar
        </button>
      </div>
    </article>
  `).join('');

  // Volvemos a disparar el IntersectionObserver para que las tarjetas nuevas tengan su animación
  // initScrollAnimations(); // ← Coméntala un segundo, guarda y recarga
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────────
const STATE = {
  carrito:        JSON.parse(localStorage.getItem('agro_carrito') || '[]'),
  productos:      [],
  paymentMethods: [],
  filtroCateg:    'todos',
  busqueda:       '',
  cargando:       false,
};

// ─────────────────────────────────────────────────────────────────────────────
// DATOS GEOGRÁFICOS
// ─────────────────────────────────────────────────────────────────────────────
const ESTADOS_VE = {
  "Amazonas":["Puerto Ayacucho","San Fernando de Atabapo"],
  "Anzoátegui":["Barcelona","Puerto La Cruz","Lechería","El Tigre","Anaco"],
  "Apure":["San Fernando de Apure","Guasdualito","Achaguas"],
  "Aragua":["Maracay","Turmero","La Victoria","Cagua","Palo Negro"],
  "Barinas":["Barinas","Barinitas","Socopó","Sabaneta"],
  "Bolívar":["Ciudad Bolívar","Ciudad Guayana","Upata","Santa Elena de Uairén"],
  "Carabobo":["Valencia","Puerto Cabello","Guacara","San Diego","Naguanagua","Mariara"],
  "Cojedes":["San Carlos","Tinaquillo","Tinaco"],
  "Delta Amacuro":["Tucupita","Pedernales"],
  "Distrito Capital":["Caracas"],
  "Falcón":["Coro","Punto Fijo","Chichiriviche","Tucacas"],
  "Guárico":["San Juan de los Morros","Valle de la Pascua","Calabozo","Zaraza"],
  "La Guaira":["La Guaira","Catia La Mar","Maiquetía","Caraballeda"],
  "Lara":["Barquisimeto","Cabudare","Carora","Quíbor"],
  "Mérida":["Mérida","El Vigía","Tovar","Ejido"],
  "Miranda":["Los Teques","Guarenas","Guatire","Ocumare del Tuy","Cúa","Charallave"],
  "Monagas":["Maturín","Punta de Mata","Caripito"],
  "Nueva Esparta":["Porlamar","Pampatar","La Asunción","Juan Griego"],
  "Portuguesa":["Guanare","Acarigua","Araure","Turén"],
  "Sucre":["Cumaná","Carúpano","Güiria"],
  "Táchira":["San Cristóbal","Táriba","Rubio","San Antonio del Táchira"],
  "Trujillo":["Trujillo","Valera","Boconó"],
  "Yaracuy":["San Felipe","Chivacoa","Yaritagua"],
  "Zulia":["Maracaibo","Cabimas","Ciudad Ojeda","Machiques","San Francisco","Lagunillas"],
};

const BANCOS_VE = [
  "Banco de Venezuela","Banesco","Mercantil","BBVA Provincial","BNC",
  "Bicentenario","Fondo Común","Bancaribe","BOD","Banco del Tesoro",
  "Bancrecer","Banplus","Sofitasa",
];


// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────
const $     = (sel, ctx = document) => ctx.querySelector(sel);
const $$    = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt   = (n)   => `$${Number(n).toFixed(2)}`;
const safeHtml = (str) => {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
};

function guardarCarrito() {
  localStorage.setItem('agro_carrito', JSON.stringify(STATE.carrito));
}

function getTotalCarrito() {
  return STATE.carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
}

function generarIdLocal() {
  return 'AGR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
}


// ── TEMA CLARO / OSCURO ─────────────────────────────────────
function initThemeToggle() {
  const themeToggleBtn = $('#btn-theme-toggle');
  const themeIcon = $('#theme-icon');
  const htmlElement = document.documentElement;

  // 1. Revisar localStorage o asignar light por defecto
  const savedTheme = localStorage.getItem('agromedic_theme') || 'light';
  
  // 2. Aplicar tema inicial
  htmlElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // 3. Escuchar click
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';

      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('agromedic_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    if (theme === 'dark') {
      themeIcon.classList.remove('bi-moon-fill');
      themeIcon.classList.add('bi-sun-fill');
    } else {
      themeIcon.classList.remove('bi-sun-fill');
      themeIcon.classList.add('bi-moon-fill');
    }
  }
}

// ── HEADER SCROLL ───────────────────────────────────────────
function initHeader() {
  const header = $('.header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Marcar link activo
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__link, .nav-drawer__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('activo');
    }
  });
}

// ── DRAWER MOBILE ────────────────────────────────────────────
function initDrawer() {
  const btnMenu = $('#btn-menu');
  const drawer  = $('#nav-drawer');
  const overlay = drawer?.querySelector('.nav-drawer__overlay');
  if (!btnMenu || !drawer) return;

  function toggle(open) {
    btnMenu.classList.toggle('abierto', open);
    drawer.classList.toggle('abierto', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btnMenu.addEventListener('click', () => toggle(!drawer.classList.contains('abierto')));
  overlay?.addEventListener('click', () => toggle(false));
  $$('.nav-drawer__link', drawer).forEach(l => l.addEventListener('click', () => toggle(false)));
  document.addEventListener('keydown', e => e.key === 'Escape' && toggle(false));
}

// ─────────────────────────────────────────────────────────────────────────────
// CARGA DE CATÁLOGO — Con fallback demo si la API no responde
// ─────────────────────────────────────────────────────────────────────────────
async function cargarProductos(params = {}) {
  STATE.cargando = true;

  if (KONT.DEMO_MODE) {
    STATE.productos = DEMO_CATALOG;
    STATE.cargando  = false;
    return { data: DEMO_CATALOG, meta: { total: DEMO_CATALOG.length, categorias: ['ganado','mascotas'] } };
  }

  try {
    const resp = await KontAPI.getCatalog(params);
    STATE.productos = resp.data || [];
    STATE.cargando  = false;
    return resp;
  } catch (err) {
    console.warn('[Agromedic] API catálogo no disponible — modo demo:', err.message);
    STATE.productos = DEMO_CATALOG;
    STATE.cargando  = false;
    return { data: DEMO_CATALOG, meta: { total: DEMO_CATALOG.length, categorias: [] } };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// CARGA DE MÉTODOS DE PAGO — Con fallback demo
// ─────────────────────────────────────────────────────────────────────────────
async function cargarMetodosPago() {
  if (KONT.DEMO_MODE) {
    STATE.paymentMethods = DEMO_PAYMENT_METHODS;
    return DEMO_PAYMENT_METHODS;
  }

  try {
    const resp = await KontAPI.getPaymentMethods();
    STATE.paymentMethods = resp.data || [];
    return resp.data;
  } catch (err) {
    console.warn('[Agromedic] Métodos de pago API no disponible — usando demo:', err.message);
    STATE.paymentMethods = DEMO_PAYMENT_METHODS;
    return DEMO_PAYMENT_METHODS;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// RENDER DE MÉTODOS DE PAGO (dinámico desde la API)
// ─────────────────────────────────────────────────────────────────────────────
function renderMetodosPago(metodos) {
  const container = $('#pago-metodos-container');
  if (!container) return;

  // Renderizar botones de selección de método
  const botonesHTML = metodos.map((m, i) => `
    <button type="button"
            class="pago-metodo-btn${i === 0 ? ' activo' : ''}"
            data-metodo="${safeHtml(m.method_key)}"
            aria-pressed="${i === 0}">
      <i class="bi bi-${metodoPagoIcon(m.method_key)}"></i>
      <span>${safeHtml(m.label)}</span>
    </button>
  `).join('');

  const btnWrap = $('#pago-metodos-btns');
  if (btnWrap) btnWrap.innerHTML = botonesHTML;

  // Renderizar campos dinámicos de cada método
  const camposHTML = metodos.map((m, i) => {
    const accountInfo = renderAccountInfo(m.account_data, m.method_key);
    const fields      = renderPaymentFields(m.fields_config, m.method_key);

    return `
      <div class="pago-campos${i === 0 ? ' visible' : ''}"
           id="pago-campos-${safeHtml(m.method_key)}"
           data-metodo="${safeHtml(m.method_key)}">
        ${accountInfo}
        ${fields}
      </div>
    `;
  }).join('');

  const camposWrap = $('#pago-campos-wrapper');
  if (camposWrap) camposWrap.innerHTML = camposHTML;

  // Inicializar eventos de cambio de método
  bindMetodosPago();
}

function metodoPagoIcon(key) {
  const icons = {
    'PAGO_MOVIL':    'phone-fill',
    'TRANSFERENCIA': 'bank',
    'ZELLE':         'currency-dollar',
    'CRIPTO':        'currency-bitcoin',
    'EFECTIVO':      'cash-coin',
  };
  return icons[key] || 'credit-card';
}

function renderAccountInfo(accountData, methodKey) {
  if (!accountData || Object.keys(accountData).length === 0) return '';
  const rows = Object.entries(accountData)
    .map(([k, v]) => `<tr><th>${safeHtml(k)}</th><td><strong>${safeHtml(v)}</strong></td></tr>`)
    .join('');
  return `
    <div class="pago-cuenta-info">
      <p class="pago-cuenta-titulo"><i class="bi bi-info-circle"></i> Datos para el pago</p>
      <table class="pago-cuenta-table">${rows}</table>
    </div>
  `;
}

function renderPaymentFields(fieldsConfig, methodKey) {
  if (!Array.isArray(fieldsConfig) || fieldsConfig.length === 0) return '';

  const fields = fieldsConfig.map(field => {
    const required = field.required ? 'required' : '';
    const name     = `pago_${methodKey.toLowerCase()}_${field.key}`;

    if (field.type === 'select-bancos') {
      const opts = BANCOS_VE.map(b => `<option value="${safeHtml(b)}">${safeHtml(b)}</option>`).join('');
      return `
        <div class="form-group">
          <label for="${name}">${safeHtml(field.label)} ${field.required ? '<span class="req">*</span>' : ''}</label>
          <select id="${name}" name="${name}" class="form-control" ${required}>
            <option value="">Selecciona banco</option>
            ${opts}
          </select>
        </div>
      `;
    }

    return `
      <div class="form-group">
        <label for="${name}">${safeHtml(field.label)} ${field.required ? '<span class="req">*</span>' : ''}</label>
        <input type="${field.type || 'text'}"
               id="${name}"
               name="${name}"
               class="form-control"
               autocomplete="off"
               ${required}>
      </div>
    `;
  }).join('');

  return `<div class="pago-campos-fields">${fields}</div>`;
}

function bindMetodosPago() {
  $$('.pago-metodo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pago-metodo-btn').forEach(b => { b.classList.remove('activo'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('activo');
      btn.setAttribute('aria-pressed', 'true');

      const metodo = btn.dataset.metodo;
      $$('.pago-campos').forEach(c => c.classList.remove('visible'));
      const campos = $(`#pago-campos-${metodo}`);
      if (campos) campos.classList.add('visible');
    });
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT FORM — Envío del pedido a la API de Kont
// ─────────────────────────────────────────────────────────────────────────────
function initCheckoutForm() {
  const form = $('#checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const metodoActivo = $('.pago-metodo-btn.activo');
    if (!metodoActivo) {
      showToast('Selecciona un método de pago', 'error');
      return;
    }

    const btnSubmit   = $('#btn-checkout-submit');
    const originalHTML = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<div class="spinner"></div> Procesando...`;

    const formData = new FormData(form);
    const metodo   = metodoActivo.dataset.metodo;

    // Recopilar datos del pago según método activo
    const datosPago = {};
    const camposActivos = $(`#pago-campos-${metodo}`);
    if (camposActivos) {
      $$('input, select', camposActivos).forEach(inp => {
        if (inp.name) {
          // Limpiar el prefijo del name para guardar la key limpia
          const cleanKey = inp.name.replace(`pago_${metodo.toLowerCase()}_`, '');
          datosPago[cleanKey] = inp.value;
        }
      });
    }

    // Construir el payload para la API de Kont
    const ordenPayload = {
      customer: {
        nombre:    formData.get('nombre'),
        telefono:  formData.get('telefono'),
        email:     formData.get('email') || null,
        estado:    formData.get('estado'),
        ciudad:    formData.get('ciudad'),
        direccion: formData.get('direccion') || null,
      },
      items: STATE.carrito.map(i => ({
        product_id: i.id,
        nombre:     i.nombre,
        cantidad:   i.cantidad,
        // Nota: el backend recalcula los precios. Los enviamos solo como referencia.
        precio:     i.precio,
      })),
      metodo_pago: metodo,
      datos_pago:  datosPago,
      notas:       formData.get('notas') || '',
    };

    try {
      let data;

      if (KONT.DEMO_MODE) {
        // Modo demo: simular respuesta exitosa sin llamar a la API
        await new Promise(r => setTimeout(r, 1200));
        data = {
          ok:  true,
          data: {
            id:         Math.floor(Math.random() * 9000) + 1000,
            ref:        generarIdLocal(),
            status:     'PENDIENTE',
            total_usd:  getTotalCarrito(),
            message:    '¡Pedido recibido! Pronto te contactaremos para confirmar.',
          },
        };
      } else {
        data = await KontAPI.createOrder(ordenPayload);
      }

      if (!data.ok) throw new Error(data.message || 'Error del servidor');

      const pedido = data.data;

      // Limpiar carrito
      STATE.carrito = [];
      guardarCarrito();
      actualizarContadorCarrito();

      // Mostrar confirmación
      finalizarPedido(pedido.ref, ordenPayload, pedido);

    } catch (err) {
      console.error('[Checkout] Error al crear pedido:', err.message);

      // Fallback local: guardar en localStorage + enviar a WhatsApp
      const localRef = generarIdLocal();
      localStorage.setItem('agro_ultimo_pedido', JSON.stringify({ ref: localRef, ...ordenPayload }));

      if (!KONT.DEMO_MODE) {
        showToast('No pudimos registrar tu pedido en línea. Redirigiendo a WhatsApp...', 'info');
        setTimeout(() => {
          const msg = encodeURIComponent(
            `*PEDIDO AGROMEDIC* — Ref: ${localRef}\n` +
            `Cliente: ${ordenPayload.customer.nombre} | Tel: ${ordenPayload.customer.telefono}\n` +
            `Productos: ${STATE.carrito.map(i => `${i.cantidad}× ${i.nombre}`).join(', ')}\n` +
            `Total: ${fmt(getTotalCarrito())}\n` +
            `Método: ${metodo}\n` +
            `Ref. pago: ${datosPago.referencia || '(pendiente)'}`
          );
          window.open(`https://wa.me/${KONT.WS_NUMBER}?text=${msg}`, '_blank');
        }, 2000);
      }

      finalizarPedido(localRef, ordenPayload, null, true);

    } finally {
      btnSubmit.disabled  = false;
      btnSubmit.innerHTML = originalHTML;
    }
  });
}

function finalizarPedido(ref, orden, pedidoData, isLocal = false) {
  const confirmacion = $('#confirmacion-pedido');
  const layout       = $('#carrito-layout');

  if (layout)       layout.style.display      = 'none';
  if (confirmacion) confirmacion.style.display = 'block';

  const refEl = $('#confirmacion-ref');
  if (refEl) refEl.textContent = ref;

  const statusEl = $('#confirmacion-status');
  if (statusEl) {
    statusEl.textContent = isLocal
      ? 'Pedido guardado localmente — contactaremos pronto'
      : (pedidoData?.message || '¡Pedido recibido correctamente!');
  }

  // Scroll a confirmación
  confirmacion?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ─────────────────────────────────────────────────────────────────────────────
// CARRITO — Lógica de gestión
// ─────────────────────────────────────────────────────────────────────────────
function actualizarContadorCarrito() {
  const total = STATE.carrito.reduce((s, i) => s + i.cantidad, 0);
  $$('.contador-carrito').forEach(el => {
    el.textContent = total;
    if (total > 0) el.classList.add('tiene-items');
    else           el.classList.remove('tiene-items');
  });
}

function agregarAlCarrito(producto, cantidad = 1) {
  const existente = STATE.carrito.find(i => i.id === producto.id);
  if (existente) {
    existente.cantidad = Math.min(existente.cantidad + cantidad, 99);
  } else {
    STATE.carrito.push({
      id:       producto.id,
      nombre:   producto.nombre,
      precio:   producto.precio,
      imagen:   producto.imagen || '',
      cantidad,
    });
  }
  guardarCarrito();
  actualizarContadorCarrito();
  showToast(`${cantidad > 1 ? cantidad + '× ' : ''}${producto.nombre} añadido al carrito`, 'success');
}


// ─────────────────────────────────────────────────────────────────────────────
// RENDERIZADO Y CONTROL DEL CARRITO (carrito.html)
// ─────────────────────────────────────────────────────────────────────────────
function renderListaCarrito() {
  const listaContenedor = $('#carrito-lista');
  const subtotalEl = $('#subtotal-carrito');
  const totalEl = $('#total-carrito');
  
  if (!listaContenedor) return;

  if (STATE.carrito.length === 0) {
    listaContenedor.innerHTML = `<p class="carrito-vacio">Tu carrito está vacío.</p>`;
    if (subtotalEl) subtotalEl.textContent = fmt(0);
    if (totalEl) totalEl.textContent = fmt(0);
    return;
  }

  listaContenedor.innerHTML = STATE.carrito.map(item => `
    <div class="carrito-item" data-id="${item.id}">
      <img src="${item.imagen || 'img/placeholder.png'}" alt="${safeHtml(item.nombre)}" class="carrito-item__img">
      <div class="carrito-item__info">
        <h4 class="carrito-item__nombre">${safeHtml(item.nombre)}</h4>
        <p class="carrito-item__precio">${fmt(item.precio)}</p>
      </div>
      <div class="carrito-item__acciones">
        <button type="button" class="btn-qty minus" onclick="cambiarCantidadLocal(${item.id}, -1)">-</button>
        <span class="carrito-item__cant">${item.cantidad}</span>
        <button type="button" class="btn-qty plus" onclick="cambiarCantidadLocal(${item.id}, 1)">+</button>
        <button type="button" class="btn-eliminar" onclick="eliminarDelCarritoLocal(${item.id})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  const total = getTotalCarrito();
  if (subtotalEl) subtotalEl.textContent = fmt(total);
  if (totalEl) totalEl.textContent = fmt(total);
}

window.cambiarCantidadLocal = function(id, cambio) {
  const item = STATE.carrito.find(i => i.id === id);
  if (!item) return;

  item.cantidad += cambio;
  
  if (item.cantidad <= 0) {
    STATE.carrito = STATE.carrito.filter(i => i.id !== id);
  }

  guardarCarrito();
  actualizarContadorCarrito();
  renderListaCarrito();
};

window.eliminarDelCarritoLocal = function(id) {
  STATE.carrito = STATE.carrito.filter(i => i.id !== id);
  guardarCarrito();
  actualizarContadorCarrito();
  renderListaCarrito();
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function showToast(msg, tipo = 'info') {
  const toast = $('#toast-global');
  if (!toast) return;
  const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill', warning:'bi-exclamation-triangle-fill' };
  toast.className      = `toast toast-${tipo}`;
  const ico = $('#toast-icono');
  const txt = $('#toast-texto');
  if (ico) ico.className    = `bi ${icons[tipo] || icons.info} toast__icon`;
  if (txt) txt.textContent  = msg;
  toast.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}


// ── ANIMACIONES DE ENTRADA ────────────────────────────────────
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.tarjeta-producto, .categoria-card, .feature-item, .banner-cta').forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = `opacity 0.4s ease ${i * 40}ms, transform 0.4s ease ${i * 40}ms`;
    io.observe(el);
  });
}

// ── HERO ANIMACIÓN NÚMERO ──────────────────────────────────────
function animarContadores() {
  $$('.hero__stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    let current  = 0;
    const step   = Math.ceil(target / 60);
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString() + suffix;
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN DE ESTADOS VE (select de estado → ciudad)
// ─────────────────────────────────────────────────────────────────────────────
function initGeoSelects() {
  const selEstado = $('#select-estado');
  const selCiudad = $('#select-ciudad');
  if (!selEstado || !selCiudad) return;

  Object.keys(ESTADOS_VE).sort().forEach(est => {
    selEstado.innerHTML += `<option value="${safeHtml(est)}">${safeHtml(est)}</option>`;
  });

  selEstado.addEventListener('change', () => {
    const estado = selEstado.value;
    selCiudad.innerHTML = '<option value="">Selecciona tu Ciudad *</option>';
    if (estado && ESTADOS_VE[estado]) {
      ESTADOS_VE[estado].sort().forEach(c => {
        selCiudad.innerHTML += `<option value="${safeHtml(c)}">${safeHtml(c)}</option>`;
      });
    }
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Inicializaciones de UI (¡Faltaban header, drawer y scroll!)
  initThemeToggle();
  initHeader();
  initDrawer();
  initScrollAnimations();
  animarContadores();

  // 2. Carrito y Ubicación
  actualizarContadorCarrito();
  initGeoSelects();

  // 3. Cargar métodos de pago de la API
  if ($('#pago-metodos-container') || $('#pago-metodos-btns')) {
    const metodos = await cargarMetodosPago();
    if (metodos?.length) renderMetodosPago(metodos);
  }

  // 4. Inicializar checkout y RENDERIZAR LA LISTA (¡Faltaba renderListaCarrito!)
  if ($('#checkout-form')) {
    renderListaCarrito(); 
    initCheckoutForm();
  }

  // 5. Cargar catálogo si estamos en tienda.html o index.html
  if ($('#catalogo-grid') || $('[data-catalogo]')) {
    await cargarProductos();
    renderCatalogo(STATE.productos); // ← ¡Esta es la línea mágica que faltaba!
  }

});

// Exponer globalmente para que otros scripts (productos.js, tienda.js) puedan usarlos
window.KontAPI     = KontAPI;
window.STATE       = STATE;
window.showToast   = showToast;
window.renderCatalogo = renderCatalogo;
window.agregarAlCarrito    = agregarAlCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.cargarProductos     = cargarProductos;
window.DEMO_CATALOG        = DEMO_CATALOG;
window.cargarMetodosPago   = cargarMetodosPago; 
window.renderListaCarrito  = renderListaCarrito; // ← ¡Esta faltaba!