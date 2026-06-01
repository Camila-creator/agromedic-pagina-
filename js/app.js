
/* ============================================================
   AGROMEDIC — APP.JS
   Lógica principal: API Kont, carrito, checkout, pagos
   Vanilla JS Modular — Mobile First
   ============================================================ */

'use strict';

// ── CONFIGURACIÓN API KONT ──────────────────────────────────
const KONT_CONFIG = {
  BASE_URL:  'https://api.kont.app/v1',          // ← Reemplazar con URL real del SaaS
  TENANT_ID: 'TU_TENANT_ID',                      // ← ID de tu empresa en Kont
  API_KEY:   'TU_API_KEY_PUBLICA',                // ← Llave pública de lectura
  WS_NUMBER: '584226396237',                      // ← WhatsApp fallback
};

const ENDPOINTS = {
  productos:  () => `${KONT_CONFIG.BASE_URL}/products?tenant_id=${KONT_CONFIG.TENANT_ID}&is_visible=true`,
  crearOrden: () => `${KONT_CONFIG.BASE_URL}/orders`,
  getOrden:   (id) => `${KONT_CONFIG.BASE_URL}/orders/${id}?tenant_id=${KONT_CONFIG.TENANT_ID}`,
};

// ── ESTADO GLOBAL ───────────────────────────────────────────
const STATE = {
  carrito:     JSON.parse(localStorage.getItem('agro_carrito') || '[]'),
  productos:   [],
  filtroCateg: 'todos',
  filtroTipo:  'todos',
  busqueda:    '',
  cargando:    false,
};

// ── DATOS GEOGRÁFICOS ───────────────────────────────────────
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
  "Banco de Venezuela","Banesco","Mercantil","BBVA Provincial",
  "BNC","Bicentenario","Fondo Común","Bancaribe","BOD",
  "Banco del Tesoro","Bancrecer","Banplus","Sofitasa",
];

// ── UTILIDADES ──────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n) => `$${Number(n).toFixed(2)}`;
const safeHtml = (str) => {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
};

function guardarCarrito() {
  localStorage.setItem('agro_carrito', JSON.stringify(STATE.carrito));
}

function getTotalCarrito() {
  return STATE.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
}

function getCantidadCarrito() {
  return STATE.carrito.reduce((s, i) => s + i.cantidad, 0);
}

// ── TOAST NOTIFICATIONS ─────────────────────────────────────
let _toastTimer;
function showToast(mensaje, tipo = 'info') {
  const toast = $('#toast-global');
  if (!toast) return;
  const iconMap = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
  toast.className = `toast toast-${tipo}`;
  $('#toast-icono').className = `bi ${iconMap[tipo] || iconMap.info} toast__icon`;
  $('#toast-texto').textContent = mensaje;
  toast.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
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

// ── ACTUALIZAR CONTADOR CARRITO ──────────────────────────────
function actualizarContadorCarrito() {
  $$('.contador-carrito').forEach(el => {
    const n = getCantidadCarrito();
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 200);
  });
}

