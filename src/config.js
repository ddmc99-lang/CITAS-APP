// ============================================================
//  CONFIG.JS — EL ÚNICO ARCHIVO QUE CAMBIAS POR CLIENTE
// ============================================================

export const NEGOCIO = {
  nombre:   "Barbería Don Carlos",
  tagline:  "Agenda tu cita en 2 minutos",
  icono:    "◈",
  whatsapp: "573001234567",

  colores: {
    fondo:      "#0C0C0F",
    acento:     "#F5A623",
    acentoB:    "#FF6B35",
    texto:      "#F0EDE8",
    textoSuave: "#7A7570",
  },

  supabase: {
    url:     "https://cajrkpxhzekriznupxvl.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhanJrcHhoemVrcml6bnVweHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjMzNjcsImV4cCI6MjA5MjAzOTM2N30.llz_rUPUDaqzqlqt8HiWtcH30LXs38El94nqoLd8im8",
  },

  adminPassword: "studio2024",

  profesionales: [
    { id:1, nombre:"Carlos",  especialidad:"Cortes & Barba",    emoji:"💈" },
    { id:2, nombre:"María",   especialidad:"Coloración & Uñas", emoji:"💅" },
    { id:3, nombre:"Andrés",  especialidad:"Cortes Clásicos",   emoji:"✂️" },
  ],

  horarios: [
    "9:00","9:30","10:00","10:30","11:00","11:30",
    "12:00","12:30",
    "14:00","14:30","15:00","15:30","16:00","16:30",
    "17:00","17:30","18:00",
  ],

  servicios: [
    { id:1, name:"Corte Clásico",       duration:40,  price:28, icon:"✂️" },
    { id:2, name:"Corte + Barba",       duration:60,  price:45, icon:"💈" },
    { id:3, name:"Afeitado Clásico",    duration:30,  price:20, icon:"🪒" },
    { id:4, name:"Tratamiento Capilar", duration:45,  price:35, icon:"🧴" },
    { id:5, name:"Coloración",          duration:120, price:80, icon:"🎨" },
    { id:6, name:"Manicure",            duration:50,  price:35, icon:"💅" },
  ],

  textos: {
    paso0Titulo: "¿Con quién quieres tu cita?",
    paso0Sub:    "Elige tu profesional de confianza",
    paso1Titulo: "¿Qué necesitas hoy?",
    paso1Sub:    "Elige el servicio",
    paso2Titulo: "¿Cuándo te acomoda?",
    paso2Sub:    "Selecciona el día",
    paso3Titulo: "Elige tu hora",
    paso4Titulo: "Últimos detalles",
    paso4Sub:    "Solo necesitamos saber quién eres",
    exitoTitulo: "¡Cita confirmada!",
    exitoSub:    "Guardada en el sistema. Ya no tienes excusa.",
    footerTexto: "Powered by BookEasy",
  },
};
