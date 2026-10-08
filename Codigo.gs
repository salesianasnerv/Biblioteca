/**
 * BIBLIOTECA DEL COLEGIO — aplicación web sobre una hoja de cálculo de Google.
 *
 * No hace falta modificar este archivo. Todo se gestiona desde la propia web
 * (apartado Administración) o desde la pestaña "Ajustes" de la hoja.
 */

const H = {
  LIBROS: 'Libros', LECTORES: 'Lectores', PRESTAMOS: 'Préstamos', RESERVAS: 'Reservas',
  GESTORES: 'Gestores', AJUSTES: 'Ajustes', HISTORIAL: 'Historial'
};

const CABECERAS = {
  'Libros': ['Código', 'Etapa', 'Título', 'Autor', 'Editorial', 'ISBN', 'Género', 'Observaciones', 'Estado', 'Revisar'],
  'Lectores': ['ID', 'Correo', 'Nombre', 'Apellidos', 'Curso', 'Estado', 'Origen', 'Unidad organizativa'],
  'Préstamos': ['ID', 'Código', 'Título', 'Lector', 'Nombre', 'Curso', 'Fecha préstamo', 'Fecha límite', 'Fecha devolución', 'Prestado por', 'Recibido por', 'Renovaciones'],
  'Reservas': ['ID', 'Código', 'Título', 'Lector', 'Nombre', 'Curso', 'Fecha reserva', 'Caduca', 'Estado', 'Gestionado por'],
  'Gestores': ['Correo', 'Nombre'],
  'Ajustes': ['Ajuste', 'Valor', 'Descripción'],
  'Historial': ['Fecha', 'Usuario', 'Acción', 'Elemento', 'Detalle']
};

const AJUSTES_INICIALES = [
  ['nombre_biblioteca', 'Biblioteca', 'Título que aparece en la web'],
  ['dias_prestamo', 15, 'Días que dura un préstamo'],
  ['max_libros_alumno', 2, 'Libros que un alumno puede tener a la vez (préstamos + reservas)'],
  ['dias_reserva', 3, 'Días que tiene un alumno para recoger un libro reservado'],
  ['reservas_alumnado', 'SÍ', 'SÍ = el alumnado puede reservar desde la web; NO = solo consultar'],
  ['dominio', 'nervion.salesianas.org', 'Dominio de las cuentas del alumnado']
];

const ETAPAS = ['Infantil', 'Primaria', 'ESO/Bachillerato'];
const PREFIJOS = { 'Infantil': 'INFANTIL', 'Primaria': 'PRIMARIA', 'ESO/Bachillerato': 'ESO-BACH' };

// ───────────────────────── Entrada de la web y menú ─────────────────────────

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Biblioteca')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Biblioteca')
    .addItem('Abrir la web', 'abrirWeb')
    .addSeparator()
    .addItem('Configurar (solo la primera vez)', 'configurar')
    .addToUi();
}

function abrirWeb() {
  const url = ScriptApp.getService().getUrl();
  const html = url
    ? '<p style="font-family:sans-serif">Dirección de la web:</p><p><a href="' + url + '" target="_blank" style="font-family:sans-serif">' + url + '</a></p>'
    : '<p style="font-family:sans-serif">La web aún no está publicada. Sigue el paso «Implementar» de las instrucciones.</p>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(480).setHeight(140), 'Biblioteca');
}

/** Crea las pestañas que falten, pone los ajustes iniciales y te añade como gestor/a. */
function configurar() {
  const ss = ss_();
  PropertiesService.getScriptProperties().setProperty('ID_HOJA', ss.getId());
  // La hoja del catálogo limpio trae la pestaña «Catálogo»: pasa a ser «Libros».
  if (!ss.getSheetByName(H.LIBROS) && ss.getSheetByName('Catálogo')) ss.getSheetByName('Catálogo').setName(H.LIBROS);
  Object.keys(CABECERAS).forEach(function (nombre) {
    let sh = ss.getSheetByName(nombre);
    if (!sh) sh = ss.insertSheet(nombre);
    const cab = CABECERAS[nombre];
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, cab.length).setValues([cab]);
    sh.getRange(1, 1, 1, cab.length).setFontWeight('bold').setBackground('#e8eef7');
    sh.setFrozenRows(1);
  });
  ss.getSheetByName(H.LIBROS).getRange('F:F').setNumberFormat('@');

  const aj = tabla_(H.AJUSTES);
  const existentes = aj.filas.map(function (f) { return f['Ajuste']; });
  AJUSTES_INICIALES.forEach(function (a) {
    if (existentes.indexOf(a[0]) < 0) anadir_(aj, { 'Ajuste': a[0], 'Valor': a[1], 'Descripción': a[2] });
  });

  const correo = correoActual_();
  const ges = tabla_(H.GESTORES);
  if (correo && !ges.filas.some(function (g) { return String(g['Correo']).toLowerCase() === correo; })) {
    anadir_(ges, { 'Correo': correo, 'Nombre': '' });
  }
  registrar_('Configuración', '', 'Hoja preparada');
  try {
    SpreadsheetApp.getUi().alert('Listo. Ya puedes publicar la web (Implementar → Nueva implementación).');
  } catch (e) { /* ejecutado desde el editor */ }
}

// ───────────────────────── Acceso a la hoja ─────────────────────────

function ss_() {
  const activa = SpreadsheetApp.getActiveSpreadsheet();
  if (activa) return activa;
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('ID_HOJA'));
}

function tabla_(nombre) {
  const sh = ss_().getSheetByName(nombre);
  if (!sh) throw new Error('Falta la pestaña «' + nombre + '». Ejecuta Biblioteca → Configurar.');
  const valores = sh.getDataRange().getValues();
  const cab = (valores.shift() || []).map(function (c) { return String(c).trim(); });
  const filas = [];
  valores.forEach(function (v, i) {
    if (v.every(function (x) { return x === '' || x === null; })) return;
    const o = { _fila: i + 2 };
    cab.forEach(function (c, j) { o[c] = v[j]; });
    filas.push(o);
  });
  return { sh: sh, cab: cab, filas: filas };
}

