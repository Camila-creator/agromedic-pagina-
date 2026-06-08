/* ============================================================
   AGROMEDIC — PRODUCTOS.JS
   ✅ BUG 4 CORREGIDO: endpoint correcto /api/ecommerce/:slug/catalogo/:id
   ✅ FASE 3 APLICADA: Inyección dinámica de JSONB (Beneficios, Specs, Desc)
   ============================================================ */
(() => {
'use strict';

// ── CATÁLOGO DEMO (fallback) ──────────
const CATALOGO_DEMO = {
  '1': { id: 1, nombre: 'Suplemento Mineral FOS', precio: 15.50, categoria: 'ganado', descripcion: 'Suplemento mineral de alta concentración.', web_long_description: 'El Suplemento Mineral FOS combina minerales quelatados de alta biodisponibilidad con prebióticos naturales que estimulan el desarrollo de bacterias beneficiosas en el rumen.', imagen: 'img/prueba-agro.jpg', etiquetas: ['ganado','suplemento'], destacado: true, disponible: true, web_benefits: ['Mejora la digestión y absorción de nutrientes','Aumenta la producción de leche','Fortalece las defensas naturales','Acelera la ganancia de peso'], web_specs: { 'Presentación': 'Saco 25 kg / Bolsa 5 kg', 'Dosis diaria': '50–80 g/animal/día', 'Origen': 'Venezuela' } },
  '2': { id: 2, nombre: 'Shampoo Antialergia Pet', precio: 8.99, precio_original: 11.50, categoria: 'mascotas', descripcion: 'Fórmula libre de parabenos.', web_long_description: 'Desarrollado con dermatólogos veterinarios para una limpieza profunda y segura.', imagen: 'img/prueba-agro-2.png', etiquetas: ['mascotas','higiene'], destacado: false, disponible: true, web_benefits: ['Libre de parabenos y sulfatos','Calma el picor y la irritación','pH específico para mascotas'], web_specs: { 'Presentación': 'Frasco 500 ml', 'Frecuencia': 'Cada 2–3 semanas', 'Origen': 'Venezuela' } },
};

// ── UTILIDADES ───────────────────────────────────────────────
const $  = (id)  => document.getElementById(id);
const $q = (sel, ctx = document) => ctx.querySelector(sel);
const fmt     = (n) => '$' + Number(n).toFixed(2);
const safeHtml = (str) => { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; };

// ── OBTENER ID DE LA URL ─────────────────────────────────────
function getProductoIdDeURL() {
  return new URLSearchParams(window.location.search).get('id') || null;
}

async function fetchProducto(id) {
  if (!window.KontAPI || !window.KONT) {
    console.error('[Agromedic/productos] Dependencias críticas no cargadas.');
    return null; 
  }

  if (!window.KONT.DEMO_MODE) {
    try {
      console.log(`[Agromedic/productos] Solicitando producto ID: ${id} al servidor...`);
      const data = await window.KontAPI.getProduct(id);
      return data.data || data;
    } catch (err) {
      console.error(`[Agromedic/productos] FALLO DE RED/SERVIDOR. Detalle:`, err);
      mostrarToast('Error de conexión. Por favor, recargue.', 'error');
      return null;
    }
  }

  console.log('[Agromedic/productos] DEMO_MODE activado.');
  const idStr = String(id);
  return CATALOGO_DEMO[idStr] || Object.values(CATALOGO_DEMO).find(p => String(p.id) === idStr) || null;
}

async function fetchRelacionados(categoria, excludeId) {
  if (window.KontAPI && window.KONT && !window.KONT.DEMO_MODE) {
    try {
      const data = await window.KontAPI.getCatalog({ categoria, limit: 5 });
      const lista = data.data || [];
      return lista.filter(p => String(p.id) !== String(excludeId)).slice(0, 4);
    } catch {}
  }
  return Object.values(CATALOGO_DEMO).filter(p => p.categoria === categoria && String(p.id) !== String(excludeId)).slice(0, 4);
}

function renderError(mensaje) {
  const layout = $('prod-layout'), errEl = $('prod-error');
  if (layout) layout.style.display = 'none';
  if (errEl)  errEl.style.display  = 'flex';
  const desc = $('prod-error-desc');
  if (desc && mensaje) desc.textContent = mensaje;
  const bcNom = $('bc-nombre');
  if (bcNom) { bcNom.className = ''; bcNom.textContent = 'No encontrado'; }
  document.title = 'Producto no encontrado | AGROMEDIC';
}

// ── RENDER: PRODUCTO ──────────────────────────────────────────
function renderProducto(p) {
  document.title = `${p.nombre} | AGROMEDIC`;
  const metaDesc = document.querySelector('meta[name="description"]');
  // Usa la descripción web corta (o p.descripcion si es el demo)
  if (metaDesc) metaDesc.setAttribute('content', p.web_description || p.descripcion || '');

  // Breadcrumb
  const bcCat = $('bc-categoria');
  if (bcCat) {
    const aLink = document.createElement('a');
    aLink.href = `tienda.html?categoria=${encodeURIComponent(p.categoria || '')}`;
    aLink.className = 'prod-breadcrumb__link';
    aLink.textContent = capitalizar(p.categoria || '');
    bcCat.parentNode.replaceChild(aLink, bcCat);
  }
  const bcNom = $('bc-nombre');
  if (bcNom) { bcNom.className = 'prod-breadcrumb__current'; bcNom.style.width = ''; bcNom.style.height = ''; bcNom.textContent = p.nombre; }

  // Tags (Web Tags del JSONB)
  const tagsEl = $('prod-tags');
  if (tagsEl) {
    tagsEl.innerHTML = '';
    const tagsArr = Array.isArray(p.web_tags) && p.web_tags.length > 0 ? p.web_tags : (p.etiquetas || [p.categoria].filter(Boolean));
    tagsArr.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = i === 0 ? 'badge badge-categoria prod-reveal prod-reveal--1' : 'badge badge-tipo prod-reveal prod-reveal--1';
      span.textContent = capitalizar(t);
      tagsEl.appendChild(span);
    });
  }

  // Imagen principal
  const imgSkeleton = $('prod-img-skeleton'), img = $('prod-img');
  if (img) {
    img.alt = p.nombre;
    img.src = p.imagen || 'img/placeholder.png';
    img.style.display = 'block';
    img.addEventListener('load', () => { img.classList.add('loaded'); if (imgSkeleton) imgSkeleton.style.display = 'none'; });
    img.addEventListener('error', () => { img.src = 'img/placeholder.png'; img.classList.add('loaded'); if (imgSkeleton) imgSkeleton.style.display = 'none'; });
  }

  // Badges sobre imagen
  const badgesEl = $('prod-img-badges');
  if (badgesEl) {
    badgesEl.innerHTML = '';
    if (p.destacado) { const b = document.createElement('span'); b.className = 'badge badge-destacado'; b.innerHTML = '<i class="bi bi-star-fill"></i> Top Ventas'; badgesEl.appendChild(b); }
    if (p.precio_original) { const desc = Math.round((1 - p.precio / p.precio_original) * 100); const b = document.createElement('span'); b.className = 'badge'; b.style.cssText = 'background:rgba(76,255,140,.12);color:var(--c-success);border:1px solid rgba(76,255,140,.25)'; b.textContent = `-${desc}%`; badgesEl.appendChild(b); }
  }

  // Título
  const tituloEl = $('prod-titulo');
  if (tituloEl) { tituloEl.textContent = p.nombre; tituloEl.classList.add('prod-reveal','prod-reveal--2'); }

  // Precio
  const precioWrap = $('prod-precio-wrap');
  if (precioWrap) {
    precioWrap.innerHTML = '';
    const precioEl = document.createElement('span');
    precioEl.className = 'prod-precio prod-reveal prod-reveal--2';
    precioEl.textContent = fmt(p.precio);
    precioWrap.appendChild(precioEl);
    if (p.precio_original) {
      const orig = document.createElement('span'); orig.className = 'prod-precio--original'; orig.textContent = fmt(p.precio_original); precioWrap.appendChild(orig);
      const pct = Math.round((1 - p.precio / p.precio_original) * 100); const badge = document.createElement('span'); badge.className = 'prod-precio--descuento'; badge.textContent = `-${pct}%`; precioWrap.appendChild(badge);
    }
  }

  // Descripción corta
  const infoEl = $('prod-info');
  if (infoEl) {
    const descWrap = infoEl.querySelector('.prod-info__desc-wrap');
    if (descWrap) { 
      descWrap.innerHTML = ''; 
      const descP = document.createElement('p'); 
      descP.className = 'prod-info__desc prod-reveal prod-reveal--3'; 
      descP.textContent = p.web_description || p.descripcion || ''; 
      descWrap.appendChild(descP); 
    }
  }

  // ── BENEFICIOS (NUEVO JSONB ARRAY) ──
  const benefLista = $('prod-beneficios-lista'), beneficiosEl = $('prod-beneficios');
  const beneficiosData = p.web_benefits || p.beneficios; // Mapea desde BD o Demo
  
  if (benefLista && Array.isArray(beneficiosData) && beneficiosData.length > 0) {
    benefLista.innerHTML = '';
    beneficiosData.forEach((b, i) => { 
      const li = document.createElement('li'); 
      li.className = 'prod-beneficio-item'; 
      li.style.animationDelay = `${i * 60}ms`; 
      li.innerHTML = `<i class="bi bi-check2-circle"></i> <span>${safeHtml(b)}</span>`; 
      benefLista.appendChild(li); 
    });
    if (beneficiosEl) { beneficiosEl.style.display = 'block'; beneficiosEl.classList.add('prod-reveal','prod-reveal--3'); }
  } else if (beneficiosEl) {
    beneficiosEl.style.display = 'none'; // Ocultar bloque si no hay beneficios (Ej: Tienda de ropa)
  }

  // Trust y CTA
  const trust = $('prod-trust'), ctaEl = $('prod-cta'), divider2 = $('prod-divider-2');
  if (trust) trust.style.opacity = '1';
  if (ctaEl) { ctaEl.style.opacity = '1'; ctaEl.classList.add('prod-reveal','prod-reveal--5'); }
  if (divider2) divider2.style.opacity = '1';

  // Botón añadir
  const btnAgregar = $('btn-agregar-carrito');
  if (btnAgregar) {
    if (p.disponible === false) { btnAgregar.disabled = true; btnAgregar.textContent = 'Sin stock'; }
    else btnAgregar.disabled = false;
  }

  // Botón WhatsApp
  const wsNum = (window.KONT && window.KONT.WS_NUMBER) || '584226396237';
  const msgWS = encodeURIComponent(`Hola, quiero consultar sobre el producto: *${p.nombre}* (ID: ${p.id}).\n¿Está disponible?`);
  const btnWS = $('btn-consultar-ws');
  if (btnWS) btnWS.href = `https://wa.me/${wsNum}?text=${msgWS}`;

  // SKU
  const skuEl = $('prod-sku');
  if (skuEl) { skuEl.textContent = `SKU: ${p.id}`; skuEl.style.opacity = '1'; }

  // ── TABS: DESCRIPCIÓN COMPLETA (TEXTO NUEVO) ──
  const tabDescContent = $('tab-desc-content');
  const longDescData = p.web_long_description || p.descripcion_completa;
  
  if (tabDescContent) {
    if (longDescData) {
      tabDescContent.innerHTML = longDescData.split('\n\n').filter(Boolean).map(par => `<p>${safeHtml(par)}</p>`).join('');
    } else {
      tabDescContent.innerHTML = '<p>No hay descripción detallada disponible para este producto.</p>';
    }
  }

  // ── TABS: ESPECIFICACIONES (NUEVO JSONB OBJECT) ──
  const specsTable = $('prod-specs-table');
  const specsData = p.web_specs || p.especificaciones;
  
  if (specsTable) {
    specsTable.innerHTML = '';
    // Verificamos si es un objeto válido y si tiene propiedades
    if (typeof specsData === 'object' && specsData !== null && Object.keys(specsData).length > 0) {
      Object.entries(specsData).forEach(([key, val]) => {
        const row = document.createElement('tr'); 
        row.innerHTML = `<th>${safeHtml(key)}</th><td>${safeHtml(val)}</td>`; 
        specsTable.appendChild(row);
      });
    } else {
      specsTable.innerHTML = '<tr><td colspan="2" style="text-align:center;">No hay especificaciones técnicas registradas.</td></tr>';
    }
  }

  // Sección tabs
  const tabsSection = $('prod-tabs-section');
  if (tabsSection) { tabsSection.style.display = 'block'; tabsSection.classList.add('prod-reveal','prod-reveal--5'); }
}

