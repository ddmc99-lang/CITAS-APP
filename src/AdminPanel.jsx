import { useState, useEffect, useCallback } from "react";
import { NEGOCIO } from "./config";

const { url: SB_URL, anonKey: SB_KEY } = NEGOCIO.supabase;
const H = { "apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`,"Content-Type":"application/json" };
const C = NEGOCIO.colores;

async function fetchCitas(fE,fP,busq) {
  let url=`${SB_URL}/rest/v1/citas?select=*&order=fecha.asc,hora.asc`;
  if(fE!=="todas") url+=`&estado=eq.${fE}`;
  if(fP!=="todos") url+=`&profesional=eq.${encodeURIComponent(fP)}`;
  const r=await fetch(url,{headers:H});
  if(!r.ok) throw new Error();
  let data=await r.json();
  if(busq){const q=busq.toLowerCase();data=data.filter(c=>c.nombre?.toLowerCase().includes(q)||c.telefono?.includes(q)||c.servicio?.toLowerCase().includes(q));}
  return data;
}
async function updateEstado(id,estado){await fetch(`${SB_URL}/rest/v1/citas?id=eq.${id}`,{method:"PATCH",headers:{...H,"Prefer":"return=minimal"},body:JSON.stringify({estado})});}
async function deleteCita(id){await fetch(`${SB_URL}/rest/v1/citas?id=eq.${id}`,{method:"DELETE",headers:{...H,"Prefer":"return=minimal"}});}

const ESTADOS={
  pendiente: {label:"Pendiente", color:"#F5A623",bg:"rgba(245,166,35,0.12)",border:"rgba(245,166,35,0.35)"},
  confirmada:{label:"Confirmada",color:"#4ADE80",bg:"rgba(74,222,128,0.12)",border:"rgba(74,222,128,0.35)"},
  completada:{label:"Completada",color:"#60A5FA",bg:"rgba(96,165,250,0.12)",border:"rgba(96,165,250,0.35)"},
  cancelada: {label:"Cancelada", color:"#F87171",bg:"rgba(248,113,113,0.12)",border:"rgba(248,113,113,0.35)"},
};

function injectAdminCSS() {
  if(document.getElementById("adm-css")) return;
  const st=document.createElement("style"); st.id="adm-css";
  st.textContent=`
    *{box-sizing:border-box}
    body{margin:0;background:#080809}
    @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
    @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    input::placeholder{color:#3A3532}
    input:focus{outline:none;border-color:${C.acento}88!important}
    .tr-row:hover{background:rgba(255,255,255,0.025)!important}
    .icon-btn:hover{opacity:0.8}
    /* Mobile overrides */
    @media(max-width:640px){
      .admin-main{padding:16px!important}
      .stats-grid{grid-template-columns:1fr 1fr!important}
      .stats-card-val{font-size:18px!important}
      .desktop-table{display:none!important}
      .mobile-cards{display:flex!important}
      .toolbar-row{flex-direction:column!important;align-items:stretch!important}
      .filtros-wrap{overflow-x:auto;padding-bottom:4px}
      .sidebar-desktop{display:none!important}
      .topbar-mobile{display:flex!important}
      .stats-full-grid{grid-template-columns:1fr 1fr!important}
    }
    @media(min-width:641px){
      .mobile-cards{display:none!important}
      .topbar-mobile{display:none!important}
      .sidebar-desktop{display:flex!important}
    }
    .mobile-cards{flex-direction:column;gap:10px}
  `;
  document.head.appendChild(st);
}

function Badge({estado}){
  const e=ESTADOS[estado]||ESTADOS.pendiente;
  return <span style={{background:e.bg,color:e.color,border:`1px solid ${e.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{e.label}</span>;
}
function fmt(f){if(!f)return"—";return new Date(f+"T12:00:00").toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});}

// ─── Login ────────────────────────────────────────────────
function Login({onLogin}){
  const [pw,setPw]=useState(""),isErr=useState(false),isShake=useState(false);
  const [err,setErr]=[isErr[0],isErr[1]],[shake,setShake]=[isShake[0],isShake[1]];
  function go(){if(pw===NEGOCIO.adminPassword)onLogin();else{setErr(true);setShake(true);setTimeout(()=>setShake(false),500);}}
  return(
    <div style={{minHeight:"100vh",background:C.fondo,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:16}}>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"40px 28px",width:"100%",maxWidth:340,display:"flex",flexDirection:"column",alignItems:"center",gap:16,animation:shake?"shake 0.4s ease":"fadeUp 0.5s ease"}}>
        <span style={{fontSize:36,color:C.acento}}>{NEGOCIO.icono}</span>
        <h1 style={{margin:0,fontSize:24,fontWeight:400,color:C.texto}}>Panel Admin</h1>
        <p style={{margin:0,fontSize:12,color:C.textoSuave,textAlign:"center"}}>{NEGOCIO.nombre}</p>
        <input style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${err?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"14px 16px",color:C.texto,fontSize:16,fontFamily:"inherit",marginTop:8}}
          type="password" placeholder="Contraseña" value={pw}
          onChange={e=>{setPw(e.target.value);setErr(false);}}
          onKeyDown={e=>e.key==="Enter"&&go()} autoFocus/>
        {err&&<p style={{margin:0,fontSize:12,color:"#F87171"}}>Contraseña incorrecta</p>}
        <button style={{width:"100%",background:`linear-gradient(135deg,${C.acento},${C.acentoB})`,border:"none",borderRadius:10,padding:14,color:"#0C0C0F",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"inherit"}} onClick={go}>Entrar →</button>
      </div>
    </div>
  );
}

// ─── Modal detalle ────────────────────────────────────────
function Modal({cita,onClose,onUpdate}){
  const [estado,setEstado]=useState(cita.estado),[saving,setSaving]=useState(false);
  const prof=NEGOCIO.profesionales.find(p=>p.nombre===cita.profesional);
  async function cambiar(e){setSaving(true);await updateEstado(cita.id,e);setEstado(e);onUpdate(cita.id,e);setSaving(false);}
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:"#111113",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"18px 18px 0 0",width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",fontFamily:"Georgia,serif"}} onClick={e=>e.stopPropagation()}>
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}>
          <div style={{width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"16px 20px 0"}}>
          <div>
            <h2 style={{margin:0,fontSize:20,fontWeight:400,color:C.texto}}>{cita.servicio}</h2>
            <p style={{margin:"4px 0 0",fontSize:13,color:C.acento}}>{prof?.emoji} {cita.profesional} · {fmt(cita.fecha)} · {cita.hora}</p>
          </div>
          <button style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,width:32,height:32,color:C.texto,cursor:"pointer",fontSize:14,flexShrink:0,fontFamily:"inherit"}} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"16px 20px 28px",display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Cliente",cita.nombre],["Teléfono",cita.telefono],["Email",cita.email||"—"],["Duración",`${cita.duracion} min`],["Precio",`$${cita.precio}`],["Estado",<Badge estado={estado}/>]].map(([l,v],i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",gap:3}}>
                <span style={{fontSize:10,color:C.textoSuave,letterSpacing:0.5}}>{l}</span>
                <span style={{fontSize:14,fontWeight:600,color:i===4?C.acento:C.texto}}>{v}</span>
              </div>
            ))}
          </div>
          {cita.notas&&<div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 14px"}}>
            <span style={{fontSize:10,color:C.textoSuave,display:"block",marginBottom:5}}>Notas</span>
            <p style={{margin:0,fontSize:13,color:"#A09890",lineHeight:1.5}}>{cita.notas}</p>
          </div>}
          <div>
            <p style={{margin:"0 0 10px",fontSize:11,color:C.textoSuave,letterSpacing:0.5}}>Cambiar estado:</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(ESTADOS).map(([k,e])=>(
                <button key={k} disabled={saving||estado===k}
                  style={{padding:"9px 16px",borderRadius:8,fontSize:12,cursor:estado===k?"default":"pointer",fontFamily:"inherit",fontWeight:600,background:estado===k?e.bg:"rgba(255,255,255,0.04)",border:`1px solid ${estado===k?e.border:"rgba(255,255,255,0.08)"}`,color:estado===k?e.color:C.textoSuave,opacity:saving?0.5:1,transition:"all 0.2s",touchAction:"manipulation"}}
                  onClick={()=>cambiar(k)}>{e.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cita Card (mobile) ───────────────────────────────────
function CitaCard({cita,onEdit,onDelete,deleting}){
  const prof=NEGOCIO.profesionales.find(p=>p.nombre===cita.profesional);
  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:18}}>{prof?.emoji||"👤"}</span>
            <span style={{fontWeight:700,color:C.texto,fontSize:15}}>{cita.profesional}</span>
          </div>
          <p style={{margin:0,fontSize:13,color:C.acento,fontWeight:600}}>{cita.servicio}</p>
        </div>
        <Badge estado={cita.estado}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
        <div><span style={{color:C.textoSuave}}>Fecha: </span><span style={{color:C.texto,fontWeight:600}}>{fmt(cita.fecha)}</span></div>
        <div><span style={{color:C.textoSuave}}>Hora: </span><span style={{color:C.acento,fontWeight:700}}>{cita.hora}</span></div>
        <div><span style={{color:C.textoSuave}}>Cliente: </span><span style={{color:C.texto,fontWeight:600}}>{cita.nombre}</span></div>
        <div><span style={{color:C.textoSuave}}>Total: </span><span style={{color:C.acento,fontWeight:700}}>${cita.precio}</span></div>
      </div>
      <div style={{fontSize:12,color:C.textoSuave}}>{cita.telefono}</div>
      <div style={{display:"flex",gap:8,paddingTop:4}}>
        <button style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#A09890",cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>onEdit(cita)}>✎ Editar</button>
        <button style={{padding:"10px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,0.2)",background:"rgba(248,113,113,0.05)",color:"#F87171",cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>onDelete(cita.id)} disabled={deleting===cita.id}>{deleting===cita.id?"…":"✕"}</button>
      </div>
    </div>
  );
}

// ─── Sidebar content ──────────────────────────────────────
function SidebarContent({filtroP,setFiltroP,vista,setVista,onLogout}){
  return(
    <>
      <div style={{padding:"24px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:26,color:C.acento,marginBottom:6}}>{NEGOCIO.icono}</div>
        <p style={{margin:0,fontSize:13,fontWeight:700,letterSpacing:3,color:C.texto}}>{NEGOCIO.nombre.slice(0,12).toUpperCase()}</p>
        <p style={{margin:"3px 0 0",fontSize:10,color:C.textoSuave}}>Panel Admin</p>
      </div>
      <div style={{padding:"16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <p style={{margin:"0 0 8px",fontSize:9,color:C.textoSuave,letterSpacing:1}}>PROFESIONAL</p>
        {[{nombre:"todos",emoji:"👥",especialidad:"Todos"},...NEGOCIO.profesionales].map(p=>(
          <button key={p.nombre||p.id}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:filtroP===(p.nombre||"todos")?`${C.acento}18`:"transparent",color:filtroP===(p.nombre||"todos")?C.acento:C.textoSuave,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"inherit",marginBottom:2,touchAction:"manipulation"}}
            onClick={()=>setFiltroP(p.nombre||"todos")}>
            <span style={{fontSize:16}}>{p.emoji}</span>{p.nombre||"Todos"}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,padding:"12px",flex:1}}>
        {[{id:"lista",icon:"▤",label:"Citas"},{id:"stats",icon:"◎",label:"Resumen"}].map(item=>(
          <button key={item.id}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:vista===item.id?`1px solid ${C.acento}33`:"1px solid transparent",background:vista===item.id?`${C.acento}18`:"transparent",color:vista===item.id?C.acento:C.textoSuave,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"inherit",touchAction:"manipulation"}}
            onClick={()=>setVista(item.id)}>
            <span style={{fontSize:16,width:20,textAlign:"center"}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <button style={{margin:"0 12px 16px",padding:"10px 12px",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,background:"transparent",color:"#3A3532",fontSize:12,cursor:"pointer",fontFamily:"inherit"}} onClick={onLogout}>← Salir</button>
    </>
  );
}

// ─── Panel principal ──────────────────────────────────────
export default function AdminPanel(){
  injectAdminCSS();
  const [authed,setAuthed]   = useState(false);
  const [citas,setCitas]     = useState([]);
  const [loading,setLoading] = useState(false);
  const [filtroE,setFiltroE] = useState("todas");
  const [filtroP,setFiltroP] = useState("todos");
  const [busq,setBusq]       = useState("");
  const [sel,setSel]         = useState(null);
  const [deleting,setDel]    = useState(null);
  const [error,setError]     = useState(null);
  const [vista,setVista]     = useState("lista");
  const [drawer,setDrawer]   = useState(false);

  const cargar=useCallback(async()=>{
    setLoading(true);setError(null);
    try{setCitas(await fetchCitas(filtroE,filtroP,busq));}
    catch{setError("No se pudo conectar.");}
    finally{setLoading(false);}
  },[filtroE,filtroP,busq]);

  useEffect(()=>{if(authed)cargar();},[authed,cargar]);

  function upd(id,e){setCitas(p=>p.map(c=>c.id===id?{...c,estado:e}:c));}
  async function del(id){setDel(id);await deleteCita(id);setCitas(p=>p.filter(c=>c.id!==id));setDel(null);}

  const stats={
    total:citas.length,
    pendientes:citas.filter(c=>c.estado==="pendiente").length,
    confirmadas:citas.filter(c=>c.estado==="confirmada").length,
    ingresos:citas.filter(c=>c.estado!=="cancelada").reduce((a,c)=>a+(c.precio||0),0),
  };

  if(!authed) return <Login onLogin={()=>setAuthed(true)}/>;

  const fBtn=(active)=>({padding:"8px 12px",borderRadius:20,border:`1px solid ${active?`${C.acento}55`:"rgba(255,255,255,0.08)"}`,background:active?`${C.acento}18`:"rgba(255,255,255,0.03)",color:active?C.acento:C.textoSuave,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",touchAction:"manipulation"});

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#080809",color:C.texto,fontFamily:"Georgia,serif"}}>

      {/* Sidebar desktop */}
      <div className="sidebar-desktop" style={{width:210,background:"rgba(255,255,255,0.02)",borderRight:"1px solid rgba(255,255,255,0.06)",flexDirection:"column",flexShrink:0}}>
        <SidebarContent filtroP={filtroP} setFiltroP={setFiltroP} vista={vista} setVista={setVista} onLogout={()=>setAuthed(false)}/>
      </div>

      {/* Drawer móvil overlay */}
      {drawer&&<div style={{position:"fixed",inset:0,zIndex:150,display:"flex"}}>
        <div style={{width:220,background:"#0E0E11",borderRight:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",animation:"slideIn 0.25s ease",height:"100%",overflow:"auto"}}>
          <div style={{display:"flex",justifyContent:"flex-end",padding:"12px 12px 0"}}>
            <button style={{background:"transparent",border:"none",color:C.textoSuave,fontSize:20,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setDrawer(false)}>✕</button>
          </div>
          <SidebarContent filtroP={filtroP} setFiltroP={(v)=>{setFiltroP(v);setDrawer(false);}} vista={vista} setVista={(v)=>{setVista(v);setDrawer(false);}} onLogout={()=>setAuthed(false)}/>
        </div>
        <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={()=>setDrawer(false)}/>
      </div>}

      {/* Main */}
      <div style={{flex:1,overflow:"auto"}}>

        {/* Topbar móvil */}
        <div className="topbar-mobile" style={{alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
          <button style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 12px",color:C.texto,cursor:"pointer",fontSize:16,fontFamily:"inherit"}} onClick={()=>setDrawer(true)}>☰</button>
          <span style={{fontSize:14,fontWeight:700,letterSpacing:3,color:C.texto}}>{NEGOCIO.icono} ADMIN</span>
          <button style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 12px",color:C.textoSuave,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>setAuthed(false)}>Salir</button>
        </div>

        <div className="admin-main" style={{padding:24}}>

          {/* Stats grid */}
          <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {[["📅","Total",stats.total],["⏳","Pendientes",stats.pendientes],["✓","Confirmadas",stats.confirmadas],["💰","Ingresos",`$${stats.ingresos}`]].map(([ic,lb,v],i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 12px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22,flexShrink:0}}>{ic}</span>
                <div style={{minWidth:0}}>
                  <p className="stats-card-val" style={{margin:0,fontSize:20,fontWeight:700,color:C.acento,lineHeight:1}}>{v}</p>
                  <p style={{margin:0,fontSize:10,color:C.textoSuave,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lb}</p>
                </div>
              </div>
            ))}
          </div>

          {vista==="lista"&&<>
            {/* Toolbar */}
            <div className="toolbar-row" style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
              <input style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"10px 13px",color:C.texto,fontSize:14,fontFamily:"inherit",width:"100%"}}
                placeholder="Buscar nombre, teléfono..." value={busq} onChange={e=>setBusq(e.target.value)}/>
              <button style={{width:40,height:40,borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:C.texto,fontSize:18,cursor:"pointer",flexShrink:0,fontFamily:"inherit"}} onClick={cargar}>↺</button>
            </div>
            <div className="filtros-wrap" style={{display:"flex",gap:6,marginBottom:16}}>
              {["todas","pendiente","confirmada","completada","cancelada"].map(f=>(
                <button key={f} style={fBtn(filtroE===f)} onClick={()=>setFiltroE(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
              ))}
            </div>

            {error&&<div style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.2)",borderRadius:8,padding:"12px",fontSize:13,color:"#F87171",marginBottom:12}}>⚠️ {error}</div>}

            {loading
              ?<div style={{textAlign:"center",padding:48,color:C.textoSuave,fontStyle:"italic"}}>Cargando...</div>
              :citas.length===0
                ?<div style={{textAlign:"center",padding:48}}>
                  <p style={{fontSize:40,margin:"0 0 10px"}}>📭</p>
                  <p style={{color:C.textoSuave,fontSize:14}}>No hay citas</p>
                </div>
                :<>
                  {/* Desktop table */}
                  <div className="desktop-table" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,overflow:"hidden"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr>{["Profesional","Fecha","Hora","Cliente","Servicio","Precio","Estado",""].map(h=>(
                          <th key={h} style={{padding:"12px 14px",textAlign:"left",fontSize:10,color:C.textoSuave,letterSpacing:1,borderBottom:"1px solid rgba(255,255,255,0.06)",fontWeight:400}}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {citas.map((c,i)=>{
                          const p=NEGOCIO.profesionales.find(x=>x.nombre===c.profesional);
                          return(
                            <tr key={c.id} className="tr-row" style={{borderBottom:"1px solid rgba(255,255,255,0.04)",animation:`fi 0.3s ease both`,animationDelay:`${i*0.03}s`}}>
                              <td style={{padding:"12px 14px",fontSize:13}}>
                                <span style={{fontSize:16,marginRight:6}}>{p?.emoji||"👤"}</span>
                                <span style={{fontWeight:600,color:C.texto}}>{c.profesional}</span>
                              </td>
                              <td style={{padding:"12px 14px",fontSize:13,color:C.texto}}>{fmt(c.fecha)}</td>
                              <td style={{padding:"12px 14px",fontSize:13,color:C.acento,fontWeight:700}}>{c.hora}</td>
                              <td style={{padding:"12px 14px",fontSize:13}}>
                                <div style={{fontWeight:600,color:C.texto}}>{c.nombre}</div>
                                <div style={{fontSize:11,color:C.textoSuave}}>{c.telefono}</div>
                              </td>
                              <td style={{padding:"12px 14px",fontSize:13,color:C.texto}}>{c.servicio}</td>
                              <td style={{padding:"12px 14px",fontSize:13,fontWeight:600,color:C.acento}}>${c.precio}</td>
                              <td style={{padding:"12px 14px"}}><Badge estado={c.estado}/></td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",gap:6}}>
                                  <button className="icon-btn" style={{width:30,height:30,borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#A09890",cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setSel(c)}>✎</button>
                                  <button className="icon-btn" style={{width:30,height:30,borderRadius:6,border:"1px solid rgba(248,113,113,0.2)",background:"rgba(248,113,113,0.05)",color:"#F87171",cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>del(c.id)} disabled={deleting===c.id}>{deleting===c.id?"…":"✕"}</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="mobile-cards">
                    {citas.map(c=><CitaCard key={c.id} cita={c} onEdit={setSel} onDelete={del} deleting={deleting}/>)}
                  </div>
                </>
            }
          </>}

          {vista==="stats"&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
            <h2 style={{margin:0,fontSize:22,fontWeight:400,color:C.texto}}>Resumen{filtroP!=="todos"?` · ${filtroP}`:""}</h2>
            <div className="stats-full-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {Object.entries(ESTADOS).map(([k,e])=>{
                const count=citas.filter(c=>c.estado===k).length;
                const ing=citas.filter(c=>c.estado===k).reduce((a,c)=>a+(c.precio||0),0);
                return(
                  <div key={k} style={{borderRadius:14,border:`1px solid ${e.border}`,background:e.bg,padding:"16px",display:"flex",flexDirection:"column",gap:3}}>
                    <Badge estado={k}/>
                    <p style={{margin:"10px 0 0",fontSize:32,fontWeight:700,color:e.color,lineHeight:1}}>{count}</p>
                    <p style={{margin:0,fontSize:10,color:C.textoSuave}}>citas</p>
                    <p style={{margin:"8px 0 0",fontSize:18,fontWeight:700,color:e.color}}>${ing}</p>
                    <p style={{margin:0,fontSize:10,color:C.textoSuave}}>ingresos</p>
                  </div>
                );
              })}
            </div>
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:20}}>
              <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:400,color:"#A09890"}}>Por profesional</h3>
              {NEGOCIO.profesionales.map(p=>{
                const total=citas.filter(c=>c.profesional===p.nombre).length;
                const ing=citas.filter(c=>c.profesional===p.nombre&&c.estado!=="cancelada").reduce((a,c)=>a+(c.precio||0),0);
                const pct=citas.length?Math.round((total/citas.length)*100):0;
                return(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"12px 14px",background:"rgba(255,255,255,0.02)",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{fontSize:24,flexShrink:0}}>{p.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:4}}>
                        <span style={{fontWeight:600,color:C.texto,fontSize:13}}>{p.nombre}</span>
                        <span style={{fontSize:12,color:C.acento,fontWeight:700}}>{total} citas · ${ing}</span>
                      </div>
                      <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",background:`linear-gradient(90deg,${C.acento},${C.acentoB})`,width:`${pct}%`,borderRadius:3}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}

        </div>
      </div>

      {sel&&<Modal cita={sel} onClose={()=>setSel(null)} onUpdate={upd}/>}
    </div>
  );
}
