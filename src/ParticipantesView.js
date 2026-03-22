import React, { useEffect, useState } from "react";

// ─── CAMPO DE FORMULARIO ──────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label style={{
      display: "block", fontSize: "0.72rem", fontWeight: 700,
      color: "var(--text-muted)", letterSpacing: "0.5px",
      textTransform: "uppercase", marginBottom: "6px"
    }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  borderRadius: "8px", border: "1px solid var(--border-color)",
  background: "var(--bg-main)", color: "var(--text-main)",
  fontSize: "0.88rem", outline: "none", transition: "border-color 0.2s",
  fontFamily: "inherit",
};

const selectStyle = {
  ...inputStyle, cursor: "pointer",
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, onSubmit, submitLabel = "Guardar", children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "var(--premium-backdrop, rgba(0,0,0,0.5))",
          backdropFilter: "blur(4px)"
        }}
      />
      <div style={{
        position: "fixed", inset: 0, zIndex: 9001,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", pointerEvents: "none"
      }}>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-color)",
          borderRadius: "16px", padding: "2rem",
          width: "100%", maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          pointerEvents: "auto", position: "relative",
        }}>
          {/* CERRAR */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "14px", right: "14px",
              background: "var(--bg-soft)", border: "1px solid var(--border-color)",
              borderRadius: "50%", width: "28px", height: "28px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 700
            }}
          >×</button>

          {/* CABECERA */}
          <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ margin: "0 0 3px", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>

          {/* CONTENIDO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {children}
          </div>

          {/* ACCIONES */}
          <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
            <button
              onClick={onSubmit}
              style={{
                flex: 1, padding: "11px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "#fff", border: "none", borderRadius: "9px",
                fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", letterSpacing: "0.3px",
                transition: "opacity 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >{submitLabel}</button>
            <button
              onClick={onClose}
              style={{
                padding: "11px 20px", background: "var(--bg-soft)",
                color: "var(--text-muted)", border: "1px solid var(--border-color)",
                borderRadius: "9px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer"
              }}
            >Cancelar</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ imagen, nombre, size = 40 }) {
  if (imagen) return (
    <img
      src={`data:image/png;base64,${imagen}`}
      alt={nombre}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block", border: "2px solid var(--border-color)" }}
    />
  );
  const initials = (nombre || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: size * 0.35,
      border: "2px solid var(--border-color)"
    }}>{initials}</div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
