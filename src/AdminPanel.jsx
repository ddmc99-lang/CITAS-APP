import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://cajrkpxhzekriznupxvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhanJrcHhoemVrcml6bnVweHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjMzNjcsImV4cCI6MjA5MjAzOTM2N30.llz_rUPUDaqzqlqt8HiWtcH30LXs38El94nqoLd8im8";
const ADMIN_PASSWORD = "studio2024"; // Cámbiala por la tuya

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

async function fetchCitas(filtro = "todas", busqueda = "") {
  let url = `${SUPABASE_URL}/rest/v1/citas?select=*&order=fecha.asc,hora.asc`;
  if (filtro !== "todas") url += `&estado=eq.${filtro}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error("Error al cargar citas");
  let data = await res.json();
  if (busqueda) {
    const q = busqueda.toLowerCase();
    data = data.filter(c =>
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.includes(q) ||
      c.servicio?.toLowerCase().includes(q)
    );
  }
  return data;
}

async function actualizarEstado(id, estado) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/citas?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error("Error al actualizar");
  return true;
}

async function eliminarCita(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/citas?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
  });
  if (!res.ok) throw new Error("Error al eliminar");
  return true;
}

const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "#F5A623", bg: "rgba(245,166,35,0.12)",  border: "rgba(245,166,35,0.35)" },
  confirmada: { label: "Confirmada", color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.35)" },
  completada: { label: "Completada", color: "#60A5FA", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)" },
  cancelada:  { label: "Cancelada",  color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)" },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      whiteSpace: "nowrap",
    }}>{cfg.label}</span>
  );
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={s.loginRoot}>
      <div style={{ ...s.loginCard, animation: shake ? "shake 0.4s ease" : "fadeUp 0.5s ease" }}>
        <div style={s.loginMark}>◈</div>
        <h1 style={s.loginTitle}>Panel Admin</h1>
        <p style={s.loginSub}>Acceso restringido · Solo para el profesional</p>
        <input
          style={{ ...s.loginInput, ...(error ? s.loginInputError : {}) }}
          type="password"
          placeholder="Contraseña"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          autoFocus
        />
        {error && <p style={s.loginError}>Contraseña incorrecta. Inténtalo de nuevo.</p>}
        <button style={s.loginBtn} onClick={handleLogin}>Entrar →</button>
      </div>
    </div>
  );
}

// ─── Modal detalle ────────────────────────────────────────────
function CitaModal({ cita, onClose, onUpdate }) {
  const [estado, setEstado] = useState(cita.estado);
  const [saving, setSaving] = useState(false);

  async function handleEstado(nuevoEstado) {
    setSaving(true);
    await actualizarEstado(cita.id, nuevoEstado);
    setEstado(nuevoEstado);
    onUpdate(cita.id, nuevoEstado);
    setSaving(false);
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalCard} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div>
            <h2 style={s.modalTitle}>{cita.servicio}</h2>
            <p style={s.modalSub}>{formatFecha(cita.fecha)} · {cita.hora}</p>
          </div>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div style={s.modalBody}>
          <div style={s.detailGrid}>
            <Detail label="Cliente" val={cita.nombre} />
            <Detail label="Teléfono" val={cita.telefono} />
            <Detail label="Email" val={cita.email || "—"} />
            <Detail label="Duración" val={`${cita.duracion} min`} />
            <Detail label="Precio" val={`$${cita.precio}`} highlight />
            <Detail label="Estado actual" val={<EstadoBadge estado={estado} />} />
          </div>

          {cita.notas && (
            <div style={s.notasBox}>
              <span style={s.notasLabel}>Notas</span>
              <p style={s.notasText}>{cita.notas}</p>
            </div>
          )}

          <div style={s.estadoActions}>
            <p style={s.estadoTitle}>Cambiar estado:</p>
            <div style={s.estadoBtns}>
              {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  disabled={saving || estado === key}
                  style={{
                    ...s.estadoBtn,
                    background: estado === key ? cfg.bg : "rgba(255,255,255,0.04)",
                    border: `1px solid ${estado === key ? cfg.border : "rgba(255,255,255,0.08)"}`,
                    color: estado === key ? cfg.color : "#7A7570",
                    opacity: saving ? 0.5 : 1,
                  }}
                  onClick={() => handleEstado(key)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, val, highlight }) {
  return (
    <div style={s.detailItem}>
      <span style={s.detailLabel}>{label}</span>
      <span style={{ ...s.detailVal, color: highlight ? "#F5A623" : "#F0EDE8" }}>{val}</span>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [selectedCita, setSelectedCita] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState("lista"); // lista | stats

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCitas(filtro, busqueda);
      setCitas(data);
    } catch (e) {
      setError("No se pudo conectar con Supabase.");
    } finally {
      setLoading(false);
    }
  }, [filtro, busqueda]);

  useEffect(() => { if (authed) cargar(); }, [authed, cargar]);

  function handleUpdate(id, nuevoEstado) {
    setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
  }

  async function handleDelete(id) {
    setDeleting(id);
    await eliminarCita(id);
    setCitas(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  // Stats
  const stats = {
    total: citas.length,
    pendientes: citas.filter(c => c.estado === "pendiente").length,
    confirmadas: citas.filter(c => c.estado === "confirmada").length,
    ingresos: citas.filter(c => c.estado !== "cancelada").reduce((a, c) => a + (c.precio || 0), 0),
  };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarMark}>◈</div>
          <p style={s.sidebarBrand}>STUDIO</p>
          <p style={s.sidebarRole}>Panel Admin</p>
        </div>

        <nav style={s.nav}>
          {[
            { id: "lista", icon: "▤", label: "Citas" },
            { id: "stats", icon: "◎", label: "Resumen" },
          ].map(item => (
            <button key={item.id}
              style={{ ...s.navItem, ...(vista === item.id ? s.navItemActive : {}) }}
              onClick={() => setVista(item.id)}>
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button style={s.logoutBtn} onClick={() => setAuthed(false)}>
          ← Salir
        </button>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* Stats cards */}
        <div style={s.statsRow}>
          {[
            { label: "Total citas", val: stats.total, icon: "📅" },
            { label: "Pendientes", val: stats.pendientes, icon: "⏳" },
            { label: "Confirmadas", val: stats.confirmadas, icon: "✓" },
            { label: "Ingresos est.", val: `$${stats.ingresos}`, icon: "💰" },
          ].map((st, i) => (
            <div key={i} style={s.statCard}>
              <span style={s.statIcon}>{st.icon}</span>
              <div>
                <p style={s.statVal}>{st.val}</p>
                <p style={s.statLabel}>{st.label}</p>
              </div>
            </div>
          ))}
        </div>

        {vista === "lista" && (
          <>
            {/* Toolbar */}
            <div style={s.toolbar}>
              <input
                style={s.searchInput}
                placeholder="Buscar por nombre, teléfono o servicio..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              <div style={s.filtros}>
                {["todas", "pendiente", "confirmada", "completada", "cancelada"].map(f => (
                  <button key={f}
                    style={{ ...s.filtroBtn, ...(filtro === f ? s.filtroBtnActive : {}) }}
                    onClick={() => setFiltro(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <button style={s.refreshBtn} onClick={cargar} title="Actualizar">↺</button>
            </div>

            {/* Tabla */}
            {error && <div style={s.errorMsg}>⚠️ {error}</div>}

            {loading
              ? <div style={s.loading}>Cargando citas desde Supabase...</div>
              : citas.length === 0
                ? <div style={s.empty}>
                    <p style={s.emptyIcon}>📭</p>
                    <p style={s.emptyText}>No hay citas que coincidan</p>
                  </div>
                : (
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          {["Fecha", "Hora", "Cliente", "Servicio", "Precio", "Estado", "Acciones"].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {citas.map((c, i) => (
                          <tr key={c.id} style={{ ...s.tr, animationDelay: `${i * 0.04}s` }}>
                            <td style={s.td}>{formatFecha(c.fecha)}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: "#F5A623" }}>{c.hora}</td>
                            <td style={s.td}>
                              <div style={s.clienteName}>{c.nombre}</div>
                              <div style={s.clientePhone}>{c.telefono}</div>
                            </td>
                            <td style={s.td}>{c.servicio}</td>
                            <td style={{ ...s.td, fontWeight: 600 }}>${c.precio}</td>
                            <td style={s.td}><EstadoBadge estado={c.estado} /></td>
                            <td style={s.td}>
                              <div style={s.acciones}>
                                <button style={s.accionBtn} onClick={() => setSelectedCita(c)} title="Ver detalle">
                                  ✎
                                </button>
                                <button
                                  style={{ ...s.accionBtn, ...s.accionBtnDanger }}
                                  onClick={() => handleDelete(c.id)}
                                  disabled={deleting === c.id}
                                  title="Eliminar">
                                  {deleting === c.id ? "..." : "✕"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            }
          </>
        )}

        {vista === "stats" && (
          <div style={s.statsPage}>
            <h2 style={s.statsPageTitle}>Resumen general</h2>
            <div style={s.statsCards}>
              {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => {
                const count = citas.filter(c => c.estado === key).length;
                const ingresos = citas.filter(c => c.estado === key).reduce((a, c) => a + (c.precio || 0), 0);
                return (
                  <div key={key} style={{ ...s.statsFullCard, borderColor: cfg.border, background: cfg.bg }}>
                    <EstadoBadge estado={key} />
                    <p style={{ ...s.sfcNum, color: cfg.color }}>{count}</p>
                    <p style={s.sfcLabel}>citas</p>
                    <p style={{ ...s.sfcIngresos, color: cfg.color }}>${ingresos}</p>
                    <p style={s.sfcLabel}>ingresos estimados</p>
                  </div>
                );
              })}
            </div>

            <div style={s.serviciosWrap}>
              <h3 style={s.serviciosTitle}>Servicios más solicitados</h3>
              {Object.entries(
                citas.reduce((acc, c) => {
                  acc[c.servicio] = (acc[c.servicio] || 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).map(([nombre, count]) => (
                <div key={nombre} style={s.servicioRow}>
                  <span style={s.servicioNombre}>{nombre}</span>
                  <div style={s.servicioBarWrap}>
                    <div style={{ ...s.servicioBar, width: `${(count / citas.length) * 100}%` }} />
                  </div>
                  <span style={s.servicioCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedCita && (
        <CitaModal
          cita={selectedCita}
          onClose={() => setSelectedCita(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

const s = {
  // Login
  loginRoot: { minHeight:"100vh", background:"#0C0C0F", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Georgia','Times New Roman',serif" },
  loginCard: { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"48px 40px", width:340, display:"flex", flexDirection:"column", alignItems:"center", gap:16 },
  loginMark: { fontSize:36, color:"#F5A623" },
  loginTitle: { margin:0, fontSize:28, fontWeight:400, color:"#F0EDE8", letterSpacing:-0.5 },
  loginSub: { margin:0, fontSize:12, color:"#7A7570", letterSpacing:0.5, textAlign:"center" },
  loginInput: { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"13px 16px", color:"#F0EDE8", fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginTop:8 },
  loginInputError: { border:"1px solid rgba(248,113,113,0.5)", background:"rgba(248,113,113,0.05)" },
  loginError: { margin:0, fontSize:12, color:"#F87171", textAlign:"center" },
  loginBtn: { width:"100%", background:"linear-gradient(135deg,#F5A623,#FF6B35)", border:"none", borderRadius:10, padding:"13px", color:"#0C0C0F", fontWeight:700, fontSize:15, cursor:"pointer", letterSpacing:0.5, marginTop:4 },

  // Layout
  root: { display:"flex", minHeight:"100vh", background:"#080809", color:"#F0EDE8", fontFamily:"'Georgia','Times New Roman',serif" },
  sidebar: { width:200, background:"rgba(255,255,255,0.02)", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", padding:"32px 0", flexShrink:0 },
  sidebarTop: { padding:"0 24px 32px", borderBottom:"1px solid rgba(255,255,255,0.06)" },
  sidebarMark: { fontSize:28, color:"#F5A623", marginBottom:8 },
  sidebarBrand: { margin:0, fontSize:16, fontWeight:700, letterSpacing:4, color:"#F0EDE8" },
  sidebarRole: { margin:"4px 0 0", fontSize:11, color:"#7A7570", letterSpacing:1 },
  nav: { display:"flex", flexDirection:"column", gap:4, padding:"24px 12px", flex:1 },
  navItem: { display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:"none", background:"transparent", color:"#7A7570", fontSize:13, cursor:"pointer", textAlign:"left", transition:"all 0.2s" },
  navItemActive: { background:"rgba(245,166,35,0.1)", color:"#F5A623", border:"1px solid rgba(245,166,35,0.2)" },
  navIcon: { fontSize:16, width:20, textAlign:"center" },
  logoutBtn: { margin:"0 12px", padding:"10px 12px", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, background:"transparent", color:"#3A3532", fontSize:12, cursor:"pointer" },

  main: { flex:1, padding:"32px", overflow:"auto" },

  // Stats row
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 },
  statCard: { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"20px", display:"flex", alignItems:"center", gap:16 },
  statIcon: { fontSize:28 },
  statVal: { margin:0, fontSize:24, fontWeight:700, color:"#F5A623" },
  statLabel: { margin:0, fontSize:11, color:"#7A7570", letterSpacing:0.5, marginTop:2 },

  // Toolbar
  toolbar: { display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" },
  searchInput: { flex:1, minWidth:200, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"10px 14px", color:"#F0EDE8", fontSize:13, fontFamily:"inherit", outline:"none" },
  filtros: { display:"flex", gap:6, flexWrap:"wrap" },
  filtroBtn: { padding:"8px 14px", borderRadius:20, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#7A7570", fontSize:11, cursor:"pointer", letterSpacing:0.5 },
  filtroBtnActive: { background:"rgba(245,166,35,0.12)", border:"1px solid rgba(245,166,35,0.4)", color:"#F5A623" },
  refreshBtn: { width:38, height:38, borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"#F0EDE8", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },

  // Table
  tableWrap: { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { padding:"14px 16px", textAlign:"left", fontSize:10, color:"#7A7570", letterSpacing:1, borderBottom:"1px solid rgba(255,255,255,0.06)", fontWeight:400 },
  tr: { borderBottom:"1px solid rgba(255,255,255,0.04)", animation:"fadeSlideIn 0.3s ease both", transition:"background 0.15s" },
  td: { padding:"14px 16px", fontSize:13, color:"#F0EDE8", verticalAlign:"middle" },
  clienteName: { fontWeight:600, marginBottom:2 },
  clientePhone: { fontSize:11, color:"#7A7570" },
  acciones: { display:"flex", gap:8 },
  accionBtn: { width:30, height:30, borderRadius:6, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"#A09890", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  accionBtnDanger: { border:"1px solid rgba(248,113,113,0.2)", color:"#F87171" },

  loading: { textAlign:"center", padding:"60px", color:"#7A7570", fontSize:14, fontStyle:"italic" },
  empty: { textAlign:"center", padding:"60px" },
  emptyIcon: { fontSize:48, margin:"0 0 12px" },
  emptyText: { color:"#7A7570", fontSize:14 },
  errorMsg: { background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.2)", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#F87171", marginBottom:16 },

  // Modal
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, backdropFilter:"blur(4px)" },
  modalCard: { background:"#111113", border:"1px solid rgba(255,255,255,0.1)", borderRadius:18, width:"90%", maxWidth:480, maxHeight:"90vh", overflow:"auto" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"28px 28px 0" },
  modalTitle: { margin:0, fontSize:22, fontWeight:400 },
  modalSub: { margin:"4px 0 0", fontSize:13, color:"#F5A623" },
  modalClose: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, width:32, height:32, color:"#F0EDE8", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  modalBody: { padding:"24px 28px 28px", display:"flex", flexDirection:"column", gap:20 },
  detailGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  detailItem: { display:"flex", flexDirection:"column", gap:4 },
  detailLabel: { fontSize:10, color:"#7A7570", letterSpacing:0.5 },
  detailVal: { fontSize:14, fontWeight:600, color:"#F0EDE8" },
  notasBox: { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 16px" },
  notasLabel: { fontSize:10, color:"#7A7570", letterSpacing:0.5, display:"block", marginBottom:6 },
  notasText: { margin:0, fontSize:13, color:"#A09890", lineHeight:1.6 },
  estadoActions: {},
  estadoTitle: { margin:"0 0 10px", fontSize:11, color:"#7A7570", letterSpacing:0.5 },
  estadoBtns: { display:"flex", gap:8, flexWrap:"wrap" },
  estadoBtn: { padding:"8px 16px", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all 0.2s" },

  // Stats page
  statsPage: { display:"flex", flexDirection:"column", gap:28 },
  statsPageTitle: { margin:0, fontSize:24, fontWeight:400 },
  statsCards: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 },
  statsFullCard: { borderRadius:14, border:"1px solid", padding:"24px 20px", display:"flex", flexDirection:"column", gap:4 },
  sfcNum: { margin:"12px 0 0", fontSize:40, fontWeight:700, lineHeight:1 },
  sfcLabel: { margin:0, fontSize:11, color:"#7A7570", letterSpacing:0.5 },
  sfcIngresos: { margin:"12px 0 0", fontSize:22, fontWeight:700 },
  serviciosWrap: { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"24px" },
  serviciosTitle: { margin:"0 0 20px", fontSize:16, fontWeight:400, color:"#A09890" },
  servicioRow: { display:"flex", alignItems:"center", gap:16, marginBottom:14 },
  servicioNombre: { width:160, fontSize:13, flexShrink:0 },
  servicioBarWrap: { flex:1, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" },
  servicioBar: { height:"100%", background:"linear-gradient(90deg,#F5A623,#FF6B35)", borderRadius:3, transition:"width 0.5s ease" },
  servicioCount: { width:24, textAlign:"right", fontSize:13, color:"#F5A623", fontWeight:700 },
};

const st = document.createElement("style");
st.textContent = `
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  tbody tr:hover { background: rgba(255,255,255,0.03) !important; }
  input::placeholder { color: #3A3532; }
  input:focus { border-color: rgba(245,166,35,0.4) !important; }
`;
document.head.appendChild(st);
