/* ============================================================
   AGROMEDIC — TIENDA.JS
   ✅ BUG 3 CORREGIDO: tienda.html no tenía ningún script que
   llamara a cargarProductos() ni renderizara las tarjetas.
   Este archivo soluciona eso completamente.

   Depende de: app.js (debe cargarse antes)
   ============================================================ */
'use strict';

(async function initTienda() {
  var COMP_KEY='agro_comparador',MAX_COMP=3;
  function getComp(){try{return JSON.parse(localStorage.getItem(COMP_KEY)||'[]');}catch(e){return[];}}
  function setComp(l){localStorage.setItem(COMP_KEY,JSON.stringify(l));updateCompBadge();}
  function updateCompBadge(){var n=getComp().length;document.querySelectorAll('.comparador-badge').forEach(function(b){b.textContent=n;b.style.display=n>0?'flex':'none';});}
  function addToComp(p){var l=getComp();if(l.find(function(x){return String(x.id)===String(p.id);})){if(window.showToast)showToast(p.nombre+' ya esta','info');return;}if(l.length>=MAX_COMP){if(window.showToast)showToast('Max '+MAX_COMP+' en comparador','error');return;}l.push(p);setComp(l);if(window.showToast)showToast(p.nombre+' al comparador','success');}


  const grid         = document.getElementById('productos-grid');
  const countEl      = document.getElementById('resultados-count');
  const buscadorInput = document.getElementById('buscador-input');

  if (!grid) return; // No estamos en tienda.html

  // Estado local de la tienda
  let filtroCategoria = 'todos';
  let filtroTipo      = 'todos';
  let busqueda        = '';
  let debounceTimer   = null;
  let todosLosProductos = [];

  // ── RENDER DE TARJETA ──────────────────────────────────────
  function crearTarjeta(p) {
    const art       = document.createElement('article');
    art.className   = 'tarjeta-producto';
    art.dataset.id  = p.id;
    art.dataset.cat = (p.categoria || '').toLowerCase();
    // Compatibilidad: etiquetas puede venir como array o como string
    const etiquetas = Array.isArray(p.etiquetas) ? p.etiquetas : [];
    art.dataset.etiquetas = etiquetas.join(',').toLowerCase();

    const disponible = p.disponible !== false;
    const destBadge  = p.destacado ? `<span class="badge badge-destacado"><i class="bi bi-star-fill"></i> Top Ventas</span>` : '';
    const ofertaBadge = etiquetas.includes('oferta') ? `<span class="badge" style="background:rgba(76,255,140,.12);color:var(--c-success,#4cff8c);border:1px solid rgba(76,255,140,.25)">Oferta</span>` : '';

    art.innerHTML = `
      <div class="tarjeta__img-wrap">
        <div class="tarjeta__badges">
          <span class="badge badge-categoria">${safeHtml(p.categoria || 'Producto')}</span>
          ${destBadge}${ofertaBadge}
        </div>
        <img
          src="${safeHtml(p.imagen || 'img/placeholder.png')}"
          alt="${safeHtml(p.nombre)}"
          loading="lazy"
          onerror="this.src='img/placeholder.png'"
        >
        ${!disponible ? '<div class="tarjeta__agotado">Agotado</div>' : ''}
      </div>
      <div class="tarjeta__body">
        <h3 class="tarjeta__nombre">${safeHtml(p.nombre)}</h3>
        <p class="tarjeta__desc">${safeHtml(p.descripcion || '')}</p>
        <p class="tarjeta__precio">${fmt(p.precio)}</p>
        <div class="tarjeta__footer">
          <a href="productos.html?id=${encodeURIComponent(p.id)}" class="btn btn-secondary btn-sm">
            <i class="bi bi-eye"></i> Ver
          </a>
          <button class="btn btn-ghost btn-sm btn-comparar" title="Comparar"><i class="bi bi-bar-chart-steps"></i></button>
          <button
            class="btn btn-primary btn-sm btn-agregar-carrito"
            data-id="${p.id}"
            data-nombre="${safeHtml(p.nombre)}"
            data-precio="${p.precio}"
            data-imagen="${safeHtml(p.imagen || '')}"
            ${!disponible ? 'disabled title="Sin stock"' : ''}
          >
            <i class="bi bi-cart-plus"></i> Añadir
          </button>
        </div>
      </div>`;

    // Bind del botón de carrito
    const btnAdd = art.querySelector('.btn-agregar-carrito');
    if (btnAdd && disponible) {
      btnAdd.addEventListener('click', () => {
        agregarAlCarrito({
          id:     p.id,
          nombre: p.nombre,
          precio: p.precio,
          imagen: p.imagen || '',
        });
        btnAdd.innerHTML = '<i class="bi bi-cart-check-fill"></i> Añadido';
        setTimeout(() => { btnAdd.innerHTML = '<i class="bi bi-cart-plus"></i> Añadir'; }, 2000);
      });
    }

    return art;
  }

  // ── RENDER DEL GRID ────────────────────────────────────────
  function renderGrid(productos) {
    // Filtrar localmente (para no hacer una petición por cada filtro)
    let filtrados = productos;

    if (filtroCategoria !== 'todos') {
      filtrados = filtrados.filter(p =>
        (p.categoria || '').toLowerCase() === filtroCategoria.toLowerCase()
      );
    }

    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(p => {
        const tags = Array.isArray(p.etiquetas) ? p.etiquetas : [];
        return tags.some(t => t.toLowerCase() === filtroTipo.toLowerCase());
      });
    }

    if (busqueda.trim().length >= 2) {
      const q = busqueda.trim().toLowerCase();
      filtrados = filtrados.filter(p =>
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q) ||
        (Array.isArray(p.etiquetas) && p.etiquetas.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Limpiar skeletons y tarjetas previas
    grid.innerHTML = '';

    if (filtrados.length === 0) {
      grid.innerHTML = `
        <div class="tienda-vacia" style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--c-text-muted,#888)">
          <i class="bi bi-search" style="font-size:2.5rem;display:block;margin-bottom:1rem;opacity:.4"></i>
          <p>No encontramos productos con esos filtros.</p>
          <button class="btn btn-secondary" style="margin-top:1rem" id="btn-limpiar-filtros">
            <i class="bi bi-arrow-counterclockwise"></i> Limpiar filtros
          </button>
        </div>`;
      const btnLimpiar = document.getElementById('btn-limpiar-filtros');
      if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
    } else {
      filtrados.forEach(p => grid.appendChild(crearTarjeta(p)));
    }

    // Actualizar contador de resultados
    if (countEl) {
      const n = filtrados.length;
      countEl.innerHTML = n > 0
        ? `Mostrando <strong>${n}</strong> producto${n !== 1 ? 's' : ''}`
        : 'Sin resultados';
    }
  }

  // ── FILTROS DE CATEGORÍA Y TIPO ─────────────────────────────
  function bindFiltros() {
    document.querySelectorAll('.filtro-btn[data-tipo-filtro="categoria"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn[data-tipo-filtro="categoria"]').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        filtroCategoria = btn.dataset.filtro || 'todos';
        renderGrid(todosLosProductos);
      });
    });

    document.querySelectorAll('.filtro-btn[data-tipo-filtro="tipo"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn[data-tipo-filtro="tipo"]').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        filtroTipo = btn.dataset.filtro || 'todos';
        renderGrid(todosLosProductos);
      });
    });
  }

  // ── BUSCADOR con DEBOUNCE ──────────────────────────────────
  function bindBuscador() {
    if (!buscadorInput) return;
    buscadorInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        busqueda = buscadorInput.value;
        renderGrid(todosLosProductos);
      }, 300);
    });
  }

  function limpiarFiltros() {
    filtroCategoria = 'todos';
    filtroTipo      = 'todos';
    busqueda        = '';
    if (buscadorInput) buscadorInput.value = '';
    document.querySelectorAll('.filtro-btn[data-filtro="todos"]').forEach(b => b.classList.add('activo'));
    document.querySelectorAll('.filtro-btn:not([data-filtro="todos"])').forEach(b => b.classList.remove('activo'));
    renderGrid(todosLosProductos);
  }

  // ── INICIALIZACIÓN ─────────────────────────────────────────
  bindFiltros();
  bindBuscador();

  // Mostrar texto de carga
  if (countEl) countEl.textContent = 'Cargando productos...';

  // Cargar desde la API (cargarProductos viene de app.js)
  const resp = await cargarProductos();
  todosLosProductos = resp.data || [];

  // Renderizar
  renderGrid(todosLosProductos);

  // Si la API devolvió categorías dinámicas, actualizar los filtros opcionales
  // (para versión futura — por ahora los filtros son estáticos en el HTML)

})();
