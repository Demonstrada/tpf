import React, { useState, useEffect, useCallback } from "react";

// ─── HELPERS DE ESTILO ────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  borderRadius: "8px", border: "1px solid var(--border-color)",
  background: "var(--bg-main)", color: "var(--text-main)",
  fontSize: "0.88rem", outline: "none", transition: "border-color 0.2s",
  fontFamily: "inherit",
};

const Field = ({ label, hint, children }) => (
  <div>
    <label style={{
      display: "block", fontSize: "0.72rem", fontWeight: 700,
      color: "var(--text-muted)", letterSpacing: "0.5px",
      textTransform: "uppercase", marginBottom: "6px"
    }}>
      {label}
      {hint && <span style={{ fontWeight: 400, textTransform: "none", marginLeft: "6px", opacity: 0.7 }}>{hint}</span>}
    </label>
    {children}
  </div>
);

const Switch = ({ label, desc, checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px",
      background: checked ? "rgba(0,0,0,0.04)" : "var(--bg-soft)",
      border: `1px solid ${checked ? "var(--primary)" : "var(--border-color)"}`,
      borderRadius: "8px", cursor: "pointer", transition: "all 0.2s"
    }}
  >
    <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: checked ? "var(--primary)" : "var(--border-color)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ position: "absolute", top: "3px", left: checked ? "18px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
    <div>
      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: checked ? "var(--primary)" : "var(--text-muted)" }}>{label}</span>
      {desc && <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>{desc}</span>}
    </div>
  </div>
);