// ── API: CARGAR PRODUCTOS ────────────────────────────────────
async function cargarProductos() {
  STATE.cargando = true;
  renderSkeletons();

  try {
    const res = await fetch(ENDPOINTS.productos(), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KONT_CONFIG.API_KEY}`,
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Filtrar solo visibles (doble garantía)
    STATE.productos = (data.data || data.products || data || [])
      .filter(p => p.is_visible !== false);

    actualizarApiStatus('conectado');
    return STATE.productos;

  } catch (err) {
    console.warn('API Kont no disponible — usando productos demo:', err.message);
    actualizarApiStatus('error');
    STATE.productos = PRODUCTOS_DEMO;
    return STATE.productos;
  } finally {
    STATE.cargando = false;
  }
}

// ── PRODUCTOS DEMO (fallback cuando API no está lista) ───────
const PRODUCTOS_DEMO = [
  { id:'p-001', nombre:'Suplemento Mineral FOS', precio:15.50, categoria:'ganado', tipo:'suplemento',
    descripcion:'Prebióticos y minerales esenciales para ganado bovino. Aumenta la producción y las defensas naturales.',
    imagen:'img/productos/organew-pet-suplemento-removebg-preview.png', is_visible:true, destacado:true },
  { id:'p-002', nombre:'Shampoo Antialergia Pet', precio:8.99, categoria:'mascotas', tipo:'higiene',
    descripcion:'Fórmula libre de químicos agresivos ideal para pieles sensibles. Deja el pelaje suave y brillante.',
    imagen:'img/productos/champu-pet-care.png-removebg-preview.png', is_visible:true },
  { id:'p-003', nombre:'Ivermectina Forte 3.5%', precio:22.00, categoria:'ganado', tipo:'medicina',
    descripcion:'Control total de parásitos internos y externos. Formulación concentrada de amplio espectro.',
    imagen:'img/productos/rich_0005s_0003_Prazoquntel-removebg-preview.png', is_visible:true, destacado:true },
  { id:'p-004', nombre:'Antipulgas Plus 4en1', precio:12.00, categoria:'mascotas', tipo:'medicina',
    descripcion:'Elimina pulgas, garrapatas, piojos y ácaros en 24h. Protección que dura hasta 30 días.',
    imagen:'img/productos/antipulgas-removebg-preview.png', is_visible:true },
  { id:'p-005', nombre:'Vitaminas Bovino Complex', precio:18.75, categoria:'ganado', tipo:'suplemento',
    descripcion:'Complejo vitamínico A, D, E + minerales traza. Esencial para gestación y lactancia.',
    imagen:'img/productos/organew-pet-suplemento-removebg-preview.png', is_visible:true },
  { id:'p-006', nombre:'Desparasitante Perros 10kg', precio:9.50, categoria:'mascotas', tipo:'medicina',
    descripcion:'Antiparasitario interno triple acción. Elimina áscaris, tenias y ancylostomas.',
    imagen:'img/productos/antipulgas-removebg-preview.png', is_visible:true },
  { id:'p-007', nombre:'Spray Garrapaticida', precio:14.00, categoria:'ganado', tipo:'higiene',
    descripcion:'Aplicación directa. Controla garrapatas, mosca del cuerno y otros ectoparásitos.',
    imagen:'img/productos/champu-pet-care.png-removebg-preview.png', is_visible:true },
  { id:'p-008', nombre:'Reconstituyente Equino', precio:32.00, categoria:'ganado', tipo:'suplemento',
    descripcion:'Aminoácidos + vitaminas B para equinos en trabajo intenso o recuperación post-enfermedad.',
    imagen:'img/productos/rich_0005s_0003_Prazoquntel-removebg-preview.png', is_visible:true, destacado:true },
];

// ── RENDER ESTADO API ────────────────────────────────────────
function actualizarApiStatus(estado) {
  const dot = $('#api-status-dot');
  const txt = $('#api-status-txt');
  if (!dot || !txt) return;
  dot.className = `api-status__dot ${estado}`;
  const map = { conectado: 'API Kont activa', error: 'Modo demo', loading: 'Conectando...' };
  txt.textContent = map[estado] || '';
}

// ── RENDER SKELETONS ─────────────────────────────────────────
function renderSkeletons(n = 8) {
  const grid = $('#productos-grid');
  if (!grid) return;
  grid.innerHTML = Array(n).fill(`
    <div class="tarjeta-skeleton">
      <div class="tarjeta-skeleton__img skeleton"></div>
      <div class="tarjeta-skeleton__body">
        <div class="tarjeta-skeleton__title skeleton"></div>
        <div class="tarjeta-skeleton__desc1 skeleton"></div>
        <div class="tarjeta-skeleton__desc2 skeleton"></div>
        <div class="tarjeta-skeleton__price skeleton"></div>
      </div>
    </div>`).join('');
}

// ── RENDER PRODUCTOS ─────────────────────────────────────────
function filtrarProductos() {
  return STATE.productos.filter(p => {
    const catOk  = STATE.filtroCateg === 'todos' || p.categoria === STATE.filtroCateg;
    const tipoOk = STATE.filtroTipo  === 'todos' || p.tipo === STATE.filtroTipo;
    const busOk  = !STATE.busqueda ||
      p.nombre.toLowerCase().includes(STATE.busqueda.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(STATE.busqueda.toLowerCase());
    return catOk && tipoOk && busOk;
  });
}

function renderTarjetaProducto(p) {
  const inCart = STATE.carrito.some(i => i.id === p.id);
  
  // AQUÍ ESTÁ LA MAGIA: Construimos la URL dinámica para cada producto
  const urlDetalle = `productos.html?id=${safeHtml(p.id)}`;

  return `
    <article class="tarjeta-producto" data-id="${safeHtml(p.id)}">
      <a href="${urlDetalle}" class="tarjeta__img-wrap" style="display:block; text-decoration:none;">
        <div class="tarjeta__badges">
          <span class="badge badge-categoria">${safeHtml(p.categoria)}</span>
          ${p.destacado ? '<span class="badge badge-destacado"><i class="bi bi-star-fill"></i> Top</span>' : ''}
        </div>
        <img src="${safeHtml(p.imagen || 'img/placeholder.png')}"
             alt="${safeHtml(p.nombre)}"
             loading="lazy"
             onerror="this.src='img/placeholder.png'">
      </a>
      
      <div class="tarjeta__body">
        <a href="${urlDetalle}" style="text-decoration:none; color:inherit;">
          <h3 class="tarjeta__nombre" style="transition: color 0.3s ease;">${safeHtml(p.nombre)}</h3>
        </a>
        
        <p class="tarjeta__desc">${safeHtml(p.descripcion || '')}</p>
        <p class="tarjeta__precio">${fmt(p.precio)}</p>
        
        <div class="tarjeta__footer" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
          
          <a href="${urlDetalle}" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center; border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 0.5rem; text-decoration: none; color: var(--c-text);">
            <i class="bi bi-eye"></i> Detalles
          </a>

          <button class="btn btn-primary btn-sm agregar-carrito"
                  data-id="${safeHtml(p.id)}"
                  data-nombre="${safeHtml(p.nombre)}"
                  data-precio="${p.precio}"
                  data-img="${safeHtml(p.imagen || '')}"
                  style="flex: 1; border-radius: var(--radius-sm); padding: 0.5rem;">
            <i class="bi bi-${inCart ? 'cart-check-fill' : 'cart-plus'}"></i>
            ${inCart ? 'Añadido' : 'Añadir'}
          </button>
          
        </div>
      </div>
    </article>`;
}

function renderProductos() {
  const grid = $('#productos-grid');
  if (!grid) return;
  const filtrados = filtrarProductos();
  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div class="productos-vacio">
        <i class="bi bi-search"></i>
        <h3>Sin resultados</h3>
        <p class="text-muted">Prueba con otro filtro o búsqueda.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFiltros()">
          <i class="bi bi-arrow-counterclockwise"></i> Limpiar filtros
        </button>
      </div>`;
    return;
  }
  grid.innerHTML = filtrados.map(renderTarjetaProducto).join('');
  bindAgregarCarrito();
}

