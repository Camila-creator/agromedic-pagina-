/* ============================================================
   AGROMEDIC — HERRAMIENTAS.JS
   Tres herramientas interactivas:
   1. Calculadora de Dosis por Peso
   2. Rastreador de Pedido
   3. Comparador de Productos
   Vanilla JS puro — Sin dependencias
   ============================================================ */
'use strict';

/* ══════════════════════════════════════════════════════════
   CONFIG GLOBAL
══════════════════════════════════════════════════════════ */
var KONT=window.KONT||{BASE_URL:'https://api.kont.lat',SLUG:'agromedic-3',API_KEY:'1abd0015-e02d-4f97-8b39-91f354c75317',WS_NUMBER:'584226396237',DEMO_MODE:false};

var safeText = function(v){ return (v || '').toString().trim(); };
var fmt = function(n){ return '$' + Number(n).toFixed(2); };

function showToast(msg, tipo) {
  tipo = tipo || 'info';
  var t = document.getElementById('toast-global');
  if (!t) return;
  var icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill' };
  t.className = 'toast toast-' + tipo;
  var ico = document.getElementById('toast-icono');
  var txt = document.getElementById('toast-texto');
  if (ico) ico.className = 'bi ' + (icons[tipo]||icons.info) + ' toast__icon';
  if (txt) txt.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('visible'); }, 3200);
}

/* ══════════════════════════════════════════════════════════
   1. CALCULADORA DE DOSIS POR PESO
   Lógica: volumen(ml) = (dosis_mg_kg × peso_kg) / concentración_mg_ml
   Para comprimidos: unidades = (dosis_mg_kg × peso_kg) / potencia_comprimido_mg
══════════════════════════════════════════════════════════ */

