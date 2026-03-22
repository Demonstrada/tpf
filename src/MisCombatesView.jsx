import React, { useState, useEffect, useCallback } from "react";

const iframeStyles = `
html, body, .wrapper { background: #0d1117 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
.battle-log, .rightbar, .battle-history { background: #0d1117 !important; color: #c9d1d9 !important; border-color: #30363d !important; }
.chat, .message { color: #c9d1d9 !important; }
.chat strong { color: #00d2d3 !important; }
.battle { background: #1a1e24 !important; border: 1px solid #30363d !important; }
.replay-controls, .replay-controls-2 { background: #0d1117 !important; border: 1px solid #30363d !important; }
.replay-controls button, .speed-controls button, .options-controls button { background: #161b22 !important; color: #c9d1d9 !important; border: 1px solid #30363d !important; border-radius: 4px !important; cursor: pointer !important; }
.replay-controls button:hover { background: #1f2937 !important; border-color: #00d2d3 !important; color: #fff !important; }
strong { color: #8b949e !important; }
`;

const RoundStatusBadge = ({ rep, onView, onEdit }) => {
    if (!rep) return null;
    return (
        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {rep.Sube_Replay
                ? <button className="combat-btn-primary" style={{ padding: "6px 10px", fontSize: "0.7rem", width: "auto" }} onClick={onView}>▶ REPLAY</button>
                : <span style={{ fontSize: "0.65rem", color: "#8b949e", padding: "4px 8px", border: "1px solid #30363d", borderRadius: "4px" }}>SIN LOG</span>
            }
            <button className="combat-btn-stealth" style={{ padding: "6px 10px", fontSize: "0.7rem", width: "auto" }} onClick={onEdit}>✎ EDITAR</button>
        </div>
    );
};

const StatBar = ({ name, val, isIV }) => {
    const v = parseInt(val);
    if (isNaN(v)) return null;
    const pct = (v / (isIV ? 31 : 252)) * 100;
    const color = { HP: "#ff4757", Atk: "#ffa502", Def: "#eccc68", SpA: "#00d2d3", SpD: "#10b981", Spe: "#ff6bcb" }[name] || "#c9d1d9";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{ width: "26px", fontWeight: 700, fontSize: "0.62rem", color: "#8b949e" }}>{name}</span>
            <div style={{ flex: 1, background: "#000", height: "5px", borderRadius: "3px" }}>
                <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: "3px", boxShadow: `0 0 4px ${color}80` }} />
            </div>
            <span style={{ width: "22px", textAlign: "right", fontSize: "0.62rem", color: "#c9d1d9" }}>{v}</span>
        </div>
    );
};

