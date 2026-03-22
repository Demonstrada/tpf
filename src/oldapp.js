import "./App.css";
import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import ParticipantesView from "./ParticipantesView";

function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [usuarioData, setUsuarioData] = useState(null);
  const [misiones, setMisiones] = useState([]);
  const [activeTab, setActiveTab] = useState("general");
  const [galeriaVisible, setGaleriaVisible] = useState(false);
  const [imagenesGaleria, setImagenesGaleria] = useState([]);
  const [galeriaTabla, setGaleriaTabla] = useState("");
  const [galeriaRegistroId, setGaleriaRegistroId] = useState(null);
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const [seleccionadaId, setSeleccionadaId] = useState(null);

  const [misionForm, setMisionForm] = useState({
    ID: null,
    Nombre: "",
    Puntos: 0,
    tipo: "",
    juegoId: "",
    grupoId: "",
    Descripcion_mision: "",
  });

  const baseURL = "http://localhost:5000";

  // ---------- MANEJO DE VISTAS ----------
  const handleChangeVista = (vista) => {
    if (vista === "dashboard") setActiveTab("general");
    else setActiveTab(vista);
  };

  // ---------- LOGIN ----------
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseURL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });
      const data = await res.json();
      if (data.success) {
        setUsuarioData(data);
      } else {
        setMensaje("❌ Usuario o contraseña incorrectos");
      }
    } catch (err) {
      console.error("Error en login:  App.js:54 - oldAPP.JS:54", err);
      setMensaje("Error en el servidor");
    }
  };

  // ---------- TRAER MISIONES ----------
  useEffect(() => {
    if (usuarioData) {
      fetch(`${baseURL}/misiones/${usuarioData.id}/${usuarioData.juegoId}`)
        .then((res) => res.json())
        .then((data) => setMisiones(Array.isArray(data) ? data : []))
        .catch((err) =>
          console.error("Error cargando misiones:  App.js:66 - oldAPP.JS:66", err)
        );
    }
  }, [usuarioData]);

  const misionesPorTipo = Array.isArray(misiones)
    ? misiones.reduce((acc, m) => {
        if (!acc[m.tipo]) acc[m.tipo] = [];
        acc[m.tipo].push(m);
        return acc;
      }, {})
    : {};

  // ---------- CRUD MISIONES ADMIN ----------
  const handleMisionFormChange = (e) => {
    setMisionForm({ ...misionForm, [e.target.name]: e.target.value });
  };

  const guardarMision = () => {
    const metodo = misionForm.ID ? "PUT" : "POST";
    fetch(`${baseURL}/admin/misiones`, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(misionForm),
    })
      .then((res) => res.json())
      .then(() => {
        alert(misionForm.ID ? "Misión modificada" : "Misión creada");
        setMisionForm({
          ID: null,
          Nombre: "",
          Puntos: 0,
          tipo: "",
          juegoId: "",
          grupoId: "",
          Descripcion_mision: "",
        });
        return fetch(
          `${baseURL}/misiones/${usuarioData.id}/${usuarioData.juegoId}`
        );
      })
      .then((res) => res.json())
      .then((data) => setMisiones(Array.isArray(data) ? data : []))
      .catch((err) =>
        console.error("Error guardando misión:  App.js:110 - oldAPP.JS:110", err)
      );
  };

  const editarMision = (m) => {
    setMisionForm(m);
    setActiveTab("admin");
  };

  // ---------- FUNCIONES GALERÍA ----------
  const abrirGaleria = (tabla, registroId) => {
    fetch(`${baseURL}/imagenes/${tabla}/${registroId}`)
      .then((res) => res.json())
      .then((data) => {
        setImagenesGaleria(data);
        setGaleriaTabla(tabla);
        setGaleriaRegistroId(registroId);
        setGaleriaVisible(true);
      })
      .catch((err) =>
        console.error("Error al abrir galería:  App.js:130 - oldAPP.JS:130", err)
      );
  };

  const asignarImagenPrincipal = (imagenId) => {
    if (!usuarioData) return;
    fetch(`${baseURL}/imagenes/principal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId: usuarioData.id,
        tabla: galeriaTabla,
        registroId: galeriaRegistroId,
        imagenId,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error asignando imagen principal");
        }
        return res.json();
      })
      .then(() => {
        const img = imagenesGaleria.find((i) => i.ID === imagenId);
        if (!img) return;
        if (galeriaTabla === "usuarios") {
          setUsuarioData({ ...usuarioData, Imagen_Principal: img.Imagen });
        } else if (galeriaTabla === "Misiones") {
          setMisiones(
            misiones.map((m) =>
              m.ID === galeriaRegistroId
                ? { ...m, Imagen_Principal: img.Imagen }
                : m
            )
          );
        }
        setGaleriaVisible(false);
      })
      .catch((err) => {
        console.error("Error asignando imagen principal:  App.js:170 - oldAPP.JS:170", err);
        alert("Error al asignar imagen principal");
      });
  };

  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onloadend = () => setNuevoArchivo(reader.result.split(",")[1]);
    reader.readAsDataURL(archivo);
  };

  const subirNuevaImagen = () => {
    if (!nuevoArchivo) return;
    fetch(`${baseURL}/imagenes/nueva`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tabla: galeriaTabla,
        registroId: galeriaRegistroId,
        imagenBase64: nuevoArchivo,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setImagenesGaleria([
          ...imagenesGaleria,
          { ID: data.ID, Imagen: data.Imagen },
        ]);
        setNuevoArchivo(null);
      })
      .catch((err) =>
        console.error("Error subiendo imagen:  App.js:203 - oldAPP.JS:203", err)
      );
  };

  // ---------- VISTA LOGIN ----------
  if (!usuarioData) {
    return (
      <div className="App">
        <div className="login-card">
          <h2>Login TPF</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            <button type="submit">Entrar</button>
          </form>
          {mensaje && <p className="mensaje">{mensaje}</p>}
        </div>
      </div>
    );
  }

  // ---------- VISTA DASHBOARD ----------
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div
          className="user-info"
          style={{ cursor: "pointer" }}
          onClick={() => abrirGaleria("usuarios", usuarioData.id)}
        >
          {usuarioData.Imagen_Principal ? (
            <img
              src={`data:image/png;base64,${usuarioData.Imagen_Principal}`}
              alt="Usuario"
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar placeholder">?</div>
          )}
          <h3>{usuarioData.nombre}</h3>
        </div>

        <nav>
          <ul>
            <li className="menu-item">Equipo</li>
            <li className="menu-item">Misiones</li>
            {usuarioData.administrador === 1 && (
              <li className="menu-item">Admin</li>
            )}
          </ul>
        </nav>
      </aside>

      <main className="content">
        <h2>Misiones del juego {usuarioData.juegoNombre}</h2>

        {Object.keys(misionesPorTipo).map((tipo) => (
          <div key={tipo} className="misiones-section">
            <h3>{tipo}</h3>
            <div className="misiones-grid">
              {misionesPorTipo[tipo].map((m) => (
                <div key={m.ID} className="mision-card">
                  <div className="mision-puntos">{m.Puntos || 0} pts</div>
                  {m.Imagen_Principal ? (
                    <img
                      src={`data:image/png;base64,${m.Imagen_Principal}`}
                      alt={m.Nombre}
                      className="mision-imagen"
                    />
                  ) : (
                    <div className="placeholder-imagen">No hay imagen</div>
                  )}
                  <p>{m.Nombre}</p>
                  <div className="check-validada">
                    <input type="checkbox" checked={m.Validada} readOnly />
                    <label>
                      {m.Validada ? "Validada" : "No validada"}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ADMIN */}
        {activeTab === "admin" && usuarioData.administrador === 1 && (
          <>
            <h2>Panel de Administración</h2>
            <div className="admin-form">
              <input
                name="Nombre"
                placeholder="Nombre de misión"
                value={misionForm.Nombre}
                onChange={handleMisionFormChange}
              />
              <input
                name="Puntos"
                type="number"
                placeholder="Puntos"
                value={misionForm.Puntos}
                onChange={handleMisionFormChange}
              />
              <input
                name="tipo"
                placeholder="Tipo"
                value={misionForm.tipo}
                onChange={handleMisionFormChange}
              />
              <input
                name="juegoId"
                placeholder="Juego ID"
                value={misionForm.juegoId}
                onChange={handleMisionFormChange}
              />
              <input
                name="grupoId"
                placeholder="Grupo ID"
                value={misionForm.grupoId}
                onChange={handleMisionFormChange}
              />
              <textarea
                name="Descripcion_mision"
                placeholder="Descripción"
                value={misionForm.Descripcion_mision}
                onChange={handleMisionFormChange}
              />
              <button onClick={guardarMision}>
                {misionForm.ID ? "Modificar" : "Crear"} misión
              </button>
            </div>
          </>
        )}

        {/* PARTICIPANTES */}
        {activeTab === "participantes" && usuarioData.administrador === 1 && (
          <ParticipantesView baseURL={baseURL} />
        )}

        {/* GALERÍA */}
        {galeriaVisible && (
          <>
            <div
              className="galeria-backdrop"
              onClick={() => setGaleriaVisible(false)}
            />
            <div className="galeria-modal">
              <button
                className="cerrar-btn"
                onClick={() => setGaleriaVisible(false)}
              >
                ×
              </button>
              <h3>Galería</h3>
              <div className="galeria-grid">
                {imagenesGaleria.map((img) => (
                  <div
                    key={img.ID}
                    className={`galeria-item ${
                      img.ID === seleccionadaId ? "selected" : ""
                    }`}
                    onClick={() => setSeleccionadaId(img.ID)}
                    onDoubleClick={() => asignarImagenPrincipal(img.ID)}
                  >
                    <img
                      src={`data:image/png;base64,${img.Imagen}`}
                      alt="galeria"
                    />
                  </div>
                ))}
              </div>
              <div className="subir-imagen">
                <input type="file" onChange={handleArchivoSeleccionado} />
                <button onClick={subirNuevaImagen}>Subir nueva imagen</button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
