
/* ============================================================
   AGROMEDIC — MAYORISTAS.JS
   Lógica exclusiva del formulario de cotización mayorista
   Vanilla JS puro — Mobile First
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const form         = document.getElementById('formulario-mayorista');
  const confirmacion = document.getElementById('may-confirmacion');
  const btnSubmit    = document.getElementById('btn-may-submit');
  if (!form) return;

  const WS_NUMBER = '584226396237';

  const ESTADOS_VE = {
    "Amazonas":       ["Puerto Ayacucho","San Fernando de Atabapo"],
    "Anzoátegui":     ["Barcelona","Puerto La Cruz","Lechería","El Tigre","Anaco"],
    "Apure":          ["San Fernando de Apure","Guasdualito","Achaguas"],
    "Aragua":         ["Maracay","Turmero","La Victoria","Cagua","Palo Negro"],
    "Barinas":        ["Barinas","Barinitas","Socopó","Sabaneta"],
    "Bolívar":        ["Ciudad Bolívar","Ciudad Guayana","Upata","Santa Elena de Uairén"],
    "Carabobo":       ["Valencia","Puerto Cabello","Guacara","San Diego","Naguanagua","Mariara"],
    "Cojedes":        ["San Carlos","Tinaquillo","Tinaco"],
    "Delta Amacuro":  ["Tucupita","Pedernales"],
    "Distrito Capital":["Caracas"],
    "Falcón":         ["Coro","Punto Fijo","Chichiriviche","Tucacas"],
    "Guárico":        ["San Juan de los Morros","Valle de la Pascua","Calabozo","Zaraza"],
    "La Guaira":      ["La Guaira","Catia La Mar","Maiquetía","Caraballeda"],
    "Lara":           ["Barquisimeto","Cabudare","Carora","Quíbor"],
    "Mérida":         ["Mérida","El Vigía","Tovar","Ejido"],
    "Miranda":        ["Los Teques","Guarenas","Guatire","Ocumare del Tuy","Cúa","Charallave"],
    "Monagas":        ["Maturín","Punta de Mata","Caripito"],
    "Nueva Esparta":  ["Porlamar","Pampatar","La Asunción","Juan Griego"],
    "Portuguesa":     ["Guanare","Acarigua","Araure","Turén"],
    "Sucre":          ["Cumaná","Carúpano","Güiria"],
    "Táchira":        ["San Cristóbal","Táriba","Rubio","San Antonio del Táchira"],
    "Trujillo":       ["Trujillo","Valera","Boconó"],
    "Yaracuy":        ["San Felipe","Chivacoa","Yaritagua"],
    "Zulia":          ["Maracaibo","Cabimas","Ciudad Ojeda","Machiques","San Francisco","Lagunillas"],
  };

  /* ── UTILIDADES ─────────────────────────────────────── */
  const safeText = (v) => (v ?? '').toString().trim();

  function showToast(msg, tipo) {
    tipo = tipo || 'info';
    const toast = document.getElementById('toast-global');
    if (!toast) return;
    const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill' };
    toast.className = 'toast toast-' + tipo;
    var ico = document.getElementById('toast-icono');
    var txt = document.getElementById('toast-texto');
    if (ico) ico.className = 'bi ' + (icons[tipo] || icons.info) + ' toast__icon';
    if (txt) txt.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ toast.classList.remove('visible'); }, 3500);
  }

  /* ── 1. ESTADOS / CIUDADES ───────────────────────── */
  function initEstados() {
    var selE = document.getElementById('may-select-estado');
    var selC = document.getElementById('may-select-ciudad');
    if (!selE || !selC) return;

    Object.keys(ESTADOS_VE).sort().forEach(function(e) {
      var o = document.createElement('option');
      o.value = e; o.textContent = e;
      selE.appendChild(o);
    });

    selE.addEventListener('change', function() {
      var estado = selE.value;
      selC.innerHTML = '<option value="">Selecciona tu Ciudad</option>';
      if (estado && ESTADOS_VE[estado]) {
        ESTADOS_VE[estado].slice().sort().forEach(function(c) {
          var o = document.createElement('option');
          o.value = c; o.textContent = c;
          selC.appendChild(o);
        });
      }
    });
  }

  /* ── 2. TIPO DE NEGOCIO ──────────────────────────── */
  function initTipoNegocio() {
    var grid   = document.getElementById('tipo-grid');
    var hidden = document.getElementById('input-tipo-negocio');
    if (!grid || !hidden) return;

    grid.querySelectorAll('.tipo-btn').forEach(function(btn) {
      btn.addEventListener('click', function(){ selTipo(btn); });
      btn.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selTipo(btn); }
      });
    });

    function selTipo(btn) {
      grid.querySelectorAll('.tipo-btn').forEach(function(b){ b.classList.remove('activo'); });
      btn.classList.add('activo');
      hidden.value = btn.dataset.valor || '';

      var camposG = document.getElementById('campos-ganadero');
      if (camposG) {
        var esG = btn.dataset.valor === 'Ganadero/Productor';
        camposG.classList.toggle('visible', esG);
      }
    }
  }

  /* ── 3. TOGGLE FACTURA ───────────────────────────── */
  function initToggleFactura() {
    var chk      = document.getElementById('m-factura');
    var campoRif = document.getElementById('campo-rif');
    var inputRif = document.getElementById('m-rif');
    if (!chk || !campoRif || !inputRif) return;

    chk.addEventListener('change', function() {
      var on = chk.checked;
      campoRif.classList.toggle('visible', on);
      inputRif.disabled = !on;
      inputRif.required = on;
      if (!on) inputRif.value = '';
    });
  }

  /* ── 4. VALIDACIÓN VISUAL ────────────────────────── */
  function initValidacion() {
    form.querySelectorAll('.campo-input,.campo-select,.campo-textarea').forEach(function(c) {
      c.addEventListener('blur', function(){ validarCampo(c); });
      c.addEventListener('input', function(){
        if (c.dataset.touched) validarCampo(c);
      });
    });
  }

  function validarCampo(c) {
    c.dataset.touched = '1';
    var valido = c.checkValidity();
    c.style.borderColor = '';
    if (!valido && c.value.trim()) c.style.borderColor = 'var(--c-danger)';
    else if (valido && c.value.trim()) c.style.borderColor = 'var(--c-lime-dim)';
  }

  /* ── 5. CONTADORES TEXTAREA ──────────────────────── */
  function initContadores() {
    form.querySelectorAll('textarea').forEach(function(ta) {
      var max = ta.maxLength > 0 ? ta.maxLength : 1000;
      var cnt = document.createElement('p');
      cnt.className = 'text-xs text-muted';
      cnt.style.cssText = 'text-align:right;margin-top:.25rem';
      cnt.textContent = '0/' + max;
      ta.parentNode.appendChild(cnt);
      ta.addEventListener('input', function(){
        var len = ta.value.length;
        cnt.textContent = len + '/' + max;
        cnt.style.color = len > max * 0.9 ? 'var(--c-warning)' : 'var(--c-text-faint)';
      });
    });
  }

  /* ── 6. CONSTRUIR MENSAJE WHATSAPP ───────────────── */
  function construirMensaje(datos) {
    var intereses = Array.from(form.querySelectorAll('input[name="intereses"]:checked'))
                         .map(function(cb){ return cb.value; });

    var necesitaFactura = datos.get('factura_fiscal') === 'si';
    var rif = datos.get('rif') || 'N/A';

    var m = '';
    m += '\uD83C\uDF31 *SOLICITUD DE COTIZACI\u00D3N MAYORISTA*\n';
    m += '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n';

    m += '\uD83C\uDFE2 *EMPRESA / NEGOCIO*\n';
    m += '  Empresa: *' + safeText(datos.get('empresa')) + '*\n';
    m += '  Tipo: ' + safeText(datos.get('tipo_cliente_negocio')) + '\n';
    m += '  Enfoque: ' + safeText(datos.get('enfoque_animal')) + '\n';

    var tipoG = safeText(datos.get('tipo_ganado'));
    var cabez = safeText(datos.get('num_cabezas'));
    if (tipoG) m += '  Tipo ganado: ' + tipoG + '\n';
    if (cabez) m += '  N\u00BA cabezas: ' + cabez + '\n';
    m += '\n';

    m += '\uD83D\uDC64 *CONTACTO*\n';
    m += '  Nombre: *' + safeText(datos.get('nombre')) + '*\n';
    m += '  Cargo: ' + safeText(datos.get('cargo')) + '\n';
    m += '  WhatsApp: ' + safeText(datos.get('telefono')) + '\n';
    m += '  Email: ' + (safeText(datos.get('email')) || 'No indicado') + '\n';
    m += '  Ubicaci\u00F3n: ' + safeText(datos.get('estado')) + ', ' + safeText(datos.get('ciudad')) + '\n\n';

    if (intereses.length > 0) {
      m += '\uD83D\uDCE6 *PRODUCTOS DE INTER\u00C9S*\n';
      intereses.forEach(function(i){ m += '  \u2022 ' + i + '\n'; });
      m += '\n';
    }

    m += '\uD83E\uDDFE *FACTURACI\u00D3N*\n';
    m += '  Factura Fiscal: ' + (necesitaFactura ? 'S\u00CD \u2014 RIF: *' + rif + '*' : 'NO requerida') + '\n\n';

    m += '\uD83D\uDCDD *DETALLE DE LA SOLICITUD*\n';
    m += safeText(datos.get('necesidad')) + '\n';

    var comentarios = safeText(datos.get('comentarios'));
    if (comentarios) {
      m += '\n\uD83D\uDCAC *COMENTARIOS ADICIONALES*\n' + comentarios + '\n';
    }

    m += '\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n';
    m += '_Solicitud enviada desde agromedic.com_';
    return m;
  }

  /* ── 7. SUBMIT ───────────────────────────────────── */
  function initSubmit() {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      /* Validar tipo de negocio */
      var tipoVal = document.getElementById('input-tipo-negocio');
      if (!tipoVal || !tipoVal.value) {
        showToast('Selecciona el tipo de negocio', 'error');
        var tg = document.getElementById('tipo-grid');
        if (tg) tg.scrollIntoView({ behavior:'smooth', block:'center' });
        return;
      }

      /* Validar nativo */
      if (!form.reportValidity()) {
        showToast('Completa todos los campos requeridos', 'error');
        return;
      }

      /* Loading */
      var origHTML = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<div class="spinner"></div> Preparando mensaje...';

      setTimeout(function() {
        try {
          var datos   = new FormData(form);
          var mensaje = construirMensaje(datos);
          var url     = 'https://wa.me/' + WS_NUMBER + '?text=' + encodeURIComponent(mensaje);
          window.open(url, '_blank');
          mostrarConfirmacion();
        } catch(err) {
          console.error(err);
          showToast('Error al procesar. Intenta nuevamente.', 'error');
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origHTML;
        }
      }, 700);
    });
  }

  /* ── 8. CONFIRMACIÓN ─────────────────────────────── */
  function mostrarConfirmacion() {
    form.style.display = 'none';
    if (confirmacion) {
      confirmacion.style.display = 'flex';
      confirmacion.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    showToast('Solicitud enviada. Revisa WhatsApp.', 'success');
  }

  /* ── INICIAR ─────────────────────────────────────── */
  initEstados();
  initTipoNegocio();
  initToggleFactura();
  initValidacion();
  initContadores();
  initSubmit();
});