function guardar_(t, o) {
  const fila = t.cab.map(function (c) { return o[c] === undefined || o[c] === null ? '' : o[c]; });
  t.sh.getRange(o._fila, 1, 1, fila.length).setValues([fila]);
}

function anadir_(t, o) {
  const fila = t.cab.map(function (c) { return o[c] === undefined || o[c] === null ? '' : o[c]; });
  t.sh.appendRow(fila);
  o._fila = t.sh.getLastRow();
  t.filas.push(o);
  return o;
}

function conBloqueo_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function ajustes_() {
  const out = {};
  AJUSTES_INICIALES.forEach(function (a) { out[a[0]] = a[1]; });
  try { tabla_(H.AJUSTES).filas.forEach(function (f) { if (f['Ajuste']) out[f['Ajuste']] = f['Valor']; }); } catch (e) {}
  out.dias_prestamo = Number(out.dias_prestamo) || 15;
  out.max_libros_alumno = Number(out.max_libros_alumno) || 2;
  out.dias_reserva = Number(out.dias_reserva) || 3;
  out.reservas_alumnado = /^s/i.test(String(out.reservas_alumnado));
  return out;
}

function registrar_(accion, elemento, detalle) {
  try {
    const sh = ss_().getSheetByName(H.HISTORIAL);
    if (sh) sh.appendRow([new Date(), correoActual_(), accion, elemento || '', detalle || '']);
  } catch (e) {}
}

// ───────────────────────── Utilidades ─────────────────────────

function correoActual_() {
  return String(Session.getActiveUser().getEmail() || '').toLowerCase().trim();
}

/** "PRIMARIA 036", "primaria-36" y "PRIMARIA-036" se consideran el mismo código. */
function claveCodigo_(c) {
  c = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = c.match(/^([A-Z]+)0*(\d+)$/);
  return m ? m[1] + Number(m[2]) : c;
}