// ─── MODAL GENÉRICO ───────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, onSubmit, submitLabel = "Guardar", maxWidth = "540px", children }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "var(--premium-backdrop, rgba(0,0,0,0.5))", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 9001, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", pointerEvents: "none" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", pointerEvents: "auto", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 700 }}>×</button>
          <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ margin: "0 0 3px", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {children}
          </div>
          {onSubmit && (
            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button onClick={onSubmit} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", border: "none", borderRadius: "9px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >{submitLabel}</button>
              <button onClick={onClose} style={{ padding: "11px 20px", background: "var(--bg-soft)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "9px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>Cancelar</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminEventosView({ baseURL, usuarioData }) {
  const [eventos, setEventos]         = useState([]);
  const [usuarios, setUsuarios]       = useState([]);
  const [juegos, setJuegos]           = useState([]);

  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [enfrentamientos, setEnfrentamientos]       = useState([]);

  const [showModalEvento,        setShowModalEvento]        = useState(false);
  const [showModalMatchups,      setShowModalMatchups]      = useState(false);
  const [showModalCrearMatchup,  setShowModalCrearMatchup]  = useState(false);
  const [showModalImagen,        setShowModalImagen]        = useState(false);

  const [formEvento, setFormEvento] = useState({
    ID: null, Nombre: "", Activo: true,
    Tiene_Combates: false, Rondas_Mejor_De: 3,
    Juego: "", Es_Rivales: false, 
    Bonus_Puntos_Global: 0, Puntos_Victoria_Enfrentamiento: 0 // <-- NUEVOS CAMPOS AÑADIDOS
  });

  const [formMatchup, setFormMatchup] = useState({ ID_Jugador1: "", ID_Jugador2: "", Fase: "Jornada 1" });

  const [imagenesEvento, setImagenesEvento] = useState([]);
  const [nuevoArchivo,   setNuevoArchivo]   = useState(null);
  const [eventoParaImagen, setEventoParaImagen] = useState(null);

  // ── CARGA ──────────────────────────────────────────────────────────────────
  const cargarEventos = useCallback(() => {
    fetch(`${baseURL}/eventos`).then(r => r.json()).then(setEventos).catch(console.error);
  }, [baseURL]);

  const cargarUsuarios = useCallback(() => {
    fetch(`${baseURL}/usuarios/lista-simple`).then(r => r.json()).then(setUsuarios).catch(console.error);
  }, [baseURL]);

  const cargarJuegos = useCallback(() => {
    fetch(`${baseURL}/juegos`).then(r => r.json()).then(setJuegos).catch(console.error);
  }, [baseURL]);

  useEffect(() => { cargarEventos(); cargarUsuarios(); cargarJuegos(); }, [cargarEventos, cargarUsuarios, cargarJuegos]);

  // ── JUEGO SELECCIONADO (para saber si Es_Pokemon) ─────────────────────────
  const juegoActual = juegos.find(j => String(j.ID) === String(formEvento.Juego));
  const juegoEsPokemon = juegoActual?.Es_Pokemon === 1;

  // Al cambiar juego, limpiar Es_Rivales si el nuevo juego no es Pokémon
  const handleJuegoChange = (val) => {
    const j = juegos.find(x => String(x.ID) === val);
    setFormEvento(prev => ({
      ...prev,
      Juego: val,
      Es_Rivales: j?.Es_Pokemon === 1 ? prev.Es_Rivales : false,
    }));
  };

  // ── EVENTO: ABRIR / GUARDAR ────────────────────────────────────────────────
  const abrirModalCrear = () => {
    setFormEvento({ ID: null, Nombre: "", Activo: true, Tiene_Combates: false, Rondas_Mejor_De: 3, Juego: "", Es_Rivales: false, Bonus_Puntos_Global: 0, Puntos_Victoria_Enfrentamiento: 0 });
    setShowModalEvento(true);
  };

  const abrirModalEditar = (ev) => {
    setFormEvento({
      ID: ev.ID, Nombre: ev.Nombre,
      Activo: ev.Activo === 1, Tiene_Combates: ev.Tiene_Combates === 1,
      Rondas_Mejor_De: ev.Rondas_Mejor_De || 3,
      Juego: ev.Juego ? String(ev.Juego) : "",
      Es_Rivales: ev.Es_Rivales === 1,
      Bonus_Puntos_Global: ev.Bonus_Puntos_Global || 0,
      Puntos_Victoria_Enfrentamiento: ev.Puntos_Victoria_Enfrentamiento || 0
    });
    setShowModalEvento(true);
  };

  const guardarEvento = () => {
    if (!formEvento.Nombre.trim()) return alert("El nombre del evento es obligatorio.");
    const method = formEvento.ID ? "PUT" : "POST";
    const url    = formEvento.ID ? `${baseURL}/eventos/${formEvento.ID}` : `${baseURL}/eventos`;
    fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Nombre:          formEvento.Nombre,
        Activo:          formEvento.Activo ? 1 : 0,
        Tiene_Combates:  formEvento.Tiene_Combates ? 1 : 0,
        Rondas_Mejor_De: formEvento.Rondas_Mejor_De,
        Juego:           formEvento.Juego || null,
        Es_Rivales:      formEvento.Es_Rivales ? 1 : 0,
        Bonus_Puntos_Global: formEvento.Bonus_Puntos_Global,
        Puntos_Victoria_Enfrentamiento: formEvento.Puntos_Victoria_Enfrentamiento
      }),
    }).then(() => { cargarEventos(); setShowModalEvento(false); });
  };

  // ── ENFRENTAMIENTOS ────────────────────────────────────────────────────────
  const abrirListaEnfrentamientos = (ev) => {
    setEventoSeleccionado(ev);
    fetch(`${baseURL}/enfrentamientos/${ev.ID}`)
      .then(r => r.json())
      .then(data => { setEnfrentamientos(data); setShowModalMatchups(true); });
  };

  const abrirCrearEnfrentamiento = () => {
    setFormMatchup({ ID_Jugador1: "", ID_Jugador2: "", Fase: "Jornada 1" });
    setShowModalCrearMatchup(true);
  };

  // Auto-completar rival cuando el evento es de tipo "Rivales"
  const handleJugador1Change = (val) => {
    if (eventoSeleccionado?.Es_Rivales === 1) {
      // Buscar el rival asignado al jugador seleccionado
      const jugador = usuarios.find(u => String(u.ID) === val);
      const rivalId = jugador?.Rival ? String(jugador.Rival) : "";
      setFormMatchup(prev => ({ ...prev, ID_Jugador1: val, ID_Jugador2: rivalId }));
    } else {
      setFormMatchup(prev => ({ ...prev, ID_Jugador1: val }));
    }
  };

  const guardarMatchup = () => {
    if (!formMatchup.ID_Jugador1 || !formMatchup.ID_Jugador2) return alert("Debes seleccionar dos jugadores.");
    if (formMatchup.ID_Jugador1 === formMatchup.ID_Jugador2) return alert("Un jugador no puede enfrentarse a sí mismo.");
    fetch(`${baseURL}/enfrentamientos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formMatchup, ID_Evento: eventoSeleccionado.ID }),
    }).then(() => { abrirListaEnfrentamientos(eventoSeleccionado); setShowModalCrearMatchup(false); });
  };

  // ── IMÁGENES ───────────────────────────────────────────────────────────────
  const abrirModalImagen = (evento) => {
    setEventoParaImagen(evento);
    fetch(`${baseURL}/imagenes/Eventos/${evento.ID}`).then(r => r.json()).then(data => { setImagenesEvento(data); setShowModalImagen(true); });
  };

  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files[0]; if (!archivo) return;
    const reader = new FileReader();
    reader.onloadend = () => setNuevoArchivo({ file: archivo, base64: reader.result.split(",")[1] });
    reader.readAsDataURL(archivo);
  };

  const subirNuevaImagen = () => {
    if (!nuevoArchivo) return;
    fetch(`${baseURL}/imagenes/nueva`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabla: "Eventos", registroId: eventoParaImagen.ID, imagenBase64: nuevoArchivo.base64 }),
    }).then(r => r.json()).then(data => { setImagenesEvento(prev => [...prev, { ID: data.ID, Imagen: data.Imagen }]); setNuevoArchivo(null); });
  };

  const asignarImagenPrincipal = (imagenId) => {
    fetch(`${baseURL}/imagenes/principal`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabla: "Eventos", registroId: eventoParaImagen.ID, imagenId }),
    }).then(() => { cargarEventos(); setShowModalImagen(false); });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* CABECERA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>Eventos</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>{eventos.length} evento{eventos.length !== 1 ? "s" : ""} registrado{eventos.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirModalCrear} style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        ><span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Crear evento</button>
      </div>

      {/* GRID DE EVENTOS */}
      {eventos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "14px", border: "1px dashed var(--border-color)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>No hay eventos creados</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {eventos.map(ev => (
            <div key={ev.ID} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>

              {/* IMAGEN / PLACEHOLDER */}
              <div style={{ aspectRatio: "16/7", background: "var(--bg-soft)", position: "relative", overflow: "hidden" }}>
                {ev.Imagen_Base64
                  ? <img src={`data:image/png;base64,${ev.Imagen_Base64}`} alt={ev.Nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--border-color)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1px" }}>SIN IMAGEN</div>
                }
                {/* BADGES */}
                <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", background: ev.Activo ? "var(--success)" : "var(--border-color)", color: ev.Activo ? "#fff" : "var(--text-muted)", letterSpacing: "0.5px" }}>
                    {ev.Activo ? "ACTIVO" : "INACTIVO"}
                  </span>
                  {ev.Es_Rivales === 1 && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", background: "var(--primary)", color: "#fff", letterSpacing: "0.5px" }}>
                      RIVALES
                    </span>
                  )}
                  {ev.Tiene_Combates === 1 && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", background: "rgba(0,0,0,0.55)", color: "#fff", letterSpacing: "0.5px" }}>
                      BO{ev.Rondas_Mejor_De}
                    </span>
                  )}
                </div>
              </div>

              {/* INFO */}
              <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>{ev.Nombre}</h3>
                {ev.Juego_Nombre && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{ev.Juego_Nombre}</span>
                )}
              </div>

              {/* ACCIONES */}
              <div style={{ display: "flex", gap: "6px", padding: "0 16px 14px", flexWrap: "wrap" }}>
                {[
                  { label: "Editar",   onClick: () => abrirModalEditar(ev), primary: false },
                  { label: "Imagen",   onClick: () => abrirModalImagen(ev), primary: false },
                  ...(ev.Tiene_Combates === 1 ? [{ label: "Enfrentamientos", onClick: () => abrirListaEnfrentamientos(ev), primary: true }] : []),
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick} style={{
                    flex: btn.primary ? "1 1 100%" : 1, padding: "7px 0",
                    background: btn.primary ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg-soft)",
                    color: btn.primary ? "#fff" : "var(--text-main)",
                    border: `1px solid ${btn.primary ? "transparent" : "var(--border-color)"}`,
                    borderRadius: "7px", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer"
                  }}>{btn.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL EVENTO ──────────────────────────────────────────────────── */}
      {showModalEvento && (
        <Modal
          title={formEvento.ID ? "Editar evento" : "Nuevo evento"}
          subtitle="Configura las propiedades del evento"
          onClose={() => setShowModalEvento(false)}
          onSubmit={guardarEvento}
          submitLabel="Guardar evento"
        >
          <Field label="Nombre del evento">
            <input type="text" value={formEvento.Nombre} onChange={e => setFormEvento({ ...formEvento, Nombre: e.target.value })} placeholder="Ej: Torneo VGC Invierno" style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
          </Field>

          <Field label="Juego asociado" hint="(opcional)">
            <select value={formEvento.Juego} onChange={e => handleJuegoChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Sin juego</option>
              {juegos.map(j => <option key={j.ID} value={j.ID}>{j.Nombre}{j.Es_Pokemon ? " (Pokémon)" : ""}</option>)}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Switch label="Evento activo" desc="Visible para participantes" checked={formEvento.Activo} onChange={() => setFormEvento(p => ({ ...p, Activo: !p.Activo }))} />
            <Switch label="Gestión de combates" desc="Permite reportar partidas" checked={formEvento.Tiene_Combates} onChange={() => setFormEvento(p => ({ ...p, Tiene_Combates: !p.Tiene_Combates }))} />
          </div>

          {formEvento.Tiene_Combates && (
            <Field label="Rondas al mejor de...">
              <input type="number" min="1" max="9" value={formEvento.Rondas_Mejor_De} onChange={e => setFormEvento({ ...formEvento, Rondas_Mejor_De: e.target.value })} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
            </Field>
          )}

          {/* Solo visible si el juego es Pokémon */}
          {juegoEsPokemon && (
            <Switch
              label="Evento de Rivales"
              desc="Al crear enfrentamientos, el contrincante se asigna automáticamente según el rival de cada jugador"
              checked={formEvento.Es_Rivales}
              onChange={() => setFormEvento(p => ({ ...p, Es_Rivales: !p.Es_Rivales }))}
            />
          )}

          {/* 🌟 NUEVOS CAMPOS DE PUNTOS 🌟 */}
          <div style={{ marginTop: "10px", padding: "14px", background: "var(--bg-soft)", border: "1px dashed var(--primary)", borderRadius: "8px" }}>
            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>⭐</span>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--primary)", textTransform: "uppercase" }}>Recompensas del Evento</span>
            </div>
            
            <Field label="Bonus Multiplicador Global" hint="Puntos extra que ganan todos los jugadores en la plataforma mientras este evento esté activo.">
                <input type="number" min="0" value={formEvento.Bonus_Puntos_Global} onChange={e => setFormEvento({ ...formEvento, Bonus_Puntos_Global: Number(e.target.value) })} style={inputStyle} />
            </Field>

            {formEvento.Tiene_Combates && (
                <div style={{ marginTop: "12px" }}>
                    <Field label="Puntos por ganar Enfrentamiento" hint="Puntos que se lleva el ganador del BO3 o BO5.">
                        <input type="number" min="0" value={formEvento.Puntos_Victoria_Enfrentamiento} onChange={e => setFormEvento({ ...formEvento, Puntos_Victoria_Enfrentamiento: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── MODAL LISTA ENFRENTAMIENTOS ───────────────────────────────────── */}
      {showModalMatchups && (
        <Modal
          title="Enfrentamientos"
          subtitle={`${eventoSeleccionado?.Nombre} · BO${eventoSeleccionado?.Rondas_Mejor_De}${eventoSeleccionado?.Es_Rivales ? " · Rivales" : ""}`}
          onClose={() => setShowModalMatchups(false)}
          onSubmit={null}
          maxWidth="720px"
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={abrirCrearEnfrentamiento} style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontWeight: 800, fontSize: "0.82rem", cursor: "pointer" }}>
              + Añadir enfrentamiento
            </button>
          </div>

          {enfrentamientos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", border: "1px dashed var(--border-color)", borderRadius: "10px" }}>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>No hay enfrentamientos registrados</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* CABECERA */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px 1fr", gap: "8px", padding: "6px 12px", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                <div>Jugador 1</div><div>Fase</div><div /><div>Jugador 2</div>
              </div>
              {enfrentamientos.map(enf => (
                <div key={enf.ID} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px 1fr", gap: "8px", alignItems: "center", padding: "10px 12px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{enf.Jugador1_Nombre}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{enf.Fase}</span>
                  <span style={{ textAlign: "center", fontWeight: 900, fontSize: "0.7rem", color: "var(--danger)" }}>VS</span>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--danger)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{enf.Jugador2_Nombre}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
            <button onClick={() => setShowModalMatchups(false)} style={{ padding: "10px 24px", background: "var(--bg-soft)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "9px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>Cerrar</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL CREAR ENFRENTAMIENTO ────────────────────────────────────── */}
      {showModalCrearMatchup && (
        <Modal
          title="Nuevo enfrentamiento"
          subtitle={eventoSeleccionado?.Es_Rivales === 1 ? "Modo Rivales — el contrincante se asigna automáticamente" : "Selecciona los dos jugadores"}
          onClose={() => setShowModalCrearMatchup(false)}
          onSubmit={guardarMatchup}
          submitLabel="Registrar"
          maxWidth="480px"
        >
          <Field label="Fase">
            <input type="text" value={formMatchup.Fase} onChange={e => setFormMatchup({ ...formMatchup, Fase: e.target.value })} placeholder="Ej: Jornada 1 / Octavos" style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
          </Field>

          <Field label="Jugador 1">
            <select
              value={formMatchup.ID_Jugador1}
              onChange={e => handleJugador1Change(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Seleccionar jugador...</option>
              {usuarios.map(u => <option key={u.ID} value={u.ID}>{u.Nombre}</option>)}
            </select>
          </Field>

          <Field
            label="Jugador 2"
            hint={eventoSeleccionado?.Es_Rivales === 1 ? "— asignado automáticamente" : ""}
          >
            <select
              value={formMatchup.ID_Jugador2}
              onChange={e => setFormMatchup({ ...formMatchup, ID_Jugador2: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer", opacity: eventoSeleccionado?.Es_Rivales === 1 ? 0.6 : 1 }}
              disabled={eventoSeleccionado?.Es_Rivales === 1}
            >
              <option value="">
                {eventoSeleccionado?.Es_Rivales === 1
                  ? formMatchup.ID_Jugador2
                    ? usuarios.find(u => String(u.ID) === formMatchup.ID_Jugador2)?.Nombre ?? "Rival no asignado"
                    : "Selecciona el jugador 1 primero"
                  : "Seleccionar jugador..."}
              </option>
              {eventoSeleccionado?.Es_Rivales !== 1 && usuarios.map(u => <option key={u.ID} value={u.ID}>{u.Nombre}</option>)}
            </select>
            {eventoSeleccionado?.Es_Rivales === 1 && formMatchup.ID_Jugador1 && !formMatchup.ID_Jugador2 && (
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--danger)" }}>
                Este jugador no tiene rival asignado. Configúralo en Participantes.
              </p>
            )}
          </Field>
        </Modal>
      )}

      {/* ── MODAL IMÁGENES ────────────────────────────────────────────────── */}
      {showModalImagen && (
        <Modal title="Imagen del evento" subtitle={`Establece la imagen principal de ${eventoParaImagen?.Nombre}`} onClose={() => setShowModalImagen(false)} onSubmit={null}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Haz doble clic en una imagen para establecerla como principal.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
            {imagenesEvento.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Sin imágenes subidas.</p>}
            {imagenesEvento.map(img => (
              <div key={img.ID} onDoubleClick={() => asignarImagenPrincipal(img.ID)} style={{ borderRadius: "8px", overflow: "hidden", border: `2px solid ${eventoParaImagen?.ID_Imagen_Principal === img.ID ? "var(--primary)" : "var(--border-color)"}`, cursor: "pointer", position: "relative" }}>
                <img src={`data:image/png;base64,${img.Imagen}`} alt="Evento" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                {eventoParaImagen?.ID_Imagen_Principal === img.ID && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--primary)", color: "#fff", fontSize: "0.58rem", fontWeight: 800, textAlign: "center", padding: "3px 0", letterSpacing: "0.5px" }}>PRINCIPAL</div>
                )}
              </div>
            ))}
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-soft)", border: "1px dashed var(--border-color)", borderRadius: "8px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            {nuevoArchivo ? nuevoArchivo.file.name : "Seleccionar imagen"}
            <input type="file" onChange={handleArchivoSeleccionado} accept="image/*" style={{ display: "none" }} />
          </label>

          {nuevoArchivo && (
            <button onClick={subirNuevaImagen} style={{ padding: "10px", background: "var(--success)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
              Subir imagen
            </button>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModalImagen(false)} style={{ padding: "10px 24px", background: "var(--bg-soft)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "9px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>Cerrar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}