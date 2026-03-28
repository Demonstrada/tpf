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
import MisionesView from "./MisionesView";

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

function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  
  const [usuarioData, setUsuarioData] = useState(() => {
    const guardado = localStorage.getItem('usuarioData');
    if (guardado) {
      return JSON.parse(guardado);
    }
    return null;
  });

  const [galeriaVisible, setGaleriaVisible] = useState(false);
  const [imagenesGaleria, setImagenesGaleria] = useState([]);
  const [galeriaTabla, setGaleriaTabla] = useState("");
  const [galeriaRegistroId, setGaleriaRegistroId] = useState(null);
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const [seleccionadaId, setSeleccionadaId] = useState(null);

  const [perfilVisible, setPerfilVisible] = useState(false);
  const [vista, setVista] = useState(() => {
    const vistaGuardada = localStorage.getItem('vistaActual');
    return vistaGuardada || "dashboard";
  });

  const [fullscreenReplay, setFullscreenReplay] = useState(null);
  const handleRequestFullscreen = useCallback((iframeContent, stats) => { setFullscreenReplay({ iframeContent, stats }); }, []);
  const handleCloseFullscreen = useCallback(() => { setFullscreenReplay(null); }, []);

  const baseURL = process.env.REACT_APP_URL_BACKEND;
  

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

  // <-- NUEVO: Función para cambiar de vista y guardar en localStorage -->
  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    localStorage.setItem('vistaActual', nuevaVista);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseURL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuario, contrasena }) });
      const data = await res.json();
      if (data.success) {
        setUsuarioData(data);
        localStorage.setItem('usuarioData', JSON.stringify(data)); // <-- Guardar sesión
        setMensaje("");
        cambiarVista("dashboard");
      }
      else setMensaje("Usuario o contraseña incorrectos");
    } catch { setMensaje("Error en el servidor"); }
  };

  // <-- NUEVO: Función para desloguearse -->
  const handleLogout = () => {
    setUsuarioData(null);
    localStorage.removeItem('usuarioData');
    localStorage.removeItem('vistaActual');
  };

  const abrirGaleria = (tabla, registroId) => {
    if (tabla === "usuarios") { setPerfilVisible(true); return; }
    fetch(`${baseURL}/imagenes/${tabla}/${registroId}`)
      .then(res => res.json())
      .then(data => { setImagenesGaleria(data); setGaleriaTabla(tabla); setGaleriaRegistroId(registroId); setGaleriaVisible(true); })
      .catch(err => console.error("Error al abrir galería: - App.js:159", err));
  };

  const asignarImagenPrincipal = (imagenId) => {
    if (!usuarioData) { alert("Debe iniciar sesión para asignar imagen principal."); return; }
    fetch(`${baseURL}/imagenes/principal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuarioId: usuarioData.id, tabla: galeriaTabla, registroId: galeriaRegistroId, imagenId }) })
      .then(async res => { if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); } return res.json(); })
      .then(() => { alert("Imagen asignada correctamente"); })
      .catch(err => { console.error("Error asignando imagen principal: - App.js:167", err); alert("No autorizado."); });
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
      .catch(err => console.error("Error subiendo imagen: - App.js:182", err));
  };

  const cambiarTema = (nuevoTemaId) => {
    const newData = { ...usuarioData, tema: nuevoTemaId };
    setUsuarioData(newData);
    localStorage.setItem('usuarioData', JSON.stringify(newData)); // <-- Actualizar Storage
    fetch(`${baseURL}/usuarios/${usuarioData.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: usuarioData.nombre, usuario: usuarioData.usuario, tema: nuevoTemaId }) })
      .catch(err => console.error("Error guardando el tema: - App.js:190", err));
  };

  // <-- NUEVO: Función wrapper para pasar a EditarPerfil y que actualice el localStorage -->
  const updateUsuarioDataAndStorage = (newData) => {
    setUsuarioData(newData);
    localStorage.setItem('usuarioData', JSON.stringify(newData));
  };

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
        <Sidebar usuarioData={usuarioData} onChangeVista={cambiarVista} onAbrirGaleria={abrirGaleria} onLogout={handleLogout} onChangeTheme={cambiarTema} />

        <main className="content">
          {vista === "dashboard" && <MisionesView baseURL={baseURL} usuarioData={usuarioData} />}

          {perfilVisible && <EditarPerfil usuarioData={usuarioData} setUsuarioData={updateUsuarioDataAndStorage} baseURL={baseURL} onClose={() => setPerfilVisible(false)} />}

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