/** Acepta el código o la dirección completa leída de un QR. */
function limpiarEntradaCodigo_(txt) {
  txt = String(txt || '').trim();
  const m = txt.match(/[?&]libro=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : txt;
}

function norm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function esFecha_(d) { return Object.prototype.toString.call(d) === '[object Date]' && !isNaN(d); }
function dia_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function masDias_(d, n) { const r = dia_(d); r.setDate(r.getDate() + n); return r; }
function fmt_(d) {
  if (!esFecha_(d)) return d ? String(d) : '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
function fmtHora_(d) {
  if (!esFecha_(d)) return d ? String(d) : '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}
function diasEntre_(a, b) { return Math.round((dia_(b) - dia_(a)) / 86400000); }

function nuevoId_(prefijo) {
  return prefijo + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMddHHmmss') + Math.floor(Math.random() * 900 + 100);
}

function nombreLector_(l) { return [l['Nombre'], l['Apellidos']].filter(String).join(' ').trim(); }

// ───────────────────────── Usuario actual ─────────────────────────

function yo_() {
  const correo = correoActual_();
  const esGestor = !!correo && tabla_(H.GESTORES).filas.some(function (g) {
    return String(g['Correo']).toLowerCase().trim() === correo;
  });
  let lector = null;
  if (correo && !esGestor) {
    lector = tabla_(H.LECTORES).filas.find(function (l) {
      return String(l['Correo']).toLowerCase().trim() === correo && l['Estado'] === 'Activo';
    }) || null;
  }
  return { correo: correo, esGestor: esGestor, lector: lector };
}

function exigirGestor_() {
  const y = yo_();
  if (!y.esGestor) throw new Error('No tienes permiso para hacer esto.');
  return y;
}

// ───────────────────────── Estado de los libros ─────────────────────────

function contexto_() {
  const ctx = {
    libros: tabla_(H.LIBROS), prest: tabla_(H.PRESTAMOS), res: tabla_(H.RESERVAS),
    hoy: dia_(new Date()), activos: {}, reservas: {}
  };
  ctx.prest.filas.forEach(function (p) {
    if (!esFecha_(p['Fecha devolución']) && !p['Fecha devolución'] && p['Código']) ctx.activos[claveCodigo_(p['Código'])] = p;
  });
  ctx.res.filas.forEach(function (r) {
    if (r['Estado'] === 'Pendiente' && !caducada_(r, ctx.hoy)) ctx.reservas[claveCodigo_(r['Código'])] = r;
  });
  return ctx;
}

function caducada_(r, hoy) { return esFecha_(r['Caduca']) && dia_(r['Caduca']) < hoy; }

function estadoDe_(l, ctx) {
  if (l['Estado'] === 'Baja') return 'Baja';
  const k = claveCodigo_(l['Código']);
  if (ctx.activos[k]) return 'Prestado';
  if (ctx.reservas[k]) return 'Reservado';
  return 'Disponible';
}

/** Guarda el estado en la hoja para que se vea también al abrirla. */
function actualizarEstado_(ctx, codigo) {
  const k = claveCodigo_(codigo);
  ctx.libros.filas.forEach(function (l) {
    if (claveCodigo_(l['Código']) !== k) return;
    const e = estadoDe_(l, ctx);
    if (l['Estado'] !== e) { l['Estado'] = e; guardar_(ctx.libros, l); }
  });
}

/** Marca como caducadas las reservas vencidas y libera esos libros. */
function limpiarReservas_(ctx) {
  ctx.res.filas.forEach(function (r) {
    if (r['Estado'] === 'Pendiente' && caducada_(r, ctx.hoy)) {
      r['Estado'] = 'Caducada';
      guardar_(ctx.res, r);
      actualizarEstado_(ctx, r['Código']);
    }
  });
}

function librosConCodigo_(ctx, codigo) {
  const k = claveCodigo_(limpiarEntradaCodigo_(codigo));
  if (!k) return [];
  return ctx.libros.filas.filter(function (l) { return claveCodigo_(l['Código']) === k; });
}

function libroUnico_(ctx, codigo) {
  const ls = librosConCodigo_(ctx, codigo);
  if (!ls.length) throw new Error('No hay ningún libro con el código «' + limpiarEntradaCodigo_(codigo) + '».');
  if (ls.length > 1) throw new Error('Hay ' + ls.length + ' libros con el código «' + ls[0]['Código'] + '». Corrígelo en Administración → Libros.');
  return ls[0];
}

function fichaLibro_(l, ctx, completa) {
  const k = claveCodigo_(l['Código']);
  const f = {
    fila: l._fila, codigo: String(l['Código'] || ''), etapa: l['Etapa'] || '', titulo: l['Título'] || '',
    autor: l['Autor'] || '', editorial: l['Editorial'] || '', isbn: String(l['ISBN'] || ''),
    genero: l['Género'] || '', estado: estadoDe_(l, ctx)
  };
  const p = ctx.activos[k], r = ctx.reservas[k];
  if (p) f.vuelve = fmt_(p['Fecha límite']);
  if (completa) {
    f.observaciones = l['Observaciones'] || '';
    f.revisar = l['Revisar'] || '';
    if (p) f.prestamo = { id: p['ID'], lector: p['Lector'], nombre: p['Nombre'], curso: p['Curso'], desde: fmt_(p['Fecha préstamo']), limite: fmt_(p['Fecha límite']) };
    if (r) f.reserva = { id: r['ID'], lector: r['Lector'], nombre: r['Nombre'], curso: r['Curso'], caduca: fmt_(r['Caduca']) };
  }
  return f;
}

// ───────────────────────── Funciones para todos ─────────────────────────

function iniciar() {
  const y = yo_();
  const aj = ajustes_();
  let rol = 'visitante', nombre = '', curso = '';
  if (y.esGestor) rol = 'gestor';
  else if (y.lector) { rol = 'lector'; nombre = nombreLector_(y.lector); curso = y.lector['Curso']; }
  let url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (e) {}
  return {
    correo: y.correo, rol: rol, nombre: nombre, curso: curso, url: url, etapas: ETAPAS,
    ajustes: {
      nombre_biblioteca: String(aj.nombre_biblioteca), dias_prestamo: aj.dias_prestamo,
      max_libros_alumno: aj.max_libros_alumno, dias_reserva: aj.dias_reserva, reservas_alumnado: aj.reservas_alumnado
    }
  };
}

/** Catálogo agrupado por título: cada grupo lleva sus ejemplares. */
function catalogo() {
  const y = yo_();
  const ctx = contexto_();
  const grupos = {}, lista = [];
  ctx.libros.filas.forEach(function (l) {
    if (!l['Título']) return;
    const est = estadoDe_(l, ctx);
    if (est === 'Baja' && !y.esGestor) return;
    const key = norm_(l['Título']) + '|' + norm_(l['Autor']);
    let g = grupos[key];
    if (!g) {
      g = grupos[key] = { titulo: l['Título'], autor: l['Autor'] || '', editorial: l['Editorial'] || '', etapa: l['Etapa'] || '', genero: l['Género'] || '', ejemplares: [] };
      lista.push(g);
    }
    g.ejemplares.push(y.esGestor ? fichaLibro_(l, ctx, true) : fichaLibro_(l, ctx, false));
  });
  return lista;
}

/** Ficha de un libro por su código (al escanear el QR). */
function verLibro(codigo) {
  const y = yo_();
  const ctx = contexto_();
  const l = libroUnico_(ctx, codigo);
  if (!y.esGestor && l['Estado'] === 'Baja') throw new Error('Este libro no está disponible en el catálogo.');
  return fichaLibro_(l, ctx, y.esGestor);
}

// ───────────────────────── Alumnado ─────────────────────────

function misLibros() {
  const y = yo_();
  if (!y.lector) return { prestamos: [], reservas: [] };
  const id = y.lector['ID'];
  const ctx = contexto_();
  return {
    prestamos: ctx.prest.filas.filter(function (p) { return p['Lector'] === id && !p['Fecha devolución']; })
      .map(function (p) { return { codigo: p['Código'], titulo: p['Título'], desde: fmt_(p['Fecha préstamo']), limite: fmt_(p['Fecha límite']), retraso: Math.max(0, diasEntre_(p['Fecha límite'], ctx.hoy)) }; }),
    reservas: ctx.res.filas.filter(function (r) { return r['Lector'] === id && r['Estado'] === 'Pendiente' && !caducada_(r, ctx.hoy); })
      .map(function (r) { return { id: r['ID'], codigo: r['Código'], titulo: r['Título'], caduca: fmt_(r['Caduca']) }; })
  };
}

/** El alumno reserva: recibe los códigos de los ejemplares de un título y coge el primero libre. */
function reservar(codigos) {
  return conBloqueo_(function () {
    const y = yo_();
    const aj = ajustes_();
    if (!y.lector) throw new Error('Solo el alumnado registrado puede reservar.');
    if (!aj.reservas_alumnado) throw new Error('Ahora mismo las reservas desde la web están desactivadas. Pregunta en la biblioteca.');
    const ctx = contexto_();
    limpiarReservas_(ctx);
    const id = y.lector['ID'];
    if (cuentaLector_(ctx, id) >= aj.max_libros_alumno) {
      throw new Error('Ya tienes ' + aj.max_libros_alumno + ' libros entre préstamos y reservas. Devuelve alguno para reservar otro.');
    }
    const libre = [].concat(codigos).map(function (c) { return librosConCodigo_(ctx, c); })
      .filter(function (ls) { return ls.length === 1 && estadoDe_(ls[0], ctx) === 'Disponible'; })[0];
    if (!libre) throw new Error('Lo sentimos, ya no queda ningún ejemplar disponible de este libro.');
    const l = libre[0];
    const r = anadir_(ctx.res, {
      'ID': nuevoId_('R'), 'Código': l['Código'], 'Título': l['Título'], 'Lector': id, 'Nombre': nombreLector_(y.lector),
      'Curso': y.lector['Curso'], 'Fecha reserva': new Date(), 'Caduca': masDias_(new Date(), aj.dias_reserva), 'Estado': 'Pendiente', 'Gestionado por': ''
    });
    ctx.reservas[claveCodigo_(l['Código'])] = r;
    actualizarEstado_(ctx, l['Código']);
    registrar_('Reserva', l['Código'], nombreLector_(y.lector) + ' reserva «' + l['Título'] + '»');
    return { codigo: l['Código'], titulo: l['Título'], caduca: fmt_(r['Caduca']) };
  });
}

function cancelarReserva(idReserva) {
  return conBloqueo_(function () {
    const y = yo_();
    const ctx = contexto_();
    const r = ctx.res.filas.find(function (x) { return x['ID'] === idReserva; });
    if (!r || r['Estado'] !== 'Pendiente') throw new Error('Esa reserva ya no está activa.');
    if (!y.esGestor && !(y.lector && y.lector['ID'] === r['Lector'])) throw new Error('No puedes cancelar esta reserva.');
    r['Estado'] = 'Cancelada';
    r['Gestionado por'] = y.correo;
    guardar_(ctx.res, r);
    delete ctx.reservas[claveCodigo_(r['Código'])];
    actualizarEstado_(ctx, r['Código']);
    registrar_('Reserva cancelada', r['Código'], r['Nombre'] + ' — «' + r['Título'] + '»');
    return true;
  });
}

function cuentaLector_(ctx, idLector) {
  const p = ctx.prest.filas.filter(function (x) { return x['Lector'] === idLector && !x['Fecha devolución']; }).length;
  const r = ctx.res.filas.filter(function (x) { return x['Lector'] === idLector && x['Estado'] === 'Pendiente' && !caducada_(x, ctx.hoy); }).length;
  return p + r;
}

// ───────────────────────── Gestión: préstamos ─────────────────────────

function lectoresActivos() {
  exigirGestor_();
  const ctx = contexto_();
  return tabla_(H.LECTORES).filas.filter(function (l) { return l['Estado'] === 'Activo'; }).map(function (l) {
    return { id: l['ID'], nombre: nombreLector_(l), curso: l['Curso'] || '', correo: l['Correo'] || '', libros: cuentaLector_(ctx, l['ID']) };
  });
}

/**
 * Presta un libro. Si supera el límite o el libro está reservado para otra persona,
 * devuelve un aviso; con forzar = true se presta igualmente.
 */
function prestar(codigo, idLector, forzar) {
  return conBloqueo_(function () {
    const y = exigirGestor_();
    const aj = ajustes_();
    const ctx = contexto_();
    limpiarReservas_(ctx);
    const l = libroUnico_(ctx, codigo);
    const k = claveCodigo_(l['Código']);
    const lector = tabla_(H.LECTORES).filas.find(function (x) { return x['ID'] === idLector; });
    if (!lector) throw new Error('No se encuentra a ese lector.');
    if (lector['Estado'] !== 'Activo') throw new Error(nombreLector_(lector) + ' está de baja.');
    const est = estadoDe_(l, ctx);
    if (est === 'Baja') throw new Error('Este libro está dado de baja.');
    if (est === 'Prestado') throw new Error('Este libro ya está prestado a ' + ctx.activos[k]['Nombre'] + '. Regístralo primero como devuelto.');
    const reserva = ctx.reservas[k];
    const esSuReserva = reserva && reserva['Lector'] === idLector;
    if (!forzar) {
      const avisos = [];
      if (reserva && !esSuReserva) avisos.push('Este libro está reservado para ' + reserva['Nombre'] + ' (' + reserva['Curso'] + ').');
      const cuenta = cuentaLector_(ctx, idLector) - (esSuReserva ? 1 : 0);
      if (cuenta >= aj.max_libros_alumno) avisos.push(nombreLector_(lector) + ' ya tiene ' + cuenta + ' libro(s) entre préstamos y reservas (máximo ' + aj.max_libros_alumno + ').');
      if (avisos.length) return { aviso: avisos.join(' ') };
    }
    if (reserva) {
      reserva['Estado'] = esSuReserva ? 'Recogida' : 'Cancelada';
      reserva['Gestionado por'] = y.correo;
      guardar_(ctx.res, reserva);
      delete ctx.reservas[k];
      if (!esSuReserva) registrar_('Reserva cancelada', l['Código'], 'Se prestó a otra persona; era de ' + reserva['Nombre']);
    }
    const limite = masDias_(new Date(), aj.dias_prestamo);
    const p = anadir_(ctx.prest, {
      'ID': nuevoId_('P'), 'Código': l['Código'], 'Título': l['Título'], 'Lector': idLector, 'Nombre': nombreLector_(lector),
      'Curso': lector['Curso'], 'Fecha préstamo': new Date(), 'Fecha límite': limite, 'Fecha devolución': '',
      'Prestado por': y.correo, 'Recibido por': '', 'Renovaciones': 0
    });
    ctx.activos[k] = p;
    actualizarEstado_(ctx, l['Código']);
    registrar_('Préstamo', l['Código'], '«' + l['Título'] + '» a ' + nombreLector_(lector) + ' (' + lector['Curso'] + ')');
    return { ok: true, titulo: l['Título'], codigo: l['Código'], nombre: nombreLector_(lector), limite: fmt_(limite) };
  });
}

function devolver(codigo) {
  return conBloqueo_(function () {
    const y = exigirGestor_();
    const ctx = contexto_();
    const l = libroUnico_(ctx, codigo);
    const k = claveCodigo_(l['Código']);
    const p = ctx.activos[k];
    if (!p) throw new Error('«' + l['Título'] + '» (' + l['Código'] + ') no figura como prestado.');
    p['Fecha devolución'] = new Date();
    p['Recibido por'] = y.correo;
    guardar_(ctx.prest, p);
    delete ctx.activos[k];
    actualizarEstado_(ctx, l['Código']);
    const retraso = Math.max(0, diasEntre_(p['Fecha límite'], ctx.hoy));
    registrar_('Devolución', l['Código'], '«' + l['Título'] + '» de ' + p['Nombre'] + (retraso ? ' (' + retraso + ' días de retraso)' : ''));
    return { titulo: l['Título'], codigo: l['Código'], nombre: p['Nombre'], curso: p['Curso'], retraso: retraso };
  });
}

function renovar(idPrestamo) {
  return conBloqueo_(function () {
    exigirGestor_();
    const aj = ajustes_();
    const ctx = contexto_();
    const p = ctx.prest.filas.find(function (x) { return x['ID'] === idPrestamo && !x['Fecha devolución']; });
    if (!p) throw new Error('Ese préstamo ya no está activo.');
    const base = esFecha_(p['Fecha límite']) && dia_(p['Fecha límite']) > ctx.hoy ? p['Fecha límite'] : ctx.hoy;
    p['Fecha límite'] = masDias_(base, aj.dias_prestamo);
    p['Renovaciones'] = (Number(p['Renovaciones']) || 0) + 1;
    guardar_(ctx.prest, p);
    registrar_('Renovación', p['Código'], '«' + p['Título'] + '» de ' + p['Nombre'] + ' hasta ' + fmt_(p['Fecha límite']));
    return fmt_(p['Fecha límite']);
  });
}

function prestamosYReservas() {
  exigirGestor_();
  const ctx = contexto_();
  const prestamos = ctx.prest.filas.filter(function (p) { return !p['Fecha devolución']; }).map(function (p) {
    return {
      id: p['ID'], codigo: p['Código'], titulo: p['Título'], nombre: p['Nombre'], curso: p['Curso'], lector: p['Lector'],
      desde: fmt_(p['Fecha préstamo']), limite: fmt_(p['Fecha límite']), retraso: Math.max(0, diasEntre_(p['Fecha límite'], ctx.hoy))
    };
  }).sort(function (a, b) { return b.retraso - a.retraso || (a.limite < b.limite ? -1 : 1); });
  const reservas = ctx.res.filas.filter(function (r) { return r['Estado'] === 'Pendiente' && !caducada_(r, ctx.hoy); }).map(function (r) {
    return { id: r['ID'], codigo: r['Código'], titulo: r['Título'], nombre: r['Nombre'], curso: r['Curso'], lector: r['Lector'], desde: fmt_(r['Fecha reserva']), caduca: fmt_(r['Caduca']) };
  });
  return { prestamos: prestamos, reservas: reservas };
}

/** Reserva hecha a mano por quien gestiona (por ejemplo, tras escanear el QR). */
function reservarPara(codigo, idLector) {
  return conBloqueo_(function () {
    const y = exigirGestor_();
    const aj = ajustes_();
    const ctx = contexto_();
    limpiarReservas_(ctx);
    const l = libroUnico_(ctx, codigo);
    const lector = tabla_(H.LECTORES).filas.find(function (x) { return x['ID'] === idLector; });
    if (!lector || lector['Estado'] !== 'Activo') throw new Error('Ese lector no está activo.');
    if (estadoDe_(l, ctx) !== 'Disponible') throw new Error('Este libro no está disponible ahora mismo (' + estadoDe_(l, ctx).toLowerCase() + ').');
    const r = anadir_(ctx.res, {
      'ID': nuevoId_('R'), 'Código': l['Código'], 'Título': l['Título'], 'Lector': idLector, 'Nombre': nombreLector_(lector),
      'Curso': lector['Curso'], 'Fecha reserva': new Date(), 'Caduca': masDias_(new Date(), aj.dias_reserva), 'Estado': 'Pendiente', 'Gestionado por': y.correo
    });
    ctx.reservas[claveCodigo_(l['Código'])] = r;
    actualizarEstado_(ctx, l['Código']);
    registrar_('Reserva', l['Código'], '«' + l['Título'] + '» para ' + nombreLector_(lector) + ' (hecha por gestión)');
    return { caduca: fmt_(r['Caduca']) };
  });
}

// ───────────────────────── Administración: libros ─────────────────────────

const CAMPOS_LIBRO = { codigo: 'Código', etapa: 'Etapa', titulo: 'Título', autor: 'Autor', editorial: 'Editorial', isbn: 'ISBN', genero: 'Género', observaciones: 'Observaciones', revisar: 'Revisar' };

function siguienteCodigo(etapa) {
  exigirGestor_();
  return siguienteCodigo_(tabla_(H.LIBROS), etapa, 1)[0];
}

function siguienteCodigo_(t, etapa, n) {
  const pref = PREFIJOS[etapa];
  if (!pref) throw new Error('Elige la etapa para poder darle un código.');
  const base = pref.replace(/[^A-Z]/g, '');
  let max = 0;
  t.filas.forEach(function (l) {
    const m = String(l['Código'] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/^([A-Z]+)(\d+)$/);
    if (m && m[1] === base) max = Math.max(max, Number(m[2]));
  });
  const out = [];
  for (let i = 1; i <= n; i++) out.push(pref + '-' + ('00' + (max + i)).slice(-3));
  return out;
}

/** Guarda los cambios de un libro existente (fila) o da de alta uno nuevo (fila vacía). */
function guardarLibro(fila, datos, ejemplares) {
  return conBloqueo_(function () {
    exigirGestor_();
    const ctx = contexto_();
    const t = ctx.libros;
    datos = datos || {};
    Object.keys(datos).forEach(function (k) { datos[k] = String(datos[k] === undefined || datos[k] === null ? '' : datos[k]).trim(); });
    if (!datos.titulo) throw new Error('El título es obligatorio.');
    if (datos.etapa && ETAPAS.indexOf(datos.etapa) < 0) throw new Error('Etapa no válida.');

    if (fila) {
      const l = t.filas.find(function (x) { return x._fila === Number(fila); });
      if (!l) throw new Error('No se encuentra ese libro. Recarga la página.');
      const anterior = String(l['Código'] || '');
      if (datos.codigo && claveCodigo_(datos.codigo) !== claveCodigo_(anterior)) {
        if (t.filas.some(function (x) { return x !== l && claveCodigo_(x['Código']) === claveCodigo_(datos.codigo); })) {
          throw new Error('Ya existe otro libro con el código ' + datos.codigo + '.');
        }
      }
      const cambios = [];
      Object.keys(CAMPOS_LIBRO).forEach(function (k) {
        if (!(k in datos)) return;
        const col = CAMPOS_LIBRO[k];
        if (String(l[col] || '') !== datos[k]) { cambios.push(col + ': «' + (l[col] || '') + '» → «' + datos[k] + '»'); l[col] = datos[k]; }
      });
      if (!cambios.length) return { fila: l._fila, codigo: l['Código'], sinCambios: true };
      guardar_(t, l);
      if (anterior && claveCodigo_(anterior) !== claveCodigo_(l['Código'])) renombrarCodigo_(ctx, anterior, l['Código']);
      registrar_('Libro editado', l['Código'], cambios.join(' · '));
      return { fila: l._fila, codigo: l['Código'] };
    }

    // Alta (uno o varios ejemplares iguales)
    const n = Math.max(1, Math.min(50, Number(ejemplares) || 1));
    let codigos;
    if (datos.codigo && n === 1) {
      if (t.filas.some(function (x) { return claveCodigo_(x['Código']) === claveCodigo_(datos.codigo); })) throw new Error('Ya existe un libro con el código ' + datos.codigo + '.');
      codigos = [datos.codigo];
    } else {
      codigos = siguienteCodigo_(t, datos.etapa, n);
    }
    codigos.forEach(function (c) {
      anadir_(t, {
        'Código': c, 'Etapa': datos.etapa, 'Título': datos.titulo, 'Autor': datos.autor, 'Editorial': datos.editorial,
        'ISBN': datos.isbn, 'Género': datos.genero, 'Observaciones': datos.observaciones, 'Estado': 'Disponible', 'Revisar': 'Código nuevo: poner tejuelo'
      });
    });
    registrar_('Alta de libro', codigos.join(', '), '«' + datos.titulo + '»' + (n > 1 ? ' (' + n + ' ejemplares)' : ''));
    return { nuevos: codigos };
  });
}

function renombrarCodigo_(ctx, anterior, nuevo) {
  const k = claveCodigo_(anterior);
  [ctx.prest, ctx.res].forEach(function (t) {
    t.filas.forEach(function (x) { if (claveCodigo_(x['Código']) === k) { x['Código'] = nuevo; guardar_(t, x); } });
  });
}

function marcarRevisado(fila) {
  return guardarLibroCampo_(fila, 'Revisar', '', 'Revisado');
}

function bajaLibro(fila, motivo) {
  return conBloqueo_(function () {
    exigirGestor_();
    const ctx = contexto_();
    const l = ctx.libros.filas.find(function (x) { return x._fila === Number(fila); });
    if (!l) throw new Error('No se encuentra ese libro.');
    if (estadoDe_(l, ctx) === 'Prestado') throw new Error('Está prestado. Regístralo como devuelto antes de darlo de baja.');
    const r = ctx.reservas[claveCodigo_(l['Código'])];
    if (r) { r['Estado'] = 'Cancelada'; guardar_(ctx.res, r); }
    l['Estado'] = 'Baja';
    const nota = 'Baja ' + fmt_(new Date()) + (motivo ? ': ' + motivo : '');
    l['Observaciones'] = [l['Observaciones'], nota].filter(String).join(' · ');
    guardar_(ctx.libros, l);
    registrar_('Baja de libro', l['Código'], '«' + l['Título'] + '»' + (motivo ? ' — ' + motivo : ''));
    return true;
  });
}

function recuperarLibro(fila) {
  return guardarLibroCampo_(fila, 'Estado', 'Disponible', 'Libro recuperado');
}

function guardarLibroCampo_(fila, col, valor, accion) {
  return conBloqueo_(function () {
    exigirGestor_();
    const t = tabla_(H.LIBROS);
    const l = t.filas.find(function (x) { return x._fila === Number(fila); });
    if (!l) throw new Error('No se encuentra ese libro.');
    const antes = l[col];
    l[col] = valor;
    guardar_(t, l);
    registrar_(accion, l['Código'], col + ': «' + (antes || '') + '» → «' + valor + '»');
    return true;
  });
}

function historialLibro(codigo) {
  exigirGestor_();
  const k = claveCodigo_(codigo);
  return tabla_(H.PRESTAMOS).filas.filter(function (p) { return claveCodigo_(p['Código']) === k; }).map(function (p) {
    return { nombre: p['Nombre'], curso: p['Curso'], desde: fmt_(p['Fecha préstamo']), limite: fmt_(p['Fecha límite']), devuelto: fmt_(p['Fecha devolución']) };
  }).reverse();
}

/** Busca título, autor y editorial a partir del ISBN (Google Books y, si no, Open Library). */
function buscarISBN(isbn) {
  exigirGestor_();
  const limpio = String(isbn || '').replace(/[^0-9Xx]/g, '');
  if (limpio.length !== 10 && limpio.length !== 13) throw new Error('El ISBN debe tener 10 o 13 cifras.');
  try {
    const r = UrlFetchApp.fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + limpio, { muteHttpExceptions: true });
    const j = JSON.parse(r.getContentText());
    if (j.items && j.items.length) {
      const v = j.items[0].volumeInfo || {};
      return { titulo: [v.title, v.subtitle].filter(String).join('. '), autor: (v.authors || []).join(', '), editorial: v.publisher || '', isbn: limpio };
    }
  } catch (e) {}
  try {
    const r = UrlFetchApp.fetch('https://openlibrary.org/api/books?bibkeys=ISBN:' + limpio + '&format=json&jscmd=data', { muteHttpExceptions: true });
    const v = JSON.parse(r.getContentText())['ISBN:' + limpio];
    if (v) return { titulo: v.title || '', autor: (v.authors || []).map(function (a) { return a.name; }).join(', '), editorial: ((v.publishers || [])[0] || {}).name || '', isbn: limpio };
  } catch (e) {}
  return { noEncontrado: true, isbn: limpio };
}

// ───────────────────────── Administración: lectores ─────────────────────────

function lectoresTodos() {
  exigirGestor_();
  const ctx = contexto_();
  return tabla_(H.LECTORES).filas.map(function (l) {
    return {
      id: l['ID'], correo: l['Correo'] || '', nombre: l['Nombre'] || '', apellidos: l['Apellidos'] || '', curso: l['Curso'] || '',
      estado: l['Estado'] || '', origen: l['Origen'] || '', libros: cuentaLector_(ctx, l['ID'])
    };
  });
}

function historialLector(id) {
  exigirGestor_();
  return tabla_(H.PRESTAMOS).filas.filter(function (p) { return p['Lector'] === id; }).map(function (p) {
    return { codigo: p['Código'], titulo: p['Título'], desde: fmt_(p['Fecha préstamo']), limite: fmt_(p['Fecha límite']), devuelto: fmt_(p['Fecha devolución']) };
  }).reverse();
}

function guardarLector(id, datos) {
  return conBloqueo_(function () {
    exigirGestor_();
    const t = tabla_(H.LECTORES);
    const d = {};
    ['correo', 'nombre', 'apellidos', 'curso', 'estado'].forEach(function (k) { d[k] = String((datos || {})[k] || '').trim(); });
    d.correo = d.correo.toLowerCase();
    if (!d.nombre) throw new Error('El nombre es obligatorio.');
    if (d.correo && t.filas.some(function (x) { return x['ID'] !== id && String(x['Correo']).toLowerCase() === d.correo; })) {
      throw new Error('Ya hay un lector con el correo ' + d.correo + '.');
    }
    if (id) {
      const l = t.filas.find(function (x) { return x['ID'] === id; });
      if (!l) throw new Error('No se encuentra ese lector.');
      const cambios = [];
      [['correo', 'Correo'], ['nombre', 'Nombre'], ['apellidos', 'Apellidos'], ['curso', 'Curso'], ['estado', 'Estado']].forEach(function (p) {
        if (p[0] === 'estado' && !d.estado) return;
        if (String(l[p[1]] || '') !== d[p[0]]) { cambios.push(p[1] + ': «' + (l[p[1]] || '') + '» → «' + d[p[0]] + '»'); l[p[1]] = d[p[0]]; }
      });
      if (cambios.length) { guardar_(t, l); registrar_('Lector editado', nombreLector_(l), cambios.join(' · ')); }
      return { id: id };
    }
    const nuevoId = d.correo || 'M-' + ('000' + (t.filas.filter(function (x) { return /^M-/.test(x['ID']); }).length + 1)).slice(-4);
    anadir_(t, { 'ID': nuevoId, 'Correo': d.correo, 'Nombre': d.nombre, 'Apellidos': d.apellidos, 'Curso': d.curso, 'Estado': 'Activo', 'Origen': 'Manual', 'Unidad organizativa': '' });
    registrar_('Alta de lector', d.nombre + ' ' + d.apellidos, d.curso);
    return { id: nuevoId };
  });
}

/** Traduce la unidad organizativa de Google (/ESO_3, /BACH_Baja_1…) a un curso. */
function cursoDeUnidad_(ou) {
  const u = String(ou || '').replace(/^\//, '').toUpperCase().trim();
  if (/BAJA/.test(u)) return { baja: true };
  let m;
  if ((m = u.match(/^INF_(\d)$/))) return { curso: 'Infantil ' + ({ 1: '3 años', 2: '4 años', 3: '5 años' }[m[1]] || m[1]) };
  if ((m = u.match(/^EPO_(\d)$/))) return { curso: m[1] + 'º Primaria' };
  if ((m = u.match(/^ESO_(\d)$/))) return { curso: m[1] + 'º ESO' };
  if ((m = u.match(/^BACH_(\d)$/))) return { curso: m[1] + 'º Bachillerato' };
  if ((m = u.match(/^CCFF_(.+)_(\d)$/))) {
    const ciclo = m[1].toLowerCase().replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
    return { curso: m[2] + 'º FP ' + ({ 'Dam': 'DAM', 'Enfermeria': 'Enfermería' }[ciclo] || ciclo) };
  }
  return null; // profesorado, espacios, etc.: no son lectores
}

/**
 * Importa el listado de usuarios descargado de la consola de Google
 * (se copia todo el Excel y se pega en la web).
 */
function importarUsuarios(texto) {
  return conBloqueo_(function () {
    exigirGestor_();
    const aj = ajustes_();
    const dominio = '@' + String(aj.dominio).toLowerCase().replace(/^@/, '');
    const lineas = String(texto || '').split(/\r?\n/).map(function (l) { return l.split('\t'); }).filter(function (c) { return c.join('').trim(); });
    if (!lineas.length) throw new Error('No has pegado nada.');

    let col = { nombre: 0, apellidos: 1, correo: 2, unidad: 3, estado: 5 };
    const cab = lineas[0].map(function (c) { return c.toLowerCase(); });
    if (cab.some(function (c) { return c.indexOf('email') >= 0 || c.indexOf('correo') >= 0; })) {
      const busca = function (pals) { return cab.findIndex(function (c) { return pals.some(function (p) { return c.indexOf(p) >= 0; }); }); };
      col = {
        nombre: busca(['first name', 'nombre']), apellidos: busca(['last name', 'apellido']),
        correo: busca(['email address', 'dirección de correo', 'correo']), unidad: busca(['org unit', 'unidad']), estado: busca(['status', 'estado'])
      };
      lineas.shift();
    }
    if (col.correo < 0 || col.unidad < 0) throw new Error('No encuentro las columnas de correo y unidad organizativa. Pega el listado completo, con la fila de títulos.');

    const t = tabla_(H.LECTORES);
    const porCorreo = {};
    t.filas.forEach(function (l) { if (l['Correo']) porCorreo[String(l['Correo']).toLowerCase()] = l; });
    const vistos = {};
    const res = { nuevos: 0, actualizados: 0, bajas: 0, ignorados: 0, pendientes: [] };
    const nuevosBaja = [];

    lineas.forEach(function (c) {
      const correo = String(c[col.correo] || '').toLowerCase().trim();
      if (!correo.endsWith(dominio)) { res.ignorados++; return; }
      const info = cursoDeUnidad_(c[col.unidad]);
      if (!info) { res.ignorados++; return; }
      vistos[correo] = true;
      const suspendida = col.estado >= 0 && /susp/i.test(c[col.estado] || '');
      const activo = !info.baja && !suspendida;
      const datos = { 'Nombre': String(c[col.nombre] || '').trim(), 'Apellidos': String(c[col.apellidos] || '').trim(), 'Unidad organizativa': String(c[col.unidad] || '').trim() };
      const l = porCorreo[correo];
      if (l) {
        const antes = JSON.stringify([l['Nombre'], l['Apellidos'], l['Curso'], l['Estado'], l['Unidad organizativa']]);
        l['Nombre'] = datos['Nombre'] || l['Nombre'];
        l['Apellidos'] = datos['Apellidos'] || l['Apellidos'];
        l['Unidad organizativa'] = datos['Unidad organizativa'];
        if (activo) { l['Curso'] = info.curso; l['Estado'] = 'Activo'; }
        else if (l['Estado'] === 'Activo') { l['Estado'] = 'Baja'; res.bajas++; nuevosBaja.push(l); }
        if (JSON.stringify([l['Nombre'], l['Apellidos'], l['Curso'], l['Estado'], l['Unidad organizativa']]) !== antes) { l._cambiado = true; if (activo) res.actualizados++; }
      } else if (activo) {
        const n = { 'ID': correo, 'Correo': correo, 'Nombre': datos['Nombre'], 'Apellidos': datos['Apellidos'], 'Curso': info.curso, 'Estado': 'Activo', 'Origen': 'Importado', 'Unidad organizativa': datos['Unidad organizativa'], _nuevo: true };
        t.filas.push(n);
        porCorreo[correo] = n;
        res.nuevos++;
      }
    });

    // Cuentas importadas otros años que ya no aparecen en el listado
    t.filas.forEach(function (l) {
      if (l['Origen'] === 'Importado' && l['Estado'] === 'Activo' && !vistos[String(l['Correo']).toLowerCase()]) {
        l['Estado'] = 'Baja'; l._cambiado = true; res.bajas++; nuevosBaja.push(l);
      }
    });

    // Se reescribe la pestaña entera de una vez (mucho más rápido que fila a fila)
    const filas = t.filas.map(function (l) { return t.cab.map(function (c) { return l[c] === undefined ? '' : l[c]; }); });
    if (t.sh.getLastRow() > 1) t.sh.getRange(2, 1, t.sh.getLastRow() - 1, t.cab.length).clearContent();
    if (filas.length) t.sh.getRange(2, 1, filas.length, t.cab.length).setValues(filas);

    const ctx = contexto_();
    nuevosBaja.forEach(function (l) {
      ctx.prest.filas.forEach(function (p) {
        if (p['Lector'] === l['ID'] && !p['Fecha devolución']) res.pendientes.push({ nombre: nombreLector_(l), curso: p['Curso'], titulo: p['Título'], codigo: p['Código'] });
      });
    });
    registrar_('Importación de usuarios', '', res.nuevos + ' nuevos, ' + res.actualizados + ' actualizados, ' + res.bajas + ' bajas');
    return res;
  });
}

// ───────────────────────── Administración: gestores, ajustes, historial ─────────────────────────

function listaGestores() {
  exigirGestor_();
  return tabla_(H.GESTORES).filas.map(function (g) { return { correo: g['Correo'], nombre: g['Nombre'] || '' }; });
}

function anadirGestor(correo, nombre) {
  return conBloqueo_(function () {
    exigirGestor_();
    correo = String(correo || '').toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]+$/.test(correo)) throw new Error('Escribe un correo válido.');
    const t = tabla_(H.GESTORES);
    if (t.filas.some(function (g) { return String(g['Correo']).toLowerCase() === correo; })) throw new Error('Ese correo ya puede gestionar.');
    anadir_(t, { 'Correo': correo, 'Nombre': String(nombre || '').trim() });
    registrar_('Gestor añadido', correo, nombre || '');
    return true;
  });
}

function quitarGestor(correo) {
  return conBloqueo_(function () {
    const y = exigirGestor_();
    correo = String(correo || '').toLowerCase().trim();
    if (correo === y.correo) throw new Error('No puedes quitarte a ti misma/o. Pídeselo a otra persona que gestione.');
    const t = tabla_(H.GESTORES);
    const g = t.filas.find(function (x) { return String(x['Correo']).toLowerCase() === correo; });
    if (!g) throw new Error('No está en la lista.');
    t.sh.deleteRow(g._fila);
    registrar_('Gestor quitado', correo, '');
    return true;
  });
}

function leerAjustes() {
  exigirGestor_();
  return tabla_(H.AJUSTES).filas.map(function (f) { return { clave: f['Ajuste'], valor: f['Valor'], descripcion: f['Descripción'] }; });
}

function guardarAjustes(valores) {
  return conBloqueo_(function () {
    exigirGestor_();
    const t = tabla_(H.AJUSTES);
    const cambios = [];
    t.filas.forEach(function (f) {
      const k = f['Ajuste'];
      if (!(k in valores)) return;
      let v = String(valores[k]).trim();
      if (/^(dias_|max_)/.test(k)) {
        if (!/^\d+$/.test(v) || Number(v) < 1) throw new Error('«' + f['Descripción'] + '» debe ser un número mayor que 0.');
        v = Number(v);
      }
      if (String(f['Valor']) !== String(v)) { cambios.push(k + ': ' + f['Valor'] + ' → ' + v); f['Valor'] = v; guardar_(t, f); }
    });
    if (cambios.length) registrar_('Ajustes', '', cambios.join(' · '));
    return true;
  });
}

function verHistorial(max) {
  exigirGestor_();
  const filas = tabla_(H.HISTORIAL).filas;
  return filas.slice(-(max || 500)).reverse().map(function (h) {
    return { fecha: fmtHora_(h['Fecha']), usuario: h['Usuario'], accion: h['Acción'], elemento: String(h['Elemento'] || ''), detalle: h['Detalle'] };
  });
}