// ── AÑADIR AL CARRITO ─────────────────────────────────────────
function bindAgregarCarrito() {
  $$('.agregar-carrito').forEach(btn => {
    btn.addEventListener('click', () => {
      const { id, nombre, precio, img } = btn.dataset;
      agregarAlCarrito({ id, nombre, precio: parseFloat(precio), imagen: img });
    });
  });
}

function agregarAlCarrito(producto) {
  const existente = STATE.carrito.find(i => i.id === producto.id);
  if (existente) {
    existente.cantidad++;
    showToast(`+1 ${producto.nombre} en el carrito`, 'success');
  } else {
    STATE.carrito.push({ ...producto, cantidad: 1 });
    showToast(`${producto.nombre} añadido`, 'success');
  }
  guardarCarrito();
  actualizarContadorCarrito();
  // Actualizar botón en grid
  const btn = $(`[data-id="${producto.id}"].agregar-carrito`);
  if (btn) {
    btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> Añadido';
  }
}

// ── FILTROS ──────────────────────────────────────────────────
function initFiltros() {
  $$('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo   = btn.dataset.tipoFiltro;
      const filtro = btn.dataset.filtro;

      // Actualizar activo dentro del mismo grupo
      $$(`[data-tipo-filtro="${tipo}"]`).forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');

      if (tipo === 'categoria') STATE.filtroCateg = filtro;
      if (tipo === 'tipo')      STATE.filtroTipo  = filtro;
      renderProductos();
    });
  });

  const buscador = $('#buscador-input');
  if (buscador) {
    buscador.addEventListener('input', debounce(e => {
      STATE.busqueda = e.target.value.trim();
      renderProductos();
    }, 250));
  }
}

function resetFiltros() {
  STATE.filtroCateg = 'todos';
  STATE.filtroTipo  = 'todos';
  STATE.busqueda    = '';
  $$('.filtro-btn[data-filtro="todos"]').forEach(b => b.classList.add('activo'));
  $$('.filtro-btn:not([data-filtro="todos"])').forEach(b => b.classList.remove('activo'));
  const buscador = $('#buscador-input');
  if (buscador) buscador.value = '';
  renderProductos();
}