// ── RESTO DE LAS FUNCIONES (Relacionados, QTY, etc) ───────────
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
      <img src="${safeHtml(p.imagen || 'img/placeholder.png')}" alt="${safeHtml(p.nombre)}" loading="lazy" onerror="this.src='img/placeholder.png'">
    </div>
    <div class="tarjeta__body">
      <h3 class="tarjeta__nombre">${safeHtml(p.nombre)}</h3>
      <p class="tarjeta__desc">${safeHtml(p.web_description || p.descripcion || '')}</p>
      <p class="tarjeta__precio">${fmt(p.precio)}</p>
      <div class="tarjeta__footer">
        <a href="producto.html?id=${safeHtml(p.id)}" class="btn btn-secondary btn-sm"><i class="bi bi-eye"></i> Ver</a>
        <button class="btn btn-primary btn-sm agregar-carrito" data-id="${safeHtml(p.id)}" data-nombre="${safeHtml(p.nombre)}" data-precio="${p.precio}" data-img="${safeHtml(p.imagen || '')}"><i class="bi bi-cart-plus"></i> Añadir</button>
      </div>
    </div>`;
  return art;
}

function initSelectorQty() {
  const qtyInput = $('qty-input'), btnMas = $('qty-mas'), btnMenos = $('qty-menos');
  if (!qtyInput || !btnMas || !btnMenos) return;
  btnMas.addEventListener('click', () => { const v = parseInt(qtyInput.value)||1; if(v<99) qtyInput.value=v+1; });
  btnMenos.addEventListener('click', () => { const v = parseInt(qtyInput.value)||1; if(v>1) qtyInput.value=v-1; });
  qtyInput.addEventListener('change', () => { let v = parseInt(qtyInput.value)||1; qtyInput.value = Math.max(1,Math.min(99,v)); });
}

function initBtnCarrito(producto) {
  const btn = $('btn-agregar-carrito');
  if (!btn) return;
  const carrito = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
  if (carrito.some(i => String(i.id) === String(producto.id))) { btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> <span>En el carrito</span>'; btn.classList.add('en-carrito'); }
  btn.addEventListener('click', () => {
    const qty=parseInt($('qty-input')?.value)||1;
    if(window.agregarAlCarrito){window.agregarAlCarrito({id:producto.id,nombre:producto.nombre,precio:producto.precio,imagen:producto.imagen||''},qty);btn.innerHTML='<i class="bi bi-cart-check-fill"></i> <span>En el carrito</span>';btn.classList.add('en-carrito');mostrarToast((qty>1?qty+'x ':'')+producto.nombre+' añadido','success');return;}
    const carritoActual = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
    const existente = carritoActual.find(i => String(i.id) === String(producto.id));
    if (existente) existente.cantidad = Math.min(existente.cantidad + qty, 99);
    else carritoActual.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen || '', cantidad: qty });
    localStorage.setItem('agro_carrito', JSON.stringify(carritoActual));
    btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> <span>En el carrito</span>';
    btn.classList.add('en-carrito');
    const total = carritoActual.reduce((s,i)=>s+i.cantidad,0);
    document.querySelectorAll('.contador-carrito').forEach(el => { el.textContent = total; el.classList.add('bump'); setTimeout(()=>el.classList.remove('bump'),200); });
    mostrarToast(`${qty > 1 ? qty+'× ' : ''}${producto.nombre} añadido al carrito`, 'success');
  });
}

function initTabs() {
  document.querySelectorAll('.prod-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.prod-tab').forEach(t => { t.classList.remove('activo'); t.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.prod-tab-panel').forEach(p => p.classList.remove('activo'));
      tab.classList.add('activo'); tab.setAttribute('aria-selected','true');
      const panel = document.getElementById(`tab-${tab.dataset.tab}`); if (panel) panel.classList.add('activo');
    });
  });
}

function mostrarToast(msg, tipo) {
  if (window.showToast) { window.showToast(msg, tipo); return; }
  const toast = document.getElementById('toast-global'); if (!toast) return;
  const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill' };
  toast.className = 'toast toast-' + (tipo||'info');
  const ico = document.getElementById('toast-icono'), txt = document.getElementById('toast-texto');
  if (ico) ico.className = 'bi ' + (icons[tipo]||icons.info) + ' toast__icon';
  if (txt) txt.textContent = msg;
  toast.classList.add('visible'); clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function capitalizar(str) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }

document.addEventListener('DOMContentLoaded', async () => {
  const productoId = getProductoIdDeURL();
  if (!productoId) { renderError('No se especificó ningún producto. Vuelve a la tienda y selecciona uno.'); return; }

  if (typeof initHeader === 'function') initHeader();
  if (typeof initDrawer === 'function') initDrawer();
  if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();

  initTabs();
  initSelectorQty();

  const [producto] = await Promise.all([
    fetchProducto(productoId),
    new Promise(r => setTimeout(r, 350)),
  ]);

  if (!producto || (producto.disponible === false && producto.disponible !== undefined)) {
    if (!producto) { renderError('El producto que buscas no existe en nuestro catálogo.'); return; }
  }

  renderProducto(producto);
  initBtnCarrito(producto);

  if (producto.categoria) {
    fetchRelacionados(producto.categoria, producto.id).then(relacionados => {
      if (!relacionados || relacionados.length === 0) return;
      const seccion = $('prod-relacionados'), grid = $('relacionados-grid');
      if (!seccion || !grid) return;
      seccion.style.display = 'block';
      grid.innerHTML = '';
      relacionados.forEach(rel => {
        const card = renderTarjetaRelacionado(rel);
        grid.appendChild(card);
        card.querySelector('.agregar-carrito')?.addEventListener('click', function() {
          const carritoActual = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
          const existente = carritoActual.find(i => String(i.id) === String(this.dataset.id));
          if (existente) existente.cantidad = Math.min(existente.cantidad + 1, 99);
          else carritoActual.push({ id: this.dataset.id, nombre: this.dataset.nombre, precio: parseFloat(this.dataset.precio), imagen: this.dataset.img, cantidad: 1 });
          localStorage.setItem('agro_carrito', JSON.stringify(carritoActual));
          this.innerHTML = '<i class="bi bi-cart-check-fill"></i> Añadido';
          mostrarToast(`${this.dataset.nombre} añadido`, 'success');
        });
      });
    });
  }
});
})();