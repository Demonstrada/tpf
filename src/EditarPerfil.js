import React, { useState, useEffect } from "react";

// Estilos CSS Inline para asegurar que se aplican y solucionan el problema YA
const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Fondo oscuro semitransparente
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px", // Margen de seguridad para pantallas pequeñas
    boxSizing: "border-box",
  },
  modal: {
    backgroundColor: "#161b22", // Fondo oscuro (estilo GitHub Dark)
    color: "#c9d1d9",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "800px", // Ancho máximo
    maxHeight: "90vh", // Alto máximo del 90% de la ventana
    display: "flex",
    flexDirection: "column",
    border: "1px solid #30363d",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    position: "relative",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    overflow: "hidden", // Evita scroll en el contenedor principal
  },
  header: {
    padding: "15px 20px",
    borderBottom: "1px solid #30363d",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#f0f6fc",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#8b949e",
    fontSize: "24px",
    cursor: "pointer",
    padding: "0",
    lineHeight: "1",
  },
  body: {
    padding: "20px",
    overflowY: "auto", // Scroll SOLO aquí si el contenido es muy alto
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // Dos columnas: Datos | Imagen
    gap: "20px",
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#f0f6fc",
    borderBottom: "1px solid #30363d",
    paddingBottom: "8px",
  },
  inputGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.9rem",
    color: "#8b949e",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  galleryContainer: {
    display: "flex",
    flexDirection: "column",
  },
  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
    gap: "10px",
    marginBottom: "15px",
    maxHeight: "200px", // Limitamos la altura de la galería
    overflowY: "auto", // Scroll interno en la galería si hay muchas fotos
    padding: "5px",
    backgroundColor: "#0d1117",
    borderRadius: "6px",
    border: "1px solid #30363d",
  },
  galleryItem: {
    aspectRatio: "1",
    borderRadius: "6px",
    overflow: "hidden",
    cursor: "pointer",
    border: "2px solid transparent",
    position: "relative",
    transition: "border-color 0.2s",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  badgePrincipal: {
    position: "absolute",
    top: "2px",
    right: "2px",
    backgroundColor: "#238636",
    color: "white",
    fontSize: "10px",
    padding: "2px 5px",
    borderRadius: "4px",
    fontWeight: "bold",
  },
  uploadZone: {
    marginTop: "auto", // Empuja la zona de subida al final
  },
  fileLabel: {
    display: "block",
    padding: "10px",
    backgroundColor: "#21262d",
    border: "1px dashed #30363d",
    borderRadius: "6px",
    color: "#8b949e",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  footer: {
    padding: "15px 20px",
    borderTop: "1px solid #30363d",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    backgroundColor: "#161b22",
  },
  btnPrimary: {
    padding: "8px 16px",
    backgroundColor: "#238636",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  btnSecondary: {
    padding: "8px 16px",
    backgroundColor: "#21262d",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95rem",
  }
};

export default function EditarPerfil({ usuarioData, setUsuarioData, onClose, baseURL }) {
  const [nuevoNombre, setNuevoNombre] = useState(usuarioData?.nombre || "");
  const [nuevoUsuario, setNuevoUsuario] = useState(usuarioData?.usuario || "");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [imagenesGaleria, setImagenesGaleria] = useState([]);
  const [nuevoArchivo, setNuevoArchivo] = useState(null);

  useEffect(() => {
    fetch(`${baseURL}/imagenes/usuarios/${usuarioData.id}`)
      .then((res) => res.json())
      .then((data) => setImagenesGaleria(data))
      .catch((err) => console.error("Error al cargar imágenes: - EditarPerfil.js:185", err));
  }, [baseURL, usuarioData.id]);

  const guardarPerfil = () => {
    if (nuevaContrasena && nuevaContrasena !== confirmarContrasena) {
      alert("❌ Las contraseñas no coinciden");
      return;
    }
    fetch(`${baseURL}/usuarios/${usuarioData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre, usuario: nuevoUsuario, contrasena: nuevaContrasena || "" }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Error en el servidor");
        return res.json();
      })
      .then(() => {
        alert("✅ Perfil actualizado");
        setUsuarioData({ ...usuarioData, nombre: nuevoNombre, usuario: nuevoUsuario });
        onClose();
      })
      .catch(() => alert("Hubo un error al actualizar."));
  };

  const asignarImagenPrincipal = (imagenId) => {
    fetch(`${baseURL}/imagenes/principal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: usuarioData.id, tabla: "usuarios", registroId: usuarioData.id, imagenId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Error asignando principal");
        return res.json();
      })
      .then(() => {
        const img = imagenesGaleria.find((img) => img.ID === imagenId);
        if (img) setUsuarioData({ ...usuarioData, Imagen_Principal: img.Imagen });
      })
      .catch(() => alert("Error al asignar imagen principal."));
  };

  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onloadend = () => setNuevoArchivo({ file: archivo, base64: reader.result.split(",")[1] });
    reader.readAsDataURL(archivo);
  };

  const subirNuevaImagen = () => {
    if (!nuevoArchivo) return;
    fetch(`${baseURL}/imagenes/nueva`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabla: "usuarios", registroId: usuarioData.id, imagenBase64: nuevoArchivo.base64 }),
    })
      .then((res) => res.json())
      .then((data) => {
        setImagenesGaleria([...imagenesGaleria, { ID: data.ID, Imagen: data.Imagen || nuevoArchivo.base64 }]);
        setNuevoArchivo(null);
      });
  };

  return (
    <div style={modalStyles.backdrop} onClick={onClose}>
      {/* Detenemos la propagación del click para no cerrar el modal al pinchar dentro */}
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>

        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Configuración de Perfil</h3>
          <button style={modalStyles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={modalStyles.body}>

          {/* COLUMNA 1: DATOS */}
          <div>
            <h4 style={modalStyles.sectionTitle}>Datos de Acceso</h4>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Nombre</label>
              <input type="text" style={modalStyles.input} value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
            </div>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Usuario</label>
              <input type="text" style={modalStyles.input} value={nuevoUsuario} onChange={(e) => setNuevoUsuario(e.target.value)} />
            </div>

            <h4 style={modalStyles.sectionTitle}>Cambiar Contraseña</h4>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Nueva Contraseña</label>
              <input type="password" style={modalStyles.input} placeholder="Dejar en blanco para no cambiar" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} />
            </div>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Confirmar</label>
              <input type="password" style={modalStyles.input} value={confirmarContrasena} onChange={(e) => setConfirmarContrasena(e.target.value)} />
            </div>
          </div>

          {/* COLUMNA 2: IMAGEN */}
          <div style={modalStyles.galleryContainer}>
            <h4 style={modalStyles.sectionTitle}>Avatar (Doble clic = Principal)</h4>
            <div style={modalStyles.galleryGrid} className="custom-scrollbar">
              {imagenesGaleria.map((img) => {
                const esPrincipal = usuarioData?.Imagen_Principal === img.Imagen;
                return (
                  <div
                    key={img.ID}
                    style={{
                      ...modalStyles.galleryItem,
                      borderColor: esPrincipal ? "#238636" : "transparent",
                      boxShadow: esPrincipal ? "0 0 10px rgba(35, 134, 54, 0.5)" : "none"
                    }}
                    onDoubleClick={() => asignarImagenPrincipal(img.ID)}
                  >
                    {esPrincipal && <span style={modalStyles.badgePrincipal}>✓</span>}
                    <img src={`data:image/png;base64,${img.Imagen}`} alt="Avatar" style={modalStyles.galleryImage} />
                  </div>
                )
              })}
            </div>

            <div style={modalStyles.uploadZone}>
              <input type="file" id="file-upload-compact" onChange={handleArchivoSeleccionado} accept="image/*" hidden />
              <label htmlFor="file-upload-compact" style={modalStyles.fileLabel}>
                {nuevoArchivo ? `📂 ${nuevoArchivo.file.name}` : "📁 Subir nueva imagen..."}
              </label>

              {nuevoArchivo && (
                <button onClick={subirNuevaImagen} style={{ ...modalStyles.btnSecondary, width: "100%", marginTop: "10px", borderColor: "#238636", color: "#f0f6fc" }}>
                  ⬆️ Confirmar Subida
                </button>
              )}
            </div>
          </div>

        </div>

        <div style={modalStyles.footer}>
          <button style={modalStyles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={modalStyles.btnPrimary} onClick={guardarPerfil}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}