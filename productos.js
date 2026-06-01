/* ============================================================
   AGROMEDIC — PRODUCTO.JS
   Lógica de la página de detalle de producto dinámica
   Lee ?id=xxx → fetch API Kont → inyecta DOM → gestiona UX
   Vanilla JS puro — Sin dependencias externas
   ============================================================ */
(() => {
'use strict';

// ── CONFIGURACIÓN ────────────────────────────────────────────
const KONT = {
  BASE_URL:  'https://api.kont.app/v1',
  TENANT_ID: 'TU_TENANT_ID',
  API_KEY:   'TU_API_KEY_PUBLICA',
  WS_NUMBER: '584226396237',
};

// ── CATÁLOGO DEMO (fallback cuando API no responde) ──────────
const CATALOGO_DEMO = {
  'p-001': {
    id: 'p-001',
    nombre: 'Suplemento Mineral FOS',
    precio: 15.50,
    precio_original: null,
    categoria: 'ganado',
    tipo: 'suplemento',
    descripcion: 'Suplemento mineral de alta concentración formulado con Fructooligosacáridos (FOS) para bovinos en todas las etapas productivas. Favorece la microbiota ruminal, optimiza la absorción de nutrientes y fortalece el sistema inmunológico del animal.',
    descripcion_completa: 'El Suplemento Mineral FOS combina minerales quelatados de alta biodisponibilidad con prebióticos naturales que estimulan el desarrollo de bacterias beneficiosas en el rumen. Su fórmula balanceada garantiza una mejor conversión alimenticia, mayor producción de leche en vacas lecheras y un incremento visible en la ganancia de peso en animales de carne.\n\nIdeal para incorporar en la ración diaria de bovinos, ovinos y caprinos. Compatible con cualquier base forrajera y concentrado proteico.',
    imagen: 'img/productos/organew-pet-suplemento-removebg-preview.png',
    galeria: [],
    beneficios: [
      'Mejora la digestión y absorción de nutrientes en el rumen',
      'Aumenta la producción de leche hasta un 12% en vacas lecheras',
      'Fortalece las defensas naturales del ganado',
      'Acelera la ganancia de peso en animales de engorde',
      'Compatible con todas las razas bovinas y caprinas',
    ],
    especificaciones: {
      'Presentación':     'Saco de 25 kg / Bolsa de 5 kg',
      'Uso recomendado':  'Bovinos, Ovinos, Caprinos',
      'Dosis diaria':     '50–80 g/animal/día',
      'Registro sanitario': 'INSAI-VE-0021-2022',
      'Origen':           'Venezuela',
      'Conservación':     'Lugar fresco y seco, proteger de la humedad',
    },
    etiquetas: ['ganado','suplemento'],
    destacado: true,
    is_visible: true,
  },
  'p-002': {
    id: 'p-002',
    nombre: 'Shampoo Antialergia Pet',
    precio: 8.99,
    precio_original: 11.50,
    categoria: 'mascotas',
    tipo: 'higiene',
    descripcion: 'Fórmula dermatológica libre de parabenos y sulfatos, diseñada para perros y gatos con piel sensible o propensa a reacciones alérgicas. pH balanceado para la piel canina y felina.',
    descripcion_completa: 'El Shampoo Antialergia Pet fue desarrollado en colaboración con dermatólogos veterinarios para ofrecer una limpieza profunda y segura en animales con historial de alergias cutáneas, eccema o dermatitis atópica.\n\nSu fórmula con avena coloidal y aloe vera calma el picor, reduce la inflamación y deja una película protectora sobre la piel que previene la resequedad post-baño. El fragancia es suave y de larga duración.',
    imagen: 'img/productos/champu-pet-care.png-removebg-preview.png',
    galeria: [],
    beneficios: [
      'Libre de parabenos, sulfatos y colorantes artificiales',
      'Calma el picor y la irritación en piel sensible',
      'pH específico para la piel de perros y gatos (6.5–7.0)',
      'Avena coloidal + Aloe Vera: hidratación profunda',
      'Fragancia suave apta para olfatos sensibles',
    ],
    especificaciones: {
      'Presentación':     'Frasco 500 ml / Frasco 250 ml',
      'Uso recomendado':  'Perros y Gatos',
      'Frecuencia':       'Cada 2–3 semanas o según necesidad',
      'Registro sanitario': 'SASA-VE-0089-2023',
      'Ingredientes clave': 'Avena coloidal, Aloe Vera, D-Pantenol',
      'Origen':           'Venezuela',
    },
    etiquetas: ['mascotas','higiene'],
    destacado: false,
    is_visible: true,
  },
  'p-003': {
    id: 'p-003',
    nombre: 'Ivermectina Forte 3.5%',
    precio: 22.00,
    precio_original: null,
    categoria: 'ganado',
    tipo: 'medicina',
    descripcion: 'Antiparasitario de amplio espectro con 3.5% de concentración para el control total de nematodos gastrointestinales, pulmonares y ectoparásitos en bovinos, equinos, ovinos y caprinos.',
    descripcion_completa: 'Ivermectina Forte 3.5% está formulada con una concentración superior a la estándar del mercado, lo que permite reducir los volúmenes de aplicación y minimizar el estrés del animal durante el tratamiento.\n\nEfectiva contra más de 35 especies de parásitos internos y externos, incluyendo nematodos resistentes a otros principios activos. Su vehículo oleoso garantiza una liberación sostenida del principio activo durante 21 días post-aplicación.',
    imagen: 'img/productos/rich_0005s_0003_Prazoquntel-removebg-preview.png',
    galeria: [],
    beneficios: [
      'Concentración 3.5%: menor dosis, mayor eficacia',
      'Controla más de 35 especies de parásitos',
      'Efecto prolongado de hasta 21 días',
      'Apta para bovinos, equinos, ovinos y caprinos',
      'Liberación sostenida en vehículo oleoso',
    ],
    especificaciones: {
      'Principio activo':  'Ivermectina 3.5%',
      'Presentación':      'Frasco 250 ml / Frasco 500 ml',
      'Vía de aplicación': 'Subcutánea',
      'Dosis':             '1 ml / 33 kg de peso vivo',
      'Periodo de retiro': '28 días (carne) · No usar en lactancia',
      'Registro sanitario': 'INSAI-VE-0047-2021',
    },
    etiquetas: ['ganado','medicina','antiparasitario'],
    destacado: true,
    is_visible: true,
  },
  'p-004': {
    id: 'p-004',
    nombre: 'Antipulgas Plus 4en1',
    precio: 12.00,
    precio_original: null,
    categoria: 'mascotas',
    tipo: 'medicina',
    descripcion: 'Antiparasitario externo de amplio espectro que elimina pulgas, garrapatas, piojos y ácaros en 24 horas. Protección residual de hasta 30 días en perros y gatos.',
    descripcion_completa: 'Antipulgas Plus combina cuatro principios activos complementarios para ofrecer una cobertura antiparasitaria sin precedentes en animales de compañía. Su fórmula de acción rápida elimina el 100% de pulgas adultas en menos de 24 horas y rompe el ciclo de vida del parásito durante todo el mes.\n\nDisponible en formato spot-on (pipeta) y spray para adaptarse a las necesidades de cada mascota.',
    imagen: 'img/productos/antipulgas-removebg-preview.png',
    galeria: [],
    beneficios: [
      'Elimina pulgas adultas en menos de 24 horas',
      'Acción contra garrapatas, piojos y ácaros',
      'Protección residual de 30 días',
      'Disponible en pipeta y spray',
      'Seguro para perros y gatos desde los 3 meses de edad',
    ],
    especificaciones: {
      'Presentación':      'Pipeta 1 ml / Spray 100 ml',
      'Uso recomendado':   'Perros y Gatos',
      'Frecuencia':        'Cada 30 días',
      'Edad mínima':       '3 meses',
      'Peso mínimo':       '1.5 kg',
      'Registro sanitario': 'SASA-VE-0124-2022',
    },
    etiquetas: ['mascotas','medicina','antiparasitario'],
    destacado: false,
    is_visible: true,
  },
};

// ── UTILIDADES ───────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $q = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n) => '$' + Number(n).toFixed(2);
const safeHtml = (str) => {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
};

// ── OBTENER ID DE LA URL ─────────────────────────────────────
function getProductoIdDeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || null;
}

// ── FETCH PRODUCTO DESDE KONT API ────────────────────────────
async function fetchProducto(id) {
  try {
    const url = `${KONT.BASE_URL}/products/${encodeURIComponent(id)}?tenant_id=${KONT.TENANT_ID}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KONT.API_KEY}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    return data.data || data.product || data;

  } catch (err) {
    console.warn(`[Agromedic] API no disponible — modo demo. (${err.message})`);
    // Fallback al catálogo demo
    return CATALOGO_DEMO[id] || null;
  }
}

// ── FETCH PRODUCTOS RELACIONADOS ─────────────────────────────
async function fetchRelacionados(categoria, excludeId) {
  try {
    const url = `${KONT.BASE_URL}/products?tenant_id=${KONT.TENANT_ID}&categoria=${categoria}&is_visible=true&limit=4`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${KONT.API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const lista = data.data || data.products || data;
    return lista.filter(p => p.id !== excludeId).slice(0, 4);

  } catch {
    // Fallback demo
    return Object.values(CATALOGO_DEMO)
      .filter(p => p.categoria === categoria && p.id !== excludeId)
      .slice(0, 4);
  }
}

// ── RENDER: ESTADO DE ERROR ──────────────────────────────────
function renderError(mensaje) {
  $('prod-layout').style.display   = 'none';
  $('prod-error').style.display    = 'flex';
  const desc = $('prod-error-desc');
  if (desc && mensaje) desc.textContent = mensaje;

  // Limpiar breadcrumb skeletons
  $('bc-categoria').className = '';
  $('bc-categoria').textContent = '';
  $('bc-nombre').className = '';
  $('bc-nombre').textContent = 'No encontrado';

  document.title = 'Producto no encontrado | AGROMEDIC';
}

// ── RENDER: INYECTAR PRODUCTO EN EL DOM ──────────────────────
function renderProducto(p) {
  // ── Título de página y meta ──
  document.title = `${p.nombre} | AGROMEDIC`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', p.descripcion || '');

  // ── Breadcrumb ──
  const bcCat = $('bc-categoria');
  bcCat.className = 'prod-breadcrumb__link';
  bcCat.style.width = '';
  bcCat.style.height = '';
  bcCat.textContent = capitalizar(p.categoria || '');
  bcCat.setAttribute('href', `tienda.html?categoria=${p.categoria}`);
  // Convertir en enlace real
  const aLink = document.createElement('a');
  aLink.href = `tienda.html?categoria=${encodeURIComponent(p.categoria || '')}`;
  aLink.className = 'prod-breadcrumb__link';
  aLink.textContent = capitalizar(p.categoria || '');
  bcCat.parentNode.replaceChild(aLink, bcCat);

  const bcNom = $('bc-nombre');
  bcNom.className = 'prod-breadcrumb__current';
  bcNom.style.width = '';
  bcNom.style.height = '';
  bcNom.textContent = p.nombre;

  // ── Tags de categoría ──
  const tagsEl = $('prod-tags');
  tagsEl.innerHTML = '';
  const tagsArr = p.etiquetas || [p.categoria, p.tipo].filter(Boolean);
  tagsArr.forEach((t, i) => {
    const span = document.createElement('span');
    span.className = i === 0 ? 'badge badge-categoria prod-reveal prod-reveal--1' : 'badge badge-tipo prod-reveal prod-reveal--1';
    span.textContent = capitalizar(t);
    tagsEl.appendChild(span);
  });

  // ── Imagen ──
  const imgSkeleton = $('prod-img-skeleton');
  const img         = $('prod-img');
  img.alt = p.nombre;
  img.src = p.imagen || 'img/placeholder.png';
  img.style.display = 'block';

  img.addEventListener('load', () => {
    img.classList.add('loaded');
    if (imgSkeleton) imgSkeleton.style.display = 'none';
  });
  img.addEventListener('error', () => {
    img.src = 'img/placeholder.png';
    img.classList.add('loaded');
    if (imgSkeleton) imgSkeleton.style.display = 'none';
  });

  // ── Badges sobre imagen ──
  const badgesEl = $('prod-img-badges');
  badgesEl.innerHTML = '';
  if (p.destacado) {
    const b = document.createElement('span');
    b.className = 'badge badge-destacado';
    b.innerHTML = '<i class="bi bi-star-fill"></i> Top Ventas';
    badgesEl.appendChild(b);
  }
  if (p.precio_original) {
    const desc = Math.round((1 - p.precio / p.precio_original) * 100);
    const b = document.createElement('span');
    b.className = 'badge';
    b.style.cssText = 'background:rgba(76,255,140,.12);color:var(--c-success);border:1px solid rgba(76,255,140,.25)';
    b.textContent = `-${desc}%`;
    badgesEl.appendChild(b);
  }

  // ── Thumbnails de galería ──
  const thumbsEl = $('prod-thumbs');
  if (p.galeria && p.galeria.length > 0) {
    thumbsEl.style.display = 'flex';
    p.galeria.forEach((src, i) => {
      const btn = document.createElement('button');
      btn.className = 'prod-thumb' + (i === 0 ? ' activo' : '');
      btn.setAttribute('aria-label', `Ver imagen ${i + 1}`);
      const tImg = document.createElement('img');
      tImg.src = src;
      tImg.alt = `${p.nombre} — vista ${i + 1}`;
      tImg.loading = 'lazy';
      btn.appendChild(tImg);
      btn.addEventListener('click', () => {
        img.src = src;
        img.classList.remove('loaded');
        img.onload = () => img.classList.add('loaded');
        thumbsEl.querySelectorAll('.prod-thumb').forEach(t => t.classList.remove('activo'));
        btn.classList.add('activo');
      });
      thumbsEl.appendChild(btn);
    });
  }

  // ── Título del producto ──
  const tituloEl = $('prod-titulo');
  tituloEl.innerHTML = '';
  tituloEl.textContent = p.nombre;
  tituloEl.classList.add('prod-reveal', 'prod-reveal--2');

  // ── Precio ──
  const precioWrap = $('prod-precio-wrap');
  precioWrap.innerHTML = '';

  const precioEl = document.createElement('span');
  precioEl.className = 'prod-precio prod-reveal prod-reveal--2';
  precioEl.textContent = fmt(p.precio);
  precioWrap.appendChild(precioEl);

  if (p.precio_original) {
    const precioOrig = document.createElement('span');
    precioOrig.className = 'prod-precio--original';
    precioOrig.textContent = fmt(p.precio_original);
    precioWrap.appendChild(precioOrig);

    const pct = Math.round((1 - p.precio / p.precio_original) * 100);
    const badge = document.createElement('span');
    badge.className = 'prod-precio--descuento';
    badge.textContent = `-${pct}%`;
    precioWrap.appendChild(badge);
  }

  // ── Descripción corta ──
  const infoEl = $('prod-info');
  // Limpiar skeletons de descripción y reemplazar con texto real
  const descWrap = infoEl.querySelector('.prod-info__desc-wrap');
  if (descWrap) {
    descWrap.innerHTML = '';
    const descP = document.createElement('p');
    descP.className = 'prod-info__desc prod-reveal prod-reveal--3';
    descP.textContent = p.descripcion || '';
    descWrap.appendChild(descP);
  }

  // ── Beneficios ──
  const beneficiosEl  = $('prod-beneficios');
  const benefLista    = $('prod-beneficios-lista');
  if (p.beneficios && p.beneficios.length > 0) {
    benefLista.innerHTML = '';
    p.beneficios.forEach((b, i) => {
      const li = document.createElement('li');
      li.className = 'prod-beneficio-item';
      li.style.animationDelay = `${i * 60}ms`;
      li.innerHTML = `<i class="bi bi-check2-circle"></i> ${safeHtml(b)}`;
      benefLista.appendChild(li);
    });
    beneficiosEl.style.display = 'block';
    beneficiosEl.classList.add('prod-reveal', 'prod-reveal--3');
  }

  // ── Trust badges ──
  const trust = $('prod-trust');
  trust.style.opacity = '1';

  // ── CTA ──
  const ctaEl    = $('prod-cta');
  const divider2 = $('prod-divider-2');
  ctaEl.style.opacity    = '1';
  divider2.style.opacity = '1';
  ctaEl.classList.add('prod-reveal', 'prod-reveal--5');

  // Habilitar botón de carrito
  const btnAgregar = $('btn-agregar-carrito');
  btnAgregar.disabled = false;

  // Botón WhatsApp: enlace de consulta
  const msgWS = encodeURIComponent(
    `Hola, quiero consultar sobre el producto: *${p.nombre}* (ID: ${p.id}).\n¿Está disponible?`
  );
  const btnWS = $('btn-consultar-ws');
  btnWS.href = `https://wa.me/${KONT.WS_NUMBER}?text=${msgWS}`;

  // SKU
  const skuEl = $('prod-sku');
  skuEl.textContent = `SKU: ${p.id}`;
  skuEl.style.opacity = '1';

  // ── Tabs: Descripción completa ──
  const tabDescContent = $('tab-desc-content');
  if (tabDescContent && p.descripcion_completa) {
    tabDescContent.innerHTML = p.descripcion_completa
      .split('\n\n')
      .filter(Boolean)
      .map(par => `<p>${safeHtml(par)}</p>`)
      .join('');
  }

  // ── Tabs: Especificaciones ──
  const specsTable = $('prod-specs-table');
  if (specsTable && p.especificaciones) {
    specsTable.innerHTML = '';
    Object.entries(p.especificaciones).forEach(([key, val]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<th>${safeHtml(key)}</th><td>${safeHtml(val)}</td>`;
      specsTable.appendChild(row);
    });
  }

  // ── Mostrar sección tabs ──
  const tabsSection = $('prod-tabs-section');
  if (tabsSection) {
    tabsSection.style.display = 'block';
    tabsSection.classList.add('prod-reveal', 'prod-reveal--5');
  }
}

// ── RENDER: TARJETA PRODUCTO RELACIONADO ─────────────────────
function renderTarjetaRelacionado(p) {
  const art = document.createElement('article');
  art.className = 'tarjeta-producto';
  art.dataset.id = p.id;
  art.innerHTML = `
    <div class="tarjeta__img-wrap">
      <div class="tarjeta__badges">
        <span class="badge badge-categoria">${safeHtml(capitalizar(p.categoria || ''))}</span>
        ${p.destacado ? '<span class="badge badge-destacado"><i class="bi bi-star-fill"></i> Top</span>' : ''}
      </div>
      <img
        src="${safeHtml(p.imagen || 'img/placeholder.png')}"
        alt="${safeHtml(p.nombre)}"
        loading="lazy"
        onerror="this.src='img/placeholder.png'"
      >
    </div>
    <div class="tarjeta__body">
      <h3 class="tarjeta__nombre">${safeHtml(p.nombre)}</h3>
      <p class="tarjeta__desc">${safeHtml(p.descripcion || '')}</p>
      <p class="tarjeta__precio">${fmt(p.precio)}</p>
      <div class="tarjeta__footer">
        <a href="producto.html?id=${safeHtml(p.id)}" class="btn btn-secondary btn-sm">
          <i class="bi bi-eye"></i> Ver producto
        </a>
        <button
          class="btn btn-primary btn-sm agregar-carrito"
          data-id="${safeHtml(p.id)}"
          data-nombre="${safeHtml(p.nombre)}"
          data-precio="${p.precio}"
          data-img="${safeHtml(p.imagen || '')}"
        >
          <i class="bi bi-cart-plus"></i> Añadir
        </button>
      </div>
    </div>`;
  return art;
}

// ── SELECTOR DE CANTIDAD ──────────────────────────────────────
function initSelectorQty() {
  const qtyInput = $('qty-input');
  const btnMas   = $('qty-mas');
  const btnMenos = $('qty-menos');
  if (!qtyInput || !btnMas || !btnMenos) return;

  btnMas.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) || 1;
    if (v < 99) qtyInput.value = v + 1;
  });

  btnMenos.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) || 1;
    if (v > 1) qtyInput.value = v - 1;
  });

  qtyInput.addEventListener('change', () => {
    let v = parseInt(qtyInput.value) || 1;
    v = Math.max(1, Math.min(99, v));
    qtyInput.value = v;
  });
}

// ── BOTÓN AÑADIR AL CARRITO ──────────────────────────────────
function initBtnCarrito(producto) {
  const btn = $('btn-agregar-carrito');
  if (!btn) return;

  // Verificar si ya está en carrito
  const carrito = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
  if (carrito.some(i => i.id === producto.id)) {
    btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> <span>En el carrito</span>';
    btn.classList.add('en-carrito');
  }

  btn.addEventListener('click', () => {
    const qty = parseInt($('qty-input')?.value) || 1;
    agregarAlCarritoDetalle(producto, qty);
  });
}

function agregarAlCarritoDetalle(producto, qty) {
  const carrito = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
  const existente = carrito.find(i => i.id === producto.id);

  if (existente) {
    existente.cantidad = Math.min(existente.cantidad + qty, 99);
  } else {
    carrito.push({
      id:      producto.id,
      nombre:  producto.nombre,
      precio:  producto.precio,
      imagen:  producto.imagen || '',
      cantidad: qty,
    });
  }

  localStorage.setItem('agro_carrito', JSON.stringify(carrito));

  // Actualizar UI
  const btn = $('btn-agregar-carrito');
  btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> <span>En el carrito</span>';
  btn.classList.add('en-carrito');

  // Actualizar contador header
  const total = carrito.reduce((s, i) => s + i.cantidad, 0);
  document.querySelectorAll('.contador-carrito').forEach(el => {
    el.textContent = total;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 200);
  });

  // Toast
  mostrarToast(`${qty > 1 ? qty + '× ' : ''}${producto.nombre} añadido al carrito`, 'success');
}

// ── TABS ─────────────────────────────────────────────────────
function initTabs() {
  const tabs   = document.querySelectorAll('.prod-tab');
  const panels = document.querySelectorAll('.prod-tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('activo');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('activo'));

      tab.classList.add('activo');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add('activo');
    });
  });
}

// ── TOAST LOCAL ───────────────────────────────────────────────
function mostrarToast(msg, tipo) {
  tipo = tipo || 'info';
  const toast = document.getElementById('toast-global');
  if (!toast) return;
  const icons = {
    success: 'bi-check-circle-fill',
    error:   'bi-x-circle-fill',
    info:    'bi-info-circle-fill',
  };
  toast.className = 'toast toast-' + tipo;
  const ico = document.getElementById('toast-icono');
  const txt = document.getElementById('toast-texto');
  if (ico) ico.className = 'bi ' + (icons[tipo] || icons.info) + ' toast__icon';
  if (txt) txt.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ── UTILIDADES DE TEXTO ───────────────────────────────────────
function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ── INICIALIZACIÓN PRINCIPAL ──────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Obtener ID del producto
  const productoId = getProductoIdDeURL();

  if (!productoId) {
    renderError('No se especificó ningún producto. Vuelve a la tienda y selecciona uno.');
    return;
  }

  // Inicializar header / drawer desde app.js (si está cargado)
  if (typeof initHeader === 'function') initHeader();
  if (typeof initDrawer === 'function') initDrawer();
  if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();

  // Inicializar tabs mientras se carga
  initTabs();
  initSelectorQty();

  // ── Simular delay mínimo para mostrar skeletons ──
  // (en producción el fetch real ya introduce la latencia)
  const [producto] = await Promise.all([
    fetchProducto(productoId),
    new Promise(r => setTimeout(r, 400)), // mínimo 400ms de skeleton visible
  ]);

  // ── Producto no encontrado ──
  if (!producto || producto.is_visible === false) {
    renderError(
      producto
        ? 'Este producto no está disponible en este momento.'
        : 'El producto que buscas no existe en nuestro catálogo.'
    );
    return;
  }

  // ── Inyectar datos en el DOM ──
  renderProducto(producto);

  // ── Inicializar interactividad del carrito ──
  initBtnCarrito(producto);

  // ── Cargar productos relacionados (sin bloquear el render principal) ──
  if (producto.categoria) {
    fetchRelacionados(producto.categoria, producto.id).then(relacionados => {
      if (!relacionados || relacionados.length === 0) return;

      const seccion = $('prod-relacionados');
      const grid    = $('relacionados-grid');
      if (!seccion || !grid) return;

      seccion.style.display = 'block';
      grid.innerHTML = '';

      relacionados.forEach(rel => {
        const card = renderTarjetaRelacionado(rel);
        grid.appendChild(card);
      });

      // Bind de botones añadir en relacionados
      grid.querySelectorAll('.agregar-carrito').forEach(btn => {
        btn.addEventListener('click', () => {
          agregarAlCarritoDetalle({
            id:     btn.dataset.id,
            nombre: btn.dataset.nombre,
            precio: parseFloat(btn.dataset.precio),
            imagen: btn.dataset.img,
          }, 1);
          btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> Añadido';
        });
      });
    });
  }
});
})();