// ── DEBOUNCE ─────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── PÁGINA CARRITO ────────────────────────────────────────────
function initPaginaCarrito() {
  const lista = $('#carrito-lista');
  if (!lista) return;
  renderCarritoCompleto();
  initSelectorEstados('select-estado', 'select-ciudad');
  initMetodosPago();
  initCheckoutForm();
  initConsultarPedido();
}

function renderCarritoCompleto() {
  const lista      = $('#carrito-lista');
  const totalEl    = $('#total-carrito');
  const subtotalEl = $('#subtotal-carrito');
  if (!lista) return;

  if (STATE.carrito.length === 0) {
    lista.innerHTML = `
      <div class="carrito-vacio">
        <i class="bi bi-basket"></i>
        <h3 class="text-cream">Tu carrito está vacío</h3>
        <p class="text-muted">Explora nuestro catálogo y añade productos.</p>
        <a href="tienda.html" class="btn btn-primary">
          <i class="bi bi-shop"></i> Ir a la tienda
        </a>
      </div>`;
    if (totalEl)    totalEl.textContent    = '$0.00';
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    // Ocultar formulario de checkout
    const form = $('#checkout-form');
    if (form) form.style.display = 'none';
    return;
  }

  lista.innerHTML = STATE.carrito.map(item => `
    <div class="carrito-item" data-id="${safeHtml(item.id)}">
      <div class="carrito-item__img">
        <img src="${safeHtml(item.imagen || 'img/placeholder.png')}"
             alt="${safeHtml(item.nombre)}"
             onerror="this.src='img/placeholder.png'">
      </div>
      <div>
        <p class="carrito-item__nombre">${safeHtml(item.nombre)}</p>
        <p class="carrito-item__precio-unit">${fmt(item.precio)} c/u</p>
        <div class="carrito-item__controles">
          <button class="qty-btn btn-restar" data-id="${safeHtml(item.id)}" aria-label="Disminuir">
            <i class="bi bi-dash"></i>
          </button>
          <span class="qty-valor">${item.cantidad}</span>
          <button class="qty-btn btn-sumar" data-id="${safeHtml(item.id)}" aria-label="Aumentar">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      </div>
      <div class="carrito-item__acciones">
        <p class="carrito-item__total">${fmt(item.precio * item.cantidad)}</p>
        <button class="carrito-item__eliminar btn-eliminar" data-id="${safeHtml(item.id)}" aria-label="Eliminar">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>`).join('');

  const total = getTotalCarrito();
  if (totalEl)    totalEl.textContent    = fmt(total);
  if (subtotalEl) subtotalEl.textContent = fmt(total);

  // Listeners de cantidad y eliminación
  $$('.btn-sumar').forEach(btn => {
    btn.addEventListener('click', () => { cambiarCantidad(btn.dataset.id, 1); });
  });
  $$('.btn-restar').forEach(btn => {
    btn.addEventListener('click', () => { cambiarCantidad(btn.dataset.id, -1); });
  });
  $$('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => { eliminarDelCarrito(btn.dataset.id); });
  });

  // Mostrar form de checkout
  const form = $('#checkout-form');
  if (form) form.style.display = 'flex';
}

function cambiarCantidad(id, delta) {
  const item = STATE.carrito.find(i => i.id === id);
  if (!item) return;
  item.cantidad = Math.max(1, item.cantidad + delta);
  guardarCarrito();
  actualizarContadorCarrito();
  renderCarritoCompleto();
}

function eliminarDelCarrito(id) {
  const item = STATE.carrito.find(i => i.id === id);
  STATE.carrito = STATE.carrito.filter(i => i.id !== id);
  guardarCarrito();
  actualizarContadorCarrito();
  renderCarritoCompleto();
  if (item) showToast(`${item.nombre} eliminado`, 'error');
}

