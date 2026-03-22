import React from "react";

function Sidebar({ usuarioData, onChangeVista, onAbrirGaleria, onLogout, onChangeTheme }) {

  const temas = [
    { id: 1, nombre: "Picu", gradient: "linear-gradient(135deg, #ff9ff3, #a29bfe)" },
    { id: 2, nombre: "Mar", gradient: "linear-gradient(135deg, #4fc3f7, #1a6fb5)" },
    { id: 3, nombre: "Bosque", gradient: "linear-gradient(135deg, #34d399, #0f766e)" },
    { id: 4, nombre: "Noche", gradient: "linear-gradient(135deg, #818cf8, #1e1b4b)" },
    { id: 5, nombre: "Combate", gradient: "radial-gradient(circle at center, #ff4757, #1a1e24)" },
  ];

  const mostrarCombates = usuarioData?.esPokemon === 1;

  return (
    <aside className="sidebar">
      <div className="user-info">
        <div style={{ cursor: "pointer" }} onClick={() => onAbrirGaleria("usuarios", usuarioData.id)}>
          {usuarioData.Imagen_Principal ? (
            <img src={`data:image/png;base64,${usuarioData.Imagen_Principal}`} alt="Usuario" className="user-avatar" />
          ) : (
            <div className="user-avatar placeholder">?</div>
          )}
        </div>
        <h3 style={{ cursor: "pointer" }} onClick={() => onChangeVista("dashboard")}>
          {usuarioData.nombre}
        </h3>
      </div>

      <nav style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
        <ul style={{ flex: 1, padding: 0, margin: 0, listStyle: "none" }}>

          <li className="menu-item" onClick={() => onChangeVista("dashboard")}>
            Misiones
          </li>

          <li className="menu-item" onClick={() => onChangeVista("torneos")}>
            Torneos
          </li>

          {mostrarCombates && (
            <li className="menu-item" onClick={() => onChangeVista("mis-combates")}>
              Mis Combates
            </li>

          )}

          {usuarioData.administrador === 1 && (
            <>
              <li style={{
                marginTop: "20px",
                marginBottom: "10px",
                borderTop: "1px dashed rgba(255,255,255,0.3)",
                paddingTop: "15px",
                pointerEvents: "none"
              }}>
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  paddingLeft: "0px"
                }}>
                </span>
              </li>

              <li className="menu-item" onClick={() => onChangeVista("validaciones")}>
                Validar Misiones
              </li>
              <li className="menu-item" onClick={() => onChangeVista("replay")}>
                Analizar Combates
              </li>
              <li className="menu-item" onClick={() => onChangeVista("admin")}>
                Administrar Misiones
              </li>
              <li className="menu-item" onClick={() => onChangeVista("participantes")}>
                Administrar Participantes
              </li>
              <li className="menu-item" onClick={() => onChangeVista("admin-eventos")}>
                Administrar Eventos
              </li>
            </>
          )}
        </ul>

        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "15px", width: "100%" }}>

          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "1px", color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "10px" }}>
              TEMA
            </span>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              {temas.map(tema => {
                const isActive = usuarioData?.tema === tema.id;
                return (
                  <div
                    key={tema.id}
                    title={tema.nombre}
                    onClick={() => onChangeTheme && onChangeTheme(tema.id)}
                    style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: tema.gradient, cursor: "pointer",
                      border: isActive ? "2px solid #ffffff" : "2px solid transparent",
                      boxShadow: isActive ? "0 0 10px rgba(255,255,255,0.6)" : "0 2px 4px rgba(0,0,0,0.2)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      transform: isActive ? "scale(1.1)" : "scale(1)"
                    }}
                    onMouseOver={e => { if (!isActive) e.currentTarget.style.transform = "scale(1.15)"; }}
                    onMouseOut={e => { if (!isActive) e.currentTarget.style.transform = "scale(1)"; }}
                  />
                );
              })}
            </div>
          </div>

          <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
            <li
              className="menu-item"
              onClick={onLogout}
              style={{ background: "rgba(255,107,107,0.2)", color: "#ffeaea", margin: 0 }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,107,107,0.4)"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(255,107,107,0.2)"}
            >
              Salir
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;