export default function MisCombatesView({ baseURL, usuarioData, onRequestFullscreen }) {
    const [enfrentamientos, setEnfrentamientos] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [filtros, setFiltros] = useState({ rival: "", evento: "" });
    const [formData, setFormData] = useState({});

    const [modo, setModo] = useState("listado");
    const [tabActivo, setTabActivo] = useState("eventos"); // Pestañas: "eventos" o "torneos"
    const [reporteActivo, setReporteActivo] = useState(null);
    const [editandoRonda, setEditandoRonda] = useState(null);

    const [iframeContent, setIframeContent] = useState("");
    const [stats, setStats] = useState(null);
    const [hoveredPoke, setHoveredPoke] = useState(null);

    const toId = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

    const cargarMisDatos = useCallback(() => {
        fetch(`${baseURL}/mis-combates/${usuarioData.id}`)
            .then(res => res.json())
            .then(data => {
                setEnfrentamientos(data.enfrentamientos || []);
                setReportes(data.reportes || []);
            })
            .catch(err => console.error("Error:", err));
    }, [baseURL, usuarioData.id]);

    useEffect(() => { cargarMisDatos(); }, [cargarMisDatos]);

    const handleFormChange = (enfId, ronda, field, value) => {
        const key = `${enfId}-${ronda}`;
        setFormData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    };

    const enviarReporte = async (enf, ronda) => {
        const key = `${enf.ID}-${ronda}`;
        const data = formData[key] || { Sube_Replay: true };
        if (data.Sube_Replay !== false && (!data.Replay_Log || !data.Equipo)) {
            alert("Debes proporcionar el Log y el Equipo o desactivar la opción de Replay.");
            return;
        }
        if (!data.ID_Ganador_Extraido) { alert("Indica quién ganó el combate."); return; }
        try {
            const res = await fetch(`${baseURL}/reportar-combate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ID_Enfrentamiento: enf.ID,
                    ID_Jugador_Reporta: usuarioData.id,
                    Ronda: ronda,
                    Replay_Log: data.Replay_Log || "",
                    Equipo: data.Equipo || "",
                    ID_Ganador_Extraido: data.ID_Ganador_Extraido,
                    Sube_Replay: data.Sube_Replay !== false
                })
            });
            if (res.ok) { alert("Datos transmitidos con éxito."); setEditandoRonda(null); cargarMisDatos(); }
        } catch { alert("Error de conexión con la Arena."); }
    };

    const parsearEquipo = (texto) => {
        if (!texto) return [];
        const pokes = [];
        let current = null;
        for (let linea of texto.split('\n')) {
            linea = linea.trim();
            if (linea === '') { if (current) pokes.push(current); current = null; continue; }
            if (!current) {
                current = { nickname: '', species: '', item: '', ability: '', evs: {}, ivs: {}, nature: '', moves: [] };
                let namePart = linea.split('@')[0].replace(/\(M\)/g, '').replace(/\(F\)/g, '').trim();
                if (linea.includes('@')) current.item = linea.split('@')[1].trim();
                const match = namePart.match(/(.*)\s+\((.*)\)/);
                if (match) { current.nickname = match[1].trim(); current.species = match[2].trim(); }
                else { current.species = namePart; current.nickname = namePart; }
            } else {
                if (linea.startsWith('Ability:')) current.ability = linea.substring(8).trim();
                else if (linea.startsWith('EVs:')) {
                    for (let p of linea.substring(4).split('/')) {
                        const [v, s] = p.trim().split(' ');
                        if (s) current.evs[s.trim()] = v.trim();
                    }
                }
                else if (linea.includes('Nature')) current.nature = linea.split('Nature')[0].trim();
                else if (linea.startsWith('-')) current.moves.push(linea.substring(1).trim());
            }
        }
        if (current) pokes.push(current);
        return pokes;
    };

    const cargarVisor = (reporte) => {
        const equipoDetallado = parsearEquipo(reporte.Equipo);
        const textoSaneado = reporte.Replay_Log.replace(/\\n/g, "\n");
        const matchHtml = textoSaneado.match(/<script[^>]*class="battle-log-data"[^>]*>([\s\S]*?)<\/script>/i);
        const textoCombate = matchHtml ? matchHtml[1] : textoSaneado;

        const lineas = textoCombate.split(/\r?\n/);
        let ganador = "Desconocido", turnos = 0;
        let p1Name = "J1", p2Name = "J2";
        let p1Team = [], p2Team = [];
        let p1Active = {}, p2Active = {};

        const updatePokeData = (playerSlot, callback) => {
            const slot = playerSlot.substring(0, 2);
            const especieActiva = slot === "p1" ? p1Active[playerSlot] : p2Active[playerSlot];
            if (!especieActiva) return;
            const team = slot === "p1" ? p1Team : p2Team;
            const poke = team.find(p => p.especie.startsWith(especieActiva) || especieActiva.startsWith(p.especie));
            if (poke) callback(poke);
        };

        lineas.forEach(linea => {
            const parts = linea.split("|");
            if (parts.length < 2) return;
            const accion = parts[1];

            if (accion === "win")    ganador = parts[2];
            if (accion === "turn")   turnos  = parseInt(parts[2]);
            if (accion === "player") {
                if (parts[2] === "p1" && parts[3]) p1Name = parts[3];
                if (parts[2] === "p2" && parts[3]) p2Name = parts[3];
            }
            if (accion === "poke") {
                const especie = parts[3].split(",")[0];
                if (parts[2] === "p1") p1Team.push({ especie, nickname: especie, dead: false, intel: null });
                if (parts[2] === "p2") p2Team.push({ especie, nickname: especie, dead: false, intel: null });
            }
            if (accion === "switch" || accion === "drag") {
                const identificador  = parts[2];
                const slot           = identificador.substring(0, 2);
                const nickname       = identificador.substring(5).trim();
                const especieSaliente = parts[3].split(",")[0];

                if (slot === "p1") p1Active[identificador] = especieSaliente;
                if (slot === "p2") p2Active[identificador] = especieSaliente;

                const team = slot === "p1" ? p1Team : p2Team;
                const pokeObj = team.find(p => p.especie === especieSaliente);
                if (pokeObj) pokeObj.nickname = nickname;
            }
            if (accion === "faint") {
                updatePokeData(parts[2], poke => { poke.dead = true; });
            }
        });

        [...p1Team, ...p2Team].forEach(pk => {
            const intel = equipoDetallado.find(i => i.species.toLowerCase() === pk.especie.toLowerCase());
            if (intel) pk.intel = intel;
        });

        setStats({
            ganador, turnos, p1Name, p2Name, p1Team, p2Team,
            muertos: [...p1Team, ...p2Team].filter(x => x.dead).length
        });

        const logEscapado = textoCombate.replace(/<\/script>/gi, "<\\/script>");
        const finalHtml = `<!DOCTYPE html><html><head><style>${iframeStyles}</style></head><body><div class="wrapper battle-wrapper"><div class="battle"></div><div class="battle-log"></div><div class="replay-controls"></div><div class="replay-controls-2"></div></div><script type="text/plain" class="battle-log-data">${logEscapado}</script><script src="https://play.pokemonshowdown.com/js/replay-embed.js"></script></body></html>`;
        setIframeContent(finalHtml);
        setReporteActivo(reporte);
        setModo("visor");
    };

    // ── LÓGICA DE FILTRADO Y PESTAÑAS ──────────────────────────────────
    const filtrados = enfrentamientos.filter(enf => {
        const isTorneo = String(enf.ID).startsWith('T_');
        
        // Filtrar por pestaña activa
        if (tabActivo === "eventos" && isTorneo) return false;
        if (tabActivo === "torneos" && !isTorneo) return false;

        const rival = Number(enf.ID_Jugador1) === Number(usuarioData.id) ? enf.Jugador2_Nombre : enf.Jugador1_Nombre;
        return rival.toLowerCase().includes(filtros.rival.toLowerCase())
            && enf.Evento_Nombre.toLowerCase().includes(filtros.evento.toLowerCase());
    });

    // Filtrar los reportes activos en base a la pestaña para actualizar los KPIs
    const reportesActivos = reportes.filter(r => {
        const isTorneo = String(r.ID_Enfrentamiento).startsWith('T_');
        if (tabActivo === "eventos" && isTorneo) return false;
        if (tabActivo === "torneos" && !isTorneo) return false;
        return true;
    });

    const getRoundResult = (rep) => {
        if (!rep) return null;
        if (Number(rep.ID_Ganador_Extraido) === Number(usuarioData.id)) return "win";
        if (Number(rep.ID_Ganador_Extraido) === 0) return "draw";
        return "loss";
    };

    const resultColors = { win: "#10b981", draw: "#ffa502", loss: "#ff4757" };
    const resultLabels = { win: "V", draw: "E", loss: "D" };

    return (
        <div className="theme-combat" style={{ minHeight: "100%", padding: "2rem", boxSizing: "border-box" }}>

            {/* ── LISTADO ─────────────────────────────────────────────────── */}
            {modo === "listado" && (
                <div className="animation-fade">

                    {/* CABECERA Y KPIS DINÁMICOS */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <div>
                            <h1 className="combat-main-title" style={{ margin: 0, border: "none", padding: 0, textAlign: "left" }}>REPETICIONES</h1>
                            <p style={{ color: "#8b949e", margin: "4px 0 0", fontSize: "0.85rem", letterSpacing: "1px" }}>HISTORIAL DE COMBATES · {filtrados.length} EXPEDIENTE{filtrados.length !== 1 ? "S" : ""}</p>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <div style={{ background: "rgba(0,210,211,0.08)", border: "1px solid rgba(0,210,211,0.2)", borderRadius: "8px", padding: "10px 18px", textAlign: "center", transition: "all 0.3s" }}>
                                <span style={{ display: "block", color: "#00d2d3", fontSize: "1.6rem", fontWeight: 900, lineHeight: 1 }}>
                                    {reportesActivos.filter(r => Number(r.ID_Ganador_Extraido) === Number(usuarioData.id)).length}
                                </span>
                                <span style={{ fontSize: "0.62rem", color: "#8b949e", letterSpacing: "1px" }}>VICTORIAS</span>
                            </div>
                            <div style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: "8px", padding: "10px 18px", textAlign: "center", transition: "all 0.3s" }}>
                                <span style={{ display: "block", color: "#ff4757", fontSize: "1.6rem", fontWeight: 900, lineHeight: 1 }}>
                                    {reportesActivos.filter(r => Number(r.ID_Ganador_Extraido) !== Number(usuarioData.id) && Number(r.ID_Ganador_Extraido) !== 0).length}
                                </span>
                                <span style={{ fontSize: "0.62rem", color: "#8b949e", letterSpacing: "1px" }}>DERROTAS</span>
                            </div>
                        </div>
                    </div>

                    {/* SISTEMA DE PESTAÑAS (TABS) */}
                    <div style={{ display: "flex", gap: "15px", marginBottom: "1.5rem", borderBottom: "2px solid #30363d" }}>
                        <button 
                            onClick={() => setTabActivo("eventos")}
                            style={{
                                background: "transparent", border: "none", cursor: "pointer",
                                fontSize: "0.85rem", fontWeight: 900, letterSpacing: "1px", padding: "0 10px 10px 10px",
                                color: tabActivo === "eventos" ? "#00d2d3" : "#8b949e",
                                borderBottom: tabActivo === "eventos" ? "2px solid #00d2d3" : "2px solid transparent",
                                marginBottom: "-2px", transition: "all 0.2s"
                            }}>
                            EVENTOS
                        </button>
                        <button 
                            onClick={() => setTabActivo("torneos")}
                            style={{
                                background: "transparent", border: "none", cursor: "pointer",
                                fontSize: "0.85rem", fontWeight: 900, letterSpacing: "1px", padding: "0 10px 10px 10px",
                                color: tabActivo === "torneos" ? "#ffa502" : "#8b949e",
                                borderBottom: tabActivo === "torneos" ? "2px solid #ffa502" : "2px solid transparent",
                                marginBottom: "-2px", transition: "all 0.2s"
                            }}>
                            TORNEOS
                        </button>
                    </div>

                    {/* FILTROS */}
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                        {["rival", "evento"].map(campo => (
                            <div key={campo} style={{ flex: 1, position: "relative" }}>
                                <input
                                    style={{
                                        width: "100%", boxSizing: "border-box", paddingLeft: "12px",
                                        padding: "0.75rem", background: "rgba(22,27,34,0.8)", border: "1px solid #30363d",
                                        borderRadius: "8px", color: "#c9d1d9", fontSize: "0.85rem", outline: "none", transition: "border-color 0.2s"
                                    }}
                                    placeholder={`Filtrar por ${campo === "rival" ? "Rival" : "Evento"}...`}
                                    onFocus={e => e.target.style.borderColor = tabActivo === "torneos" ? "#ffa502" : "#00d2d3"}
                                    onBlur={e => e.target.style.borderColor = "#30363d"}
                                    onChange={e => setFiltros({ ...filtros, [campo]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>

                    {/* TARJETAS DE ENFRENTAMIENTO */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                        {filtrados.length === 0 && (
                            <div style={{ textAlign: "center", padding: "4rem", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "12px" }}>
                                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                                <p style={{ margin: 0, letterSpacing: "2px", fontSize: "0.85rem", textTransform: "uppercase" }}>SIN COMBATES DE {tabActivo} ACTIVOS</p>
                            </div>
                        )}

                        {filtrados.map(enf => {
                            const isTorneo = String(enf.ID).startsWith('T_');
                            const combateTerminado = isTorneo && enf.Estado_General === 'completada';
                            const rival = Number(enf.ID_Jugador1) === Number(usuarioData.id) ? enf.Jugador2_Nombre : enf.Jugador1_Nombre;
                            const misReportes = reportes.filter(r => r.ID_Enfrentamiento === enf.ID);
                            const rondaSiguiente = misReportes.length + 1;
                            
                            let wins = misReportes.filter(r => Number(r.ID_Ganador_Extraido) === Number(usuarioData.id)).length;
                            let losses = misReportes.filter(r => Number(r.ID_Ganador_Extraido) !== Number(usuarioData.id) && Number(r.ID_Ganador_Extraido) !== 0).length;

                            // LÓGICA INTELIGENTE: Si fue forzado por el admin (0 replays pero está completado)
                            const fueForzado = combateTerminado && misReportes.length === 0;
                            if (fueForzado) {
                                if (Number(enf.ID_Ganador_Global) === Number(enf.Mi_Equipo_ID)) wins = 1;
                                else if (enf.ID_Ganador_Global) losses = 1;
                            }

                            const borderColor = combateTerminado ? '#8b949e' : (isTorneo ? '#ffa502' : '#ff4757');

                            return (
                                <div key={enf.ID} style={{
                                    background: "rgba(22,27,34,0.7)", border: "1px solid #30363d",
                                    borderLeft: `4px solid ${borderColor}`, borderRadius: "12px",
                                    padding: "1.5rem", backdropFilter: "blur(10px)",
                                    transition: "border-color 0.2s, box-shadow 0.2s", opacity: combateTerminado ? 0.7 : 1
                                }}>
                                    {/* HEADER */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                                <span style={{ color: isTorneo ? "#ffa502" : "#00d2d3", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>
                                                    {enf.Evento_Nombre}
                                                </span>
                                                <span style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(139,148,158,0.1)", border: "1px solid #30363d", color: "#8b949e", letterSpacing: "1px" }}>{enf.Fase}</span>
                                                {combateTerminado && <span style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", letterSpacing: "1px" }}>FINALIZADO</span>}
                                            </div>
                                            <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem", fontWeight: 900 }}>
                                                VS <span style={{ color: "#ff4757" }}>{rival.toUpperCase()}</span>
                                            </h3>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", padding: "8px 16px" }}>
                                            <span style={{ color: "#10b981", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>{wins}</span>
                                            <span style={{ color: "#30363d", fontWeight: 900 }}>—</span>
                                            <span style={{ color: "#ff4757", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>{losses}</span>
                                            <span style={{ color: "#8b949e", fontSize: "0.65rem", marginLeft: "4px" }}>BO{enf.Rondas_Mejor_De}</span>
                                        </div>
                                    </div>

                                    {/* RONDAS / AVISO DE ADMIN */}
                                    {fueForzado ? (
                                        <div style={{ width: "100%", background: "rgba(255,165,2,0.1)", border: "1px dashed #ffa502", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#ffa502", fontWeight: 800, letterSpacing: "1px" }}>
                                                COMBATE RESUELTO POR ADMINISTRACIÓN
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {[...Array(enf.Rondas_Mejor_De)].map((_, i) => {
                                                const rNum = i + 1;
                                                const rep = misReportes.find(x => x.Ronda === rNum);
                                                const result = getRoundResult(rep);
                                                
                                                const isNext = rNum === rondaSiguiente && !rep && !combateTerminado;
                                                const isLocked = (!rep && rNum !== rondaSiguiente) || (!rep && combateTerminado);

                                                if (isLocked) return (
                                                    <div key={rNum} style={{ minWidth: "110px", background: "#0d1117", border: "1px dashed #1e242c", borderRadius: "8px", padding: "12px", opacity: 0.4, textAlign: "center" }}>
                                                        <span style={{ fontSize: "0.65rem", color: "#8b949e", letterSpacing: "1px" }}>R{rNum} {combateTerminado ? "🏁" : "🔒"}</span>
                                                    </div>
                                                );

                                                if (isNext) return (
                                                    <button key={rNum} onClick={() => setEditandoRonda({ enf, rNum })} style={{ minWidth: "110px", background: "rgba(255,71,87,0.08)", border: "2px dashed #ff4757", borderRadius: "8px", padding: "12px", cursor: "pointer", textAlign: "center", transition: "all 0.2s", color: "#ff4757", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "1.5px" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,71,87,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,71,87,0.08)"; e.currentTarget.style.transform = ""; }}>
                                                        + REPORTAR R{rNum}
                                                    </button>
                                                );

                                                return (
                                                    <div key={rNum} style={{ minWidth: "110px", background: "#0d1117", border: `1px solid ${result ? resultColors[result] : "#30363d"}`, borderRadius: "8px", padding: "12px", boxShadow: result ? `0 0 10px ${resultColors[result]}20` : "none" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                            <span style={{ fontSize: "0.65rem", color: "#8b949e", letterSpacing: "1px" }}>RONDA {rNum}</span>
                                                            {result && <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: resultColors[result], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, color: "#fff" }}>{resultLabels[result]}</span>}
                                                        </div>
                                                        <RoundStatusBadge rep={rep} onView={() => cargarVisor(rep)} onEdit={() => setEditandoRonda({ enf, rNum })} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── VISOR ────────────────────────────────────────────────────── */}
            {modo === "visor" && stats && (
                <div className="animation-fade">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <div>
                            <h2 className="combat-main-title" style={{ margin: 0, border: "none", padding: 0, textAlign: "left", fontSize: "1.2rem" }}>ARCHIVO DE COMBATE</h2>
                            <p style={{ margin: "2px 0 0", color: "#8b949e", fontSize: "0.8rem", letterSpacing: "1px" }}>{stats.p1Name} <span style={{ color: "#ff4757" }}>VS</span> {stats.p2Name}</p>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {onRequestFullscreen && <button className="combat-btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: "0.75rem" }} onClick={() => onRequestFullscreen(iframeContent, stats)}>⛶ PANTALLA COMPLETA</button>}
                            <button className="combat-btn-stealth" style={{ width: "auto", padding: "8px 16px", fontSize: "0.75rem" }} onClick={() => setModo("listado")}>← CERRAR</button>
                        </div>
                    </div>

                    <div className="combat-iframe-wrapper" style={{ maxWidth: "1000px", margin: "0 auto 1.5rem auto", overflow: "hidden", borderRadius: "8px", border: "2px solid #30363d", borderTop: "3px solid #ff4757" }}>
                        <iframe title="Replay" srcDoc={iframeContent} sandbox="allow-scripts allow-same-origin" scrolling="no" style={{ width: "100%", height: "450px", border: "none", display: "block", overflow: "hidden" }} />
                    </div>

                    <div className="combat-stats-dashboard" style={{ maxWidth: "1000px", margin: "0 auto" }}>
                        <h3 className="combat-stats-title">REPORTE POST-COMBATE</h3>
                        <div className="combat-kpi-grid" style={{ marginBottom: "2rem" }}>
                            <div className="combat-kpi-card winner-kpi"><span className="kpi-label">VICTORIA PARA</span><span className="kpi-value">{stats.ganador}</span></div>
                            <div className="combat-kpi-card"><span className="kpi-label">TURNOS</span><span className="kpi-value">{stats.turnos}</span></div>
                            <div className="combat-kpi-card"><span className="kpi-label">BAJAS</span><span className="kpi-value">{stats.muertos}</span></div>
                        </div>

                        <div className="combat-teams-wrapper">
                            {[{ name: stats.p1Name, team: stats.p1Team }, { name: stats.p2Name, team: stats.p2Team }].map((gr, idx) => (
                                <div key={idx} className="combat-team-box">
                                    <h4 className="combat-team-title">Equipo {gr.name}</h4>
                                    <div className="combat-sprites-grid">
                                        {gr.team.length > 0 ? gr.team.map((pk, i) => (
                                            <div key={i} className={`combat-poke-card ${pk.dead ? "is-dead" : "is-alive"}`} style={{ position: "relative" }} onMouseEnter={() => setHoveredPoke(pk)} onMouseLeave={() => setHoveredPoke(null)}>
                                                <img src={`https://play.pokemonshowdown.com/sprites/gen5/${toId(pk.especie)}.png`} alt={pk.especie} onError={e => { e.target.src = "https://play.pokemonshowdown.com/sprites/gen5/0.png"; }} />
                                                <div className="combat-state-badge">{pk.dead ? "💀 DEAD" : "ALIVE"}</div>
                                                <span className="combat-poke-name" title={pk.nickname}>{pk.nickname}</span>
                                                {hoveredPoke === pk && pk.intel && (
                                                    <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", width: "180px", background: "rgba(13,17,23,0.98)", border: "1px solid #00d2d3", borderRadius: "8px", padding: "12px", zIndex: 1000, boxShadow: "0 10px 30px rgba(0,210,211,0.2)", textAlign: "left", fontSize: "0.75rem", color: "#c9d1d9", pointerEvents: "none" }}>
                                                        <div style={{ position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%) rotate(45deg)", width: "10px", height: "10px", background: "rgba(13,17,23,0.98)", borderRight: "1px solid #00d2d3", borderBottom: "1px solid #00d2d3" }} />
                                                        <div style={{ color: "#fff", fontWeight: 900, borderBottom: "1px solid #30363d", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                                                            <span>{pk.especie}</span>
                                                            {pk.intel.nature && <span style={{ color: "#ff4757", fontSize: "0.7rem" }}>({pk.intel.nature})</span>}
                                                        </div>
                                                        {pk.intel.item && <div style={{ marginBottom: "4px" }}><strong style={{ color: "#8b949e" }}>Item:</strong> <span style={{ color: "#00d2d3" }}>{pk.intel.item}</span></div>}
                                                        {pk.intel.ability && <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8b949e" }}>Abil:</strong> <span style={{ color: "#10b981" }}>{pk.intel.ability}</span></div>}
                                                        {pk.intel.evs && Object.keys(pk.intel.evs).length > 0 && (
                                                            <div style={{ marginBottom: "8px" }}>
                                                                <strong style={{ color: "#8b949e", display: "block", marginBottom: "2px" }}>EVs Spread:</strong>
                                                                {Object.entries(pk.intel.evs).map(([n, v]) => <StatBar key={n} name={n} val={v} isIV={false} />)}
                                                            </div>
                                                        )}
                                                        {pk.intel.moves?.length > 0 && (
                                                            <div>
                                                                <strong style={{ color: "#8b949e", display: "block", marginBottom: "2px" }}>Moveset:</strong>
                                                                <ul style={{ paddingLeft: "15px", margin: 0, color: "#fff", listStyleType: "circle" }}>
                                                                    {pk.intel.moves.map((m, i) => <li key={i}>{m}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )) : <p className="combat-unknown">Equipo clasificado</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL REPORTE / EDICIÓN ──────────────────────────────────── */}
            {editandoRonda && (() => {
                const { enf, rNum } = editandoRonda;
                const key = `${enf.ID}-${rNum}`;
                const fd = formData[key] || {};
                const rival = Number(enf.ID_Jugador1) === Number(usuarioData.id) ? enf.Jugador2_Nombre : enf.Jugador1_Nombre;
                const rivalId = Number(enf.ID_Jugador1) === Number(usuarioData.id) ? enf.ID_Jugador2 : enf.ID_Jugador1;
                const subeReplay = fd.Sube_Replay !== false;

                return (
                    <>
                        <div className="premium-backdrop" style={{ zIndex: 9998 }} onClick={() => setEditandoRonda(null)} />
                        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                            <div className="animation-fade" style={{
                                width: "100%", maxWidth: "580px",
                                background: "rgba(13,17,23,0.97)", border: "2px solid #ff4757",
                                borderRadius: "14px", padding: "2rem",
                                boxShadow: "0 20px 60px rgba(255,71,87,0.15)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,71,87,0.3)", paddingBottom: "1rem" }}>
                                    <div>
                                        <h2 style={{ color: "#ff4757", margin: "0 0 4px", fontStyle: "italic", letterSpacing: "2px" }}>REPORTE TÁCTICO</h2>
                                        <p style={{ color: "#8b949e", margin: 0, fontSize: "0.8rem" }}>RONDA {rNum} · VS {rival.toUpperCase()}</p>
                                    </div>
                                    <button onClick={() => setEditandoRonda(null)} style={{ background: "transparent", border: "none", color: "#8b949e", cursor: "pointer", fontSize: "1.2rem", padding: 0 }}>✕</button>
                                </div>

                                <div style={{ marginBottom: "1.2rem" }}>
                                    <label style={{ display: "block", fontSize: "0.72rem", color: "#8b949e", letterSpacing: "2px", marginBottom: "8px" }}>RESULTADO DE LA OPERACIÓN</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {[
                                            { value: String(usuarioData.id), label: "VICTORIA", color: "#10b981" },
                                            { value: String(rivalId), label: "DERROTA", color: "#ff4757" },
                                            { value: "0", label: "EMPATE", color: "#ffa502" }
                                        ].map(opt => (
                                            <button key={opt.value}
                                                onClick={() => handleFormChange(enf.ID, rNum, "ID_Ganador_Extraido", opt.value)}
                                                style={{
                                                    flex: 1, padding: "10px", borderRadius: "8px", cursor: "pointer",
                                                    fontWeight: 900, fontSize: "0.72rem", letterSpacing: "1px",
                                                    border: `2px solid ${fd.ID_Ganador_Extraido === opt.value ? opt.color : "#30363d"}`,
                                                    background: fd.ID_Ganador_Extraido === opt.value ? `${opt.color}20` : "#0d1117",
                                                    color: fd.ID_Ganador_Extraido === opt.value ? opt.color : "#8b949e",
                                                    transition: "all 0.2s"
                                                }}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.2rem", cursor: "pointer", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid #30363d" }}>
                                    <div
                                        onClick={() => handleFormChange(enf.ID, rNum, "Sube_Replay", !subeReplay)}
                                        style={{ width: "36px", height: "20px", borderRadius: "10px", position: "relative", cursor: "pointer", background: subeReplay ? "#00d2d3" : "#30363d", transition: "background 0.2s", flexShrink: 0 }}>
                                        <div style={{ position: "absolute", top: "3px", left: subeReplay ? "18px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                                    </div>
                                    <div>
                                        <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: "0.82rem" }}>Aportar Log de Inteligencia</span>
                                        <span style={{ display: "block", color: "#8b949e", fontSize: "0.7rem" }}>Incluir replay para análisis</span>
                                    </div>
                                </label>

                                {subeReplay && (
                                    <div className="animation-fade" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.2rem" }}>
                                        {[
                                            { field: "Replay_Log", placeholder: "Pega el Replay Log aquí...", rows: 4 },
                                            { field: "Equipo", placeholder: "Pega tu Equipo (Showdown Paste)...", rows: 4 }
                                        ].map(ta => (
                                            <textarea key={ta.field} rows={ta.rows} placeholder={ta.placeholder}
                                                value={fd[ta.field] || ""}
                                                onChange={e => handleFormChange(enf.ID, rNum, ta.field, e.target.value)}
                                                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", color: "#10b981", fontFamily: "monospace", fontSize: "0.78rem", resize: "vertical", outline: "none", transition: "border-color 0.2s" }}
                                                onFocus={e => e.target.style.borderColor = "#00d2d3"}
                                                onBlur={e => e.target.style.borderColor = "#30363d"}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button className="combat-btn-primary" style={{ flex: 1 }} onClick={() => enviarReporte(enf, rNum)}>TRANSMITIR DATOS</button>
                                    <button className="combat-btn-stealth" style={{ width: "auto", padding: "0 20px" }} onClick={() => setEditandoRonda(null)}>CANCELAR</button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}