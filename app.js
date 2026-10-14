(() => {
  "use strict";
  const CFG = window.APP_CONFIG;
  const DEMO = !CFG.supabaseUrl;

  // ─── Utilidades ────────────────────────────────────────────────────────────
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const isoDia = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const deIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const masDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const masDiasIso = (s, n) => isoDia(masDias(deIso(s), n));
  const dowIso = (s) => ((deIso(s).getDay() + 6) % 7) + 1;   // 1 = lunes … 7 = domingo
  const hoyIso = () => isoDia(new Date());
  const hhmm = (t) => (t ? String(t).slice(0, 5) : t);
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const deMin = (m) => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  const ahoraHM = () => { const d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fechaCorta = (s) => { const d = deIso(s); return d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "") + " " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1); };
  const fechaLarga = (s) => deIso(s).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const fechaNum = (s) => s.split("-").reverse().join("/");
  const duracion = (a, b) => { const m = toMin(b) - toMin(a), h = Math.floor(m / 60); return (h ? h + " h" : "") + (m % 60 ? (h ? " " : "") + (m % 60) + " min" : ""); };
  const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const DIAS_C = ["", "L", "M", "X", "J", "V", "S", "D"];
  const limiteIso = () => masDiasIso(hoyIso(), CFG.antelacionDias);
  const nombreDeEmail = (e) => e.split("@")[0].split(/[._-]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
  const quien = (r) => r.profesor_nombre || nombreDeEmail(r.profesor_email);
  const corto = (n) => String(n || "").split(" ").slice(0, 2).join(" ");
  const uuid = () => crypto.randomUUID?.() || "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
  const solapan = (a, b) => a.inicio < b.fin && a.fin > b.inicio;

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3500);
  }
  function fallo(e) {
    console.error(e);
    const m = e?.code === "23P01" ? "Alguna de esas reservas se solapa con otra que acaban de hacer. Vuelve a intentarlo." : e.message || e;
    toast("Error: " + m);
  }

  // ─── Iconos ───────────────────────────────────────────────────────────────
  const ICONOS = {
    sala: '<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M14.5 12h.01"/>',
    escenario: '<path d="M3 4h18M5 4v8c2 0 3.5-2 3.5-4.5M19 4v8c-2 0-3.5-2-3.5-4.5"/><path d="M3 20h18M6 20v-4h12v4"/>',
    libro: '<path d="M4 19V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/><path d="M8 7h7"/>',
    puerta: '<path d="M4 21h16M6 21V4h12v17"/><path d="M14.5 12.5h.01" stroke-width="3"/>',
    pantalla: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    matraz: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>',
    tableta: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M11 18.5h2"/>',
    portatil: '<rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 19h20"/>',
    balon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    musica: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    proyector: '<rect x="2" y="7" width="15" height="10" rx="2"/><circle cx="9.5" cy="12" r="2.5"/><path d="M17 10l5-2v8l-5-2"/>',
    camara: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/>',
    capilla: '<path d="M12 2v6M9 5h6M5 22V12l7-4 7 4v10M10 22v-5h4v5"/>',
  };
  const NOMBRES_ICONO = { sala: "Sala", escenario: "Escenario", libro: "Libro", puerta: "Puerta", pantalla: "Pantalla", matraz: "Laboratorio", tableta: "Tableta", portatil: "Portátil", balon: "Deporte", musica: "Música", proyector: "Proyector", camara: "Cámara", capilla: "Capilla" };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONOS[n] || ICONOS.sala}</svg>`;

  // ─── Estado ──────────────────────────────────────────────────────────────
  const formNuevo = () => ({ slots: [{ fecha: proximoDia(), inicio: "", fin: "" }], repetir: false, hasta: "", sel: new Set() });
  const S = { user: null, franjas: [], espacios: [], bloqueos: [], packs: [], reservas: [], dispo: [], form: null,
    ocDia: hoyIso(), abiertos: new Set(), catAbiertas: new Set(), admSec: null, vista: null };
  const espacio = (id) => S.espacios.find((e) => e.id == id);
  const franjasActivas = () => S.franjas.filter((f) => f.activo);
  // Etapas de las horas habituales; la última que usó esta persona va primero
  const leerEtapa = () => { try { return localStorage.getItem("re_etapa") || ""; } catch { return ""; } };
  const guardarEtapa = (e) => { try { if (e) localStorage.setItem("re_etapa", e); } catch {} };
  const etapasFranjas = () => { const l = [...new Set(franjasActivas().map((f) => f.etapa || ""))], p = leerEtapa(); return l.includes(p) ? [p, ...l.filter((x) => x !== p)] : l; };
  const salas = (todas) => S.espacios.filter((e) => e.tipo === "espacio" && (todas || e.activo));
  const grupos = () => [...new Set(S.espacios.filter((e) => e.tipo === "dispositivo").sort((a, b) => a.orden - b.orden).map((e) => e.grupo))];
  const deGrupo = (g, todas) => S.espacios.filter((e) => e.grupo === g && (todas || e.activo)).sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0) || a.nombre.localeCompare(b.nombre));
  // Categorías: las de los espacios (Zonas comunes, Aulas temáticas…) y, al final, los dispositivos
  const DISP = "Dispositivos";
  const catDe = (e) => (e.tipo === "dispositivo" ? DISP : e.categoria || "Otros espacios");
  const categorias = (todas) => [...new Set(salas(todas).map(catDe)), ...(grupos().length ? [DISP] : [])];
  const etiqueta = (e) => (e.tipo === "dispositivo" && e.numero != null ? String(e.numero) : e.nombre);

  // Siguiente día lectivo (hoy si aún queda jornada)
  function proximoDia() {
    let d = hoyIso();
    if (ahoraHM() >= "14:30") d = masDiasIso(d, 1);
    while (dowIso(d) > 5) d = masDiasIso(d, 1);
    return d;
  }

  // "1, 2, 3, 5" → "1–3, 5"
  function rangos(nums) {
    const n = [...nums].sort((a, b) => a - b), out = [];
    for (let i = 0; i < n.length; i++) {
      let j = i; while (j + 1 < n.length && n[j + 1] === n[j] + 1) j++;
      out.push(j > i + 1 ? `${n[i]}–${n[j]}` : j === i + 1 ? `${n[i]}, ${n[j]}` : `${n[i]}`); i = j;
    }
    return out.join(", ");
  }
  // Lista de recursos en pocas palabras: "Biblioteca · iPads 1–5, 8"
  function describir(ids) {
    const es = ids.map(espacio).filter(Boolean), partes = es.filter((e) => e.tipo === "espacio").map((e) => e.nombre);
    const porGrupo = new Map();
    es.filter((e) => e.tipo === "dispositivo").forEach((e) => porGrupo.set(e.grupo, [...(porGrupo.get(e.grupo) || []), e]));
    porGrupo.forEach((l, g) => partes.push(l.every((e) => e.numero != null) ? `${g} ${rangos(l.map((e) => e.numero))}` : l.map((e) => e.nombre).join(", ")));
    return partes.join(" · ");
  }

  // Bloqueos que afectan a un recurso un día concreto
  function bloqueosDe(e, fecha) {
    const dow = dowIso(fecha);
    return S.bloqueos.filter((b) => (b.espacio_id == e.id || (b.grupo && b.grupo === e.grupo) || (b.espacio_id == null && !b.grupo)) &&
      (b.fecha === fecha || (b.dia_semana === dow && (!b.desde || fecha >= b.desde) && (!b.hasta || fecha <= b.hasta))));
  }
  // Motivos por los que un recurso no se puede reservar en un momento (vacío = libre). Las mismas reglas que la base de datos.
  function conflictos(e, o, lista = S.dispo, ignorar = null) {
    const c = [], dow = dowIso(o.fecha);
    if (!S.user.admin) {
      if (!e.activo) c.push(`${e.nombre} no se puede reservar ahora mismo`);
      if (!e.dias.includes(dow)) c.push(`no se reserva los ${DIAS[dow].toLowerCase()}`);
      if (o.inicio < e.apertura || o.fin > e.cierre) c.push(`solo se reserva de ${e.apertura} a ${e.cierre}`);
    }
    const b = bloqueosDe(e, o.fecha).find((b) => !b.inicio || solapan(b, o));
    if (b) c.push(`no disponible: ${b.motivo}`);
    lista.filter((r) => r.espacio_id == e.id && r.fecha === o.fecha && r.id !== ignorar && solapan(r, o))
      .forEach((r) => c.push(`reservado de ${r.inicio} a ${r.fin} por ${r.profesor_email === S.user.email ? "ti" : quien(r)}`));
    return c;
  }

  // ─── Acceso a datos: modo prueba (navegador) ─────────────────────────────
  const CLAVE = "re_demo_db4";
  const ESO = "ESO · Bachillerato · CCFF", PRI = "Infantil · Primaria";
  const HORARIOS = [
    [ESO, [["1ª hora", "08:00", "09:00"], ["2ª hora", "09:00", "10:00"], ["3ª hora", "10:00", "11:00"], ["Recreo", "11:00", "11:30"],
      ["4ª hora", "11:30", "12:30"], ["5ª hora", "12:30", "13:30"], ["6ª hora", "13:30", "14:30"]]],
    [PRI, [["1ª hora", "09:00", "10:00"], ["2ª hora", "10:00", "11:00"], ["3ª hora", "11:00", "12:00"], ["Recreo", "12:00", "12:30"],
      ["4ª hora", "12:30", "13:15"], ["5ª hora", "13:15", "14:00"]]],
  ];
  function demoInicial() {
    let id = 0;
    const espacios = [
      ["Salón de Actos", "Actos, charlas y reuniones grandes.", "#009abb", "escenario", "Zonas comunes"],
      ["Biblioteca", "Lectura, trabajo en grupo y reuniones.", "#8a9400", "libro", "Zonas comunes"],
      ["Recibidor", "Atención a familias y reuniones pequeñas.", "#ee712a", "puerta", "Zonas comunes"],
      ["Aula de Informática", "Ordenadores fijos para un grupo completo.", "#007791", "pantalla", "Aulas temáticas"],
      ["Laboratorio", "Prácticas de ciencias.", "#6b7200", "matraz", "Aulas temáticas"],
    ].map(([nombre, descripcion, color, ic, categoria], k) => ({ id: ++id, nombre, descripcion, tipo: "espacio", categoria, grupo: null, numero: null, color, icono: ic, dias: [1, 2, 3, 4, 5], apertura: "08:00", cierre: "14:30", activo: true, orden: k + 1 }));
    const disp = (g, pref, n, color, ic, base) => Array.from({ length: n }, (_, k) => ({ id: ++id, nombre: `${pref} ${k + 1}`, descripcion: null, tipo: "dispositivo", grupo: g, numero: k + 1, color, icono: ic, dias: [1, 2, 3, 4, 5], apertura: "08:00", cierre: "14:30", activo: true, orden: base + k + 1 }));
    const ipads = disp("iPads", "iPad", 15, "#d35a15", "tableta", 100), port = disp("Portátiles", "Portátil", 20, "#475569", "portatil", 200);
    const pack = (g, nombre, l, a, b, o) => ({ id: ++id, grupo: g, nombre, espacios: l.slice(a - 1, b).map((e) => e.id), orden: o });
    return {
      seq: 1000,
      franjas: [...HORARIOS.flatMap(([etapa, l]) => l.map(([nombre, inicio, fin], k) => ({ id: ++id, etapa, nombre, inicio, fin, orden: k + 1, activo: true })))],
      espacios: [...espacios, ...ipads, ...port],
      packs: [pack("iPads", "iPads 1-5", ipads, 1, 5, 1), pack("iPads", "iPads 6-10", ipads, 6, 10, 2), pack("iPads", "iPads 11-15", ipads, 11, 15, 3),
        pack("Portátiles", "Portátiles 1-10", port, 1, 10, 1), pack("Portátiles", "Portátiles 11-20", port, 11, 20, 2)],
      bloqueos: [], reservas: [],
      admins: ["laura.ramos", "silvia.alonso", "rocio.cano", "antonio.puntas", "administracionnervion", "profesorado.prueba"].map((u) => u + "@" + CFG.dominio),
    };
  }
  const demoApi = {
    _db() { try { const d = JSON.parse(localStorage.getItem(CLAVE)); if (d) return d; } catch {} const d = demoInicial(); this._set(d); return d; },
    _set(d) { try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) { fallo(e); } },
    _id(d) { return ++d.seq; },
    async sesion() { return { email: "profesorado.prueba@" + CFG.dominio, nombre: "Profesor/a de prueba", admin: true }; },
    async login() {},
    async logout() { location.reload(); },
    async datos() { const d = this._db(); return { franjas: d.franjas, espacios: d.espacios, bloqueos: d.bloqueos, packs: d.packs }; },
    async reservas({ desde, hasta, email } = {}) {
      return this._db().reservas.filter((r) => (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta) && (!email || r.profesor_email === email));
    },
    async reservar(filas) {
      const d = this._db(), nuevas = [];
      for (const f of filas) {
        const r = { id: this._id(d), profesor_email: S.user.email, profesor_nombre: S.user.nombre, creado_por: S.user.email, creado: new Date().toISOString(), ...f };
        const c = conflictos(espacio(r.espacio_id), r, [...d.reservas, ...nuevas]);
        if (c.length) throw new Error(`${espacio(r.espacio_id).nombre} (${fechaNum(r.fecha)}): ${c[0]}`);
        nuevas.push(r);
      }
      d.reservas.push(...nuevas); this._set(d); return nuevas;
    },
    async anular(ids) { const d = this._db(); d.reservas = d.reservas.filter((r) => !ids.includes(r.id)); this._set(d); },
    async mover(id, cambios) {
      const d = this._db(), r = d.reservas.find((x) => x.id === id), nueva = { ...r, ...cambios };
      const c = conflictos(espacio(nueva.espacio_id), nueva, d.reservas, id);
      if (c.length) throw new Error(c[0]);
      Object.assign(r, cambios); this._set(d);
    },
    _nombreLibre(d, e) { if (e.nombre && d.espacios.some((x) => x.id !== e.id && x.nombre.toLowerCase() === e.nombre.toLowerCase())) throw new Error(`Ya hay algo llamado «${e.nombre}»`); },
    async guardarEspacio(e) {
      const d = this._db(); this._nombreLibre(d, e);
      if (e.id) Object.assign(d.espacios.find((x) => x.id === e.id), e);
      else d.espacios.push({ ...e, id: this._id(d), orden: e.orden ?? d.espacios.length + 1 });
      this._set(d);
    },
    async crearEspacios(filas) { const d = this._db(); filas.forEach((e) => { this._nombreLibre(d, e); d.espacios.push({ ...e, id: this._id(d) }); }); this._set(d); },
    async actualizarGrupo(viejo, c) {
      const d = this._db();
      d.espacios.filter((e) => e.grupo === viejo).forEach((e) => Object.assign(e, c));
      if (c.grupo && c.grupo !== viejo) { d.packs.filter((p) => p.grupo === viejo).forEach((p) => (p.grupo = c.grupo)); d.bloqueos.filter((b) => b.grupo === viejo).forEach((b) => (b.grupo = c.grupo)); }
      this._set(d);
    },
    async borrarEspacio(id) {
      const d = this._db(); d.espacios = d.espacios.filter((x) => x.id !== id); d.reservas = d.reservas.filter((r) => r.espacio_id !== id);
      d.bloqueos = d.bloqueos.filter((b) => b.espacio_id !== id); d.packs.forEach((p) => (p.espacios = p.espacios.filter((x) => x !== id))); this._set(d);
    },
    async guardarPack(p) { const d = this._db(); if (p.id) Object.assign(d.packs.find((x) => x.id === p.id), p); else d.packs.push({ ...p, id: this._id(d) }); this._set(d); },
    async borrarPack(id) { const d = this._db(); d.packs = d.packs.filter((p) => p.id !== id); this._set(d); },
    async guardarFranja(f) { const d = this._db(); if (f.id) Object.assign(d.franjas.find((x) => x.id === f.id), f); else d.franjas.push({ ...f, id: this._id(d) }); this._set(d); },
    async borrarFranja(id) { const d = this._db(); d.franjas = d.franjas.filter((x) => x.id !== id); this._set(d); },
    async crearBloqueos(filas) { const d = this._db(); filas.forEach((b) => d.bloqueos.push({ ...b, id: this._id(d) })); this._set(d); },
    async borrarBloqueo(id) { const d = this._db(); d.bloqueos = d.bloqueos.filter((b) => b.id !== id); this._set(d); },
    async admins() { return [...this._db().admins].sort().map((email) => ({ email })); },
    async addAdmin(email) { const d = this._db(); if (d.admins.includes(email)) throw new Error("Esa cuenta ya tiene acceso"); d.admins.push(email); this._set(d); },
    async delAdmin(email) { const d = this._db(); d.admins = d.admins.filter((e) => e !== email); this._set(d); },
  };

  // ─── Acceso a datos: Supabase + Microsoft 365 ─────────────────────────────
  const sb = DEMO ? null : supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  const ok = (r) => { if (r.error) throw r.error; return r.data; };
  const sinSegundos = (o, ...k) => { k.forEach((x) => (o[x] = hhmm(o[x]))); return o; };
  const unico = (r, txt) => { if (r.error?.code === "23505") throw new Error(txt); return ok(r); };
  const sbApi = {
    async sesion() {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return null;
      const u = session.user, email = (u.email || "").toLowerCase();
      if (!email.endsWith("@" + CFG.dominio)) {
        await sb.auth.signOut();
        throw new Error(`Solo se permite el acceso con cuentas @${CFG.dominio}.`);
      }
      // Solo devuelve fila si esta cuenta está en la tabla de administración (lo impone la base de datos)
      const adm = await sb.from("res_admin").select("email").eq("email", email).limit(1);
      return { email, nombre: u.user_metadata?.full_name || u.user_metadata?.name || nombreDeEmail(email), admin: !adm.error && adm.data.length > 0 };
    },
    async login() {
      ok(await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "email profile", redirectTo: location.origin + location.pathname } }));
    },
    async logout() { await sb.auth.signOut(); location.reload(); },
    async datos() {
      const [f, e, b, p] = await Promise.all([
        sb.from("res_franjas").select("*").order("inicio"),
        sb.from("res_espacios").select("*").order("orden").order("nombre"),
        sb.from("res_bloqueos").select("*").order("id"),
        sb.from("res_packs").select("*").order("orden").order("nombre"),
      ]);
      return { franjas: ok(f).map((x) => sinSegundos(x, "inicio", "fin")), espacios: ok(e).map((x) => sinSegundos(x, "apertura", "cierre")),
        bloqueos: ok(b).map((x) => sinSegundos(x, "inicio", "fin")), packs: ok(p) };
    },
    async reservas({ desde, hasta, email } = {}) {
      const todo = [];
      for (let i = 0; ; i += 1000) {
        let q = sb.from("res_reservas").select("*").order("fecha").order("inicio").order("id").range(i, i + 999);
        if (desde) q = q.gte("fecha", desde);
        if (hasta) q = q.lte("fecha", hasta);
        if (email) q = q.eq("profesor_email", email);
        const d = ok(await q);
        todo.push(...d.map((x) => sinSegundos(x, "inicio", "fin")));
        if (d.length < 1000) return todo;
      }
    },
    // Todas a la vez: o se guardan todas o ninguna
    async reservar(filas) { return ok(await sb.from("res_reservas").insert(filas.map((f) => ({ profesor_nombre: S.user.nombre, ...f }))).select()); },
    async anular(ids) { for (let i = 0; i < ids.length; i += 200) ok(await sb.from("res_reservas").delete().in("id", ids.slice(i, i + 200))); },
    async mover(id, cambios) { ok(await sb.from("res_reservas").update(cambios).eq("id", id)); },
    async guardarEspacio(e) {
      const { id, ...datos } = e;
      unico(id ? await sb.from("res_espacios").update(datos).eq("id", id) : await sb.from("res_espacios").insert({ orden: S.espacios.length + 1, ...datos }), `Ya hay algo llamado «${e.nombre}»`);
    },
    async crearEspacios(filas) { unico(await sb.from("res_espacios").insert(filas), "Alguno de esos nombres ya existe"); },
    async actualizarGrupo(viejo, c) {
      unico(await sb.from("res_espacios").update(c).eq("grupo", viejo), "Ya existe ese nombre");
      if (c.grupo && c.grupo !== viejo) {
        ok(await sb.from("res_packs").update({ grupo: c.grupo }).eq("grupo", viejo));
        ok(await sb.from("res_bloqueos").update({ grupo: c.grupo }).eq("grupo", viejo));
      }
    },
    async borrarEspacio(id) {
      ok(await sb.from("res_espacios").delete().eq("id", id));
      for (const p of S.packs.filter((p) => p.espacios.includes(id))) ok(await sb.from("res_packs").update({ espacios: p.espacios.filter((x) => x !== id) }).eq("id", p.id));
    },
    async guardarPack(p) { const { id, ...datos } = p; ok(id ? await sb.from("res_packs").update(datos).eq("id", id) : await sb.from("res_packs").insert(datos)); },
    async borrarPack(id) { ok(await sb.from("res_packs").delete().eq("id", id)); },
    async guardarFranja(f) { const { id, ...datos } = f; ok(id ? await sb.from("res_franjas").update(datos).eq("id", id) : await sb.from("res_franjas").insert(datos)); },
    async borrarFranja(id) { ok(await sb.from("res_franjas").delete().eq("id", id)); },
    async crearBloqueos(filas) { ok(await sb.from("res_bloqueos").insert(filas)); },
    async borrarBloqueo(id) { ok(await sb.from("res_bloqueos").delete().eq("id", id)); },
    async admins() { return ok(await sb.from("res_admin").select("email").order("email")); },
    async addAdmin(email) { unico(await sb.from("res_admin").insert({ email }), "Esa cuenta ya tiene acceso"); },
    async delAdmin(email) { ok(await sb.from("res_admin").delete().eq("email", email)); },
  };
  const api = DEMO ? demoApi : sbApi;

  // ─── Diálogo genérico ─────────────────────────────────────────────────────
  function dialogo(html, alAbrir) {
    const dlg = $("#dlg"), f = $("#dlgForm");
    f.innerHTML = html;
    return new Promise((res) => {
      dlg.onclose = () => res(dlg.returnValue);
      dlg.returnValue = "";
      f.onsubmit = () => (S.dlgDatos = Object.fromEntries(new FormData(f)));
      dlg.showModal();
      alAbrir?.(f, dlg);
    });
  }
  const confirmar = (titulo, texto, boton = "Sí", clase = "primario") => dialogo(`<h2>${titulo}</h2><div class="dlg-sub">${texto}</div>
    <div class="dlg-botones"><button class="btn" value="">Cancelar</button><button class="btn ${clase}" value="ok">${boton}</button></div>`).then((v) => v === "ok");
  const listaCorta = (l, max = 10) => `<ul class="problemas">${l.slice(0, max).map((p) => `<li>${esc(p)}</li>`).join("")}${l.length > max ? `<li>y ${l.length - max} más…</li>` : ""}</ul>`;

  // ─── Inicio ───────────────────────────────────────────────────────────────
  async function iniciar() {
    $("#demoAviso").hidden = !DEMO;
    $("#btnLogin").onclick = () => api.login().catch((e) => ($("#loginError").textContent = e.message));
    $("#btnAdminFranja").onclick = $("#btnLogin").onclick;
    try {
      S.user = await api.sesion();
    } catch (e) {
      $("#loginError").textContent = e.message;
    }
    if (!S.user) { document.body.classList.add("sin-sesion"); $("#vLogin").hidden = false; return; }

    // Nombre de quien ha entrado y botón «Salir», justo debajo de la franja
    $("#usuario").textContent = S.user.nombre;
    $("#sesion").hidden = false;
    $("#btnSalir").hidden = DEMO;
    $("#btnSalir").onclick = () => api.logout();
    pintarInstalar();
    $("#tabs").hidden = false;

    try { await recargarDatos(); } catch (e) { fallo(e); return; }
    S.form = formNuevo();

    $("#tabAdmin").hidden = !S.user.admin;
    // Botón «Administración» de la franja: solo para cuentas autorizadas
    $("#btnAdminFranja").hidden = !S.user.admin;
    $("#btnAdminFranja").onclick = () => mostrar("admin");
    $$("#tabs > button[data-vista]").forEach((b) => (b.onclick = () => mostrar(b.dataset.vista)));
    const menu = $("#tabAdmin");
    $("[data-menu]", menu).onclick = () => menu.classList.toggle("abierto");
    $$("[data-admin]", menu).forEach((b) => (b.onclick = () => { menu.classList.remove("abierto"); mostrar("admin", b.dataset.admin); }));
    document.addEventListener("click", (e) => { if (!e.target.closest("#tabAdmin")) menu.classList.remove("abierto"); });
    prepararReservar();
    prepararOcupacion();
    prepararMias();
    if (S.user.admin) prepararAdmin();
    mostrar("reservar");
    contarMias();

    // Al volver a la pestaña, se recarga por si otra persona ha reservado mientras tanto
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !$("#dlg").open) refrescar(); });
    $("#btnEjemplo").onclick = generarEjemplo;
    $("#btnVaciar").onclick = async () => { if (await confirmar("Borrar todo", "Se borrarán todas las reservas y cambios de prueba.", "Borrar", "aviso")) { localStorage.removeItem(CLAVE); location.reload(); } };
  }

  async function recargarDatos() {
    const d = await api.datos();
    S.franjas = [...d.franjas].sort((a, b) => (a.etapa || "").localeCompare(b.etapa || "") || a.inicio.localeCompare(b.inicio));
    S.espacios = [...d.espacios].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
    S.bloqueos = d.bloqueos;
    S.packs = [...d.packs].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  }

  function mostrar(vista, apartado) {
    S.vista = vista;
    $$("#tabs > button[data-vista]").forEach((b) => b.classList.toggle("activa", b.dataset.vista === vista));
    $("#tabAdmin [data-menu]").classList.toggle("activa", vista === "admin");
    if (vista === "admin") {
      S.admSec = apartado || S.admSec || "listado";
      $$("#vAdmin [data-sec]").forEach((el) => (el.hidden = el.dataset.sec !== S.admSec));
      $$("#tabAdmin [data-admin]").forEach((b) => b.classList.toggle("activo", b.dataset.admin === S.admSec));
    }
    $("#vReservar").hidden = vista !== "reservar";
    $("#vOcupacion").hidden = vista !== "ocupacion";
    $("#vMias").hidden = vista !== "mias";
    $("#vAdmin").hidden = vista !== "admin";
    $("main").hidden = vista === "admin";
    $("#barraSel").hidden = true;
    refrescar();
  }

  // Vuelve a pedir los datos de lo que se está viendo
  async function refrescar() {
    try {
      if (S.vista === "reservar") { pintarFormulario(); await cargarDispo(); }
      else if (S.vista === "ocupacion") await pintarOcupacion();
      else if (S.vista === "mias") await pintarMias();
      else if (S.vista === "admin") await pintarAdmin();
    } catch (e) { fallo(e); }
  }

  // ─── Reservar ─────────────────────────────────────────────────────────────
  function prepararReservar() {
    $("#fEmailL").hidden = !S.user.admin;
    $("#btnSlot").onclick = () => {
      const u = S.form.slots[S.form.slots.length - 1];
      S.form.slots.push({ fecha: u?.fecha || proximoDia(), inicio: "", fin: "" });
      pintarSlots(); $$("#slots .slot:last-child input")[1]?.focus();
    };
    $("#slots").addEventListener("input", (ev) => {
      const el = ev.target, i = +el.closest("[data-i]")?.dataset.i, k = el.dataset.k;
      if (!k || isNaN(i)) return;
      const s = S.form.slots[i];
      if (k === "atajo") {
        const f = S.franjas.find((x) => x.id == el.value);
        if (f) { s.inicio = f.inicio; s.fin = f.fin; guardarEtapa(f.etapa); }
        el.value = ""; pintarSlots();
      } else { s[k] = el.value; pintarInfoSlot(i); }
      cambioCuando();
    });
    $("#slots").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-quitar]"); if (!b) return;
      S.form.slots.splice(+b.dataset.quitar, 1); pintarSlots(); cambioCuando();
    });
    $("#fRepetir").onchange = (e) => { S.form.repetir = e.target.checked; $("#fHastaL").hidden = !e.target.checked; cambioCuando(); };
    $("#fHasta").oninput = (e) => { S.form.hasta = e.target.value; cambioCuando(); };
    $("#que").addEventListener("click", pulsarQue);
    // Recordar qué categorías tiene abiertas cada uno
    $("#que").addEventListener("toggle", (e) => { const d = e.target; if (d.matches?.("details.cat")) d.open ? S.catAbiertas.add(d.dataset.cat) : S.catAbiertas.delete(d.dataset.cat); }, true);
    $("#selQuitar").onclick = () => { S.form = formNuevo(); $("#fMotivo").value = ""; $("#fEmail").value = ""; refrescar(); };
    $("#selReservar").onclick = reservar;
  }
  function cambioCuando() { clearTimeout(S._dispo); S._dispo = setTimeout(() => cargarDispo().catch(fallo), 250); }

  function pintarFormulario() {
    $("#fRepetir").checked = S.form.repetir; $("#fHastaL").hidden = !S.form.repetir; $("#fHasta").value = S.form.hasta;
    if (!S.user.admin) $("#fHasta").max = limiteIso();
    pintarSlots();
  }
  function pintarSlots() {
    const hoy = hoyIso(), max = S.user.admin ? "" : limiteIso();
    const op = (f) => `<option value="${f.id}">${esc(f.nombre)} · ${f.inicio}–${f.fin}</option>`;
    const etapas = etapasFranjas();
    const atajos = etapas.length > 1 ? etapas.map((et) => `<optgroup label="${esc(et || "Otras")}">${franjasActivas().filter((f) => (f.etapa || "") === et).map(op).join("")}</optgroup>`).join("")
      : franjasActivas().map(op).join("");
    $("#slots").innerHTML = S.form.slots.map((s, i) => `<div class="slot" data-i="${i}">
      <label class="campo">Día <input type="date" data-k="fecha" value="${s.fecha}" ${S.user.admin ? "" : `min="${hoy}"`} ${max ? `max="${max}"` : ""}></label>
      <label class="campo">Desde <input type="time" step="300" data-k="inicio" value="${s.inicio}"></label>
      <label class="campo">Hasta <input type="time" step="300" data-k="fin" value="${s.fin}"></label>
      ${atajos ? `<label class="campo">Hora habitual <select data-k="atajo"><option value="">Elegir…</option>${atajos}</select></label>` : ""}
      ${S.form.slots.length > 1 ? `<button class="btn icono quitar" type="button" data-quitar="${i}" aria-label="Quitar este horario">×</button>` : ""}
      <div class="slot-info" id="slotInfo${i}"></div></div>`).join("");
    S.form.slots.forEach((_, i) => pintarInfoSlot(i));
  }
  function errorSlot(s) {
    if (!s.fecha || !s.inicio || !s.fin) return "";
    if (s.fin <= s.inicio) return "La hora de fin debe ser posterior a la de inicio.";
    if (!S.user.admin) {
      if (s.fecha < hoyIso() || (s.fecha === hoyIso() && s.fin <= ahoraHM())) return "Esa hora ya ha pasado.";
      if (s.fecha > limiteIso()) return `Solo se puede reservar hasta el ${fechaNum(limiteIso())} (${CFG.antelacionDias} días).`;
    }
    return null;
  }
  function pintarInfoSlot(i) {
    const s = S.form.slots[i], el = $("#slotInfo" + i); if (!el) return;
    const err = errorSlot(s);
    el.className = "slot-info" + (err ? " mal" : "");
    el.textContent = err === "" ? (s.fecha ? mayus(fechaLarga(s.fecha)) + " · falta la hora" : "Elige el día")
      : err || `${mayus(fechaLarga(s.fecha))} · de ${s.inicio} a ${s.fin} (${duracion(s.inicio, s.fin)})`;
  }

  // Todos los momentos pedidos (con la repetición semanal)
  function ocurrencias() {
    const out = [], avisos = [];
    for (const s of S.form.slots) {
      if (errorSlot(s) !== null) continue;
      const hasta = S.form.repetir && S.form.hasta ? S.form.hasta : s.fecha;
      for (let f = s.fecha, n = 0; f <= hasta && n < 53; f = masDiasIso(f, 7), n++) {
        const o = { fecha: f, inicio: s.inicio, fin: s.fin };
        if (!S.user.admin && f > limiteIso()) { avisos.push(`A partir del ${fechaNum(limiteIso())} todavía no se puede reservar.`); break; }
        if (!out.some((x) => x.fecha === o.fecha && x.inicio === o.inicio && x.fin === o.fin)) out.push(o);
      }
    }
    out.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio.localeCompare(b.inicio));
    return { lista: out, avisos: [...new Set(avisos)] };
  }

  async function cargarDispo() {
    const oc = ocurrencias();
    S.oc = oc.lista;
    $("#slotsNota").textContent = [S.oc.length > 1 ? `En total, ${S.oc.length} días u horarios.` : "", ...oc.avisos].filter(Boolean).join(" ");
    if (S.oc.length) S.dispo = await api.reservas({ desde: S.oc[0].fecha, hasta: S.oc[S.oc.length - 1].fecha });
    pintarQue();
  }

  // Situación de un recurso en todos los momentos pedidos
  function estadoRecurso(e) {
    if (!S.oc?.length) return { n: 0, c: [] };
    const c = S.oc.map((o) => ({ o, motivos: conflictos(e, o) })).filter((x) => x.motivos.length);
    return { n: c.length, c, todos: c.length === S.oc.length };
  }
  const textoEstado = (st) => !S.oc?.length ? "" : !st.n ? "Libre" : S.oc.length === 1 || st.todos && st.c.every((x) => x.motivos[0] === st.c[0].motivos[0]) ? mayus(st.c[0].motivos[0]) : `No disponible en ${st.n} de ${S.oc.length}`;
  const tituloEstado = (e, st) => esc(e.nombre + (st.n ? "\n" + st.c.map((x) => `${fechaCorta(x.o.fecha)} ${x.o.inicio}: ${x.motivos.join("; ")}`).join("\n") : ""));

  function pintarQue() {
    const hay = !!S.oc?.length, sel = S.form.sel;
    $("#queAyuda").textContent = hay ? "Marca todo lo que necesites: varios espacios y dispositivos a la vez. En gris, lo ocupado; con borde naranja, lo que está ocupado solo en alguna de las fechas elegidas." : "Primero indica cuándo; así verás qué está libre. Puedes marcar varios espacios y dispositivos a la vez.";
    const tarjeta = (e) => {
      const st = estadoRecurso(e), on = sel.has(e.id);
      const cls = on ? "on" : st.todos ? "ocupado" : st.n ? "parcial" : hay ? "libre" : "";
      return `<button type="button" class="recurso ${cls}" data-id="${e.id}" style="--c:${esc(e.color)}" ${st.todos && !on ? "disabled" : ""} title="${tituloEstado(e, st)}">
        <span class="esp-icono">${icono(e.icono)}</span><span class="esp-txt"><span class="en">${esc(e.nombre)}</span><span class="estado">${esc(textoEstado(st) || e.descripcion || "")}</span></span>
        <span class="marca-sel" aria-hidden="true"></span></button>`;
    };
    const bloque = (g) => {
      const l = deGrupo(g); if (!l.length) return "";
      const st = new Map(l.map((e) => [e.id, estadoRecurso(e)]));
      const libres = l.filter((e) => !st.get(e.id).n).length, elegidos = l.filter((e) => sel.has(e.id)).length;
      const packs = S.packs.filter((p) => p.grupo === g && p.espacios.length);
      return `<div class="grupo" style="--c:${esc(l[0].color)}">
        <div class="grupo-cab"><span class="esp-icono mini">${icono(l[0].icono)}</span><b>${esc(g)}</b>
          <span class="grupo-n">${hay ? `${libres} de ${l.length} libres` : `${l.length}`}${elegidos ? ` · <b>${elegidos} ${elegidos === 1 ? "elegido" : "elegidos"}</b>` : ""}</span></div>
        <div class="packs">${packs.map((p) => `<button type="button" class="btn mini" data-pack="${p.id}">${esc(p.nombre)}</button>`).join("")}
          <button type="button" class="btn mini" data-todos="${esc(g)}">Todos los libres</button>${elegidos ? `<button type="button" class="btn mini" data-ninguno="${esc(g)}">Ninguno</button>` : ""}</div>
        <div class="fichas">${l.map((e) => { const s = st.get(e.id), on = sel.has(e.id);
          return `<button type="button" class="dispo ${on ? "on" : s.todos ? "ocupado" : s.n ? "parcial" : ""}" data-id="${e.id}" ${s.todos && !on ? "disabled" : ""} title="${tituloEstado(e, s)}">${esc(etiqueta(e))}</button>`; }).join("")}</div>
      </div>`;
    };
    // Cada categoría es un desplegable; en el título se ve qué incluye y cuántos hay libres o elegidos
    $("#que").innerHTML = categorias().map((cat) => {
      const es = cat === DISP ? grupos().flatMap((g) => deGrupo(g)) : salas().filter((e) => catDe(e) === cat);
      if (!es.length) return "";
      const nSel = es.filter((e) => sel.has(e.id)).length, libres = es.filter((e) => !estadoRecurso(e).n).length;
      const incluye = cat === DISP ? grupos().map((g) => `${g} (${deGrupo(g).length})`).join(" · ") : es.map((e) => e.nombre).join(" · ");
      const cuerpo = cat === DISP ? grupos().map(bloque).join("") : `<div class="recursos">${es.map(tarjeta).join("")}</div>`;
      return `<details class="cat" data-cat="${esc(cat)}" ${S.catAbiertas.has(cat) ? "open" : ""}>
        <summary><span class="cat-txt"><b>${esc(cat)}</b><small>${esc(incluye)}</small></span>
          <span class="cat-estado">${nSel ? `<span class="cat-sel">${nSel} ${nSel === 1 ? "elegido" : "elegidos"}</span>` : ""}${hay ? `<span>${libres} de ${es.length} libres</span>` : ""}</span><span class="flecha"></span></summary>
        <div class="cat-cuerpo">${cuerpo}</div></details>`;
    }).join("");
    pintarResumen();
  }

  function pulsarQue(ev) {
    const sel = S.form.sel, b = ev.target.closest("button"); if (!b || b.disabled) return;
    const libre = (e) => !estadoRecurso(e).todos;
    if (b.dataset.id) { const id = +b.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); }
    else if (b.dataset.pack) {
      const p = S.packs.find((x) => x.id == b.dataset.pack), ids = p.espacios.map(espacio).filter((e) => e?.activo && libre(e)).map((e) => e.id);
      if (!ids.length) return toast("Ninguno de ese pack está libre");
      ids.every((id) => sel.has(id)) ? ids.forEach((id) => sel.delete(id)) : ids.forEach((id) => sel.add(id));
      if (ids.length < p.espacios.length) toast(`${p.espacios.length - ids.length} del pack no están libres y no se han marcado`);
    }
    else if (b.dataset.todos) deGrupo(b.dataset.todos).filter(libre).forEach((e) => sel.add(e.id));
    else if (b.dataset.ninguno) deGrupo(b.dataset.ninguno).forEach((e) => sel.delete(e.id));
    else return;
    pintarQue();
  }

  function pintarResumen() {
    const n = S.form.sel.size, m = S.oc?.length || 0, total = n * m;
    $("#barraSel").hidden = S.vista !== "reservar" || !n;
    $("#selTexto").innerHTML = m ? `<b>${total}</b> ${total === 1 ? "reserva" : "reservas"}${m > 1 && n > 1 ? ` <small>(${n} × ${m} horarios)</small>` : ""}` : `<b>${n}</b> elegido${n === 1 ? "" : "s"} · falta el horario`;
    $("#resumen").innerHTML = n ? `<b>Vas a reservar:</b> ${esc(describir([...S.form.sel]))}${m ? ` · ${m === 1 ? `${fechaLarga(S.oc[0].fecha)}, de ${S.oc[0].inicio} a ${S.oc[0].fin}` : `${m} días u horarios`}` : ""}` : "";
  }

  async function reservar() {
    if (!S.oc?.length) return toast("Indica el día y las horas");
    if (!S.form.sel.size) return toast("Marca qué quieres reservar");
    const email = $("#fEmail").value.trim().toLowerCase();
    if (email && !email.endsWith("@" + CFG.dominio)) return toast(`La cuenta debe ser @${CFG.dominio}`);
    const base = { motivo: $("#fMotivo").value.trim() || null, lote: uuid() };
    if (email) Object.assign(base, { profesor_email: email, profesor_nombre: nombreDeEmail(email) });
    try {
      // Datos recientes, por si alguien ha reservado mientras se rellenaba
      S.dispo = await api.reservas({ desde: S.oc[0].fecha, hasta: S.oc[S.oc.length - 1].fecha });
      const buenas = [], problemas = [];
      for (const o of S.oc) for (const id of S.form.sel) {
        const e = espacio(id), c = conflictos(e, o, [...S.dispo, ...buenas]);
        c.length ? problemas.push(`${e.nombre} · ${fechaCorta(o.fecha)} ${o.inicio}–${o.fin}: ${c[0]}`) : buenas.push({ ...base, espacio_id: id, ...o });
      }
      if (!buenas.length) return dialogo(`<h2>No se puede reservar</h2>${listaCorta(problemas)}<div class="dlg-botones"><button class="btn primario" value="">Entendido</button></div>`);
      if (problemas.length && !(await confirmar("Hay cosas que no están libres", `${listaCorta(problemas)}¿Reservar el resto (${buenas.length})?`, `Reservar ${buenas.length}`))) return;
      await api.reservar(buenas);
      toast(buenas.length === 1 ? "Reserva hecha ✓" : `${buenas.length} reservas hechas ✓ Las tienes en «Mis reservas»`);
      S.form = formNuevo(); $("#fMotivo").value = ""; $("#fEmail").value = "";
      contarMias(); scrollTo({ top: 0 }); await refrescar();
    } catch (err) { fallo(err); cargarDispo().catch(() => {}); }
  }

  // Empezar una reserva ya rellena (desde Ocupación)
  function reservarDesde(fecha, inicio, fin, id) {
    S.form = { slots: [{ fecha, inicio, fin }], repetir: false, hasta: "", sel: new Set([id]) };
    S.catAbiertas.add(catDe(espacio(id)));
    mostrar("reservar"); scrollTo({ top: 0 });
  }

  // ─── Ocupación (línea de tiempo del día) ──────────────────────────────────
  function prepararOcupacion() {
    const ir = (d) => { S.ocDia = d; pintarOcupacion().catch(fallo); };
    $("#ocAnt").onclick = () => ir(masDiasIso(S.ocDia, dowIso(S.ocDia) === 1 ? -3 : -1));
    $("#ocSig").onclick = () => ir(masDiasIso(S.ocDia, dowIso(S.ocDia) === 5 ? 3 : 1));
    $("#ocHoy").onclick = () => ir(hoyIso());
    $("#ocFecha").onchange = (e) => { if (e.target.value) { ir(e.target.value); e.target.value = ""; } };
    $("#ocupacion").addEventListener("click", pulsarOcupacion);
  }

  async function pintarOcupacion() {
    const d = S.ocDia, hoy = hoyIso(), dow = dowIso(d);
    $("#ocTexto").textContent = (d === hoy ? "Hoy, " : "") + deIso(d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    S.reservas = await api.reservas({ desde: d, hasta: d });
    const act = S.espacios.filter((e) => e.activo);
    if (!act.length) { $("#ocupacion").innerHTML = `<p class="vacio">No hay nada que reservar.</p>`; return; }
    // Escala: de la primera apertura al último cierre (o a la última reserva)
    let t0 = Math.min(...act.map((e) => toMin(e.apertura)), ...S.reservas.map((r) => toMin(r.inicio)));
    let t1 = Math.max(...act.map((e) => toMin(e.cierre)), ...S.reservas.map((r) => toMin(r.fin)));
    t0 = Math.floor(t0 / 60) * 60; t1 = Math.ceil(t1 / 60) * 60;
    S.tl = { t0, t1 };
    const pos = (t) => ((toMin(t) - t0) / (t1 - t0)) * 100;
    const caja = (a, b) => `left:${pos(a)}%;width:${pos(b) - pos(a)}%`;
    const horas = []; for (let m = t0; m <= t1; m += 60) horas.push(m);
    const regla = `<div class="tl-fila tl-regla"><div class="tl-nom"></div><div class="tl-pista">${horas.map((m) => `<span style="left:${((m - t0) / (t1 - t0)) * 100}%">${m / 60}:00</span>`).join("")}</div></div>`;
    const ahora = d === hoy && toMin(ahoraHM()) > t0 && toMin(ahoraHM()) < t1 ? `<i class="tl-ahora" style="left:${pos(ahoraHM())}%"></i>` : "";
    const fondo = (e) => {
      if (!e.dias.includes(dow)) return `<div class="tl-cerrado" style="left:0;width:100%">No se reserva este día</div>`;
      return (toMin(e.apertura) > t0 ? `<div class="tl-cerrado" style="${caja(deMin(t0), e.apertura)}" title="Horas no lectivas"></div>` : "") +
        (toMin(e.cierre) < t1 ? `<div class="tl-cerrado" style="${caja(e.cierre, deMin(t1))}" title="Horas no lectivas"></div>` : "") +
        bloqueosDe(e, d).map((b) => `<div class="tl-bloq" style="${b.inicio ? caja(b.inicio, b.fin) : "left:0;width:100%"}" title="${esc(b.motivo)}">${esc(b.motivo)}</div>`).join("");
    };
    const barra = (r) => `<button type="button" class="tl-res ${r.profesor_email === S.user.email ? "mia" : ""}" data-res="${r.id}" style="${caja(r.inicio, r.fin)}"
      title="${esc(`${r.inicio}–${r.fin} · ${quien(r)}${r.motivo ? " · " + r.motivo : ""}`)}"><b>${esc(r.profesor_email === S.user.email ? "Tú" : corto(quien(r)))}</b> ${esc(r.motivo || "")}</button>`;
    const fila = (e, extra = "") => `<div class="tl-fila ${extra}" style="--c:${esc(e.color)}"><div class="tl-nom"><span class="esp-icono mini">${icono(e.icono)}</span><span>${esc(e.nombre)}</span></div>
      <div class="tl-pista" data-pista="${e.id}">${fondo(e)}${S.reservas.filter((r) => r.espacio_id === e.id).map(barra).join("")}${ahora}</div></div>`;

    // Grupo plegado: cuántos dispositivos hay ocupados en cada momento
    const resumenGrupo = (g, l) => {
      const ids = new Set(l.map((e) => e.id)), rs = S.reservas.filter((r) => ids.has(r.espacio_id));
      const puntos = [...new Set(rs.flatMap((r) => [r.inicio, r.fin]))].sort();
      let seg = "";
      for (let i = 0; i + 1 < puntos.length; i++) {
        const a = puntos[i], b = puntos[i + 1], n = new Set(rs.filter((r) => r.inicio <= a && r.fin >= b).map((r) => r.espacio_id)).size;
        if (n) seg += `<div class="tl-res tl-sum ${n >= l.length ? "lleno" : ""}" style="${caja(a, b)}" title="${a}–${b}: ${n} de ${l.length} reservados">${n}/${l.length}</div>`;
      }
      const abierto = S.abiertos.has(g);
      return `<div class="tl-fila tl-grupo" data-grupo="${esc(g)}" style="--c:${esc(l[0].color)}"><div class="tl-nom"><span class="esp-icono mini">${icono(l[0].icono)}</span><span>${esc(g)} <small>(${l.length})</small></span><span class="flecha ${abierto ? "abierta" : ""}"></span></div>
        <div class="tl-pista">${fondo(l[0])}${seg}${ahora}</div></div>` + (abierto ? l.map((e) => fila(e, "tl-hijo")).join("") : "");
    };
    const porCategoria = categorias().map((cat) => {
      const cuerpo = cat === DISP ? grupos().map((g) => { const l = deGrupo(g); return l.length ? resumenGrupo(g, l) : ""; }).join("")
        : salas().filter((e) => catDe(e) === cat).map((e) => fila(e)).join("");
      return cuerpo ? `<div class="tl-cat"><span>${esc(cat)}</span></div>${cuerpo}` : "";
    }).join("");
    const leyenda = `<div class="tl-leyenda"><span><i class="lg-cerrado"></i>Horas no lectivas (no se reserva)</span><span><i class="lg-bloq"></i>No disponible (clase fija, acto…)</span>
      <span><i class="lg-res"></i>Reservado</span><span><i class="lg-mia"></i>Tu reserva</span>${ahora ? '<span><i class="lg-ahora"></i>Ahora</span>' : ""}</div>`;
    $("#ocupacion").innerHTML = `<div class="tl" style="--horas:${(t1 - t0) / 60}">${regla}${porCategoria}</div>${leyenda}
      <p class="nota">${S.reservas.length ? `${S.reservas.length} ${S.reservas.length === 1 ? "reserva" : "reservas"} este día.` : "Ninguna reserva este día."}</p>`;
  }

  function pulsarOcupacion(ev) {
    const res = ev.target.closest("[data-res]");
    if (res) return detalles(S.reservas.find((r) => r.id == res.dataset.res), S.reservas);
    const g = ev.target.closest("[data-grupo]");
    if (g) { S.abiertos.has(g.dataset.grupo) ? S.abiertos.delete(g.dataset.grupo) : S.abiertos.add(g.dataset.grupo); return pintarOcupacion().catch(fallo); }
    const pista = ev.target.closest("[data-pista]"); if (!pista) return;
    // Hueco libre: se propone la hora habitual de ese momento (o una hora desde ahí)
    const rect = pista.getBoundingClientRect(), { t0, t1 } = S.tl;
    const min = t0 + ((ev.clientX - rect.left) / rect.width) * (t1 - t0), e = espacio(+pista.dataset.pista);
    const orden = etapasFranjas();
    const f = [...franjasActivas()].sort((a, b) => orden.indexOf(a.etapa || "") - orden.indexOf(b.etapa || "")).find((x) => toMin(x.inicio) <= min && min < toMin(x.fin));
    const ini = f ? f.inicio : deMin(Math.floor(min / 30) * 30);
    let fin = f ? f.fin : deMin(Math.min(toMin(ini) + 60, toMin(e.cierre)));
    if (fin <= ini) fin = deMin(toMin(ini) + 30);
    reservarDesde(S.ocDia, ini, fin, e.id);
  }

  // ─── Ver, anular y mover reservas ─────────────────────────────────────────
  const puede = (r) => S.user.admin || r.profesor_email === S.user.email;
  const hermanas = (r, lista) => (r.lote ? lista.filter((x) => x.lote === r.lote && x.fecha === r.fecha && x.inicio === r.inicio && x.fin === r.fin) : [r]);

  async function detalles(r, lista) {
    const her = hermanas(r, lista), e = espacio(r.espacio_id);
    const v = await dialogo(`<h2>Reserva</h2>
      <div class="ficha" style="--c:${esc(e?.color)}">
        <b>${esc(e?.nombre)}</b>${her.length > 1 ? `<small>Reservado junto con: ${esc(describir(her.filter((x) => x.id !== r.id).map((x) => x.espacio_id)))}</small>` : ""}
        <div>${mayus(fechaLarga(r.fecha))} · de ${r.inicio} a ${r.fin}</div>
        <div>${esc(quien(r))} <small>${esc(r.profesor_email)}</small></div>
        ${r.motivo ? `<div class="motivo">${esc(r.motivo)}</div>` : ""}
      </div>
      <div class="dlg-botones">${puede(r) ? `${S.user.admin ? '<button class="btn izq" value="mover">Mover o cambiar hora</button>' : ""}
        <button class="btn peligro" value="anular">${her.length > 1 ? `Anular solo ${esc(e?.nombre)}` : "Anular"}</button>
        ${her.length > 1 ? `<button class="btn aviso" value="todas">Anular las ${her.length}</button>` : ""}` : ""}
        <button class="btn primario" value="">Cerrar</button></div>`);
    if (v === "anular") await anular([r]);
    else if (v === "todas") await anular(her);
    else if (v === "mover") await mover(r);
  }

  // Anula unas reservas; si se hicieron junto con otras de más fechas, ofrece anular también esas
  async function anular(rs) {
    const ids = rs.map((r) => r.id), r = rs[0];
    const otras = r.lote ? (await api.reservas({ desde: hoyIso() })).filter((x) => x.lote === r.lote && !ids.includes(x.id) && x.fecha !== r.fecha && puede(x)) : [];
    const ajena = r.profesor_email !== S.user.email ? `<br>Es de <b>${esc(quien(r))}</b>.` : "";
    const txt = `${esc(describir(rs.map((x) => x.espacio_id)))} · ${fechaLarga(r.fecha)}, de ${r.inicio} a ${r.fin}${ajena}`;
    let borrar = ids;
    if (otras.length) {
      const fechas = new Set(otras.map((x) => x.fecha)).size;
      const v = await dialogo(`<h2>Anular reserva</h2><div class="dlg-sub">${txt}</div><p>Se reservó junto con otras ${fechas === 1 ? "de otro día" : `de ${fechas} días más`} (${otras.length}).</p>
        <div class="dlg-botones"><button class="btn" value="">Cancelar</button><button class="btn" value="una">Solo est${rs.length > 1 ? `as (${rs.length})` : "a"}</button><button class="btn aviso" value="todo">Todas (${otras.length + rs.length})</button></div>`);
      if (!v) return;
      if (v === "todo") borrar = [...ids, ...otras.map((x) => x.id)];
    } else if (!(await confirmar("Anular reserva", txt, rs.length > 1 ? `Anular las ${rs.length}` : "Anular", "aviso"))) return;
    try { await api.anular(borrar); toast(borrar.length > 1 ? `${borrar.length} reservas anuladas` : "Reserva anulada"); contarMias(); await refrescar(); } catch (err) { fallo(err); }
  }

  async function mover(r) {
    const opt = S.espacios.map((x) => `<option value="${x.id}" ${x.id == r.espacio_id ? "selected" : ""}>${esc(x.nombre)}</option>`).join("");
    const v = await dialogo(`<h2>Mover reserva</h2><p class="dlg-sub">De ${esc(quien(r))}${r.motivo ? " · " + esc(r.motivo) : ""}</p>
      <label class="campo">Espacio o dispositivo <select name="espacio_id">${opt}</select></label>
      <div class="fila">
        <label class="campo">Día <input type="date" name="fecha" value="${r.fecha}" required></label>
        <label class="campo">Desde <input type="time" step="300" name="inicio" value="${r.inicio}" required></label>
        <label class="campo">Hasta <input type="time" step="300" name="fin" value="${r.fin}" required></label>
      </div>
      <div class="dlg-botones"><button class="btn" value="" formnovalidate>Cancelar</button><button class="btn primario" value="ok">Guardar</button></div>`);
    if (v !== "ok") return;
    const c = { espacio_id: +S.dlgDatos.espacio_id, fecha: S.dlgDatos.fecha, inicio: S.dlgDatos.inicio, fin: S.dlgDatos.fin };
    if (c.fin <= c.inicio) return toast("La hora de fin debe ser posterior a la de inicio");
    try {
      const otras = await api.reservas({ desde: c.fecha, hasta: c.fecha });
      const m = conflictos(espacio(c.espacio_id), c, otras, r.id);
      if (m.length) return dialogo(`<h2>No se puede mover</h2>${listaCorta(m)}<div class="dlg-botones"><button class="btn primario" value="">Entendido</button></div>`);
      await api.mover(r.id, c); toast("Reserva cambiada ✓"); await refrescar();
    } catch (err) { fallo(err); }
  }

  // ─── Mis reservas ─────────────────────────────────────────────────────────
  // Agrupa las reservas hechas de una vez para el mismo día y horario
  function agrupar(lista) {
    const m = new Map();
    lista.forEach((r) => { const k = r.lote ? `${r.lote}|${r.fecha}|${r.inicio}|${r.fin}` : "r" + r.id; m.set(k, [...(m.get(k) || []), r]); });
    return [...m.values()];
  }
  function prepararMias() {
    $("#miasPasadas").onchange = () => pintarMias().catch(fallo);
    $("#mias").addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]"); if (!b) return;
      anular(S.miasGrupos[+b.dataset.g]);
    });
  }
  async function contarMias() {
    try {
      const n = agrupar(await api.reservas({ desde: hoyIso(), email: S.user.email })).length;
      $("#nMias").textContent = n; $("#nMias").hidden = !n;
    } catch {}
  }
  async function pintarMias() {
    const pasadas = $("#miasPasadas").checked, hoy = hoyIso();
    const lista = await api.reservas({ desde: pasadas ? null : hoy, email: S.user.email });
    const gs = agrupar(lista).sort((a, b) => (pasadas ? b[0].fecha.localeCompare(a[0].fecha) : a[0].fecha.localeCompare(b[0].fecha)) || a[0].inicio.localeCompare(b[0].inicio));
    S.miasGrupos = gs;
    if (!gs.length) {
      $("#mias").innerHTML = `<div class="vacio">No tienes reservas${pasadas ? "" : " pendientes"}.<br><button class="btn primario" type="button" id="irReservar">Hacer una reserva</button></div>`;
      $("#irReservar").onclick = () => mostrar("reservar");
      return;
    }
    const porDia = new Map();
    gs.forEach((g, i) => porDia.set(g[0].fecha, [...(porDia.get(g[0].fecha) || []), i]));
    $("#mias").innerHTML = [...porDia].map(([fecha, is]) => `<div class="dia-grupo ${fecha < hoy ? "pasado" : ""}">
      <h3>${fecha === hoy ? "Hoy · " : fecha === masDiasIso(hoy, 1) ? "Mañana · " : ""}${fechaLarga(fecha)}</h3>
      ${is.map((i) => { const g = gs[i], r = g[0], e = espacio(r.espacio_id); return `<div class="reserva" style="--c:${esc(e?.color)}">
        <span class="esp-icono">${icono(e?.icono)}</span>
        <div class="r-txt"><b>${esc(describir(g.map((x) => x.espacio_id)))}</b> <span class="r-hora">${r.inicio}–${r.fin}</span>
          ${r.motivo ? `<small>${esc(r.motivo)}</small>` : ""}</div>
        ${fecha >= hoy ? `<button class="btn mini peligro" type="button" data-g="${i}">Anular</button>` : ""}
      </div>`; }).join("")}</div>`).join("");
  }

  // ─── Administración ───────────────────────────────────────────────────────
  function prepararAdmin() {
    // Listado
    const F = $("#lisFiltros");
    F.desde.value = hoyIso(); F.hasta.value = masDiasIso(hoyIso(), 30);
    F.addEventListener("input", () => { clearTimeout(S._lis); S._lis = setTimeout(() => pintarListado().catch(fallo), 250); });
    $("#btnCsv").onclick = descargarCsv;
    $("#listado").addEventListener("click", (e) => {
      const b = e.target.closest("[data-lg]"); if (!b) return;
      const g = S.listado[+b.dataset.lg];
      g.length > 1 ? anular(g) : detalles(g[0], g);
    });

    // Espacios y dispositivos
    $("#admEspacios").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const d = b.dataset, pack = d.packEditar && S.packs.find((p) => p.id == d.packEditar);
      if (d.editar) editarEspacio(espacio(+d.editar));
      else if (d.nuevoEspacio != null) editarEspacio();
      else if (d.dev) editarDispositivo(espacio(+d.dev));
      else if (d.grupoEditar) editarGrupo(d.grupoEditar);
      else if (d.grupoAnadir) anadirDispositivos(d.grupoAnadir);
      else if (pack) editarPack(pack.grupo, pack);
      else if (d.packNuevo) editarPack(d.packNuevo);
      else if (d.nuevoGrupo != null) nuevoGrupo();
    });

    // Horas habituales
    $("#btnNuevaFranja").onclick = () => editarFranja();
    $("#admFranjas").addEventListener("click", (e) => { const b = e.target.closest("[data-editar]"); if (b) editarFranja(S.franjas.find((f) => f.id == b.dataset.editar)); });

    // Bloqueos
    const B = $("#bloqForm");
    const verTipo = () => $$("[data-b]", B).forEach((el) => (el.hidden = el.dataset.b !== B.tipo.value));
    B.tipo.onchange = verTipo; verTipo();
    B.onsubmit = (e) => { e.preventDefault(); crearBloqueo(); };
    $("#admBloqueos").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-quitar]"); if (!b) return;
      try { await api.borrarBloqueo(+b.dataset.quitar); await recargarDatos(); pintarBloqueos(); toast("Bloqueo quitado"); } catch (err) { fallo(err); }
    });

    // Cuentas
    $("#admCuentaForm").onsubmit = async (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim().toLowerCase();
      if (!email.endsWith("@" + CFG.dominio)) return toast(`Debe ser una cuenta @${CFG.dominio}`);
      try { await api.addAdmin(email); e.target.reset(); toast("Cuenta añadida"); pintarCuentas(); } catch (err) { fallo(err); }
    };
    $("#admCuentas").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-quitar]"); if (!b) return;
      if (!(await confirmar("Quitar acceso", `${esc(b.dataset.quitar)} dejará de ver Administración.`, "Quitar", "aviso"))) return;
      try { await api.delAdmin(b.dataset.quitar); toast("Acceso quitado"); pintarCuentas(); } catch (err) { fallo(err); }
    });
  }

  async function pintarAdmin() {
    await recargarDatos();
    const sec = S.admSec;
    if (sec === "listado") { rellenarSelectRecursos($("#lisFiltros").espacio, "Todo"); await pintarListado(); }
    else if (sec === "espacios") pintarEspaciosAdmin();
    else if (sec === "horario") pintarFranjas();
    else if (sec === "bloqueos") pintarBloqueos();
    else if (sec === "cuentas") await pintarCuentas();
  }
  // Select con todo: espacios, grupos completos y cada dispositivo
  function rellenarSelectRecursos(sel, todos) {
    const v = sel.value, op = (val, txt) => `<option value="${val}">${esc(txt)}</option>`;
    sel.innerHTML = op("", todos) + categorias(true).filter((c) => c !== DISP).map((c) => `<optgroup label="${esc(c)}">${salas(true).filter((e) => catDe(e) === c).map((e) => op("e:" + e.id, e.nombre + (e.activo ? "" : " (desactivado)"))).join("")}</optgroup>`).join("") +
      grupos().map((g) => `<optgroup label="${esc(g)}">${op("g:" + g, "Todos los " + g)}${deGrupo(g, true).map((e) => op("e:" + e.id, e.nombre)).join("")}</optgroup>`).join("");
    sel.value = v;
  }
  const cumpleFiltro = (val, id) => !val || (val.startsWith("g:") ? espacio(id)?.grupo === val.slice(2) : String(id) === val.slice(2));

  // Listado con filtros
  async function pintarListado() {
    const F = $("#lisFiltros"), prof = F.prof.value.trim().toLowerCase();
    let lista = await api.reservas({ desde: F.desde.value || null, hasta: F.hasta.value || null });
    lista = lista.filter((r) => cumpleFiltro(F.espacio.value, r.espacio_id));
    if (prof) lista = lista.filter((r) => quien(r).toLowerCase().includes(prof) || r.profesor_email.includes(prof));
    const gs = agrupar(lista).sort((a, b) => a[0].fecha.localeCompare(b[0].fecha) || a[0].inicio.localeCompare(b[0].inicio));
    S.listado = gs;
    if (!gs.length) { $("#listado").innerHTML = `<p class="vacio">No hay reservas con estos filtros.</p>`; return; }
    const usos = [...salas(true).map((e) => [e.nombre, e.color, lista.filter((r) => r.espacio_id === e.id).length]),
      ...grupos().map((g) => [g, deGrupo(g, true)[0]?.color, lista.filter((r) => espacio(r.espacio_id)?.grupo === g).length])].filter(([, , n]) => n);
    $("#listado").innerHTML = `<div class="mini-kpis"><div><b>${lista.length}</b>reservas</div>${usos.map(([n, c, k]) => `<div><span class="punto" style="--c:${esc(c)}"></span><b>${k}</b>${esc(n)}</div>`).join("")}</div>
      <div class="tabla-scroll"><table><tr><th>Fecha</th><th>Horario</th><th>Qué</th><th>Profesor/a</th><th>Para qué</th><th></th></tr>
      ${gs.map((g, i) => { const r = g[0], e = espacio(r.espacio_id); return `<tr>
        <td>${fechaCorta(r.fecha)}</td><td>${r.inicio}–${r.fin}</td>
        <td><span class="punto" style="--c:${esc(e?.color)}"></span>${esc(describir(g.map((x) => x.espacio_id)))}</td>
        <td>${esc(quien(r))}</td><td>${esc(r.motivo || "")}</td>
        <td class="acciones-fila"><button class="btn mini" type="button" data-lg="${i}">${g.length > 1 ? "Anular" : "Ver"}</button></td></tr>`; }).join("")}</table></div>`;
  }
  function descargarCsv() {
    const filas = [["Fecha", "Día", "Inicio", "Fin", "Qué", "Nº", "Profesor/a", "Correo", "Para qué"]];
    (S.listado || []).forEach((g) => { const r = g[0];
      filas.push([fechaNum(r.fecha), DIAS[dowIso(r.fecha)], r.inicio, r.fin, describir(g.map((x) => x.espacio_id)), g.length, quien(r), r.profesor_email, r.motivo || ""]); });
    const csv = "﻿" + filas.map((f) => f.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `reservas-${$("#lisFiltros").desde.value || "inicio"}-a-${$("#lisFiltros").hasta.value || "fin"}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  // Espacios y dispositivos
  const textoDias = (dias) => (dias.join() === "1,2,3,4,5" ? "De lunes a viernes" : dias.map((d) => DIAS_C[d]).join(" "));
  function pintarEspaciosAdmin() {
    const orden = categorias(true);
    const sal = `<h3 class="sub">Espacios</h3><div class="tabla-scroll"><table><tr><th></th><th>Nombre</th><th>Categoría</th><th>Se reserva</th><th>Días</th><th></th></tr>
      ${[...salas(true)].sort((a, b) => orden.indexOf(catDe(a)) - orden.indexOf(catDe(b))).map((e) => `<tr class="${e.activo ? "" : "de-baja"}">
        <td><span class="esp-icono mini" style="--c:${esc(e.color)}">${icono(e.icono)}</span></td>
        <td><b>${esc(e.nombre)}</b>${e.activo ? "" : ' <span class="tag-archivado">desactivado</span>'}<br><small>${esc(e.descripcion || "")}</small></td>
        <td>${esc(catDe(e))}</td><td>${e.apertura}–${e.cierre}</td><td>${textoDias(e.dias)}</td>
        <td class="acciones-fila"><button class="btn mini" type="button" data-editar="${e.id}">Editar</button></td></tr>`).join("")}</table></div>
      <div class="acciones"><button class="btn" type="button" data-nuevo-espacio>+ Añadir espacio</button></div>`;
    const gs = grupos().map((g) => {
      const l = deGrupo(g, true), e0 = l[0], packs = S.packs.filter((p) => p.grupo === g);
      return `<div class="grupo grupo-adm" style="--c:${esc(e0.color)}">
        <div class="grupo-cab"><span class="esp-icono mini">${icono(e0.icono)}</span><b>${esc(g)}</b>
          <span class="grupo-n">${l.length} · ${l.filter((e) => e.activo).length} en uso · ${e0.apertura}–${e0.cierre} · ${textoDias(e0.dias)}</span>
          <span class="crece"></span><button class="btn mini" type="button" data-grupo-editar="${esc(g)}">Editar grupo</button>
          <button class="btn mini" type="button" data-grupo-anadir="${esc(g)}">+ Añadir</button></div>
        <p class="nota">Pulsa uno para cambiar su número o nombre, o para desactivarlo (por ejemplo, si está roto).</p>
        <div class="fichas">${l.map((e) => `<button type="button" class="dispo ${e.activo ? "" : "inactivo"}" data-dev="${e.id}" title="${esc(e.nombre)}">${esc(etiqueta(e))}</button>`).join("")}</div>
        <div class="packs"><span class="nota">Packs:</span>${packs.map((p) => `<button type="button" class="btn mini" data-pack-editar="${p.id}">${esc(p.nombre)} <small>(${p.espacios.length})</small></button>`).join("")}
          <button type="button" class="btn mini" data-pack-nuevo="${esc(g)}">+ Nuevo pack</button></div>
      </div>`;
    }).join("");
    $("#admEspacios").innerHTML = sal + `<h3 class="sub">Dispositivos</h3>${gs}<div class="acciones"><button class="btn" type="button" data-nuevo-grupo>+ Nuevo tipo de dispositivo</button></div>`;
  }
  // Campos comunes: color, icono, días y horario
  const camposComunes = (e) => `<div class="fila">
      <label class="campo">Color <input name="color" type="color" value="${esc(e.color)}"></label>
      <label class="campo">Icono <select name="icono">${Object.keys(ICONOS).map((k) => `<option value="${k}" ${k === e.icono ? "selected" : ""}>${NOMBRES_ICONO[k]}</option>`).join("")}</select></label>
      <label class="campo">Se reserva desde <input name="apertura" type="time" step="300" value="${e.apertura}" required></label>
      <label class="campo">hasta <input name="cierre" type="time" step="300" value="${e.cierre}" required></label>
    </div>
    <fieldset class="checks"><legend>Días que se puede reservar</legend>${[1, 2, 3, 4, 5, 6, 7].map((d) => `<label class="check"><input type="checkbox" name="dia" value="${d}" ${e.dias.includes(d) ? "checked" : ""}>${DIAS[d]}</label>`).join("")}</fieldset>`;
  const leerConDias = (f) => { const fd = new FormData(f); S.dlgDatos = { ...Object.fromEntries(fd), dia: fd.getAll("dia").map(Number) }; };
  const comunes = (D) => {
    if (!D.dia.length) throw new Error("Elige al menos un día");
    if (D.cierre <= D.apertura) throw new Error("La hora final debe ser posterior a la inicial");
    return { color: D.color, icono: D.icono, dias: D.dia, apertura: D.apertura, cierre: D.cierre };
  };
  const botonesDlg = (borrar) => `<div class="dlg-botones">${borrar ? '<button class="btn peligro izq" value="borrar" formnovalidate>Borrar</button>' : ""}<button class="btn" value="" formnovalidate>Cancelar</button><button class="btn primario" value="ok">Guardar</button></div>`;
  async function borrarConAviso(e) {
    if (!(await confirmar("Borrar " + esc(e.nombre), "Se borrarán también <b>todas sus reservas</b>, también las pasadas. Si solo quieres que no se pueda reservar, mejor desactívalo.", "Borrar para siempre", "aviso"))) return;
    try { await api.borrarEspacio(e.id); toast("Borrado"); await pintarAdmin(); } catch (err) { fallo(err); }
  }

  async function editarEspacio(e) {
    const nuevo = !e;
    e ||= { nombre: "", descripcion: "", categoria: "Zonas comunes", color: "#009abb", icono: "sala", dias: [1, 2, 3, 4, 5], apertura: "08:00", cierre: "14:30", activo: true };
    const cats = [...new Set(["Zonas comunes", "Aulas temáticas", ...salas(true).map((x) => x.categoria).filter(Boolean)])];
    const v = await dialogo(`<h2>${nuevo ? "Nuevo espacio" : "Editar " + esc(e.nombre)}</h2>
      <label class="campo">Nombre <input name="nombre" value="${esc(e.nombre)}" required autocomplete="off"></label>
      <label class="campo">Descripción <input name="descripcion" value="${esc(e.descripcion || "")}" placeholder="Para qué sirve, dónde está…" autocomplete="off"></label>
      <label class="campo">Categoría <input name="categoria" value="${esc(e.categoria || "")}" list="catLista" placeholder="Zonas comunes, Aulas temáticas…" autocomplete="off" required>
        <datalist id="catLista">${cats.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></label>
      ${camposComunes(e)}
      <label class="check"><input type="checkbox" name="activo" ${e.activo ? "checked" : ""}> Se puede reservar (si lo desactivas, deja de aparecer pero se conserva su historial)</label>
      ${botonesDlg(!nuevo)}`, (f) => (f.onsubmit = () => leerConDias(f)));
    if (v === "borrar") return borrarConAviso(e);
    if (v !== "ok") return;
    const D = S.dlgDatos;
    try {
      const datos = { nombre: D.nombre.trim(), descripcion: D.descripcion.trim() || null, categoria: D.categoria.trim() || null, tipo: "espacio", activo: !!D.activo, ...comunes(D) };
      await api.guardarEspacio(nuevo ? datos : { id: e.id, ...datos }); toast("Guardado ✓"); await pintarAdmin();
    } catch (err) { fallo(err); }
  }

  async function editarDispositivo(e) {
    const v = await dialogo(`<h2>${esc(e.nombre)}</h2>
      <div class="fila"><label class="campo">Número <input name="numero" type="number" min="0" value="${e.numero ?? ""}"></label>
        <label class="campo crece">Nombre <input name="nombre" value="${esc(e.nombre)}" required autocomplete="off"></label></div>
      <label class="campo">Nota (opcional) <input name="descripcion" value="${esc(e.descripcion || "")}" placeholder="Nº de serie, funda, observaciones…" autocomplete="off"></label>
      <label class="check"><input type="checkbox" name="activo" ${e.activo ? "checked" : ""}> En uso (desactívalo si está roto o en reparación)</label>
      ${botonesDlg(true)}`);
    if (v === "borrar") return borrarConAviso(e);
    if (v !== "ok") return;
    const D = S.dlgDatos;
    try { await api.guardarEspacio({ id: e.id, nombre: D.nombre.trim(), numero: D.numero === "" ? null : +D.numero, descripcion: D.descripcion.trim() || null, activo: !!D.activo }); toast("Guardado ✓"); await pintarAdmin(); } catch (err) { fallo(err); }
  }

  async function editarGrupo(g) {
    const e0 = deGrupo(g, true)[0];
    const v = await dialogo(`<h2>Editar ${esc(g)}</h2><p class="dlg-sub">Se aplica a todos los ${esc(g)}.</p>
      <label class="campo">Nombre del grupo <input name="grupo" value="${esc(g)}" required autocomplete="off"></label>
      ${camposComunes(e0)}${botonesDlg(false)}`, (f) => (f.onsubmit = () => leerConDias(f)));
    if (v !== "ok") return;
    const D = S.dlgDatos;
    try { await api.actualizarGrupo(g, { grupo: D.grupo.trim(), ...comunes(D) }); S.abiertos.delete(g); toast("Guardado ✓"); await pintarAdmin(); } catch (err) { fallo(err); }
  }

  const prefijoDe = (g) => { const e = deGrupo(g, true)[0]; return e ? e.nombre.replace(/\s*\d+\s*$/, "") : g; };
  async function anadirDispositivos(g) {
    const l = deGrupo(g, true), desde = Math.max(0, ...l.map((e) => e.numero || 0)) + 1;
    const v = await dialogo(`<h2>Añadir ${esc(g)}</h2>
      <div class="fila"><label class="campo">¿Cuántos? <input name="n" type="number" min="1" max="100" value="1" required></label>
        <label class="campo crece">Se llamarán <input name="pref" value="${esc(prefijoDe(g))}" required></label></div>
      <p class="nota">Se numeran a partir del ${desde}.</p>${botonesDlg(false)}`);
    if (v !== "ok") return;
    const D = S.dlgDatos, e0 = l[0];
    const filas = Array.from({ length: +D.n }, (_, k) => ({ nombre: `${D.pref.trim()} ${desde + k}`, tipo: "dispositivo", grupo: g, numero: desde + k, color: e0.color, icono: e0.icono, dias: e0.dias, apertura: e0.apertura, cierre: e0.cierre, activo: true, orden: Math.max(...l.map((e) => e.orden || 0)) + k + 1 }));
    try { await api.crearEspacios(filas); toast(`${filas.length} añadidos ✓`); await pintarAdmin(); } catch (err) { fallo(err); }
  }

  async function nuevoGrupo() {
    const base = { color: "#475569", icono: "tableta", dias: [1, 2, 3, 4, 5], apertura: "08:00", cierre: "14:30" };
    const v = await dialogo(`<h2>Nuevo tipo de dispositivo</h2>
      <div class="fila"><label class="campo crece">Nombre del grupo <input name="grupo" placeholder="Cámaras" required autocomplete="off"></label>
        <label class="campo crece">Cada uno se llama <input name="pref" placeholder="Cámara" required autocomplete="off"></label>
        <label class="campo">¿Cuántos? <input name="n" type="number" min="1" max="100" value="5" required></label></div>
      ${camposComunes(base)}${botonesDlg(false)}`, (f) => (f.onsubmit = () => leerConDias(f)));
    if (v !== "ok") return;
    const D = S.dlgDatos, orden = Math.max(0, ...S.espacios.map((e) => e.orden || 0)) + 100;
    try {
      if (grupos().includes(D.grupo.trim())) throw new Error("Ya existe ese grupo");
      const c = comunes(D);
      await api.crearEspacios(Array.from({ length: +D.n }, (_, k) => ({ nombre: `${D.pref.trim()} ${k + 1}`, tipo: "dispositivo", grupo: D.grupo.trim(), numero: k + 1, activo: true, orden: orden + k, ...c })));
      toast("Creado ✓"); await pintarAdmin();
    } catch (err) { fallo(err); }
  }

  async function editarPack(g, p) {
    const nuevo = !p, l = deGrupo(g, true);
    p ||= { grupo: g, nombre: "", espacios: [] };
    const v = await dialogo(`<h2>${nuevo ? "Nuevo pack de " + esc(g) : "Editar pack"}</h2>
      <label class="campo">Nombre <input name="nombre" value="${esc(p.nombre)}" placeholder="${esc(g)} 1-5" required autocomplete="off"></label>
      <div class="fila alta"><label class="campo">Del n.º <input name="a" type="number" min="0"></label><label class="campo">al <input name="b" type="number" min="0"></label>
        <button class="btn" type="button" id="packRango">Marcar</button></div>
      <fieldset class="checks"><legend>Qué incluye</legend>${l.map((e) => `<label class="check"><input type="checkbox" name="esp" value="${e.id}" ${p.espacios.includes(e.id) ? "checked" : ""}>${esc(etiqueta(e))}</label>`).join("")}</fieldset>
      ${botonesDlg(!nuevo)}`, (f) => {
      $("#packRango", f).onclick = () => { const a = +f.a.value, b = +f.b.value || a; l.forEach((e, i) => { if (e.numero >= a && e.numero <= b) $$("[name=esp]", f)[i].checked = true; }); };
      f.onsubmit = () => (S.dlgDatos = { nombre: f.nombre.value, esp: new FormData(f).getAll("esp").map(Number) });
    });
    if (v === "borrar") { try { await api.borrarPack(p.id); toast("Pack borrado"); await pintarAdmin(); } catch (err) { fallo(err); } return; }
    if (v !== "ok") return;
    if (!S.dlgDatos.esp.length) return toast("Marca al menos uno");
    try { await api.guardarPack({ ...(p.id ? { id: p.id } : {}), grupo: g, nombre: S.dlgDatos.nombre.trim(), espacios: S.dlgDatos.esp, orden: p.orden ?? S.packs.length + 1 }); toast("Guardado ✓"); await pintarAdmin(); } catch (err) { fallo(err); }
  }

  // Horas habituales
  function pintarFranjas() {
    $("#admFranjas").innerHTML = `<div class="tabla-scroll"><table><tr><th>Etapa</th><th>Nombre</th><th>Empieza</th><th>Acaba</th><th>Estado</th><th></th></tr>
      ${S.franjas.map((f) => `<tr class="${f.activo ? "" : "de-baja"}"><td>${esc(f.etapa || "")}</td><td><b>${esc(f.nombre)}</b></td><td>${f.inicio}</td><td>${f.fin}</td>
        <td>${f.activo ? "Se muestra" : '<span class="tag-archivado">oculta</span>'}</td>
        <td class="acciones-fila"><button class="btn mini" type="button" data-editar="${f.id}">Editar</button></td></tr>`).join("")}</table></div>`;
  }
  async function editarFranja(f) {
    const nuevo = !f;
    f ||= { etapa: S.franjas[0]?.etapa || "", nombre: "", inicio: "", fin: "", activo: true };
    const v = await dialogo(`<h2>${nuevo ? "Nueva hora habitual" : "Editar " + esc(f.nombre)}</h2>
      <label class="campo">Etapa <input name="etapa" value="${esc(f.etapa || "")}" list="etapasLista" placeholder="ESO · Bachillerato · CCFF" autocomplete="off">
        <datalist id="etapasLista">${[...new Set(S.franjas.map((x) => x.etapa).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>
      <div class="fila"><label class="campo crece">Nombre <input name="nombre" value="${esc(f.nombre)}" placeholder="7ª hora, Tarde…" required autocomplete="off"></label>
        <label class="campo">Empieza <input name="inicio" type="time" step="300" value="${f.inicio}" required></label>
        <label class="campo">Acaba <input name="fin" type="time" step="300" value="${f.fin}" required></label></div>
      <label class="check"><input type="checkbox" name="activo" ${f.activo ? "checked" : ""}> Se muestra como atajo al reservar</label>
      ${botonesDlg(!nuevo)}`);
    if (v === "borrar") { try { await api.borrarFranja(f.id); toast("Borrada"); await pintarAdmin(); } catch (err) { fallo(err); } return; }
    if (v !== "ok") return;
    const D = S.dlgDatos;
    if (D.fin <= D.inicio) return toast("La hora de fin debe ser posterior a la de inicio");
    const datos = { etapa: D.etapa.trim() || null, nombre: D.nombre.trim(), inicio: D.inicio, fin: D.fin, activo: !!D.activo };
    try { await api.guardarFranja(nuevo ? { ...datos, orden: S.franjas.length + 1 } : { id: f.id, ...datos }); toast("Guardado ✓"); await pintarAdmin(); } catch (err) { fallo(err); }
  }

  // Bloqueos
  function pintarBloqueos() {
    const B = $("#bloqForm");
    rellenarSelectRecursos(B.espacio, "Todo (espacios y dispositivos)");
    const hoy = hoyIso();
    const vigente = (b) => (b.fecha ? b.fecha >= hoy : !b.hasta || b.hasta >= hoy);
    const lista = [...S.bloqueos].sort((a, b) => vigente(b) - vigente(a) || (a.fecha || a.desde || "").localeCompare(b.fecha || b.desde || "") || (a.dia_semana || 0) - (b.dia_semana || 0));
    if (!lista.length) { $("#admBloqueos").innerHTML = `<p class="vacio">No hay bloqueos.</p>`; return; }
    $("#admBloqueos").innerHTML = `<div class="tabla-scroll"><table><tr><th>Qué</th><th>Cuándo</th><th>Horas</th><th>Motivo</th><th></th></tr>
      ${lista.map((b) => `<tr class="${vigente(b) ? "" : "de-baja"}"><td>${b.espacio_id ? esc(espacio(b.espacio_id)?.nombre) : b.grupo ? "Todos los " + esc(b.grupo) : "<b>Todo</b>"}</td>
        <td>${b.fecha ? fechaCorta(b.fecha) + " " + deIso(b.fecha).getFullYear() : `Cada ${DIAS[b.dia_semana].toLowerCase()}${b.desde ? ` desde el ${fechaNum(b.desde)}` : ""}${b.hasta ? ` hasta el ${fechaNum(b.hasta)}` : ""}`}</td>
        <td>${b.inicio ? `${b.inicio}–${b.fin}` : "Todo el día"}</td><td>${esc(b.motivo)}</td>
        <td class="acciones-fila"><button class="btn mini peligro" type="button" data-quitar="${b.id}">Quitar</button></td></tr>`).join("")}</table></div>`;
  }
  async function crearBloqueo() {
    const B = $("#bloqForm"), v = B.espacio.value;
    if (!!B.inicio.value !== !!B.fin.value) return toast("Pon las dos horas, o ninguna para todo el día");
    if (B.inicio.value && B.fin.value <= B.inicio.value) return toast("La hora final debe ser posterior a la inicial");
    const base = { espacio_id: v.startsWith("e:") ? +v.slice(2) : null, grupo: v.startsWith("g:") ? v.slice(2) : null,
      inicio: B.inicio.value || null, fin: B.fin.value || null, motivo: B.motivo.value.trim() };
    let filas;
    if (B.tipo.value === "fecha") {
      if (!B.fecha.value) return toast("Elige el día");
      const fin = B.fechaFin.value || B.fecha.value;
      if (fin < B.fecha.value) return toast("La fecha final es anterior a la primera");
      filas = [];
      for (let d = B.fecha.value; d <= fin; d = masDiasIso(d, 1)) filas.push({ ...base, fecha: d });
      if (filas.length > 120) return toast("Como mucho 120 días seguidos");
    } else {
      if (B.desde.value && B.hasta.value && B.hasta.value < B.desde.value) return toast("«Hasta» es anterior a «Desde»");
      filas = [{ ...base, dia_semana: +B.dia.value, desde: B.desde.value || null, hasta: B.hasta.value || null }];
    }
    try {
      await api.crearBloqueos(filas);
      ["motivo", "fecha", "fechaFin", "inicio", "fin"].forEach((k) => (B[k].value = ""));
      await recargarDatos(); pintarBloqueos(); toast(filas.length > 1 ? `${filas.length} días bloqueados` : "Bloqueo añadido");
    } catch (err) { fallo(err); }
  }

  // Cuentas
  async function pintarCuentas() {
    const l = await api.admins();
    $("#admCuentas").innerHTML = `<table>${l.map((a) => `<tr><td>${esc(a.email)}${a.email === S.user.email ? " <small>(tú)</small>" : ""}</td>
      <td class="acciones-fila">${a.email === S.user.email ? "" : `<button class="btn mini peligro" type="button" data-quitar="${esc(a.email)}">Quitar</button>`}</td></tr>`).join("")}</table>`;
  }

  // ─── Modo prueba: reservas de ejemplo ─────────────────────────────────────
  async function generarEjemplo() {
    const d = demoApi._db();
    const profes = ["laura.ramos", "miguel.arcos", "rocio.cano", "ana.gallardo", "jose.martin", "carmen.ruiz"];
    const motivos = ["1º ESO A · Lengua", "2º ESO B · práctica", "3º ESO C · proyecto", "4º ESO A · examen", "1º Bach · exposición", "Reunión de departamento", "Charla de orientación"];
    const azar = (l) => l[Math.floor(Math.random() * l.length)];
    const libre = (id, fecha, o) => !d.reservas.some((r) => r.espacio_id === id && r.fecha === fecha && solapan(r, o));
    const poner = (id, fecha, o, p, lote, motivo) => d.reservas.push({ id: ++d.seq, espacio_id: id, fecha, ...o, motivo, lote, profesor_email: p + "@" + CFG.dominio, profesor_nombre: nombreDeEmail(p), creado_por: p + "@" + CFG.dominio, creado: new Date().toISOString() });
    let dia = hoyIso();
    while (dowIso(dia) > 5) dia = masDiasIso(dia, 1);
    for (let k = 0; k < 8; k++, dia = masDiasIso(dia, dowIso(dia) === 5 ? 3 : 1)) {
      d.espacios.filter((e) => e.tipo === "espacio").forEach((e) => ((et) => d.franjas.filter((f) => f.etapa === et))(Math.random() < 0.7 ? ESO : PRI).forEach((f) => {
        if (Math.random() < 0.22 && libre(e.id, dia, f)) poner(e.id, dia, { inicio: f.inicio, fin: f.fin }, azar(profes), null, azar(motivos));
      }));
      // Algunos packs de dispositivos, con horarios que no coinciden con las horas habituales
      for (let n = 0; n < 3; n++) {
        const p = azar(d.packs), ini = azar(["08:30", "09:00", "10:15", "11:30", "12:00", "13:00"]), o = { inicio: ini, fin: deMin(toMin(ini) + azar([45, 60, 90])) };
        if (p.espacios.every((id) => libre(id, dia, o))) { const lote = uuid(), pr = azar(profes), m = azar(motivos); p.espacios.forEach((id) => poner(id, dia, o, pr, lote, m)); }
      }
    }
    if (!d.bloqueos.length) d.bloqueos.push({ id: ++d.seq, espacio_id: 4, grupo: null, dia_semana: 1, desde: null, hasta: null, fecha: null, inicio: "09:00", fin: "10:00", motivo: "Clase fija · 1º ESO A" });
    demoApi._set(d);
    await recargarDatos(); toast("Reservas de ejemplo creadas"); refrescar(); contarMias();
  }

  // ─── Instalar como app ────────────────────────────────────────────────────
  let instalar = null;
  const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const enApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  // El botón de la franja se ve siempre (salvo dentro de la app ya instalada); si el navegador no ofrece instalarla, explica cómo.
  function pintarInstalar() { $$(".instalar").forEach((el) => (el.hidden = el.matches(".franja .instalar") ? enApp() : !instalar)); }
  async function instalarApp() {
    if (instalar === "ios") {
      dialogo(`<h2>Instalar la app</h2>
        <ol class="pasos"><li>Pulsa el botón <b>Compartir</b> de Safari (el cuadrado con una flecha hacia arriba).</li>
        <li>Elige <b>«Añadir a pantalla de inicio»</b>.</li><li>Pulsa <b>Añadir</b>. Aparecerá el icono del colegio en tu pantalla.</li></ol>
        <div class="dlg-botones"><button class="btn primario" value="">Entendido</button></div>`);
      return;
    }
    if (instalar) { instalar.prompt(); await instalar.userChoice.catch(() => {}); instalar = null; pintarInstalar(); return; }
    dialogo(`<h2>Instalar la app</h2>
      <p>Abre el menú del navegador (⋮ o ⋯) y elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.</p>
      <div class="dlg-botones"><button class="btn primario" value="">Entendido</button></div>`);
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); instalar = e; pintarInstalar(); });
  window.addEventListener("appinstalled", () => { instalar = null; pintarInstalar(); toast("¡App instalada!"); });
  if (esIOS() && !enApp()) instalar = "ios";
  document.addEventListener("click", (e) => { if (e.target.closest(".instalar")) { e.preventDefault(); instalarApp(); } });
  pintarInstalar();

  iniciar();
})();