function ParticipantesView({ baseURL }) {
  const [usuarios, setUsuarios] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [rivales, setRivales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Modales
  const [modalAlta, setModalAlta] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(null); // usuario a editar

  // Form alta
  const [altaForm, setAltaForm] = useState({ nombre: "", usuario: "", contrasena: "", juego: "", rival: "", admin: false });

  // Form edición
  const [editForm, setEditForm] = useState({ nombre: "", usuario: "", contrasena: "", juego: "", rival: "", admin: false });

  // ── CARGA ──────────────────────────────────────────────────────────────────
  const cargarUsuarios = () => {
    setLoading(true);
    fetch(`${baseURL}/usuarios`)
      .then(r => r.json())
      .then(data => { setUsuarios(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    cargarUsuarios();
    fetch(`${baseURL}/juegos`).then(r => r.json()).then(setJuegos).catch(console.error);
    fetch(`${baseURL}/usuarios/lista-simple`).then(r => r.json()).then(data => setRivales(Array.isArray(data) ? data : [])).catch(console.error);
  }, [baseURL]); // eslint-disable-line

  // ── ALTA ───────────────────────────────────────────────────────────────────
  const handleAlta = () => {
    fetch(`${baseURL}/usuarios`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: altaForm.nombre, usuario: altaForm.usuario,
        contrasena: altaForm.contrasena, juego: altaForm.juego || null,
        rival: altaForm.rival || null, administrador: altaForm.admin ? 1 : 0,
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAltaForm({ nombre: "", usuario: "", contrasena: "", juego: "", rival: "", admin: false });
          setModalAlta(false);
          cargarUsuarios();
        } else { alert("Error al crear usuario"); }
      })
      .catch(console.error);
  };

  // ── EDICIÓN ────────────────────────────────────────────────────────────────
  const abrirEdicion = (u) => {
    setEditForm({
      nombre: u.Nombre || "",
      usuario: u.Usuario || "",
      contrasena: "",
      juego: u.Juego || "",
      rival: u.Rival || "",
      admin: u.Administrador === 1,
    });
    setModalEdicion(u);
  };

  const handleEdicion = () => {
    if (!modalEdicion) return;
    const body = {
      nombre: editForm.nombre,
      usuario: editForm.usuario,
      juego: editForm.juego || null,
      rival: editForm.rival || null,
      administrador: editForm.admin ? 1 : 0,
    };
    if (editForm.contrasena) body.contrasena = editForm.contrasena;

    fetch(`${baseURL}/usuarios/${modalEdicion.ID}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => { setModalEdicion(null); cargarUsuarios(); })
      .catch(console.error);
  };

  // ── DESACTIVAR ─────────────────────────────────────────────────────────────
  const desactivar = (id) => {
    if (!window.confirm("¿Desactivar este usuario?")) return;
    fetch(`${baseURL}/usuarios/${id}/desactivar`, { method: "PUT" })
      .then(() => cargarUsuarios());
  };

  // ── FILTRADO ───────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter(u =>
    u.Nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.Usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── CAMPOS COMPARTIDOS PARA FORMULARIOS ───────────────────────────────────
  const renderCamposUsuario = (form, setForm, esEdicion = false) => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Nombre completo">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Sergio García" style={inputStyle} required
            onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
        </Field>
        <Field label="Usuario">
          <input type="text" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} placeholder="Ej: sergio99" style={inputStyle} required
            onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
        </Field>
      </div>

      <Field label={esEdicion ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}>
        <input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} placeholder="••••••••" style={inputStyle} required={!esEdicion}
          onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Juego asignado">
          <select value={form.juego} onChange={e => setForm({ ...form, juego: e.target.value })} style={selectStyle}>
            <option value="">Sin juego</option>
            {juegos.map(j => <option key={j.ID} value={j.ID}>{j.Nombre}</option>)}
          </select>
        </Field>
        <Field label="Rival asignado">
          <select value={form.rival} onChange={e => setForm({ ...form, rival: e.target.value })} style={selectStyle}>
            <option value="">Sin rival</option>
            {rivales.filter(r => !modalEdicion || r.ID !== modalEdicion.ID).map(r => <option key={r.ID} value={r.ID}>{r.Nombre}</option>)}
          </select>
        </Field>
      </div>

      {/* TOGGLE ADMIN */}
      <div
        onClick={() => setForm({ ...form, admin: !form.admin })}
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 14px",
          background: form.admin ? "rgba(var(--info-rgb,9,132,227),0.06)" : "var(--bg-soft)",
          border: `1px solid ${form.admin ? "var(--info, #0984e3)" : "var(--border-color)"}`,
          borderRadius: "8px", cursor: "pointer", transition: "all 0.2s"
        }}
      >
        <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: form.admin ? "var(--info, #0984e3)" : "var(--border-color)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
          <div style={{ position: "absolute", top: "3px", left: form.admin ? "18px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: form.admin ? "var(--info, #0984e3)" : "var(--text-muted)" }}>
            {form.admin ? "Administrador" : "Participante normal"}
          </span>
          <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
            {form.admin ? "Acceso a la gestión del sistema" : "Solo accede a sus misiones y combates"}
          </span>
        </div>
      </div>
    </>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
      Cargando participantes...
    </div>
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* CABECERA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
            Participantes
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setModalAlta(true)}
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            color: "#fff", border: "none", borderRadius: "10px",
            padding: "10px 20px", fontWeight: 800, fontSize: "0.85rem",
            cursor: "pointer", letterSpacing: "0.3px", display: "flex",
            alignItems: "center", gap: "8px", transition: "opacity 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Nuevo participante
        </button>
      </div>

      {/* BUSCADOR */}
      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" placeholder="Buscar por nombre o usuario..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, paddingLeft: "38px" }}
          onFocus={e => e.target.style.borderColor = "var(--primary)"}
          onBlur={e => e.target.style.borderColor = "var(--border-color)"}
        />
      </div>

      {/* TABLA / LISTA */}
      {usuariosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "14px", border: "1px dashed var(--border-color)" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>No se encontraron participantes</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* CABECERA TABLA */}
          <div style={{
            display: "grid", gridTemplateColumns: "44px 1fr 120px 80px 100px",
            gap: "12px", padding: "8px 16px",
            fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.5px", textTransform: "uppercase"
          }}>
            <div />
            <div>Participante</div>
            <div>Juego / Rival</div>
            <div style={{ textAlign: "center" }}>Puntos</div>
            <div style={{ textAlign: "right" }}>Acciones</div>
          </div>

          {/* FILAS */}
          {usuariosFiltrados.map(u => (
            <div
              key={u.ID}
              style={{
                display: "grid", gridTemplateColumns: "44px 1fr 120px 80px 100px",
                gap: "12px", alignItems: "center",
                padding: "12px 16px",
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderLeft: `4px solid ${u.Administrador ? "var(--primary)" : "var(--border-color)"}`,
                borderRadius: "10px", transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-soft)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}
            >
              {/* AVATAR */}
              <Avatar imagen={u.Imagen} nombre={u.Nombre} size={40} />

              {/* NOMBRE + USUARIO */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                  {u.Nombre}
                  {u.Administrador === 1 && (
                    <span style={{ fontSize: "0.58rem", fontWeight: 800, padding: "1px 6px", borderRadius: "20px", background: "var(--bg-soft)", border: "1px solid var(--primary)", color: "var(--primary)", letterSpacing: "0.5px", flexShrink: 0 }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>@{u.Usuario}</div>
              </div>

              {/* JUEGO / RIVAL */}
              <div style={{ minWidth: 0 }}>
                {u.Juego_Nombre && (
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.Juego_Nombre || "—"}
                  </div>
                )}
                {u.Rival_Nombre && (
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    vs {u.Rival_Nombre}
                  </div>
                )}
                {!u.Juego_Nombre && !u.Rival_Nombre && (
                  <span style={{ fontSize: "0.72rem", color: "var(--border-color)" }}>—</span>
                )}
              </div>

              {/* PUNTOS */}
              <div style={{ textAlign: "center", fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>
                {u.Puntos || 0}
              </div>

              {/* ACCIONES */}
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => abrirEdicion(u)}
                  title="Editar"
                  style={{
                    background: "var(--bg-soft)", border: "1px solid var(--border-color)",
                    borderRadius: "7px", width: "32px", height: "32px",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => desactivar(u.ID)}
                  title="Desactivar"
                  style={{
                    background: "var(--bg-soft)", border: "1px solid var(--border-color)",
                    borderRadius: "7px", width: "32px", height: "32px",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALTA */}
      {modalAlta && (
        <Modal
          title="Nuevo participante"
          subtitle="Crea una cuenta para un nuevo jugador"
          onClose={() => setModalAlta(false)}
          onSubmit={handleAlta}
          submitLabel="Crear participante"
        >
          {renderCamposUsuario(altaForm, setAltaForm, false)}
        </Modal>
      )}

      {/* EDICIÓN */}
      {modalEdicion && (
        <Modal
          title="Editar participante"
          subtitle={`@${modalEdicion.Usuario} · ID #${modalEdicion.ID}`}
          onClose={() => setModalEdicion(null)}
          onSubmit={handleEdicion}
          submitLabel="Guardar cambios"
        >
          {renderCamposUsuario(editForm, setEditForm, true)}
        </Modal>
      )}
    </div>
  );
}

export default ParticipantesView;