// ── SELECTOR ESTADO / CIUDAD ──────────────────────────────────
function initSelectorEstados(idEstado, idCiudad) {
  const selEstado = $(`#${idEstado}`);
  const selCiudad = $(`#${idCiudad}`);
  if (!selEstado || !selCiudad) return;

  Object.keys(ESTADOS_VE).sort().forEach(e => {
    selEstado.innerHTML += `<option value="${safeHtml(e)}">${safeHtml(e)}</option>`;
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

// ── MÉTODOS DE PAGO ───────────────────────────────────────────
function initMetodosPago() {
  $$('.pago-metodo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pago-metodo-btn').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      const metodo = btn.dataset.metodo;
      $$('.pago-campos').forEach(c => c.classList.remove('visible'));
      const campos = $(`#pago-campos-${metodo}`);
      if (campos) campos.classList.add('visible');
      // Poblar bancos si aplica
      if (metodo === 'pagomovil' || metodo === 'transferencia') {
        poblarBancos(`select-banco-${metodo}`);
      }
    });
  });
}

function poblarBancos(selectId) {
  const sel = $(`#${selectId}`);
  if (!sel || sel.options.length > 1) return;
  BANCOS_VE.forEach(b => {
    sel.innerHTML += `<option value="${safeHtml(b)}">${safeHtml(b)}</option>`;
  });
}

// ── CHECKOUT FORM (POST A KONT) ──────────────────────────────
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

    const btnSubmit = $('#btn-checkout-submit');
    const originalHTML = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<div class="spinner"></div> Procesando...`;

    const formData = new FormData(form);
    const metodo   = metodoActivo.dataset.metodo;

    // Recopilar datos del pago según método
    const datosPago = recopilarDatosPago(metodo);

    // Construir objeto de orden para Kont
    const orden = {
      tenant_id:  KONT_CONFIG.TENANT_ID,
      status:     'borrador',
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
        precio:     i.precio,
        cantidad:   i.cantidad,
        subtotal:   +(i.precio * i.cantidad).toFixed(2),
      })),
      subtotal:       +getTotalCarrito().toFixed(2),
      total:          +getTotalCarrito().toFixed(2),
      metodo_pago:    metodo,
      datos_pago:     datosPago,
      notas:          formData.get('notas') || '',
      fuente:         'web-ecommerce',
      created_at:     new Date().toISOString(),
    };

    try {
      const res = await fetch(ENDPOINTS.crearOrden(), {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${KONT_CONFIG.API_KEY}`,
        },
        body: JSON.stringify(orden),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pedidoId = data.id || data.order_id || data.pedido_id || generarIdLocal();
      finalizarPedido(pedidoId, orden);

    } catch (err) {
      console.warn('API no disponible — procesando en modo local:', err.message);
      // Fallback: guardar localmente + redirigir a WhatsApp
      const pedidoId = generarIdLocal();
      guardarPedidoLocal({ ...orden, id: pedidoId });
      finalizarPedido(pedidoId, orden, true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalHTML;
    }
  });
}

function recopilarDatosPago(metodo) {
  const campos = $(`#pago-campos-${metodo}`);
  if (!campos) return {};
  const inputs = $$('input, select', campos);
  const datos = {};
  inputs.forEach(inp => {
    if (inp.name) datos[inp.name] = inp.value;
  });
  return datos;
}

function generarIdLocal() {
  return 'AGR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
}

function guardarPedidoLocal(orden) {
  const pedidos = JSON.parse(localStorage.getItem('agro_pedidos') || '[]');
  pedidos.push(orden);
  localStorage.setItem('agro_pedidos', JSON.stringify(pedidos));
}

function finalizarPedido(id, orden, fallback = false) {
  // Guardar ID para consultas futuras
  localStorage.setItem('agro_ultimo_pedido', id);

  // Mostrar confirmación
  mostrarConfirmacion(id);

  if (fallback) {
    // Enviar resumen por WhatsApp como respaldo
    setTimeout(() => enviarPorWhatsapp(id, orden), 800);
  }

  // Limpiar carrito
  STATE.carrito = [];
  guardarCarrito();
  actualizarContadorCarrito();
}

function mostrarConfirmacion(id) {
  const layout  = $('#carrito-layout');
  const confirm = $('#confirmacion-pedido');
  if (layout)  layout.style.display  = 'none';
  if (confirm) {
    confirm.style.display = 'flex';
    const idEl = $('#confirmacion-id-valor');
    if (idEl) idEl.textContent = id;
  }
}

