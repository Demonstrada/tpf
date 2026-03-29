import React, { useState, useEffect, useCallback } from "react";

const ESTADO_CFG = {
    pendiente: { color: "var(--text-muted)", label: "Pendiente" },
    en_curso: { color: "#ffa502", label: "En curso" },
    completada: { color: "var(--success)", label: "Completada" },
    bye: { color: "var(--border-color)", label: "Bye" },
};

const resultColors = { win: "#10b981", draw: "#ffa502", loss: "#ff4757" };
const resultLabels = { win: "V", draw: "E", loss: "D" };

function MatchCard({ partida, onForceResult, onReportar, isAdmin, equipos, usuarioData, bo }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = partida.Estado === 'bye' ? { color: "var(--border-color)", label: "Bye" } : (ESTADO_CFG[partida.Estado] || ESTADO_CFG.pendiente);

    const eq1 = partida.Equipo1_Nombre || "—";
    const eq2 = partida.Equipo2_Nombre || "—";
    const ganadorId = partida.ID_Ganador;

    const miEquipo = equipos?.find(eq => eq.Jugadores && usuarioData?.nombre && eq.Jugadores.includes(usuarioData.nombre));
    const miEquipoId = miEquipo ? miEquipo.ID : null;
    const soyParticipante = miEquipoId === partida.ID_Equipo1 || miEquipoId === partida.ID_Equipo2;

    const handleClick = () => {
        if (partida.Estado === 'bye') return;
        if (soyParticipante || isAdmin) setExpanded(e => !e);
    };

    let winsE1 = 0, winsE2 = 0;
    const misReportes = partida.resultados?.filter(r => Number(r.ID_Jugador) === Number(usuarioData.id)) || [];

    partida.resultados?.forEach(r => {
        if (r.Estado === 'validado') {
            if (Number(r.ID_Ganador_Declarado) === Number(partida.ID_Equipo1)) winsE1++;
            if (Number(r.ID_Ganador_Declarado) === Number(partida.ID_Equipo2)) winsE2++;
        }
    });

    const getRoundResult = (rep) => {
        if (!rep) return null;
        if (rep.Estado === 'validado') {
            if (Number(rep.ID_Ganador_Declarado) === Number(miEquipoId)) return "win";
            return "loss";
        }
        return "draw"
    };

    const maxValidada = Math.max(...(partida.resultados?.filter(r => r.Estado === 'validado').map(r => r.Ronda) || [0]));
    const rondaSiguiente = maxValidada + 1;

    const repRivalSiguiente = partida.resultados?.find(r => r.Ronda === rondaSiguiente && Number(r.ID_Jugador) !== Number(usuarioData.id));

    const rivalReportoRondaSiguiente = repRivalSiguiente
        && repRivalSiguiente.ID_Ganador_Declarado !== null
        && repRivalSiguiente.ID_Ganador_Declarado !== undefined
        && String(repRivalSiguiente.ID_Ganador_Declarado).trim() !== ""
        && String(repRivalSiguiente.ID_Ganador_Declarado) !== "null"
        && repRivalSiguiente.Estado === 'pendiente';

    return (
        <div
            style={{
                background: "var(--bg-card)",
                border: `1px solid ${soyParticipante && partida.Estado !== 'completada' ? (rivalReportoRondaSiguiente ? '#ffa502' : '#00d2d3') : cfg.color}`,
                borderRadius: "6px",
                overflow: "hidden",
                transition: "all 0.2s",
                width: "100%",
                boxShadow: soyParticipante && partida.Estado !== 'completada' ? `0 0 12px ${rivalReportoRondaSiguiente ? 'rgba(255, 165, 2, 0.4)' : 'rgba(0, 210, 211, 0.4)'}` : "none",
                position: "relative"
            }}
        >
            <div onClick={handleClick} style={{ cursor: partida.Estado !== 'bye' ? (soyParticipante || isAdmin ? "pointer" : "default") : "default", display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", background: ganadorId === partida.ID_Equipo1 ? "rgba(16,185,129,0.1)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        {ganadorId && <span style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: ganadorId === partida.ID_Equipo1 ? "var(--success)" : "transparent" }} />}
                        <span style={{ fontSize: "0.82rem", fontWeight: ganadorId === partida.ID_Equipo1 ? 800 : 600, color: partida.ID_Equipo1 ? "var(--text-main)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{eq1}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--success)" }}>{partida.Estado === 'completada' && ganadorId === partida.ID_Equipo1 ? "W" : (winsE1 > 0 ? winsE1 : "")}</span>
                </div>
                <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: ganadorId === partida.ID_Equipo2 ? "rgba(16,185,129,0.1)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        {ganadorId && <span style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: ganadorId === partida.ID_Equipo2 ? "var(--success)" : "transparent" }} />}
                        <span style={{ fontSize: "0.82rem", fontWeight: ganadorId === partida.ID_Equipo2 ? 800 : 600, color: partida.ID_Equipo2 ? "var(--text-main)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{eq2}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--success)" }}>{partida.Estado === 'completada' && ganadorId === partida.ID_Equipo2 ? "W" : (winsE2 > 0 ? winsE2 : "")}</span>
                </div>
            </div>

            {soyParticipante && partida.Estado !== 'completada' && !expanded && (
                <div onClick={handleClick} style={{ cursor: "pointer", background: rivalReportoRondaSiguiente ? "rgba(255, 165, 2, 0.15)" : "rgba(0, 210, 211, 0.15)", color: rivalReportoRondaSiguiente ? "#ffa502" : "#00d2d3", fontSize: "0.65rem", fontWeight: 800, textAlign: "center", padding: "5px 0", letterSpacing: "1px", transition: "background 0.2s" }}>
                    {rivalReportoRondaSiguiente ? "⚠️ RIVAL REPORTÓ R" + rondaSiguiente : "ABRIR RONDAS ▼"}
                </div>
            )}

            {expanded && partida.Estado !== 'completada' && partida.ID_Equipo1 && partida.ID_Equipo2 && (
                <div style={{ padding: "10px", borderTop: "1px solid var(--border-color)", background: "var(--bg-soft)", display: "flex", flexDirection: "column", gap: "8px" }}>

                    {soyParticipante && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                            {[...Array(bo)].map((_, i) => {
                                const rNum = i + 1;
                                const rep = misReportes.find(x => x.Ronda === rNum);
                                const result = getRoundResult(rep);
                                const isNext = rNum === rondaSiguiente && !rep;
                                const isLocked = !rep && rNum > rondaSiguiente;

                                if (isLocked) return (
                                    <div key={rNum} style={{ flex: 1, minWidth: "50px", background: "#0d1117", border: "1px dashed #30363d", borderRadius: "6px", padding: "6px", opacity: 0.4, textAlign: "center" }}>
                                        <span style={{ fontSize: "0.6rem", color: "#8b949e" }}>R{rNum} 🔒</span>
                                    </div>
                                );

                                if (isNext) return (
                                    <button key={rNum} onClick={() => onReportar(partida, rNum)} style={{ flex: 1, minWidth: "50px", background: "rgba(0,210,211,0.1)", border: "1px dashed #00d2d3", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#00d2d3", fontWeight: 800, fontSize: "0.65rem", transition: "all 0.2s" }}>
                                        + R{rNum}
                                    </button>
                                );

                                return (
                                    <button key={rNum} onClick={() => onReportar(partida, rNum)} style={{ flex: 1, minWidth: "50px", background: "#0d1117", border: `1px solid ${result ? resultColors[result] : "#30363d"}`, borderRadius: "6px", padding: "6px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" }}>
                                        <span style={{ fontSize: "0.6rem", color: "#8b949e" }}>R{rNum}</span>
                                        {result && <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: resultColors[result], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 900, color: "#fff" }}>{resultLabels[result]}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {isAdmin && (
                        <>
                            <p style={{ margin: "6px 0 2px", fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.5px", textAlign: "center" }}>FORZAR FIN DE PARTIDA</p>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {[{ id: partida.ID_Equipo1, name: eq1 }, { id: partida.ID_Equipo2, name: eq2 }].map(eq => (
                                    <button key={eq.id} onClick={() => { onForceResult(partida.ID, eq.id); setExpanded(false); }} style={{ flex: 1, padding: "4px 0", fontSize: "0.65rem", fontWeight: 800, background: "var(--success)", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {eq.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}


function RoundColumn({ ronda, hasNext, numSiguiente, roundIndex, onForceResult, onReportar, isAdmin, equipos, torneo, usuarioData }) {
    const esGranFinal = ronda.Rama === 'gran_final';
    const bo = esGranFinal && torneo?.Final_Rondas_Distintas ? torneo.Final_Rondas : (torneo?.Rondas_Partida || 3);
    const branchColor = ronda.Rama === 'ganadores' ? "var(--success)" : ronda.Rama === 'perdedores' ? "#ff4757" : "#ffa502";

    const numActual = ronda.partidas.length;
    const isConverging = hasNext && numSiguiente < numActual;
    const isStraight = hasNext && numSiguiente === numActual;

    const lineW = 30;

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "250px", flexShrink: 0, marginRight: hasNext ? `${lineW * 2}px` : "0" }}>

            <div style={{ textAlign: "center", padding: "8px", borderRadius: "8px", background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderTop: `3px solid ${branchColor}`, marginBottom: "15px", width: "100%", zIndex: 2, position: "relative", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "1px", display: "block" }}>{ronda.Nombre.toUpperCase()}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>MEJOR DE {bo}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
                {ronda.partidas.map((p, idx) => {
                    let connectorStyles = {};

                    if (isStraight) {
                        connectorStyles = {
                            position: "absolute", top: "50%", right: `-${lineW}px`, width: `${lineW}px`, height: "2px", background: "var(--border-color)", zIndex: 0
                        };
                    } else if (isConverging) {
                        if (idx % 2 === 0) {
                            connectorStyles = {
                                position: "absolute", top: "50%", right: `-${lineW}px`, width: `${lineW}px`, height: "50%",
                                borderTop: "2px solid var(--border-color)", borderRight: "2px solid var(--border-color)", borderTopRightRadius: "6px", zIndex: 0
                            };
                        } else {
                            connectorStyles = {
                                position: "absolute", top: "0", right: `-${lineW}px`, width: `${lineW}px`, height: "50%",
                                borderBottom: "2px solid var(--border-color)", borderRight: "2px solid var(--border-color)", borderBottomRightRadius: "6px", zIndex: 0
                            };
                        }
                    }

                    return (
                        <div key={p.ID} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", padding: "10px 0" }}>

                            {roundIndex > 0 && (
                                <div style={{ position: "absolute", top: "50%", left: `-${lineW}px`, width: `${lineW}px`, height: "2px", background: "var(--border-color)", zIndex: 0 }} />
                            )}

                            {hasNext && <div style={connectorStyles} />}

                            <div style={{ position: "relative", zIndex: 1 }}>
                                <MatchCard partida={p} onForceResult={onForceResult} onReportar={onReportar} isAdmin={isAdmin} equipos={equipos} usuarioData={usuarioData} bo={bo} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function BracketSection({ titulo, color, rondas, onForceResult, onReportar, isAdmin, equipos, torneo, usuarioData }) {
    if (rondas.length === 0) return null;
    return (
        <div style={{ marginBottom: "3rem", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem", borderBottom: `2px solid ${color}`, paddingBottom: "10px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "1.5px" }}>{titulo}</span>
            </div>
            {/* Contenedor scrolleable horizontalmente para brackets muy grandes */}
            <div style={{ display: "flex", flexDirection: "row", overflowX: "auto", padding: "10px 10px 2rem 10px", minHeight: "350px" }}>
                {rondas.map((ronda, idx) => {
                    const numActual = ronda.partidas.length;
                    const numSiguiente = idx < rondas.length - 1 ? rondas[idx + 1].partidas.length : 0;
                    const hasNext = idx < rondas.length - 1;

                    return (
                        <RoundColumn
                            key={ronda.ID}
                            ronda={ronda}
                            hasNext={hasNext}
                            numSiguiente={numSiguiente}
                            roundIndex={idx}
                            onForceResult={onForceResult}
                            onReportar={onReportar}
                            isAdmin={isAdmin}
                            equipos={equipos}
                            torneo={torneo}
                            usuarioData={usuarioData}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default function TorneoView({ baseURL, torneo: torneoInicial, isAdmin, onBack, usuarioData }) {
    const [bracket, setBracket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [partidaReporte, setPartidaReporte] = useState(null);
    const [partidaConflicto, setPartidaConflicto] = useState(null);
    const [formReporte, setFormReporte] = useState({ Ronda: 1, ID_Ganador_Extraido: "", Sube_Replay: true, Replay_Log: "", Equipo: "" });

    const torneo = bracket?.torneo || torneoInicial;

    const cargarBracket = useCallback(() => {
        if (!torneoInicial?.ID) return;
        setLoading(true);
        fetch(`${baseURL}/torneos/${torneoInicial.ID}/bracket`)
            .then(r => r.json())
            .then(data => { setBracket(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [baseURL, torneoInicial?.ID]);

    useEffect(() => { cargarBracket(); }, [cargarBracket]);

    const handleForceResult = async (partidaId, ganadorId) => {
        try {
            const res = await fetch(`${baseURL}/torneos/${torneoInicial.ID}/partidas/${partidaId}/forzar`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ID_Ganador: ganadorId })
            });
            if (res.ok) cargarBracket();
            else { const e = await res.json(); alert(e.error || "Error"); }
        } catch { alert("Error de conexión"); }
    };

    const enviarReporteTorneo = async () => {
        if (formReporte.Sube_Replay !== false && (!formReporte.Replay_Log || !formReporte.Equipo)) {
            alert("Debes proporcionar el Log y el Equipo o desactivar la opción de Replay.");
            return;
        }
        if (!formReporte.ID_Ganador_Extraido) { alert("Indica el equipo que ganó el combate."); return; }

        try {
            const res = await fetch(`${baseURL}/torneos/${torneo.ID}/partidas/${partidaReporte.ID}/resultado`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ID_Jugador_Reporta: usuarioData.id,
                    Ronda: formReporte.Ronda,
                    Replay_Log: formReporte.Replay_Log || "",
                    Equipo_Paste: formReporte.Equipo || "",
                    ID_Ganador_Declarado: formReporte.ID_Ganador_Extraido,
                    Sube_Replay: formReporte.Sube_Replay !== false
                })
            });

            if (res.ok) {
                const result = await res.json();
                if (result.estado === 'validado_match') alert("Resultado validado con tu rival. ¡Partida ganada, avanzando en el bracket!");
                else if (result.estado === 'validado_ronda') alert("Ronda validada correctamente. Continuad jugando.");
                else if (result.estado === 'disputa') alert("¡Disputa! Los reportes no coinciden.");
                else alert("Datos de ronda transmitidos. Esperando a tu rival.");

                setPartidaReporte(null);
                cargarBracket();
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch {
            alert("Error de conexión con la Arena.");
        }
    };

    const abrirReporte = (partida, rondaNum) => {
        const repRival = partida.resultados?.find(r => r.Ronda === rondaNum && Number(r.ID_Jugador) !== Number(usuarioData.id));

        const tieneReporteValido = repRival
            && repRival.ID_Ganador_Declarado !== null
            && repRival.ID_Ganador_Declarado !== undefined
            && String(repRival.ID_Ganador_Declarado).trim() !== ""
            && String(repRival.ID_Ganador_Declarado) !== "null";

        if (tieneReporteValido && repRival.Estado === 'pendiente') {
            setPartidaConflicto({ ...partida, repRival, rondaConflicto: rondaNum });
        } else {
            procederAReportar(partida, rondaNum);
        }
    };

    const procederAReportar = (partida, rondaNum) => {
        setPartidaConflicto(null);
        setPartidaReporte(partida);

        const miRep = partida.resultados?.find(r => r.Ronda === rondaNum && Number(r.ID_Jugador) === Number(usuarioData.id));

        setFormReporte({
            Ronda: rondaNum,
            ID_Ganador_Extraido: miRep ? String(miRep.ID_Ganador_Declarado) : "",
            Sube_Replay: miRep ? miRep.Sube_Replay === 1 : true,
            Replay_Log: miRep ? (miRep.Replay_Log || "") : "",
            Equipo: miRep ? (miRep.Equipo_Paste || "") : ""
        });
    };

    if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--text-muted)", fontSize: "0.88rem" }}>Cargando bracket...</div>;
    if (error) return <div style={{ padding: "2rem", color: "var(--danger)", fontSize: "0.88rem" }}>Error: {error}</div>;
    if (!bracket) return null;

    const { rondas, equipos } = bracket;
    const rondasGanadores = rondas.filter(r => r.Rama === 'ganadores');
    const rondasPerdedores = rondas.filter(r => r.Rama === 'perdedores');
    const rondasFinal = rondas.filter(r => r.Rama === 'gran_final');

    const estadoCfg = { pendiente: { color: "var(--text-muted)", label: "Pendiente" }, en_curso: { color: "#ffa502", label: "En curso" }, finalizado: { color: "var(--success)", label: "Finalizado" } };
    const cfg = estadoCfg[torneo?.Estado] || estadoCfg.pendiente;
    const campeon = equipos?.find(e => e.Estado === 'finalista');

    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem", overflowX: "hidden" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        {onBack && <button onClick={onBack} style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "7px", padding: "5px 10px", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700 }}>← Volver</button>}
                        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.5px" }}>{torneo?.Nombre}</h1>
                        <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "3px 10px", borderRadius: "20px", background: `${cfg.color}18`, border: `1px solid ${cfg.color}`, color: cfg.color, letterSpacing: "1px" }}>{cfg.label.toUpperCase()}</span>
                    </div>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                        {torneo?.Modo?.toUpperCase()} · {torneo?.Participantes} participantes · Doble eliminación {torneo?.Juego_Nombre && ` · ${torneo.Juego_Nombre}`} {torneo?.Rondas_Partida && ` · BO${torneo.Rondas_Partida}`} {torneo?.Final_Rondas_Distintas ? ` · Final BO${torneo.Final_Rondas}` : ""}
                    </p>
                </div>
                <button onClick={cargarBracket} style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 800, transition: "background 0.2s" }} onMouseEnter={e => e.target.style.background = "var(--border-color)"} onMouseLeave={e => e.target.style.background = "var(--bg-soft)"}>
                    ↻ Actualizar
                </button>
            </div>

            {campeon && (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))", border: "1px solid var(--success)", borderRadius: "12px", padding: "16px 24px", marginBottom: "2.5rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 15px rgba(16,185,129,0.4)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--success)", letterSpacing: "2px", marginBottom: "2px" }}>CAMPEÓN DEL TORNEO</div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--text-main)" }}>{campeon.Nombre}</div>
                        {campeon.Jugadores && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{campeon.Jugadores}</div>}
                    </div>
                </div>
            )}

            <BracketSection titulo={torneo?.Tipo_Bracket === 'single' ? "CUADRO PRINCIPAL" : "BRACKET DE GANADORES"} color="var(--success)" rondas={rondasGanadores} onForceResult={handleForceResult} onReportar={abrirReporte} isAdmin={isAdmin} equipos={equipos} torneo={torneo} usuarioData={usuarioData} />
            <BracketSection titulo="BRACKET DE PERDEDORES" color="#ff4757" rondas={rondasPerdedores} onForceResult={handleForceResult} onReportar={abrirReporte} isAdmin={isAdmin} equipos={equipos} torneo={torneo} usuarioData={usuarioData} />
            <BracketSection titulo="FINAL" color="#ffa502" rondas={rondasFinal} onForceResult={handleForceResult} onReportar={abrirReporte} isAdmin={isAdmin} equipos={equipos} torneo={torneo} usuarioData={usuarioData} />

            {partidaConflicto && (() => {
                const nombreGanadorPrevio = Number(partidaConflicto.repRival.ID_Ganador_Declarado) === Number(partidaConflicto.ID_Equipo1)
                    ? partidaConflicto.Equipo1_Nombre : partidaConflicto.Equipo2_Nombre;
                return (
                    <>
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 9998 }} onClick={() => setPartidaConflicto(null)} />
                        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                            <div style={{ width: "100%", maxWidth: "450px", background: "rgba(13,17,23,0.97)", border: "2px solid #ffa502", borderRadius: "14px", padding: "2rem", boxShadow: "0 20px 60px rgba(255,165,2,0.15)", animation: "fadeIn 0.2s ease-out" }}>
                                <h2 style={{ color: "#ffa502", margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 900 }}>⚠️ ATENCIÓN: REPORTE PREVIO</h2>
                                <p style={{ color: "var(--text-main)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "20px" }}>El equipo rival ya ha reportado indicando que el ganador de la <strong>RONDA {partidaConflicto.rondaConflicto}</strong> ha sido <strong style={{ color: "var(--success)" }}>{nombreGanadorPrevio}</strong>.</p>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#ffa502", color: "#0d1117", fontWeight: 900, fontSize: "0.85rem", cursor: "pointer" }} onClick={() => procederAReportar(partidaConflicto, partidaConflicto.rondaConflicto)}>CONTINUAR A REPORTE</button>
                                    <button style={{ padding: "0 20px", borderRadius: "8px", border: "1px solid #30363d", background: "transparent", color: "#c9d1d9", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => setPartidaConflicto(null)}>CANCELAR</button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}

            {partidaReporte && (
                <>
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 9998 }} onClick={() => setPartidaReporte(null)} />
                    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                        <div style={{ width: "100%", maxWidth: "580px", background: "rgba(13,17,23,0.97)", border: "2px solid #00d2d3", borderRadius: "14px", padding: "2rem", boxShadow: "0 20px 60px rgba(0,210,211,0.15)", animation: "fadeIn 0.2s ease-out" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid rgba(0,210,211,0.3)", paddingBottom: "1rem" }}>
                                <div>
                                    <h2 style={{ color: "#00d2d3", margin: "0 0 4px", fontStyle: "italic", letterSpacing: "2px", fontSize: "1.3rem" }}>REPORTE DE COMBATE (R{formReporte.Ronda})</h2>
                                    <p style={{ color: "#8b949e", margin: 0, fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>{partidaReporte.Equipo1_Nombre} VS {partidaReporte.Equipo2_Nombre}</p>
                                </div>
                                <button onClick={() => setPartidaReporte(null)} style={{ background: "transparent", border: "none", color: "#8b949e", cursor: "pointer", fontSize: "1.4rem", padding: 0, fontWeight: 300 }}>✕</button>
                            </div>
                            <div style={{ marginBottom: "1.2rem" }}>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#8b949e", letterSpacing: "2px", marginBottom: "8px", fontWeight: 800 }}>EQUIPO VENCEDOR</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {[{ value: String(partidaReporte.ID_Equipo1), label: partidaReporte.Equipo1_Nombre, color: "#10b981" }, { value: String(partidaReporte.ID_Equipo2), label: partidaReporte.Equipo2_Nombre, color: "#10b981" }].map(opt => (
                                        <button key={opt.value} onClick={() => setFormReporte({ ...formReporte, ID_Ganador_Extraido: opt.value })} style={{ flex: 1, padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.5px", border: `2px solid ${formReporte.ID_Ganador_Extraido === opt.value ? opt.color : "#30363d"}`, background: formReporte.ID_Ganador_Extraido === opt.value ? `${opt.color}20` : "#0d1117", color: formReporte.ID_Ganador_Extraido === opt.value ? opt.color : "#8b949e", transition: "all 0.2s" }}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.2rem", cursor: "pointer", padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid #30363d" }}>
                                <div onClick={() => setFormReporte({ ...formReporte, Sube_Replay: !formReporte.Sube_Replay })} style={{ width: "40px", height: "22px", borderRadius: "11px", position: "relative", cursor: "pointer", background: formReporte.Sube_Replay ? "#00d2d3" : "#30363d", transition: "background 0.2s", flexShrink: 0 }}>
                                    <div style={{ position: "absolute", top: "3px", left: formReporte.Sube_Replay ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                                </div>
                                <div><span style={{ color: "#c9d1d9", fontWeight: 800, fontSize: "0.85rem" }}>Aportar Log de Inteligencia</span><span style={{ display: "block", color: "#8b949e", fontSize: "0.72rem", marginTop: "2px" }}>Obligatorio para torneos oficiales</span></div>
                            </label>
                            {formReporte.Sube_Replay && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "1.5rem" }}>
                                    <textarea rows={4} placeholder="Pega el Replay Log de Showdown aquí..." value={formReporte.Replay_Log} onChange={e => setFormReporte({ ...formReporte, Replay_Log: e.target.value })} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", color: "#00d2d3", fontFamily: "monospace", fontSize: "0.8rem", resize: "vertical", outline: "none" }} />
                                    <textarea rows={4} placeholder="Pega tu Equipo (Showdown Paste format)..." value={formReporte.Equipo} onChange={e => setFormReporte({ ...formReporte, Equipo: e.target.value })} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", color: "#00d2d3", fontFamily: "monospace", fontSize: "0.8rem", resize: "vertical", outline: "none" }} />
                                </div>
                            )}
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#00d2d3", color: "#0d1117", fontWeight: 900, fontSize: "0.88rem", letterSpacing: "1px", cursor: "pointer" }} onClick={enviarReporteTorneo}>SUBIR RESULTADO R{formReporte.Ronda}</button>
                                <button style={{ padding: "0 24px", borderRadius: "8px", border: "1px solid #30363d", background: "transparent", color: "#c9d1d9", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => setPartidaReporte(null)}>CANCELAR</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}