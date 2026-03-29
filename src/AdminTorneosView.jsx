import React, { useState, useEffect, useCallback } from "react";
import TorneoView from "./TorneoView";

const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "10px 14px",
    borderRadius: "8px", border: "1px solid var(--border-color)",
    background: "var(--bg-main)", color: "var(--text-main)",
    fontSize: "0.88rem", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit",
};

// Componente Field mejorado para que empuje los inputs hacia abajo si el texto varía de tamaño
const Field = ({ label, hint, children }) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
            {label}
            {hint && <span style={{ display: "block", fontWeight: 400, textTransform: "none", opacity: 0.7, marginTop: "2px" }}>{hint}</span>}
        </label>
        <div style={{ marginTop: "auto" }}>
            {children}
        </div>
    </div>
);

function Modal({ title, subtitle, onClose, onSubmit, submitLabel, children }) {
    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "var(--premium-backdrop, rgba(0,0,0,0.5))", backdropFilter: "blur(4px)" }} />
            <div style={{ position: "fixed", inset: 0, zIndex: 9001, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", pointerEvents: "none" }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", pointerEvents: "auto", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
                    <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontWeight: 700 }}>×</button>
                    <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                        <h2 style={{ margin: "0 0 3px", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>{title}</h2>
                        {subtitle && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{subtitle}</p>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>{children}</div>
                    {onSubmit && (
                        <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                            <button onClick={onSubmit} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", border: "none", borderRadius: "9px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}>{submitLabel || "Guardar"}</button>
                            <button onClick={onClose} style={{ padding: "11px 20px", background: "var(--bg-soft)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "9px", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function AdminTorneosView({ baseURL, usuarioData }) {
    const [torneos, setTorneos] = useState([]);
    const [juegos, setJuegos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = usuarioData?.administrador === 1;

    // Navegación
    const [torneoActivo, setTorneoActivo] = useState(null); // torneo para ver bracket

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalEquipo, setModalEquipo] = useState(null); // torneo al que añadir equipo
    const [confirmarIniciar, setConfirmarIniciar] = useState(null); // torneo a iniciar

    // Control de Inscripciones y Usuarios
    const [usuariosInscritos, setUsuariosInscritos] = useState([]); // para bloquear duplicados
    const [miEquipoActual, setMiEquipoActual] = useState(null); // Si el usuario ya está en un equipo
    const [modoInscripcion, setModoInscripcion] = useState("crear"); // "crear" o "unirse"
    const [equiposIncompletos, setEquiposIncompletos] = useState([]); // Equipos de 1 persona esperando compañero
    const [equipoSeleccionado, setEquipoSeleccionado] = useState("");

    // Forms
    const [formTorneo, setFormTorneo] = useState({
        ID: null, Nombre: "", Modo: "1v1", Tipo_Bracket: "double", ID_Juego: "", Participantes: 8,
        Rondas_Partida: 3, Final_Rondas_Distintas: false, Final_Rondas: 5, Aleatorio: false,
        Puntos_Por_Victoria: 0, Puntos_Ganador_Torneo: 0
    });
    const [formEquipo, setFormEquipo] = useState({ Nombre: "", jugadores: [""] });
    const [formEdicionEquipo, setFormEdicionEquipo] = useState({ Nombre: "", ID_Capitan: "" });

    // ── CARGA ─────────────────────────────────────────────────────────────────
    const cargarTorneos = useCallback(() => {
        setLoading(true);
        fetch(`${baseURL}/torneos`).then(r => r.json())
            .then(data => { setTorneos(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [baseURL]);

    useEffect(() => {
        cargarTorneos();

        fetch(`${baseURL}/juegos`)
            .then(r => r.json())
            .then(data => setJuegos(data.filter(j => j.Es_Pokemon === 1)))
            .catch(console.error);

        fetch(`${baseURL}/usuarios/lista-simple`)
            .then(r => r.json())
            .then(setUsuarios)
            .catch(console.error);
    }, [baseURL, cargarTorneos]);

    // ── CREAR / EDITAR TORNEO ─────────────────────────────────────────────────
    const abrirModalCrear = () => {
        setFormTorneo({ ID: null, Nombre: "", Modo: "1v1", ID_Juego: "", Participantes: 8, Rondas_Partida: 3, Final_Rondas_Distintas: false, Final_Rondas: 5, Aleatorio: false, Puntos_Por_Victoria: 0, Puntos_Ganador_Torneo: 0 });
        setModalCrear(true);
    };

    const abrirModalEditar = (t) => {
        setFormTorneo({
            ID: t.ID, Nombre: t.Nombre, Modo: t.Modo, ID_Juego: t.ID_Juego || "",
            Participantes: t.Participantes, Rondas_Partida: t.Rondas_Partida || 3,
            Final_Rondas_Distintas: t.Final_Rondas_Distintas === 1, Final_Rondas: t.Final_Rondas || 5,
            Aleatorio: t.Aleatorio === 1, Puntos_Por_Victoria: t.Puntos_Por_Victoria || 0, Puntos_Ganador_Torneo: t.Puntos_Ganador_Torneo || 0
        });
        setModalCrear(true);
    };

    const handleGuardarTorneo = async () => {
        if (!formTorneo.Nombre.trim()) return alert("El nombre es obligatorio.");

        const method = formTorneo.ID ? "PUT" : "POST";
        const url = formTorneo.ID ? `${baseURL}/torneos/${formTorneo.ID}` : `${baseURL}/torneos`;

        const res = await fetch(url, {
            method: method, headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formTorneo)
        });

        const data = await res.json();
        if (data.success) {
            setModalCrear(false);
            cargarTorneos();
        } else {
            alert(data.error || "Error al guardar torneo");
        }
    };

    // ── AÑADIR EQUIPO Y EVITAR DUPLICADOS ─────────────────────────────────────
    const abrirModalEquipo = async (t) => {
        setModalEquipo(t);
        setFormEquipo({ Nombre: "", jugadores: Array(t.Modo === '2v2' ? 2 : 1).fill("") });
        setUsuariosInscritos([]);
        setEquiposIncompletos([]);
        setMiEquipoActual(null);
        setModoInscripcion("crear");
        setEquipoSeleccionado("");

        try {
            const res = await fetch(`${baseURL}/torneos/${t.ID}/bracket`);
            if (res.ok) {
                const data = await res.json();
                if (data.equipos) {
                    let inscritos = [];
                    let incompletos = [];
                    let elMio = null;

                    data.equipos.forEach(eq => {
                        let idsEnEquipo = [];

                        if (eq.Jugadores_IDs) {
                            const ids = typeof eq.Jugadores_IDs === 'string' ? eq.Jugadores_IDs.split(',') : eq.Jugadores_IDs;
                            idsEnEquipo = ids.map(id => String(id).trim());
                            inscritos.push(...idsEnEquipo);
                        } else if (eq.Jugadores) {
                            const nombres = eq.Jugadores.split(',').map(n => n.trim());
                            nombres.forEach(n => {
                                const u = usuarios.find(user => user.Nombre === n);
                                if (u) {
                                    inscritos.push(String(u.ID));
                                    idsEnEquipo.push(String(u.ID));
                                }
                            });
                        }

                        if (idsEnEquipo.includes(String(usuarioData.id))) {
                            elMio = { ...eq, ids: idsEnEquipo };
                        }

                        if (t.Modo === '2v2' && idsEnEquipo.length === 1) {
                            incompletos.push(eq);
                        }
                    });

                    setUsuariosInscritos(inscritos);
                    setEquiposIncompletos(incompletos);
                    if (elMio) {
                        setMiEquipoActual(elMio);
                        setFormEdicionEquipo({ Nombre: elMio.Nombre, ID_Capitan: elMio.ids[0] });
                    }
                }
            }
        } catch (err) {
            console.error("Error al cargar jugadores inscritos:", err);
        }
    };

    const handleAñadirEquipo = async () => {
        if (isAdmin) {
            if (!formEquipo.Nombre.trim()) return alert("El nombre del equipo es obligatorio.");

            const idsSeleccionados = formEquipo.jugadores.filter(j => j !== "");
            if (new Set(idsSeleccionados).size !== idsSeleccionados.length) {
                return alert("No puedes seleccionar al mismo jugador dos veces para el mismo equipo.");
            }

            const jugadores = idsSeleccionados.map((id, i) => ({ ID: id, Es_Capitan: i === 0 ? 1 : 0 }));
            if (jugadores.length === 0) return alert("Selecciona al menos un jugador.");

            const res = await fetch(`${baseURL}/torneos/${modalEquipo.ID}/equipos`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Nombre: formEquipo.Nombre, jugadores })
            });
            const data = await res.json();
            if (data.success) { setModalEquipo(null); setFormEquipo({ Nombre: "", jugadores: [""] }); cargarTorneos(); }
            else alert(data.error || "Error");

        } else {
            if (modalEquipo.Modo === '2v2' && modalEquipo.Aleatorio === 1) {
                const res = await fetch(`${baseURL}/torneos/${modalEquipo.ID}/inscripcion-aleatoria`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ID_Jugador: usuarioData.id })
                });
                const data = await res.json();
                if (data.success) { setModalEquipo(null); cargarTorneos(); } else alert(data.error);

            } else if (modalEquipo.Modo === '2v2' && modoInscripcion === 'unirse') {
                if (!equipoSeleccionado) return alert("Selecciona un equipo al que unirte.");
                const res = await fetch(`${baseURL}/torneos/${modalEquipo.ID}/equipos/${equipoSeleccionado}/unirse`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ID_Jugador: usuarioData.id })
                });
                const data = await res.json();
                if (data.success) { setModalEquipo(null); cargarTorneos(); } else alert(data.error);

            } else {
                if (!formEquipo.Nombre.trim()) return alert("El nombre del equipo es obligatorio.");
                const res = await fetch(`${baseURL}/torneos/${modalEquipo.ID}/equipos`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Nombre: formEquipo.Nombre, jugadores: [{ ID: usuarioData.id, Es_Capitan: 1 }] })
                });
                const data = await res.json();
                if (data.success) { setModalEquipo(null); cargarTorneos(); } else alert(data.error);
            }
        }
    };

    const handleEditarMiEquipo = async () => {
        if (!formEdicionEquipo.Nombre.trim()) return alert("El nombre no puede estar vacío.");
        const res = await fetch(`${baseURL}/torneos/${modalEquipo.ID}/equipos/${miEquipoActual.ID}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formEdicionEquipo)
        });
        const data = await res.json();
        if (data.success) { setModalEquipo(null); cargarTorneos(); } else alert(data.error);
    };

    // ── INICIAR TORNEO ────────────────────────────────────────────────────────
    const handleIniciar = async () => {
        const res = await fetch(`${baseURL}/torneos/${confirmarIniciar.ID}/iniciar`, { method: "POST" });
        const data = await res.json();
        if (data.success) { setConfirmarIniciar(null); cargarTorneos(); }
        else alert(data.error || "Error");
    };

    // ── UTILS ─────────────────────────────────────────────────────────────────
    const ESTADO_COLOR = { pendiente: "var(--text-muted)", en_curso: "#ffa502", finalizado: "var(--success)" };
    const ESTADO_LABEL = { pendiente: "Pendiente", en_curso: "En curso", finalizado: "Finalizado" };

    const isTorneoPendiente = (torneoId) => {
        const t = torneos.find(x => x.ID === torneoId);
        return !t || t.Estado === 'pendiente';
    };

    // ── RENDER BRACKET ────────────────────────────────────────────────────────
    if (torneoActivo) return (
        <TorneoView
            baseURL={baseURL}
            torneo={torneoActivo}
            isAdmin={isAdmin}
            usuarioData={usuarioData}
            onBack={() => { setTorneoActivo(null); cargarTorneos(); }}
        />
    );

    // ── RENDER LISTADO ────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>

            {/* CABECERA */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>Torneos</h1>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>{torneos.length} torneo{torneos.length !== 1 ? "s" : ""} registrado{torneos.length !== 1 ? "s" : ""}</p>
                </div>
                {isAdmin && (
                    <button onClick={abrirModalCrear} style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Crear torneo
                    </button>
                )}
            </div>

            {/* LISTA DE TORNEOS */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Cargando...</div>
            ) : torneos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "14px", border: "1px dashed var(--border-color)" }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>No hay torneos creados</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {torneos.map(t => {
                        const color = ESTADO_COLOR[t.Estado] || "var(--text-muted)";
                        return (
                            <div key={t.ID} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: `4px solid ${color}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>

                                {/* INFO */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>{t.Nombre}</span>
                                        <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", background: `${color}18`, border: `1px solid ${color}`, color, letterSpacing: "0.5px" }}>
                                            {ESTADO_LABEL[t.Estado]?.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: "0.62px", padding: "2px 7px", borderRadius: "20px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                                            {t.Modo?.toUpperCase()} {t.Aleatorio === 1 ? "(Aleatorio)" : ""}
                                        </span>
                                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: "20px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                                            BO{t.Rondas_Partida || 3}
                                            {t.Final_Rondas_Distintas ? ` · Final BO${t.Final_Rondas}` : ""}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                        <span>{t.Equipos_Inscritos}/{t.Participantes} {t.Modo === '2v2' && t.Aleatorio === 1 ? 'jugadores' : 'equipos'}</span>
                                        {t.Juego_Nombre && <span>{t.Juego_Nombre}</span>}
                                        <span>Doble eliminación</span>
                                    </div>
                                </div>

                                {/* ACCIONES */}
                                <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap" }}>
                                    {t.Estado === 'pendiente' && (
                                        <>
                                            <button onClick={() => abrirModalEquipo(t)} style={{ padding: "6px 12px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "7px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", color: "var(--text-main)" }}>
                                                {isAdmin ? "+ Equipo" : "Inscripción"}
                                            </button>
                                            {isAdmin && t.Equipos_Inscritos === t.Participantes && (
                                                <button onClick={() => setConfirmarIniciar(t)} style={{ padding: "6px 12px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", border: "none", borderRadius: "7px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", color: "#fff" }}>
                                                    Iniciar
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {isAdmin && (
                                        <button onClick={() => abrirModalEditar(t)} style={{ padding: "6px 12px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "7px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", color: "var(--text-main)" }}>
                                            Editar
                                        </button>
                                    )}
                                    {(t.Estado === 'en_curso' || t.Estado === 'finalizado') && (
                                        <>
                                            {!isAdmin && (
                                                <button onClick={() => abrirModalEquipo(t)} style={{ padding: "6px 12px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "7px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", color: "var(--text-main)" }}>
                                                    Mi Equipo
                                                </button>
                                            )}
                                            <button onClick={() => setTorneoActivo(t)} style={{ padding: "6px 12px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", border: "none", borderRadius: "7px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", color: "#fff" }}>
                                                Ver bracket
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── MODAL CREAR / EDITAR TORNEO ────────────────────────────────── */}
            {modalCrear && (
                <Modal title={formTorneo.ID ? "Editar torneo" : "Nuevo torneo"} subtitle={formTorneo.ID ? "Modificar configuración" : "Configuración inicial del torneo"} onClose={() => setModalCrear(false)} onSubmit={handleGuardarTorneo} submitLabel={formTorneo.ID ? "Guardar cambios" : "Crear torneo"}>

                    <Field label="Nombre">
                        <input type="text" value={formTorneo.Nombre} onChange={e => setFormTorneo({ ...formTorneo, Nombre: e.target.value })} placeholder="Ej: Torneo de Otoño 2025" style={inputStyle}
                            onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "flex-end" }}>
                        <Field label="Modo">
                            <select disabled={!isTorneoPendiente(formTorneo.ID)} value={formTorneo.Modo} onChange={e => setFormTorneo({ ...formTorneo, Modo: e.target.value })} style={{ ...inputStyle, cursor: "pointer", opacity: !isTorneoPendiente(formTorneo.ID) ? 0.6 : 1 }}>
                                <option value="1v1">1v1</option>
                                <option value="2v2">2v2</option>
                            </select>
                        </Field>
                        <Field label="Formato">
                            <select disabled={!isTorneoPendiente(formTorneo.ID)} value={formTorneo.Tipo_Bracket} onChange={e => setFormTorneo({ ...formTorneo, Tipo_Bracket: e.target.value })} style={{ ...inputStyle, cursor: "pointer", opacity: !isTorneoPendiente(formTorneo.ID) ? 0.6 : 1 }}>
                                <option value="double">Doble Eliminación</option>
                                <option value="single">Eliminación Directa</option>
                            </select>
                        </Field>
                        <Field label="Participantes">
                            <select disabled={!isTorneoPendiente(formTorneo.ID)} value={formTorneo.Participantes} onChange={e => setFormTorneo({ ...formTorneo, Participantes: Number(e.target.value) })} style={{ ...inputStyle, cursor: "pointer", opacity: !isTorneoPendiente(formTorneo.ID) ? 0.6 : 1 }}>
                                {[4, 8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* TOGGLE ALEATORIO 2v2 */}
                    {formTorneo.Modo === '2v2' && (
                        <div onClick={() => isTorneoPendiente(formTorneo.ID) && setFormTorneo(p => ({ ...p, Aleatorio: !p.Aleatorio }))}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", cursor: isTorneoPendiente(formTorneo.ID) ? "pointer" : "default", background: formTorneo.Aleatorio ? "rgba(0,0,0,0.04)" : "transparent", border: `1px solid ${formTorneo.Aleatorio ? "var(--primary)" : "var(--border-color)"}`, opacity: !isTorneoPendiente(formTorneo.ID) ? 0.6 : 1 }}>
                            <div style={{ width: "34px", height: "18px", borderRadius: "9px", background: formTorneo.Aleatorio ? "var(--primary)" : "var(--border-color)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                                <div style={{ position: "absolute", top: "2px", left: formTorneo.Aleatorio ? "17px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: formTorneo.Aleatorio ? "var(--primary)" : "var(--text-muted)" }}>Emparejamiento Aleatorio</span>
                                <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1px" }}>El sistema formará los equipos de 2 al azar al iniciar el torneo.</span>
                            </div>
                        </div>
                    )}

                    <Field label="Juego asociado (Pokémon)">
                        <select disabled={!isTorneoPendiente(formTorneo.ID)} value={formTorneo.ID_Juego} onChange={e => setFormTorneo({ ...formTorneo, ID_Juego: e.target.value })} style={{ ...inputStyle, cursor: "pointer", opacity: !isTorneoPendiente(formTorneo.ID) ? 0.6 : 1 }}>
                            <option value="">Selecciona el juego</option>
                            {juegos.map(j => <option key={j.ID} value={j.ID}>{j.Nombre}</option>)}
                        </select>
                    </Field>

                    {/* ── RONDAS ──────────────────────────────────────────── */}
                    <div style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px", opacity: !isTorneoPendiente(formTorneo.ID) ? 0.6 : 1, pointerEvents: !isTorneoPendiente(formTorneo.ID) ? "none" : "auto" }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                            Formato de rondas
                        </div>

                        <Field label="Rondas por partida">
                            <div style={{ display: "flex", gap: "8px" }}>
                                {[1, 3, 5].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setFormTorneo({ ...formTorneo, Rondas_Partida: n })}
                                        style={{
                                            flex: 1, padding: "9px 0",
                                            borderRadius: "7px", fontWeight: 800, fontSize: "0.82rem",
                                            cursor: "pointer", transition: "all 0.15s",
                                            border: `2px solid ${formTorneo.Rondas_Partida === n ? "var(--primary)" : "var(--border-color)"}`,
                                            background: formTorneo.Rondas_Partida === n ? "var(--primary)" : "var(--bg-main)",
                                            color: formTorneo.Rondas_Partida === n ? "var(--bg-main)" : "var(--text-muted)",
                                        }}
                                    >
                                        BO{n}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Toggle final con rondas distintas */}
                        <div
                            onClick={() => setFormTorneo(p => ({ ...p, Final_Rondas_Distintas: !p.Final_Rondas_Distintas }))}
                            style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                                background: formTorneo.Final_Rondas_Distintas ? "rgba(0,0,0,0.04)" : "transparent",
                                border: `1px solid ${formTorneo.Final_Rondas_Distintas ? "var(--primary)" : "var(--border-color)"}`,
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{ width: "34px", height: "18px", borderRadius: "9px", background: formTorneo.Final_Rondas_Distintas ? "var(--primary)" : "var(--border-color)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                                <div style={{ position: "absolute", top: "2px", left: formTorneo.Final_Rondas_Distintas ? "17px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: formTorneo.Final_Rondas_Distintas ? "var(--primary)" : "var(--text-muted)" }}>
                                    La Final tiene formato diferente
                                </span>
                                <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1px" }}>
                                    Permite usar BO5 en la final aunque el resto sea BO3
                                </span>
                            </div>
                        </div>

                        {/* Selector rondas de la final */}
                        {formTorneo.Final_Rondas_Distintas && (
                            <Field label="Rondas de la Gran Final">
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {[1, 3, 5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setFormTorneo({ ...formTorneo, Final_Rondas: n })}
                                            style={{
                                                flex: 1, padding: "9px 0",
                                                borderRadius: "7px", fontWeight: 800, fontSize: "0.82rem",
                                                cursor: "pointer", transition: "all 0.15s",
                                                border: `2px solid ${formTorneo.Final_Rondas === n ? "#ffa502" : "var(--border-color)"}`,
                                                background: formTorneo.Final_Rondas === n ? "#ffa502" : "var(--bg-main)",
                                                color: formTorneo.Final_Rondas === n ? "#fff" : "var(--text-muted)",
                                            }}
                                        >
                                            BO{n}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        )}
                    </div>

                    {/* 🌟 PUNTOS DEL TORNEO 🌟 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", alignItems: "flex-end" }}>
                        <Field label="Puntos Enfrentamiento" hint="Al ganar BO1/BO3/BO5">
                            <input type="number" min="0" value={formTorneo.Puntos_Por_Victoria} onChange={e => setFormTorneo({ ...formTorneo, Puntos_Por_Victoria: Number(e.target.value) })} style={inputStyle} />
                        </Field>
                        <Field label="Puntos Ganador" hint="Al ganar la Final">
                            <input type="number" min="0" value={formTorneo.Puntos_Ganador_Torneo} onChange={e => setFormTorneo({ ...formTorneo, Puntos_Ganador_Torneo: Number(e.target.value) })} style={inputStyle} />
                        </Field>
                    </div>

                    {!isTorneoPendiente(formTorneo.ID) && <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#ffa502", textAlign: "center" }}>Al estar en curso, solo se puede editar el nombre.</p>}
                </Modal>
            )}

            {modalEquipo && (
                <Modal
                    title={isAdmin ? "Añadir Equipo (Admin)" : (miEquipoActual ? "Gestionar mi equipo" : "Inscripción")}
                    subtitle={modalEquipo.Nombre}
                    onClose={() => setModalEquipo(null)}
                    onSubmit={isAdmin ? handleAñadirEquipo : (miEquipoActual ? handleEditarMiEquipo : handleAñadirEquipo)}
                    submitLabel={isAdmin ? "Inscribir usuarios" : (miEquipoActual ? "Guardar cambios" : "Inscribirse")}
                >
                    {isAdmin ? (
                        <>
                            <Field label="Nombre del equipo">
                                <input type="text" value={formEquipo.Nombre} onChange={e => setFormEquipo({ ...formEquipo, Nombre: e.target.value })} placeholder={modalEquipo.Modo === '2v2' ? "Ej: Team Rocket" : "Nombre del jugador/equipo"} style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} />
                            </Field>

                            {/* Jugadores: 1 para 1v1, 2 para 2v2 */}
                            {Array.from({ length: modalEquipo.Modo === '2v2' ? 2 : 1 }, (_, i) => (
                                <Field key={i} label={modalEquipo.Modo === '2v2' ? (i === 0 ? "Capitán" : "Compañero") : "Jugador"}>
                                    <select
                                        value={formEquipo.jugadores[i] || ""}
                                        onChange={e => {
                                            const j = [...formEquipo.jugadores];
                                            j[i] = e.target.value;
                                            setFormEquipo({ ...formEquipo, jugadores: j });
                                        }}
                                        style={{ ...inputStyle, cursor: "pointer" }}
                                    >
                                        <option value="">Seleccionar jugador...</option>
                                        {usuarios.map(u => {
                                            // Validaciones para deshabilitar en el desplegable (TU LÓGICA MANTENIDA)
                                            const isAlreadyInscribed = usuariosInscritos.includes(String(u.ID));
                                            const isSelectedByPartner = modalEquipo.Modo === '2v2' && (i === 0 ? formEquipo.jugadores[1] === String(u.ID) : formEquipo.jugadores[0] === String(u.ID));

                                            return (
                                                <option
                                                    key={u.ID}
                                                    value={u.ID}
                                                    disabled={isAlreadyInscribed || isSelectedByPartner}
                                                >
                                                    {u.Nombre} {isAlreadyInscribed ? "(Ya inscrito)" : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </Field>
                            ))}
                        </>
                    ) : miEquipoActual ? (
                        // VISTA DE JUGADOR YA INSCRITO: Edición de equipo post-asignación
                        <>
                            <div style={{ textAlign: "center", marginBottom: "1rem", background: "rgba(16,185,129,0.1)", padding: "1rem", borderRadius: "12px", border: "1px dashed var(--success)" }}>
                                <span style={{ fontSize: "2rem" }}>✅</span>
                                <p style={{ color: "var(--success)", fontWeight: 900, margin: "5px 0" }}>Ya estás inscrito</p>
                            </div>
                            <Field label="Editar Nombre del equipo">
                                <input type="text" value={formEdicionEquipo.Nombre} onChange={e => setFormEdicionEquipo({ ...formEdicionEquipo, Nombre: e.target.value })} style={inputStyle} />
                            </Field>
                            {/* Solo si es 2v2 y ya tienen pareja se deja cambiar el capitán */}
                            {modalEquipo.Modo === '2v2' && miEquipoActual.ids.length > 1 && (
                                <Field label="Capitán del equipo">
                                    <select value={formEdicionEquipo.ID_Capitan} onChange={e => setFormEdicionEquipo({ ...formEdicionEquipo, ID_Capitan: e.target.value })} style={inputStyle}>
                                        {miEquipoActual.ids.map(id => {
                                            const u = usuarios.find(user => String(user.ID) === String(id));
                                            return u ? <option key={u.ID} value={u.ID}>{u.Nombre}</option> : null;
                                        })}
                                    </select>
                                </Field>
                            )}
                        </>
                    ) : (
                        // VISTA JUGADOR PARA INSCRIBIRSE (Solo entra aquí si el torneo está PENDIENTE)
                        <>
                            {modalEquipo.Modo === '2v2' && modalEquipo.Aleatorio === 1 ? (
                                <div style={{ padding: "1.5rem", background: "rgba(0, 210, 211, 0.1)", border: "1px dashed #00d2d3", borderRadius: "8px", textAlign: "center" }}>
                                    <p style={{ margin: 0, color: "var(--text-main)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                                        🎲 <strong>Torneo Aleatorio:</strong> Al inscribirte entrarás en la lista de espera individual. El sistema te asignará automáticamente un compañero al iniciar.
                                    </p>
                                </div>
                            ) : modalEquipo.Modo === '2v2' ? (
                                <>
                                    <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
                                        <button onClick={() => setModoInscripcion("crear")} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: modoInscripcion === "crear" ? "var(--primary)" : "var(--bg-soft)", color: modoInscripcion === "crear" ? "#fff" : "var(--text-muted)", border: "none", fontWeight: 800, cursor: "pointer" }}>Crear Equipo</button>
                                        <button onClick={() => setModoInscripcion("unirse")} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: modoInscripcion === "unirse" ? "var(--primary)" : "var(--bg-soft)", color: modoInscripcion === "unirse" ? "#fff" : "var(--text-muted)", border: "none", fontWeight: 800, cursor: "pointer" }}>Unirse a Equipo</button>
                                    </div>
                                    {modoInscripcion === "crear" ? (
                                        <Field label="Bautiza a tu equipo">
                                            <input type="text" value={formEquipo.Nombre} onChange={e => setFormEquipo({ ...formEquipo, Nombre: e.target.value })} placeholder="Ej: Los Invencibles" style={inputStyle} />
                                        </Field>
                                    ) : (
                                        <Field label="Únete a un compañero en solitario">
                                            <select value={equipoSeleccionado} onChange={e => setEquipoSeleccionado(e.target.value)} style={inputStyle}>
                                                <option value="">Seleccionar equipo incompleto...</option>
                                                {equiposIncompletos.map(eq => <option key={eq.ID} value={eq.ID}>{eq.Nombre} ({eq.Jugadores})</option>)}
                                            </select>
                                            {equiposIncompletos.length === 0 && <p style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "4px" }}>Actualmente no hay equipos buscando compañero.</p>}
                                        </Field>
                                    )}
                                </>
                            ) : (
                                <Field label="Bautiza a tu equipo / jugador">
                                    <input type="text" value={formEquipo.Nombre} onChange={e => setFormEquipo({ ...formEquipo, Nombre: e.target.value })} placeholder="Tu nombre artístico en el torneo" style={inputStyle} />
                                </Field>
                            )}
                        </>
                    )}
                </Modal>
            )}

            {/* ── MODAL CONFIRMAR INICIO ─────────────────────────────────────── */}
            {confirmarIniciar && (
                <Modal title="Iniciar torneo" subtitle={confirmarIniciar.Nombre} onClose={() => setConfirmarIniciar(null)} onSubmit={handleIniciar} submitLabel="Generar bracket y empezar">
                    <div style={{ padding: "14px", background: "rgba(255,165,2,0.08)", border: "1px solid #ffa502", borderRadius: "8px" }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                            Esto generará el bracket de doble eliminación con <strong>{confirmarIniciar.Participantes} equipos</strong> sembrados aleatoriamente.
                            {confirmarIniciar.Modo === '2v2' && confirmarIniciar.Aleatorio === 1 ? " Se agrupará a los jugadores inscritos en parejas al azar automáticamente." : ""}
                            Una vez iniciado no se pueden añadir ni retirar equipos.
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    );
}