import React, { useState, useEffect } from "react";

function ValidacionesView({ baseURL }) {
  const [submissions, setSubmissions] = useState([]);
  const [filtro, setFiltro] = useState(0);
  const [seleccionada, setSeleccionada] = useState(null);
  const [contenidoHTML, setContenidoHTML] = useState("");

  const [busquedaMision, setBusquedaMision] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroJuego, setFiltroJuego] = useState("");

  useEffect(() => {
    const fetchValidaciones = () => {
      fetch(`${baseURL}/validaciones`)
        .then((res) => res.json())
        .then(setSubmissions)
        .catch((err) => console.error("Error cargando validaciones: - ValidacionesView.js:18", err));
    };
    
    fetchValidaciones();
  }, [baseURL]);

  const refrescarDatos = () => {
    fetch(`${baseURL}/validaciones`)
      .then((res) => res.json())
      .then(setSubmissions)
      .catch((err) => console.error("Error refrescando validaciones: - ValidacionesView.js:28", err));
  };

  const abrirModal = (sub) => {
    setSeleccionada(sub);
    let html = "";
    if (sub.Descripcion) {
      try {
        const desc = JSON.parse(sub.Descripcion);
        if (desc.texto) html += desc.texto;
        if (desc.imagenes?.length) {
          html += `<div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">`;
          desc.imagenes.forEach((img) => {
            html += `<img src="data:image/png;base64,${img}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />`;
          });
          html += `</div>`;
        }
      } catch {
        html = sub.Descripcion;
      }
    }
    setContenidoHTML(html || "<p><i>No hay descripción.</i></p>");
  };

  const cambiarEstado = async (usuarioId, misionId, nuevoEstado) => {
    let mensajeConfirmacion = "";
    if (nuevoEstado === 1) mensajeConfirmacion = "Misión APROBADA (Se sumarán los puntos).";
    if (nuevoEstado === 2) mensajeConfirmacion = "Misión RECHAZADA (El jugador deberá corregirla)."; // Cambiado usuario por jugador
    if (nuevoEstado === 0) mensajeConfirmacion = "Misión devuelta a PENDIENTE de revisión.";

    try {
      await fetch(`${baseURL}/validaciones/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, misionId, estado: nuevoEstado }),
      });
      alert(mensajeConfirmacion);
      setSeleccionada(null);
      refrescarDatos();
    } catch (err) {
      console.error("Error cambiando estado: - ValidacionesView.js:68", err);
    }
  };

  const usuariosUnicos = [...new Set(submissions.map((s) => s.nombreUsuario))].filter(Boolean);
  const juegosUnicos = [...new Set(submissions.map((s) => s.JuegoNombre || s.nombreJuego))].filter(Boolean);

  const filtradas = submissions.filter((s) => {
    const matchEstado = Number(s.Validada) === filtro;
    
    const matchUsuario = filtroUsuario === "" || s.nombreUsuario === filtroUsuario;
    
    const nombreDelJuego = s.JuegoNombre || s.nombreJuego;
    const matchJuego = filtroJuego === "" || nombreDelJuego === filtroJuego;
    
    const matchMision = busquedaMision === "" || s.nombreMision.toLowerCase().includes(busquedaMision.toLowerCase());

    return matchEstado && matchUsuario && matchJuego && matchMision;
  });

  return (
    <div className="admin-view" style={{ maxWidth: "1200px" }}>
      <h2 style={{ textAlign: "left", marginBottom: "1.5rem" }}>Validar Misiones</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", background: "var(--bg-card)", padding: "1rem", borderRadius: "0.8rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid var(--border-color)", flexWrap: "wrap" }}>
        
        <div style={{ flex: "2 1 200px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--primary-dark)", fontWeight: "bold", marginBottom: "0.3rem" }}>Buscar Misión:</label>
          <input
            type="text"
            placeholder="Escribe para buscar..."
            value={busquedaMision}
            onChange={(e) => setBusquedaMision(e.target.value)}
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)", outline: "none" }}
          />
        </div>
        <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--primary-dark)", fontWeight: "bold", marginBottom: "0.3rem" }}>Jugador:</label> {/* Cambiado a Jugador */}
          <select 
            value={filtroUsuario} 
            onChange={(e) => setFiltroUsuario(e.target.value)}
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)", outline: "none" }}
          >
            <option value="">Todos los jugadores</option>
            {usuariosUnicos.map((u, idx) => (
              <option key={idx} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--primary-dark)", fontWeight: "bold", marginBottom: "0.3rem" }}>Juego:</label>
          <select 
            value={filtroJuego} 
            onChange={(e) => setFiltroJuego(e.target.value)}
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)", outline: "none" }}
          >
            <option value="">Todos los juegos</option>
            {juegosUnicos.map((j, idx) => (
              <option key={idx} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: "15px", marginBottom: "2rem" }}>
        <button
          onClick={() => setFiltro(0)}
          style={{
            flex: 1, padding: "1rem", fontWeight: "600", border: "none", borderRadius: "0.8rem", cursor: "pointer", transition: "all 0.2s",
            background: filtro === 0 ? "var(--primary)" : "var(--bg-soft)",
            color: filtro === 0 ? "white" : "var(--text-muted)",
            boxShadow: filtro === 0 ? "0 4px 10px rgba(0, 0, 0, 0.15)" : "none"
          }}
        >
          Pendientes ({submissions.filter((s) => Number(s.Validada) === 0).length})
        </button>

        <button
          onClick={() => setFiltro(1)}
          style={{
            flex: 1, padding: "1rem", fontWeight: "600", border: "none", borderRadius: "0.8rem", cursor: "pointer", transition: "all 0.2s",
            background: filtro === 1 ? "var(--success)" : "var(--bg-soft)",
            color: filtro === 1 ? "white" : "var(--text-muted)",
            boxShadow: filtro === 1 ? "0 4px 10px rgba(0, 0, 0, 0.15)" : "none"
          }}
        >
          Aprobadas ({submissions.filter((s) => Number(s.Validada) === 1).length})
        </button>

        <button
          onClick={() => setFiltro(2)}
          style={{
            flex: 1, padding: "1rem", fontWeight: "600", border: "none", borderRadius: "0.8rem", cursor: "pointer", transition: "all 0.2s",
            background: filtro === 2 ? "var(--danger)" : "var(--bg-soft)",
            color: filtro === 2 ? "white" : "var(--text-muted)",
            boxShadow: filtro === 2 ? "0 4px 10px rgba(0, 0, 0, 0.15)" : "none"
          }}
        >
          Rechazadas ({submissions.filter((s) => Number(s.Validada) === 2).length})
        </button>
      </div>

      {filtradas.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem", background: "var(--bg-card)", borderRadius: "1rem", border: "1px dashed var(--border-color)" }}>
          No se encontraron misiones con los filtros actuales.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filtradas.map((sub) => (
            <div
              key={`${sub.usuarioId}-${sub.misionId}`}
              className="mision-card"
              onClick={() => abrirModal(sub)}
              style={{ alignItems: "flex-start", textAlign: "left", padding: "1.5rem", border: "1px solid var(--border-light)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-soft)", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.85rem", color: "var(--primary-dark)", fontWeight: "600" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  {sub.nombreUsuario}
                </div>
                {(sub.JuegoNombre || sub.nombreJuego) && (
                   <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase" }}>
                      🎮 {sub.JuegoNombre || sub.nombreJuego}
                   </span>
                )}
              </div>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-main)", fontSize: "1.1rem" }}>{sub.nombreMision}</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 1.5rem 0", fontWeight: "500" }}>{sub.Puntos} Puntos en juego</p>
              
              <button style={{ width: "100%", background: "var(--bg-soft)", color: "var(--primary-dark)", border: "1px solid var(--border-light)", padding: "0.8rem", borderRadius: "0.6rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.target.style.background = "var(--bg-main)"} onMouseOut={(e) => e.target.style.background = "var(--bg-soft)"}>
                Revisar respuesta
              </button>
            </div>
          ))}
        </div>
      )}

      {seleccionada && (
        <>
          <div className="premium-backdrop" onClick={() => setSeleccionada(null)} />
          
          <div className="animation-fade-up" style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2001, pointerEvents: "none" }}>
            
            <div className="premium-modal" style={{ maxWidth: "800px", position: "relative", top: "auto", left: "auto", transform: "none", pointerEvents: "auto", margin: "0 20px" }}>
              
              <button className="premium-close-btn" onClick={() => setSeleccionada(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div className="premium-header">
                <h2>Revisión de Misión</h2>
                <p>Enviado por <strong>{seleccionada.nombreUsuario}</strong> • Misión: <strong>{seleccionada.nombreMision}</strong></p> {/* Dejo el nombreUsuario en la variable, pero el texto visual dirá "Enviado por" que aplica igual a un jugador */}
              </div>

              <div className="premium-body" style={{ display: "block" }}>
                <div style={{ background: "var(--bg-input)", border: "1px solid var(--premium-border)", borderRadius: "0.8rem", padding: "1.5rem", maxHeight: "40vh", overflowY: "auto", marginBottom: "1.5rem", color: "var(--text-main)" }}>
                  <div className="ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: contenidoHTML }} />
                </div>
              </div>

              <div className="premium-footer" style={{ justifyContent: "center", gap: "1rem" }}>
                
                {filtro !== 0 && (
                  <button 
                    onClick={() => cambiarEstado(seleccionada.usuarioId, seleccionada.misionId, 0)}
                    className="premium-btn-secondary"
                    style={{ flex: 1, padding: "0.8rem" }}
                  >
                    Mover a Pendiente
                  </button>
                )}

                {filtro !== 1 && (
                  <button 
                    onClick={() => cambiarEstado(seleccionada.usuarioId, seleccionada.misionId, 1)}
                    style={{ flex: 1, padding: "0.8rem", background: "var(--success)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Aprobar Misión
                  </button>
                )}

                {filtro !== 2 && (
                  <button 
                    onClick={() => cambiarEstado(seleccionada.usuarioId, seleccionada.misionId, 2)}
                    style={{ flex: 1, padding: "0.8rem", background: "var(--danger)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Rechazar Misión
                  </button>
                )}
                
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ValidacionesView;