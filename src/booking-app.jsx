import { useState } from "react";

const SUPABASE_URL = "https://cajrkpxhzekriznupxvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhanJrcHhoemVrcml6bnVweHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjMzNjcsImV4cCI6MjA5MjAzOTM2N30.llz_rUPUDaqzqlqt8HiWtcH30LXs38El94nqoLd8im8";

async function guardarCita(datos) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/citas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

async function obtenerCitasDelDia(fecha) {
  const fechaStr = fecha.toISOString().split("T")[0];
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/citas?fecha=eq.${fechaStr}&select=hora`,
    { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(c => c.hora);
}

const SERVICES = [
  { id:1, name:"Corte + Barba", duration:60, price:45, icon:"✂️" },
  { id:2, name:"Corte Clásico", duration:40, price:28, icon:"💈" },
  { id:3, name:"Manicure", duration:50, price:35, icon:"💅" },
  { id:4, name:"Coloración", duration:120, price:80, icon:"🎨" },
  { id:5, name:"Tratamiento Capilar", duration:45, price:40, icon:"🧴" },
  { id:6, name:"Pedicure", duration:60, price:38, icon:"🦶" },
];

const HOURS = ["9:00","9:30","10:00","10:30","11:00","11:30","12:00","12:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
const DAYS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getDaysOfWeek(base) {
  const days = [];
  const start = new Date(base);
  start.setDate(start.getDate() - start.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function Row({ label, val, highlight }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:12,color:"#7A7570"}}>{label}</span>
      <span style={{fontSize:14,fontWeight:600,color:highlight?"#F5A623":"#F0EDE8"}}>{val}</span>
    </div>
  );
}

export default function BookingApp() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [weekBase, setWeekBase] = useState(new Date());
  const [form, setForm] = useState({ name:"", phone:"", email:"", notes:"" });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const days = getDaysOfWeek(weekBase);
  const today = new Date(); today.setHours(0,0,0,0);
  const progress = ((step - 1) / 4) * 100;

  function goStep(n) { setAnimKey(k => k+1); setStep(n); }

  async function selectDate(d) {
    setSelectedDate(d);
    setSelectedTime(null);
    setLoadingSlots(true);
    const slots = await obtenerCitasDelDia(d);
    setBookedSlots(slots);
    setLoadingSlots(false);
  }

  async function handleBook() {
    setSaving(true);
    setError(null);
    try {
      await guardarCita({
        nombre: form.name,
        telefono: form.phone,
        email: form.email || null,
        notas: form.notes || null,
        servicio: selectedService.name,
        duracion: selectedService.duration,
        precio: selectedService.price,
        fecha: selectedDate.toISOString().split("T")[0],
        hora: selectedTime,
        estado: "pendiente",
      });
      setDone(true);
      goStep(5);
    } catch(e) {
      setError("No se pudo guardar la cita. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setDone(false); setStep(1); setSelectedService(null);
    setSelectedDate(null); setSelectedTime(null);
    setForm({name:"",phone:"",email:"",notes:""});
    setBookedSlots([]); setError(null);
  }

  if (done) return (
    <div style={s.root}>
      <div style={s.successCard}>
        <div style={s.checkCircle}>✓</div>
        <h2 style={s.successTitle}>¡Cita confirmada!</h2>
        <p style={s.successSub}>Guardada en el sistema. Ya no tienes excusa para no verte bien.</p>
        <div style={s.confirmBox}>
          <Row label="Servicio" val={`${selectedService?.icon} ${selectedService?.name}`} />
          <Row label="Fecha" val={selectedDate?.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})} />
          <Row label="Hora" val={selectedTime} />
          <Row label="Cliente" val={form.name} />
          <Row label="Total" val={`$${selectedService?.price}`} highlight />
        </div>
        <button style={s.btnPrimary} onClick={resetAll}>Agendar otra cita</button>
      </div>
    </div>
  );

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.brandMark}>◈</div>
        <div>
          <h1 style={s.brandName}>STUDIO</h1>
          <p style={s.brandTagline}>Agenda tu cita en menos de 2 minutos</p>
        </div>
        <span style={s.badge}>Disponible hoy</span>
      </div>

      <div style={s.progressWrap}>
        <div style={s.progressTrack}><div style={{...s.progressFill,width:`${progress}%`}}/></div>
        <div style={s.steps}>
          {["Servicio","Fecha","Hora","Tus datos"].map((label,i) => (
            <div key={i} style={{...s.stepDot,...(step>i+1?s.stepDone:step===i+1?s.stepActive:{})}}>
              <div style={s.stepCircle}>{step>i+1?"✓":i+1}</div>
              <span style={s.stepLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card} key={animKey}>

        {step===1 && (
          <div style={s.fadeIn}>
            <h2 style={s.sectionTitle}>¿Qué necesitas hoy?</h2>
            <p style={s.sectionSub}>Elige el servicio y te conseguimos el horario perfecto</p>
            <div style={s.serviceGrid}>
              {SERVICES.map(sv => (
                <div key={sv.id}
                  style={{...s.serviceCard,...(selectedService?.id===sv.id?s.serviceCardSelected:{})}}
                  onClick={() => setSelectedService(sv)}>
                  <span style={s.serviceIcon}>{sv.icon}</span>
                  <span style={s.serviceName}>{sv.name}</span>
                  <div style={s.serviceMeta}>
                    <span style={s.serviceDur}>⏱ {sv.duration}min</span>
                    <span style={s.servicePrice}>${sv.price}</span>
                  </div>
                  {selectedService?.id===sv.id && <div style={s.selectedDot}/>}
                </div>
              ))}
            </div>
            <button style={{...s.btnPrimary,...(!selectedService?s.btnDisabled:{})}} disabled={!selectedService} onClick={()=>goStep(2)}>
              Continuar →
            </button>
          </div>
        )}

        {step===2 && (
          <div style={s.fadeIn}>
            <h2 style={s.sectionTitle}>¿Cuándo te acomoda?</h2>
            <p style={s.sectionSub}>Selecciona el día que más te convenga</p>
            <div style={s.calNav}>
              <button style={s.navBtn} onClick={()=>{const d=new Date(weekBase);d.setDate(d.getDate()-7);setWeekBase(d);}}>‹</button>
              <span style={s.calMonth}>{MONTHS_ES[days[0].getMonth()]} {days[0].getFullYear()}</span>
              <button style={s.navBtn} onClick={()=>{const d=new Date(weekBase);d.setDate(d.getDate()+7);setWeekBase(d);}}>›</button>
            </div>
            <div style={s.calGrid}>
              {days.map((d,i)=>{
                const isPast=d<today;
                const isSel=selectedDate?.toDateString()===d.toDateString();
                const isToday=d.toDateString()===today.toDateString();
                return (
                  <div key={i}
                    style={{...s.dayCell,...(isPast?s.dayCellPast:{}),...(isSel?s.dayCellSelected:{}),...(isToday&&!isSel?s.dayCellToday:{})}}
                    onClick={()=>!isPast&&selectDate(d)}>
                    <span style={s.dayName}>{DAYS_ES[i]}</span>
                    <span style={s.dayNum}>{d.getDate()}</span>
                    {isToday&&<span style={s.todayDot}/>}
                  </div>
                );
              })}
            </div>
            <div style={s.navBtns}>
              <button style={s.btnSecondary} onClick={()=>goStep(1)}>← Atrás</button>
              <button style={{...s.btnPrimary,...(!selectedDate?s.btnDisabled:{})}} disabled={!selectedDate} onClick={()=>goStep(3)}>Continuar →</button>
            </div>
          </div>
        )}

        {step===3 && (
          <div style={s.fadeIn}>
            <h2 style={s.sectionTitle}>Elige tu hora</h2>
            <p style={s.sectionSub}>{selectedDate?.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})} · {selectedService?.name}</p>
            {loadingSlots
              ? <div style={s.loading}>Consultando disponibilidad en tiempo real...</div>
              : <div style={s.timeGrid}>
                  {HOURS.map(h=>{
                    const isBooked=bookedSlots.includes(h);
                    const isSel=selectedTime===h;
                    return (
                      <div key={h}
                        style={{...s.timeSlot,...(isBooked?s.timeSlotBooked:{}),...(isSel?s.timeSlotSelected:{})}}
                        onClick={()=>!isBooked&&setSelectedTime(h)}>
                        {h}
                        {isBooked&&<span style={s.bookedTag}>Ocupado</span>}
                      </div>
                    );
                  })}
                </div>
            }
            <div style={s.navBtns}>
              <button style={s.btnSecondary} onClick={()=>goStep(2)}>← Atrás</button>
              <button style={{...s.btnPrimary,...(!selectedTime?s.btnDisabled:{})}} disabled={!selectedTime} onClick={()=>goStep(4)}>Continuar →</button>
            </div>
          </div>
        )}

        {step===4 && (
          <div style={s.fadeIn}>
            <h2 style={s.sectionTitle}>Últimos detalles</h2>
            <p style={s.sectionSub}>Solo necesitamos saber quién eres</p>
            <div style={s.summaryBadge}>
              {selectedService?.icon} {selectedService?.name} · {selectedDate?.toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"})} · {selectedTime}
            </div>
            <div style={s.formGrid}>
              {[
                {key:"name",label:"Nombre completo *",type:"text",placeholder:"Tu nombre"},
                {key:"phone",label:"WhatsApp / Teléfono *",type:"tel",placeholder:"+57 300 000 0000"},
                {key:"email",label:"Correo electrónico",type:"email",placeholder:"opcional@correo.com"},
                {key:"notes",label:"Notas adicionales",type:"text",placeholder:"Alergias, preferencias..."},
              ].map(f=>(
                <div key={f.key} style={s.fieldWrap}>
                  <label style={s.fieldLabel}>{f.label}</label>
                  <input style={s.fieldInput} type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>
                </div>
              ))}
            </div>
            {error && <div style={s.errorMsg}>⚠️ {error}</div>}
            <div style={s.navBtns}>
              <button style={s.btnSecondary} onClick={()=>goStep(3)}>← Atrás</button>
              <button
                style={{...s.btnPrimary,...((!form.name||!form.phone||saving)?s.btnDisabled:{})}}
                disabled={!form.name||!form.phone||saving}
                onClick={handleBook}>
                {saving?"Guardando...":"Confirmar cita ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
      <p style={s.footer}>Powered by <strong>BookEasy</strong> · Tu tiempo vale demasiado</p>
    </div>
  );
}

const s = {
  root:{minHeight:"100vh",background:"#0C0C0F",color:"#F0EDE8",fontFamily:"'Georgia','Times New Roman',serif",padding:"0 0 48px",display:"flex",flexDirection:"column",alignItems:"center"},
  header:{width:"100%",maxWidth:680,display:"flex",alignItems:"center",gap:16,padding:"32px 24px 20px"},
  brandMark:{fontSize:32,color:"#F5A623",lineHeight:1},
  brandName:{margin:0,fontSize:22,fontWeight:700,letterSpacing:6,color:"#F0EDE8"},
  brandTagline:{margin:0,fontSize:12,color:"#7A7570",letterSpacing:1},
  badge:{marginLeft:"auto",background:"rgba(245,166,35,0.15)",color:"#F5A623",border:"1px solid rgba(245,166,35,0.4)",borderRadius:20,padding:"4px 12px",fontSize:11,letterSpacing:1},
  progressWrap:{width:"100%",maxWidth:680,padding:"0 24px 24px"},
  progressTrack:{height:2,background:"rgba(255,255,255,0.08)",borderRadius:2,marginBottom:20,overflow:"hidden"},
  progressFill:{height:"100%",background:"linear-gradient(90deg,#F5A623,#FF6B35)",borderRadius:2,transition:"width 0.5s ease"},
  steps:{display:"flex",justifyContent:"space-between"},
  stepDot:{display:"flex",flexDirection:"column",alignItems:"center",gap:6,opacity:0.3,transition:"opacity 0.3s"},
  stepActive:{opacity:1},stepDone:{opacity:0.7},
  stepCircle:{width:28,height:28,borderRadius:"50%",border:"1px solid rgba(245,166,35,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#F5A623",background:"rgba(245,166,35,0.1)"},
  stepLabel:{fontSize:10,letterSpacing:0.5,color:"#A09890"},
  card:{width:"100%",maxWidth:680,padding:"32px 24px"},
  fadeIn:{animation:"fadeSlideIn 0.35s ease forwards"},
  sectionTitle:{margin:"0 0 8px",fontSize:28,fontWeight:400,letterSpacing:-0.5},
  sectionSub:{margin:"0 0 28px",fontSize:14,color:"#7A7570",lineHeight:1.5},
  serviceGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:28},
  serviceCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"20px 16px",cursor:"pointer",transition:"all 0.2s",position:"relative",display:"flex",flexDirection:"column",gap:8},
  serviceCardSelected:{background:"rgba(245,166,35,0.1)",border:"1px solid rgba(245,166,35,0.5)",transform:"translateY(-2px)"},
  serviceIcon:{fontSize:28},serviceName:{fontSize:14,fontWeight:600},
  serviceMeta:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4},
  serviceDur:{fontSize:11,color:"#7A7570"},servicePrice:{fontSize:16,fontWeight:700,color:"#F5A623"},
  selectedDot:{position:"absolute",top:12,right:12,width:8,height:8,borderRadius:"50%",background:"#F5A623"},
  calNav:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},
  calMonth:{fontSize:16,fontWeight:600,letterSpacing:1},
  navBtn:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#F0EDE8",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"},
  calGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:28},
  dayCell:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",transition:"all 0.2s",position:"relative"},
  dayCellPast:{opacity:0.25,cursor:"not-allowed"},
  dayCellSelected:{background:"rgba(245,166,35,0.15)",border:"1px solid #F5A623"},
  dayCellToday:{border:"1px solid rgba(245,166,35,0.3)"},
  dayName:{fontSize:10,color:"#7A7570",letterSpacing:1},dayNum:{fontSize:18,fontWeight:600},
  todayDot:{width:4,height:4,borderRadius:"50%",background:"#F5A623",position:"absolute",bottom:6},
  timeGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:10,marginBottom:28},
  timeSlot:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"14px 8px",textAlign:"center",cursor:"pointer",fontSize:15,fontWeight:600,transition:"all 0.2s",position:"relative"},
  timeSlotBooked:{opacity:0.3,cursor:"not-allowed",textDecoration:"line-through"},
  timeSlotSelected:{background:"rgba(245,166,35,0.15)",border:"1px solid #F5A623",color:"#F5A623"},
  bookedTag:{display:"block",fontSize:8,color:"#7A7570",marginTop:4,letterSpacing:0.5},
  loading:{textAlign:"center",padding:"40px 0",color:"#7A7570",fontSize:14,fontStyle:"italic"},
  summaryBadge:{background:"rgba(245,166,35,0.1)",border:"1px solid rgba(245,166,35,0.3)",borderRadius:8,padding:"12px 16px",fontSize:13,marginBottom:24,color:"#F5A623"},
  formGrid:{display:"flex",flexDirection:"column",gap:16,marginBottom:28},
  fieldWrap:{display:"flex",flexDirection:"column",gap:6},
  fieldLabel:{fontSize:12,color:"#A09890",letterSpacing:0.5},
  fieldInput:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"12px 16px",color:"#F0EDE8",fontSize:15,fontFamily:"inherit",outline:"none"},
  errorMsg:{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.3)",borderRadius:8,padding:"12px 16px",fontSize:13,color:"#FF6B6B",marginBottom:16},
  navBtns:{display:"flex",gap:12},
  btnPrimary:{flex:1,background:"linear-gradient(135deg,#F5A623,#FF6B35)",border:"none",borderRadius:10,padding:"14px 28px",color:"#0C0C0F",fontWeight:700,fontSize:15,cursor:"pointer",letterSpacing:0.5},
  btnSecondary:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"14px 20px",color:"#F0EDE8",fontWeight:600,fontSize:14,cursor:"pointer"},
  btnDisabled:{opacity:0.3,cursor:"not-allowed"},
  successCard:{maxWidth:480,width:"100%",margin:"60px auto",padding:"48px 32px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:16},
  checkCircle:{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#F5A623,#FF6B35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#0C0C0F",fontWeight:700,marginBottom:8},
  successTitle:{margin:0,fontSize:28,fontWeight:400},
  successSub:{margin:0,fontSize:14,color:"#7A7570",lineHeight:1.6},
  confirmBox:{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"20px",display:"flex",flexDirection:"column",gap:12,textAlign:"left",margin:"8px 0"},
  footer:{marginTop:16,fontSize:11,color:"#3A3532",letterSpacing:0.5,textAlign:"center"},
};

const st=document.createElement("style");
st.textContent=`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} input:focus{border-color:rgba(245,166,35,0.5)!important} input::placeholder{color:#3A3532}`;
document.head.appendChild(st);
