import React, { useState, useEffect } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = { 
  toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['image'], ['clean']] 
};

function MisionCard({ mision: m, onClick }) {
  const validada = m.Validada === 1;
  const rechazada = m.Validada === 2;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "14px",
        overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex", flexDirection: "column", position: "relative",
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

export default function MisionesView({ baseURL, usuarioData }) {
  const [misiones, setMisiones] = useState([]);
  const [misionSeleccionada, setMisionSeleccionada] = useState(null);
  const [descripcionHTML, setDescripcionHTML] = useState("");
  const [modalDescripcionVisible, setModalDescripcionVisible] = useState(false);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});

  const cargarMisiones = () => {
    fetch(`${baseURL}/misiones/${usuarioData.id}/${usuarioData.juegoId}`)
      .then(res => res.json())
      .then(data => setMisiones(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando misiones: - MisionesView.js:68", err));
  };

  useEffect(() => {
    cargarMisiones();
  }, [usuarioData]);

  const abrirModalDescripcion = (mision) => {
    if (usuarioData.administrador === 1) return;
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
      .then(() => { 
        alert(metodo === "POST" ? "Registro guardado" : "Registro actualizado"); 
        setModalDescripcionVisible(false); 
        setDescripcionHTML(""); 
        cargarMisiones(); // Recargar la lista de misiones para actualizar estado
      })
      .catch(err => console.error("Error guardando mision_usuario: - MisionesView.js:109", err));
  };

  const toggleSeccion = (clave) => {
    setSeccionesAbiertas(prev => ({ ...prev, [clave]: !prev[clave] }));
  };

  // ─── LÓGICA DE AGRUPACIÓN (EVENTO -> GRUPO) ───
  const misionesAgrupadas = misiones.reduce((acc, m) => {
    const nombreEvento = m.ID_Evento ? (m.EventoNombre || `Evento #${m.ID_Evento}`) : "Misiones Generales";
    const nombreGrupo = m.Grupo || "Sin Grupo";

    if (!acc[nombreEvento]) acc[nombreEvento] = {};
    if (!acc[nombreEvento][nombreGrupo]) acc[nombreEvento][nombreGrupo] = [];
    
    acc[nombreEvento][nombreGrupo].push(m);
    return acc;
  }, {});

  // ─── CÁLCULOS DEL HEADER ───
  const totalMisiones = misiones.length;
  const completadas = misiones.filter(m => m.Validada === 1).length;
  const puntosObtenidos = misiones.filter(m => m.Validada === 1).reduce((s, m) => s + (m.Puntos || 0), 0);
  const puntosTotal = misiones.reduce((s, m) => s + (m.Puntos || 0), 0);
  const progreso = totalMisiones > 0 ? Math.round((completadas / totalMisiones) * 100) : 0;

  return (
    <>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
            {usuarioData.juegoNombre}
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>Misiones disponibles para tu juego</p>
        </div>

        {/* Tarjetas de Estadísticas */}
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

        {/* Barra de Progreso */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 20px", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>PROGRESO GLOBAL</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-main)" }}>{progreso}%</span>
          </div>
          <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progreso}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary, var(--primary-dark)))", borderRadius: "4px", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Listado Doble Agrupación (Evento -> Grupo) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.keys(misionesAgrupadas).map(evento => (
            <div key={evento}>
              {/* Título del Evento */}
              <h2 style={{ 
                fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", 
                marginBottom: "1rem", borderBottom: "2px solid var(--border-color)", 
                paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" 
              }}>
                {evento === "Misiones Generales" ? "🌟" : "🎟"} {evento}
              </h2>

              {/* Acordeones de Grupos dentro de este evento */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.keys(misionesAgrupadas[evento]).map(grupo => {
                  const lista = misionesAgrupadas[evento][grupo];
                  const hechas = lista.filter(m => m.Validada === 1).length;
                  const claveSeccion = `${evento}-${grupo}`;
                  const isOpen = seccionesAbiertas[claveSeccion];

                  return (
                    <div key={grupo} style={{ border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden", background: "var(--bg-card)" }}>
                      <button
                        onClick={() => toggleSeccion(claveSeccion)}
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
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>{grupo}</span>
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
                            <MisionCard key={m.ID} mision={m} onClick={() => abrirModalDescripcion(m)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Misión */}
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
    </>
  );
}