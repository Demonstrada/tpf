import "./App.css";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import AdminView from "./AdminView";
import ParticipantesView from "./ParticipantesView";
import ValidacionesView from "./ValidacionesView";
import EditarPerfil from "./EditarPerfil";
import ReplayView from "./ReplayView";
import AdminEventosView from "./AdminEventosView";
import AdminTorneosView from "./AdminTorneosView";
import MisCombatesView from "./MisCombatesView";

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

function FullscreenReplayOverlay({ iframeContent, stats, onClose }) {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toId = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#0d1117", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "rgba(13,17,23,0.95)", borderBottom: "1px solid #ff4757", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#ff4757", fontWeight: 900, fontStyle: "italic", letterSpacing: "2px", fontSize: "0.85rem" }}>ARCHIVO DE COMBATE</span>
          {stats && (
            <span style={{ color: "#8b949e", fontSize: "0.78rem" }}>
              {stats.p1Name} <span style={{ color: "#ff4757" }}>VS</span> {stats.p2Name}
              {" · "}<span style={{ color: "#00d2d3" }}>{stats.turnos} turnos</span>
              {" · "}<span style={{ color: "#ff4757" }}>{stats.muertos} bajas</span>
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {stats && (
            <button onClick={() => setShowStats(s => !s)} style={{ background: showStats ? "rgba(0,210,211,0.15)" : "transparent", border: `1px solid ${showStats ? "#00d2d3" : "#30363d"}`, color: showStats ? "#00d2d3" : "#8b949e", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", transition: "all 0.2s" }}>TELEMETRÍA</button>
          )}
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #30363d", color: "#8b949e", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff4757"; e.currentTarget.style.color = "#ff4757"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#8b949e"; }}
          >CERRAR <span style={{ color: "#30363d", fontSize: "0.65rem" }}>ESC</span></button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <iframe title="Replay Fullscreen" srcDoc={iframeContent} style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        </div>
        {showStats && stats && (
          <div style={{ width: "300px", background: "rgba(13,17,23,0.97)", borderLeft: "1px solid #30363d", overflowY: "auto", padding: "1.5rem", flexShrink: 0 }}>
            <div style={{ fontSize: "0.65rem", color: "#00d2d3", letterSpacing: "2px", marginBottom: "1rem" }}>GANADOR</div>
            <div style={{ background: "#0d1117", border: "1px solid #ff4757", borderRadius: "8px", padding: "12px", textAlign: "center", marginBottom: "1.5rem" }}>
              <span style={{ color: "#ff4757", fontWeight: 900, fontSize: "1.1rem" }}>{stats.ganador}</span>
            </div>
            {[{ name: stats.p1Name, team: stats.p1Team }, { name: stats.p2Name, team: stats.p2Team }].map((gr, idx) => (
              <div key={idx} style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#8b949e", letterSpacing: "2px", borderBottom: "1px solid #30363d", paddingBottom: "6px", marginBottom: "10px" }}>{gr.name.toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {gr.team.map((pk, i) => (
                    <div key={i} style={{ background: "#0d1117", border: `1px solid ${pk.dead ? "#ff4757" : "#10b981"}`, borderRadius: "6px", padding: "6px", textAlign: "center", opacity: pk.dead ? 0.7 : 1 }}>
                      <img src={`https://play.pokemonshowdown.com/sprites/gen5/${toId(pk.especie)}.png`} style={{ width: "40px", display: "block", margin: "0 auto", filter: pk.dead ? "grayscale(100%) brightness(0.6)" : "none" }} alt="" />
                      <span style={{ fontSize: "0.55rem", color: pk.dead ? "#8b949e" : "#c9d1d9", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pk.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

function MisionCard({ mision: m, onClick }) {
  const validada = m.Validada === 1;
  const rechazada = m.Validada === 2;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ height: "4px", background: validada ? "var(--success)" : rechazada ? "var(--danger)" : "var(--border-color)" }} />

      <div style={{ position: "relative", background: "var(--bg-soft)", aspectRatio: "16/9", overflow: "hidden", flexShrink: 0 }}>
        {m.Imagen_Principal ? (
          <img src={`data:image/png;base64,${m.Imagen_Principal}`} alt={m.Nombre}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1px" }}>
            SIN IMAGEN
          </div>
        )}
        <div style={{ position: "absolute", top: "8px", right: "8px", background: "var(--primary)", color: "var(--bg-main)", fontSize: "0.68rem", fontWeight: 800, padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.3px" }}>
          {m.Puntos || 0} pts
        </div>
      </div>

      <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", lineHeight: 1.35 }}>{m.Nombre}</p>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
            background: validada ? "var(--success)" : rechazada ? "var(--danger)" : "var(--border-color)",
            boxShadow: validada ? "0 0 5px var(--success)" : rechazada ? "0 0 5px var(--danger)" : "none",
          }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: validada ? "var(--success)" : rechazada ? "var(--danger)" : "var(--text-muted)" }}>
            {validada ? "Completada" : rechazada ? "Rechazada — revisar" : "Pendiente"}
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [usuarioData, setUsuarioData] = useState(null);
  const [misiones, setMisiones] = useState([]);

  const [galeriaVisible, setGaleriaVisible] = useState(false);
  const [imagenesGaleria, setImagenesGaleria] = useState([]);
  const [galeriaTabla, setGaleriaTabla] = useState("");
  const [galeriaRegistroId, setGaleriaRegistroId] = useState(null);
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const [seleccionadaId, setSeleccionadaId] = useState(null);

  const [perfilVisible, setPerfilVisible] = useState(false);
  const [vista, setVista] = useState("misiones");
  const [misionSeleccionada, setMisionSeleccionada] = useState(null);
  const [descripcionHTML, setDescripcionHTML] = useState("");
  const [modalDescripcionVisible, setModalDescripcionVisible] = useState(false);
  const [grupoAbierto, setGrupoAbierto] = useState(null);

  const [fullscreenReplay, setFullscreenReplay] = useState(null);
  const handleRequestFullscreen = useCallback((iframeContent, stats) => { setFullscreenReplay({ iframeContent, stats }); }, []);
  const handleCloseFullscreen = useCallback(() => { setFullscreenReplay(null); }, []);

  const baseURL = "https://backend-21g1.vercel.app";

  useEffect(() => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", function (e) {
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        ripple.style.left = `${e.clientX - btn.offsetLeft}px`;
        ripple.style.top = `${e.clientY - btn.offsetTop}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }, []);

  const abrirModalDescripcion = (mision) => {
    setMisionSeleccionada(mision);
    let contenido = "";
    if (mision.Descripcion_usuario) {
      try {
        const desc = JSON.parse(mision.Descripcion_usuario);
        if (desc.imagenes?.length) desc.imagenes.forEach(img => { contenido += `<img src="data:image/png;base64,${img}" />`; });
        if (desc.texto) contenido += desc.texto;
      } catch { contenido = mision.Descripcion_usuario; }
    }
    setDescripcionHTML(contenido);
    setModalDescripcionVisible(true);
  };

  const guardarMisionUsuario = () => {
    if (!misionSeleccionada) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(descripcionHTML, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img")).map(img => img.src.replace(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/, ""));
    doc.querySelectorAll("img").forEach(el => el.remove());
    const texto = doc.body.innerHTML;
    const payload = { usuarioId: usuarioData.id, misionId: misionSeleccionada.ID, validada: 0, descripcion: JSON.stringify({ texto, imagenes: imgs }) };
    const metodo = misionSeleccionada.Descripcion_usuario ? "PUT" : "POST";
    fetch(`${baseURL}/mision_usuario`, { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(res => res.json())
      .then(() => { alert(metodo === "POST" ? "Registro guardado" : "Registro actualizado"); setModalDescripcionVisible(false); setDescripcionHTML(""); })
      .catch(err => console.error("Error guardando mision_usuario: - App.js:202", err));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseURL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuario, contrasena }) });
      const data = await res.json();
      if (data.success) {
        setUsuarioData(data);
        setMensaje("");
        setVista("dashboard");
      }
      else setMensaje("Usuario o contraseña incorrectos");
    } catch { setMensaje("Error en el servidor"); }
  };

  useEffect(() => {
    if (usuarioData) {
      fetch(`${baseURL}/misiones/${usuarioData.id}/${usuarioData.juegoId}`)
        .then(res => res.json())
        .then(data => { setMisiones(Array.isArray(data) ? data : []); })
        .catch(err => console.error("Error cargando misiones: - App.js:224", err));
    }
  }, [usuarioData]);

  const misionesPorTipo = Array.isArray(misiones) ? misiones.reduce((acc, m) => {
    if (!acc[m.Grupo]) acc[m.Grupo] = [];
    acc[m.Grupo].push(m);
    return acc;
  }, {}) : {};

  useEffect(() => {
    const grupos = Object.keys(misionesPorTipo);
    if (grupos.length > 0 && grupoAbierto === null) setGrupoAbierto(grupos[0]);
  }, [misiones]);

  const abrirGaleria = (tabla, registroId) => {
    if (tabla === "usuarios") { setPerfilVisible(true); return; }
    fetch(`${baseURL}/imagenes/${tabla}/${registroId}`)
      .then(res => res.json())
      .then(data => { setImagenesGaleria(data); setGaleriaTabla(tabla); setGaleriaRegistroId(registroId); setGaleriaVisible(true); })
      .catch(err => console.error("Error al abrir galería: - App.js:244", err));
  };

  const asignarImagenPrincipal = (imagenId) => {
    if (!usuarioData) { alert("Debe iniciar sesión para asignar imagen principal."); return; }
    fetch(`${baseURL}/imagenes/principal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuarioId: usuarioData.id, tabla: galeriaTabla, registroId: galeriaRegistroId, imagenId }) })
      .then(async res => { if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); } return res.json(); })
      .then(() => { const img = imagenesGaleria.find(img => img.ID === imagenId); if (!img) return; if (galeriaTabla === "Misiones") setMisiones(misiones.map(m => m.ID === galeriaRegistroId ? { ...m, Imagen_Principal: img.Imagen } : m)); })
      .catch(err => { console.error("Error asignando imagen principal: - App.js:252", err); alert("No autorizado."); });
  };

  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files[0]; if (!archivo) return;
    const reader = new FileReader();
    reader.onloadend = () => setNuevoArchivo(reader.result.split(",")[1]);
    reader.readAsDataURL(archivo);
  };

  const subirNuevaImagen = () => {
    if (!nuevoArchivo) return;
    fetch(`${baseURL}/imagenes/nueva`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tabla: galeriaTabla, registroId: galeriaRegistroId, imagenBase64: nuevoArchivo }) })
      .then(res => res.json())
      .then(data => { setImagenesGaleria([...imagenesGaleria, { ID: data.ID, Imagen: data.Imagen }]); setNuevoArchivo(null); })
      .catch(err => console.error("Error subiendo imagen: - App.js:267", err));
  };

  const quillModules = { toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['image'], ['clean']] };

  const cambiarTema = (nuevoTemaId) => {
    setUsuarioData({ ...usuarioData, tema: nuevoTemaId });
    fetch(`${baseURL}/usuarios/${usuarioData.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: usuarioData.nombre, usuario: usuarioData.usuario, tema: nuevoTemaId }) })
      .catch(err => console.error("Error guardando el tema: - App.js:275", err));
  };

  const totalMisiones = misiones.length;
  const completadas = misiones.filter(m => m.Validada === 1).length;
  const puntosObtenidos = misiones.filter(m => m.Validada === 1).reduce((s, m) => s + (m.Puntos || 0), 0);
  const puntosTotal = misiones.reduce((s, m) => s + (m.Puntos || 0), 0);
  const progreso = totalMisiones > 0 ? Math.round((completadas / totalMisiones) * 100) : 0;

  if (!usuarioData) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #ff9ff3 0%, #a29bfe 50%, #f368e0 100%)"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)",
          borderRadius: "20px", padding: "3rem 2.5rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          width: "100%", maxWidth: "380px",
        }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "transparent",
              margin: "0 auto 1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden"
            }}>
              <img
                src="/favicon.ico"
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>TPF</h2>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.875rem" }}>Accede a tu cuenta</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Usuario", value: usuario, setter: setUsuario, type: "text", placeholder: "Nombre de usuario" },
              { label: "Contraseña", value: contrasena, setter: setContrasena, type: "password", placeholder: "••••••••" }
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder} value={f.value}
                  onChange={e => f.setter(e.target.value)} required
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s", background: "#f8fafc", color: "#1e293b" }}
                  onFocus={e => e.target.style.borderColor = "#a29bfe"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            ))}
            <button type="submit" style={{ marginTop: "6px", padding: "12px", background: "linear-gradient(135deg, #a29bfe, #f368e0)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", letterSpacing: "0.5px" }}>
              Entrar
            </button>
          </form>

          {mensaje && (
            <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.82rem", fontWeight: 500, textAlign: "center" }}>
              {mensaje}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`dashboard ${vista === "replay" || vista === "mis-combates" ? "theme-combat" : ""}`} data-theme={usuarioData?.tema || 1}>
        <Sidebar usuarioData={usuarioData} onChangeVista={setVista} onAbrirGaleria={abrirGaleria} onLogout={() => setUsuarioData(null)} onChangeTheme={cambiarTema} />

        <main className="content">

          {vista === "dashboard" && (
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>

              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ margin: "0 0 4px", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
                  {usuarioData.juegoNombre}
                </h1>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>Misiones disponibles para tu juego</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
                {[
                  { label: "Completadas", value: `${completadas} / ${totalMisiones}`, color: "var(--success)" },
                  { label: "Pts. obtenidos", value: `${puntosObtenidos} pts`, color: "var(--primary)" },
                  { label: "Total disponible", value: `${puntosTotal} pts`, color: "var(--text-muted)" },
                  { label: "Progreso", value: `${progreso}%`, color: "var(--secondary, var(--primary))" },
                ].map(k => (
                  <div key={k.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>{k.label}</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: k.color, opacity: 0.35 }} />
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 20px", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>PROGRESO GLOBAL</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-main)" }}>{progreso}%</span>
                </div>
                <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progreso}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary, var(--primary-dark)))", borderRadius: "4px", transition: "width 0.6s ease" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.keys(misionesPorTipo).map(Grupo => {
                  const isOpen = grupoAbierto === Grupo;
                  const lista = misionesPorTipo[Grupo];
                  const hechas = lista.filter(m => m.Validada === 1).length;

                  return (
                    <div key={Grupo} style={{ border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden", background: "var(--bg-card)" }}>
                      <button
                        onClick={() => setGrupoAbierto(isOpen ? null : Grupo)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: isOpen ? "1px solid var(--border-color)" : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-soft)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "9px", height: "9px", borderRadius: "50%", flexShrink: 0,
                            background: hechas === lista.length && lista.length > 0 ? "var(--success)" : hechas > 0 ? "var(--primary)" : "var(--border-color)",
                            boxShadow: hechas === lista.length && lista.length > 0 ? "0 0 6px var(--success)" : "none",
                          }} />
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>{Grupo}</span>
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-soft)", border: "1px solid var(--border-color)", padding: "2px 8px", borderRadius: "20px" }}>
                            {hechas}/{lista.length}
                          </span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transition: "transform 0.25s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "14px", padding: "18px" }}>
                          {lista.map(m => (
                            <MisionCard key={m.ID} mision={m} onClick={() => { if (usuarioData.administrador !== 1) abrirModalDescripcion(m); }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {perfilVisible && <EditarPerfil usuarioData={usuarioData} setUsuarioData={setUsuarioData} baseURL={baseURL} onClose={() => setPerfilVisible(false)} />}

          {galeriaVisible && galeriaTabla !== "usuarios" && (
            <>
              <div className="galeria-backdrop" onClick={() => setGaleriaVisible(false)} />
              <div className="galeria-modal">
                <button className="cerrar-btn" onClick={() => setGaleriaVisible(false)}>×</button>
                <h3>Imágenes de {galeriaTabla}</h3>
                <div className="galeria-editor">
                  <div className="galeria-grid">
                    {imagenesGaleria.map(img => (
                      <div key={img.ID} className={`galeria-item ${img.ID === seleccionadaId ? "selected" : ""}`} onClick={() => setSeleccionadaId(img.ID)} onDoubleClick={() => asignarImagenPrincipal(img.ID)}>
                        <img src={`data:image/png;base64,${img.Imagen}`} alt="galeria" />
                      </div>
                    ))}
                  </div>
                  <div className="subir-imagen">
                    <input type="file" onChange={handleArchivoSeleccionado} />
                    <button onClick={subirNuevaImagen}>Subir nueva imagen</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {modalDescripcionVisible && (
            <>
              <div className="galeria-backdrop" onClick={() => setModalDescripcionVisible(false)} />
              <div className="galeria-modal modal-quill">
                <button className="cerrar-btn" onClick={() => setModalDescripcionVisible(false)}>×</button>
                <h3>Misión: {misionSeleccionada?.Nombre}</h3>
                {misionSeleccionada?.Descripcion_mision && (
                  <div className="descripcion-mision">
                    <strong>Instrucciones:</strong>
                    <div dangerouslySetInnerHTML={{ __html: misionSeleccionada.Descripcion_mision }} />
                  </div>
                )}
                {!misionSeleccionada?.Validada ? (
                  <>
                    <div className="quill-container">
                      <ReactQuill theme="snow" value={descripcionHTML} onChange={setDescripcionHTML} modules={quillModules} placeholder="Escribe tu experiencia aquí..." />
                    </div>
                    <div className="perfil-footer" style={{ marginTop: "1rem" }}>
                      <button onClick={guardarMisionUsuario} className="btn-guardar-perfil">
                        {misionSeleccionada?.Descripcion_usuario ? "Actualizar" : "Guardar"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mensaje-validada">Esta misión ya ha sido validada y no puede ser modificada.</div>
                )}
              </div>
            </>
          )}
          {vista === "mis-combates" && <MisCombatesView baseURL={baseURL} usuarioData={usuarioData} onRequestFullscreen={handleRequestFullscreen} />}
          {vista === "replay" && <ReplayView baseURL={baseURL} onRequestFullscreen={handleRequestFullscreen} />}
          {vista === "torneos" && <AdminTorneosView baseURL={baseURL} usuarioData={usuarioData} />}
          {vista === "admin-eventos" && <AdminEventosView baseURL={baseURL} usuarioData={usuarioData} />}
          {vista === "admin" && <AdminView baseURL={baseURL} />}
          {vista === "participantes" && <ParticipantesView baseURL={baseURL} usuarioData={usuarioData} />}
          {vista === "validaciones" && <ValidacionesView baseURL={baseURL} />}
        </main>
      </div>

      {fullscreenReplay && <FullscreenReplayOverlay iframeContent={fullscreenReplay.iframeContent} stats={fullscreenReplay.stats} onClose={handleCloseFullscreen} />}
    </>
  );
}

export default App;