/*
  BASE DE DATOS DE PRODUCTOS VETERINARIOS VENEZOLANOS
  Estructura por producto:
    concentracion: mg por unidad (ml o comprimido)
    tipo_resultado: 'ml' | 'comprimidos' | 'g' | 'sobres'
    via: vía de administración
    especies: objeto con especie → dosis (mg/kg), retiros, intervalos, advertencias
*/
var DB_CALCULOS = [
  /* ─── ANTIPARASITARIOS ─────────────────────────────── */
  {
    id: 'iverm-1pct',
    nombre: 'Ivermectina 1%',
    grupo: 'antiparasitario',
    concentracion: 10,        // 10 mg/ml
    tipo_resultado: 'ml',
    via: 'Subcutánea (SC)',
    descripcion: 'Antiparasitario de amplio espectro. Control de nematodos y ectoparásitos.',
    especies: {
      bovino:  { dosis:0.2, unidad:'mg/kg', retiro_carne:28, retiro_leche:null,  intervalo_dias:21,
                 nota:'Aplicar en pliegue preescapular. No usar en vacas lecheras en producción.' },
      ovino:   { dosis:0.2, unidad:'mg/kg', retiro_carne:28, retiro_leche:null,  intervalo_dias:21, nota:'' },
      caprino: { dosis:0.2, unidad:'mg/kg', retiro_carne:28, retiro_leche:null,  intervalo_dias:21, nota:'Precaución en cabras lactantes.' },
      equino:  { dosis:0.2, unidad:'mg/kg', retiro_carne:null,retiro_leche:null, intervalo_dias:84, nota:'Solo pasta oral. No inyectable en equinos.' },
      porcino: { dosis:0.3, unidad:'mg/kg', retiro_carne:28, retiro_leche:null,  intervalo_dias:21, nota:'' },
    },
    advertencias: ['No administrar a hembras lecheras cuya leche sea para consumo humano.',
                   'Respetar el período de retiro antes del sacrificio.',
                   'No mezclar con otras soluciones en la jeringa.']
  },
  {
    id: 'iverm-35pct',
    nombre: 'Ivermectina 3.5%',
    grupo: 'antiparasitario',
    concentracion: 35,        // 35 mg/ml
    tipo_resultado: 'ml',
    via: 'Subcutánea (SC)',
    descripcion: 'Formulación de alta concentración. Menor volumen de aplicación.',
    especies: {
      bovino:  { dosis:0.2, unidad:'mg/kg', retiro_carne:28, retiro_leche:null, intervalo_dias:21,
                 nota:'Alta concentración: calcular con precisión. Máx. 10ml por punto.' },
      ovino:   { dosis:0.2, unidad:'mg/kg', retiro_carne:28, retiro_leche:null, intervalo_dias:21, nota:'' },
      caprino: { dosis:0.2, unidad:'mg/kg', retiro_carne:28, retiro_leche:null, intervalo_dias:21, nota:'' },
      porcino: { dosis:0.3, unidad:'mg/kg', retiro_carne:28, retiro_leche:null, intervalo_dias:21, nota:'' },
    },
    advertencias: ['Alta concentración — usar jeringa dosificadora de precisión.',
                   'No usar en equinos ni animales de compañía.']
  },
  {
    id: 'albendazol',
    nombre: 'Albendazol 25%',
    grupo: 'antiparasitario',
    concentracion: 250,       // 250 mg/ml suspensión
    tipo_resultado: 'ml',
    via: 'Oral (PO)',
    descripcion: 'Antihelmíntico benzimidazol. Control de nematodos y tenias.',
    especies: {
      bovino:  { dosis:7.5, unidad:'mg/kg', retiro_carne:14, retiro_leche:null,  intervalo_dias:30,
                 nota:'No administrar en el primer tercio de gestación.' },
      ovino:   { dosis:7.5, unidad:'mg/kg', retiro_carne:14, retiro_leche:4,     intervalo_dias:30,
                 nota:'Retirar 4 días antes de usar leche para consumo humano.' },
      caprino: { dosis:7.5, unidad:'mg/kg', retiro_carne:14, retiro_leche:4,     intervalo_dias:30, nota:'' },
      porcino: { dosis:10,  unidad:'mg/kg', retiro_carne:14, retiro_leche:null,  intervalo_dias:30, nota:'' },
    },
    advertencias: ['Contraindicado en el primer trimestre de gestación.',
                   'Agitar bien antes de usar.']
  },
  {
    id: 'doramectina',
    nombre: 'Doramectina 1%',
    grupo: 'antiparasitario',
    concentracion: 10,        // 10 mg/ml
    tipo_resultado: 'ml',
    via: 'Subcutánea (SC) / IM',
    descripcion: 'Macrólido de acción prolongada. Mayor persistencia que ivermectina.',
    especies: {
      bovino: { dosis:0.2, unidad:'mg/kg', retiro_carne:35, retiro_leche:null, intervalo_dias:28,
                nota:'Efecto residual hasta 28 días. IM en cuello o IM profundo.' },
      ovino:  { dosis:0.2, unidad:'mg/kg', retiro_carne:35, retiro_leche:null, intervalo_dias:28, nota:'' },
      porcino:{ dosis:0.3, unidad:'mg/kg', retiro_carne:35, retiro_leche:null, intervalo_dias:28, nota:'Solo IM.' },
    },
    advertencias: ['Mayor período de retiro que ivermectina estándar.',
                   'No usar en vacas lecheras cuya leche sea para consumo.']
  },

  /* ─── ANTIBIÓTICOS ─────────────────────────────────── */
  {
    id: 'oxitetra-20la',
    nombre: 'Oxitetraciclina 20% LA',
    grupo: 'antibiotico',
    concentracion: 200,       // 200 mg/ml
    tipo_resultado: 'ml',
    via: 'Intramuscular (IM)',
    descripcion: 'Antibiótico de amplio espectro de acción prolongada (LA). Efecto 3-5 días.',
    especies: {
      bovino:  { dosis:20, unidad:'mg/kg', retiro_carne:28, retiro_leche:7, intervalo_dias:3,
                 nota:'Máx. 10ml por punto de inyección. Administrar profundo en músculo.' },
      ovino:   { dosis:20, unidad:'mg/kg', retiro_carne:28, retiro_leche:7, intervalo_dias:3, nota:'' },
      caprino: { dosis:20, unidad:'mg/kg', retiro_carne:28, retiro_leche:7, intervalo_dias:3, nota:'' },
      porcino: { dosis:20, unidad:'mg/kg', retiro_carne:28, retiro_leche:null,intervalo_dias:3, nota:'' },
    },
    advertencias: ['Retirar leche por 7 días tras última aplicación.',
                   'Puede causar irritación local en el sitio de inyección.',
                   'Respetar temperatura de almacenamiento (2-8°C).']
  },
  {
    id: 'penicilina-g',
    nombre: 'Penicilina G Procaínica',
    grupo: 'antibiotico',
    concentracion: 400000,    // 400,000 UI/ml
    tipo_resultado: 'ml',
    via: 'Intramuscular (IM)',
    descripcion: 'Antibiótico bactericida. Infecciones por gram-positivos. Administración diaria.',
    especies: {
      bovino:  { dosis:20000, unidad:'UI/kg', retiro_carne:10, retiro_leche:4, intervalo_dias:1,
                 nota:'Administrar 1 vez/día. Duración mínima del tratamiento: 3-5 días.' },
      ovino:   { dosis:20000, unidad:'UI/kg', retiro_carne:10, retiro_leche:4, intervalo_dias:1, nota:'' },
      caprino: { dosis:20000, unidad:'UI/kg', retiro_carne:10, retiro_leche:4, intervalo_dias:1, nota:'' },
      porcino: { dosis:20000, unidad:'UI/kg', retiro_carne:7,  retiro_leche:null,intervalo_dias:1, nota:'' },
      canino:  { dosis:22000, unidad:'UI/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:1,
                 nota:'En perros: 2 veces al día para mejor efecto.' },
      felino:  { dosis:22000, unidad:'UI/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:1, nota:'' },
    },
    advertencias: ['Verificar sensibilidad del paciente.',
                   'No usar en animales con hipersensibilidad a penicilinas.']
  },
  {
    id: 'enro-10pct',
    nombre: 'Enrofloxacina 10%',
    grupo: 'antibiotico',
    concentracion: 100,       // 100 mg/ml
    tipo_resultado: 'ml',
    via: 'Subcutánea (SC) / IM',
    descripcion: 'Fluoroquinolona de amplio espectro. Infecciones respiratorias y digestivas.',
    especies: {
      bovino:  { dosis:5,  unidad:'mg/kg', retiro_carne:28, retiro_leche:null, intervalo_dias:1,
                 nota:'Máx. 10ml por sitio. No usar en vacas lecheras.' },
      ovino:   { dosis:5,  unidad:'mg/kg', retiro_carne:28, retiro_leche:null, intervalo_dias:1, nota:'' },
      porcino: { dosis:5,  unidad:'mg/kg', retiro_carne:14, retiro_leche:null, intervalo_dias:1, nota:'' },
      canino:  { dosis:5,  unidad:'mg/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:1,
                 nota:'Perros en crecimiento: riesgo de artropatía. Usar con precaución <8 meses.' },
      felino:  { dosis:5,  unidad:'mg/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:1,
                 nota:'⚠️ Dosis máxima 5mg/kg/día en gatos. Riesgo de toxicidad retinal.' },
    },
    advertencias: ['Contraindicado en animales jóvenes en crecimiento.',
                   'No usar en gestación ni lactancia.',
                   'En gatos: no exceder 5mg/kg/día por riesgo ocular.']
  },

  /* ─── VITAMINAS Y SUPLEMENTOS ──────────────────────── */
  {
    id: 'vitade',
    nombre: 'Vitaminas A·D3·E inyectable',
    grupo: 'vitamina',
    concentracion_ui: { a:500000, d:75000, e:50 }, // UI por ml
    concentracion: 1,         // unidad de referencia
    tipo_resultado: 'ml',
    via: 'Intramuscular (IM)',
    descripcion: 'Complejo vitamínico liposoluble. Gestación, lactancia, crecimiento y convalecencia.',
    especies: {
      bovino:  { dosis_fija:{ pequeno:3, mediano:5, grande:10 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:30, nota:'Dosis fija por tamaño: <200kg=3ml, 200-400kg=5ml, >400kg=10ml' },
      ovino:   { dosis_fija:{ pequeno:1, mediano:2, grande:3 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:30, nota:'Dosis por peso: <30kg=1ml, 30-60kg=2ml, >60kg=3ml' },
      caprino: { dosis_fija:{ pequeno:1, mediano:2, grande:3 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:30, nota:'' },
      canino:  { dosis:0.1, unidad:'ml/kg', retiro_carne:null, retiro_leche:null,
                 intervalo_dias:30, nota:'0.1ml/kg IM, máx 3ml por dosis.' },
      felino:  { dosis_fija:{ pequeno:0.5, mediano:0.5, grande:1 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:30, nota:'0.5-1ml IM según peso.' },
      porcino: { dosis_fija:{ pequeno:2, mediano:3, grande:5 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:30, nota:'' },
    },
    advertencias: ['No sobredosificar. Hipervitaminosis A/D puede ser tóxica.',
                   'Conservar en lugar fresco y protegido de la luz.']
  },
  {
    id: 'b12-hidroxi',
    nombre: 'Vitamina B12 Hidroxicobalamina',
    grupo: 'vitamina',
    concentracion: 1,         // 1mg/ml (1000 mcg/ml)
    tipo_resultado: 'ml',
    via: 'Subcutánea (SC) / IM',
    descripcion: 'Anemia, convalecencia, carencias nutricionales. Estimulante del metabolismo.',
    especies: {
      bovino:  { dosis_fija:{ pequeno:10, mediano:15, grande:20 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:7, nota:'10-20ml según peso y severidad del cuadro.' },
      ovino:   { dosis_fija:{ pequeno:3, mediano:5, grande:7 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:7, nota:'' },
      caprino: { dosis_fija:{ pequeno:3, mediano:5, grande:7 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:7, nota:'' },
      canino:  { dosis:0.05, unidad:'ml/kg', retiro_carne:null, retiro_leche:null,
                 intervalo_dias:7, nota:'0.05ml/kg, máx 5ml.' },
      felino:  { dosis_fija:{ pequeno:0.5, mediano:1, grande:1 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:7, nota:'0.5-1ml SC.' },
      porcino: { dosis_fija:{ pequeno:5, mediano:8, grande:10 }, retiro_carne:null, retiro_leche:null,
                 intervalo_dias:7, nota:'' },
    },
    advertencias: ['Producto seguro. No hay período de retiro establecido.',
                   'Refrigerar después de abrir.']
  },

  /* ─── ANTIINFLAMATORIOS ────────────────────────────── */
  {
    id: 'meloxicam',
    nombre: 'Meloxicam 2%',
    grupo: 'antiinflamatorio',
    concentracion: 20,        // 20 mg/ml
    tipo_resultado: 'ml',
    via: 'Subcutánea (SC) / IV',
    descripcion: 'AINE. Control del dolor y la inflamación. Post-cirugía, mastitis, cojeras.',
    especies: {
      bovino: { dosis:0.5, unidad:'mg/kg', retiro_carne:15, retiro_leche:5, intervalo_dias:1,
                nota:'Dosis única SC o IV. Retira la leche 5 días post-tratamiento.' },
      ovino:  { dosis:0.5, unidad:'mg/kg', retiro_carne:15, retiro_leche:5, intervalo_dias:1, nota:'' },
      porcino:{ dosis:0.4, unidad:'mg/kg', retiro_carne:5,  retiro_leche:null,intervalo_dias:1, nota:'' },
      canino: { dosis:0.2, unidad:'mg/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:1,
                nota:'Dosis inicial 0.2mg/kg, mantenimiento 0.1mg/kg/día.' },
      felino: { dosis:0.3, unidad:'mg/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:null,
                nota:'⚠️ Gatos: uso único SC. No repetir sin supervisión veterinaria.' },
    },
    advertencias: ['No usar con otros AINEs ni corticosteroides.',
                   'Contraindicado en insuficiencia renal, hepática o cardíaca.',
                   'En gatos: máximo una dosis sin prescripción veterinaria.']
  },
  {
    id: 'dexametasona',
    nombre: 'Dexametasona 0.2%',
    grupo: 'antiinflamatorio',
    concentracion: 2,         // 2 mg/ml
    tipo_resultado: 'ml',
    via: 'Intramuscular (IM) / IV lenta',
    descripcion: 'Corticosteroide. Anti-shock, inflamaciones severas, inducción del parto.',
    especies: {
      bovino:  { dosis:0.04, unidad:'mg/kg', retiro_carne:7, retiro_leche:3, intervalo_dias:null,
                 nota:'⚠️ Puede inducir parto si se usa en el último tercio de gestación.' },
      ovino:   { dosis:0.04, unidad:'mg/kg', retiro_carne:7, retiro_leche:3, intervalo_dias:null, nota:'' },
      caprino: { dosis:0.04, unidad:'mg/kg', retiro_carne:7, retiro_leche:3, intervalo_dias:null, nota:'' },
      canino:  { dosis:0.1,  unidad:'mg/kg', retiro_carne:null,retiro_leche:null,intervalo_dias:null,
                 nota:'Uso de emergencia. Supervisión veterinaria requerida.' },
    },
    advertencias: ['⚠️ Puede inducir aborto o parto prematuro en hembras gestantes.',
                   'No usar en animales con infecciones bacterianas sin antibiótico.',
                   'Uso veterinario controlado.']
  }
];

var GRUPOS_LABELS = {
  antiparasitario: { label:'Antiparasitarios', icon:'bi-bug' },
  antibiotico:     { label:'Antibióticos',     icon:'bi-capsule' },
  vitamina:        { label:'Vitaminas y Suplementos', icon:'bi-stars' },
  antiinflamatorio:{ label:'Antiinflamatorios', icon:'bi-thermometer' }
};

var ESPECIES_INFO = {
  bovino:  { label:'Bovino (Vaca/Toro)', icon:'🐄', rango_peso:[50,900],  ref_peso:350 },
  ovino:   { label:'Ovino (Oveja)',      icon:'🐑', rango_peso:[20,120],  ref_peso:50  },
  caprino: { label:'Caprino (Cabra)',    icon:'🐐', rango_peso:[15,100],  ref_peso:40  },
  equino:  { label:'Equino (Caballo)',   icon:'🐴', rango_peso:[100,700], ref_peso:400 },
  porcino: { label:'Porcino (Cerdo)',    icon:'🐷', rango_peso:[10,350],  ref_peso:80  },
  canino:  { label:'Canino (Perro)',     icon:'🐕', rango_peso:[1,80],    ref_peso:15  },
  felino:  { label:'Felino (Gato)',      icon:'🐈', rango_peso:[1,10],    ref_peso:4   }
};

function calcularDosis(producto, especie, pesoKg) {
  var esp = producto.especies[especie];
  if (!esp) return null;

  var resultado = {
    volumen: null,
    tipo: producto.tipo_resultado,
    dosis_total: null,
    unidad_dosis: esp.unidad || 'mg/kg',
    retiro_carne: esp.retiro_carne,
    retiro_leche: esp.retiro_leche,
    intervalo_dias: esp.intervalo_dias,
    nota: esp.nota || '',
    advertencias: producto.advertencias || []
  };

  if (esp.dosis_fija) {
    // Para productos con dosis fija (ej. vitaminas)
    var cat;
    var info = ESPECIES_INFO[especie];
    if (pesoKg < info.rango_peso[0] + (info.rango_peso[1]-info.rango_peso[0])*0.25) cat = 'pequeno';
    else if (pesoKg < info.rango_peso[0] + (info.rango_peso[1]-info.rango_peso[0])*0.65) cat = 'mediano';
    else cat = 'grande';
    resultado.volumen = esp.dosis_fija[cat];
    resultado.es_fija = true;
  } else if (esp.dosis) {
    // Dosis por peso
    if (esp.unidad === 'UI/kg') {
      resultado.dosis_total = esp.dosis * pesoKg;
      resultado.volumen = resultado.dosis_total / producto.concentracion;
    } else if (esp.unidad === 'ml/kg') {
      resultado.volumen = esp.dosis * pesoKg;
    } else {
      // mg/kg estándar
      resultado.dosis_total = esp.dosis * pesoKg;
      resultado.volumen = resultado.dosis_total / producto.concentracion;
    }
    resultado.es_fija = false;
  }

  if (resultado.volumen !== null) {
    resultado.volumen = Math.round(resultado.volumen * 100) / 100;
  }
  return resultado;
}

/* ── INICIALIZAR CALCULADORA ──────────────────────────────── */
function initCalculadora() {
  var selProducto = document.getElementById('calc-select-producto');
  var selEspecie  = document.getElementById('calc-select-especie');
  var inputPeso   = document.getElementById('calc-input-peso');
  var btnCalc     = document.getElementById('calc-btn-calcular');
  var resultPanel = document.getElementById('calc-resultado');
  var btnReset    = document.getElementById('calc-btn-reset');
  if (!selProducto || !selEspecie || !inputPeso || !btnCalc) return;

  /* Poblar selector de productos agrupado */
  var grupos = {};
  DB_CALCULOS.forEach(function(p) {
    if (!grupos[p.grupo]) grupos[p.grupo] = [];
    grupos[p.grupo].push(p);
  });

  Object.keys(grupos).forEach(function(g) {
    var optGroup = document.createElement('optgroup');
    optGroup.label = GRUPOS_LABELS[g] ? GRUPOS_LABELS[g].label : g;
    grupos[g].forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      optGroup.appendChild(opt);
    });
    selProducto.appendChild(optGroup);
  });

  /* Al cambiar producto, filtrar especies disponibles */
  selProducto.addEventListener('change', function() {
    actualizarEspeciesDisponibles();
    limpiarResultado();
  });

  selEspecie.addEventListener('change', limpiarResultado);
  inputPeso.addEventListener('input', limpiarResultado);

  function actualizarEspeciesDisponibles() {
    var pid = selProducto.value;
    var prod = DB_CALCULOS.find(function(p){ return p.id === pid; });
    var valorActual = selEspecie.value;

    selEspecie.innerHTML = '<option value="">Selecciona la especie</option>';
    if (!prod) return;

    Object.keys(prod.especies).forEach(function(esp) {
      var info = ESPECIES_INFO[esp];
      if (!info) return;
      var opt = document.createElement('option');
      opt.value = esp;
      opt.textContent = info.icon + ' ' + info.label;
      selEspecie.appendChild(opt);
    });

    if (valorActual && prod.especies[valorActual]) {
      selEspecie.value = valorActual;
    }
    actualizarRangoPeso();
  }

  selEspecie.addEventListener('change', actualizarRangoPeso);

  function actualizarRangoPeso() {
    var esp = selEspecie.value;
    if (!esp || !ESPECIES_INFO[esp]) return;
    var info = ESPECIES_INFO[esp];
    inputPeso.min         = info.rango_peso[0];
    inputPeso.max         = info.rango_peso[1];
    inputPeso.placeholder = 'Ej: ' + info.ref_peso + ' kg';
    var hint = document.getElementById('calc-peso-hint');
    if (hint) hint.textContent = 'Rango para ' + info.label + ': ' + info.rango_peso[0] + ' – ' + info.rango_peso[1] + ' kg';
  }

  function limpiarResultado() {
    if (resultPanel) resultPanel.style.display = 'none';
  }

  /* Botón calcular */
  btnCalc.addEventListener('click', function() {
    var pid    = selProducto.value;
    var espNom = selEspecie.value;
    var peso   = parseFloat(inputPeso.value);

    if (!pid) { showToast('Selecciona un producto', 'error'); return; }
    if (!espNom) { showToast('Selecciona la especie animal', 'error'); return; }
    if (!peso || peso <= 0) { showToast('Ingresa el peso del animal en kg', 'error'); return; }

    var prod = DB_CALCULOS.find(function(p){ return p.id === pid; });
    if (!prod) return;

    var info  = ESPECIES_INFO[espNom];
    if (peso < info.rango_peso[0] || peso > info.rango_peso[1]) {
      showToast('El peso está fuera del rango normal para esta especie (' + info.rango_peso[0] + '–' + info.rango_peso[1] + ' kg)', 'error');
      return;
    }

    var res = calcularDosis(prod, espNom, peso);
    if (!res || res.volumen === null) {
      showToast('No hay datos de dosificación para esta combinación', 'error');
      return;
    }

    renderResultado(prod, espNom, peso, res);
  });

  if (btnReset) {
    btnReset.addEventListener('click', function() {
      selProducto.value = '';
      selEspecie.innerHTML = '<option value="">Selecciona la especie</option>';
      inputPeso.value = '';
      limpiarResultado();
      var hint = document.getElementById('calc-peso-hint');
      if (hint) hint.textContent = '';
    });
  }

  function renderResultado(prod, espNom, peso, res) {
    if (!resultPanel) return;

    var info        = ESPECIES_INFO[espNom];
    var volDisplay  = res.volumen + ' ' + res.tipo;
    var dosisTxt    = res.es_fija
      ? 'Dosis fija según tamaño del animal'
      : (res.dosis_total
          ? (Math.round(res.dosis_total * 100)/100) + ' ' + (res.unidad_dosis === 'UI/kg' ? 'UI totales' : 'mg totales')
          : '—');

    /* Nivel de alerta según producto */
    var tieneAlerta = res.advertencias && res.advertencias.length > 0;
    var alertasHtml = tieneAlerta
      ? '<div class="calc-advertencias"><h5><i class="bi bi-exclamation-triangle-fill"></i> Advertencias</h5><ul>' +
        res.advertencias.map(function(a){ return '<li>' + a + '</li>'; }).join('') +
        '</ul></div>'
      : '';

    var retiroHtml = '';
    if (res.retiro_carne) retiroHtml += '<div class="calc-retiro-item"><i class="bi bi-slash-circle"></i><span><strong>Retiro en carne:</strong> ' + res.retiro_carne + ' días</span></div>';
    if (res.retiro_leche) retiroHtml += '<div class="calc-retiro-item"><i class="bi bi-droplet-slash"></i><span><strong>Retiro en leche:</strong> ' + res.retiro_leche + ' días</span></div>';
    if (res.intervalo_dias) retiroHtml += '<div class="calc-retiro-item"><i class="bi bi-clock-history"></i><span><strong>Intervalo entre dosis:</strong> ' + res.intervalo_dias + ' días</span></div>';

    var notaHtml = res.nota
      ? '<div class="calc-nota"><i class="bi bi-info-circle"></i> ' + res.nota + '</div>'
      : '';

    resultPanel.innerHTML =
      '<div class="calc-res-header">' +
        '<div class="calc-res-animal">' + info.icon + ' ' + info.label + ' · ' + peso + ' kg</div>' +
        '<h3 class="calc-res-titulo">' + prod.nombre + '</h3>' +
        '<p class="calc-res-via"><i class="bi bi-syringe"></i> ' + prod.via + '</p>' +
      '</div>' +
      '<div class="calc-res-dosis">' +
        '<div class="calc-res-numero">' + volDisplay + '</div>' +
        '<p class="calc-res-etiqueta">Dosis calculada</p>' +
        (dosisTxt !== '—' ? '<p class="calc-res-sub">' + dosisTxt + '</p>' : '') +
      '</div>' +
      (retiroHtml ? '<div class="calc-retiros">' + retiroHtml + '</div>' : '') +
      notaHtml +
      alertasHtml +
      '<p class="calc-disclaimer"><i class="bi bi-shield-exclamation"></i> Esta calculadora es orientativa. Siempre confirma la dosis con un Médico Veterinario antes de administrar cualquier producto.</p>';

    resultPanel.style.display = 'block';
    resultPanel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    showToast('Dosis calculada correctamente', 'success');
  }
}


/* ══════════════════════════════════════════════════════════
   2. RASTREADOR DE PEDIDO
   Lógica: busca en localStorage primero, luego en Kont API
   Muestra timeline visual con el estado del pedido
══════════════════════════════════════════════════════════ */

var ESTADOS_ORDEN = [
  { key:'borrador',   label:'Pedido recibido',    icon:'bi-clock',          desc:'Tu pedido ha sido registrado y está pendiente de confirmación.' },
  { key:'confirmado', label:'Confirmado',          icon:'bi-check2-circle',  desc:'Tu pedido fue confirmado. Estamos preparando el despacho.' },
  { key:'despachado', label:'Despachado',          icon:'bi-box-seam',       desc:'Tu pedido salió de nuestro almacén.' },
  { key:'en_transito',label:'En tránsito',         icon:'bi-truck',          desc:'Tu pedido está en camino. Revisa el número de guía.' },
  { key:'entregado',  label:'Entregado',           icon:'bi-house-check',    desc:'¡Tu pedido fue entregado exitosamente!' },
  { key:'anulado',    label:'Anulado',             icon:'bi-x-circle',       desc:'Este pedido fue anulado. Contáctanos si es un error.' },
];

function getEstadoIndex(key) {
  var idx = ESTADOS_ORDEN.findIndex(function(e){ return e.key === key; });
  return idx === -1 ? 0 : idx;
}

async function buscarPedidoEnAPI(id) {
  try {
    var res = await fetch(KONT.BASE_URL+'/api/ecommerce/'+(KONT.SLUG||'agromedic-3')+'/pedidos/'+encodeURIComponent(id), {
      headers: { 'Authorization': 'Bearer ' + KONT.API_KEY },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    return data.data || data.order || data;
  } catch(e) {
    return null;
  }
}

function buscarPedidoLocal(id) {
  var pedidos = JSON.parse(localStorage.getItem('agro_pedidos') || '[]');
  return pedidos.find(function(p){ return p.id === id; }) || null;
}

function renderTimeline(pedido, container) {
  var status = pedido.status || pedido.estado || 'borrador';
  var idx    = getEstadoIndex(status);
  var esAnulado = status === 'anulado';

  /* Filas de items */
  var itemsHtml = '';
  if (pedido.items && pedido.items.length > 0) {
    itemsHtml = '<div class="rastr-items">' +
      pedido.items.map(function(it){
        return '<div class="rastr-item">' +
          '<span class="rastr-item__nombre">' + safeText(it.nombre || it.name || '') + '</span>' +
          '<span class="rastr-item__qty">×' + (it.cantidad || it.quantity || 1) + '</span>' +
          '<span class="rastr-item__precio">' + fmt(it.subtotal || (it.precio * (it.cantidad||1))) + '</span>' +
        '</div>';
      }).join('') +
      '<div class="rastr-item rastr-item--total">' +
        '<span>Total</span><span></span><span class="text-lime">' + fmt(pedido.total || 0) + '</span>' +
      '</div>' +
    '</div>';
  }

  /* Timeline steps */
  var pasosFiltrados = esAnulado
    ? ESTADOS_ORDEN.filter(function(e){ return e.key==='borrador' || e.key==='anulado'; })
    : ESTADOS_ORDEN.filter(function(e){ return e.key !== 'anulado'; });

  var stepsHtml = pasosFiltrados.map(function(e, i) {
    var esPasado  = !esAnulado && i <= idx;
    var esActual  = e.key === status;
    var cls = esActual ? 'activo' : (esPasado ? 'completado' : '');
    return '<div class="rastr-step ' + cls + '">' +
      '<div class="rastr-step__dot"><i class="bi ' + e.icon + '"></i></div>' +
      '<div class="rastr-step__body">' +
        '<p class="rastr-step__label">' + e.label + '</p>' +
        (esActual ? '<p class="rastr-step__desc">' + e.desc + '</p>' : '') +
      '</div>' +
    '</div>';
  }).join('<div class="rastr-step__line"></div>');

  /* Guía de seguimiento */
  var guiaHtml = pedido.numero_guia
    ? '<div class="rastr-guia">' +
        '<i class="bi bi-qr-code"></i>' +
        '<div>' +
          '<p class="rastr-guia__label">Número de guía</p>' +
          '<p class="rastr-guia__val">' + safeText(pedido.numero_guia) + '</p>' +
          (pedido.transportista ? '<p class="rastr-guia__trans">' + safeText(pedido.transportista) + '</p>' : '') +
        '</div>' +
      '</div>'
    : '';

  /* Fecha */
  var fechaHtml = pedido.created_at
    ? '<p class="rastr-fecha"><i class="bi bi-calendar3"></i> Pedido registrado el ' +
        new Date(pedido.created_at).toLocaleDateString('es-VE', {day:'2-digit',month:'long',year:'numeric'}) +
      '</p>'
    : '';

  container.innerHTML =
    '<div class="rastr-card">' +
      '<div class="rastr-card__header">' +
        '<div>' +
          '<p class="rastr-card__id"><i class="bi bi-hash"></i>' + safeText(pedido.id) + '</p>' +
          fechaHtml +
        '</div>' +
        '<span class="estado-badge ' + status + '">' +
          '<i class="bi bi-circle-fill" style="font-size:.45rem"></i> ' +
          (ESTADOS_ORDEN.find(function(e){return e.key===status;})||{label:status}).label +
        '</span>' +
      '</div>' +
      '<div class="rastr-timeline">' + stepsHtml + '</div>' +
      guiaHtml +
      (pedido.customer
        ? '<div class="rastr-cliente">' +
            '<i class="bi bi-person-circle"></i>' +
            '<span>' + safeText(pedido.customer.nombre || '') + ' · ' + safeText(pedido.customer.estado||'') + ', ' + safeText(pedido.customer.ciudad||'') + '</span>' +
          '</div>'
        : '') +
      itemsHtml +
      '<div class="rastr-acciones">' +
        '<a href="https://wa.me/' + KONT.WS_NUMBER + '?text=' + encodeURIComponent('Hola, consulto sobre mi pedido #' + pedido.id) + '" ' +
           'target="_blank" class="btn btn-secondary btn-sm"><i class="bi bi-whatsapp"></i> Consultar por WhatsApp</a>' +
        (status !== 'entregado' && status !== 'anulado'
          ? '<a href="carrito.html" class="btn btn-ghost btn-sm"><i class="bi bi-basket3"></i> Nuevo pedido</a>'
          : '') +
      '</div>' +
    '</div>';
}

function initRastreador() {
  var form    = document.getElementById('rastr-form');
  var input   = document.getElementById('rastr-input-id');
  var res     = document.getElementById('rastr-resultado');
  var spinner = document.getElementById('rastr-spinner');
  if (!form || !input || !res) return;

  /* Pre-llenar con el último pedido si existe */
  var ultimo = localStorage.getItem('agro_ultimo_pedido');
  if (input && ultimo) input.value = ultimo;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var id = safeText(input.value);
    if (!id) { showToast('Ingresa el ID de tu pedido', 'error'); return; }

    if (spinner) spinner.style.display = 'flex';
    res.innerHTML = '';

    /* Buscar primero en localStorage, luego en API */
    var pedido = buscarPedidoLocal(id);
    if (!pedido) pedido = await buscarPedidoEnAPI(id);

    if (spinner) spinner.style.display = 'none';

    if (!pedido) {
      res.innerHTML =
        '<div class="rastr-no-encontrado">' +
          '<i class="bi bi-search"></i>' +
          '<h4>Pedido no encontrado</h4>' +
          '<p>No encontramos el pedido <strong>' + safeText(id) + '</strong>. Verifica el ID o contáctanos.</p>' +
          '<a href="https://wa.me/' + KONT.WS_NUMBER + '?text=' + encodeURIComponent('Hola, busco mi pedido #' + id + ' pero no aparece en el sistema.') + '" ' +
             'target="_blank" class="btn btn-primary btn-sm"><i class="bi bi-whatsapp"></i> Consultar al equipo</a>' +
        '</div>';
      return;
    }

    renderTimeline(pedido, res);
  });
}


/* ══════════════════════════════════════════════════════════
   3. COMPARADOR DE PRODUCTOS
   Lógica: max 3 productos. Se agregan desde tienda.html
   o desde el mismo comparador. Se persiste en localStorage.
   Muestra tabla con specs, precio y resalta el mejor valor.
══════════════════════════════════════════════════════════ */

var COMPARADOR_KEY = 'agro_comparador';
var MAX_COMPARAR   = 3;

function getComparador() {
  return JSON.parse(localStorage.getItem(COMPARADOR_KEY) || '[]');
}

function setComparador(lista) {
  localStorage.setItem(COMPARADOR_KEY, JSON.stringify(lista));
  actualizarBadgeComparador();
}

function agregarAComparador(producto) {
  var lista = getComparador();
  if (lista.find(function(p){ return p.id === producto.id; })) {
    showToast(producto.nombre + ' ya está en el comparador', 'info');
    return;
  }
  if (lista.length >= MAX_COMPARAR) {
    showToast('Máximo ' + MAX_COMPARAR + ' productos. Elimina uno para añadir otro.', 'error');
    return;
  }
  lista.push(producto);
  setComparador(lista);
  showToast(producto.nombre + ' añadido al comparador', 'success');
}

function quitarDeComparador(id) {
  var lista = getComparador().filter(function(p){ return p.id !== id; });
  setComparador(lista);
}

function limpiarComparador() {
  setComparador([]);
}

function actualizarBadgeComparador() {
  var n = getComparador().length;
  var badges = document.querySelectorAll('.comparador-badge');
  badges.forEach(function(b){
    b.textContent = n;
    b.style.display = n > 0 ? 'flex' : 'none';
  });
  var floater = document.getElementById('comparador-floater');
  if (floater) floater.style.display = n > 0 ? 'flex' : 'none';
}

/* Tabla de comparación */
var FILAS_COMPARACION = [
  { key:'precio',      label:'Precio',        formato: function(p){ return '<strong class="text-lime">' + fmt(p.precio) + '</strong>'; }, mejor:'menor' },
  { key:'categoria',   label:'Categoría',     formato: function(p){ return p.categoria ? '<span class="badge badge-categoria">' + p.categoria + '</span>' : '—'; } },
  { key:'tipo',        label:'Tipo',          formato: function(p){ return p.tipo ? '<span class="badge badge-tipo">' + p.tipo + '</span>' : '—'; } },
  { key:'descripcion', label:'Descripción',   formato: function(p){ return '<span class="comp-desc">' + safeText((p.descripcion||'').slice(0,120)) + (p.descripcion && p.descripcion.length>120?'…':'') + '</span>'; } },
  { key:'beneficios',  label:'Beneficios',    formato: function(p){
    if (!p.beneficios || !p.beneficios.length) return '—';
    return '<ul class="comp-beneficios">' + p.beneficios.slice(0,3).map(function(b){
      return '<li><i class="bi bi-check2-circle"></i> ' + safeText(b) + '</li>';
    }).join('') + '</ul>';
  }},
  { key:'disponible',  label:'Disponibilidad', formato: function(p){
    return p.is_visible !== false
      ? '<span class="comp-disponible"><i class="bi bi-check-circle-fill"></i> Disponible</span>'
      : '<span class="comp-agotado"><i class="bi bi-x-circle"></i> Sin stock</span>';
  }},
];

function renderComparador() {
  var container = document.getElementById('comp-tabla-wrap');
  if (!container) return;

  var lista = getComparador();

  if (lista.length === 0) {
    container.innerHTML =
      '<div class="comp-vacio">' +
        '<i class="bi bi-bar-chart-steps"></i>' +
        '<h3>Sin productos para comparar</h3>' +
        '<p>Ve a la tienda, selecciona hasta ' + MAX_COMPARAR + ' productos y agrégalos aquí.</p>' +
        '<a href="tienda.html" class="btn btn-primary"><i class="bi bi-shop"></i> Ir a la tienda</a>' +
      '</div>';
    return;
  }

  /* Calcular mejor precio */
  var menorPrecio = Math.min.apply(null, lista.map(function(p){ return p.precio; }));

  /* Cabeceras */
  var headCols = lista.map(function(p) {
    var esMejorPrecio = p.precio === menorPrecio && lista.length > 1;
    return '<th class="comp-th' + (esMejorPrecio ? ' comp-th--destacado' : '') + '">' +
      (esMejorPrecio ? '<div class="comp-mejor-badge"><i class="bi bi-trophy-fill"></i> Mejor precio</div>' : '') +
      '<div class="comp-prod-img"><img src="' + safeText(p.imagen||'img/placeholder.png') + '" alt="' + safeText(p.nombre) + '" onerror="this.src=\'img/placeholder.png\'"></div>' +
      '<p class="comp-prod-nombre">' + safeText(p.nombre) + '</p>' +
      '<div class="comp-header-btns">' +
        '<button class="btn btn-primary btn-sm agregar-carrito-comp" ' +
          'data-id="' + safeText(p.id) + '" data-nombre="' + safeText(p.nombre) + '" ' +
          'data-precio="' + p.precio + '" data-img="' + safeText(p.imagen||'') + '">' +
          '<i class="bi bi-cart-plus"></i> Añadir' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm btn-quitar-comp" data-id="' + safeText(p.id) + '">' +
          '<i class="bi bi-x"></i>' +
        '</button>' +
      '</div>' +
    '</th>';
  }).join('');

  /* Filas */
  var rowsHtml = FILAS_COMPARACION.map(function(fila) {
    var celdas = lista.map(function(p) {
      return '<td class="comp-td">' + fila.formato(p) + '</td>';
    }).join('');
    return '<tr><td class="comp-label">' + fila.label + '</td>' + celdas + '</tr>';
  }).join('');

  /* Fila de acción final */
  var filaCTA = '<tr class="comp-tr-cta"><td class="comp-label">Acción</td>' +
    lista.map(function(p){
      return '<td class="comp-td">' +
        '<a href="producto.html?id=' + safeText(p.id) + '" class="btn btn-secondary btn-sm btn-full">' +
          '<i class="bi bi-eye"></i> Ver detalle' +
        '</a>' +
      '</td>';
    }).join('') +
  '</tr>';

  container.innerHTML =
    '<div class="comp-controles">' +
      '<p class="comp-info-count">' +
        '<strong>' + lista.length + '</strong> de ' + MAX_COMPARAR + ' productos seleccionados' +
      '</p>' +
      '<button class="btn btn-ghost btn-sm" id="btn-limpiar-comp">' +
        '<i class="bi bi-trash3"></i> Limpiar todo' +
      '</button>' +
    '</div>' +
    '<div class="comp-tabla-scroll">' +
      '<table class="comp-tabla">' +
        '<thead><tr><th class="comp-th comp-th--label">Características</th>' + headCols + '</tr></thead>' +
        '<tbody>' + rowsHtml + filaCTA + '</tbody>' +
      '</table>' +
    '</div>';

  /* Listeners en la tabla */
  container.querySelectorAll('.btn-quitar-comp').forEach(function(btn) {
    btn.addEventListener('click', function() {
      quitarDeComparador(btn.dataset.id);
      renderComparador();
    });
  });

  container.querySelectorAll('.agregar-carrito-comp').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var carrito = JSON.parse(localStorage.getItem('agro_carrito') || '[]');
      var ex = carrito.find(function(i){ return i.id === btn.dataset.id; });
      if (ex) { ex.cantidad++; }
      else {
        carrito.push({
          id: btn.dataset.id,
          nombre: btn.dataset.nombre,
          precio: parseFloat(btn.dataset.precio),
          imagen: btn.dataset.img,
          cantidad: 1
        });
      }
      if(window.STATE&&window.STATE.carrito)window.STATE.carrito=carrito;
      localStorage.setItem('agro_carrito',JSON.stringify(carrito));
      if(window.actualizarContadorCarrito)window.actualizarContadorCarrito();
      var total = carrito.reduce(function(s,i){ return s+i.cantidad; }, 0);
      document.querySelectorAll('.contador-carrito').forEach(function(el){ el.textContent = total; });
      btn.innerHTML = '<i class="bi bi-cart-check-fill"></i> Añadido';
      showToast(btn.dataset.nombre + ' añadido al carrito', 'success');
    });
  });

  var btnLimpiar = document.getElementById('btn-limpiar-comp');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', function() {
      limpiarComparador();
      renderComparador();
    });
  }
}

function initComparador() {
  renderComparador();
  actualizarBadgeComparador();

  /* Botones "Comparar" en tienda.html */
  document.querySelectorAll('.btn-comparar').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var p = {
        id:          btn.dataset.id,
        nombre:      btn.dataset.nombre,
        precio:      parseFloat(btn.dataset.precio),
        imagen:      btn.dataset.img || '',
        categoria:   btn.dataset.categoria || '',
        tipo:        btn.dataset.tipo || '',
        descripcion: btn.dataset.desc || '',
        is_visible:  true
      };
      agregarAComparador(p);
    });
  });
}

/* ── FLOATER COMPARADOR (visible en tienda.html) ────────── */
function initFloaterComparador() {
  var floater = document.getElementById('comparador-floater');
  if (!floater) return;
  actualizarBadgeComparador();
}


/* ══════════════════════════════════════════════════════════
   INIT GLOBAL
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  var page = location.pathname.split('/').pop() || 'index.html';

  if (page === 'calculadora.html') initCalculadora();
  if (page === 'rastreador.html')  initRastreador();
  if (page === 'comparador.html')  initComparador();

  /* Floater de comparador disponible en toda la tienda */
  initFloaterComparador();

  /* Exponer funciones para uso externo (tienda.html, producto.html) */
  window.AGRO = window.AGRO || {};
  window.AGRO.agregarAComparador  = agregarAComparador;
  window.AGRO.getComparador       = getComparador;
  window.AGRO.actualizarBadgeComp = actualizarBadgeComparador;
});
