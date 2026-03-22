import React, { useState, useEffect, useCallback } from "react";

const FilterSelect = ({ label, value, onChange, children }) => (
  <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</label>
    <select value={value} onChange={onChange} style={{
      padding: "8px 12px", borderRadius: "8px",
      border: "1px solid var(--border-color)",
      background: "var(--bg-main)", color: "var(--text-main)",
      fontSize: "0.85rem", outline: "none", cursor: "pointer"
    }}>
      {children}
    </select>
  </div>
);

const ActionBtn = ({ onClick, color = "var(--primary-dark)", children, style = {} }) => (
  <button onClick={onClick} style={{
    background: color, color: "#fff", border: "none",
    padding: "6px 14px", borderRadius: "6px",
    fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
    letterSpacing: "0.3px", transition: "opacity 0.15s",
    ...style
  }}
    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
  >{children}</button>
);

function AdminView({ baseURL }) {
  const [juegos, setJuegos] = useState([]);
  const [misiones, setMisiones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [filtroJuego, setFiltroJuego] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [misionesSeleccionadas, setMisionesSeleccionadas] = useState([]);

  const [formData, setFormData] = useState({
    ID: null, Nombre: "", Descripcion_mision: "", Puntos: 0,
    JuegoId: "", Grupo: "", Activa: true,
  });
  const [imagenes, setImagenes] = useState([]);
  const [nuevosArchivos, setNuevosArchivos] = useState([]);

  useEffect(() => {
    fetch(`${baseURL}/juegos`).then(r => r.json()).then(setJuegos).catch(console.error);
  }, [baseURL]);

  const cargarMisiones = useCallback(() => {
    fetch(`${baseURL}/misiones`).then(r => r.json()).then(setMisiones).catch(console.error);
  }, [baseURL]);

  useEffect(() => { cargarMisiones(); }, [cargarMisiones]);

  useEffect(() => {
    fetch(`${baseURL}/grupos`).then(r => r.json()).then(setGrupos).catch(console.error);
  }, [baseURL]);

  useEffect(() => {
    if (formData.ID) {
      Promise.all([
        fetch(`${baseURL}/imagenes/Misiones/${formData.ID}`).then(r => r.json()),
        fetch(`${baseURL}/misiones/${formData.ID}`).then(r => r.json()),
      ]).then(([imagenesData, misionData]) => {
        const principalId = misionData.Imagen_Principal;
        setImagenes(Array.isArray(imagenesData)
          ? imagenesData.map(img => ({ ...img, principal: img.ID === principalId }))
          : []);
      }).catch(console.error);
    } else {
      setImagenes([]);
    }
  }, [formData.ID, baseURL]);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleArchivosSeleccionados = (e) => {
    Array.from(e.target.files).forEach(archivo => {
      const reader = new FileReader();
      reader.onloadend = () => setNuevosArchivos(prev => [...prev, { archivo, preview: reader.result }]);
      reader.readAsDataURL(archivo);
    });
  };

  const eliminarArchivoSeleccionado = (index) =>
    setNuevosArchivos(prev => prev.filter((_, i) => i !== index));

  const toggleSeleccion = (e, id) => {
    e.stopPropagation();
    setMisionesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const cambiarEstadoMasivo = async (activar) => {
    if (!misionesSeleccionadas.length) return;
    if (!window.confirm(`¿Seguro que quieres ${activar ? "ACTIVAR" : "DESACTIVAR"} las ${misionesSeleccionadas.length} misiones seleccionadas?`)) return;
    try {
      await Promise.all(misionesSeleccionadas.map(id => {
        const m = misiones.find(x => x.ID === id);
        return fetch(`${baseURL}/misiones/${id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Nombre: m.Nombre, Descripcion_mision: m.Descripcion_mision, Puntos: m.Puntos, Juego: m.JuegoId || null, Grupo: m.Grupo || null, Activa: activar ? 1 : 0 }),
        });
      }));
      setMisionesSeleccionadas([]);
      cargarMisiones();
    } catch { alert("Error al actualizar las misiones."); }
  };

  const abrirFormularioNuevo = () => {
    setFormData({ ID: null, Nombre: "", Descripcion_mision: "", Puntos: 0, JuegoId: "", Grupo: "", Activa: true });
    setImagenes([]); setNuevosArchivos([]);
    setMostrarFormulario(true);
  };

  const editarMision = (m) => {
    setFormData({ ID: m.ID, Nombre: m.Nombre, Descripcion_mision: m.Descripcion_mision, Puntos: m.Puntos, JuegoId: m.JuegoId || "", Grupo: m.Grupo || "", Activa: m.Activa === 1 });
    setMostrarFormulario(true);
  };

  const subirImagenes = async () => {
    if (!formData.ID || !nuevosArchivos.length) return;
    const subidas = [];
    for (const fileObj of nuevosArchivos) {
      const res = await fetch(`${baseURL}/imagenes/nueva`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabla: "Misiones", registroId: formData.ID, imagenBase64: fileObj.preview.split(",")[1] }),
      });
      const data = await res.json();
      subidas.push({ ID: data.ID, Imagen: data.Imagen, principal: false });
    }
    setImagenes(prev => [...prev, ...subidas]);
    setNuevosArchivos([]);
  };

  const cambiarImagenPrincipal = async (imagenId) => {
    if (!formData.ID) return;
    await fetch(`${baseURL}/imagenes/principal`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabla: "Misiones", registroId: formData.ID, imagenId }),
    });
    setImagenes(prev => prev.map(img => ({ ...img, principal: img.ID === imagenId })));
  };

  const guardarMision = async () => {
    const metodo = formData.ID ? "PUT" : "POST";
    const url = formData.ID ? `${baseURL}/misiones/${formData.ID}` : `${baseURL}/misiones`;
    const res = await fetch(url, {
      method: metodo, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Nombre: formData.Nombre, Descripcion_mision: formData.Descripcion_mision, Puntos: formData.Puntos, Juego: formData.JuegoId || null, Grupo: formData.Grupo || null, Activa: formData.Activa ? 1 : 0 }),
    });
    const mision = await res.json();
    const misionId = formData.ID || mision.ID;
    setFormData(prev => ({ ...prev, ID: misionId }));
    if (nuevosArchivos.length > 0) await subirImagenes();
    cargarMisiones();
    setMostrarFormulario(false);
  };

  const eliminarMision = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la misión "${nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`${baseURL}/misiones/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMisiones(misiones.filter(m => m.ID !== id));
      setMisionesSeleccionadas(prev => prev.filter(mId => mId !== id));
    } else {
      const e = await res.json();
      alert(`No se pudo eliminar: ${e.error || "Error en el servidor"}`);
    }
  };

  const crearGrupo = async () => {
    const nombre = prompt("Nombre del nuevo grupo:");
    if (!nombre?.trim()) return;
    const res = await fetch(`${baseURL}/grupos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nombre.trim() }) });
    const data = await res.json();
    if (!data.id) { alert("No se pudo crear el grupo."); return; }
    setGrupos(prev => [...prev, { ID: data.id, Nombre: nombre.trim() }]);
    setFormData(prev => ({ ...prev, Grupo: data.id }));
  };

  const crearJuego = async () => {
    const nombre = prompt("Nombre del nuevo juego:");
    if (!nombre?.trim()) return;
    const esPokemon = window.confirm(`¿"${nombre}" es un juego de Pokémon?\n\nAceptar = SÍ  |  Cancelar = NO`);
    const res = await fetch(`${baseURL}/juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Nombre: nombre.trim(), Es_Pokemon: esPokemon ? 1 : 0 }) });
    const data = await res.json();
    if (!data.id) { alert("No se pudo crear el juego."); return; }
    setJuegos(prev => [...prev, { ID: data.id, Nombre: nombre.trim(), Es_Pokemon: esPokemon ? 1 : 0 }]);
    setFormData(prev => ({ ...prev, JuegoId: data.id }));
  };

  const misionesFiltradas = misiones.filter(m => {
    const ok1 = filtroJuego === "" || m.JuegoId === Number(filtroJuego);
    const ok2 = filtroGrupo === "" || m.Grupo === Number(filtroGrupo);
    const ok3 = filtroEstado === "" || m.Activa === Number(filtroEstado);
    return ok1 && ok2 && ok3;
  });

  const porJuego = misionesFiltradas.reduce((acc, m) => {
    const k = m.JuegoNombre || "Sin Juego Asignado";
    if (!acc[k]) acc[k] = [];
    acc[k].push(m);
    return acc;
  }, {});

  if (!mostrarFormulario) return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
            Administrar Misiones
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {misiones.length} misiones en total · {misiones.filter(m => m.Activa).length} activas
          </p>
        </div>
        <button onClick={abrirFormularioNuevo} style={{
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
          color: "#fff", border: "none", borderRadius: "10px",
          padding: "10px 20px", fontWeight: 800, fontSize: "0.85rem",
          cursor: "pointer", letterSpacing: "0.5px", display: "flex",
          alignItems: "center", gap: "8px", transition: "opacity 0.15s"
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Nueva misión
        </button>
      </div>

      <div style={{
        display: "flex", gap: "12px", flexWrap: "wrap",
        background: "var(--bg-card)", border: "1px solid var(--border-color)",
        borderRadius: "12px", padding: "16px 18px", marginBottom: "1.5rem"
      }}>
        <FilterSelect label="Juego" value={filtroJuego} onChange={e => setFiltroJuego(e.target.value)}>
          <option value="">Todos los juegos</option>
          {juegos.map(j => <option key={j.ID} value={j.ID}>{j.Nombre}</option>)}
        </FilterSelect>
        <FilterSelect label="Grupo" value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}>
          <option value="">Todos los grupos</option>
          {grupos.map(g => <option key={g.ID} value={g.ID}>{g.Nombre}</option>)}
        </FilterSelect>
        <FilterSelect label="Estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Activas e inactivas</option>
          <option value="1">Solo activas</option>
          <option value="0">Solo inactivas</option>
        </FilterSelect>
      </div>

      {misionesSeleccionadas.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-soft)", border: "1px solid var(--border-color)",
          borderLeft: "4px solid var(--primary)",
          borderRadius: "10px", padding: "12px 18px", marginBottom: "1.5rem"
        }}>
          <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.88rem" }}>
            {misionesSeleccionadas.length} misión{misionesSeleccionadas.length > 1 ? "es" : ""} seleccionada{misionesSeleccionadas.length > 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <ActionBtn onClick={() => cambiarEstadoMasivo(true)} color="var(--success)">Activar</ActionBtn>
            <ActionBtn onClick={() => cambiarEstadoMasivo(false)} color="var(--danger)">Desactivar</ActionBtn>
            <ActionBtn onClick={() => setMisionesSeleccionadas([])} color="var(--text-muted)">Limpiar</ActionBtn>
          </div>
        </div>
      )}

      {Object.keys(porJuego).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.keys(porJuego).map(nombreJuego => (
            <div key={nombreJuego}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ height: "1px", flex: 1, background: "var(--border-color)" }} />
                <span style={{
                  fontSize: "0.72rem", fontWeight: 800, letterSpacing: "1.5px",
                  color: "var(--primary)", textTransform: "uppercase", whiteSpace: "nowrap"
                }}>{nombreJuego}</span>
                <div style={{ height: "1px", flex: 1, background: "var(--border-color)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {porJuego[nombreJuego].map(m => {
                  const seleccionada = misionesSeleccionadas.includes(m.ID);
                  return (
                    <div
                      key={m.ID}
                      onClick={() => editarMision(m)}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        padding: "12px 16px",
                        background: seleccionada ? "var(--bg-soft)" : "var(--bg-card)",
                        border: `1px solid ${seleccionada ? "var(--primary)" : "var(--border-color)"}`,
                        borderLeft: `4px solid ${m.Activa ? "var(--success)" : "var(--border-color)"}`,
                        borderRadius: "10px", cursor: "pointer",
                        opacity: m.Activa ? 1 : 0.55,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.background = "var(--bg-soft)"; }}
                      onMouseLeave={e => { if (!seleccionada) e.currentTarget.style.background = "var(--bg-card)"; }}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionada}
                        onChange={e => toggleSeleccion(e, m.ID)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary)", flexShrink: 0 }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.Nombre}
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{m.Puntos} pts</span>
                          {m.GrupoNombre && (
                            <span style={{
                              fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px",
                              borderRadius: "20px", background: "var(--bg-soft)",
                              border: "1px solid var(--border-color)", color: "var(--text-muted)"
                            }}>{m.GrupoNombre}</span>
                          )}
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px", borderRadius: "20px",
                            background: m.Activa ? "rgba(var(--success-rgb, 39,174,96), 0.1)" : "rgba(0,0,0,0.05)",
                            border: `1px solid ${m.Activa ? "var(--success)" : "var(--border-color)"}`,
                            color: m.Activa ? "var(--success)" : "var(--text-muted)"
                          }}>
                            {m.Activa ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <ActionBtn onClick={() => editarMision(m)} color="var(--primary-dark)">Editar</ActionBtn>
                        <ActionBtn onClick={() => eliminarMision(m.ID, m.Nombre)} color="var(--danger)">Eliminar</ActionBtn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "14px", border: "1px dashed var(--border-color)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem", opacity: 0.4 }}>—</div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>No hay misiones con los filtros actuales</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "2rem" }}>
        <button onClick={() => setMostrarFormulario(false)} style={{
          background: "var(--bg-soft)", color: "var(--text-main)",
          border: "1px solid var(--border-color)", borderRadius: "8px",
          padding: "8px 14px", fontWeight: 700, fontSize: "0.82rem",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </button>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)" }}>
            {formData.ID ? "Editar misión" : "Nueva misión"}
          </h1>
          {formData.ID && <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>ID #{formData.ID}</p>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        <div
          onClick={() => setFormData(prev => ({ ...prev, Activa: !prev.Activa }))}
          style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "14px 18px",
            background: formData.Activa ? "rgba(var(--success-rgb,39,174,96),0.06)" : "var(--bg-soft)",
            border: `1px solid ${formData.Activa ? "var(--success)" : "var(--border-color)"}`,
            borderRadius: "10px", cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <div style={{
            width: "38px", height: "22px", borderRadius: "11px",
            background: formData.Activa ? "var(--success)" : "var(--border-color)",
            position: "relative", flexShrink: 0, transition: "background 0.2s"
          }}>
            <div style={{
              position: "absolute", top: "3px",
              left: formData.Activa ? "19px" : "3px",
              width: "16px", height: "16px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s"
            }} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: formData.Activa ? "var(--success)" : "var(--text-muted)" }}>
              {formData.Activa ? "Misión activa" : "Misión inactiva"}
            </span>
            <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
              {formData.Activa ? "Visible para los participantes" : "Oculta para los participantes"}
            </span>
          </div>
        </div>

        {[
          { label: "Nombre de la misión", name: "Nombre", type: "text", placeholder: "Ej: Capturar el primer Pokémon" },
          { label: "Puntos", name: "Puntos", type: "number", placeholder: "0" },
        ].map(field => (
          <div key={field.name}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
              {field.label}
            </label>
            <input
              type={field.type} name={field.name}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={handleChange}
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 14px",
                borderRadius: "8px", border: "1px solid var(--border-color)",
                background: "var(--bg-main)", color: "var(--text-main)",
                fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border-color)"}
            />
          </div>
        ))}

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
            Descripción
          </label>
          <textarea
            name="Descripcion_mision"
            placeholder="Instrucciones para el participante..."
            value={formData.Descripcion_mision}
            onChange={handleChange}
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 14px",
              borderRadius: "8px", border: "1px solid var(--border-color)",
              background: "var(--bg-main)", color: "var(--text-main)",
              fontSize: "0.88rem", outline: "none", resize: "vertical",
              transition: "border-color 0.2s", fontFamily: "inherit", lineHeight: 1.5
            }}
            onFocus={e => e.target.style.borderColor = "var(--primary)"}
            onBlur={e => e.target.style.borderColor = "var(--border-color)"}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { label: "Juego", name: "JuegoId", items: juegos, onCreate: crearJuego, placeholder: "Selecciona un juego" },
            { label: "Grupo", name: "Grupo", items: grupos, onCreate: crearGrupo, placeholder: "Selecciona un grupo" },
          ].map(sel => (
            <div key={sel.name}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                {sel.label}
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  name={sel.name} value={formData[sel.name]} onChange={handleChange}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-main)", color: "var(--text-main)",
                    fontSize: "0.85rem", outline: "none"
                  }}
                >
                  <option value="">{sel.placeholder}</option>
                  {sel.items.map(item => <option key={item.ID} value={item.ID}>{item.Nombre}</option>)}
                </select>
                <button onClick={sel.onCreate} title={`Crear nuevo ${sel.label.toLowerCase()}`} style={{
                  background: "var(--bg-soft)", color: "var(--primary)", border: "1px solid var(--border-color)",
                  borderRadius: "8px", width: "36px", flexShrink: 0,
                  fontWeight: 900, fontSize: "1.1rem", cursor: "pointer"
                }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {!formData.ID && (
          <button onClick={guardarMision} style={{
            marginTop: "8px", padding: "12px",
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            color: "#fff", border: "none", borderRadius: "10px",
            fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
            letterSpacing: "0.5px", transition: "opacity 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Guardar y añadir imágenes
          </button>
        )}

        {formData.ID && (
          <div style={{
            background: "var(--bg-soft)", border: "1px solid var(--border-color)",
            borderRadius: "12px", padding: "20px"
          }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "0.88rem", fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Imágenes
            </h3>

            <label style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "var(--bg-card)", border: "1px dashed var(--border-color)",
              borderRadius: "8px", padding: "10px 16px",
              fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)",
              cursor: "pointer", transition: "border-color 0.2s"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Seleccionar imágenes
              <input type="file" multiple onChange={handleArchivosSeleccionados} style={{ display: "none" }} />
            </label>

            {(imagenes.length > 0 || nuevosArchivos.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px", marginTop: "14px" }}>
                {imagenes.map(img => (
                  <div key={img.ID} style={{
                    borderRadius: "8px", overflow: "hidden", position: "relative",
                    border: `2px solid ${img.principal ? "var(--primary)" : "var(--border-color)"}`,
                    background: "var(--bg-card)"
                  }}>
                    <img src={`data:image/png;base64,${img.Imagen}`} alt="misión" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    <button onClick={() => cambiarImagenPrincipal(img.ID)} disabled={img.principal} style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "4px 0", fontSize: "0.6rem", fontWeight: 700,
                      background: img.principal ? "var(--primary)" : "rgba(0,0,0,0.55)",
                      color: "#fff", border: "none", cursor: img.principal ? "default" : "pointer",
                      letterSpacing: "0.5px"
                    }}>
                      {img.principal ? "PRINCIPAL" : "Establecer"}
                    </button>
                  </div>
                ))}

                {nuevosArchivos.map((fileObj, index) => (
                  <div key={index} style={{ borderRadius: "8px", overflow: "hidden", position: "relative", border: "2px dashed var(--primary)", background: "var(--bg-card)" }}>
                    <img src={fileObj.preview} alt="preview" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", opacity: 0.7 }} />
                    <button onClick={() => eliminarArchivoSeleccionado(index)} style={{
                      position: "absolute", top: "4px", right: "4px",
                      background: "var(--danger)", color: "#fff", border: "none",
                      borderRadius: "50%", width: "22px", height: "22px",
                      fontSize: "0.75rem", fontWeight: 900, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>×</button>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 0", fontSize: "0.6rem", fontWeight: 700, color: "#fff", textAlign: "center", background: "var(--primary)", letterSpacing: "0.5px" }}>NUEVA</div>
                  </div>
                ))}
              </div>
            )}

            {nuevosArchivos.length > 0 && (
              <button onClick={subirImagenes} style={{
                marginTop: "12px", width: "100%", padding: "10px",
                background: "var(--success)", color: "#fff", border: "none",
                borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
              }}>
                Confirmar subida ({nuevosArchivos.length} imagen{nuevosArchivos.length > 1 ? "es" : ""})
              </button>
            )}
          </div>
        )}

        {formData.ID && (
          <button onClick={guardarMision} style={{
            padding: "13px", marginTop: "4px",
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            color: "#fff", border: "none", borderRadius: "10px",
            fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
            letterSpacing: "0.5px", transition: "opacity 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Actualizar misión
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminView;