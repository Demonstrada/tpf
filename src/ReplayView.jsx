import React, { useState, useRef, useEffect } from "react";

const iframeStyles = `
html, body, .wrapper { background: #0d1117 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
.battle-log, .rightbar, .battle-history { background: #0d1117 !important; color: #c9d1d9 !important; border-color: #30363d !important; }
.chat, .message { color: #c9d1d9 !important; }
.chat strong { color: #00d2d3 !important; }
.battle { background: #1a1e24 !important; border: 1px solid #30363d !important; }
.replay-controls, .replay-controls-2 { background: #0d1117 !important; border: 1px solid #30363d !important; }
.replay-controls { border-bottom: none !important; }
.replay-controls button, .speed-controls button, .options-controls button { background: #161b22 !important; color: #c9d1d9 !important; border: 1px solid #30363d !important; border-radius: 4px !important; text-shadow: none !important; box-shadow: none !important; cursor: pointer !important; text-transform: uppercase !important; }
.replay-controls button:hover, .speed-controls button:hover, .options-controls button:hover { background: #1f2937 !important; border-color: #00d2d3 !important; color: #fff !important; }
button.sel { background: #ff4757 !important; color: #fff !important; border-color: #ff4757 !important; }
.replay-controls button i { color: #ff4757 !important; }
.replay-controls button:hover i { color: #fff !important; }
strong { color: #8b949e !important; }
`;

// ─── ESTADO CONFIG ────────────────────────────────────────────────────────────
const ESTADOS = {
    0: { texto: "PENDIENTE", color: "#8b949e", bg: "rgba(139,148,158,0.08)", border: "#30363d" },
    1: { texto: "VALIDADO", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "#10b981" },
    2: { texto: "EN DISPUTA", color: "#ff4757", bg: "rgba(255,71,87,0.08)", border: "#ff4757" },
};

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
const StatBar = ({ statName, valStr }) => {
    const val = parseInt(valStr);
    if (isNaN(val)) return null;
    const pct = Math.min((val / 252) * 100, 100);
    const color = { HP: "#ff4757", Atk: "#ffa502", Def: "#eccc68", SpA: "#00d2d3", SpD: "#10b981", Spe: "#ff6bcb" }[statName] || "#c9d1d9";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.7rem", marginBottom: "2px" }}>
            <span style={{ width: "22px", fontWeight: "bold", color: "#8b949e" }}>{statName}</span>
            <div style={{ flex: 1, background: "#0d1117", height: "6px", borderRadius: "3px", border: "1px solid #30363d" }}>
                <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: "2px" }} />
            </div>
            <span style={{ width: "20px", textAlign: "right", color: "#c9d1d9" }}>{val}</span>
        </div>
    );
};

// ─── BADGE DE ESTADO ──────────────────────────────────────────────────────────
const EstadoBadge = ({ estado }) => {
    const cfg = ESTADOS[Number(estado)] || ESTADOS[0];
    return (
        <span style={{
            display: "inline-block", padding: "3px 10px", borderRadius: "20px",
            fontSize: "0.65rem", fontWeight: 900, letterSpacing: "1.5px",
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
        }}>{cfg.texto}</span>
    );
};

