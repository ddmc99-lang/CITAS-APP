import { useState } from "react";
import { NEGOCIO } from "./config";

const { url: SB_URL, anonKey: SB_KEY } = NEGOCIO.supabase;
const SBH = { "Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}` };

async function guardarCita(d) {
  const r = await fetch(`${SB_URL}/rest/v1/citas`,{method:"POST",headers:{...SBH,"Prefer":"return=minimal"},body:JSON.stringify(d)});
  if(!r.ok) throw new Error();
}
async function obtenerCitasDelDia(fecha, prof) {
  const f = fecha.toISOString().split("T")[0];
  const r = await fetch(`${SB_URL}/rest/v1/citas?fecha=eq.${f}&profesional=eq.${encodeURIComponent(prof)}&select=hora`,{headers:SBH});
  if(!r.ok) return [];
  return (await r.json()).map(c=>c.hora);
}

const DAYS_ES   = ["L","M","X","J","V","S","D"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getDays(base) {
  const days=[],s=new Date(base);
  s.setDate(s.getDate()-s.getDay()+1);
  for(let i=0;i<7;i++){const d=new Date(s);d.setDate(s.getDate()+i);days.push(d);}
  return days;
}

function inject(C) {
  if(document.getElementById("bk-css")) return;
  const st=document.createElement("style"); st.id="bk-css";
  st.textContent=`
    *{box-sizing:border-box}
    body{margin:0;padding:0;background:${C.fondo};-webkit-tap-highlight-color:transparent}
    @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    input:focus{border-color:${C.acento}99!important;outline:none}
    input::placeholder{color:#3A3532}
    .svc-card:hover{transform:translateY(-2px)}
    .prof-card:hover{transform:translateY(-3px)}
    .time-slot:hover{border-color:${C.acento}66!important}
    @media(max-width:480px){
      .grid-svc{grid-template-columns:1fr 1fr!important}
      .grid-prof{grid-template-columns:1fr!important}
      .grid-time{grid-template-columns:repeat(3,1fr)!important}
      .nav-btns{flex-direction:column!important}
      .nav-btns button{flex:none!important;width:100%}
      .header-tagline{display:none}
    }
  `;
  document.head.appendChild(st);
}

export default function BookingApp() {
  const C=NEGOCIO.colores, T=NEGOCIO.textos;
  inject(C);

  const [step,setStep]   = useState(0);
  const [prof,setProf]   = useState(null);
  const [svc,setSvc]     = useState(null);
  const [date,setDate]   = useState(null);
  const [time,setTime]   = useState(null);
  const [wb,setWb]       = useState(new Date());
  const [form,setForm]   = useState({name:"",phone:"",email:"",notes:""});
  const [booked,setBooked] = useState([]);
  const [ls,setLs]       = useState(false);
  const [saving,setSaving] = useState(false);
  const [err,setErr]     = useState(null);
  const [done,setDone]   = useState(false);
  const [ak,setAk]       = useState(0);

  const days=getDays(wb);
  const today=new Date(); today.setHours(0,0,0,0);
  const pct=(step/4)*100;

  function go(n){setAk(k=>k+1);setStep(n);}
  async function pickDate(d){setDate(d);setTime(null);setLs(true);setBooked(await obtenerCitasDelDia(d,prof.nombre));setLs(false);}

  async function book(){
    setSaving(true);setErr(null);
    try{
      await guardarCita({profesional:prof.nombre,servicio:svc.name,duracion:svc.duration,precio:svc.price,fecha:date.toISOString().split("T")[0],hora:time,nombre:form.name,telefono:form.phone,email:form.email||null,notas:form.notes||null,estado:"pendiente"});
      setDone(true);go(5);
    }catch{setErr("No se pudo guardar. Intenta de nuevo.");}
    finally{setSaving(false);}
  }

  function reset(){setDone(false);setStep(0);setProf(null);setSvc(null);setDate(null);setTime(null);setForm({name:"",phone:"",email:"",notes:""});setErr(null);}

  const btnP={background:`linear-gradient(135deg,${C.acento},${C.acentoB})`,border:"none",borderRadius:12,padding:"15px 24px",color:"#0C0C0F",fontWeight:700,fontSize:16,cursor:"pointer",flex:1,fontFamily:"inherit",touchAction:"manipulation"};
  const btnD={...btnP,opacity:0.3,cursor:"not-allowed"};
  const btnS={background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"15px 20px",color:C.texto,fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:"inherit",touchAction:"manipulation"};

  const root={minHeight:"100vh",background:C.fondo,color:C.texto,fontFamily:"Georgia,'Times New Roman',serif",display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:48};
  const wrap={width:"100%",maxWidth:680,padding:"0 16px"};

  if(done) return (
    <div style={root}>
      <div style={{...wrap,display:"flex",alignItems:"center",justifyContent:"center",flex:1,paddingTop:40}}>
        <div style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"40px 24px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${C.acento},${C.acentoB})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#0C0C0F",fontWeight:700}}>✓</div>
          <h2 style={{margin:0,fontSize:26,fontWeight:400}}>{T.exitoTitulo}</h2>
          <p style={{margin:0,fontSize:14,color:C.textoSuave,lineHeight:1.6}}>{T.exitoSub}</p>
          <div style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 20px",display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
            {[["Profesional",`${prof?.emoji} ${prof?.nombre}`],["Servicio",`${svc?.icon} ${svc?.name}`],["Fecha",date?.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})],["Hora",time],["Cliente",form.name],["Total",`$${svc?.price}`]].map(([l,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:C.textoSuave,flexShrink:0}}>{l}</span>
                <span style={{fontSize:14,fontWeight:600,color:i===5?C.acento:C.texto,textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
          <button style={{...btnP,flex:"none",width:"100%"}} onClick={reset}>Agendar otra cita</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={root}>

      {/* Header */}
      <div style={{...wrap,display:"flex",alignItems:"center",gap:12,padding:"24px 16px 16px"}}>
        <span style={{fontSize:28,color:C.acento,lineHeight:1,flexShrink:0}}>{NEGOCIO.icono}</span>
        <div style={{minWidth:0}}>
          <h1 style={{margin:0,fontSize:18,fontWeight:700,letterSpacing:4,color:C.texto,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{NEGOCIO.nombre.toUpperCase()}</h1>
          <p className="header-tagline" style={{margin:0,fontSize:11,color:C.textoSuave,letterSpacing:1}}>{NEGOCIO.tagline}</p>
        </div>
        <span style={{marginLeft:"auto",background:`${C.acento}22`,color:C.acento,border:`1px solid ${C.acento}55`,borderRadius:20,padding:"4px 10px",fontSize:10,letterSpacing:1,whiteSpace:"nowrap",flexShrink:0}}>Disponible</span>
      </div>

      {/* Progress */}
      <div style={{...wrap,paddingBottom:20}}>
        <div style={{height:2,background:"rgba(255,255,255,0.08)",borderRadius:2,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",background:`linear-gradient(90deg,${C.acento},${C.acentoB})`,width:`${pct}%`,transition:"width 0.5s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {["Prof.","Servicio","Fecha","Hora","Datos"].map((lb,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,opacity:step===i?1:step>i?0.65:0.25,transition:"opacity 0.3s"}}>
              <div style={{width:24,height:24,borderRadius:"50%",border:`1px solid ${C.acento}88`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.acento,background:`${C.acento}18`}}>{step>i?"✓":i+1}</div>
              <span style={{fontSize:8,letterSpacing:0.5,color:"#A09890",textAlign:"center"}}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{...wrap}} key={ak}>

        {/* PASO 0 — Profesional */}
        {step===0&&<div style={{animation:"fi 0.3s ease forwards"}}>
          <h2 style={{margin:"0 0 6px",fontSize:24,fontWeight:400,color:C.texto}}>{T.paso0Titulo}</h2>
          <p style={{margin:"0 0 20px",fontSize:13,color:C.textoSuave}}>{T.paso0Sub}</p>
          <div className="grid-prof" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}>
            {NEGOCIO.profesionales.map(p=>{
              const sel=prof?.id===p.id;
              return(
                <div key={p.id} className="prof-card"
                  style={{background:sel?`${C.acento}18`:"rgba(255,255,255,0.04)",border:`1px solid ${sel?C.acento:"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:"24px 16px",cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:10,textAlign:"center",position:"relative",touchAction:"manipulation"}}
                  onClick={()=>setProf(p)}>
                  <span style={{fontSize:44}}>{p.emoji}</span>
                  <p style={{margin:0,fontSize:17,fontWeight:700,color:C.texto}}>{p.nombre}</p>
                  <p style={{margin:0,fontSize:11,color:C.textoSuave,lineHeight:1.4}}>{p.especialidad}</p>
                  {sel&&<div style={{position:"absolute",top:12,right:12,width:10,height:10,borderRadius:"50%",background:C.acento}}/>}
                </div>
              );
            })}
          </div>
          <button style={prof?btnP:btnD} disabled={!prof} onClick={()=>go(1)}>Continuar →</button>
        </div>}

        {/* PASO 1 — Servicio */}
        {step===1&&<div style={{animation:"fi 0.3s ease forwards"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <span style={{fontSize:28}}>{prof?.emoji}</span>
            <div>
              <h2 style={{margin:0,fontSize:22,fontWeight:400,color:C.texto}}>{T.paso1Titulo}</h2>
              <p style={{margin:"3px 0 0",fontSize:12,color:C.acento}}>Con {prof?.nombre}</p>
            </div>
          </div>
          <div className="grid-svc" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:24}}>
            {NEGOCIO.servicios.map(sv=>{
              const sel=svc?.id===sv.id;
              return(
                <div key={sv.id} className="svc-card"
                  style={{background:sel?`${C.acento}18`:"rgba(255,255,255,0.04)",border:`1px solid ${sel?C.acento:"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"16px 14px",cursor:"pointer",transition:"all 0.2s",position:"relative",display:"flex",flexDirection:"column",gap:6,touchAction:"manipulation"}}
                  onClick={()=>setSvc(sv)}>
                  <span style={{fontSize:26}}>{sv.icon}</span>
                  <span style={{fontSize:13,fontWeight:600,color:C.texto,lineHeight:1.3}}>{sv.name}</span>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                    <span style={{fontSize:10,color:C.textoSuave}}>⏱{sv.duration}m</span>
                    <span style={{fontSize:15,fontWeight:700,color:C.acento}}>${sv.price}</span>
                  </div>
                  {sel&&<div style={{position:"absolute",top:10,right:10,width:8,height:8,borderRadius:"50%",background:C.acento}}/>}
                </div>
              );
            })}
          </div>
          <div className="nav-btns" style={{display:"flex",gap:10}}>
            <button style={btnS} onClick={()=>go(0)}>← Atrás</button>
            <button style={svc?btnP:btnD} disabled={!svc} onClick={()=>go(2)}>Continuar →</button>
          </div>
        </div>}

        {/* PASO 2 — Fecha */}
        {step===2&&<div style={{animation:"fi 0.3s ease forwards"}}>
          <h2 style={{margin:"0 0 6px",fontSize:24,fontWeight:400,color:C.texto}}>{T.paso2Titulo}</h2>
          <p style={{margin:"0 0 16px",fontSize:13,color:C.textoSuave}}>{T.paso2Sub}</p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:C.texto,borderRadius:8,width:40,height:40,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation"}}
              onClick={()=>{const d=new Date(wb);d.setDate(d.getDate()-7);setWb(d);}}>‹</button>
            <span style={{fontSize:15,fontWeight:600,color:C.texto}}>{MONTHS_ES[days[0].getMonth()]} {days[0].getFullYear()}</span>
            <button style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:C.texto,borderRadius:8,width:40,height:40,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation"}}
              onClick={()=>{const d=new Date(wb);d.setDate(d.getDate()+7);setWb(d);}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:24}}>
            {days.map((d,i)=>{
              const ip=d<today,is=date?.toDateString()===d.toDateString(),it=d.toDateString()===today.toDateString();
              return(
                <div key={i}
                  style={{background:is?`${C.acento}22`:"rgba(255,255,255,0.04)",border:`1px solid ${is?C.acento:it?`${C.acento}44`:"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"10px 2px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:ip?"not-allowed":"pointer",opacity:ip?0.2:1,position:"relative",transition:"all 0.15s",touchAction:"manipulation",minHeight:56}}
                  onClick={()=>!ip&&pickDate(d)}>
                  <span style={{fontSize:9,color:C.textoSuave,letterSpacing:0.5}}>{DAYS_ES[i]}</span>
                  <span style={{fontSize:16,fontWeight:600,color:C.texto}}>{d.getDate()}</span>
                  {it&&<span style={{width:4,height:4,borderRadius:"50%",background:C.acento,position:"absolute",bottom:5}}/>}
                </div>
              );
            })}
          </div>
          <div className="nav-btns" style={{display:"flex",gap:10}}>
            <button style={btnS} onClick={()=>go(1)}>← Atrás</button>
            <button style={date?btnP:btnD} disabled={!date} onClick={()=>go(3)}>Continuar →</button>
          </div>
        </div>}

        {/* PASO 3 — Hora */}
        {step===3&&<div style={{animation:"fi 0.3s ease forwards"}}>
          <h2 style={{margin:"0 0 6px",fontSize:24,fontWeight:400,color:C.texto}}>{T.paso3Titulo}</h2>
          <p style={{margin:"0 0 16px",fontSize:13,color:C.textoSuave,lineHeight:1.4}}>
            {date?.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})} · {prof?.emoji} {prof?.nombre}
          </p>
          {ls
            ?<div style={{textAlign:"center",padding:"32px",color:C.textoSuave,fontStyle:"italic",fontSize:14}}>Consultando disponibilidad...</div>
            :<div className="grid-time" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:24}}>
              {NEGOCIO.horarios.map(h=>{
                const ib=booked.includes(h),is=time===h;
                return(
                  <div key={h} className={!ib?"time-slot":""}
                    style={{background:is?`${C.acento}22`:"rgba(255,255,255,0.04)",border:`1px solid ${is?C.acento:"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"12px 4px",textAlign:"center",cursor:ib?"not-allowed":"pointer",fontSize:14,fontWeight:600,color:is?C.acento:ib?"#3A3532":C.texto,opacity:ib?0.3:1,textDecoration:ib?"line-through":"none",transition:"all 0.15s",touchAction:"manipulation"}}
                    onClick={()=>!ib&&setTime(h)}>
                    {h}
                    {ib&&<span style={{display:"block",fontSize:7,color:C.textoSuave,marginTop:3}}>Ocupado</span>}
                  </div>
                );
              })}
            </div>
          }
          <div className="nav-btns" style={{display:"flex",gap:10}}>
            <button style={btnS} onClick={()=>go(2)}>← Atrás</button>
            <button style={time?btnP:btnD} disabled={!time} onClick={()=>go(4)}>Continuar →</button>
          </div>
        </div>}

        {/* PASO 4 — Datos */}
        {step===4&&<div style={{animation:"fi 0.3s ease forwards"}}>
          <h2 style={{margin:"0 0 6px",fontSize:24,fontWeight:400,color:C.texto}}>{T.paso4Titulo}</h2>
          <p style={{margin:"0 0 16px",fontSize:13,color:C.textoSuave}}>{T.paso4Sub}</p>
          {/* Resumen compacto */}
          <div style={{background:`${C.acento}16`,border:`1px solid ${C.acento}44`,borderRadius:10,padding:"12px 14px",marginBottom:20,display:"flex",flexWrap:"wrap",gap:6,fontSize:12,color:C.acento,lineHeight:1.5}}>
            <span>{prof?.emoji} {prof?.nombre}</span>
            <span style={{opacity:0.4}}>·</span>
            <span>{svc?.icon} {svc?.name}</span>
            <span style={{opacity:0.4}}>·</span>
            <span>{date?.toLocaleDateString("es-ES",{day:"numeric",month:"short"})}</span>
            <span style={{opacity:0.4}}>·</span>
            <span>{time}</span>
            <span style={{marginLeft:"auto",fontWeight:700}}>${svc?.price}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
            {[{k:"name",l:"Nombre completo *",t:"text",p:"Tu nombre"},{k:"phone",l:"WhatsApp *",t:"tel",p:"+57 300 000 0000"},{k:"email",l:"Correo (opcional)",t:"email",p:"correo@ejemplo.com"},{k:"notes",l:"Notas adicionales",t:"text",p:"Alergias, preferencias..."}].map(f=>(
              <div key={f.k}>
                <label style={{fontSize:11,color:"#A09890",letterSpacing:0.5,display:"block",marginBottom:6}}>{f.l}</label>
                <input style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"13px 14px",color:C.texto,fontSize:16,fontFamily:"inherit",boxSizing:"border-box"}}
                  type={f.t} placeholder={f.p} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})}/>
              </div>
            ))}
          </div>
          {err&&<div style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.3)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#FF6B6B",marginBottom:16}}>⚠️ {err}</div>}
          <div className="nav-btns" style={{display:"flex",gap:10}}>
            <button style={btnS} onClick={()=>go(3)}>← Atrás</button>
            <button style={(!form.name||!form.phone||saving)?btnD:btnP} disabled={!form.name||!form.phone||saving} onClick={book}>
              {saving?"Guardando...":"Confirmar cita ✓"}
            </button>
          </div>
        </div>}

      </div>
      <p style={{marginTop:24,fontSize:10,color:"#2A2725",letterSpacing:0.5,textAlign:"center"}}>{T.footerTexto}</p>
    </div>
  );
}