function enviarPorWhatsapp(id, orden) {
  let msg = `*🌱 NUEVO PEDIDO AGROMEDIC*\n\n`;
  msg += `*ID:* ${id}\n`;
  msg += `*Cliente:* ${orden.customer.nombre}\n`;
  msg += `*Teléfono:* ${orden.customer.telefono}\n`;
  msg += `*Ubicación:* ${orden.customer.estado}, ${orden.customer.ciudad}\n\n`;
  msg += `*📦 Productos:*\n`;
  orden.items.forEach(i => {
    msg += `  • ${i.nombre} x${i.cantidad} = ${fmt(i.subtotal)}\n`;
  });
  msg += `\n*Total:* ${fmt(orden.total)}\n`;
  msg += `*Método de pago:* ${orden.metodo_pago}\n`;
  if (orden.notas) msg += `\n*Notas:* ${orden.notas}\n`;

  window.open(`https://wa.me/${KONT_CONFIG.WS_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── CONSULTAR ESTADO DE PEDIDO ────────────────────────────────
function initConsultarPedido() {
  const form = $('#form-consultar-pedido');
  if (!form) return;

  // Pre-llenar con último pedido
  const ultimo = localStorage.getItem('agro_ultimo_pedido');
  const input  = $('#input-id-pedido');
  if (input && ultimo) input.value = ultimo;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = input?.value?.trim();
    if (!id) return;

    const resultEl = $('#resultado-consulta');
    resultEl.innerHTML = `<div class="spinner" style="margin:auto"></div>`;

    try {
      const res = await fetch(ENDPOINTS.getOrden(id), {
        headers: { 'Authorization': `Bearer ${KONT_CONFIG.API_KEY}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      renderEstadoPedido(data, resultEl);
    } catch {
      // Buscar en pedidos locales
      const locales = JSON.parse(localStorage.getItem('agro_pedidos') || '[]');
      const local   = locales.find(p => p.id === id);
      if (local) {
        renderEstadoPedido(local, resultEl);
      } else {
        resultEl.innerHTML = `
          <p class="text-muted text-center" style="padding:1rem">
            <i class="bi bi-search"></i> No se encontró el pedido <strong>${safeHtml(id)}</strong>.
          </p>`;
      }
    }
  });
}

function renderEstadoPedido(pedido, container) {
  const badgeMap = {
    borrador:   'borrador',
    confirmado: 'confirmado',
    enviado:    'enviado',
    anulado:    'anulado',
  };
  const status = pedido.status || pedido.estado || 'borrador';
  const badge  = badgeMap[status] || 'borrador';

  container.innerHTML = `
    <div class="estado-pedido">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem">
        <span class="estado-badge ${badge}">
          <i class="bi bi-circle-fill" style="font-size:.5rem"></i>
          ${status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span class="text-xs text-muted">${pedido.id || ''}</span>
      </div>
      <p class="text-sm" style="margin-bottom:.5rem">
        <strong>Cliente:</strong> ${safeHtml(pedido.customer?.nombre || 'N/A')}
      </p>
      <p class="text-sm" style="margin-bottom:.5rem">
        <strong>Total:</strong> <span class="text-lime font-bold">${fmt(pedido.total || 0)}</span>
      </p>
      <p class="text-sm text-muted">
        ${status === 'borrador' ? '⏳ Tu pedido está pendiente de confirmación.' : ''}
        ${status === 'confirmado' ? '✅ Tu pedido fue confirmado. Pronto recibirás detalles de envío.' : ''}
        ${status === 'enviado' ? '🚚 Tu pedido está en camino.' : ''}
        ${status === 'anulado' ? '❌ Este pedido fue anulado. Contáctanos si es un error.' : ''}
      </p>
    </div>`;
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

// ── PÁGINA INDEX — FEATURED PRODUCTS ─────────────────────────
async function initIndexFeatured() {
  const grid = $('#productos-destacados-grid');
  if (!grid) return;
  const productos = await cargarProductos();
  const destacados = productos.filter(p => p.destacado).slice(0, 4);
  if (destacados.length === 0) {
    grid.closest('section')?.remove();
    return;
  }
  grid.innerHTML = destacados.map(renderTarjetaProducto).join('');
  bindAgregarCarrito();
  initScrollAnimations();
}

// ── INICIALIZACIÓN GLOBAL ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  initDrawer();
  actualizarContadorCarrito();

  const page = location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') {
    await initIndexFeatured();
    animarContadores();
  }

  if (page === 'tienda.html') {
    actualizarApiStatus('loading');
    await cargarProductos();
    renderProductos();
    initFiltros();
    initScrollAnimations();
  }

  if (page === 'carrito.html') {
    initPaginaCarrito();
  }
});