// ─── PANEL DE VALIDACIÓN ADMIN ────────────────────────────────────────────────
const AdminValidationPanel = ({ combate, baseURL, onEstadoChange }) => {
    const [loading, setLoading] = useState(false);

    const cambiarEstado = async (nuevoEstado) => {
        setLoading(true);
        try {
            const res = await fetch(`${baseURL}/combates/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ID_Enfrentamiento: combate.ID_Enfrentamiento,
                    Ronda: combate.Ronda,
                    Estado: nuevoEstado
                })
            });
            if (res.ok) onEstadoChange(combate.ID_Enfrentamiento, combate.Ronda, nuevoEstado);
        } catch { /* silencioso */ }
        setLoading(false);
    };

    const estadoActual = Number(combate.Estado);

    return (
        <div style={{
            marginTop: "1rem", padding: "12px 14px",
            background: "rgba(255,255,255,0.02)", border: "1px solid #30363d",
            borderRadius: "8px"
        }}>
            <div style={{ fontSize: "0.6rem", color: "#8b949e", letterSpacing: "2px", marginBottom: "8px" }}>
                VEREDICTO ADMINISTRATIVO
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
                {[
                    { estado: 1, label: "VALIDAR", color: "#10b981" },
                    { estado: 2, label: "DISPUTA", color: "#ff4757" },
                    { estado: 0, label: "PENDIENTE", color: "#8b949e" },
                ].map(opt => (
                    <button
                        key={opt.estado}
                        disabled={loading || estadoActual === opt.estado}
                        onClick={() => cambiarEstado(opt.estado)}
                        style={{
                            flex: 1, padding: "7px 0", borderRadius: "6px",
                            fontSize: "0.65rem", fontWeight: 900, letterSpacing: "1px",
                            cursor: estadoActual === opt.estado ? "default" : "pointer",
                            border: `1px solid ${estadoActual === opt.estado ? opt.color : "#30363d"}`,
                            background: estadoActual === opt.estado ? `${opt.color}22` : "#0d1117",
                            color: estadoActual === opt.estado ? opt.color : "#8b949e",
                            transition: "all 0.2s", opacity: loading ? 0.6 : 1
                        }}
                        onMouseEnter={e => { if (estadoActual !== opt.estado && !loading) { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.color = opt.color; } }}
                        onMouseLeave={e => { if (estadoActual !== opt.estado) { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#8b949e"; } }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function ReplayView({ baseURL = "http://localhost:5000", onRequestFullscreen }) {
    const [step, setStep] = useState("list");
    const [logText, setLogText] = useState("");
    const [iframeContent, setIframeContent] = useState("");
    const [stats, setStats] = useState(null);
    const [showSpoilers, setShowSpoilers] = useState(false);
    const [replayFinished, setReplayFinished] = useState(false);

    const [reportesRaw, setReportesRaw] = useState([]);
    const [modalPov, setModalPov] = useState(null);
    const [hoveredPoke, setHoveredPoke] = useState(null);

    const [filtros, setFiltros] = useState({ evento: "", jugador: "", estado: "", ronda: "" });

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetch(`${baseURL}/reportes-completos`)
            .then(res => res.json())
            .then(data => setReportesRaw(data))
            .catch(err => console.error("Error cargando replays:", err));
    }, [baseURL]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === "REPLAY_ENDED" && step === "player") setReplayFinished(true);
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [step]);

    // ── ACTUALIZAR ESTADO LOCALMENTE TRAS CAMBIO ADMIN ───────────────────────
    const handleEstadoChange = (enfId, ronda, nuevoEstado) => {
        setReportesRaw(prev => prev.map(r =>
            r.ID_Enfrentamiento === enfId && r.Ronda === ronda
                ? { ...r, Estado: nuevoEstado }
                : r
        ));
        // Si el modal está abierto, actualizarlo también
        if (modalPov?.ID_Enfrentamiento === enfId && modalPov?.Ronda === ronda) {
            setModalPov(prev => ({ ...prev, Estado: nuevoEstado }));
        }
    };

    // ── EXTRAER AVATARES ──────────────────────────────────────────────────────
    const extraerAvataresShowdown = (logTexto, nombreJ1, nombreJ2) => {
        let p1Av = "ethan", p2Av = "lyra";
        let match1 = null, match2 = null;
        if (!logTexto) return { avatarJ1: p1Av, avatarJ2: p2Av };
        const matchHtml = logTexto.match(/<script[^>]*class="battle-log-data"[^>]*>([\s\S]*?)<\/script>/i);
        const textoCombate = matchHtml ? matchHtml[1] : logTexto;
        for (let linea of textoCombate.split("\n")) {
            const parts = linea.split("|");
            if (parts.length >= 5 && parts[1] === "player") {
                const pid = parts[2], pName = parts[3].toLowerCase().trim(), avatarId = parts[4] || "unknown";
                if (pid === "p1") p1Av = avatarId;
                if (pid === "p2") p2Av = avatarId;
                const nom1 = (nombreJ1 || "").toLowerCase().trim();
                const nom2 = (nombreJ2 || "").toLowerCase().trim();
                if (nom1 && (pName.includes(nom1) || nom1.includes(pName))) match1 = avatarId;
                else if (nom2 && (pName.includes(nom2) || nom2.includes(pName))) match2 = avatarId;
            }
        }
        return { avatarJ1: match1 || p1Av, avatarJ2: match2 || p2Av };
    };

    // ── AGRUPAR REPORTES ──────────────────────────────────────────────────────
    const procesarReportes = () => {
        const agrupados = {};
        reportesRaw.forEach(rep => {
            if (filtros.evento && !rep.Evento_Nombre.toLowerCase().includes(filtros.evento.toLowerCase())) return;
            if (filtros.ronda && rep.Ronda.toString() !== filtros.ronda) return;
            if (filtros.estado && rep.Estado.toString() !== filtros.estado) return;
            if (filtros.jugador) {
                const s = filtros.jugador.toLowerCase();
                if (!rep.Jugador1_Nombre.toLowerCase().includes(s) && !rep.Jugador2_Nombre.toLowerCase().includes(s)) return;
            }
            const key = `${rep.ID_Enfrentamiento}-${rep.Ronda}`;
            if (!agrupados[key]) {
                const avatares = extraerAvataresShowdown(rep.Replay_Log, rep.Jugador1_Nombre, rep.Jugador2_Nombre);
                agrupados[key] = {
                    ID_Enfrentamiento: rep.ID_Enfrentamiento,
                    Evento_Nombre: rep.Evento_Nombre,
                    Ronda: rep.Ronda,
                    Estado: rep.Estado,
                    Jugador1_Nombre: rep.Jugador1_Nombre,
                    Jugador1_ID: rep.Jugador1_ID,
                    Showdown_Avatar_J1: avatares.avatarJ1,
                    Jugador2_Nombre: rep.Jugador2_Nombre,
                    Jugador2_ID: rep.Jugador2_ID,
                    Showdown_Avatar_J2: avatares.avatarJ2,
                    Logs: {}, Equipos: {}
                };
            }
            agrupados[key].Logs[rep.ID_Jugador_Reporta] = rep.Replay_Log;
            agrupados[key].Equipos[rep.ID_Jugador_Reporta] = rep.Equipo;
        });
        return Object.values(agrupados);
    };

    const reportesAgrupados = procesarReportes();

    const toId = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

    // ── PARSER DE EQUIPO ──────────────────────────────────────────────────────
    const parsearEquipoCompleto = (texto) => {
        if (!texto) return [];
        const pokes = [];
        let currentPoke = null;
        for (let linea of texto.split('\n')) {
            linea = linea.trim();
            if (linea === '') { if (currentPoke) { pokes.push(currentPoke); currentPoke = null; } continue; }
            if (!currentPoke) {
                currentPoke = { nickname: '', species: '', item: '', ability: '', evs: {}, ivs: {}, nature: '', moves: [] };
                let namePart = linea.split('@')[0].replace(/\(M\)/g, '').replace(/\(F\)/g, '').trim();
                if (linea.includes('@')) currentPoke.item = linea.split('@')[1].trim();
                const match = namePart.match(/(.*)\s+\((.*)\)/);
                if (match) { currentPoke.nickname = match[1].trim(); currentPoke.species = match[2].trim(); }
                else { currentPoke.species = namePart; currentPoke.nickname = namePart; }
            } else {
                if (linea.startsWith('Ability:')) currentPoke.ability = linea.substring(8).trim();
                else if (linea.startsWith('EVs:')) {
                    for (let p of linea.substring(4).split('/')) {
                        const [val, stat] = p.trim().split(' ');
                        if (stat) currentPoke.evs[stat.trim()] = val.trim();
                    }
                }
                else if (linea.startsWith('IVs:')) {
                    for (let p of linea.substring(4).split('/')) {
                        const [val, stat] = p.trim().split(' ');
                        if (stat) currentPoke.ivs[stat.trim()] = val.trim();
                    }
                }
                else if (linea.includes('Nature')) currentPoke.nature = linea.split('Nature')[0].trim();
                else if (linea.startsWith('-')) currentPoke.moves.push(linea.substring(1).trim());
            }
        }
        if (currentPoke) pokes.push(currentPoke);
        return pokes;
    };

    // ── ANALIZADOR DE LOG MEJORADO ────────────────────────────────────────────
    const analizarLog = (textoBruto, pasteJ1 = "", pasteJ2 = "", nombreJ1 = "", nombreJ2 = "") => {
        const eqJ1 = parsearEquipoCompleto(pasteJ1);
        const eqJ2 = parsearEquipoCompleto(pasteJ2);

        const textoSaneado = textoBruto.replace(/\\n/g, "\n");
        const matchHtml = textoSaneado.match(/<script[^>]*class="battle-log-data"[^>]*>([\s\S]*?)<\/script>/i);
        const textoCombate = matchHtml ? matchHtml[1] : textoSaneado;

        const lineas = textoCombate.split(/\r?\n/);
        let ganador = "Empate / No finalizado", turnos = 0;
        let p1Name = "Jugador 1", p2Name = "Jugador 2";
        let p1Team = [], p2Team = [], p1Active = {}, p2Active = {};

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
            if (accion === "win") ganador = parts[2];
            if (accion === "turn") turnos = parseInt(parts[2]);
            if (accion === "player") {
                if (parts[2] === "p1" && parts[3]) p1Name = parts[3];
                if (parts[2] === "p2" && parts[3]) p2Name = parts[3];
            }
            if (accion === "poke") {
                const especie = parts[3].split(",")[0];
                if (parts[2] === "p1") p1Team.push({ especie, nickname: especie, dead: false, intel: { moves: new Set(), item: "?", ability: "?" } });
                if (parts[2] === "p2") p2Team.push({ especie, nickname: especie, dead: false, intel: { moves: new Set(), item: "?", ability: "?" } });
            }
            if (accion === "switch" || accion === "drag") {
                const identificador = parts[2], slot = identificador.substring(0, 2);
                const nickname = identificador.substring(5).trim();
                const especieSaliente = parts[3].split(",")[0];
                if (slot === "p1") p1Active[identificador] = especieSaliente;
                if (slot === "p2") p2Active[identificador] = especieSaliente;
                const team = slot === "p1" ? p1Team : p2Team;
                const pokeObj = team.find(p => p.especie === especieSaliente);
                if (pokeObj) pokeObj.nickname = nickname;
            }
            if (accion === "move") updatePokeData(parts[2], p => p.intel.moves.add(parts[3]));
            if (accion === "-item") updatePokeData(parts[2], p => { p.intel.item = parts[3]; });
            if (accion === "-ability") updatePokeData(parts[2], p => { p.intel.ability = parts[3]; });
            if (accion === "faint") updatePokeData(parts[2], p => { p.dead = true; });
        });

        const n1 = (nombreJ1 || "").toLowerCase().trim();
        const n2 = (nombreJ2 || "").toLowerCase().trim();
        const rp1 = (p1Name || "").toLowerCase().trim();
        const rp2 = (p2Name || "").toLowerCase().trim();

        let p1Paste = [...eqJ1];
        let p2Paste = [...eqJ2];

        if ((n2 && rp1.includes(n2)) || (n1 && rp2.includes(n1))) {
            p1Paste = [...eqJ2];
            p2Paste = [...eqJ1];
        }

        const mapIntel = (team, pasteArray) => {
            team.forEach(pokeLog => {
                let matchIdx = pasteArray.findIndex(p =>
                    p.species.toLowerCase() === pokeLog.especie.toLowerCase() &&
                    p.nickname.toLowerCase() === pokeLog.nickname.toLowerCase()
                );
                if (matchIdx === -1) {
                    matchIdx = pasteArray.findIndex(p => p.species.toLowerCase() === pokeLog.especie.toLowerCase());
                }

                if (matchIdx > -1) {
                    const match = pasteArray[matchIdx];
                    pokeLog.intel = {
                        ...match,
                        moves: match.moves.length > 0 ? match.moves : Array.from(pokeLog.intel.moves),
                        item: match.item || pokeLog.intel.item,
                        ability: match.ability || pokeLog.intel.ability
                    };
                    pasteArray.splice(matchIdx, 1);
                } else {
                    pokeLog.intel.moves = Array.from(pokeLog.intel.moves);
                }
            });
        };

        mapIntel(p1Team, p1Paste);
        mapIntel(p2Team, p2Paste);

        setStats({ ganador, turnos, p1Name, p2Name, p1Team, p2Team, muertos: [...p1Team, ...p2Team].filter(p => p.dead).length });

        const logEscapado = textoCombate.replace(/<\/script>/gi, "<\\/script>");
        const htmlVisor = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${iframeStyles}</style></head><body><div class="wrapper replay-wrapper"><div class="battle"></div><div class="battle-log"></div><div class="replay-controls"></div><div class="replay-controls-2"></div></div><script type="text/plain" class="battle-log-data">${logEscapado}</script><script src="https://play.pokemonshowdown.com/js/replay-embed.js"></script><script>var progressChecker=setInterval(function(){if(window.battle&&window.battle.ended){window.parent.postMessage('REPLAY_ENDED','*');clearInterval(progressChecker);}},1000);</script></body></html>`;

        setIframeContent(htmlVisor);
        setStep("spoilers");
    };
    const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) leerArchivo(file); };
    const handleFileSelect = (e) => { const file = e.target.files[0]; if (file) leerArchivo(file); };

    const leerArchivo = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            setLogText(event.target.result);
            analizarLog(event.target.result);
        };
        reader.readAsText(file);
    };
    const seleccionarPov = (jugadorId) => {
        const equipo1 = modalPov.Equipos[modalPov.Jugador1_ID] || "";
        const equipo2 = modalPov.Equipos[modalPov.Jugador2_ID] || "";
        setModalPov(null);
        analizarLog(modalPov.Logs[jugadorId], equipo1, equipo2, modalPov.Jugador1_Nombre, modalPov.Jugador2_Nombre);
    };
    // ── RENDER EQUIPO ─────────────────────────────────────────────────────────
    const renderTeam = (teamName, teamArray) => (
        <div className="combat-team-box">
            <h4 className="combat-team-title">Equipo {teamName}</h4>
            <div className="combat-sprites-grid">
                {teamArray.length > 0 ? teamArray.map((poke, index) => (
                    <div
                        key={index}
                        className={`combat-poke-card ${poke.dead ? "is-dead" : "is-alive"}`}
                        onMouseEnter={() => setHoveredPoke(poke)}
                        onMouseLeave={() => setHoveredPoke(null)}
                        style={{ position: "relative" }}
                    >
                        <img
                            src={`https://play.pokemonshowdown.com/sprites/gen5/${toId(poke.especie)}.png`}
                            alt={poke.especie}
                            onError={e => { e.target.src = "https://play.pokemonshowdown.com/sprites/gen5/0.png"; }}
                        />
                        <div className="combat-state-badge">{poke.dead ? "DEAD" : "ALIVE"}</div>
                        <span className="combat-poke-name" title={poke.nickname}>{poke.nickname}</span>

                        {hoveredPoke === poke && poke.intel && (
                            <div style={{
                                position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)",
                                width: "180px", background: "rgba(13,17,23,0.98)", border: "1px solid #00d2d3",
                                borderRadius: "8px", padding: "12px", zIndex: 1000,
                                boxShadow: "0 10px 30px rgba(0,210,211,0.2)", textAlign: "left",
                                fontSize: "0.75rem", color: "#c9d1d9", pointerEvents: "none"
                            }}>
                                <div style={{ position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%) rotate(45deg)", width: "10px", height: "10px", background: "rgba(13,17,23,0.98)", borderRight: "1px solid #00d2d3", borderBottom: "1px solid #00d2d3" }} />
                                <div style={{ color: "#fff", fontWeight: 900, borderBottom: "1px solid #30363d", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                                    <span>{poke.especie}</span>
                                    {poke.intel.nature && <span style={{ color: "#ff4757", fontSize: "0.7rem" }}>({poke.intel.nature})</span>}
                                </div>
                                {poke.intel.item && <div style={{ marginBottom: "4px" }}><strong style={{ color: "#8b949e" }}>Item:</strong> <span style={{ color: "#00d2d3" }}>{poke.intel.item}</span></div>}
                                {poke.intel.ability && <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8b949e" }}>Abil:</strong> <span style={{ color: "#10b981" }}>{poke.intel.ability}</span></div>}
                                {poke.intel.evs && Object.keys(poke.intel.evs).length > 0 && (
                                    <div style={{ marginBottom: "8px" }}>
                                        <strong style={{ color: "#8b949e", display: "block", marginBottom: "2px" }}>EVs Spread:</strong>
                                        {Object.entries(poke.intel.evs).map(([stat, val]) => <StatBar key={stat} statName={stat} valStr={val} />)}
                                    </div>
                                )}
                                {poke.intel.moves?.length > 0 && (
                                    <div>
                                        <strong style={{ color: "#8b949e", display: "block", marginBottom: "2px" }}>Moveset:</strong>
                                        <ul style={{ paddingLeft: "15px", margin: 0, color: "#fff", listStyleType: "circle" }}>
                                            {poke.intel.moves.map((m, i) => <li key={i}>{m}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )) : <p className="combat-unknown">Equipo clasificado</p>}
            </div>
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div className="replay-view-container">

            {/* ── CABECERA ──────────────────────────────────────────────────── */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                marginBottom: "2rem", borderBottom: "1px solid rgba(255,71,87,0.3)", paddingBottom: "1.2rem"
            }}>
                <div>
                    <h2 className="combat-main-title" style={{ margin: 0, border: "none", padding: 0, textAlign: "left" }}>
                        ARENA DE ANÁLISIS
                    </h2>
                    <p style={{ color: "#8b949e", margin: "4px 0 0", fontSize: "0.85rem", letterSpacing: "1px" }}>
                        {reportesAgrupados.length} COMBATE{reportesAgrupados.length !== 1 ? "S" : ""} REGISTRADO{reportesAgrupados.length !== 1 ? "S" : ""}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {step === "list" && (
                        <button className="combat-btn-primary" onClick={() => setStep("input")} style={{ width: "auto", padding: "0.8rem 1.5rem" }}>
                            SUBIR REPLAY MANUAL
                        </button>
                    )}
                    {step !== "list" && (
                        <button className="combat-btn-stealth" onClick={() => { setStep("list"); setIframeContent(""); setStats(null); setHoveredPoke(null); }} style={{ width: "auto", padding: "0.8rem 1.5rem" }}>
                            VOLVER A TORNEOS
                        </button>
                    )}
                </div>
            </div>

            {/* ── LISTADO ───────────────────────────────────────────────────── */}
            {step === "list" && (
                <div className="animation-fade">

                    {/* FILTROS */}
                    <div style={{
                        display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem",
                        background: "rgba(22,27,34,0.8)", padding: "1.2rem",
                        borderRadius: "10px", border: "1px solid #30363d"
                    }}>
                        {[
                            { key: "evento", placeholder: "Filtrar por Evento..." },
                            { key: "jugador", placeholder: "Filtrar por Jugador..." },
                        ].map(f => (
                            <input
                                key={f.key}
                                type="text"
                                placeholder={f.placeholder}
                                value={filtros[f.key]}
                                onChange={e => setFiltros({ ...filtros, [f.key]: e.target.value })}
                                style={{
                                    flex: 1, minWidth: "160px", padding: "0.75rem 1rem",
                                    borderRadius: "8px", background: "#0d1117", color: "#c9d1d9",
                                    border: "1px solid #30363d", outline: "none", fontSize: "0.85rem",
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={e => e.target.style.borderColor = "#00d2d3"}
                                onBlur={e => e.target.style.borderColor = "#30363d"}
                            />
                        ))}
                        <select
                            value={filtros.estado}
                            onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
                            style={{
                                padding: "0.75rem 1rem", borderRadius: "8px",
                                background: "#0d1117", color: "#c9d1d9",
                                border: "1px solid #30363d", outline: "none", fontSize: "0.85rem"
                            }}
                        >
                            <option value="">Todos los estados</option>
                            <option value="1">Validados</option>
                            <option value="0">Pendientes</option>
                            <option value="2">En Disputa</option>
                        </select>
                    </div>

                    {/* TARJETAS */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.2rem" }}>
                        {reportesAgrupados.length === 0 && (
                            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "12px" }}>
                                <p style={{ margin: 0, letterSpacing: "2px", fontSize: "0.85rem" }}>SIN COMBATES REGISTRADOS</p>
                            </div>
                        )}
                        {reportesAgrupados.map((rep, index) => {
                            const cfg = ESTADOS[Number(rep.Estado)] || ESTADOS[0];
                            const isTorneo = String(rep.ID_Enfrentamiento).startsWith('T_');

                            return (
                                <div
                                    key={index}
                                    style={{
                                        background: "rgba(22,27,34,0.7)", border: "1px solid #30363d",
                                        borderLeft: `4px solid ${cfg.color}`, borderRadius: "12px",
                                        padding: "1.4rem", backdropFilter: "blur(10px)",
                                        display: "flex", flexDirection: "column", gap: "0",
                                        transition: "box-shadow 0.2s"
                                    }}
                                >
                                    {/* EVENTO + RONDA */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <span style={{ color: "#00d2d3", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "2px", textTransform: "uppercase" }}>
                                            {rep.Evento_Nombre}
                                        </span>
                                        <span style={{ color: "#8b949e", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1px" }}>
                                            RONDA {rep.Ronda}
                                        </span>
                                    </div>

                                    {/* JUGADORES */}
                                    <div style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        background: "#0d1117", padding: "10px 14px", borderRadius: "8px",
                                        border: "1px solid #30363d", marginBottom: "10px"
                                    }}>
                                        <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: "0.9rem" }}>{rep.Jugador1_Nombre}</span>
                                        <span style={{ color: "#ff4757", fontSize: "0.72rem", fontWeight: 900, letterSpacing: "2px" }}>VS</span>
                                        <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: "0.9rem" }}>{rep.Jugador2_Nombre}</span>
                                    </div>

                                    {/* ESTADO + BOTÓN */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <EstadoBadge estado={rep.Estado} />
                                        <button
                                            className="combat-btn-stealth"
                                            style={{ width: "auto", padding: "5px 14px", fontSize: "0.7rem" }}
                                            onClick={() => setModalPov(rep)}
                                        >
                                            VER REPLAY
                                        </button>
                                    </div>

                                    {/* PANEL ADMIN (OCULTO SI ES DE TORNEO) */}
                                    {!isTorneo ? (
                                        <AdminValidationPanel
                                            combate={rep}
                                            baseURL={baseURL}
                                            onEstadoChange={handleEstadoChange}
                                        />
                                    ) : (
                                        <div style={{ marginTop: "1rem", padding: "10px", background: "rgba(16,185,129,0.05)", border: "1px dashed var(--success)", borderRadius: "8px", textAlign: "center" }}>
                                            <span style={{ fontSize: "0.65rem", color: "var(--success)", fontWeight: 800, letterSpacing: "1px" }}>
                                                ✓ GESTIONADO EN EL BRACKET
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── MODAL POV ─────────────────────────────────────────────────── */}
            {modalPov && (
                <>
                    <div className="galeria-backdrop" onClick={() => setModalPov(null)} style={{ zIndex: 100 }} />
                    <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 101, pointerEvents: "none" }}>
                        <div style={{
                            width: "90%", maxWidth: "620px", padding: "2.5rem",
                            background: "rgba(13,17,23,0.97)", border: "2px solid #ff4757",
                            borderRadius: "14px", position: "relative", pointerEvents: "auto",
                            boxShadow: "0 20px 60px rgba(255,71,87,0.15)"
                        }}>
                            <button
                                onClick={() => setModalPov(null)}
                                style={{ position: "absolute", top: "1rem", right: "1rem", background: "#30363d", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                            >×</button>

                            {/* CABECERA MODAL */}
                            <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,71,87,0.3)", paddingBottom: "1rem" }}>
                                <h3 style={{ color: "#ff4757", margin: "0 0 4px", fontStyle: "italic", letterSpacing: "2px", fontWeight: 900 }}>
                                    PUNTO DE VISTA
                                </h3>
                                <p style={{ color: "#8b949e", margin: 0, fontSize: "0.8rem" }}>
                                    {modalPov.Evento_Nombre} · RONDA {modalPov.Ronda}
                                    <span style={{ marginLeft: "10px" }}><EstadoBadge estado={modalPov.Estado} /></span>
                                </p>
                            </div>

                            {/* SELECCIÓN POV */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                {[
                                    { id: modalPov.Jugador1_ID, nombre: modalPov.Jugador1_Nombre, avatar: modalPov.Showdown_Avatar_J1, btnClass: "combat-btn-primary" },
                                    { id: modalPov.Jugador2_ID, nombre: modalPov.Jugador2_Nombre, avatar: modalPov.Showdown_Avatar_J2, btnClass: "combat-btn-danger" },
                                ].map((j, idx) => (
                                    <React.Fragment key={j.id}>
                                        {idx === 1 && (
                                            <div style={{ color: "#ff4757", fontSize: "1.6rem", fontWeight: 900, fontStyle: "italic", textShadow: "0 0 10px rgba(255,71,87,0.4)", flexShrink: 0 }}>VS</div>
                                        )}
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                            <img
                                                src={`https://play.pokemonshowdown.com/sprites/trainers/${j.avatar}.png`}
                                                onError={e => { e.target.src = "https://play.pokemonshowdown.com/sprites/trainers/1.png"; }}
                                                alt={j.nombre}
                                                style={{ height: "110px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))", borderBottom: `3px solid ${idx === 0 ? "#00d2d3" : "#ff4757"}`, paddingBottom: "8px" }}
                                            />
                                            <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: "1rem" }}>{j.nombre}</span>
                                            {modalPov.Logs[j.id]
                                                ? <button className={j.btnClass} onClick={() => seleccionarPov(j.id)} style={{ padding: "0.7rem 1rem", fontSize: "0.82rem" }}>VER SU CÁMARA</button>
                                                : <span style={{ color: "#8b949e", fontSize: "0.75rem", fontStyle: "italic" }}>Sin log subido</span>
                                            }
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* PANEL ADMIN DENTRO DEL MODAL (También oculto si es torneo) */}
                            {!String(modalPov.ID_Enfrentamiento).startsWith('T_') && (
                                <AdminValidationPanel
                                    combate={modalPov}
                                    baseURL={baseURL}
                                    onEstadoChange={handleEstadoChange}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── SUBIDA MANUAL ─────────────────────────────────────────────── */}
            {step === "input" && (
                <div className="combat-step animation-fade">
                    <p className="combat-subtitle">Pega el código raw directamente o sube el archivo HTML descargado.</p>
                    <div className="combat-methods-container" style={{ display: "flex", gap: "2rem", justifyContent: "center", alignItems: "stretch", flexWrap: "wrap" }}>
                        <div
                            className="combat-method-card"
                            onClick={() => fileInputRef.current.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDrop}
                            style={{ flex: 1, minWidth: "300px", padding: "2rem", textAlign: "center", cursor: "pointer" }}
                        >
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#00d2d3" }}>[ LOG ]</div>
                            <h3 style={{ margin: 0, color: "#fff", letterSpacing: "1px" }}>SUBIR LOG OFICIAL</h3>
                            <p style={{ color: "#8b949e", fontSize: "0.8rem", marginTop: "8px" }}>Arrastra o haz clic para seleccionar</p>
                            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".txt,.html,.log" onChange={handleFileSelect} />
                        </div>
                        <div className="combat-method-card" style={{ flex: 1, minWidth: "300px", padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#ff4757" }}>[ RAW ]</div>
                            <h3 style={{ margin: "0 0 1rem", color: "#fff", letterSpacing: "1px" }}>ANÁLISIS MANUAL</h3>
                            <textarea
                                placeholder="Pega el código raw aquí..."
                                value={logText}
                                onChange={e => setLogText(e.target.value)}
                                style={{
                                    flex: 1, width: "100%", boxSizing: "border-box", minHeight: "120px",
                                    padding: "1rem", marginBottom: "1rem", borderRadius: "8px",
                                    background: "#0d1117", color: "#10b981", border: "1px solid #30363d",
                                    resize: "vertical", fontFamily: "monospace", outline: "none"
                                }}
                                onFocus={e => e.target.style.borderColor = "#00d2d3"}
                                onBlur={e => e.target.style.borderColor = "#30363d"}
                            />
                            <button className="combat-btn-primary" onClick={() => { if (logText.trim()) analizarLog(logText); }} disabled={!logText.trim()} style={{ width: "100%" }}>
                                INICIAR SISTEMA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SPOILERS ──────────────────────────────────────────────────── */}
            {step === "spoilers" && (
                <div className="combat-step animation-fade combat-centered">
                    <div className="combat-alert-box" style={{ maxWidth: "480px" }}>
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "50%",
                            background: "rgba(255,71,87,0.1)", border: "2px solid #ff4757",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 1.5rem", fontSize: "1.4rem", color: "#ff4757", fontWeight: 900
                        }}>!</div>
                        <h3 style={{ color: "#fff", fontSize: "1.3rem", margin: "0 0 1rem" }}>DATOS CARGADOS</h3>
                        <p style={{ color: "#8b949e", margin: "0 0 2rem" }}>La simulación está lista. ¿Revelar el resultado antes de la reproducción?</p>
                        <div className="combat-actions">
                            <button className="combat-btn-danger" onClick={() => { setShowSpoilers(true); setStep("player"); }}>
                                MOSTRAR STATS
                            </button>
                            <button className="combat-btn-stealth" onClick={() => { setShowSpoilers(false); setStep("player"); }}>
                                INICIAR A CIEGAS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REPRODUCTOR ───────────────────────────────────────────────── */}
            {step === "player" && (
                <div className="combat-step animation-fade">
                    <div className="combat-iframe-wrapper" style={{ maxWidth: "1000px", margin: "0 auto", overflow: "hidden", borderRadius: "8px", border: "2px solid #30363d", borderTop: "3px solid #ff4757" }}>
                        <iframe
                            title="Showdown Replay"
                            srcDoc={iframeContent}
                            sandbox="allow-scripts allow-same-origin"
                            scrolling="no"
                            style={{ width: "100%", height: "450px", border: "none", display: "block", overflow: "hidden" }}
                        />
                    </div>

                    {/* BOTÓN PANTALLA COMPLETA */}
                    {onRequestFullscreen && (
                        <div style={{ maxWidth: "1000px", margin: "0.8rem auto 0", textAlign: "right" }}>
                            <button
                                className="combat-btn-primary"
                                style={{ width: "auto", padding: "8px 16px", fontSize: "0.75rem" }}
                                onClick={() => onRequestFullscreen(iframeContent, stats)}
                            >
                                PANTALLA COMPLETA
                            </button>
                        </div>
                    )}

                    {(showSpoilers || replayFinished) && stats && (
                        <div className="combat-stats-dashboard animation-fade-up" style={{ maxWidth: "1000px", margin: "2rem auto 0" }}>
                            <h3 className="combat-stats-title">REPORTE POST-COMBATE</h3>
                            <div className="combat-kpi-grid">
                                <div className="combat-kpi-card winner-kpi"><span className="kpi-label">VICTORIA PARA</span><span className="kpi-value">{stats.ganador}</span></div>
                                <div className="combat-kpi-card"><span className="kpi-label">TURNOS</span><span className="kpi-value">{stats.turnos}</span></div>
                                <div className="combat-kpi-card"><span className="kpi-label">BAJAS</span><span className="kpi-value">{stats.muertos}</span></div>
                            </div>
                            <div className="combat-teams-wrapper">
                                {renderTeam(stats.p1Name, stats.p1Team)}
                                {renderTeam(stats.p2Name, stats.p2Team)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}