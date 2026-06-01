/* ============================================================
   AGROMEDIC — CONTACTO.JS
   Lógica de la página de contacto:
   - Selector de motivo
   - Carga estados/ciudades
   - Resumen del carrito
   - Toggle factura/RIF
   - Contador de caracteres
   - FAQ accordion
   - Generación y envío por WhatsApp
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  var WS_NUMBER = '584226396237';

  var ESTADOS_VE = {
    "Amazonas":        ["Puerto Ayacucho","San Fernando de Atabapo"],
    "Anzoátegui":      ["Barcelona","Puerto La Cruz","Lechería","El Tigre","Anaco"],
    "Apure":           ["San Fernando de Apure","Guasdualito","Achaguas"],
    "Aragua":          ["Maracay","Turmero","La Victoria","Cagua","Palo Negro"],
    "Barinas":         ["Barinas","Barinitas","Socopó","Sabaneta"],
    "Bolívar":         ["Ciudad Bolívar","Ciudad Guayana","Upata","Santa Elena de Uairén"],
    "Carabobo":        ["Valencia","Puerto Cabello","Guacara","San Diego","Naguanagua","Mariara"],
    "Cojedes":         ["San Carlos","Tinaquillo","Tinaco"],
    "Delta Amacuro":   ["Tucupita","Pedernales"],
    "Distrito Capital":["Caracas"],
    "Falcón":          ["Coro","Punto Fijo","Chichiriviche","Tucacas"],
    "Guárico":         ["San Juan de los Morros","Valle de la Pascua","Calabozo","Zaraza"],
    "La Guaira":       ["La Guaira","Catia La Mar","Maiquetía","Caraballeda"],
    "Lara":            ["Barquisimeto","Cabudare","Carora","Quíbor"],
    "Mérida":          ["Mérida","El Vigía","Tovar","Ejido"],
    "Miranda":         ["Los Teques","Guarenas","Guatire","Ocumare del Tuy","Cúa","Charallave"],
    "Monagas":         ["Maturín","Punta de Mata","Caripito"],
    "Nueva Esparta":   ["Porlamar","Pampatar","La Asunción","Juan Griego"],
    "Portuguesa":      ["Guanare","Acarigua","Araure","Turén"],
    "Sucre":           ["Cumaná","Carúpano","Güiria"],
    "Táchira":         ["San Cristóbal","Táriba","Rubio","San Antonio del Táchira"],
    "Trujillo":        ["Trujillo","Valera","Boconó"],
    "Yaracuy":         ["San Felipe","Chivacoa","Yaritagua"],
    "Zulia":           ["Maracaibo","Cabimas","Ciudad Ojeda","Machiques","San Francisco","Lagunillas"]
  };

  var safeText = function (v) { return (v || '').toString().trim(); };
  var fmt = function (n) { return '$' + Number(n).toFixed(2); };

  function showToast(msg, tipo) {
    tipo = tipo || 'info';
    var toast = document.getElementById('toast-global');
    if (!toast) return;
    var icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
    toast.className = 'toast toast-' + tipo;
    var ico = document.getElementById('toast-icono');
    var txt = document.getElementById('toast-texto');
    if (ico) ico.className = 'bi ' + (icons[tipo] || icons.info) + ' toast__icon';
    if (txt) txt.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('visible'); }, 3200);
  }

  /* ── 1. ESTADOS / CIUDADES ─────────────────────────────── */
  function initEstados() {
    var selE = document.getElementById('ctc-select-estado');
    var selC = document.getElementById('ctc-select-ciudad');
    if (!selE || !selC) return;

    Object.keys(ESTADOS_VE).sort().forEach(function (e) {
      var o = document.createElement('option');
      o.value = e; o.textContent = e;
      selE.appendChild(o);
    });

    selE.addEventListener('change', function () {
      var estado = selE.value;
      selC.innerHTML = '<option value="">Selecciona tu Ciudad</option>';
      if (estado && ESTADOS_VE[estado]) {
        ESTADOS_VE[estado].slice().sort().forEach(function (c) {
          var o = document.createElement('option');
          o.value = c; o.textContent = c;
          selC.appendChild(o);
        });
      }
    });
  }

  /* ── 2. SELECTOR DE MOTIVO ─────────────────────────────── */
  function initMotivo() {
    var grid   = document.getElementById('ctc-motivo-grid');
    var hidden = document.getElementById('motivo-hidden');
    var grupoEmpresa = document.getElementById('ctc-grupo-empresa');
    var grupoPedido  = document.getElementById('ctc-grupo-pedido');
    if (!grid || !hidden) return;

    grid.querySelectorAll('.ctc-motivo-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        grid.querySelectorAll('.ctc-motivo-btn').forEach(function (b) {
          b.classList.remove('activo');
        });
        btn.classList.add('activo');
        hidden.value = btn.dataset.motivo || '';

        // Mostrar/ocultar campos según motivo
        var motivo = btn.dataset.motivo;
        if (grupoEmpresa) {
          var mostrarEmpresa = (motivo === 'asesoria' || motivo === 'otro');
          grupoEmpresa.style.display = mostrarEmpresa ? 'flex' : 'none';
        }
        if (grupoPedido) {
          grupoPedido.style.display = (motivo === 'pedido') ? 'flex' : 'none';
        }
      });
    });
  }

  /* ── 3. RESUMEN DEL CARRITO ─────────────────────────────── */
  function initResumenCarrito() {
    var carrito = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
    var vacio   = document.getElementById('ctc-resumen-vacio');
    var items   = document.getElementById('ctc-resumen-items');
    var lista   = document.getElementById('ctc-items-lista');
    var total   = document.getElementById('ctc-total-valor');
    if (!vacio || !items || !lista || !total) return;

    if (carrito.length === 0) {
      vacio.style.display = 'flex';
      items.style.display = 'none';
      return;
    }

    vacio.style.display = 'none';
    items.style.display = 'block';
    lista.innerHTML = '';

    var suma = 0;
    carrito.forEach(function (item) {
      var subtotal = item.precio * item.cantidad;
      suma += subtotal;
      var div = document.createElement('div');
      div.className = 'ctc-item-resumen';
      div.innerHTML =
        '<span class="ctc-item-resumen__nombre">' + safeText(item.nombre) + '</span>' +
        '<span class="ctc-item-resumen__qty">x' + item.cantidad + '</span>' +
        '<span class="ctc-item-resumen__precio">' + fmt(subtotal) + '</span>';
      lista.appendChild(div);
    });

    total.textContent = fmt(suma);
  }

  /* ── 4. TOGGLE FACTURA FISCAL ──────────────────────────── */
  function initToggleFactura() {
    var chk      = document.getElementById('ctc-factura');
    var campoRif = document.getElementById('ctc-campo-rif');
    var inputRif = document.getElementById('ctc-rif');
    if (!chk || !campoRif || !inputRif) return;

    chk.addEventListener('change', function () {
      var on = chk.checked;
      campoRif.classList.toggle('visible', on);
      inputRif.disabled = !on;
      inputRif.required = on;
      if (!on) inputRif.value = '';
    });
  }

  /* ── 5. CONTADOR DE CARACTERES ─────────────────────────── */
  function initContadorMensaje() {
    var ta  = document.getElementById('ctc-mensaje');
    var cnt = document.getElementById('ctc-char-count');
    if (!ta || !cnt) return;
    var MAX = 600;
    ta.maxLength = MAX;

    ta.addEventListener('input', function () {
      var len = ta.value.length;
      cnt.textContent = len + ' / ' + MAX;
      cnt.classList.toggle('warning', len > MAX * 0.85);
    });
  }

  /* ── 6. VALIDACIÓN VISUAL EN TIEMPO REAL ───────────────── */
  function initValidacion() {
    var form = document.getElementById('formulario-contacto');
    if (!form) return;
    form.querySelectorAll('.campo-input,.campo-select,.campo-textarea').forEach(function (c) {
      c.addEventListener('blur', function () { validarCampo(c); });
      c.addEventListener('input', function () {
        if (c.dataset.touched) validarCampo(c);
      });
    });
  }

  function validarCampo(c) {
    c.dataset.touched = '1';
    c.style.borderColor = '';
    if (!c.checkValidity() && c.value.trim()) {
      c.style.borderColor = 'var(--c-danger)';
    } else if (c.checkValidity() && c.value.trim()) {
      c.style.borderColor = 'var(--c-lime-dim)';
    }
  }

  /* ── 7. FAQ ACCORDION ──────────────────────────────────── */
  function initFAQ() {
    document.querySelectorAll('.ctc-faq-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.ctc-faq-item');
        if (!item) return;
        var yaAbierto = item.classList.contains('abierto');

        // Cerrar todos
        document.querySelectorAll('.ctc-faq-item').forEach(function (i) {
          i.classList.remove('abierto');
          var b = i.querySelector('.ctc-faq-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });

        // Abrir el clickeado si estaba cerrado
        if (!yaAbierto) {
          item.classList.add('abierto');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── 8. CONSTRUIR MENSAJE WHATSAPP ─────────────────────── */
  function construirMensaje(datos, carrito) {
    var motivo  = datos.get('motivo_contacto') || document.getElementById('motivo-hidden')?.value || 'consulta';
    var nombre  = safeText(datos.get('nombre'));
    var telefono= safeText(datos.get('telefono'));
    var email   = safeText(datos.get('email'));
    var estado  = safeText(datos.get('estado'));
    var ciudad  = safeText(datos.get('ciudad'));
    var mensaje = safeText(datos.get('mensaje'));

    var motivoLabels = {
      pedido:   'Hacer un pedido',
      asesoria: 'Asesoría técnica',
      envio:    'Consulta de envío',
      otro:     'Consulta general'
    };

    var m = '';
    m += '\uD83C\uDF31 *CONTACTO AGROMEDIC*\n';
    m += '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n';
    m += '\uD83D\uDCCB *Motivo:* ' + (motivoLabels[motivo] || motivo) + '\n\n';

    m += '\uD83D\uDC64 *CONTACTO*\n';
    m += '  Nombre: *' + nombre + '*\n';
    m += '  WhatsApp: ' + telefono + '\n';
    if (email) m += '  Email: ' + email + '\n';
    m += '  Ubicaci\u00F3n: ' + estado + ', ' + ciudad + '\n\n';

    // Si hay pedido en el carrito
    if (motivo === 'pedido' && carrito && carrito.length > 0) {
      var total = 0;
      m += '\uD83D\uDCE6 *PRODUCTOS SOLICITADOS*\n';
      carrito.forEach(function (item) {
        var sub = item.precio * item.cantidad;
        total += sub;
        m += '  \u2022 ' + item.nombre + ' x' + item.cantidad + ' = $' + sub.toFixed(2) + '\n';
      });
      m += '  *Total estimado: $' + total.toFixed(2) + '*\n\n';
    }

    // Datos de empresa si aplica
    var empresa = safeText(datos.get('empresa'));
    var tipoG   = safeText(datos.get('tipo_ganado'));
    if (empresa || tipoG) {
      m += '\uD83C\uDFE2 *EMPRESA*\n';
      if (empresa) m += '  Empresa: ' + empresa + '\n';
      if (tipoG)   m += '  Tipo de explotaci\u00F3n: ' + tipoG + '\n';
      var factura = datos.get('factura_fiscal') === 'si';
      var rif     = safeText(datos.get('rif'));
      if (factura) m += '  Factura Fiscal: S\u00CD \u2014 RIF: ' + rif + '\n';
      m += '\n';
    }

    m += '\uD83D\uDCAC *MENSAJE*\n' + mensaje + '\n\n';
    m += '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n';
    m += '_Enviado desde agromedic.com_';
    return m;
  }

  /* ── 9. SUBMIT ─────────────────────────────────────────── */
  function initSubmit() {
    var form    = document.getElementById('formulario-contacto');
    var btnEnv  = document.getElementById('btn-ctc-enviar');
    var confirm = document.getElementById('ctc-confirmacion');
    if (!form || !btnEnv) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.reportValidity()) {
        showToast('Completa los campos requeridos', 'error');
        return;
      }

      var origHTML = btnEnv.innerHTML;
      btnEnv.disabled = true;
      btnEnv.innerHTML = '<div class="spinner"></div> Preparando...';

      setTimeout(function () {
        try {
          var datos   = new FormData(form);
          var carrito = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
          var mensaje = construirMensaje(datos, carrito);
          var url     = 'https://wa.me/' + WS_NUMBER + '?text=' + encodeURIComponent(mensaje);
          window.open(url, '_blank');

          // Mostrar confirmación
          form.style.display = 'none';
          if (confirm) confirm.style.display = 'flex';
          var header = document.querySelector('.ctc-form-header');
          if (header) header.style.display = 'none';
          var motivoWrap = document.querySelector('.ctc-motivo-wrap');
          if (motivoWrap) motivoWrap.style.display = 'none';

        } catch (err) {
          console.error(err);
          showToast('Error al enviar. Intenta nuevamente.', 'error');
        } finally {
          btnEnv.disabled = false;
          btnEnv.innerHTML = origHTML;
        }
      }, 600);
    });

    // Botón "Nuevo mensaje"
    var btnNuevo = document.getElementById('btn-nuevo-mensaje');
    if (btnNuevo) {
      btnNuevo.addEventListener('click', function () {
        if (confirm) confirm.style.display = 'none';
        form.style.display = 'flex';
        form.reset();
        var header = document.querySelector('.ctc-form-header');
        if (header) header.style.display = 'block';
        var motivoWrap = document.querySelector('.ctc-motivo-wrap');
        if (motivoWrap) motivoWrap.style.display = 'block';
      });
    }
  }

  /* ── INICIALIZAR TODO ──────────────────────────────────── */
  initEstados();
  initMotivo();
  initResumenCarrito();
  initToggleFactura();
  initContadorMensaje();
  initValidacion();
  initFAQ();
  initSubmit();
});
