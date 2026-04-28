import React, { useState, useEffect, useRef, Fragment, Component } from "react";
import { Analytics } from "@vercel/analytics/react";

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  componentDidCatch(error,info){console.error("ErrorBoundary caught:",error,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{background:"#fff8f8",border:"1.5px solid #fca5a5",borderRadius:12,padding:"32px",textAlign:"center",color:"#7f1d1d"}}>
          <div style={{fontWeight:800,fontSize:"1rem",marginBottom:8}}>Something went wrong loading this section.</div>
          <div style={{fontSize:"0.82rem",color:"#9ca3af",marginBottom:16}}>{this.state.error?.message||"Unknown error"}</div>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{background:"#1a3c34",color:"white",border:"none",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── IMAGE PATHS ────────────────────────────────────────────────────────────
const VENMO = "dmpickleball"; // Venmo username (no @)
// All images live in /public/images/ — drop your files there with these names:
const LOGO_CRBN    = "/images/logo-crbn.png";     // was: IMG_5034.png
const LOGO_VATIC   = "/images/logo-vatic.png";    // was: IMG_5036.png
const LOGO_SIXZERO = "/images/logo-sixzero.png";  // was: IMG_5035.png
const LOGO_ENGAGE  = "/images/logo-engage.png";   // was: IMG_5037.png
const DAVID_PHOTO  = "/images/david.jpg";         // was: 1773178886822_IMG_2962.JPG

// ─── CONTACT FORM ────────────────────────────────────────────────────────────
// Contact form submissions go to /api/contact (Vercel serverless function).
// Set CONTACT_GMAIL and CONTACT_GMAIL_APP_PASSWORD in Vercel env vars.
const GOOGLE_CLIENT_ID    = "708565807163-uu8teuc876ufboujut8vhdo34ro27v8s.apps.googleusercontent.com";
const MICROSOFT_CLIENT_ID = "87bf204b-1326-4fa8-a616-3d5088714a4a";
const YAHOO_CLIENT_ID     = "dj0yJmk9dEVscml2TzNha0JVJmQ9WVdrOU5XOWFUMG95WjBNbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTUy";


// ─── THEME ───────────────────────────────────────────────────────────────────
const G = "#1a3c34", Y = "#c0c0c0";

// ── Event tracking ─────────────────────────────────────────────────────────────
function trackEvent(eventName, eventData) {
  try {
    let sid = sessionStorage.getItem("_dm_sid");
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("_dm_sid", sid); }
    fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "event", eventName, page: window.location.pathname || "/", sessionId: sid, ...(eventData ? { eventData } : {}) }),
    }).catch(() => {});
  } catch {}
}

// ── Admin token fetch helper — automatically includes x-admin-token header ────
function adminFetch(url, options={}) {
  const token = sessionStorage.getItem('dm_admin_token') || localStorage.getItem('dm_admin_token_store') || '';
  return fetch(url, {
    ...options,
    headers: { 'Content-Type':'application/json', ...(options.headers||{}), 'x-admin-token': token },
  });
}

const inp = { padding:"11px 14px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:"1rem", outline:"none", background:"#fafafa", width:"100%", boxSizing:"border-box", marginBottom:12 };
const lbl = { fontSize:"0.78rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5, display:"block" };

// ─── SCHEDULING DATA ─────────────────────────────────────────────────────────
const STANFORD_BLOCKS = { 2:{start:16*60,end:17*60+30}, 3:{start:12*60,end:13*60+30}, 5:{start:9*60+30,end:11*60} };
const PICKUP = {};
const KNOWN_LOCATIONS = [
  "Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063",
  "60 Middlefield Rd, Atherton, CA 94027",
  "250 Austin Ave, Atherton, CA 94027",
  "438 Addison Ave, Palo Alto, CA 94301",
  "Flood Park, 215 Bay Rd, Menlo Park, CA 94025",
  "Kelly Park, 100 Terminal Ave, Menlo Park, CA 94025",
  "Mitchell Park, 600 E Meadow Dr, Palo Alto, CA 94303",
  "Nealon Park, 800 Middle Ave, Menlo Park, CA 94025",
];
const FOCUS_AREAS = ["Dinking & kitchen game","Third shot drops","Third shot drives","Resets & soft game","Speed-ups & hands battles","Serve & return","Volleys & net play","Footwork & movement","Transition game","Overhead smash","Singles strategy","Doubles strategy","Tennis-to-pickleball transition"];

// ─── BRANDS ──────────────────────────────────────────────────────────────────
const BRANDS = [
  { id:"crbn",    name:"CRBN Pickleball",    tagline:"Coach David's #1 Recommended Paddle",  description:"As a CRBN Ambassador, Coach David uses and trusts CRBN paddles at every level of play — from training sessions to 5.0+ tournament competition. Use his code for a discount on your next order.", code:"DMPICKLEBALL", deal:"Discount off your order", link:"https://crbnpickleball.com",   logo:LOGO_CRBN,    logoBg:"#000000", logoPad:"20px 28px", shopBg:"#000000", shopColor:"white", codeColor:"#ffffff", codeBg:"#1a1a1a", codeText:"#9ca3af" },
  { id:"vatic",   name:"Vatic Pro",           tagline:"High Performance at Every Level", description:"Vatic Pro paddles deliver exceptional feel and control for players serious about improving their game. Trusted by competitive players across all skill levels.",                            code:"DMPICKLEBALL", deal:"Discount off your order", link:"https://vaticpro.com",         logo:LOGO_VATIC,   logoBg:"#ffffff", logoPad:"16px 24px", shopBg:"#e85d04", shopColor:"white", codeColor:"#e85d04", codeBg:"#fff5f0", codeText:"#9ca3af" },
  { id:"sixzero", name:"Six Zero Pickleball", tagline:"Engineered for Competitive Play", description:"Six Zero paddles are built for players who want precision, power, and consistency in every shot. A go-to brand for serious competitors on the court.",                                   code:"DAVIDMUK10",   deal:"10% off your order",      link:"https://sixzero.co",          logo:LOGO_SIXZERO, logoBg:"#ffffff", logoPad:"20px 24px", shopBg:"#111111", shopColor:"white", codeColor:"#111111", codeBg:"#f5f5f5", codeText:"#9ca3af" },
  { id:"engage",  name:"Engage Pickleball",   tagline:"Engage. Believe. Perform.",       description:"Coach David is a signed Teaching Pro with Engage Pickleball. Use his code to get a discount on their full lineup of paddles and gear.",                                                         code:"20MOK",        deal:"20% off your order",      link:"https://engagepickleball.com", logo:LOGO_ENGAGE,  logoBg:"#ffffff", logoPad:"16px 24px", shopBg:"#111111", shopColor:"white", codeColor:"#cc0000", codeBg:"#f9f9f9", codeText:"#9ca3af" },
];

const BAG_ITEMS = [
  { id:"paddle", label:"Current Paddle", name:"CRBN² Barrage", detail:"TruFoam Core · Carbon Fiber Face", icon:"🎾", link:"https://crbnpickleball.com" },
  { id:"bag",    label:"Current Bag",    name:"CRBN Tour Bag", detail:"Pear Colorway",                    icon:"🎒", link:"https://crbnpickleball.com" },
];

const PADDLE_HISTORY = [
  { name:"CRBN² Genesis", from:"Jan 2025", to:"Aug 2025", current:false },
  { name:"CRBN² Waves",   from:"Sep 2025", to:"Feb 2026", current:false },
  { name:"CRBN² Barrage", from:"Mar 2026", to:"Present",  current:true  },
];

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "david@dmpickleball.com";
const PARTNER_EMAILS = ["amandale91@gmail.com", "david@dmpickleball.com"];

const INIT_PENDING = [];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function toDS(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function toTimeStrGlobal(s,e){const fmt=m=>{const h=Math.floor(m/60),mn=m%60,ampm=h>=12?"pm":"am",hr=h>12?h-12:h||12;return hr+(mn>0?":"+String(mn).padStart(2,"0"):"")+ampm;};return fmt(s)+" - "+fmt(e);}
// Capitalize first letter of each word — applied to all name inputs
const capWords=s=>(s||"").replace(/\b\w/g,c=>c.toUpperCase());
// Generate a human-readable lesson ticket: PB-MMDD-XXXX
function generateTicket(){const n=new Date();const mmdd=String(n.getMonth()+1).padStart(2,"0")+String(n.getDate()).padStart(2,"0");const rand=Math.random().toString(36).slice(2,6).toUpperCase();return"PB-"+mmdd+"-"+rand;}
// Generate branded HTML email — calLink is optional (renders as a button if provided)
function makeCancelEmailHtml(text){
  const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const lines=text.split('\n');
  const refLine=lines.find(l=>/^Ref: PB-/.test(l))||'';
  const refNum=refLine?refLine.replace('Ref: ',''):'';
  const rows=lines.map(line=>{
    if(!line.trim())return'<div style="height:8px"></div>';
    if(/^Ref: PB-/.test(line))return'';
    const ci=line.indexOf(': ');
    if(ci>0&&ci<22&&!/^(Hi |See |David |Your |You |New |If |A )/.test(line)){const lbl=esc(line.slice(0,ci));const val=esc(line.slice(ci+2));return`<div style="padding:3px 0;"><span style="color:#6b7280;font-weight:700;display:inline-block;min-width:90px;">${lbl}:</span> <span style="color:#1a1a1a;">${val}</span></div>`;}
    return`<div style="padding:2px 0;color:#374151;">${esc(line)}</div>`;
  }).join('');
  return`<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#fff5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
  <div style="background:#991b1b;padding:18px 28px;text-align:center;"><img src="https://dmpickleball.com/DMPBlogo-white.png" alt="DM Pickleball" height="36" width="auto" style="height:36px;max-height:36px;width:auto;max-width:220px;display:block;margin:0 auto;border:0;" /><div style="color:rgba(255,255,255,0.85);font-weight:700;font-size:0.95rem;margin-top:8px;">Lesson Cancelled</div></div>
  <div style="padding:28px 32px;">${rows}<div style="margin-top:22px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:0.75rem;color:#9ca3af;">DM Pickleball · <a href="https://dmpickleball.com" style="color:#991b1b;text-decoration:none;">dmpickleball.com</a>${refNum?' · <span style="font-family:monospace;">'+refNum+'</span>':''}</div></div>
</div></body></html>`;
}
function makeEmailHtml(text,calLink){
  const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const lines=text.split('\n');
  const refLine=lines.find(l=>/^Ref: PB-/.test(l))||'';
  const refNum=refLine?refLine.replace('Ref: ',''):'';
  const rows=lines.map(line=>{
    if(!line.trim())return'<div style="height:8px"></div>';
    if(/^Ref: PB-/.test(line))return'';
    const ci=line.indexOf(': ');
    if(ci>0&&ci<22&&!/^(Hi |See |David |Your |You |New )/.test(line)){const lbl=esc(line.slice(0,ci));const val=esc(line.slice(ci+2));return`<div style="padding:3px 0;"><span style="color:#6b7280;font-weight:700;display:inline-block;min-width:70px;">${lbl}:</span> <span style="color:#1a1a1a;">${val}</span></div>`;}
    return`<div style="padding:2px 0;color:#374151;">${esc(line)}</div>`;
  }).join('');
  const btn=calLink?`<div style="margin:24px 0;"><a href="${calLink}" style="display:inline-block;background:#1a3c34;color:white;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.88rem;">Add to Google Calendar</a></div>`:'';
  return`<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f4f9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
  <div style="background:#1a3c34;padding:18px 28px;text-align:center;"><img src="https://dmpickleball.com/DMPBlogo-white.png" alt="DM Pickleball" height="36" width="auto" style="height:36px;max-height:36px;width:auto;max-width:220px;display:block;margin:0 auto;border:0;" /></div>
  <div style="padding:28px 32px;">${rows}${btn}<div style="margin-top:22px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:0.75rem;color:#9ca3af;">DM Pickleball · <a href="https://dmpickleball.com" style="color:#1a3c34;text-decoration:none;">dmpickleball.com</a>${refNum?' · <span style="font-family:monospace;">'+refNum+'</span>':''}</div></div>
</div></body></html>`;
}
const NOW = new Date();
const INIT_LESSONS = {
  "student@email.com":[
    {id:1,date:toDS(addDays(NOW,5)), time:"10:00 AM – 11:00 AM",type:"Private",duration:"60 min",status:"confirmed",focus:"Dinking & kitchen game",notes:"",photos:[],videos:[]},
    {id:2,date:toDS(addDays(NOW,12)),time:"9:00 AM – 10:30 AM", type:"Private",duration:"90 min",status:"pending",  focus:"Third shot drops",       notes:"",photos:[],videos:[]},
    {id:3,date:toDS(addDays(NOW,-7)),time:"10:00 AM – 11:00 AM",type:"Private",duration:"60 min",status:"completed",focus:"Volleys & net play",       notes:"Great progress on your backhand dink! Focus on keeping your paddle face open and staying low.",photos:["🖼️","🖼️"],videos:["🎬"]},
    {id:4,date:toDS(addDays(NOW,-14)),time:"9:00 AM – 10:00 AM",type:"Private",duration:"60 min",status:"completed",focus:"Third shot drops",         notes:"Worked on third shot drops and transition movement. You're rushing the reset — slow down.",photos:["🖼️"],videos:["🎬","🎬"]},
    {id:5,date:toDS(addDays(NOW,-28)),time:"2:00 PM – 3:00 PM", type:"Group", duration:"60 min",status:"completed",focus:"Footwork & movement",       notes:"First session — assessed fundamentals. Strong tennis background showing.",photos:[],videos:["🎬"]},
  ],
  "menlo@email.com":[
    {id:1,date:toDS(addDays(NOW,5)), time:"8:00 AM – 9:00 AM",type:"Private",duration:"60 min",status:"confirmed",focus:"Serve & return", notes:"",photos:[],videos:[]},
    {id:2,date:toDS(addDays(NOW,-7)),time:"8:00 AM – 9:00 AM",type:"Private",duration:"60 min",status:"completed",focus:"Overhead smash", notes:"Excellent session! Net game really coming together.",photos:["🖼️","🖼️"],videos:["🎬"]},
  ]
};

function fmt(m){const h=Math.floor(m/60),min=m%60;return `${h>12?h-12:h===0?12:h}:${min.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;}
function fmtDate(s){return new Date(s+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});}
function fmtDateShort(s){return new Date(s+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
function getSlots(dateStr,memberType,duration){
  if(!dateStr)return[];
  const dow=new Date(dateStr+"T12:00:00").getDay();
  if(dow===0)return[];
  if(memberType==="menlo"&&dow===6)return[];
  const sb=STANFORD_BLOCKS[dow],fridayMorning=dow===5?{start:7*60+30,end:9*60}:null,slots=[];
  const maxStart=dow===6?10*60:16*60;const _now=new Date();const _todayStr=_now.getFullYear()+"-"+String(_now.getMonth()+1).padStart(2,"0")+"-"+String(_now.getDate()).padStart(2,"0");const isToday=dateStr===_todayStr;const nowMins=_now.getHours()*60+_now.getMinutes();const minStart=isToday?nowMins+180:0;for(let s=8*60;s<=maxStart;s+=30){
    if(isToday&&s<minStart)continue;
    const e=s+duration;
    if(sb&&s<sb.end&&e>sb.start)continue;
    if(fridayMorning&&s<fridayMorning.end&&e>fridayMorning.start)continue;
    
    
    slots.push({s,e});
  }
  return slots;
}
function getLessonStart(dateStr,timeStr){
  const startStr=timeStr.split("–")[0].trim();
  const[time,ampm]=startStr.split(" ");
  let[h,m]=time.split(":").map(Number);
  if(ampm==="PM"&&h!==12)h+=12;
  if(ampm==="AM"&&h===12)h=0;
  const d=new Date(dateStr+"T12:00:00");
  d.setHours(h,m,0,0);return d;
}
function getCancelDeadline(ds,ts){return new Date(getLessonStart(ds,ts).getTime()-12*60*60*1000);}
function fmtDeadline(d){return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+" at "+d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});}
function canCancel(ds,ts,bookedAt){
  const now=new Date();
  const deadline=getCancelDeadline(ds,ts);
  if(now<deadline)return true;
  // 15 min grace period if booked less than 15 mins ago
  if(bookedAt){const bookedTime=new Date(bookedAt);const minsAgo=(now-bookedTime)/60000;if(minsAgo<15)return true;}
  return false;
}
function isPast(ds,ts){return new Date()>getLessonStart(ds,ts);}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function IosSwitch({on,onClick,label}){
  return(
    <button type="button" onClick={e=>{e.stopPropagation();onClick&&onClick();}} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",userSelect:"none",background:"none",border:"none",padding:0,font:"inherit"}}>
      <div style={{width:36,height:20,borderRadius:10,background:on?G:"#d1d5db",position:"relative",transition:"background 0.2s",flexShrink:0}}>
        <div style={{position:"absolute",top:2,left:on?16:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
      </div>
      <span style={{fontSize:"0.78rem",fontWeight:600,color:on?"#374151":"#9ca3af",whiteSpace:"nowrap"}}>{label}</span>
    </button>
  );
}

function DelBtn({onClick,children,style:extraStyle}){
  const[hov,setHov]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"white",color:hov?"#dc2626":"#6b7280",border:"1.5px solid "+(hov?"#fca5a5":"#e5e7eb"),padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:"0.8rem",fontWeight:500,display:"inline-flex",alignItems:"center",gap:5,transition:"all 0.15s",...extraStyle}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
      {children}
    </button>
  );
}

function CopyButton({code}){
  const[copied,setCopied]=useState(false);
  return(
    <button onClick={()=>{navigator.clipboard.writeText(code).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);}}
      style={{background:copied?"#e8f0ee":"white",color:copied?G:"#374151",border:`1.5px solid ${copied?G:"#e5e7eb"}`,padding:"7px 16px",borderRadius:8,cursor:"pointer",fontSize:"0.82rem",fontWeight:700,whiteSpace:"nowrap",transition:"all 0.2s"}}>
      {copied?"✓ Copied!":"Copy Code"}
    </button>
  );
}

function CalendarPicker({value,onChange,memberType,fullyBookedDays=new Set(),slotCounts=new Map()}){
  const today=new Date();today.setHours(0,0,0,0);
  const maxDate=new Date(today);maxDate.setDate(today.getDate()+30);
  const[viewing,setViewing]=useState({year:today.getFullYear(),month:today.getMonth()});
  const{year,month}=viewing;
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=new Date(year,month).toLocaleString("default",{month:"long",year:"numeric"});
  const prevYear=month===0?year-1:year, prevMonth=month===0?11:month-1;
  const nextYear=month===11?year+1:year, nextMonth=month===11?0:month+1;
  const prevMonthLastDay=new Date(prevYear,prevMonth+1,0).getDate();
  const totalCells=Math.ceil((firstDay+daysInMonth)/7)*7;
  const trailingCount=totalCells-firstDay-daysInMonth;

  const dsForDate=(y,m,d)=>{const dt=new Date(y,m,d);return`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;};
  const isDateDisabled=(y,m,d)=>{const dt=new Date(y,m,d);dt.setHours(0,0,0,0);if(dt<today||dt>maxDate)return true;const dow=dt.getDay();if(dow===0)return true;if(memberType==="menlo"&&dow===6)return true;return false;};
  const isToday=day=>{const d=new Date(year,month,day);d.setHours(0,0,0,0);return d.getTime()===today.getTime();};

  // Navigate to a different month; clear selected date if it's not in the new month
  const changeMonth=(ny,nm)=>{
    if(value){const v=new Date(value+"T12:00:00");if(v.getFullYear()!==ny||v.getMonth()!==nm)onChange('');}
    setViewing({year:ny,month:nm});
  };

  // Build all 35 or 42 grid cells: leading prev-month, current month, trailing next-month
  const cells=[
    ...Array.from({length:firstDay},(_,i)=>({y:prevYear,m:prevMonth,d:prevMonthLastDay-firstDay+1+i,other:true})),
    ...Array.from({length:daysInMonth},(_,i)=>({y:year,m:month,d:i+1,other:false})),
    ...Array.from({length:trailingCount},(_,i)=>({y:nextYear,m:nextMonth,d:i+1,other:true})),
  ];

  return(
    <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden",userSelect:"none"}}>
      <div style={{background:G,color:"white",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>changeMonth(prevYear,prevMonth)} style={{background:"none",border:"none",color:"white",fontSize:"1.3rem",cursor:"pointer",padding:"0 8px"}}>‹</button>
        <span style={{fontWeight:700,fontSize:"0.95rem"}}>{monthName}</span>
        <button onClick={()=>changeMonth(nextYear,nextMonth)} style={{background:"none",border:"none",color:"white",fontSize:"1.3rem",cursor:"pointer",padding:"0 8px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#e8f0ee"}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:"0.75rem",fontWeight:700,color:G}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"6px"}}>
        {cells.map((cell,idx)=>{
          const{y,m,d,other}=cell;
          const ds=dsForDate(y,m,d);
          const disabled=isDateDisabled(y,m,d);
          const booked=!disabled&&fullyBookedDays.has(ds);
          const unavailable=disabled||booked;
          const selected=!!value&&(()=>{const v=new Date(value+"T12:00:00");return v.getFullYear()===y&&v.getMonth()===m&&v.getDate()===d;})();
          const tod=!other&&isToday(d);
          const count=!unavailable?slotCounts.get(ds):undefined;
          const handleClick=()=>{
            if(other){
              // Switch month; select the day if it's available
              setViewing({year:y,month:m});
              if(!unavailable)onChange(ds); else onChange('');
            } else {
              if(!unavailable)onChange(ds);
            }
          };
          return(
            <div key={idx} onClick={handleClick}
              style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",borderRadius:8,margin:"2px",height:44,
                cursor:unavailable?"default":"pointer",
                background:selected?G:"transparent",
                color:selected?"white":unavailable?"#d1d5db":other?"#9ca3af":"#1a1a1a",
                fontWeight:tod&&!unavailable||selected?700:400,fontSize:"0.88rem",
                border:tod&&!selected&&!unavailable?`2px solid ${G}`:"2px solid transparent",
                opacity:unavailable?0.4:other?0.55:1,transition:"all 0.15s",
              }}>
              <span>{d}</span>
              {count!=null&&<span style={{fontSize:"0.6rem",lineHeight:1.2,marginTop:1,fontWeight:500,color:selected?"rgba(255,255,255,0.8)":G}}>{count} open</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPhone(p){
  const d=(p||"").replace(/\D/g,"");
  if(d.length===10)return "("+d.slice(0,3)+") "+d.slice(3,6)+"-"+d.slice(6);
  if(d.length===11)return "+"+d[0]+" ("+d.slice(1,4)+") "+d.slice(4,7)+"-"+d.slice(7);
  return p;
}
function formatPhoneInput(raw){
  const d=raw.replace(/\D/g,"").slice(0,10);
  if(d.length<4)return d;
  if(d.length<7)return "("+d.slice(0,3)+") "+d.slice(3);
  return "("+d.slice(0,3)+") "+d.slice(3,6)+"-"+d.slice(6);
}
function LocationInput({value, onChange, placeholder, style}){
  const[query,setQuery]=useState(value||"");
  const[suggestions,setSuggestions]=useState([]);
  const[showDropdown,setShowDropdown]=useState(false);
  const[loading,setLoading]=useState(false);
  const timerRef=useRef(null);

  useEffect(()=>{setQuery(value||"");},[value]);

  const handleChange=(e)=>{
    const v=e.target.value;
    setQuery(v);
    onChange(v,null);
    if(timerRef.current)clearTimeout(timerRef.current);
    if(v.length<2){setSuggestions([]);setShowDropdown(false);return;}
    timerRef.current=setTimeout(async()=>{
      setLoading(true);
      try{
        const r=await fetch("/api/places-search?query="+encodeURIComponent(v));
        const data=await r.json();
        setSuggestions(data.suggestions||[]);
        setShowDropdown(true);
      }catch(e){setSuggestions([]);}
      setLoading(false);
    },400);
  };

  const handleSelect=(s)=>{
    const val=s.name&&s.address&&!s.address.startsWith(s.name)?s.name+", "+s.address:s.address||s.name;
    setQuery(val);
    onChange(val,s);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return(
    <div style={{position:"relative"}}>
      <input
        value={query}
        onChange={handleChange}
        onBlur={()=>setTimeout(()=>setShowDropdown(false),200)}
        onFocus={()=>suggestions.length>0&&setShowDropdown(true)}
        placeholder={placeholder||"Search for a location..."}
        style={{...style,marginBottom:0}}
      />
      {loading&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:"0.75rem",color:"#9ca3af"}}>...</div>}
      {showDropdown&&suggestions.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:1000,overflow:"hidden"}}>
          {suggestions.map((s,i)=>(
            <div key={i} onMouseDown={()=>handleSelect(s)} style={{padding:"10px 14px",cursor:"pointer",borderBottom:i<suggestions.length-1?"1px solid #f3f4f6":"none",fontSize:"0.88rem"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f9f9f6"}
              onMouseLeave={e=>e.currentTarget.style.background="white"}>
              <div style={{fontWeight:600}}>{s.name}</div>
              <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:1}}>{s.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Nav({user,onLogin,onLogout,setPage,currentPage}){
  const onAdminRoute=window.location.pathname==="/admin";
  const goHome=()=>{if(onAdminRoute){window.location.href="/";}else{setPage("home");setMenuOpen(false);}};
  const [mob,setMob]=useState(window.innerWidth<=768);
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{
    const h=()=>{setMob(window.innerWidth<=768);setMenuOpen(false);};
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);
  const links=[["pricing","Rates"],["gear","Paddle/Gear"],["resources","Watch/Links"],["contact","Contact"]];
  const navTo=(p)=>{setPage(p);setMenuOpen(false);};
  if(mob){
    return(
      <>
        <style>{`
          @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
          @keyframes fadeInBg{from{opacity:0}to{opacity:1}}
          .mob-nav-item{transition:opacity 0.15s,background 0.15s;}
          .mob-nav-item:active{opacity:0.6;}
        `}</style>
        <nav style={{background:G,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:300}}>
          <div onClick={goHome} style={{cursor:"pointer"}}>
            <img src="/DMPBlogo-white.png" alt="DMPB" style={{height:28,width:"auto",display:"block"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {!user&&(
              <button onClick={()=>{setMenuOpen(false);onLogin();}} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",color:"white",padding:"7px 18px",borderRadius:50,fontWeight:600,cursor:"pointer",fontSize:"0.85rem",letterSpacing:"0.2px"}}>Login</button>
            )}
            <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:"6px",lineHeight:0,borderRadius:8}}>
              {menuOpen
                ?<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                :<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>
        </nav>
        {menuOpen&&(
          <div style={{position:"fixed",inset:0,zIndex:299,animation:"fadeInBg 0.2s ease"}}>
            {/* Backdrop */}
            <div onClick={()=>setMenuOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)"}}/>
            {/* Slide-in panel — translucent green */}
            <div style={{position:"absolute",top:0,right:0,bottom:0,width:"68%",maxWidth:280,background:"rgba(26,60,52,0.82)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:"-8px 0 40px rgba(0,0,0,0.25)",animation:"slideInRight 0.25s cubic-bezier(0.32,0.72,0,1)",display:"flex",flexDirection:"column"}}>
              {/* Panel header */}
              <div style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"flex-end",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                <button onClick={()=>setMenuOpen(false)} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:50,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {/* Nav links */}
              <div style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
                {links.map(([p,label])=>(
                  <div key={p} className="mob-nav-item" onClick={()=>navTo(p)}
                    style={{padding:"16px 24px",fontSize:"1rem",cursor:"pointer",color:"white",fontWeight:currentPage===p?700:400,opacity:currentPage===p?1:0.8,background:currentPage===p?"rgba(255,255,255,0.1)":"transparent",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {label}
                    {currentPage===p&&<span style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.7)",display:"inline-block"}}/>}
                  </div>
                ))}
                {user&&(
                  <>
                    <div style={{height:1,background:"rgba(255,255,255,0.08)",margin:"6px 24px"}}/>
                    <div className="mob-nav-item" onClick={()=>navTo("dashboard")} style={{padding:"16px 24px",fontSize:"1rem",cursor:"pointer",color:"white",fontWeight:currentPage==="dashboard"?700:400,opacity:currentPage==="dashboard"?1:0.8,background:currentPage==="dashboard"?"rgba(255,255,255,0.1)":"transparent",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      My Lessons
                      {currentPage==="dashboard"&&<span style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.7)",display:"inline-block"}}/>}
                    </div>
                    <div className="mob-nav-item" onClick={()=>navTo("booking")} style={{padding:"16px 24px",fontSize:"1rem",cursor:"pointer",color:"white",fontWeight:400,opacity:0.8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      Book a Lesson
                    </div>
                    <div style={{height:1,background:"rgba(255,255,255,0.08)",margin:"6px 24px"}}/>
                    <div className="mob-nav-item" onClick={()=>{onLogout();setMenuOpen(false);}} style={{padding:"16px 24px",fontSize:"0.9rem",cursor:"pointer",color:"rgba(255,255,255,0.45)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      Log out
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  return(
    <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200}}>
      <div onClick={goHome} style={{cursor:"pointer",display:"flex",alignItems:"center"}}>
        <img src="/DMPBlogo-white.png" alt="DMPB" style={{height:34,width:"auto",display:"block"}}/>
      </div>
      <div style={{display:"flex",gap:20,alignItems:"center"}}>
        {links.map(([p,label])=>(
          <span key={p} onClick={()=>setPage(p)} style={{color:"white",cursor:"pointer",opacity:currentPage===p?1:0.7,fontWeight:currentPage===p?700:400,fontSize:"0.92rem",whiteSpace:"nowrap"}}>{label}</span>
        ))}
        {user?(
          <>
            <span onClick={()=>setPage("dashboard")} style={{color:Y,cursor:"pointer",fontWeight:700,fontSize:"0.92rem",whiteSpace:"nowrap"}}>My Lessons</span>
            <span onClick={()=>setPage("account")} title="Account Settings" style={{color:"white",cursor:"pointer",opacity:currentPage==="account"?1:0.7,lineHeight:1,display:"inline-flex",alignItems:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
            <span onClick={()=>{trackEvent("nav_book_click");setPage("booking");}} style={{background:"rgba(255,255,255,0.15)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.92rem",whiteSpace:"nowrap"}}>Book</span>
            <button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.4)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem"}}>Log out</button>
          </>
        ):(
          <button onClick={()=>{trackEvent("nav_login_click");onLogin();}} style={{background:Y,color:G,border:"none",padding:"8px 20px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.92rem",whiteSpace:"nowrap"}}>Login</button>
        )}
      </div>
    </nav>
  );
}

function fmtParticipantName(fullName){
  if(!fullName)return"";
  const p=fullName.trim().split(/\s+/);
  const first=p[0]||"";
  const last=p.length>1?p[p.length-1]:"";
  return last?first+" "+last[0].toUpperCase()+".":first;
}
function LessonModal({lesson,isMenlo,onClose,onCancel}){
  const isCancelled=["cancelled","late_cancel","cancelled_forgiven","weather_cancel","no_show"].includes(lesson.status);
  const cancellable=!isCancelled&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const withinGrace=!isCancelled&&!canCancel(lesson.date,lesson.time)&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const closed=!isCancelled&&!cancellable&&!withinGrace;
  const deadline=!isCancelled?getCancelDeadline(lesson.date,lesson.time):null;
  const[confirmCancel,setConfirmCancel]=useState(false);
  const[cancelling,setCancelling]=useState(false);
  const location=isMenlo?"Menlo Circus Club, 190 Park Ln, Atherton":"Andrew Spinas Park, Redwood City";
  const dateObj=new Date(lesson.date+"T12:00:00");
  const statusMap={
    confirmed:{bg:"#e8f0ee",color:G,label:"✓ Confirmed"},
    pending:{bg:"#fffbea",color:"#92400e",label:"⏳ Pending"},
    completed:{bg:"#e8f0ee",color:G,label:"✓ Completed"},
    cancelled:{bg:"#fef2f2",color:"#dc2626",label:"✕ Cancelled"},
    late_cancel:{bg:"#fff7ed",color:"#c2410c",label:"⚠️ Late Cancel"},
    no_show:{bg:"#fef2f2",color:"#7f1d1d",label:"✕ No-Show"},
    weather_cancel:{bg:"#eff6ff",color:"#1d4ed8",label:"🌧 Weather Cancel"},
    cancelled_forgiven:{bg:"#f3f4f6",color:"#6b7280",label:"✓ Cancelled (forgiven)"},
  };
  const st=statusMap[lesson.status]||{bg:"#f3f4f6",color:"#6b7280",label:lesson.status};
  const participants=(lesson.members||[]).filter(Boolean);
  const detailRows=[
    ["›","Date & Time",dateObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})+" · "+lesson.time],
    ["›","Coach","David Mok"],
    ["›","Location",location],
    ...(lesson.focus?[["›","Focus / Drill",lesson.focus]]:[]),
    ...(lesson.notes?[["›","Coaching Notes",lesson.notes]]:[]),
  ];
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,backdropFilter:"blur(3px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:16,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{background:G,color:"white",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderRadius:"16px 16px 0 0"}}>
          <div>
            <div style={{fontWeight:900,fontSize:"1.15rem"}}>{lesson.type} · {lesson.duration}</div>
            <div style={{fontSize:"0.85rem",opacity:0.8,marginTop:4}}>{dateObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"white",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1rem",lineHeight:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"14px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <span style={{background:st.bg,color:st.color,padding:"4px 12px",borderRadius:50,fontSize:"0.82rem",fontWeight:700}}>{st.label}</span>
          {lesson.ticketId&&<span style={{background:"#f3f4f6",color:"#374151",padding:"4px 12px",borderRadius:50,fontSize:"0.78rem",fontWeight:700,fontFamily:"monospace",letterSpacing:"0.5px"}}>{lesson.ticketId}</span>}
          {!isCancelled&&deadline&&(
            <span style={{fontSize:"0.78rem",color:withinGrace?"#92400e":cancellable?"#6b7280":"#dc2626",background:withinGrace?"#fffbea":cancellable?"#f9f9f6":"#fef2f2",padding:"3px 10px",borderRadius:50,border:`1px solid ${withinGrace?"#f4c430":cancellable?"#e5e7eb":"#fca5a5"}`}}>
              {withinGrace?"⚠️ Cancel within 15 min":cancellable?"Cancel by: "+fmtDeadline(deadline):"Cancellation closed"}
            </span>
          )}
        </div>
        <div style={{padding:"18px 24px"}}>
          {detailRows.map(([icon,label,val])=>(
            <div key={label} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
              <span style={{fontSize:"1rem",lineHeight:"1.4",flexShrink:0,width:20,textAlign:"center",color:G,fontWeight:700}}>{icon}</span>
              <div>
                <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{label}</div>
                <div style={{fontSize:"0.9rem",color:"#374151",lineHeight:1.5}}>{val}</div>
              </div>
            </div>
          ))}
          {participants.length>0&&(
            <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
              <span style={{fontSize:"1rem",lineHeight:"1.4",flexShrink:0,width:20,textAlign:"center",color:G,fontWeight:700}}>›</span>
              <div>
                <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Participants</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {participants.map((p,i)=><span key={i} style={{background:"#f0faf5",color:G,padding:"3px 10px",borderRadius:50,fontSize:"0.82rem",fontWeight:600}}>{p}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>
        {!isCancelled&&(
          <div style={{padding:"0 24px 24px"}}>
            {confirmCancel?(
              <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:10,padding:"16px"}}>
                <div style={{fontWeight:700,color:"#991b1b",marginBottom:6,fontSize:"0.9rem"}}>Cancel this lesson?</div>
                <div style={{fontSize:"0.83rem",color:"#7f1d1d",marginBottom:12}}>{lesson.type} on {fmtDateShort(lesson.date)} at {lesson.time.split("–")[0].trim()}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setConfirmCancel(false)} disabled={cancelling} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"9px",borderRadius:50,cursor:cancelling?"not-allowed":"pointer",fontSize:"0.85rem",fontWeight:600,opacity:cancelling?0.5:1}}>Keep it</button>
                  <button onClick={async()=>{setCancelling(true);await onCancel(lesson.id);onClose();}} disabled={cancelling} style={{flex:1,background:"#dc2626",color:"white",border:"none",padding:"9px",borderRadius:50,cursor:cancelling?"not-allowed":"pointer",fontSize:"0.85rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {cancelling?<><span style={{display:"inline-block",width:12,height:12,border:"2px solid white",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Cancelling...</>:"Yes, Cancel"}
                  </button>
                </div>
              </div>
            ):(
              <button onClick={()=>{if(!closed)setConfirmCancel(true);}} style={{width:"100%",background:closed?"#f3f4f6":"#fef2f2",color:closed?"#9ca3af":"#dc2626",border:`1.5px solid ${closed?"#e5e7eb":"#fca5a5"}`,padding:"11px",borderRadius:50,fontSize:"0.88rem",fontWeight:600,cursor:closed?"not-allowed":"pointer"}}>
                {closed?"Cancellation Closed":"✕ Cancel This Lesson"}
              </button>
            )}
          </div>
        )}
        {(lesson.status==="late_cancel"||lesson.status==="no_show")&&(()=>{
          const rawPrice=lesson.customPrice!=null?lesson.customPrice:({"Private":{60:120,90:180},"Semi-Private":{60:140,90:210},"Group Lesson":{60:140,90:210},"Group":{60:140,90:210}}[lesson.type]||{})[parseInt(lesson.duration)]||120;
          const isNoShow=lesson.status==="no_show";
          const fee=isNoShow?rawPrice:Math.round(rawPrice*0.5);
          const pct=isNoShow?"100%":"50%";
          const note=encodeURIComponent((isNoShow?"No-show fee":"Late cancellation fee")+" — lesson on "+fmtDateShort(lesson.date));
          const venmoUrl="https://venmo.com/"+VENMO+"?txn=pay&amount="+fee+"&note="+note;
          return(
            <div style={{padding:"0 24px 24px"}}>
              <div style={{background:isNoShow?"#fef2f2":"#fff7ed",border:"1.5px solid "+(isNoShow?"#fca5a5":"#fb923c"),borderRadius:12,padding:"18px 20px"}}>
                <div style={{fontWeight:800,color:isNoShow?"#991b1b":"#c2410c",fontSize:"0.92rem",marginBottom:4}}>{isNoShow?"✕ No-Show Fee":"⚠️ Late Cancellation Fee"}</div>
                <div style={{fontSize:"0.83rem",color:isNoShow?"#7f1d1d":"#7c2d12",lineHeight:1.7,marginBottom:14}}>
                  {isNoShow?"This lesson was not attended without notice.":"This lesson was cancelled after the 12-hour window."} Per our policy, a fee of <strong>${fee}</strong> ({pct} of ${rawPrice}) is owed.
                </div>
                <a href={venmoUrl} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#3d95ce",color:"white",padding:"11px 20px",borderRadius:50,fontWeight:700,textDecoration:"none",fontSize:"0.9rem"}}>
                  Pay ${fee} via Venmo →
                </a>
                <div style={{fontSize:"0.75rem",color:"#9ca3af",textAlign:"center",marginTop:8}}>@{VENMO} · amount pre-filled in the Venmo app</div>
              </div>
            </div>
          );
        })()}
      {lesson.status==="weather_cancel"&&(
          <div style={{padding:"0 24px 24px"}}>
            <div style={{background:"#eff6ff",border:"1.5px solid #93c5fd",borderRadius:12,padding:"18px 20px"}}>
              <div style={{fontWeight:800,color:"#1d4ed8",fontSize:"0.92rem",marginBottom:4}}>🌧 Weather Cancellation</div>
              <div style={{fontSize:"0.83rem",color:"#1e3a5f",lineHeight:1.7}}>This lesson was cancelled due to inclement weather. No charge — Coach David will be in touch to reschedule.</div>
            </div>
          </div>
        )}
        {isCancelled&&lesson.notes&&(
          <div style={{padding:"0 24px 24px"}}>
            <div style={{...lbl,marginBottom:8}}>📝 Coaching Notes</div>
            <div style={{background:"#f9f9f6",borderRadius:8,padding:"14px 16px",fontSize:"0.9rem",color:"#374151",lineHeight:1.75}}>{lesson.notes}</div>
          </div>
        )}
      </div>
      {cancelling&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(255,255,255,0.88)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:10000,backdropFilter:"blur(4px)"}}>
          <div style={{width:48,height:48,border:"5px solid #e8f0ee",borderTop:"5px solid #1a3c34",borderRadius:"50%",animation:"spin 0.9s linear infinite",marginBottom:20}}/>
          <div style={{fontWeight:700,fontSize:"1.1rem",color:"#1a3c34"}}>Cancelling your lesson...</div>
          <div style={{fontSize:"0.88rem",color:"#6b7280",marginTop:8}}>Removing your calendar event, hang tight!</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
function LessonCard({lesson,isMenlo,isHistory,onCancel}){
  const[showModal,setShowModal]=useState(false);
  const isCancelled=["cancelled","late_cancel","cancelled_forgiven","weather_cancel","no_show"].includes(lesson.status);
  const cancellable=!isHistory&&!isCancelled&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const withinGrace=!isHistory&&!isCancelled&&!canCancel(lesson.date,lesson.time)&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const deadline=!isHistory&&!isCancelled?getCancelDeadline(lesson.date,lesson.time):null;
  const dateObj=new Date(lesson.date+"T12:00:00");
  return(
    <>
      {showModal&&<LessonModal lesson={lesson} isMenlo={!!isMenlo} onClose={()=>setShowModal(false)} onCancel={id=>{onCancel(id);setShowModal(false);}}/>}
      <div onClick={()=>setShowModal(true)}
        style={{background:"white",borderRadius:12,border:`1.5px solid ${isCancelled?"#fca5a5":"#e5e7eb"}`,marginBottom:12,cursor:"pointer",transition:"border-color 0.15s,box-shadow 0.15s",opacity:isCancelled?0.85:1,overflow:"hidden"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=isCancelled?"#fca5a5":G;e.currentTarget.style.boxShadow="0 2px 12px rgba(26,60,52,0.10)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=isCancelled?"#fca5a5":"#e5e7eb";e.currentTarget.style.boxShadow="none";}}>
        <div style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{background:isCancelled?"#fef2f2":"#e8f0ee",border:`1.5px solid ${isCancelled?"#fca5a5":G}`,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:56,flexShrink:0}}>
              <div style={{fontSize:"1.3rem",fontWeight:900,color:isCancelled?"#dc2626":G,lineHeight:1}}>{dateObj.getDate()}</div>
              <div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{dateObj.toLocaleString("default",{month:"short"})}</div>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:"0.97rem"}}>{lesson.type} · {lesson.duration}</div>
              <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>⏱ {lesson.time}</div>
              {lesson.focus&&<div style={{fontSize:"0.8rem",color:G,marginTop:3,fontWeight:600}}>{lesson.focus}</div>}
              <div style={{marginTop:5,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                {isCancelled?(
                  <span style={{background:lesson.status==="late_cancel"?"#fff7ed":lesson.status==="no_show"?"#fef2f2":lesson.status==="weather_cancel"?"#eff6ff":lesson.status==="cancelled_forgiven"?"#f3f4f6":"#fef2f2",color:lesson.status==="late_cancel"?"#c2410c":lesson.status==="no_show"?"#7f1d1d":lesson.status==="weather_cancel"?"#1d4ed8":lesson.status==="cancelled_forgiven"?"#6b7280":"#dc2626",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                    {lesson.status==="late_cancel"?"⚠️ Cancelled (late)":lesson.status==="no_show"?"✕ No-Show":lesson.status==="weather_cancel"?"🌧 Weather Cancel":lesson.status==="cancelled_forgiven"?"✓ Cancelled (forgiven)":lesson.cancelledByGcal?"📅 Removed from Calendar":"✕ Cancelled"}
                  </span>
                ):!isHistory&&(
                  <>
                    <span style={{background:lesson.status==="confirmed"?"#e8f0ee":"#fffbea",color:lesson.status==="confirmed"?G:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                      {lesson.status==="confirmed"?"✓ Confirmed":"⏳ Pending"}
                    </span>
                    {deadline&&(
                      <span style={{fontSize:"0.75rem",color:withinGrace?"#92400e":cancellable?"#6b7280":"#dc2626",background:withinGrace?"#fffbea":cancellable?"#f9f9f6":"#fef2f2",padding:"2px 10px",borderRadius:50,border:`1px solid ${withinGrace?"#f4c430":cancellable?"#e5e7eb":"#fca5a5"}`}}>
                        {withinGrace?"⚠️ Cancel within 15 min":cancellable?`Cancel by: ${fmtDeadline(deadline)}`:"⛔ Cancellation closed"}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0,marginLeft:8}}>
            <span style={{color:"#9ca3af",fontSize:"1.1rem"}}>›</span>
            {isHistory&&(lesson.notes||lesson.photos?.length>0||lesson.videos?.length>0)&&(
              <div style={{display:"flex",gap:4}}>
                {lesson.notes&&<span style={{background:"#e8f0ee",color:G,padding:"2px 8px",borderRadius:50,fontSize:"0.7rem",fontWeight:600}}>📝</span>}
                {lesson.photos?.length>0&&<span style={{background:"#e8f0ee",color:G,padding:"2px 8px",borderRadius:50,fontSize:"0.7rem",fontWeight:600}}>🖼 {lesson.photos.length}</span>}
                {lesson.videos?.length>0&&<span style={{background:"#e8f0ee",color:G,padding:"2px 8px",borderRadius:50,fontSize:"0.7rem",fontWeight:600}}>🎬 {lesson.videos.length}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Homepage({setPage}){
  const [mob,setMob]=useState(window.innerWidth<=768);
  useEffect(()=>{const h=()=>setMob(window.innerWidth<=768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return(
    <div>
      {/* ── Video Hero ── */}
      <div style={{position:"relative",color:"white",textAlign:"center",padding:mob?"72px 20px 56px":"110px 24px 90px",overflow:"hidden",minHeight:mob?420:520,display:"flex",alignItems:"center",justifyContent:"center",background:"#0a1f18"}}>
        <video autoPlay muted loop playsInline
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}}>
          <source src="/hero.m4v" type="video/mp4"/>
        </video>
        <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"linear-gradient(to bottom, rgba(0,20,14,0.70) 0%, rgba(0,20,14,0.55) 60%, rgba(0,20,14,0.75) 100%)",zIndex:1}}/>
        <div style={{position:"relative",zIndex:2,maxWidth:660,margin:"0 auto"}}>
          {!mob&&<div style={{fontSize:"0.8rem",letterSpacing:3,opacity:0.8,marginBottom:14,textTransform:"uppercase"}}>Pickleball Coaching · San Francisco Peninsula, Bay Area</div>}
          <h1 style={{fontSize:mob?"2rem":"3rem",fontWeight:900,lineHeight:1.15,marginBottom:mob?12:16}}>Coach David<br/><span style={{color:Y}}>SF Peninsula Pickleball</span></h1>
          <p style={{fontSize:mob?"0.97rem":"1.1rem",opacity:0.9,maxWidth:500,margin:mob?"0 auto 24px":"0 auto 32px",lineHeight:1.7}}>Private, semi-private and group lessons on the SF Peninsula. Personalized coaching from a tournament competitor who knows what it takes to win.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>{trackEvent("hero_view_rates_click");setPage("pricing");}} style={{background:Y,color:G,border:"none",padding:mob?"11px 24px":"13px 30px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:mob?"0.95rem":"1rem"}}>View Rates</button>
            <button onClick={()=>{trackEvent("hero_get_in_touch_click");setPage("contact");}} style={{background:"transparent",color:"white",border:"2px solid rgba(255,255,255,0.5)",padding:mob?"11px 24px":"13px 30px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:mob?"0.95rem":"1rem"}}>Get in Touch</button>
          </div>
        </div>
      </div>
      {/* ── Stats Bar ── */}
      <div style={{background:"white",padding:mob?"28px 20px":"40px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:mob?8:24,textAlign:"center"}}>
          {[["2018","Playing Since"],["2020","Coaching Since"],["5.0+","Tournament Rating"]].map(([num,label])=>(
            <div key={label}>
              <div style={{fontSize:mob?"1.7rem":"2.4rem",fontWeight:900,color:G}}>{num}</div>
              <div style={{fontSize:mob?"0.72rem":"0.88rem",color:"#6b7280",marginTop:4,lineHeight:1.3}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* ── About ── */}
      <div style={{background:"#f4f9f6",padding:mob?"36px 20px":"60px 24px"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          {mob?(
            /* Mobile: photo left + heading/intro right, full text below */
            <>
              <div style={{display:"flex",gap:16,alignItems:"flex-start",marginBottom:20}}>
                <div style={{borderRadius:14,overflow:"hidden",width:120,minWidth:120,aspectRatio:"3/4",boxShadow:"0 6px 24px rgba(0,96,57,0.18)",flexShrink:0}}>
                  <img src={DAVID_PHOTO} alt="Coach David" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
                </div>
                <div style={{paddingTop:4}}>
                  <div style={{fontSize:"0.65rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>About Coach David</div>
                  <h2 style={{fontSize:"1.25rem",fontWeight:900,lineHeight:1.25,color:"#111",margin:0}}>About Coach David</h2>
                </div>
              </div>
              <p style={{color:"#4b5563",lineHeight:1.75,marginBottom:12,fontSize:"0.93rem"}}>Coach David discovered pickleball in 2018, before the pandemic boom, before the packed courts, before everyone else caught on. That head start matters.</p>
              <p style={{color:"#4b5563",lineHeight:1.75,marginBottom:12,fontSize:"0.93rem"}}>With years of experience competing at the highest levels of the game, he has spent years mastering what makes pickleball unique, from the mechanics of the kitchen game to the strategy that separates good players from great ones.</p>
              <p style={{color:"#4b5563",lineHeight:1.75,marginBottom:16,fontSize:"0.93rem"}}>As an IPTPA Level III certified coach and active tournament player, Coach David works with everyone from beginners to seasoned 5.0+ competitors across the SF Peninsula.</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,alignItems:"center"}}>
                <span style={{background:"#1a3c34",color:"white",borderRadius:8,padding:"6px 13px",fontSize:"0.75rem",fontWeight:700,letterSpacing:0.3,display:"inline-flex",alignItems:"center",gap:6}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  IPTPA Level 3 Pro
                </span>
                {[
                  ["Gold Medalist",<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="7"/><path d="M8.5 3.5 6 7h12l-2.5-3.5z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>],
                  ["Tournament Player",<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="13" rx="3"/><circle cx="9" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><path d="M10 15v6M14 15v6M10 21h4"/></svg>],
                  ["SF Peninsula",<svg width="12" height="13" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>],
                  ["All Skill Levels",<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>],
                ].map(([tag,icon])=>(
                  <span key={tag} style={{background:"white",color:"#374151",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:"0.75rem",fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>{icon}{tag}</span>
                ))}
              </div>
            </>
          ):(
            /* Desktop: side-by-side grid */
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:40,alignItems:"center"}}>
              <div style={{borderRadius:16,overflow:"hidden",aspectRatio:"3/4",boxShadow:"0 8px 32px rgba(0,96,57,0.2)"}}>
                <img src={DAVID_PHOTO} alt="David Mok — Honolulu Open Gold Medal" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
              </div>
              <div>
                <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>About Coach David</div>
                <h2 style={{fontSize:"1.8rem",fontWeight:900,marginBottom:16,lineHeight:1.3}}>About Coach David</h2>
                <p style={{color:"#4b5563",lineHeight:1.8,marginBottom:14,fontSize:"0.97rem"}}>Coach David discovered pickleball in 2018, before the pandemic boom, before the packed courts, before everyone else caught on. That head start matters.</p>
                <p style={{color:"#4b5563",lineHeight:1.8,marginBottom:14,fontSize:"0.97rem"}}>With years of experience competing at the highest levels of the game, he has spent years mastering what makes pickleball unique, from the mechanics of the kitchen game to the strategy that separates good players from great ones. The result is a coaching approach built on genuine mastery and real competitive experience.</p>
                <p style={{color:"#4b5563",lineHeight:1.8,fontSize:"0.97rem"}}>As an IPTPA Level III certified coach and active tournament player, Coach David works with everyone from players who have never held a paddle to seasoned 5.0+ competitors, in both singles and doubles, across the SF Peninsula.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:18,alignItems:"center"}}>
                  <span style={{background:"#1a3c34",color:"white",borderRadius:8,padding:"8px 16px",fontSize:"0.82rem",fontWeight:700,letterSpacing:0.3,display:"inline-flex",alignItems:"center",gap:6}}>
                    <span style={{opacity:0.7,fontSize:"0.7rem",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>✓</span> IPTPA Level 3 Pro
                  </span>
                  {[["🥇","Gold Medalist"],["🏓","Tournament Player"],["📍","SF Peninsula"],["⭐","All Skill Levels"]].map(([icon,tag])=>(
                    <span key={tag} style={{background:"white",color:"#374151",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"8px 14px",fontSize:"0.82rem",fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>{icon} {tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ── Lesson Types ── */}
      <div style={{background:"white",padding:mob?"40px 20px":"60px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>What's Available</div>
            <h2 style={{fontSize:mob?"1.5rem":"1.8rem",fontWeight:900}}>Lesson Types</h2>
          </div>
          <div style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:12,overflow:"hidden"}}>
            {[
              {title:"Private Lesson",desc:"One-on-one instruction tailored entirely to your skill level, goals, and playing style.",price:"$120/hr"},
              {title:"Semi-Private",desc:"Train alongside a partner. Same focused coaching, shared investment.",price:"$140/hr",sub:"$70 per person"},
              {title:"Group Lesson",desc:"Small-group training for 3–4 players. Drill-focused sessions with live play and individual feedback.",price:"$140/hr",sub:"split equally"},
            ].map(({title,desc,price,sub},i,arr)=>(
              <div key={title} style={{padding:mob?"16px 20px":"20px 24px",borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4,gap:12}}>
                  <div style={{fontWeight:700,fontSize:"0.95rem"}}>{title}</div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:700,color:G,fontSize:"1rem"}}>{price}</div>
                    {sub&&<div style={{fontSize:"0.72rem",color:"#9ca3af",marginTop:1}}>{sub}</div>}
                  </div>
                </div>
                <div style={{fontSize:"0.82rem",color:"#6b7280",lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── Gear Banner ── */}
      <div style={{background:"#111111",padding:mob?"40px 20px":"48px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#f97316",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Gear I Trust</div>
          <h2 style={{fontSize:mob?"1.5rem":"1.8rem",fontWeight:900,color:"white",marginBottom:12}}>Paddle & Gear Discounts</h2>
          <p style={{color:"rgba(255,255,255,0.55)",marginBottom:28,lineHeight:1.7,maxWidth:480,margin:"0 auto 28px"}}>Get discounts on the paddles and gear Coach David uses and recommends.</p>
          <button onClick={()=>setPage("gear")} style={{background:"#f97316",color:"white",border:"none",padding:"12px 28px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>View All Codes →</button>
        </div>
      </div>
      {/* ── CTA ── */}
      <div style={{background:`linear-gradient(135deg,${G},#0d2620)`,color:"white",textAlign:"center",padding:mob?"48px 20px":"60px 24px"}}>
        <h2 style={{fontSize:mob?"1.5rem":"1.8rem",fontWeight:900,marginBottom:12}}>Ready to Improve Your Game?</h2>
        <p style={{opacity:0.9,marginBottom:24}}>Reach out via text or call to get started.</p>
        <button onClick={()=>setPage("contact")} style={{background:Y,color:G,border:"none",padding:"13px 32px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>Contact Coach David</button>
      </div>
    </div>
  );
}

function PricingPage({setPage}){
  const[mob,setMob]=useState(()=>typeof window!=="undefined"&&window.innerWidth<640);
  useEffect(()=>{const h=()=>setMob(window.innerWidth<640);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return(
    <div style={{maxWidth:700,margin:"0 auto",padding:mob?"36px 16px":"60px 24px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>SF Peninsula · Bay Area</div>
        <h2 style={{fontSize:mob?"1.7rem":"2rem",fontWeight:900}}>Lesson Rates</h2>
      </div>
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
        {[
          {title:"Private Lesson",desc:"One-on-one instruction tailored entirely to your skill level, goals, and playing style.",price:"$120/hr",sub:null},
          {title:"Semi-Private",desc:"Train alongside a partner. Same focused coaching, shared investment.",price:"$140/hr",sub:"$70 per person"},
          {title:"Group Lesson",desc:"Small-group training for 3–4 players. Drill-focused sessions with live play and individual feedback.",price:"$140/hr",sub:"split equally"},
        ].map(({title,desc,price,sub},i,arr)=>(
          <div key={title} style={{padding:"22px 24px",borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:6}}>
              <div style={{fontWeight:700,fontSize:"1rem"}}>{title}</div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,color:G,fontSize:"1.1rem"}}>{price}</div>
                {sub&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:1}}>{sub}</div>}
              </div>
            </div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",lineHeight:1.65,marginBottom:4}}>{desc}</div>
            <div style={{fontSize:"0.75rem",color:"#9ca3af"}}>60 &amp; 90 min sessions available</div>
          </div>
        ))}
        <div style={{padding:"22px 24px",borderTop:"1px solid #f3f4f6",background:"#fafaf9",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:"1rem",marginBottom:4}}>Corporate &amp; Events</div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",lineHeight:1.65}}>Custom pickleball programming for companies and private events. Clinics, mini-tournaments, and team-building on the court.</div>
          </div>
          <button onClick={()=>setPage("contact")} style={{background:"none",border:"none",color:G,fontWeight:600,fontSize:"0.82rem",cursor:"pointer",flexShrink:0,padding:0,letterSpacing:"0.5px",textTransform:"uppercase",whiteSpace:"nowrap",alignSelf:"center"}}>Contact →</button>
        </div>
      </div>
      <div style={{marginTop:48}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"0.75rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Policies</div>
          <h2 style={{fontSize:mob?"1.4rem":"1.6rem",fontWeight:900}}>What to Know</h2>
        </div>
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
          {[
            {title:"Cancellation & Rescheduling",body:"At least 12 hours' notice is required to cancel or reschedule a lesson at no charge. Cancellations can be made directly from your student dashboard."},
            {title:"Late Cancellation",body:(
              <span>Cancellations made within the 12-hour window are subject to a <strong>50% lesson fee</strong>, payable via Venmo: <a href={"https://venmo.com/"+VENMO} target="_blank" rel="noreferrer" style={{color:G,fontWeight:700,textDecoration:"none"}}>@{VENMO}</a>. The fee amount will be shown in your dashboard with a direct payment link.</span>
            )},
            {title:"No-Show",body:(
              <span>Failure to show up without any notice will result in a charge of <strong>100% of the lesson cost</strong>, payable via Venmo: <a href={"https://venmo.com/"+VENMO} target="_blank" rel="noreferrer" style={{color:G,fontWeight:700,textDecoration:"none"}}>@{VENMO}</a>.</span>
            )},
            {title:"Inclement Weather",body:"Coach David will determine if court conditions are unplayable, typically 1 hour before the start time. In the event of a weather-related cancellation, the lesson will be rescheduled at no additional charge."},
            {title:"Payment",body:(<span>Payment is expected after the lesson is completed. Accepted methods: <strong>Cash</strong> or <strong>Venmo</strong> (<a href={"https://venmo.com/"+VENMO} target="_blank" rel="noreferrer" style={{color:G,fontWeight:700,textDecoration:"none"}}>@{VENMO}</a>).</span>)},
            {title:"Equipment",body:"Students are encouraged to bring the paddle they are most comfortable with. Loaner paddles are available upon request — just add a note when booking. Balls are provided by Coach David for all sessions."},
          ].map(({title,body},i,arr)=>(
            <div key={title} style={{padding:mob?"16px 20px":"18px 28px",borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none"}}>
              <div style={{fontSize:"0.75rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>{title}</div>
              <div style={{fontSize:"0.88rem",color:"#4b5563",lineHeight:1.75}}>{body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// SVG icons for the bag section
function PaddleIcon({size=28,color="white"}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="10" rx="7" ry="7" stroke={color} strokeWidth="1.8" fill="none"/>
      <circle cx="10" cy="10" r="2" fill={color} opacity="0.5"/>
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
function BagIcon({size=28,color="white"}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="13" x2="21" y2="13" stroke={color} strokeWidth="1.4" opacity="0.5"/>
    </svg>
  );
}

function GearPage(){
  const[gearData,setGearData]=useState(null);
  const[gearLoading,setGearLoading]=useState(true);

  useEffect(()=>{
    fetch("/api/gear").then(r=>r.json()).then(d=>{
      if(d.gear)setGearData(d.gear);
    }).catch(()=>{}).finally(()=>setGearLoading(false));
  },[]);

  // Merge API data over hardcoded defaults
  const paddle={
    name: gearData?.paddle_name || BAG_ITEMS[0].name,
    detail: BAG_ITEMS[0].detail,
    link: gearData?.paddle_link || BAG_ITEMS[0].link,
  };
  const bag={
    name: gearData?.bag_name || BAG_ITEMS[1].name,
    detail: gearData?.bag_detail || BAG_ITEMS[1].detail,
    link: gearData?.bag_link || BAG_ITEMS[1].link,
  };
  const paddleHistory = gearData?.paddle_history || PADDLE_HISTORY;
  const updatedAt = gearData?.updated_at || "March 2026";
  const AC = gearData?.accent_color || "#f97316"; // accent color, editable from admin

  return(
    <div style={{background:"#f5f5f3",minHeight:"100vh"}}>
      <div style={{background:"white",borderBottom:"1.5px solid #e5e7eb",padding:"0 24px"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",gap:0,alignItems:"center"}}>
          <span style={{fontSize:"0.78rem",color:"#9ca3af",fontWeight:600,paddingRight:16,borderRight:"1px solid #e5e7eb",margin:"12px 0"}}>Jump to</span>
          {[["Discount Codes","discount-codes"],["What's In My Bag","whats-in-my-bag"]].map(([label,id])=>(
            <button key={id} onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"})}
              style={{background:"none",border:"none",borderBottom:"2px solid transparent",padding:"14px 20px",fontSize:"0.82rem",fontWeight:600,color:"#374151",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.color=G;e.currentTarget.style.borderBottomColor=G;}}
              onMouseLeave={e=>{e.currentTarget.style.color="#374151";e.currentTarget.style.borderBottomColor="transparent";}}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div id="discount-codes" style={{padding:"64px 24px"}}>
        <div style={{maxWidth:960,margin:"0 auto",textAlign:"center",marginBottom:52}}>
          <div style={{fontSize:"0.75rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Gear I Trust</div>
          <h2 style={{fontSize:"2.2rem",fontWeight:900,marginBottom:14}}>Paddle & Gear Discounts</h2>
          <p style={{color:"#6b7280",maxWidth:520,margin:"0 auto",lineHeight:1.8,fontSize:"0.97rem"}}>These are the brands I personally use and recommend. Use my exclusive codes to save on your next purchase.</p>
        </div>
        <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(420px,100%),1fr))",gap:24}}>
          {BRANDS.map(brand=>(
            <div key={brand.id} style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:"1.5px solid #ebebeb",display:"flex",flexDirection:"column"}}>
              <div style={{background:brand.logoBg,padding:brand.logoPad,display:"flex",alignItems:"center",justifyContent:"center",minHeight:110}}>
                <img src={brand.logo} alt={brand.name} style={{maxHeight:68,maxWidth:"80%",objectFit:"contain"}}/>
              </div>
              <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",flex:1}}>
                <div style={{fontWeight:800,fontSize:"1.05rem",color:"#111"}}>{brand.name}</div>
                <div style={{fontSize:"0.83rem",color:"#9ca3af",marginTop:3,marginBottom:14}}>{brand.tagline}</div>
                <p style={{color:"#4b5563",fontSize:"0.88rem",lineHeight:1.8,marginBottom:20,flex:1}}>{brand.description}</p>
                <div style={{background:brand.codeBg,borderRadius:12,padding:"14px 18px",marginBottom:14,border:"1.5px dashed #e5e7eb"}}>
                  <div style={{fontSize:"0.68rem",fontWeight:700,color:brand.codeText,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Discount Code</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontFamily:"monospace",fontWeight:900,fontSize:"1.4rem",color:brand.codeColor,letterSpacing:2}}>{brand.code}</div>
                      <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:3}}>{brand.deal}</div>
                    </div>
                    <CopyButton code={brand.code}/>
                  </div>
                </div>
                <a href={brand.link} target="_blank" rel="noreferrer"
                  onClick={()=>trackEvent("gear_discount_shop_click",{brand:brand.name})}
                  style={{display:"flex",alignItems:"center",justifyContent:"center",background:brand.shopBg,color:brand.shopColor,padding:"12px 20px",borderRadius:50,fontWeight:700,textDecoration:"none",fontSize:"0.9rem"}}>
                  Shop {brand.name} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div id="whats-in-my-bag" style={{background:"#111111",padding:"64px 24px"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontSize:"0.72rem",fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Updated {updatedAt}</div>
            <h2 style={{fontSize:"2rem",fontWeight:900,color:"white",marginBottom:10}}>What's In My Bag</h2>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.92rem",maxWidth:420,margin:"0 auto"}}>The exact gear Coach David plays and competes with right now.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(300px,100%),1fr))",gap:16,marginBottom:56}}>
            {[
              {id:"paddle",label:"Current Paddle",icon:<PaddleIcon/>,item:paddle},
              {id:"bag",   label:"Current Bag",   icon:<BagIcon/>,   item:bag},
            ].map(({id,label,icon,item})=>(
              <div key={id} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:16,padding:"20px 24px",display:"flex",alignItems:"center",gap:18}}>
                <div style={{width:50,height:50,background:AC,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.67rem",fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{label}</div>
                  <div style={{color:"white",fontWeight:800,fontSize:"1rem",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{gearLoading?"…":item.name}</div>
                  <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.8rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.detail}</div>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer"
                  onClick={()=>trackEvent("gear_bag_item_click",{item:item.name})}
                  style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,255,255,0.12)",padding:"6px 13px",borderRadius:50,textDecoration:"none",fontSize:"0.77rem",fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
                  Shop →
                </a>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:48}}>
            <div style={{textAlign:"center",marginBottom:36}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Paddle History</div>
              <h3 style={{fontSize:"1.4rem",fontWeight:800,color:"white"}}>Competition Paddles Over Time</h3>
            </div>
            <div style={{maxWidth:600,margin:"0 auto",position:"relative"}}>
              <div style={{position:"absolute",left:24,top:8,bottom:8,width:2,background:"rgba(255,255,255,0.07)",borderRadius:2}}/>
              {[...paddleHistory].sort((a,b)=>{if(a.current)return -1;if(b.current)return 1;const pd=s=>{const[m,y]=s.split(" ");return new Date(y,["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m));};return pd(b.from)-pd(a.from);}).map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:20,marginBottom:i<paddleHistory.length-1?16:0,position:"relative"}}>
                  <div style={{width:50,flexShrink:0,display:"flex",justifyContent:"center"}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:p.current?AC:"rgba(255,255,255,0.15)",border:`2px solid ${p.current?AC:"rgba(255,255,255,0.1)"}`,boxShadow:p.current?`0 0 14px ${AC}99`:"none"}}/>
                  </div>
                  <div style={{flex:1,background:p.current?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.03)",border:`1.5px solid ${p.current?AC+"55":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{color:"white",fontWeight:700,fontSize:"0.97rem"}}>{p.name}</div>
                      <div style={{color:"rgba(255,255,255,0.35)",fontSize:"0.8rem",marginTop:3}}>{p.from} — {p.to}</div>
                    </div>
                    {p.current
                      ?<span style={{background:AC,color:"white",padding:"3px 12px",borderRadius:50,fontSize:"0.68rem",fontWeight:800,textTransform:"uppercase"}}>Current</span>
                      :<span style={{color:"rgba(255,255,255,0.2)",fontSize:"0.78rem",fontWeight:600}}>Retired</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:52}}>
            <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
              style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.1)",padding:"9px 22px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>
              ↑ Back to Top
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESOURCES PAGE ──────────────────────────────────────────────────────────
const RESOURCE_LINKS=[
  {name:"USA Pickleball",url:"https://usapickleball.org/",description:"The national governing body for pickleball in the US. Official rules, player ratings, and tournament registration.",color:"#003087",badge:"Governing Body"},
  {name:"Pickleball Tournaments",url:"https://www.pickleballtournaments.com/",description:"Find and register for local and national pickleball tournaments near you.",color:"#16a34a",badge:"Find Events"},
  {name:"PPA Tour",url:"https://www.ppatour.com/",description:"The Professional Pickleball Association Tour — the top pro circuit in the sport. Watch the best players compete.",color:"#dc2626",badge:"Pro Tour"},
];
function ResourcesPage(){
  return(
    <div style={{background:"#f5f5f3",minHeight:"100vh"}}>
      {/* PickleballTV Live Stream Section */}
      <div style={{background:"#0a0a0a",padding:"56px 24px 48px"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"#4ade80",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Live 24/7 · Free</div>
            <h2 style={{fontSize:"2rem",fontWeight:900,color:"white",marginBottom:10}}>Watch PickleballTV</h2>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.9rem",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>PPA Tour matches live around the clock — starts muted, click the speaker icon to unmute.</p>
          </div>
          {/* JW Player direct embed — pulled from pickleballtv.com player config */}
          <div style={{borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{paddingTop:"56.25%",position:"relative",background:"#000"}}>
              <iframe
                src="https://cdn.jwplayer.com/players/wp8rMulw-4cEjt3sm.html?mute=true"
                title="PickleballTV Live"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none",display:"block"}}
                scrolling="no"
              />
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:18,display:"flex",alignItems:"center",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
            <a href="https://www.pickleballtv.com" target="_blank" rel="noreferrer"
              onClick={()=>trackEvent("resource_ptv_site_click")}
              style={{background:"#4ade80",color:"#0a2018",padding:"10px 22px",borderRadius:50,fontWeight:800,textDecoration:"none",fontSize:"0.88rem",display:"flex",alignItems:"center",gap:7}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Open PickleballTV
            </a>
            <a href="https://www.youtube.com/@Pickleballtv" target="_blank" rel="noreferrer"
              onClick={()=>trackEvent("resource_ptv_youtube_click")}
              style={{color:"rgba(255,255,255,0.4)",fontSize:"0.82rem",textDecoration:"none",padding:"10px 0"}}>
              Watch on YouTube →
            </a>
          </div>
        </div>
      </div>

      {/* Helpful Links Section */}
      <div style={{padding:"60px 24px 72px"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{fontSize:"0.72rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Community</div>
            <h2 style={{fontSize:"2rem",fontWeight:900,color:"#111",marginBottom:10}}>Helpful Links</h2>
            <p style={{color:"#6b7280",fontSize:"0.92rem",maxWidth:440,margin:"0 auto",lineHeight:1.7}}>Everything you need to stay connected to the pickleball world — ratings, events, and pro play.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(300px,100%),1fr))",gap:20}}>
            {RESOURCE_LINKS.map(link=>(
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
                onClick={()=>trackEvent("resource_link_click",{name:link.name})}
                style={{background:"white",borderRadius:18,padding:"28px 26px",textDecoration:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.07)",border:"1.5px solid #ebebeb",display:"flex",flexDirection:"column",gap:14}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 10px 32px rgba(0,0,0,0.11)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.07)";}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div style={{width:44,height:44,borderRadius:12,background:link.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <span style={{background:link.color+"18",color:link.color,fontSize:"0.68rem",fontWeight:800,textTransform:"uppercase",letterSpacing:1,padding:"3px 10px",borderRadius:50}}>{link.badge}</span>
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:"1.08rem",color:"#111",marginBottom:6}}>{link.name}</div>
                  <div style={{color:"#6b7280",fontSize:"0.87rem",lineHeight:1.75}}>{link.description}</div>
                </div>
                <div style={{marginTop:"auto",color:G,fontWeight:700,fontSize:"0.85rem",display:"flex",alignItems:"center",gap:5}}>
                  Visit site
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT PAGE ────────────────────────────────────────────────────────────
function ContactPage(){
  const[status,setStatus]=useState("idle"); // idle | sending | success | error
  const[form,setForm]=useState({name:"",email:"",message:""});

  const handleSubmit=async()=>{
    if(!form.name||!form.email){alert("Please enter your name and email.");return;}
    setStatus("sending");
    try{
      const res=await fetch("/api/send-email",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:form.name,email:form.email,message:form.message}),
      });
      if(res.ok){setStatus("success");}
      else{setStatus("error");}
    }catch{
      setStatus("error");
    }
  };

  return(
    <div style={{maxWidth:560,margin:"0 auto",padding:"60px 24px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Get In Touch</div>
        <h2 style={{fontSize:"2rem",fontWeight:900}}>Contact Coach David</h2>
        <p style={{color:"#6b7280",marginTop:8,lineHeight:1.7}}>Interested in lessons? Send a message and Coach David will get back to you directly.</p>
      </div>
      <div style={{background:"white",borderRadius:12,padding:"28px 32px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
        <div style={{marginBottom:20}}>
          <div style={{background:"#e8f0ee",border:`1.5px solid ${G}`,borderRadius:10,padding:"14px 18px",textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:"0.9rem",color:"#374151"}}>Email</div>
            <div style={{color:G,fontWeight:700,marginTop:4,fontSize:"0.9rem"}}>info@dmpickleball.com</div>
          </div>
        </div>

        {status==="success"?(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"#e8f0ee",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontWeight:700,fontSize:"1.05rem",color:"#1a1a1a",marginBottom:6}}>Message sent!</div>
            <div style={{color:"#6b7280",fontSize:"0.88rem"}}>Coach David will be in touch soon.</div>
          </div>
        ):status==="error"?(
          <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"14px 16px",color:"#991b1b",fontSize:"0.88rem",marginBottom:14,textAlign:"center"}}>
            Something went wrong. Please try again or email Coach David directly.
            <button onClick={()=>setStatus("idle")} style={{display:"block",margin:"10px auto 0",background:"white",border:"1.5px solid #fca5a5",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem",color:"#991b1b"}}>Try Again</button>
          </div>
        ):(
          <>
            {[["name","text","Your Name"],["email","email","Email Address"]].map(([key,type,ph])=>(
              <input key={key} type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:key==="name"?capWords(e.target.value):e.target.value})} style={inp}/>
            ))}
            <textarea placeholder="Tell me about your experience level and what you'd like to work on..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{...inp,height:100,resize:"vertical",fontFamily:"inherit"}}/>
            <button onClick={handleSubmit} disabled={status==="sending"}
              style={{width:"100%",background:status==="sending"?"#9ca3af":G,color:"white",border:"none",padding:14,borderRadius:50,fontWeight:700,cursor:status==="sending"?"not-allowed":"pointer",fontSize:"1rem"}}>
              {status==="sending"?"Sending…":"Send Message →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AdminLoginPage({onAdminLogin}){
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const handleGoogleAdminLogin=()=>{
    setLoading(true);setError("");
    const popup=window.open(
      "https://accounts.google.com/o/oauth2/v2/auth?"+new URLSearchParams({
        client_id:GOOGLE_CLIENT_ID,
        redirect_uri:window.location.origin,
        response_type:"token",
        scope:"email profile",
        prompt:"select_account",
      }).toString(),
      "adminlogin","width=520,height=650,scrollbars=yes,resizable=yes"
    );
    const t=setInterval(async()=>{
      try{
        if(popup.closed){clearInterval(t);setLoading(false);return;}
        const url=popup.location.href;
        if(url.includes(window.location.origin)&&url.includes("access_token")){
          clearInterval(t);popup.close();
          const accessToken=new URLSearchParams(url.split("#")[1]).get("access_token");
          const info=await(await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+accessToken}})).json();
          const email=(info.email||"").toLowerCase();
          if(email===ADMIN_EMAIL||PARTNER_EMAILS.includes(email)){
            // Exchange Google token for server-side HMAC token, then open admin panel
            if(accessToken){
              fetch('/api/students',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({action:'get-admin-token',googleToken:accessToken}),
              }).then(r=>r.json()).then(d=>{
                if(d.token){
                  sessionStorage.setItem('dm_admin_token',d.token);
                  // Also persist so page refreshes don't lose the token
                  localStorage.setItem('dm_admin_token_store',d.token);
                  onAdminLogin(email);
                } else {
                  // Token exchange failed — show the server error instead of opening broken admin
                  setLoading(false);
                  setError('Token error: '+(d.error||'Unknown error from server. Check ADMIN_EMAIL env var in Vercel.'));
                }
              }).catch(()=>{
                // Network error — still open admin (will just lack token)
                onAdminLogin(email);
              });
            } else {
              onAdminLogin(email);
            }
          }
          else{setLoading(false);setError("Access denied.");}
        }
      }catch(e){}
    },500);
  };
  return(
    <div style={{minHeight:"100vh",background:"#f4f9f6",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src="/DMPBlogo.png" alt="DM Pickleball" style={{height:36,marginBottom:16,objectFit:"contain"}}/>
          <h2 style={{fontWeight:900,color:"#1a1a1a",marginBottom:4}}>Admin Login</h2>
          <p style={{color:"#6b7280",fontSize:"0.85rem"}}>Dashboard</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        <button onClick={handleGoogleAdminLogin} disabled={loading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:loading?"#f3f4f6":"white",color:"#374151",border:"1.5px solid #d1d5db",padding:"12px 16px",borderRadius:50,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontSize:"0.95rem",transition:"background 0.15s"}}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading?"Signing in…":"Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
const SELF_RATINGS=[
  {value:"beginner",    label:"Beginner",      range:"2.0–2.9", desc:"New to pickleball or just learning the basics"},
  {value:"novice",      label:"Novice",        range:"3.0–3.4", desc:"Getting consistent, short rallies"},
  {value:"intermediate",label:"Intermediate",  range:"3.5–4.0", desc:"Steady rallies, developing court strategy"},
  {value:"advanced",    label:"Advanced",      range:"4.0–5.0", desc:"Strong all-around game, tournament experience"},
  {value:"elite",       label:"Elite",         range:"5.0+",    desc:"Competing at the highest local/regional level"},
];
// Keep for any legacy references
const USAPA_RATINGS=SELF_RATINGS;

// ─── Provider icon SVGs ───────────────────────────────────────────────────────
const PROV_ICONS={
  google:<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
  microsoft:<svg width="20" height="20" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>,
  yahoo:<svg width="20" height="20" viewBox="0 0 24 24" fill="#6001D2"><path d="M0 4h5.5l3.5 6.5L12.5 4H18L10 16.5V22H7V16.5Z"/><circle cx="19" cy="19" r="3"/></svg>,
};
const PROV_LABELS={google:"Google",microsoft:"Microsoft",yahoo:"Yahoo"};
const PROV_COLORS={google:"#4285F4",microsoft:"#00A4EF",yahoo:"#6001D2"};

function LoginPage({onLogin,onAdminLogin}){
  const[loadingProv,setLoadingProv]=useState(null);
  const[providerInfo,setProviderInfo]=useState(null);
  const[firstName,setFirstName]=useState("");
  const[lastName,setLastName]=useState("");
  const[commEmail,setCommEmail]=useState("");
  const[phone,setPhone]=useState("");
  const[homeCourt,setHomeCourt]=useState("");
  const[skillLevel,setSkillLevel]=useState("");
  const[goals,setGoals]=useState("");
  const[referralSource,setReferralSource]=useState("");
  const[useDupr,setUseDupr]=useState(false);
  const[duprRating,setDuprRating]=useState("");
  const[duprId,setDuprId]=useState("");
  const[error,setError]=useState("");
  const[signedUp,setSignedUp]=useState(false);

  const handleAuthResult=async(provKey,info)=>{
    const email=(info.email||"").toLowerCase();
    if(!email){setLoadingProv(null);setError("Could not get email from "+PROV_LABELS[provKey]+". Please try another option.");return;}
    window._pendingEmail=email;
    try{
      const r=await fetch("/api/students?action=get&email="+encodeURIComponent(email));
      const data=await r.json();
      if(!data.student){
        setProviderInfo({...info,email,provider:provKey});
        setFirstName(info.firstName||"");
        setLastName(info.lastName||"");
        setCommEmail(email);
        setLoadingProv(null);
        return;
      }
      if(!data.student.approved){setLoadingProv(null);setError("Your account is pending approval from Coach David.");return;}
      if(data.student.blocked&&!data.student.approved){setLoadingProv(null);setError("Your account has been removed. Please contact Coach David.");return;}
      if(data.student.blocked){setLoadingProv(null);setError("Your account has been blocked. Please contact Coach David.");return;}
      setLoadingProv(null);
      onLogin({email,name:data.student.name||(info.firstName+" "+info.lastName).trim(),firstName:data.student.first_name||info.firstName||"",lastName:data.student.last_name||info.lastName||"",commEmail:data.student.comm_email||"",memberType:data.student.member_type,approved:true,picture:info.picture||data.student.picture||"",phone:data.student.phone||"",homeCourt:data.student.home_court||"",city:data.student.city||"",skillLevel:data.student.skill_level||"",duprRating:data.student.dupr_rating||"",duprDoublesRating:data.student.dupr_doubles_rating||"",duprId:data.student.dupr_id||"",grandfathered:!!(data.student.grandfathered)});
      fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,updates:{picture:info.picture||"",auth_provider:provKey}})}).catch(()=>{});
    }catch(e){setLoadingProv(null);setError("Login failed. Please try again.");}
  };

  const openPopup=(url,name)=>window.open(url,name,"width=520,height=650,scrollbars=yes,resizable=yes");

  const handleGoogleLogin=()=>{
    setLoadingProv("google");setError("");
    const popup=openPopup("https://accounts.google.com/o/oauth2/v2/auth?"+new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:window.location.origin,response_type:"token",scope:"email profile",prompt:"select_account"}).toString(),"glogin");
    const t=setInterval(async()=>{try{if(popup.closed){clearInterval(t);setLoadingProv(null);return;}const url=popup.location.href;if(url.includes(window.location.origin)&&url.includes("access_token")){clearInterval(t);popup.close();const token=new URLSearchParams(url.split("#")[1]).get("access_token");const info=await(await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+token}})).json();await handleAuthResult("google",{email:info.email,firstName:info.given_name||"",lastName:info.family_name||"",picture:info.picture||""});}}catch(e){}},500);
  };

  const handleMicrosoftLogin=()=>{
    if(!MICROSOFT_CLIENT_ID){setError("Microsoft sign-in is not yet configured. See PROVIDER_SETUP.md.");return;}
    setLoadingProv("microsoft");setError("");
    const popup=openPopup("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"+new URLSearchParams({client_id:MICROSOFT_CLIENT_ID,redirect_uri:window.location.origin,response_type:"token",scope:"openid profile email User.Read",prompt:"select_account"}).toString(),"mslogin");
    const t=setInterval(async()=>{try{if(popup.closed){clearInterval(t);setLoadingProv(null);return;}const url=popup.location.href;if(url.includes(window.location.origin)&&url.includes("access_token")){clearInterval(t);popup.close();const token=new URLSearchParams(url.split("#")[1]).get("access_token");const info=await(await fetch("https://graph.microsoft.com/v1.0/me",{headers:{Authorization:"Bearer "+token}})).json();await handleAuthResult("microsoft",{email:info.mail||info.userPrincipalName||"",firstName:info.givenName||"",lastName:info.surname||"",picture:""});}}catch(e){}},500);
  };

  const handleYahooLogin=()=>{
    if(!YAHOO_CLIENT_ID){setError("Yahoo sign-in is not yet configured. See PROVIDER_SETUP.md.");return;}
    setLoadingProv("yahoo");setError("");
    // Open popup immediately (must be synchronous during user click)
    const popup=openPopup("about:blank","yhlogin");
    if(!popup){setLoadingProv(null);setError("Popup was blocked. Please allow popups for dmpickleball.com and try again.");return;}
    // Generate PKCE code verifier synchronously
    const arr=new Uint8Array(32);crypto.getRandomValues(arr);
    const codeVerifier=btoa(String.fromCharCode(...arr)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
    // Generate code challenge (SHA-256) then navigate popup
    crypto.subtle.digest("SHA-256",new TextEncoder().encode(codeVerifier)).then(hash=>{
      const codeChallenge=btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
      const redirectUri=window.location.origin;
      popup.location.href="https://api.login.yahoo.com/oauth2/request_auth?"+new URLSearchParams({client_id:YAHOO_CLIENT_ID,redirect_uri:redirectUri,response_type:"code",scope:"openid profile email",code_challenge:codeChallenge,code_challenge_method:"S256",prompt:"select_account"}).toString();
      const t=setInterval(async()=>{try{if(popup.closed){clearInterval(t);setLoadingProv(null);return;}const url=popup.location.href;if(url.includes(redirectUri)&&url.includes("code=")){clearInterval(t);popup.close();const code=new URLSearchParams(url.split("?")[1]).get("code");const tokenRes=await fetch("/api/yahoo-token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,codeVerifier,redirectUri})});const info=await tokenRes.json();if(info.error){setLoadingProv(null);setError("Yahoo error: "+info.error);return;}await handleAuthResult("yahoo",{email:info.email||"",firstName:info.firstName||"",lastName:info.lastName||"",picture:info.picture||""});}}catch(e){if(e.name==="SecurityError"||e.message.includes("cross-origin")||e.message.includes("Blocked"))return;clearInterval(t);setLoadingProv(null);setError("Yahoo sign-in failed: "+e.message);}},500);
    });
  };

  const HANDLERS={google:handleGoogleLogin,microsoft:handleMicrosoftLogin,yahoo:handleYahooLogin};

  // Step indicator component
  const StepDot=({n,label,active,done})=>(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.8rem",
        background:done?"#16a34a":active?G:"#e5e7eb",color:done||active?"white":"#9ca3af",transition:"all 0.2s"}}>
        {done?"✓":n}
      </div>
      <span style={{fontSize:"0.7rem",fontWeight:600,color:done?"#16a34a":active?"#374151":"#9ca3af",whiteSpace:"nowrap"}}>{label}</span>
    </div>
  );
  const StepBar=({step})=>(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"center",gap:0,marginBottom:28}}>
      <StepDot n={1} label="Verify" active={step===1} done={step>1}/>
      <div style={{width:48,height:2,background:step>1?"#16a34a":"#e5e7eb",marginTop:13,transition:"all 0.3s"}}/>
      <StepDot n={2} label="Profile" active={step===2} done={step>2}/>
      <div style={{width:48,height:2,background:step>2?"#16a34a":"#e5e7eb",marginTop:13,transition:"all 0.3s"}}/>
      <StepDot n={3} label="Done" active={step===3} done={false}/>
    </div>
  );

  if(signedUp)return(
    <div style={{maxWidth:480,margin:"60px auto",padding:"0 24px"}}>
      <div style={{background:"white",borderRadius:20,padding:"40px 36px",boxShadow:"0 4px 32px rgba(0,0,0,0.09)"}}>
        <StepBar step={3}/>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:68,height:68,borderRadius:"50%",background:"#f0fdf4",border:"3px solid #86efac",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px"}}>✓</div>
          <h2 style={{fontWeight:900,color:G,marginBottom:8,fontSize:"1.4rem"}}>You're on the list, {firstName}!</h2>
          <p style={{color:"#6b7280",lineHeight:1.7,fontSize:"0.93rem"}}>Your access request has been sent to Coach David. Here's what happens next:</p>
        </div>
        <div style={{background:"#f8fafc",borderRadius:14,padding:"18px 20px",marginBottom:20}}>
          {[
            {icon:"🔍",text:"Coach David will review your request and be in touch soon"},
            {icon:"📧",text:<>You'll get an email at <strong>{commEmail||providerInfo?.email}</strong> once approved</>,},
            {icon:"⏱",text:"Reviews typically take 1–2 business days"},
            {icon:"✓",text:"Once approved, you'll have full access to book lessons and view your schedule"},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:i<3?"1px solid #e5e7eb":"none"}}>
              <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{item.icon}</span>
              <span style={{fontSize:"0.88rem",color:"#374151",lineHeight:1.6}}>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:"0.84rem",color:"#92400e",lineHeight:1.6}}>
          💡 Keep an eye on your inbox — approval emails sometimes land in spam.
        </div>
        <button onClick={()=>{setProviderInfo(null);setSignedUp(false);setError("");}} style={{width:"100%",background:"#f3f4f6",color:"#374151",border:"none",padding:"12px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.9rem"}}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );

  if(providerInfo)return(
    <div style={{maxWidth:480,margin:"60px auto",padding:"0 24px"}}>
      <div style={{background:"white",borderRadius:20,padding:"36px 32px",boxShadow:"0 4px 32px rgba(0,0,0,0.09)"}}>
        <StepBar step={2}/>
        <div style={{textAlign:"center",marginBottom:20}}>
          <h2 style={{fontWeight:900,color:G,marginBottom:6,fontSize:"1.3rem"}}>Complete Your Profile</h2>
          <p style={{color:"#6b7280",fontSize:"0.87rem",lineHeight:1.6}}>Just a few more details so Coach David knows who you are.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,marginBottom:20}}>
          {PROV_ICONS[providerInfo.provider]}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:"0.82rem",color:"#166534"}}>✓ Verified with {PROV_LABELS[providerInfo.provider]}</div>
            <div style={{fontSize:"0.78rem",color:"#15803d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{providerInfo.email}</div>
          </div>
          <button onClick={()=>{setProviderInfo(null);setLoadingProv(null);setError("");setFirstName("");setLastName("");setCommEmail("");setPhone("");setHomeCourt("");setSkillLevel("");setGoals("");setReferralSource("");setUseDupr(false);setDuprRating("");setDuprId("");}} style={{background:"white",border:"1.5px solid #d1d5db",color:"#374151",cursor:"pointer",fontSize:"0.78rem",fontWeight:600,whiteSpace:"nowrap",padding:"5px 12px",borderRadius:20,flexShrink:0}}>← Change</button>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <input style={{...inp,marginBottom:0}} type="text" placeholder="First Name *" value={firstName} onChange={e=>setFirstName(capWords(e.target.value))}/>
          <input style={{...inp,marginBottom:0}} type="text" placeholder="Last Name *" value={lastName} onChange={e=>setLastName(capWords(e.target.value))}/>
        </div>
        <input style={inp} type="email" placeholder="Communication Email *" value={commEmail} onChange={e=>setCommEmail(e.target.value)}/>
        <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:-10,marginBottom:14,paddingLeft:2}}>Where lesson confirmations & reminders will be sent</div>
        <input style={inp} type="tel" placeholder="Phone Number *" value={phone} onChange={e=>setPhone(formatPhoneInput(e.target.value))}/>
        <LocationInput value={homeCourt} onChange={v=>setHomeCourt(v)} placeholder="Home Court (optional)" style={{...inp,marginBottom:20}}/>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Self Rating <span style={{color:"#dc2626"}}>*</span></div>
          <select value={skillLevel} onChange={e=>setSkillLevel(e.target.value)}
            style={{...inp,marginBottom:0,color:!skillLevel?"#9ca3af":"#111827",cursor:"pointer"}}>
            <option value="">How would you describe your level?</option>
            {SELF_RATINGS.map(r=><option key={r.value} value={r.value}>{r.label} ({r.range}) – {r.desc}</option>)}
          </select>
          <div style={{marginTop:12,background:"#f0f4ff",border:"1px solid #c7d2fe",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:"0.75rem",fontWeight:700,color:"#0a1551",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>DUPR Player ID <span style={{fontWeight:400,color:"#6b7280",textTransform:"none",letterSpacing:0}}>(optional)</span></div>
            <input style={{...inp,marginBottom:0,background:"white",fontSize:"1rem"}} type="text" placeholder="e.g. ABC123XY" value={duprId} onChange={e=>setDuprId(e.target.value.replace(/\s/g,"").slice(0,20).toUpperCase())}/>
            <div style={{fontSize:"0.7rem",color:"#6b7280",marginTop:6,lineHeight:1.5}}>Find it in the DUPR app → Profile → share icon. Your ratings will be synced automatically when approved.</div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>My Goal</div>
          <select value={goals} onChange={e=>setGoals(e.target.value)}
            style={{...inp,marginBottom:0,color:!goals?"#9ca3af":"#111827",cursor:"pointer"}}>
            <option value="">What brings you here?</option>
            <option value="fun">Just for fun</option>
            <option value="improve">Improve my game</option>
            <option value="compete">Compete locally</option>
            <option value="serious">Train seriously</option>
          </select>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>How did you hear about me?</div>
          <select value={referralSource} onChange={e=>setReferralSource(e.target.value)}
            style={{...inp,marginBottom:0,color:!referralSource?"#9ca3af":"#111827",cursor:"pointer"}}>
            <option value="">Select one</option>
            <option value="word_of_mouth">Word of mouth</option>
            <option value="club">Club / court</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button onClick={()=>{
          if(!firstName||!lastName){setError("First and last name are required.");return;}
          if(!commEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(commEmail)){setError("A valid communication email is required.");return;}
          if(!phone){setError("Phone number is required.");return;}
          if(!skillLevel){setError("Please select your skill level.");return;}
          const fullName=firstName.trim()+" "+lastName.trim();
          trackEvent("register_request_submitted",{referralSource,skillLevel});
          fetch("/api/students?action=request",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({email:providerInfo.email,name:fullName,firstName:firstName.trim(),lastName:lastName.trim(),commEmail:commEmail.trim().toLowerCase(),phone,homeCourt,skillLevel,goals,referralSource,duprRating:"",duprId:duprId.trim(),authProvider:providerInfo.provider})
          }).then(r=>r.json()).then(data=>{
            if(data.error==="already_exists"){setError("You already have an account. Please sign in.");return;}
            if(data.error==="already_requested"){setError("You already have a pending request. Coach David will be in touch soon.");return;}
            if(data.error==="blocked"||data.student?.blocked){setError("Your registration request was not accepted. Please contact Coach David directly.");return;}
            fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:"david@dmpickleball.com",subject:"New access request: "+fullName,text:fullName+" has requested access.\nProvider: "+PROV_LABELS[providerInfo.provider]+"\nLogin Email: "+providerInfo.email+"\nComm Email: "+commEmail+"\nPhone: "+phone+"\nHome Court: "+(homeCourt||"Not specified")+"\nSkill: "+(skillLevel||"Not specified")+"\nGoal: "+(goals||"Not specified")+"\nReferral: "+(referralSource||"Not specified")+(duprId.trim()?"\nDUPR ID: "+duprId.trim():"")+"\n\nApprove at: https://dmpickleball.com/admin",fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});
            setSignedUp(true);
          }).catch(()=>setSignedUp(true));
        }} style={{width:"100%",background:G,color:"white",border:"none",padding:14,borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem",marginTop:4}}>
          Send Access Request →
        </button>
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:420,margin:"60px auto",padding:"0 24px"}}>
      <div style={{background:"white",borderRadius:20,padding:"36px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <StepBar step={1}/>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"0.7rem",fontWeight:800,color:G,letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>DM Pickleball</div>
          <h2 style={{fontWeight:900,color:"#1a1a1a",marginBottom:6}}>Sign In</h2>
          <p style={{color:"#6b7280",fontSize:"0.88rem",lineHeight:1.6}}>Sign in or request access to your account</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {["google","microsoft","yahoo"].map(pk=>(
            <button key={pk} onClick={HANDLERS[pk]} disabled={!!loadingProv}
              style={{width:"100%",background:loadingProv===pk?"#f3f4f6":"white",color:"#374151",border:"1.5px solid #e5e7eb",padding:"9px 16px",borderRadius:50,fontWeight:600,cursor:loadingProv?"not-allowed":"pointer",fontSize:"0.88rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"border-color 0.12s",opacity:loadingProv&&loadingProv!==pk?0.5:1}}
              onMouseEnter={e=>{if(!loadingProv)e.currentTarget.style.borderColor=PROV_COLORS[pk];}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";}}>
              {loadingProv===pk?<span style={{color:"#6b7280"}}>Connecting…</span>:<>{PROV_ICONS[pk]}<span>Continue with {PROV_LABELS[pk]}</span></>}
            </button>
          ))}
          <p style={{textAlign:"center",fontSize:"0.78rem",color:"#9ca3af",marginTop:4,lineHeight:1.6}}>New students: sign in above — if you don't have an account yet, we'll walk you through requesting access.</p>
        </div>
      </div>
    </div>
  );
}

function AccountPage({user,setPage,onUpdateUser}){
  const nameParts=(user.name||"").split(" ");
  const[firstName,setFirstName]=useState(user.firstName||nameParts[0]||"");
  const[lastName,setLastName]=useState(user.lastName||nameParts.slice(1).join(" ")||"");
  const[diffEmail,setDiffEmail]=useState(!!(user.commEmail&&user.commEmail.toLowerCase()!==user.email.toLowerCase()));
  const[commEmail,setCommEmail]=useState(user.commEmail||"");
  const[phone,setPhone]=useState(user.phone||"");
  const[city,setCity]=useState(user.city||"");
  const[homeCourt,setHomeCourt]=useState(user.homeCourt||"");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");
  const[duprIdInput,setDuprIdInput]=useState(user.duprId||"");
  const[duprLinking,setDuprLinking]=useState(false);
  const[duprMsg,setDuprMsg]=useState("");
  const[localDuprRating,setLocalDuprRating]=useState(user.duprRating||"");
  const[localDuprDoubles,setLocalDuprDoubles]=useState(user.duprDoublesRating||"");

  const effectiveCommEmail=diffEmail?commEmail.trim().toLowerCase():user.email.toLowerCase();

  const handleSave=async()=>{
    if(!firstName||!lastName){setError("First and last name are required.");return;}
    if(diffEmail&&(!commEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(commEmail))){setError("Please enter a valid notification email.");return;}
    setSaving(true);setError("");
    const fullName=firstName.trim()+" "+lastName.trim();
    try{
      const r=await fetch("/api/students?action=update",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:user.email,updates:{name:fullName,first_name:firstName.trim(),last_name:lastName.trim(),comm_email:effectiveCommEmail,phone,city,home_court:homeCourt}})
      });
      const data=await r.json();
      if(data.success){
        onUpdateUser({...user,name:fullName,firstName:firstName.trim(),lastName:lastName.trim(),commEmail:effectiveCommEmail,phone,city,homeCourt});
        setSaved(true);
        setTimeout(()=>setSaved(false),3000);
      }else{setError("Failed to save. Please try again.");}
    }catch(e){setError("Failed to save. Please try again.");}
    setSaving(false);
  };

  return(
    <div style={{maxWidth:560,margin:"0 auto",padding:"48px 24px"}}>
      <button onClick={()=>setPage("dashboard")} style={{background:"none",border:"none",color:G,fontWeight:700,cursor:"pointer",fontSize:"0.88rem",marginBottom:24,padding:0}}>← Back to My Lessons</button>
      <h2 style={{fontWeight:900,color:G,fontSize:"1.6rem",marginBottom:4}}>Account Settings</h2>
      <p style={{color:"#6b7280",marginBottom:32,fontSize:"0.92rem"}}>Update your profile information</p>
      <div style={{background:"white",borderRadius:12,padding:"28px 32px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28,paddingBottom:24,borderBottom:"1px solid #e5e7eb"}}>
          {user.picture
            ?<img src={user.picture} alt={user.name} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"2px solid #e5e7eb"}}/>
            :<div style={{width:64,height:64,borderRadius:"50%",background:G,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1.4rem",color:"white"}}>{(firstName||"?").charAt(0).toUpperCase()}</div>
          }
          <div>
            <div style={{fontWeight:700,fontSize:"1rem"}}>{firstName} {lastName}</div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>{user.email}</div>
            <span style={{display:"inline-flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
              {user.memberType==="menlo"&&<span style={{background:"#e8f0ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:600}}>Menlo Circus Club</span>}
              {user.grandfathered&&<span style={{background:"#fffbea",color:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:600}}>Grandfathered</span>}
            </span>
          </div>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        {saved&&<div style={{background:"#e8f0ee",border:"1.5px solid "+G,borderRadius:8,padding:"10px 14px",color:G,fontSize:"0.88rem",marginBottom:16,fontWeight:600}}>✓ Changes saved!</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <label style={lbl}>First Name <span style={{color:"#dc2626"}}>*</span></label>
            <input value={firstName} onChange={e=>setFirstName(capWords(e.target.value))} style={{...inp,marginBottom:0}} placeholder="First name"/>
          </div>
          <div>
            <label style={lbl}>Last Name <span style={{color:"#dc2626"}}>*</span></label>
            <input value={lastName} onChange={e=>setLastName(capWords(e.target.value))} style={{...inp,marginBottom:0}} placeholder="Last name"/>
          </div>
        </div>
        <div style={{marginBottom:16,marginTop:16}}>
          <label style={lbl}>Login Email</label>
          <input value={user.email} disabled style={{...inp,background:"#f3f4f6",color:"#9ca3af",cursor:"not-allowed"}}/>
          <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:4}}>Used to sign in — managed by your account provider.</div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={lbl}>Notification Email</label>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:diffEmail?12:0,userSelect:"none"}}>
            <input type="checkbox" checked={diffEmail} onChange={e=>{setDiffEmail(e.target.checked);if(!e.target.checked)setCommEmail("");}} style={{width:16,height:16,accentColor:G,cursor:"pointer",flexShrink:0}}/>
            <span style={{fontSize:"0.85rem",color:"#374151"}}>My notification email is different from my login email</span>
          </label>
          {diffEmail&&(
            <>
              <input value={commEmail} onChange={e=>setCommEmail(e.target.value)} style={inp} placeholder="Where to send lesson confirmations & reminders" type="email"/>
              <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:-10,marginBottom:4}}>All lesson notifications will be sent here instead.</div>
            </>
          )}
          {!diffEmail&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:4}}>Notifications will go to your login email: <strong>{user.email}</strong></div>}
        </div>
        <div style={{marginBottom:16}}>
          <label style={lbl}>Phone Number <span style={{color:"#dc2626"}}>*</span></label>
          <input value={phone} onChange={e=>setPhone(formatPhoneInput(e.target.value))} style={inp} placeholder="(650) 000-0000" type="tel"/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={lbl}>City <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></label>
          <input value={city} onChange={e=>setCity(e.target.value)} style={inp} placeholder="e.g. Redwood City"/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={lbl}>Home Court <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></label>
          <LocationInput value={homeCourt} onChange={v=>setHomeCourt(v)} placeholder="e.g. Andrew Spinas Park" style={inp}/>
        </div>
        <button onClick={handleSave} disabled={saving} style={{width:"100%",background:saving?"#9ca3af":G,color:"white",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontSize:"1rem"}}>
          {saving?"Saving...":"Save Changes"}
        </button>
      </div>

      {/* DUPR Linking Card */}
      <div style={{background:"white",borderRadius:12,padding:"28px 32px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)",marginTop:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <span style={{background:"#0a1551",color:"white",fontWeight:900,fontSize:"0.65rem",letterSpacing:1.5,padding:"3px 8px",borderRadius:4}}>DUPR</span>
          <span style={{fontWeight:700,fontSize:"1rem",color:"#111"}}>Link Your DUPR Account</span>
        </div>
        <p style={{color:"#6b7280",fontSize:"0.85rem",marginBottom:20,marginTop:4}}>Connect your DUPR profile so your ratings appear automatically. Find your Player ID in the DUPR app or your profile URL.</p>
        {(localDuprRating||localDuprDoubles)&&(
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {localDuprDoubles&&<span style={{background:"#1e3a5f",color:"white",fontWeight:900,fontSize:"1rem",padding:"5px 16px",borderRadius:50,display:"flex",alignItems:"center",gap:6}}>{parseFloat(localDuprDoubles).toFixed(2)}<span style={{fontSize:"0.65rem",opacity:0.75,fontWeight:600,letterSpacing:0.5}}>DBL</span></span>}
            {localDuprRating&&<span style={{background:"#0a1551",color:"white",fontWeight:900,fontSize:"1rem",padding:"5px 16px",borderRadius:50,display:"flex",alignItems:"center",gap:6}}>{parseFloat(localDuprRating).toFixed(2)}<span style={{fontSize:"0.65rem",opacity:0.75,fontWeight:600,letterSpacing:0.5}}>SGL</span></span>}
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input
            type="text"
            placeholder="DUPR Player ID (e.g. AB1234)"
            value={duprIdInput}
            onChange={e=>setDuprIdInput(e.target.value.replace(/\s/g,"").slice(0,20))}
            style={{...inp,marginBottom:0,flex:1,fontSize:"0.85rem"}}
          />
          <button
            disabled={duprLinking||!duprIdInput.trim()}
            onClick={async()=>{
              const id=duprIdInput.trim().toUpperCase();
              if(!id)return;
              setDuprLinking(true);setDuprMsg("");
              try{
                const r=await fetch("/api/students?action=dupr-lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({duprId:id,email:user.email})});
                const data=await r.json();
                if(data.error==="DUPR_NOT_CONFIGURED"){setDuprMsg("ℹ DUPR sync unavailable — contact David to update your ratings.");}
                else if(data.error){setDuprMsg("⚠ "+data.error);}
                else{
                  const updates={duprId:id,duprRating:data.rating!=null?parseFloat(data.rating).toFixed(2):localDuprRating,duprDoublesRating:data.doublesRating!=null?parseFloat(data.doublesRating).toFixed(2):localDuprDoubles};
                  if(data.rating!=null)setLocalDuprRating(parseFloat(data.rating).toFixed(2));
                  if(data.doublesRating!=null)setLocalDuprDoubles(parseFloat(data.doublesRating).toFixed(2));
                  onUpdateUser({...user,...updates});
                  setDuprMsg("✓ DUPR profile linked"+(data.rating!=null?" — ratings updated":"")+"!");
                  setTimeout(()=>setDuprMsg(""),4000);
                }
              }catch(e){setDuprMsg("⚠ Could not connect. Try again.");}
              setDuprLinking(false);
            }}
            style={{background:"#0a1551",color:"white",border:"none",padding:"0 18px",borderRadius:50,cursor:duprLinking||!duprIdInput.trim()?"not-allowed":"pointer",fontWeight:700,fontSize:"0.82rem",flexShrink:0,whiteSpace:"nowrap",height:44,opacity:duprLinking||!duprIdInput.trim()?0.6:1}}
          >
            {duprLinking?"Linking…":"Link DUPR"}
          </button>
        </div>
        {duprMsg&&<div style={{fontSize:"0.78rem",marginTop:8,color:duprMsg.startsWith("✓")?"#16a34a":duprMsg.startsWith("ℹ")?"#6b7280":"#dc2626",fontWeight:600}}>{duprMsg}</div>}
        {(user.duprId||duprIdInput)&&!duprMsg&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:8}}>Player ID: {user.duprId||duprIdInput} · <a href={`https://dashboard.dupr.com/dashboard/player/${user.duprId||duprIdInput}/profile`} target="_blank" rel="noopener noreferrer" style={{color:"#0a1551",fontWeight:600}}>View Profile →</a></div>}
        {!user.duprId&&!duprIdInput&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:8}}>Find your Player ID in the DUPR app under your profile, or in the URL on dashboard.dupr.com.</div>}
      </div>
    </div>
  );
}

function Dashboard({user,setPage,lessons,onCancel,onUpdateLesson,dbLoaded}){
  const cancelledStatuses=["cancelled","late_cancel","cancelled_forgiven","weather_cancel","no_show"];
  // Auto-confirm lessons when student has accepted the Google Calendar invite
  useEffect(()=>{
    if(!dbLoaded||!onUpdateLesson)return;
    const pendingWithCal=lessons.filter(l=>l.status==="pending"&&l.gcalEventId&&!isPast(l.date,l.time));
    if(pendingWithCal.length===0)return;
    pendingWithCal.forEach(async l=>{
      try{
        const r=await fetch("/api/lessons?action=check-rsvp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({gcalEventId:l.gcalEventId})});
        const d=await r.json();
        if(d.anyAccepted)onUpdateLesson(l.id,{status:"confirmed"});
      }catch(e){}
    });
  },[dbLoaded]);
  const upcoming=lessons.filter(l=>l.status!=="archived"&&!isPast(l.date,l.time)&&!cancelledStatuses.includes(l.status));
  const history=lessons.filter(l=>l.status!=="archived"&&(isPast(l.date,l.time)||l.status==="completed"||cancelledStatuses.includes(l.status)));
  return(
    <div style={{maxWidth:700,margin:"0 auto",padding:"48px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontWeight:900,color:G,fontSize:"1.6rem",marginBottom:4}}>My Lessons</h2>
          <p style={{color:"#6b7280",fontSize:"0.92rem",display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
            Welcome back, <strong>{user.name}</strong>
            {user.memberType==="menlo"&&<span style={{background:"#e8f0ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.78rem",fontWeight:600}}>Menlo Circus Club</span>}
            {user.grandfathered&&<span style={{background:"#fffbea",color:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.78rem",fontWeight:600}}>Grandfathered</span>}
          </p>
          {(user.duprDoublesRating||user.duprRating)&&(
            <div style={{marginTop:14,background:"#f0f4ff",borderRadius:10,padding:"12px 18px",border:"1px solid #c7d2fe",display:"inline-block"}}>
              <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>DUPR Rating</div>
              <div style={{display:"flex",gap:28,alignItems:"flex-end"}}>
                {user.duprDoublesRating&&(
                  <div>
                    <div style={{fontSize:"1.8rem",fontWeight:900,color:"#0a1551",lineHeight:1}}>{parseFloat(user.duprDoublesRating).toFixed(2)}</div>
                    <div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",letterSpacing:0.8,marginTop:3,textTransform:"uppercase"}}>Doubles</div>
                  </div>
                )}
                {user.duprRating&&(
                  <div>
                    <div style={{fontSize:"1.8rem",fontWeight:900,color:"#1e3a5f",lineHeight:1}}>{parseFloat(user.duprRating).toFixed(2)}</div>
                    <div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",letterSpacing:0.8,marginTop:3,textTransform:"uppercase"}}>Singles</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button onClick={()=>setPage("booking")} style={{background:G,color:"white",border:"none",padding:"11px 24px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.92rem"}}>+ Book a Lesson</button>
      </div>
      {!dbLoaded?(
        <div style={{textAlign:"center",padding:"60px 0",color:"#9ca3af"}}>
          <div style={{fontSize:"1.5rem",marginBottom:12}}>⏳</div>
          <div style={{fontWeight:600}}>Loading your lessons…</div>
        </div>
      ):(
        <>
          <div style={{marginBottom:36}}>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Upcoming Lessons ({upcoming.length})</div>
            {upcoming.length===0
              ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No upcoming lessons. <span onClick={()=>setPage("booking")} style={{color:G,fontWeight:700,cursor:"pointer"}}>Book one now →</span></div>
              :upcoming.map(l=><LessonCard key={l.id} lesson={l} isMenlo={user.memberType==="menlo"} isHistory={false} onCancel={onCancel}/>)
            }
          </div>
          <div>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Lesson History ({history.length}) · Click to view</div>
            {history.length===0
              ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No past lessons yet.</div>
              :history.map(l=><LessonCard key={l.id} lesson={l} isMenlo={user.memberType==="menlo"} isHistory={true} onCancel={onCancel}/>)
            }
          </div>
        </>
      )}
    </div>
  );
}

function BookingPage({user,setPage,onAddLesson,stanfordEnabled=true}){
  const isMenlo=user.memberType==="menlo";
  const isGrandfathered=!!(user.grandfathered);
  const[step,setStep]=useState(1);
  const[lessonType,setLessonType]=useState("");
  const[duration,setDuration]=useState(null);
  const[date,setDate]=useState("");
  const[slot,setSlot]=useState(null);
  const[slotIdx,setSlotIdx]=useState(-1);
  const[focus,setFocus]=useState("");
  const[notes,setNotes]=useState("");
  const[partner,setPartner]=useState({firstName:"",lastName:"",email:""});
  const[groupSize,setGroupSize]=useState(3);
  const[groupMembers,setGroupMembers]=useState([{firstName:"",lastName:"",email:""},{firstName:"",lastName:"",email:""},{firstName:"",lastName:"",email:""}]);
  const[submitting,setSubmitting]=useState(false);
  const[done,setDone]=useState(false);
  const[error,setError]=useState("");
  const[gcalLink,setGcalLink]=useState("");
  const[bookedSummary,setBookedSummary]=useState(null);
  const[busyTimes,setBusyTimes]=useState([]);
  const[loadingSlots,setLoadingSlots]=useState(false);
  const[fullyBookedDays,setFullyBookedDays]=useState(new Set());
  const[slotCounts,setSlotCounts]=useState(new Map());
  const[loadingAvail,setLoadingAvail]=useState(false);

  // Fetch availability as soon as duration is selected (runs in background on step 1)
  // so by the time the student hits step 2 the greyed-out days are already ready
  useEffect(()=>{
    if(!duration)return;
    const today=new Date();
    const startStr=toDS(today);
    const endStr=toDS(addDays(today,30));
    const mt=isMenlo?"menlo":"public";
    setLoadingAvail(true);
    setFullyBookedDays(new Set());
    setSlotCounts(new Map());
    fetch("/api/get-busy-times?date="+startStr+"&endDate="+endStr+"&memberType="+mt)
      .then(r=>r.json())
      .then(data=>{
        const busyAll=data.busy||[];
        const busyByDay={};
        busyAll.forEach(b=>{const day=b.start.substring(0,10);if(!busyByDay[day])busyByDay[day]=[];busyByDay[day].push(b);});
        const fullyBooked=new Set();
        const counts=new Map();
        for(let i=0;i<=30;i++){
          const d=addDays(today,i);const ds=toDS(d);
          const busyForDay=busyByDay[ds]||[];
          const avail=getSlots(ds,mt,duration).filter(s=>!busyForDay.some(b=>{const bufA=b.bufferAfter??30;const bufB=b.bufferBefore??30;return s.s<(b.endMins+bufA)&&s.e>(b.startMins-bufB);}));
          if(avail.length===0)fullyBooked.add(ds);
          else counts.set(ds,avail.length);
        }
        setFullyBookedDays(fullyBooked);
        setSlotCounts(counts);
        setLoadingAvail(false);
      })
      .catch(()=>setLoadingAvail(false));
  },[duration,isMenlo]);

  const MCC_CLINIC_RATE=35; // per person
  const PRICES={
    private:{60:isGrandfathered?120:isMenlo?115:120, 90:isGrandfathered?180:isMenlo?170:180},
    semi:   {60:isMenlo?120:140, 90:isMenlo?180:210},
    clinic: {60:MCC_CLINIC_RATE, 90:MCC_CLINIC_RATE},
    group:  {60:140, 90:210},
  };
  const LESSONS=[{id:"private",icon:"🎯",label:"Private",desc:"1-on-1 coaching"},{id:"semi",icon:"👥",label:"Semi-Private",desc:"2 students"},{id:"group",icon:"🏆",label:"Group",desc:"3-4 students"},...(isMenlo?[{id:"clinic",icon:"🎾",label:"Clinic",desc:"5-8 MCC members"}]:[{id:"clinic-contact",icon:"🎾",label:"Clinic",desc:"5-8 players"}])];
  const price=lessonType==="clinic"?(duration&&groupSize>=5?MCC_CLINIC_RATE*groupSize:null):lessonType&&duration&&PRICES[lessonType]?PRICES[lessonType][duration]:null;
  const slots=date?getSlots(date,isMenlo?"menlo":"public",duration||60).filter(s=>!busyTimes.some(b=>{const bufA=b.bufferAfter??30;const bufB=b.bufferBefore??30;return s.s<(b.endMins+bufA)&&s.e>(b.startMins-bufB);})):[];
  const toTime24=(mins)=>{const h=Math.floor(mins/60),m=mins%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");};
  const toTimeStr=(s,e)=>fmt(s)+" - "+fmt(e);

  // Private = 3 steps (skip participants); Semi/Group/Clinic = 4 steps
  const isPrivate=lessonType==="private";
  const displaySteps=isPrivate?["Type","Date & Time","Confirm"]:["Type","Date & Time","Participants","Confirm"];
  const displayStep=isPrivate&&step===4?3:step;

  const step1Done=lessonType&&lessonType!=="clinic-contact"&&duration&&(lessonType!=="group"||groupSize)&&(lessonType!=="clinic"||(groupSize>=5&&groupSize<=8));
  const step2Done=date&&slot;
  const step3Done=isPrivate?true:lessonType==="semi"?(partner.firstName.trim()!==""&&partner.lastName.trim()!==""):(lessonType==="group"||lessonType==="clinic")?groupMembers.slice(0,groupSize-1).every(m=>m.firstName.trim()!==""&&m.lastName.trim()!==""):true;
  const canConfirm=step1Done&&step2Done&&step3Done;

  const handleBook=async()=>{
    setSubmitting(true);setError("");
    const startTime=toTime24(slot.s);
    const endTime=toTime24(slot.e);
    const timeStr=toTimeStr(slot.s,slot.e);
    const lessonLabel=lessonType==="private"?"Private":lessonType==="semi"?"Semi-Private":lessonType==="clinic"?"Clinic":"Group";
    const nameInitial=(first,last)=>{const f=(first||"").trim(),l=(last||"").trim();return l?f+" "+l[0].toUpperCase():f;};
    const bookerParts=user.name.trim().split(/\s+/);
    const bookerInitial=nameInitial(bookerParts[0],bookerParts.slice(1).join(" "));
    const partnerFull=(partner.firstName+" "+partner.lastName).trim();
    const memberNames=lessonType==="semi"?[user.name,partnerFull]:(lessonType==="group"||lessonType==="clinic")?[user.name,...groupMembers.slice(0,groupSize-1).map(m=>(m.firstName+" "+m.lastName).trim())]:[user.name];
    const participantInitials=lessonType==="semi"?[bookerInitial,nameInitial(partner.firstName,partner.lastName)]:(lessonType==="group"||lessonType==="clinic")?[bookerInitial,...groupMembers.slice(0,groupSize-1).map(m=>nameInitial(m.firstName,m.lastName))]:[bookerInitial];
    const summary=participantInitials.join("/")+(lessonType==="clinic"?" pb clinic":" pb lesson");
    const partnerInfo=lessonType==="semi"?"\nPartner: "+partnerFull+(partner.email?" ("+partner.email+")":""):"";
    const groupInfo=(lessonType==="group"||lessonType==="clinic")?"\n"+(lessonType==="clinic"?"Participants":"Group")+": "+memberNames.join(", "):"";
    const partnerEmail=partner.email;
    const location=!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063, USA":"Menlo Circus Club, 190 Park Ln, Atherton, CA 94027";
    const ticketId=generateTicket();
    const description="Ticket: "+ticketId+"\nStudent: "+user.name+"\nEmail: "+user.email+"\nType: "+lessonLabel+" "+duration+"min\nFocus: "+(focus||"Not specified")+"\nNotes: "+(notes||"None")+partnerInfo+groupInfo+"\nLocation: "+location+"\nManage: https://dmpickleball.com";
    const additionalEmails=lessonType==="semi"&&partnerEmail?[partnerEmail]:(lessonType==="group"||lessonType==="clinic")?groupMembers.slice(0,groupSize-1).map(m=>m.email).filter(Boolean):[];
    let eventId="";
    try{
      const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary,description,date,startTime,endTime,location,studentEmail:user.email,studentName:user.name,additionalEmails})});
      const d=await r.json();
      if(d.eventId)eventId=d.eventId;
      if(!d.attendeesAdded)console.warn("GCal attendees NOT added:",d.attendeeError||"unknown reason","emails attempted:",user.email,...(additionalEmails||[]));
      else console.log("GCal attendees added OK, count:",d.attendeeCount);
    }catch(e){console.error("GCal:",e);}
    const startISO=date+"T"+startTime+":00";
    const endISO=date+"T"+endTime+":00";
    const link="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(summary)+"&dates="+startISO.replace(/[-:]/g,"").slice(0,15)+"/"+endISO.replace(/[-:]/g,"").slice(0,15)+"&details="+encodeURIComponent(description)+"&location="+encodeURIComponent(location);
    const priceNote=lessonType==="semi"?" ($"+(price/2)+"/person)":lessonType==="group"?" (split equally)":"";
    const sendEmail=(to,subject,text,replyTo,calLink,fromAlias)=>{const html=makeEmailHtml(text,calLink);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,...(replyTo?{replyTo}:{}),...(fromAlias?{fromAlias}:{})})}).catch(()=>{});};
    const studentText="Hi "+user.name+",\n\nYour pickleball lesson is confirmed!\n\nRef: "+ticketId+"\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+duration+" min\nPrice: $"+price+" total"+priceNote+"\nFocus: "+(focus||"Not specified")+"\nLocation: "+location+"\n\nManage your booking: https://dmpickleball.com\n\nSee you on the court!\nCoach David";
    await sendEmail(user.email,"Your lesson is booked - "+fmtDateShort(date),studentText,user.email,link,"book@dmpickleball.com");
    const adminText="New lesson booked!\n\nRef: "+ticketId+"\nStudent: "+user.name+"\nEmail: "+user.email+"\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+duration+" min\nFocus: "+(focus||"Not specified")+"\nNotes: "+(notes||"None")+partnerInfo+groupInfo+"\nPrice: $"+price+" total"+priceNote+"\nLocation: "+location;
    await sendEmail("david@dmpickleball.com","New booking: "+summary+" - "+fmtDateShort(date),adminText,user.email,null,"noreply@dmpickleball.com");
    if(lessonType==="semi"&&partnerEmail){const partnerText="Hi "+partnerFull+",\n\n"+user.name+" has added you to a pickleball lesson!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: Semi-Private · "+duration+" min\nFocus: "+(focus||"Not specified")+"\nLocation: "+location+"\n\nSee you on the court!\nCoach David";await sendEmail(partnerEmail,"You have been added to a pickleball lesson - "+fmtDateShort(date),partnerText,"book@dmpickleball.com",link,"book@dmpickleball.com");}
    if(lessonType==="group"||lessonType==="clinic"){for(const m of groupMembers.slice(0,groupSize-1)){if(m.email){const mFull=(m.firstName+" "+m.lastName).trim();const typeWord=lessonType==="clinic"?"clinic":"group pickleball lesson";const groupMemberText="Hi "+mFull+",\n\n"+user.name+" has added you to a pickleball "+typeWord+"!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail(m.email,"You have been added to a pickleball "+typeWord+" - "+fmtDateShort(date),groupMemberText,"book@dmpickleball.com",link,"book@dmpickleball.com");}}}
    const newLesson={id:Date.now(),date,time:timeStr,type:lessonLabel,duration:duration+" min",status:"confirmed",focus,notes:"",photos:[],videos:[],gcalEventId:eventId,ticketId,partnerEmail:lessonType==="semi"?partnerEmail:"",groupEmails:(lessonType==="group"||lessonType==="clinic")?groupMembers.slice(0,groupSize-1).map(m=>m.email).filter(Boolean):[],members:memberNames.slice(1),createdAt:new Date().toISOString()};
    onAddLesson(newLesson);
    setGcalLink(link);
    setBookedSummary({date,timeStr,lessonLabel,duration,focus,price,summary});
    setSubmitting(false);
    setDone(true);
  };

  if(done)return(
    <div style={{maxWidth:560,margin:"60px auto",padding:"0 24px",textAlign:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:G,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"1.8rem",color:"white",fontWeight:900}}>✓</div>
        <h2 style={{fontWeight:900,color:G,marginBottom:8}}>You are booked!</h2>
        <p style={{color:"#6b7280",marginBottom:24,lineHeight:1.7}}>Confirmation sent to <strong>{user.email}</strong>.</p>
        <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:24,textAlign:"left"}}>
          <div style={{fontWeight:700,marginBottom:12,color:G}}>Booking Summary</div>
          <div style={{fontSize:"0.9rem",color:"#4b5563",lineHeight:2}}>
            <div>{bookedSummary&&fmtDate(bookedSummary.date)}</div>
            <div>{bookedSummary?.timeStr}</div>
            <div>{bookedSummary?.lessonLabel} · {bookedSummary?.duration} min</div>
            {bookedSummary?.focus&&<div style={{color:G,fontWeight:600}}>{bookedSummary.focus}</div>}
            <div><strong>${bookedSummary?.price} total</strong>{lessonType==="semi"&&<span style={{color:"#9ca3af"}}> · ${bookedSummary.price/2}/person</span>}{lessonType==="group"&&<span style={{color:"#9ca3af"}}> · split equally</span>}</div>
            <div style={{display:"flex",alignItems:"flex-start",gap:6}}><span style={{color:"#9ca3af",fontSize:"0.8rem",fontWeight:700,paddingTop:2,whiteSpace:"nowrap"}}>📍 Location:</span><a href={!isMenlo?"https://maps.google.com/?q=Andrew+Spinas+Park,+3003+Bay+Rd,+Redwood+City,+CA+94063":"https://maps.google.com/?q=Menlo+Circus+Club,+190+Park+Ln,+Atherton,+CA+94027"} target="_blank" rel="noreferrer" style={{color:G,fontWeight:600}}>{!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Menlo Circus Club, 190 Park Ln, Atherton"}</a></div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <a href={gcalLink} target="_blank" rel="noreferrer" style={{background:G,color:"white",padding:"13px",borderRadius:50,fontWeight:700,textDecoration:"none",fontSize:"0.95rem"}}>Add to Google Calendar</a>
          <button onClick={()=>setPage("dashboard")} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>View My Lessons</button>
        </div>
      </div>
    </div>
  );

  if(isMenlo&&!stanfordEnabled){
    return(
      <div style={{maxWidth:620,margin:"0 auto",padding:"32px 24px"}}>
        <div style={{background:"#fffbea",border:"1.5px solid #f4c430",borderRadius:12,padding:"28px 32px",textAlign:"center"}}>
          <div style={{fontWeight:800,fontSize:"1.05rem",color:"#92400e",marginBottom:8}}>Stanford Lessons Temporarily Unavailable</div>
          <p style={{color:"#7a5800",fontSize:"0.9rem",lineHeight:1.7,marginBottom:16}}>Coach David has temporarily paused Menlo Circus Club bookings. Please check back soon or get in touch directly.</p>
          <button onClick={()=>setPage("contact")} style={{background:G,color:"white",border:"none",padding:"10px 24px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.9rem"}}>Contact Coach David</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{maxWidth:620,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:28}}>
        <h2 style={{fontWeight:900,color:G,fontSize:"1.6rem",marginBottom:4}}>Book a Lesson</h2>
        <p style={{color:"#6b7280",fontSize:"0.88rem",display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
          Booking as <strong>{user.name}</strong>
          {isMenlo&&<span style={{background:"#e8f0ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:600}}>Menlo Circus Club</span>}
          {isGrandfathered&&<span style={{background:"#fffbea",color:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:600}}>Grandfathered</span>}
        </p>
      </div>

      <div style={{display:"flex",alignItems:"center",marginBottom:32,gap:0}}>
        {displaySteps.map((s,i)=>{
          const n=i+1;
          const active=displayStep===n;
          const done=displayStep>n;
          return(
            <div key={i} style={{display:"flex",alignItems:"center",flex:i<displaySteps.length-1?1:"auto"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:done?G:active?G:"#e5e7eb",color:done||active?"white":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.85rem",cursor:done?"pointer":"default",transition:"all 0.2s"}}
                  onClick={()=>{if(!done)return;if(isPrivate){setStep(n===3?4:n);}else{setStep(n);}}}>
                  {done?"✓":n}
                </div>
                <div style={{fontSize:"0.65rem",fontWeight:600,color:active?G:done?G:"#9ca3af",whiteSpace:"nowrap",textAlign:"center"}}>{s}</div>
              </div>
              {i<displaySteps.length-1&&<div style={{flex:1,height:2,background:done?G:"#e5e7eb",margin:"0 8px",marginBottom:16,transition:"all 0.2s"}}/>}
            </div>
          );
        })}
      </div>

      {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"12px 16px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}

      {step===1&&(
        <div>
          <div style={{...lbl,marginBottom:12}}>Select Lesson Type</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24}}>
            {LESSONS.map(l=>{
              // Non-MCC Clinic card — contact only, not bookable
              if(l.id==="clinic-contact"){return(<div key={l.id} style={{background:"#f9fafb",border:"2px solid #e5e7eb",borderRadius:12,padding:"16px",textAlign:"center",opacity:0.85}}><div style={{fontSize:28,marginBottom:6}}>{l.icon}</div><div style={{fontWeight:700,fontSize:"0.95rem",color:"#1a1a1a"}}>{l.label}</div><div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:2,marginBottom:8}}>{l.desc}</div><button onClick={()=>setPage("contact")} style={{background:G,color:"white",border:"none",padding:"6px 14px",borderRadius:50,fontSize:"0.78rem",fontWeight:700,cursor:"pointer"}}>Contact me</button></div>);}
              // Clinic (MCC only): per-person rate
              if(l.id==="clinic"){const priceLabel=duration?"$"+MCC_CLINIC_RATE+"/person":"Select duration";return(<div key={l.id} onClick={()=>{setLessonType(l.id);}} style={{background:lessonType===l.id?"#e8f0ee":"white",border:"2px solid "+(lessonType===l.id?G:"#e5e7eb"),borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>{l.icon}</div><div style={{fontWeight:700,fontSize:"0.95rem",color:lessonType===l.id?G:"#1a1a1a"}}>{l.label}</div><div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:2,marginBottom:8}}>{l.desc}</div><div style={{fontWeight:800,color:G,fontSize:"0.95rem"}}>{priceLabel}</div><div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>5–8 participants</div></div>);}
              // Standard lesson types
              const p=duration&&PRICES[l.id]?PRICES[l.id][duration]:null;
              const totalLabel=!p?"Select duration":"$"+p+" total";
              const subLabel=!p?null:l.id==="semi"?"$"+(p/2)+"/person":l.id==="group"?"split equally":null;
              return(<div key={l.id} onClick={()=>{setLessonType(l.id);}} style={{background:lessonType===l.id?"#e8f0ee":"white",border:"2px solid "+(lessonType===l.id?G:"#e5e7eb"),borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>{l.icon}</div><div style={{fontWeight:700,fontSize:"0.95rem",color:lessonType===l.id?G:"#1a1a1a"}}>{l.label}</div><div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:2,marginBottom:8}}>{l.desc}</div><div style={{fontWeight:800,color:G,fontSize:"0.95rem"}}>{totalLabel}</div>{subLabel&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>{subLabel}</div>}</div>);
            })}
          </div>
          {lessonType==="group"&&(
            <div style={{marginBottom:24}}>
              <div style={{...lbl,marginBottom:12}}>Group Size</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[3,4].map(n=>(<div key={n} onClick={()=>setGroupSize(n)} style={{background:groupSize===n?"#e8f0ee":"white",border:"2px solid "+(groupSize===n?G:"#e5e7eb"),borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"center"}}><div style={{fontWeight:700,fontSize:"1rem",color:groupSize===n?G:"#1a1a1a"}}>{n} students</div><div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:3}}>{n-1} additional name{n-1>1?"s":""} required</div></div>))}
              </div>
            </div>
          )}
          {lessonType==="clinic"&&(
            <div style={{marginBottom:24}}>
              <div style={{...lbl,marginBottom:12}}>Clinic Size</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[5,6,7,8].map(n=>(<div key={n} onClick={()=>setGroupSize(n)} style={{background:groupSize===n?"#e8f0ee":"white",border:"2px solid "+(groupSize===n?G:"#e5e7eb"),borderRadius:12,padding:"12px 6px",cursor:"pointer",textAlign:"center"}}><div style={{fontWeight:700,fontSize:"1rem",color:groupSize===n?G:"#1a1a1a"}}>{n}</div><div style={{fontSize:"0.68rem",color:"#6b7280",marginTop:2}}>players</div></div>))}
              </div>
              {duration&&groupSize>=5&&<div style={{marginTop:10,fontSize:"0.82rem",color:G,fontWeight:700}}>Total: ${MCC_CLINIC_RATE*groupSize} ({groupSize} × ${MCC_CLINIC_RATE}/person)</div>}
            </div>
          )}
          <div style={{...lbl,marginBottom:12}}>Select Duration</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32}}>
            {[60,90].map(d=>(<div key={d} onClick={()=>setDuration(d)} style={{background:duration===d?"#e8f0ee":"white",border:"2px solid "+(duration===d?G:"#e5e7eb"),borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"center"}}><div style={{fontWeight:700,fontSize:"1rem",color:duration===d?G:"#1a1a1a"}}>{d} min</div></div>))}
          </div>
          <button onClick={()=>setStep(2)} disabled={!step1Done} style={{width:"100%",background:step1Done?G:"#e5e7eb",color:step1Done?"white":"#9ca3af",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:step1Done?"pointer":"not-allowed",fontSize:"1rem"}}>
            Next: Select Date & Time →
          </button>
        </div>
      )}

      {step===2&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{...lbl}}>Select a Date</div>
            {loadingAvail&&<span style={{fontSize:"0.75rem",color:"#9ca3af",display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:10,height:10,border:"2px solid #9ca3af",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> Checking availability…</span>}
          </div>
          <div style={{marginBottom:20,pointerEvents:loadingAvail?"none":"auto",opacity:loadingAvail?0.5:1,transition:"opacity 0.2s"}}>
            <CalendarPicker value={date} onChange={async d=>{setSlot(null);setSlotIdx(-1);if(!d){setDate('');setBusyTimes([]);return;}setDate(d);setLoadingSlots(true);try{const r=await fetch("/api/get-busy-times?date="+d);const data=await r.json();setBusyTimes(data.busy||[]);}catch(e){setBusyTimes([]);}setLoadingSlots(false);}} memberType={isMenlo?"menlo":"public"} fullyBookedDays={fullyBookedDays} slotCounts={slotCounts}/>
          </div>
          {date&&(
            <div style={{marginBottom:24}}>
              <div style={{...lbl,marginBottom:10}}>Select a Time — {fmtDateShort(date)}</div>
              {loadingSlots
                ?<div style={{textAlign:"center",padding:"20px",color:"#6b7280",fontSize:"0.88rem"}}>Checking availability...</div>
                :slots.length===0
                  ?<div style={{background:"#fef2f2",borderRadius:8,padding:"14px",color:"#991b1b",fontSize:"0.88rem"}}>No available slots on this date. Please pick another day.</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
                    {slots.map((s,i)=>(<div key={i} onClick={()=>{setSlot(s);setSlotIdx(i);}} style={{background:slotIdx===i?"#e8f0ee":"white",border:"2px solid "+(slotIdx===i?G:"#e5e7eb"),borderRadius:10,padding:"10px",cursor:"pointer",textAlign:"center",fontWeight:slotIdx===i?700:500,color:slotIdx===i?G:"#374151",fontSize:"0.85rem"}}>{fmt(s.s)}</div>))}
                  </div>
              }
            </div>
          )}
          {slot&&date&&(()=>{const lh=Math.floor(slot.s/60),lm=slot.s%60;const lessonDt=new Date(date+"T"+String(lh).padStart(2,"0")+":"+String(lm).padStart(2,"0")+":00");const hrs=(lessonDt-new Date())/(1000*60*60);return hrs<12?(
            <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:"0.85rem",color:"#991b1b",fontWeight:600}}>
              ⚠️ This slot is within 12 hours. You'll have 15 minutes after booking to cancel if it was accidental — after that, cancellation is closed.
            </div>
          ):null;})()}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(1)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"14px",borderRadius:50,fontWeight:600,cursor:"pointer",fontSize:"0.95rem"}}>← Back</button>
            <button onClick={()=>setStep(isPrivate?4:3)} disabled={!step2Done} style={{flex:2,background:step2Done?G:"#e5e7eb",color:step2Done?"white":"#9ca3af",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:step2Done?"pointer":"not-allowed",fontSize:"0.95rem"}}>
              Next: {isPrivate?"Review & Confirm":"Add Participants"} →
            </button>
          </div>
        </div>
      )}

      {step===3&&!isPrivate&&(
        <div>
          {lessonType==="semi"&&(
            <div style={{marginBottom:20}}>
              <div style={{...lbl,marginBottom:8}}>Partner <span style={{color:"#dc2626",fontWeight:700}}>*</span></div>
              <div style={{background:"#f9f9f6",borderRadius:10,padding:"16px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <input placeholder="First Name" value={partner.firstName} onChange={e=>setPartner({...partner,firstName:capWords(e.target.value)})} style={{...inp,marginBottom:0,border:partner.firstName?"1.5px solid #e5e7eb":"1.5px solid #fca5a5"}}/>
                  <input placeholder="Last Name" value={partner.lastName} onChange={e=>setPartner({...partner,lastName:capWords(e.target.value)})} style={{...inp,marginBottom:0,border:partner.lastName?"1.5px solid #e5e7eb":"1.5px solid #fca5a5"}}/>
                </div>
                <input placeholder="Email (optional — sends calendar invite)" value={partner.email} onChange={e=>setPartner({...partner,email:e.target.value})} style={{...inp,marginBottom:0}}/>
              </div>
            </div>
          )}
          {(lessonType==="group"||lessonType==="clinic")&&(
            <div style={{marginBottom:20}}>
              <div style={{...lbl,marginBottom:8}}>{lessonType==="clinic"?"Clinic Participants":"Additional Participants"} <span style={{color:"#dc2626",fontWeight:700}}>*</span></div>
              <div style={{fontSize:"0.82rem",color:"#6b7280",marginBottom:12}}>You are Person 1. Enter the remaining {groupSize-1} participant{groupSize-1>1?"s":""} below.</div>
              {Array(groupSize-1).fill(null).map((_,i)=>(
                <div key={i} style={{background:"#f9f9f6",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
                  <div style={{fontSize:"0.82rem",fontWeight:700,color:"#6b7280",marginBottom:8}}>Person {i+2}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <input placeholder="First Name" value={groupMembers[i]?.firstName||""} onChange={e=>{const m=[...groupMembers];m[i]={...m[i],firstName:capWords(e.target.value)};setGroupMembers(m);}} style={{...inp,marginBottom:0,border:groupMembers[i]?.firstName?"1.5px solid #e5e7eb":"1.5px solid #fca5a5"}}/>
                    <input placeholder="Last Name" value={groupMembers[i]?.lastName||""} onChange={e=>{const m=[...groupMembers];m[i]={...m[i],lastName:capWords(e.target.value)};setGroupMembers(m);}} style={{...inp,marginBottom:0,border:groupMembers[i]?.lastName?"1.5px solid #e5e7eb":"1.5px solid #fca5a5"}}/>
                  </div>
                  <input placeholder="Email (optional — sends calendar invite)" value={groupMembers[i]?.email||""} onChange={e=>{const m=[...groupMembers];m[i]={...m[i],email:e.target.value};setGroupMembers(m);}} style={{...inp,marginBottom:0}}/>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(2)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"14px",borderRadius:50,fontWeight:600,cursor:"pointer",fontSize:"0.95rem"}}>← Back</button>
            <button onClick={()=>setStep(4)} disabled={!step3Done} style={{flex:2,background:step3Done?G:"#e5e7eb",color:step3Done?"white":"#9ca3af",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:step3Done?"pointer":"not-allowed",fontSize:"0.95rem"}}>
              Next: Review & Confirm →
            </button>
          </div>
        </div>
      )}

      {step===4&&(
        <div>
          <div style={{marginBottom:16}}>
            <div style={{...lbl,marginBottom:6}}>Focus Area <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></div>
            <select value={focus} onChange={e=>setFocus(e.target.value)} style={{...inp,marginBottom:0}}>
              <option value="">No specific focus</option>
              {FOCUS_AREAS.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{...lbl,marginBottom:6}}>Notes for Coach David <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything Coach David should know..." style={{...inp,height:72,resize:"vertical",fontFamily:"inherit",marginBottom:0}}/>
          </div>
          <div style={{background:"#f9f9f6",borderRadius:12,padding:"24px",marginBottom:20,border:"1.5px solid #e5e7eb"}}>
            <div style={{fontWeight:700,color:G,marginBottom:16,fontSize:"1rem"}}>Booking Summary</div>
            <div style={{fontSize:"0.92rem",color:"#374151",lineHeight:2.2}}>
              <div><strong style={{fontSize:"1rem"}}>{fmtDate(date)}</strong></div>
              <div><strong style={{fontSize:"1rem"}}>{slot&&toTimeStr(slot.s,slot.e)}</strong></div>
              <div><strong>{lessonType==="private"?"Private":lessonType==="semi"?"Semi-Private":lessonType==="clinic"?"Clinic":"Group"} · {duration} min</strong></div>
              {focus&&<div style={{color:G,fontWeight:600}}>Focus: {focus}</div>}
              <div><strong>${price} total</strong>{lessonType==="semi"&&<span style={{color:"#9ca3af",fontWeight:400,fontSize:"0.85rem"}}> · ${price/2}/person</span>}{lessonType==="group"&&<span style={{color:"#9ca3af",fontWeight:400,fontSize:"0.85rem"}}> · split equally</span>}{lessonType==="clinic"&&<span style={{color:"#9ca3af",fontWeight:400,fontSize:"0.85rem"}}> · ${MCC_CLINIC_RATE}/person × {groupSize}</span>}</div>
              <div style={{display:"flex",alignItems:"flex-start",gap:6}}><span style={{color:"#9ca3af",fontSize:"0.8rem",fontWeight:700,paddingTop:2,whiteSpace:"nowrap"}}>📍 Location:</span><a href={!isMenlo?"https://maps.google.com/?q=Andrew+Spinas+Park,+3003+Bay+Rd,+Redwood+City,+CA+94063":"https://maps.google.com/?q=Menlo+Circus+Club,+190+Park+Ln,+Atherton,+CA+94027"} target="_blank" rel="noreferrer" style={{color:G,fontWeight:600}}>{!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Menlo Circus Club, 190 Park Ln, Atherton"}</a></div>
              {lessonType==="semi"&&<div>Partner: {(partner.firstName+" "+partner.lastName).trim()}</div>}
              {lessonType==="group"&&<div>Group: {memberNames.join(", ")}</div>}
              {lessonType==="clinic"&&<div>Participants: {memberNames.join(", ")}</div>}
            </div>
          </div>
          {(()=>{
            const lh=Math.floor((slot?.s||0)/60),lm=(slot?.s||0)%60;
            const lessonDt=new Date(date+"T"+String(lh).padStart(2,"0")+":"+String(lm).padStart(2,"0")+":00");
            const within24=slot&&date&&((lessonDt-new Date())/(1000*60*60))<12;
            return within24?(
              <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:"0.85rem",color:"#991b1b",fontWeight:600}}>
                ⚠️ This lesson is within 12 hours. You'll have 15 minutes after booking to cancel if it was accidental — after that, cancellation is closed.
              </div>
            ):(
              <div style={{background:"#fffbea",border:"1.5px solid #f4c430",borderRadius:8,padding:"10px 16px",marginBottom:20,fontSize:"0.85rem",color:"#7a5800"}}>
                ⚠️ Cancellation Policy: Please cancel at least 12 hours before your lesson.
              </div>
            );
          })()}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(isPrivate?2:3)} disabled={submitting} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"14px",borderRadius:50,fontWeight:600,cursor:submitting?"not-allowed":"pointer",fontSize:"0.95rem",opacity:submitting?0.5:1}}>← Back</button>
            <button onClick={handleBook} disabled={submitting} style={{flex:2,background:G,color:"white",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:submitting?"not-allowed":"pointer",fontSize:"0.95rem",opacity:submitting?0.7:1}}>
              {submitting?"Confirming...":"Confirm Booking ✓"}
            </button>
          </div>
          {submitting&&(
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(255,255,255,0.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}}>
              <div style={{width:48,height:48,border:"5px solid #e8f0ee",borderTop:"5px solid "+G,borderRadius:"50%",animation:"spin 0.9s linear infinite",marginBottom:20}}/>
              <div style={{fontWeight:700,fontSize:"1.1rem",color:G}}>Booking your lesson...</div>
              <div style={{fontSize:"0.88rem",color:"#6b7280",marginTop:8}}>Setting up your calendar event, hang tight!</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getRate(type,duration,memberType){
  if(memberType==="menlo"){
    if(type==="Private")return duration===90?170:115;
    if(type==="Semi-Private")return duration===90?180:120;
    if(type==="Clinic")return 35; // per-person rate; actual total = 35 × personCount
    return duration===90?210:140;
  }
  if(type==="Private")return duration===90?180:120;
  if(type==="Semi-Private")return duration===90?210:140;
  return duration===90?210:140;
}
function getMenloNet(gross){return Math.round(gross*0.7*100)/100;}
function getDurationMins(s){return parseInt(s)||60;}
function getEarnings(allLessons,mockUsers,range,customStart,customEnd){
  const now=new Date();
  let total=0,menloGross=0,menloNet=0;
  const rows=[];
  Object.entries(allLessons||{}).forEach(([email,lessons])=>{
    if(!Array.isArray(lessons))return;
    const u=mockUsers[email]||{memberType:"public"};
    lessons.filter(l=>{
      // A lesson counts toward earnings if it happened OR if a charge applies (late/no-show)
      const chargeReason=l.cancelReason==="late"||l.cancelReason==="no_show"||l.status==="late_cancel"||l.status==="no_show";
      const noCharge=l.status==="cancelled"||l.status==="cancelled_forgiven"||l.status==="weather_cancel"||(l.status==="cancelled"&&(l.cancelReason==="weather"||l.cancelReason==="student"||l.cancelReason==="admin"||l.cancelReason==="forgiven"));
      if(noCharge&&!chargeReason)return false;
      if(chargeReason)return true;
      return new Date(l.date+"T23:59:59")<now||l.status==="completed";
    }).forEach(l=>{
      const d=new Date(l.date+"T12:00:00");
      const mins=getDurationMins(l.duration);
      let inRange=false;
      if(range==="week"){const s=new Date(now);s.setDate(now.getDate()-now.getDay());inRange=d>=s&&d<=now;}
      else if(range==="month"){inRange=d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}
      else if(range==="custom"&&customStart&&customEnd){const s=new Date(customStart+"T00:00:00");const e=new Date(customEnd+"T23:59:59");inRange=d>=s&&d<=e;}
      else{inRange=d.getFullYear()===now.getFullYear();}
      if(!inRange)return;
      const gross=l.customPrice!=null?l.customPrice:getRate(l.type,mins,u.memberType);
      const net=l.customPrice!=null?l.customPrice:(u.memberType==="menlo"?getMenloNet(gross):gross);
      total+=net;
      if(u.memberType==="menlo"){menloGross+=gross;menloNet+=net;}
      rows.push({email,id:l.id,name:u.name||email,date:l.date,type:l.type,duration:l.duration,gross,net,isMenlo:u.memberType==="menlo",ticketId:l.ticketId||"",focus:l.focus||"",notes:l.notes||"",customPrice:l.customPrice});
    });
  });
  return{total,menloGross,menloNet,rows};
}

function LocationsTab({locations,setLocations}){
  const[editingId,setEditingId]=useState(null);const[editPriceId,setEditPriceId]=useState(null);const[editPriceVal,setEditPriceVal]=useState("");
  const[editName,setEditName]=useState("");
  const[editAddress,setEditAddress]=useState("");
  const[adding,setAdding]=useState(false);
  const[newName,setNewName]=useState("");
  const[newAddress,setNewAddress]=useState("");
  const[deleteConfirm,setDeleteConfirm]=useState(null);
  const[saving,setSaving]=useState(false);

  const startEdit=(loc)=>{setEditingId(loc.id);setEditName(loc.name);setEditAddress(loc.address);};
  const cancelEdit=()=>{setEditingId(null);setEditName("");setEditAddress("");};

  const saveEdit=async(id)=>{
    setSaving(true);
    await fetch("/api/locations?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,name:editName,address:editAddress})});
    setLocations(prev=>prev.map(l=>l.id===id?{...l,name:editName,address:editAddress}:l));
    cancelEdit();
    setSaving(false);
  };

  const handleDelete=async(id)=>{
    await fetch("/api/locations?action=delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setLocations(prev=>prev.filter(l=>l.id!==id));
    setDeleteConfirm(null);
  };

  const handleAdd=async()=>{
    if(!newName||!newAddress)return;
    setSaving(true);
    const r=await fetch("/api/locations?action=add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName,address:newAddress})});
    const data=await r.json();
    if(data.location)setLocations(prev=>[...prev,data.location].sort((a,b)=>a.name.localeCompare(b.name)));
    setNewName("");setNewAddress("");setAdding(false);
    setSaving(false);
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontWeight:800,fontSize:"1.1rem"}}>Known Locations</div>
          <div style={{fontSize:"0.82rem",color:"#6b7280",marginTop:2}}>Manage locations used in scheduling</div>
        </div>
        <button onClick={()=>{setAdding(true);setEditingId(null);}} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>+ Add Location</button>
      </div>

      {adding&&(
        <div style={{background:"#e8f0ee",borderRadius:12,padding:"20px",marginBottom:20,border:"1.5px solid "+G}}>
          <div style={{fontWeight:700,marginBottom:12,color:G}}>Add New Location</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Search for a location</label>
              <LocationInput value={newAddress} onChange={(v,s)=>{setNewAddress(v);if(s)setNewName(s.name||v);else setNewName(v);}} placeholder="Type a park or address..." style={{...inp,marginBottom:0}}/>
            </div>
            <div>
              <label style={lbl}>Custom Label <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></label>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Rick's House" style={{...inp,marginBottom:0}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAdding(false);setNewName("");setNewAddress("");}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
            <button onClick={handleAdd} disabled={!newName||!newAddress||saving} style={{background:G,color:"white",border:"none",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Save Location</button>
          </div>
        </div>
      )}

      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
        {locations.length===0?(
          <div style={{padding:"40px",textAlign:"center",color:"#9ca3af"}}>No locations yet. Add one above.</div>
        ):locations.map((loc,i)=>(
          <div key={loc.id} style={{padding:"16px 20px",borderBottom:i<locations.length-1?"1px solid #f3f4f6":"none",display:"flex",alignItems:"center",gap:12}}>
            {editingId===loc.id?(
              <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <LocationInput value={editAddress} onChange={(v,s)=>{setEditAddress(v);if(s)setEditName(s.name||v);else setEditName(v);}} placeholder="Search or type address..." style={{...inp,marginBottom:0,fontSize:"0.88rem"}}/>
                <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Custom label (e.g. Rick's House)" style={{...inp,marginBottom:0,fontSize:"0.88rem"}}/>
              </div>
            ):(
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:"0.95rem"}}>{loc.name}</div>
                <div style={{fontSize:"0.82rem",color:"#6b7280",marginTop:2}}>{loc.address}</div>
              </div>
            )}
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              {editingId===loc.id?(
                <>
                  <button onClick={()=>saveEdit(loc.id)} disabled={saving} style={{background:G,color:"white",border:"none",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.8rem"}}>Save</button>
                  <button onClick={cancelEdit} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem"}}>Cancel</button>
                </>
              ):(
                <>
                  <button onClick={()=>startEdit(loc)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>Edit</button>
                  {deleteConfirm===loc.id?(
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:"0.78rem",color:"#dc2626",fontWeight:600}}>Delete?</span>
                      <button onClick={()=>handleDelete(loc.id)} style={{background:"#dc2626",color:"white",border:"none",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>Yes</button>
                      <button onClick={()=>setDeleteConfirm(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem"}}>No</button>
                    </div>
                  ):(
                    <button onClick={()=>setDeleteConfirm(loc.id)} style={{background:"white",border:"1.5px solid #fca5a5",color:"#dc2626",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>Delete</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function FinancesTab({financeRange,setFinanceRange,includeStanford,setIncludeStanford,showNetStanford,setShowNetStanford,financeData,setFinanceData,financeLoading,setFinanceLoading,allLessons,mockUsers,onUpdateLesson,readOnly=false}){
  const now=new Date();
  const[mob,setMob]=useState(()=>window.innerWidth<640);
  useEffect(()=>{const h=()=>setMob(window.innerWidth<640);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const[editRow,setEditRow]=useState(null);
  const[editPriceVal,setEditPriceVal]=useState("");const[editOriginalVal,setEditOriginalVal]=useState("");
  const fmtD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const[financeView,setFinanceView]=useState("month");
  const[selectedDay,setSelectedDay]=useState(fmtD(now));
  const[weekOffset,setWeekOffset]=useState(0);
  const[viewMonth,setViewMonth]=useState(now.getMonth()+1);
  const[viewYear,setViewYear]=useState(now.getFullYear());
  const[viewYearOnly,setViewYearOnly]=useState(now.getFullYear());
  const[projectedMode,setProjectedMode]=useState(false);
  const[projectedRange,setProjectedRange]=useState("week");
  const[projectedStanford,setProjectedStanford]=useState(false);
  const[financeSearch,setFinanceSearch]=useState("");
  const[expandedFinRow,setExpandedFinRow]=useState(null);
  const[projectedCalData,setProjectedCalData]=useState(null);
  const[projectedCalLoading,setProjectedCalLoading]=useState(false);
  const[eomActual,setEomActual]=useState(null);
  const[eomLoading,setEomLoading]=useState(false);
  const dialogRef=useRef(null);
  const editRowRef=useRef(null);
  const computeRange=(view,day,offset,mo,yr,yrOnly)=>{
    if(view==="day")return{start:day,end:day};
    if(view==="week"){const base=new Date();const ws=new Date(base);ws.setDate(base.getDate()-base.getDay()+offset*7);const we=new Date(ws);we.setDate(ws.getDate()+6);return{start:fmtD(ws),end:fmtD(we)};}
    if(view==="month"){const last=new Date(yr,mo,0).getDate();return{start:yr+"-"+String(mo).padStart(2,"0")+"-01",end:yr+"-"+String(mo).padStart(2,"0")+"-"+String(last).padStart(2,"0")};}
    return{start:yrOnly+"-01-01",end:yrOnly+"-12-31"};
  };
  const[financeError,setFinanceError]=useState("");
  const[showAllisonReport,setShowAllisonReport]=useState(false);
  const[allisonStart,setAllisonStart]=useState("");
  const[allisonEnd,setAllisonEnd]=useState("");
  const[allisonSending,setAllisonSending]=useState(false);
  const[allisonSent,setAllisonSent]=useState(false);
  const[allisonConfirm,setAllisonConfirm]=useState(false);
  const[allisonError,setAllisonError]=useState("");
  const ALLISON_EMAIL="allisons@menlocircusclub.com";
  // Parse participant full names from a calendar event.
  // Priority: pre-parsed names from API → structured labels → unstructured lines → slash fallback in title
  const parseMenloNames=(summary,description,parsedNames)=>{
    if(parsedNames&&parsedNames.length>0)return parsedNames;
    if(description){
      // Structured: "Participants: Name1, Name2" or "Group: Name1, Name2"
      const pgm=description.match(/^(?:Participants|Group):\s*(.+)$/im);
      if(pgm)return pgm[1].split(',').map(n=>n.split('(')[0].trim()).filter(Boolean);
      // Structured: "Student:" and/or "Partner:" (portal format)
      const stm=description.match(/^Student:\s*(.+)$/im);
      const ptm=description.match(/^Partner:\s*(.+)$/im);
      if(stm||ptm){const names=[];if(stm)names.push(stm[1].split('(')[0].trim());if(ptm)names.push(ptm[1].split('(')[0].trim());return names.filter(Boolean);}
      // Unstructured: scan for comma-separated name list first (no length cap — 4+ names can exceed 60 chars)
      const allLines=description.split('\n').map(l=>l.trim()).filter(Boolean);
      for(const line of allLines){if(!line.includes(':')&&line.includes(',')){const parts=line.split(',').map(n=>n.trim()).filter(n=>n.length>0);if(parts.length>1)return parts;}}
      // Fall back: one-name-per-line (any line without a colon)
      const nameLines=allLines.filter(l=>!l.includes(':'));
      if(nameLines.length>0)return nameLines;
    }
    // Fall back to slashes in title ("First/Second pb lesson")
    if(summary){
      const clean=summary.replace(/ pb (lesson|clinic|group lesson)$/i,'');
      const parts=clean.split('/').map(p=>p.trim()).filter(Boolean);
      if(parts.length>1)return parts;
    }
    return [];
  };
  const buildAllisonReport=(start,end)=>{
    const s=new Date(start+"T00:00:00");const e=new Date(end+"T23:59:59");
    const items=(financeData?.events||[]).filter(ev=>ev.isMenlo&&!ev.isPickup).filter(ev=>{const d=new Date(ev.date+"T12:00:00");return d>=s&&d<=e;}).sort((a,b)=>a.date.localeCompare(b.date));
    if(!items.length)return null;
    const fmtShort=(ds)=>{const d=new Date(ds+"T12:00:00");return(d.getMonth()+1)+"/"+d.getDate()+"/"+String(d.getFullYear()).slice(2);};
    const fmtLong=(ds)=>{const d=new Date(ds+"T12:00:00");return d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});};
    // Build type label using Allison's exact item names from the MCC billing system
    const typeLabel=(ev)=>{
      const is90=ev.hours>=1.4;
      const dur=is90?"90 Min":"60 Min";
      const n=ev.personCount||1;
      if(ev.type==="clinic")return "Pickleball Clinic";
      if(n===1)return dur+" Private - Pickleball";
      return dur+" S/P ("+n+") Person - Pickleball";
    };
    const lines=["Hi Allison,","","Please process the following lesson charges for the period "+fmtLong(start)+" – "+fmtLong(end)+":",""];
    items.forEach(ev=>{
      const names=parseMenloNames(ev.summary,ev.description,ev.parsedNames);
      const type=typeLabel(ev);
      const nameStr=names.length>0?names.join(", "):(ev.summary||"");
      lines.push(fmtShort(ev.date)+" - "+type+" - "+nameStr);
    });
    lines.push("");lines.push("Total lessons: "+items.length);lines.push("");lines.push("Thank you,");lines.push("David Mok");
    return lines.join("\n");
  };
  const loadData=async(start,end,withStanford)=>{
    setFinanceLoading(true);setFinanceError("");
    try{
      const r=await adminFetch("/api/earnings-calendar?start="+start+"&end="+end+"&includeStanford="+(withStanford?"true":"false"));
      const data=await r.json();
      if(data.error){setFinanceError(data.error);}
      setFinanceData(data);
    }catch(e){
      console.error("Finance load error:",e);
      setFinanceError("Network error — could not load earnings data.");
    }
    setFinanceLoading(false);
  };
  const viewRange=computeRange(financeView,selectedDay,weekOffset,viewMonth,viewYear,viewYearOnly);
  useEffect(()=>{loadData(viewRange.start,viewRange.end,includeStanford);},[]);
  useEffect(()=>{
    if(!projectedMode||projectedCalData||projectedCalLoading)return;
    const start=fmtD(now);
    const future=new Date(now);future.setMonth(future.getMonth()+6);
    const end=fmtD(future);
    setProjectedCalLoading(true);
    adminFetch("/api/earnings-calendar?start="+start+"&end="+end+"&includeStanford=false&includeFuture=true")
      .then(r=>r.json()).then(data=>setProjectedCalData(data)).catch(e=>console.error("Projected load error:",e)).finally(()=>setProjectedCalLoading(false));
  },[projectedMode]);
  const handleStanfordToggle=()=>{const next=!includeStanford;setIncludeStanford(next);loadData(viewRange.start,viewRange.end,next);};
  const fetchEomActual=()=>{
    const startOfMonth=fmtD(new Date(now.getFullYear(),now.getMonth(),1));
    const yesterday=fmtD(new Date(now.getTime()-86400000));
    if(startOfMonth>yesterday){setEomActual({lessonEarnings:0,totalEarnings:0});return;}
    setEomLoading(true);setEomActual(null);
    adminFetch("/api/earnings-calendar?start="+startOfMonth+"&end="+yesterday+"&includeStanford="+(projectedStanford?"true":"false"))
      .then(r=>r.json()).then(d=>setEomActual(d)).catch(()=>setEomActual({error:true})).finally(()=>setEomLoading(false));
  };
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONFULL=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const viewLabel=financeView==="day"?new Date(selectedDay+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):financeView==="week"?(()=>{const sd=new Date(viewRange.start+"T12:00:00");const ed=new Date(viewRange.end+"T12:00:00");return"Week of "+MON[sd.getMonth()]+" "+sd.getDate()+", "+sd.getFullYear();})():financeView==="month"?MONFULL[viewMonth-1]+" "+viewYear:String(viewYearOnly);
  const typeColors={private:"#1a3c34",semi:"#0ea5e9",group:"#f97316",stanford_rec:"#8C1515",stanford_open:"#8C1515"};
  const typeLabelMap={private:"Private Lesson",semi:"Semi-Private Lesson",group:"Group Lesson"};
  const calendarLessons=(financeData?.events||[]).filter(e=>!e.isStanford&&!e.isPickup);
  const stanfordEvents=(financeData?.events||[]).filter(e=>e.isStanford);
  const[calOverrides,setCalOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem("calPriceOverrides")||"{}")}catch{return{}}});
  const[calTypeOverrides,setCalTypeOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem("calTypeOverrides")||"{}")}catch{return{}}});
  const[editTypeVal,setEditTypeVal]=useState("");
  const adjustedCalLessons=calendarLessons.map(e=>{const k=e.date+"|"+e.summary;const typeOv=calTypeOverrides[k];return{...e,...(calOverrides[k]!=null?{earnings:calOverrides[k]}:{}),...(typeOv?{type:typeOv,category:typeLabelMap[typeOv]||e.category}:{})};});
  const adjustedLessonEarnings=adjustedCalLessons.reduce((s,e)=>s+e.earnings,0);
  // Merged + sorted unified list for display (newest first)
  const unifiedEvents=[...adjustedCalLessons,...(includeStanford?stanfordEvents:[])].sort((a,b)=>b.date.localeCompare(a.date));
  // Helper: derive names for non-MCC slash-based events
  const getHoverNames=(e)=>{if(e.parsedNames?.length)return e.parsedNames.join(", ");if(e.isStanford)return undefined;const cleaned=(e.summary||'').replace(/\s*(pb lesson|group pb lesson|pb clinic|clinic)\s*$/i,'').trim();if(cleaned.includes('/'))return cleaned.split('/').map(n=>n.trim()).filter(Boolean).join(', ');return undefined;};
  const stanfordAmt=includeStanford?(showNetStanford?(financeData?.stanfordNetEarnings||0):(financeData?.stanfordEarnings||0)):0;
  // Calendar is the master source — portal lessons are NOT counted separately
  const totalEarnings=adjustedLessonEarnings+stanfordAmt;
  // Build the fixed 6-month window starting from today
  const projectedMonthKeys=(()=>{
    const keys=[];
    for(let i=0;i<6;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);keys.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));}
    return keys;
  })();
  // Projected earnings: calendar is the master source — calendar-only, no portal lessons
  const projectedByMonth=(()=>{
    const map={};
    projectedMonthKeys.forEach(mk=>{map[mk]={total:0,count:0,rows:[]};});
    const add=(mk,row)=>{if(!map[mk])return;map[mk].total+=row.earnings;map[mk].count++;map[mk].rows.push(row);};
    (projectedCalData?.events||[]).filter(e=>(!e.isStanford||projectedStanford)&&!e.isPickup).forEach(e=>{
      const mk=e.date.substring(0,7);
      const k=e.date+"|"+e.summary;
      const earnings=calOverrides[k]!=null?calOverrides[k]:e.earnings;
      add(mk,{date:e.date,label:e.summary,category:e.category,earnings,hours:e.hours,source:"calendar",type:e.type,personCount:e.personCount,parsedNames:e.parsedNames,isMenlo:e.isMenlo});
    });
    return projectedMonthKeys.map(mk=>[mk,map[mk]]);
  })();
  const projectedTotal=projectedByMonth.reduce((s,[,v])=>s+v.total,0);
  const projectedTotalCount=projectedByMonth.reduce((s,[,v])=>s+v.count,0);
  return(
    <div>
      {/* Calendar API error banner */}
      {financeError&&<div style={{background:"#fff8f8",border:"1.5px solid #fca5a5",borderRadius:10,padding:"12px 18px",marginBottom:16,fontSize:"0.83rem",color:"#7f1d1d",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontWeight:700}}>⚠ Calendar API:</span> {financeError}
      </div>}
      {/* Actual / Projected toggle */}
      <div style={{display:"flex",gap:0,marginBottom:24,background:"#f3f4f6",borderRadius:50,padding:4,width:"fit-content"}}>
        <button onClick={()=>setProjectedMode(false)} style={{padding:"7px 22px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",background:!projectedMode?"white":"transparent",color:!projectedMode?"#1a3c34":"#9ca3af",boxShadow:!projectedMode?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>Actual</button>
        <button onClick={()=>setProjectedMode(true)} style={{padding:"7px 22px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",background:projectedMode?"white":"transparent",color:projectedMode?"#1a3c34":"#9ca3af",boxShadow:projectedMode?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>📈 Projected</button>
      </div>
      {/* Projected View */}
      {projectedMode&&(
        <div>
          {/* Day / Week / Month toggle + Stanford toggle */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:50,padding:4}}>
              <button onClick={()=>setProjectedRange("today")} style={{padding:"6px 20px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.83rem",background:projectedRange==="today"?"white":"transparent",color:projectedRange==="today"?"#1a3c34":"#9ca3af",boxShadow:projectedRange==="today"?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>Today</button>
              <button onClick={()=>setProjectedRange("week")} style={{padding:"6px 20px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.83rem",background:projectedRange==="week"?"white":"transparent",color:projectedRange==="week"?"#1a3c34":"#9ca3af",boxShadow:projectedRange==="week"?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>This Week</button>
              <button onClick={()=>setProjectedRange("restofmonth")} style={{padding:"6px 20px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.83rem",background:projectedRange==="restofmonth"?"white":"transparent",color:projectedRange==="restofmonth"?"#1a3c34":"#9ca3af",boxShadow:projectedRange==="restofmonth"?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>This Month</button>
              <button onClick={()=>setProjectedRange("month")} style={{padding:"6px 20px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.83rem",background:projectedRange==="month"?"white":"transparent",color:projectedRange==="month"?"#1a3c34":"#9ca3af",boxShadow:projectedRange==="month"?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>Next 30 Days</button>
            </div>
            {/* Stanford toggle */}
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
              <div onClick={()=>setProjectedStanford(p=>!p)} style={{width:38,height:22,borderRadius:11,background:projectedStanford?"#8C1515":"#d1d5db",transition:"background 0.2s",position:"relative",cursor:"pointer"}}>
                <div style={{position:"absolute",top:3,left:projectedStanford?18:3,width:16,height:16,borderRadius:"50%",background:"white",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
              </div>
              <span style={{fontSize:"0.82rem",fontWeight:600,color:projectedStanford?"#8C1515":"#9ca3af"}}>Stanford</span>
            </label>
          </div>
          {projectedCalLoading?(
            <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>Loading calendar data…</div>
          ):(()=>{
            // Build flat list of all projected rows filtered to the chosen range
            const weekEnd=new Date(now);weekEnd.setDate(now.getDate()+7);
            const monthEnd=new Date(now);monthEnd.setDate(now.getDate()+30);
            const endOfMonth=new Date(now.getFullYear(),now.getMonth()+1,0);
            const todayStr=fmtD(now);
            const cutoffStr=projectedRange==="today"?todayStr:projectedRange==="week"?fmtD(weekEnd):projectedRange==="restofmonth"?fmtD(endOfMonth):fmtD(monthEnd);
            const allRows=projectedByMonth.flatMap(([,v])=>v.rows).filter(r=>r.date>=todayStr&&r.date<=cutoffStr).sort((a,b)=>a.date.localeCompare(b.date));
            const rangeTotal=allRows.reduce((s,r)=>s+r.earnings,0);
            const rangeLabel=projectedRange==="today"?"Today":projectedRange==="week"?"Next 7 Days":projectedRange==="restofmonth"?"Rest of "+now.toLocaleString("en-US",{month:"long"}):"Next 30 Days";
            // Group by date for nicer display
            const byDate={};
            allRows.forEach(r=>{if(!byDate[r.date])byDate[r.date]=[];byDate[r.date].push(r);});
            const dates=Object.keys(byDate).sort();
            return(
              <div>
                {/* Summary card */}
                <div style={{background:"#1a3c34",borderRadius:12,padding:"20px 28px",marginBottom:eomActual&&!eomActual.error?0:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:"0.7rem",fontWeight:700,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{rangeLabel}</div>
                    <div style={{fontSize:"2rem",fontWeight:900,color:"white"}}>${rangeTotal.toFixed(2)}</div>
                    <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.7)",marginTop:3}}>{allRows.length} lesson{allRows.length!==1?"s":""} scheduled</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
                    {projectedRange==="restofmonth"&&(
                      <button
                        onClick={()=>{if(eomActual)setEomActual(null);else fetchEomActual();}}
                        disabled={eomLoading}
                        style={{background:"rgba(255,255,255,0.15)",color:"white",border:"1.5px solid rgba(255,255,255,0.3)",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.78rem",whiteSpace:"nowrap"}}
                      >{eomLoading?"Loading…":eomActual?"Hide EOM Total":"📊 EOM Total"}</button>
                    )}
                    <div style={{fontSize:"2rem",opacity:0.4}}>📈</div>
                  </div>
                </div>
                {/* EOM Total breakdown card */}
                {projectedRange==="restofmonth"&&eomActual&&!eomActual.error&&(()=>{
                  const earned=projectedStanford?(eomActual.totalEarnings||0):(eomActual.lessonEarnings||0);
                  const eomTotal=earned+rangeTotal;
                  const monthName=now.toLocaleString("en-US",{month:"long"});
                  return(
                    <div style={{background:"#f0faf5",border:"1.5px solid #1a3c34",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"18px 28px",marginBottom:20}}>
                      <div style={{fontSize:"0.7rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{monthName} End-of-Month Projection</div>
                      <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"center"}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:"0.72rem",color:"#6b7280",fontWeight:700,marginBottom:4}}>Earned So Far</div>
                          <div style={{fontSize:"1.4rem",fontWeight:900,color:"#1a3c34"}}>${earned.toFixed(2)}</div>
                        </div>
                        <div style={{fontSize:"1.4rem",color:"#9ca3af",fontWeight:300}}>+</div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:"0.72rem",color:"#6b7280",fontWeight:700,marginBottom:4}}>Remaining</div>
                          <div style={{fontSize:"1.4rem",fontWeight:900,color:"#1a3c34"}}>${rangeTotal.toFixed(2)}</div>
                        </div>
                        <div style={{fontSize:"1.4rem",color:"#9ca3af",fontWeight:300}}>=</div>
                        <div style={{textAlign:"center",background:"#1a3c34",borderRadius:10,padding:"10px 20px"}}>
                          <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.7)",fontWeight:700,marginBottom:4}}>EOM Total</div>
                          <div style={{fontSize:"1.6rem",fontWeight:900,color:"white"}}>${eomTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {projectedRange==="restofmonth"&&eomActual?.error&&(
                  <div style={{background:"#fff8f8",border:"1.5px solid #fca5a5",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"14px 28px",marginBottom:20,color:"#7f1d1d",fontSize:"0.83rem",fontWeight:600}}>Failed to load actuals. Try again.</div>
                )}
                {/* Day-by-day breakdown */}
                {dates.length===0?(
                  <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No lessons scheduled for {projectedRange==="week"?"the next 7 days":"the next 30 days"}.</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {dates.map(day=>{
                      const rows=byDate[day];
                      const dayTotal=rows.reduce((s,r)=>s+r.earnings,0);
                      const dObj=new Date(day+"T12:00:00");
                      const isToday=day===todayStr;
                      const dayLabel2=isToday?"Today":dObj.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                      return(
                        <div key={day} style={{background:"white",borderRadius:12,border:"1.5px solid "+(isToday?"#1a3c34":"#e5e7eb"),overflow:"hidden"}}>
                          <div style={{background:isToday?"#f0faf5":"#f9f9f6",borderBottom:"1px solid "+(isToday?"#1a3c34":"#e5e7eb"),padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontWeight:800,fontSize:"0.88rem",color:isToday?"#1a3c34":"#374151"}}>{dayLabel2}{isToday&&<span style={{marginLeft:8,background:"#1a3c34",color:"white",fontSize:"0.62rem",fontWeight:800,padding:"2px 8px",borderRadius:50}}>TODAY</span>}</span>
                            <span style={{fontWeight:900,fontSize:"0.95rem",color:"#1a3c34"}}>${dayTotal.toFixed(2)}</span>
                          </div>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.86rem"}}>
                            <tbody>
                              {rows.map((r,i)=>(
                                <tr key={i} style={{borderBottom:i<rows.length-1?"1px solid #f3f4f6":"none",background:r.isMenlo?"#f0faf5":"white"}}>
                                  <td style={{padding:"9px 16px",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                    {r.label}{r.isMenlo&&<span style={{background:"#1a3c34",color:"white",fontSize:"0.62rem",fontWeight:700,padding:"1px 6px",borderRadius:50,marginLeft:6}}>MCC</span>}
                                  </td>
                                  <td style={{padding:"9px 16px"}}>
                                    <span
                                      style={{background:(typeColors[r.type||r.category?.toLowerCase()]||"#1a3c34")+"22",color:typeColors[r.type||r.category?.toLowerCase()]||"#1a3c34",padding:"2px 8px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}
                                      title={r.parsedNames?.length?r.parsedNames.join(", "):undefined}
                                    >
                                      {r.category||"—"}{(r.type==="group"||r.type==="clinic")&&r.personCount>1?` (${r.personCount})`:""}
                                    </span>
                                  </td>
                                  <td style={{padding:"9px 16px",color:"#6b7280",fontSize:"0.82rem"}}>{r.source==="calendar"?(r.hours!=null?r.hours+"h":"—"):r.duration||"—"}</td>
                                  <td style={{padding:"9px 16px",fontWeight:700,color:"#1a3c34",textAlign:"right"}}>${r.earnings.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {/* Actual View */}
      {!projectedMode&&<>
      {/* Allison Report */}
      {!readOnly&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClick={()=>{setShowAllisonReport(!showAllisonReport);setAllisonSent(false);}} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>MCC Report</button>
      </div>}
      {!readOnly&&showAllisonReport&&(()=>{
        const report=allisonStart&&allisonEnd?buildAllisonReport(allisonStart,allisonEnd):null;
        const sendToAllison=async()=>{
          if(!report)return;
          setAllisonSending(true);setAllisonSent(false);setAllisonError("");
          try{
            const subject="Pickleball Lessons — "+allisonStart+" to "+allisonEnd;
            const res=await fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:ALLISON_EMAIL,bcc:"david@dmpickleball.com",subject,text:report})});
            const data=await res.json();
            if(!res.ok||data.error){setAllisonError("Failed to send: "+(data.error||res.status));}
            else{setAllisonSent(true);setAllisonConfirm(false);}
          }catch(e){setAllisonError("Network error — check connection and try again.");}
          setAllisonSending(false);
        };
        return(
          <div style={{background:"white",borderRadius:12,border:"1.5px solid #c7d2fe",padding:"20px 24px",marginBottom:24}}>
            <div style={{fontWeight:700,fontSize:"0.97rem",color:G,marginBottom:4}}>Allison Report — Menlo Circus Club</div>
            <div style={{fontSize:"0.82rem",color:"#6b7280",marginBottom:16}}>Select a date range to generate the billing report. Each member is listed individually with their lesson type. Send directly to Allison at MCC or copy and paste.</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end",marginBottom:16}}>
              <div><div style={{...lbl,marginBottom:4}}>From</div><input type="date" value={allisonStart} onChange={e=>{setAllisonStart(e.target.value);setAllisonSent(false);setAllisonConfirm(false);setAllisonError("");}} style={{...inp,marginBottom:0,width:"auto",fontSize:"1rem"}}/></div>
              <div><div style={{...lbl,marginBottom:4}}>To</div><input type="date" value={allisonEnd} onChange={e=>{setAllisonEnd(e.target.value);setAllisonSent(false);setAllisonConfirm(false);setAllisonError("");}} style={{...inp,marginBottom:0,width:"auto",fontSize:"1rem"}}/></div>
            </div>
            {report?(
              <>
                <textarea readOnly value={report} style={{width:"100%",height:260,borderRadius:8,border:"1.5px solid #e5e7eb",padding:"12px",fontSize:"0.82rem",fontFamily:"monospace",color:"#374151",background:"#f9fafb",boxSizing:"border-box",resize:"vertical",marginBottom:12}}/>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                  <button onClick={()=>{try{navigator.clipboard.writeText(report);}catch(e){}}} style={{background:"#f0f4ff",color:"#3730a3",border:"1.5px solid #c7d2fe",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Copy</button>
                  {allisonSent?(
                    <span style={{background:"#16a34a",color:"white",padding:"9px 20px",borderRadius:50,fontWeight:700,fontSize:"0.85rem"}}>✓ Sent to Allison</span>
                  ):allisonConfirm?(
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fef3c7",border:"1.5px solid #f59e0b",borderRadius:12,padding:"8px 14px"}}>
                      <span style={{fontSize:"0.82rem",fontWeight:600,color:"#92400e"}}>Send to {ALLISON_EMAIL}?</span>
                      <button onClick={sendToAllison} disabled={allisonSending} style={{background:"#f59e0b",color:"white",border:"none",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem",opacity:allisonSending?0.7:1}}>{allisonSending?"Sending…":"Yes, Send"}</button>
                      <button onClick={()=>{setAllisonConfirm(false);setAllisonError("");}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>Cancel</button>
                    </div>
                  ):(
                    <button onClick={()=>{setAllisonConfirm(true);setAllisonError("");}} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>✉ Email to Allison</button>
                  )}
                  <button onClick={()=>{setShowAllisonReport(false);setAllisonConfirm(false);setAllisonError("");}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Done</button>
                </div>
                {allisonError&&<div style={{marginTop:10,fontSize:"0.82rem",color:"#dc2626",fontWeight:600}}>⚠ {allisonError}</div>}
              </>
            ):(
              <div style={{fontSize:"0.84rem",color:"#9ca3af",padding:"12px 0"}}>Select a date range to preview the report.</div>
            )}
          </div>
        );
      })()}
      {/* Range + Stanford controls */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <select value={financeView} onChange={e=>{const v=e.target.value;setFinanceView(v);const r=computeRange(v,selectedDay,weekOffset,viewMonth,viewYear,viewYearOnly);loadData(r.start,r.end,includeStanford);}} style={{border:"1.5px solid #d1d5db",borderRadius:8,padding:"8px 14px",fontSize:"0.88rem",fontWeight:600,background:"white",color:"#374151",cursor:"pointer"}}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            {financeView==="day"&&(
              <input type="date" value={selectedDay} onChange={e=>{setSelectedDay(e.target.value);loadData(e.target.value,e.target.value,includeStanford);}} style={{border:"1.5px solid #e5e7eb",borderRadius:50,padding:"7px 16px",fontSize:"0.85rem",cursor:"pointer",background:"white"}}/>
            )}
            {financeView==="week"&&(()=>{const sd=new Date(viewRange.start+"T12:00:00");const ed=new Date(viewRange.end+"T12:00:00");const lbl=MON[sd.getMonth()]+" "+sd.getDate()+(sd.getFullYear()!==ed.getFullYear()?" "+sd.getFullYear():"")+' – '+MON[ed.getMonth()]+" "+ed.getDate()+", "+ed.getFullYear();return(<div style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>{const o=weekOffset-1;setWeekOffset(o);const r=computeRange("week",selectedDay,o,viewMonth,viewYear,viewYearOnly);loadData(r.start,r.end,includeStanford);}} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontWeight:700,fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>‹</button><span style={{fontSize:"0.88rem",fontWeight:600,color:"#374151",minWidth:180,textAlign:"center"}}>{lbl}</span><button onClick={()=>{const o=weekOffset+1;setWeekOffset(o);const r=computeRange("week",selectedDay,o,viewMonth,viewYear,viewYearOnly);loadData(r.start,r.end,includeStanford);}} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontWeight:700,fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>›</button></div>);})()}
            {financeView==="month"&&(
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <select value={viewMonth} onChange={e=>{const mo=parseInt(e.target.value);setViewMonth(mo);const r=computeRange("month",selectedDay,weekOffset,mo,viewYear,viewYearOnly);loadData(r.start,r.end,includeStanford);}} style={{border:"1.5px solid #d1d5db",borderRadius:8,padding:"7px 12px",fontSize:"0.85rem",cursor:"pointer",background:"white",color:"#374151"}}>
                  {MONFULL.map((m,i)=>(<option key={i} value={i+1}>{m}</option>))}
                </select>
                <select value={viewYear} onChange={e=>{const yr=parseInt(e.target.value);setViewYear(yr);const r=computeRange("month",selectedDay,weekOffset,viewMonth,yr,viewYearOnly);loadData(r.start,r.end,includeStanford);}} style={{border:"1.5px solid #d1d5db",borderRadius:8,padding:"7px 12px",fontSize:"0.85rem",cursor:"pointer",background:"white",color:"#374151"}}>
                  {Array.from({length:now.getFullYear()-2023},(_,i)=>2024+i).map(y=>(<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
            )}
            {financeView==="year"&&(
              <select value={viewYearOnly} onChange={e=>{const yr=parseInt(e.target.value);setViewYearOnly(yr);const r=computeRange("year",selectedDay,weekOffset,viewMonth,viewYear,yr);loadData(r.start,r.end,includeStanford);}} style={{border:"1.5px solid #d1d5db",borderRadius:8,padding:"7px 12px",fontSize:"0.85rem",cursor:"pointer",background:"white",color:"#374151"}}>
                {Array.from({length:now.getFullYear()-2023},(_,i)=>2024+i).map(y=>(<option key={y} value={y}>{y}</option>))}
              </select>
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center",padding:"8px 14px",background:"white",border:"1.5px solid #e5e7eb",borderRadius:50,flexWrap:"wrap"}}>
          <IosSwitch on={showNetStanford} onClick={()=>setShowNetStanford(p=>!p)} label={showNetStanford?"Net Pay":"Gross Pay"}/>
          <div style={{width:1,height:16,background:"#e5e7eb"}}/>
          <IosSwitch on={includeStanford} onClick={handleStanfordToggle} label="Stanford"/>
        </div>
      </div>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
        <div style={{background:"white",borderRadius:12,padding:"20px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Total Earnings</div>
          <div style={{fontSize:"1.8rem",fontWeight:900,color:"#1a3c34"}}>${totalEarnings.toFixed(2)}</div>
          <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:4}}>{viewLabel}</div>
        </div>
        <div style={{background:"white",borderRadius:12,padding:"20px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Lessons</div>
          <div style={{fontSize:"1.8rem",fontWeight:900,color:"#1a3c34"}}>${adjustedLessonEarnings.toFixed(2)}</div>
          <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:4}}>{calendarLessons.length} lessons</div>
        </div>
        {includeStanford&&(
          <div style={{background:"white",borderRadius:12,padding:"20px",border:"1.5px solid #e5e7eb"}}>
            <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Stanford {showNetStanford?"(Net)":"(Gross)"}</div>
            <div style={{fontSize:"1.8rem",fontWeight:900,color:"#1a1a1a"}}>${stanfordAmt.toFixed(2)}</div>
            <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:4}}>{(financeData?.stanfordHours||0).toFixed(1)} hrs</div>
          </div>
        )}
      </div>
      {financeLoading?(
        <div style={{textAlign:"center",padding:"40px",color:"#6b7280"}}>Loading financial data...</div>
      ):(
        <>
          {financeView==="year"&&(financeData?.events||[]).length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:"#1a3c34",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Monthly Breakdown — {viewYearOnly}</div>
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                  <thead><tr style={{background:"#f9f9f6",borderBottom:"1.5px solid #e5e7eb"}}>{["Month","Lessons","Hrs",includeStanford?"Stanford":"","Total"].filter(Boolean).map(h=>(<th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
                  <tbody>
                    {MONFULL.map((m,i)=>{
                      const moStr=String(i+1).padStart(2,"0");
                      const prefix=viewYearOnly+"-"+moStr;
                      const mLessons=adjustedCalLessons.filter(e=>e.date.startsWith(prefix));
                      const mStanford=stanfordEvents.filter(e=>e.date.startsWith(prefix));
                      const lessonTotal=mLessons.reduce((s,e)=>s+e.earnings,0);
                      const stanfordTotal=includeStanford?mStanford.reduce((s,e)=>s+(showNetStanford?(e.netEarnings??e.earnings):e.earnings),0):0;
                      const stanfordHrs=mStanford.reduce((s,e)=>s+(e.hours||0),0);
                      const lessonHrs=mLessons.reduce((s,e)=>s+(e.hours||0),0);
                      const rowTotal=lessonTotal+stanfordTotal;
                      if(rowTotal===0)return null;
                      return(
                        <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                          <td style={{padding:"12px 16px",fontWeight:600}}>{m}</td>
                          <td style={{padding:"12px 16px"}}>{mLessons.length>0?<span>${lessonTotal.toFixed(2)}<span style={{color:"#9ca3af",fontSize:"0.78rem",marginLeft:4}}>({mLessons.length})</span></span>:<span style={{color:"#d1d5db"}}>—</span>}</td>
                          <td style={{padding:"12px 16px",color:"#6b7280"}}>{(lessonHrs+(includeStanford?stanfordHrs:0)).toFixed(1)}h</td>
                          {includeStanford&&<td style={{padding:"12px 16px",color:"#8C1515"}}>{mStanford.length>0?<span>${stanfordTotal.toFixed(2)}<span style={{fontSize:"0.78rem",marginLeft:4,color:"#a78bfa"}}>({mStanford.length})</span></span>:<span style={{color:"#d1d5db"}}>—</span>}</td>}
                          <td style={{padding:"12px 16px",fontWeight:700,color:"#1a3c34"}}>${rowTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{borderTop:"2px solid #e5e7eb",background:"#f9f9f6"}}>
                      <td style={{padding:"12px 16px",fontWeight:800}}>Total</td>
                      <td style={{padding:"12px 16px",fontWeight:700}}>${adjustedLessonEarnings.toFixed(2)}</td>
                      <td style={{padding:"12px 16px",color:"#6b7280",fontWeight:600}}>{(adjustedCalLessons.reduce((s,e)=>s+(e.hours||0),0)+(includeStanford?stanfordEvents.reduce((s,e)=>s+(e.hours||0),0):0)).toFixed(1)}h</td>
                      {includeStanford&&<td style={{padding:"12px 16px",fontWeight:700,color:"#1a3c34"}}>${stanfordAmt.toFixed(2)}</td>}
                      <td style={{padding:"12px 16px",fontWeight:800,color:"#1a3c34"}}>${totalEarnings.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {financeView!=="year"&&(
            <div style={{marginBottom:16}}>
              <input value={financeSearch} onChange={e=>setFinanceSearch(e.target.value)} placeholder="Search by student, event, or ref #…" style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #e5e7eb",borderRadius:50,padding:"9px 18px",fontSize:"0.88rem",background:"white",outline:"none"}}/>
            </div>
          )}
          {financeView!=="year"&&unifiedEvents.length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:"#1a3c34",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Calendar Lessons</div>
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden",overflowX:"auto"}}>
                {mob?(
                  /* ── Mobile card layout ── */
                  <div>
                    {unifiedEvents.filter(e=>{if(!financeSearch)return true;const q=financeSearch.toLowerCase();return e.summary?.toLowerCase().includes(q)||e.date?.includes(q);}).map((e,i,arr)=>{
                      const calKey=e.date+"|"+e.summary;
                      const isOverridden=!e.isStanford&&calOverrides[calKey]!=null;
                      const isTypeOverridden=!e.isStanford&&calTypeOverrides[calKey]!=null;
                      const hoverNames=getHoverNames(e);
                      const dispEarnings=e.isStanford?(showNetStanford?(e.netEarnings??e.earnings):e.earnings):e.earnings;
                      const earningsColor=e.isMenlo?"#16a34a":isOverridden?"#0ea5e9":"#1a3c34";
                      const badgeColor=e.isStanford?"#8C1515":e.isMenlo?"#16a34a":(typeColors[e.type]||"#666");
                      const rowBg=e.isStanford?"#fdf2f2":e.isMenlo?"#f0fdf4":"white";
                      const openEdit=()=>{if(e.isStanford||readOnly)return;editRowRef.current={...e,isCalendar:true,calKey};setEditPriceVal(String(e.earnings));setEditTypeVal(e.type||"");dialogRef.current?.showModal();};
                      return(
                        <div key={i} onClick={openEdit} style={{padding:"12px 14px",borderBottom:i<arr.length-1?`1px solid ${rowBg==="white"?"#f3f4f6":"#e5e7eb"}`:"none",cursor:e.isStanford?"default":"pointer",background:rowBg}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <span style={{fontSize:"0.8rem",fontWeight:700,color:"#374151"}}>{fmtDateShort(e.date)}</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:"0.68rem",color:"#9ca3af"}}>{e.hours}h</span>
                              <span style={{fontWeight:800,color:earningsColor,fontSize:"0.95rem"}}>${typeof dispEarnings==="number"?dispEarnings.toFixed(2):dispEarnings}</span>
                              {isOverridden&&<span style={{fontSize:"0.65rem",color:"#0ea5e9",opacity:0.8}}>✎</span>}
                            </div>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                            <span style={{fontSize:"0.85rem",color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</span>
                            <span
                              style={{background:e.isStanford?badgeColor:badgeColor+"22",color:e.isStanford?"white":isTypeOverridden?"#0ea5e9":badgeColor,padding:"2px 9px",borderRadius:50,fontSize:"0.68rem",fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}
                            >
                              {e.isStanford?"Stanford":e.category}{(e.type==="group"||e.type==="clinic")&&e.personCount>1?` (${e.personCount})`:""}
                              {isTypeOverridden&&" ✎"}
                            </span>
                          </div>
                          {hoverNames&&<div style={{fontSize:"0.72rem",color:"#9ca3af",marginTop:3,paddingLeft:1}}>{hoverNames}</div>}
                        </div>
                      );
                    })}
                  </div>
                ):(
                  /* ── Desktop table layout ── */
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                    <thead><tr style={{background:"#f9f9f6",borderBottom:"1.5px solid #e5e7eb"}}>{["Date","Event","Type","Hours","Earnings"].map(h=>(<th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
                    <tbody>
                      {unifiedEvents.filter(e=>{if(!financeSearch)return true;const q=financeSearch.toLowerCase();return e.summary?.toLowerCase().includes(q)||e.date?.includes(q);}).map((e,i)=>{
                        const calKey=e.date+"|"+e.summary;
                        const isOverridden=!e.isStanford&&calOverrides[calKey]!=null;
                        const isTypeOverridden=!e.isStanford&&calTypeOverrides[calKey]!=null;
                        const hoverNames=getHoverNames(e);
                        const dispEarnings=e.isStanford?(showNetStanford?(e.netEarnings??e.earnings):e.earnings):e.earnings;
                        const earningsColor=e.isMenlo?"#16a34a":isOverridden?"#0ea5e9":"#1a3c34";
                        const badgeColor=e.isStanford?"#8C1515":e.isMenlo?"#16a34a":(typeColors[e.type]||"#666");
                        const rowBg=e.isStanford?"#fdf2f2":e.isMenlo?"#f0fdf4":"white";
                        const openEdit=()=>{if(e.isStanford||readOnly)return;editRowRef.current={...e,isCalendar:true,calKey};setEditPriceVal(String(e.earnings));setEditTypeVal(e.type||"");dialogRef.current?.showModal();};
                        return(
                        <tr key={i} style={{borderBottom:`1px solid ${rowBg==="white"?"#f3f4f6":"#e5e7eb"}`,background:rowBg}}>
                          <td style={{padding:"12px 16px"}}>{fmtDateShort(e.date)}</td>
                          <td style={{padding:"12px 16px",maxWidth:200}}>
                            <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</div>
                            {hoverNames&&<div style={{fontSize:"0.72rem",color:"#9ca3af",marginTop:2,whiteSpace:"normal"}}>{hoverNames}</div>}
                          </td>
                          <td onClick={openEdit} style={{padding:"12px 16px",cursor:e.isStanford?"default":"pointer",userSelect:"none"}}>
                            <span
                              style={{background:e.isStanford?badgeColor:badgeColor+"22",color:e.isStanford?"white":isTypeOverridden?"#0ea5e9":badgeColor,padding:"2px 8px",borderRadius:50,fontSize:"0.72rem",fontWeight:700,cursor:e.isStanford?"default":"pointer"}}
                              title={e.isStanford?undefined:"Click to edit type"}
                            >
                              {e.isStanford?"Stanford":e.category}{(e.type==="group"||e.type==="clinic")&&e.personCount>1?` (${e.personCount})`:""}
                              {isTypeOverridden&&" ✎"}
                            </span>
                          </td>
                          <td style={{padding:"12px 16px"}}>{e.hours}h</td>
                          <td onClick={openEdit} style={{padding:"12px 16px",fontWeight:700,color:earningsColor,cursor:(e.isStanford||readOnly)?"default":"pointer",userSelect:"none"}} title={(e.isStanford||readOnly)?undefined:"Click to edit"}>${typeof dispEarnings==="number"?dispEarnings.toFixed(2):dispEarnings}{!e.isStanford&&!readOnly&&<span style={{fontSize:"0.7rem",color:isOverridden?"#0ea5e9":"#9ca3af",marginLeft:5,opacity:0.7}}>✎</span>}</td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          {!readOnly&&<dialog ref={dialogRef} onClick={e=>{if(e.target===dialogRef.current)dialogRef.current.close();}} style={{border:"none",borderRadius:16,padding:"28px 32px",maxWidth:420,width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}}>
            <div style={{fontWeight:800,fontSize:"1.05rem",marginBottom:4}}>Edit Lesson Income</div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",marginBottom:20}}>{editRowRef.current?.isCalendar?editRowRef.current?.summary:editRowRef.current?.name} · {editRowRef.current?fmtDateShort(editRowRef.current.date):""} · {editRowRef.current?.isCalendar?(editRowRef.current?.hours+"h"):editRowRef.current?.duration}</div>
            {editRowRef.current?.isCalendar&&(
              <div style={{marginBottom:16}}>
                <div style={{...lbl,marginBottom:6}}>Lesson Type</div>
                <select value={editTypeVal} onChange={ev=>setEditTypeVal(ev.target.value)} style={{...inp,marginBottom:0,cursor:"pointer"}}>
                  <option value="">— auto (from title) —</option>
                  <option value="private">Private</option>
                  <option value="semi">Semi-Private</option>
                  <option value="group">Group</option>
                </select>
              </div>
            )}
            <div style={{...lbl,marginBottom:6}}>Earnings</div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:"1.1rem",color:"#6b7280",fontWeight:600}}>$</span>
              <input type="number" value={editPriceVal} onChange={e=>setEditPriceVal(e.target.value)} style={{...inp,marginBottom:0,fontSize:"1.1rem",fontWeight:700}} placeholder="0.00"/>
            </div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
              {editOriginalVal&&<div style={{fontSize:"0.8rem",color:"#6b7280"}}>Current value: <strong style={{color:"#374151"}}>${parseFloat(editOriginalVal).toFixed(2)}</strong></div>}
              {editRowRef.current&&!editRowRef.current.isCalendar&&<div style={{fontSize:"0.8rem",color:"#9ca3af"}}>Default rate: ${getRate(editRowRef.current.type,parseInt(editRowRef.current.duration),editRowRef.current.isMenlo?"menlo":"public").toFixed(2)}</div>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>dialogRef.current?.close()} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.88rem"}}>Cancel</button>
              <button onClick={async()=>{
                const r=editRowRef.current;
                if(!r)return;
                const price=parseFloat(editPriceVal);
                if(isNaN(price))return;
                if(r.isCalendar){
                  const newOv={...calOverrides,[r.calKey]:price};
                  setCalOverrides(newOv);
                  localStorage.setItem("calPriceOverrides",JSON.stringify(newOv));
                  if(editTypeVal){const newTypeOv={...calTypeOverrides,[r.calKey]:editTypeVal};setCalTypeOverrides(newTypeOv);localStorage.setItem("calTypeOverrides",JSON.stringify(newTypeOv));}else{const newTypeOv={...calTypeOverrides};delete newTypeOv[r.calKey];setCalTypeOverrides(newTypeOv);localStorage.setItem("calTypeOverrides",JSON.stringify(newTypeOv));}
                }else{
                  await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:r.id,updates:{custom_price:price}})});
                  onUpdateLesson(r.email,r.id,{customPrice:price});
                }
                dialogRef.current?.close();
              }} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>Save</button>
              {editRowRef.current&&(editRowRef.current.isCalendar?(calOverrides[editRowRef.current.calKey]!=null||calTypeOverrides[editRowRef.current.calKey]!=null):editRowRef.current.gross!==getRate(editRowRef.current.type,parseInt(editRowRef.current.duration),editRowRef.current.isMenlo?"menlo":"public"))&&(
                <button onClick={async()=>{
                  const r=editRowRef.current;
                  if(!r)return;
                  if(r.isCalendar){
                    const newOv={...calOverrides};
                    delete newOv[r.calKey];
                    setCalOverrides(newOv);
                    localStorage.setItem("calPriceOverrides",JSON.stringify(newOv));
                    const newTypeOv={...calTypeOverrides};
                    delete newTypeOv[r.calKey];
                    setCalTypeOverrides(newTypeOv);
                    localStorage.setItem("calTypeOverrides",JSON.stringify(newTypeOv));
                  }else{
                    await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:r.id,updates:{custom_price:null}})});
                    onUpdateLesson(r.email,r.id,{customPrice:null});
                  }
                  dialogRef.current?.close();
                }} style={{background:"white",border:"1.5px solid #e5e7eb",color:"#6b7280",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.88rem"}}>Reset to Default</button>
              )}
            </div>
          </dialog>}
          {calendarLessons.length===0&&!financeLoading&&(
            <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>No earnings data found for this period.</div>
          )}
        </>
      )}
      </>}
    </div>
  );
}

function AdminCalendarView(){
  const[view,setView]=useState("week");
  const[currentDate,setCurrentDate]=useState(new Date());
  const[events,setEvents]=useState([]);
  const[loading,setLoading]=useState(false);

  const getDateRange=()=>{
    if(view==="day"){
      const d=new Date(currentDate);
      return{start:toDS(d),end:toDS(d)};
    } else if(view==="week"){
      const start=new Date(currentDate);
      start.setDate(start.getDate()-start.getDay());
      const end=new Date(start);
      end.setDate(end.getDate()+6);
      return{start:toDS(start),end:toDS(end)};
    } else {
      const start=new Date(currentDate.getFullYear(),currentDate.getMonth(),1);
      const end=new Date(currentDate.getFullYear(),currentDate.getMonth()+1,0);
      return{start:toDS(start),end:toDS(end)};
    }
  };

  const loadEvents=async()=>{
    setLoading(true);
    const{start,end}=getDateRange();
    try{
      const r=await fetch("/api/get-busy-times?date="+start+"&endDate="+end+"&allEvents=true");
      const data=await r.json();
      setEvents(data.busy||[]);
    }catch(e){console.error("Calendar load error:",e);}
    setLoading(false);
  };

  useEffect(()=>{loadEvents();},[view,currentDate]);

  const navigate=(dir)=>{
    const d=new Date(currentDate);
    if(view==="day")d.setDate(d.getDate()+dir);
    else if(view==="week")d.setDate(d.getDate()+(dir*7));
    else d.setMonth(d.getMonth()+dir);
    setCurrentDate(d);
  };

  const getTitle=()=>{
    if(view==="day")return currentDate.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    if(view==="week"){
      const start=new Date(currentDate);
      start.setDate(start.getDate()-start.getDay());
      const end=new Date(start);end.setDate(end.getDate()+6);
      return start.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" - "+end.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
    }
    return currentDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  };

  const eventColor=(summary)=>{
    const s=(summary||"").toLowerCase();
    if(s.includes("stanford"))return"#8C1515";
    if(s.includes("group"))return"#f97316";
    if(s.includes("/"))return"#0ea5e9";
    if(s.includes("pb lesson"))return"#1a3c34";
    return"#6b7280";
  };

  const getDaysInView=()=>{
    if(view==="day")return[new Date(currentDate)];
    if(view==="week"){
      const start=new Date(currentDate);
      start.setDate(start.getDate()-start.getDay());
      return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d;});
    }
    const start=new Date(currentDate.getFullYear(),currentDate.getMonth(),1);
    const days=[];
    const firstDay=start.getDay();
    for(let i=0;i<firstDay;i++){const d=new Date(start);d.setDate(d.getDate()-firstDay+i);days.push(d);}
    const daysInMonth=new Date(currentDate.getFullYear(),currentDate.getMonth()+1,0).getDate();
    for(let i=1;i<=daysInMonth;i++){days.push(new Date(currentDate.getFullYear(),currentDate.getMonth(),i));}
    while(days.length%7!==0){const d=new Date(days[days.length-1]);d.setDate(d.getDate()+1);days.push(d);}
    return days;
  };

  const getEventsForDay=(date)=>{
    const ds=toDS(date);
    return events.filter(e=>e.start&&e.start.substring(0,10)===ds);
  };

  const days=getDaysInView();
  const today=new Date();
  today.setHours(0,0,0,0);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>navigate(-1)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 14px",borderRadius:50,cursor:"pointer",fontSize:"1rem"}}>←</button>
          <button onClick={()=>setCurrentDate(new Date())} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>Today</button>
          <button onClick={()=>navigate(1)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 14px",borderRadius:50,cursor:"pointer",fontSize:"1rem"}}>→</button>
          <span style={{fontWeight:800,fontSize:"1.1rem",color:"#1a1a1a"}}>{getTitle()}</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["day","week","month"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{background:view===v?"#1a3c34":"white",color:view===v?"white":"#374151",border:"1.5px solid "+(view===v?"#1a3c34":"#e5e7eb"),padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:view===v?700:500}}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading?(
        <div style={{textAlign:"center",padding:"60px",color:"#6b7280"}}>Loading calendar...</div>
      ):view==="month"?(
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1.5px solid #e5e7eb"}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(<div key={d} style={{padding:"10px",textAlign:"center",fontSize:"0.78rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{d}</div>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {days.map((day,i)=>{
              const isToday=day.getTime()===today.getTime();
              const isCurrentMonth=day.getMonth()===currentDate.getMonth();
              const dayEvents=getEventsForDay(day);
              return(
                <div key={i} style={{minHeight:90,padding:"6px",borderRight:i%7!==6?"1px solid #f3f4f6":"none",borderBottom:i<days.length-7?"1px solid #f3f4f6":"none",background:isCurrentMonth?"white":"#f9f9f6"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:isToday?"#1a3c34":"transparent",color:isToday?"white":isCurrentMonth?"#1a1a1a":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.82rem",fontWeight:isToday?800:500,marginBottom:4}}>{day.getDate()}</div>
                  {dayEvents.slice(0,3).map((e,j)=>(
                    <div key={j} style={{background:eventColor(e.summary),color:"white",borderRadius:4,padding:"2px 6px",fontSize:"0.7rem",fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</div>
                  ))}
                  {dayEvents.length>3&&<div style={{fontSize:"0.68rem",color:"#6b7280",marginTop:2}}>+{dayEvents.length-3} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      ):(
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
          {view==="week"&&(
            <div style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)",borderBottom:"1.5px solid #e5e7eb"}}>
              <div/>
              {days.map((day,i)=>{
                const isToday=day.getTime()===today.getTime();
                return(
                  <div key={i} style={{padding:"10px 4px",textAlign:"center",borderLeft:"1px solid #f3f4f6"}}>
                    <div style={{fontSize:"0.72rem",color:"#6b7280",textTransform:"uppercase",fontWeight:700}}>{day.toLocaleDateString("en-US",{weekday:"short"})}</div>
                    <div style={{width:30,height:30,borderRadius:"50%",background:isToday?"#1a3c34":"transparent",color:isToday?"white":"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem",fontWeight:isToday?800:500,margin:"4px auto 0"}}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{overflowY:"visible"}}>
            {view==="week"?(
              <div style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)"}}>
                <div>
                  {Array.from({length:(()=>{const dow=view==="day"?currentDate.getDay():0;return dow===6?4:12;})()},(_,i)=>i+8).map(h=>(
                    <div key={h} style={{height:40,borderBottom:"1px solid #f3f4f6",padding:"3px 8px",fontSize:"0.68rem",color:"#9ca3af",display:"flex",alignItems:"flex-start"}}>{h>12?h-12:h}{h>=12?"pm":"am"}</div>
                  ))}
                </div>
                {days.map((day,di)=>{
                  const dayEvents=getEventsForDay(day);
                  return(
                    <div key={di} style={{borderLeft:"1px solid #f3f4f6",position:"relative",minHeight:(()=>{const dow=day.getDay();return dow===6?160:480;})()}}>
                      {Array.from({length:(()=>{const dow=day.getDay();return dow===6?4:12;})()}).map((_,i)=>(
                        <div key={i} style={{height:40,borderBottom:"1px solid #f3f4f6"}}/>
                      ))}
                      {dayEvents.map((e,j)=>{
                        const startH=e.startMins/60;
                        const endH=e.endMins/60;
                        const top=Math.max(0,(startH-8)*60);
                        const height=Math.max(20,(endH-startH)*60);
                        return(
                          <div key={j} title={e.summary} style={{position:"absolute",top,left:2,right:2,height,background:eventColor(e.summary),borderRadius:4,padding:"3px 5px",overflow:"hidden",zIndex:1}}>
                            <div style={{fontSize:"0.7rem",fontWeight:700,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</div>
                            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.85)"}}>{e.startMins&&toTimeStrGlobal(e.startMins,e.endMins)}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"60px 1fr"}}>
                <div>
                  {Array.from({length:currentDate.getDay()===6?4:12},(_,i)=>i+8).map(h=>(
                    <div key={h} style={{height:40,borderBottom:"1px solid #f3f4f6",padding:"3px 8px",fontSize:"0.68rem",color:"#9ca3af",display:"flex",alignItems:"flex-start"}}>{h>12?h-12:h}{h>=12?"pm":"am"}</div>
                  ))}
                </div>
                <div style={{borderLeft:"1px solid #f3f4f6",position:"relative",minHeight:currentDate.getDay()===6?240:720}}>
                  {Array.from({length:currentDate.getDay()===6?4:12}).map((_,i)=>(
                    <div key={i} style={{height:40,borderBottom:"1px solid #f3f4f6"}}/>
                  ))}
                  {getEventsForDay(currentDate).map((e,j)=>{
                    const startH=e.startMins/60;
                    const endH=e.endMins/60;
                    const top=Math.max(0,(startH-8)*60);
                    const height=Math.max(24,(endH-startH)*60);
                    return(
                      <div key={j} title={e.summary} style={{position:"absolute",top,left:2,right:2,height,background:eventColor(e.summary),borderRadius:4,padding:"4px 8px",overflow:"hidden",zIndex:1}}>
                        <div style={{fontSize:"0.78rem",fontWeight:700,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</div>
                        <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.85)"}}>{e.startMins&&toTimeStrGlobal(e.startMins,e.endMins)}</div>
                        {e.location&&<div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {e.location}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:16,marginTop:12,flexWrap:"wrap"}}>
        {[["#1a3c34","Private Lesson"],["#0ea5e9","Semi-Private"],["#f97316","Group"],["#8C1515","Stanford"],["#6b7280","Other"]].map(([color,label])=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.78rem",color:"#6b7280"}}>
            <div style={{width:10,height:10,borderRadius:2,background:color}}/>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
function AdminPanel({allLessons,onUpdateLesson,onCancelLesson,onDeleteLesson,pendingStudents,onApprove,onDeny,mockUsers,onAddStudent,onAddLesson,onToggleMenlo,onToggleSaturday,onBlockStudent,onRemoveStudent,removedStudents,onRestoreStudent,onBlockRemoved,onToggleGrandfathered,stanfordEnabled=true,onToggleStanford}){
  const[tab,setTab]=useState(()=>{try{return localStorage.getItem("dm_admin_tab")||"students";}catch{return"students";}});
  useEffect(()=>{try{localStorage.setItem("dm_admin_tab",tab);}catch{}},[tab]);
  const[adminMenuOpen,setAdminMenuOpen]=useState(false);
  const[studentSearch,setStudentSearch]=useState("");
  const[selectedStudent,setSelectedStudent]=useState(null);
  const[editingStudent,setEditingStudent]=useState(false);
  const[editStudentData,setEditStudentData]=useState({});
  const[studentSaveStatus,setStudentSaveStatus]=useState("idle"); // idle | saving | error
  const[showSchedule,setShowSchedule]=useState(false);
  const[earningsRange,setEarningsRange]=useState("month");
  const[financeRange,setFinanceRange]=useState("month");const[showNetStanford,setShowNetStanford]=useState(false);
  const[includeStanford,setIncludeStanford]=useState(true);
  const[financeData,setFinanceData]=useState(null);
  const[financeLoading,setFinanceLoading]=useState(false);
  const[filterCancelled,setFilterCancelled]=useState(false);
  const[showStanford,setShowStanford]=useState(true);
  const[editingId,setEditingId]=useState(null);const[editPriceId,setEditPriceId]=useState(null);const[editPriceVal,setEditPriceVal]=useState("");
  const[editNotes,setEditNotes]=useState("");
  const[confirmCancel,setConfirmCancel]=useState(null);const[confirmDelete,setConfirmDelete]=useState(null);const[confirmDeleteStudent,setConfirmDeleteStudent]=useState(false);const[confirmCalDelete,setConfirmCalDelete]=useState(null);const[calDeleteLoading,setCalDeleteLoading]=useState(false);
  const[deleteLoading,setDeleteLoading]=useState(false);const[deletedToast,setDeletedToast]=useState(false);
  const[permDeleteTarget,setPermDeleteTarget]=useState(null);const[showArchivedLessons,setShowArchivedLessons]=useState(false);
  const[cancelLoading,setCancelLoading]=useState(false);
  const[coachRatingInput,setCoachRatingInput]=useState("");
  const[ratingNoteInput,setRatingNoteInput]=useState("");
  const[ratingHistories,setRatingHistories]=useState({});
  const[duprIdInput,setDuprIdInput]=useState("");
  const[duprSyncStatus,setDuprSyncStatus]=useState("idle");// idle|syncing|success|error
  const[duprSyncError,setDuprSyncError]=useState("");// keyed by student email
  const[mob,setMob]=useState(()=>window.innerWidth<640);
  useEffect(()=>{const h=()=>setMob(window.innerWidth<640);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const[scheduleStep,setScheduleStep]=useState(1);
  const[schedLessonType,setSchedLessonType]=useState("private");
  const[schedDuration,setSchedDuration]=useState(60);
  const[schedDate,setSchedDate]=useState("");
  const[schedSlot,setSchedSlot]=useState(null);
  const[schedSlotIdx,setSchedSlotIdx]=useState(-1);
  const[schedFocus,setSchedFocus]=useState("");
  const[schedNotes,setSchedNotes]=useState("");
  const[schedPartner,setSchedPartner]=useState({firstName:"",lastName:"",email:""});
  const[schedGroupSize,setSchedGroupSize]=useState(3);
  const[schedGroupMembers,setSchedGroupMembers]=useState([{firstName:"",lastName:"",email:""},{firstName:"",lastName:"",email:""},{firstName:"",lastName:"",email:""},{firstName:"",lastName:"",email:""}]);
  const[schedBusyTimes,setSchedBusyTimes]=useState([]);
  const[schedLoadingSlots,setSchedLoadingSlots]=useState(false);
  const[schedFullyBookedDays,setSchedFullyBookedDays]=useState(new Set());
  const[schedSlotCounts,setSchedSlotCounts]=useState(new Map());
  const[schedLoadingAvail,setSchedLoadingAvail]=useState(false);
  const[schedQuickMins,setSchedQuickMins]=useState(null); // target startMins pre-filled from week view click
  const[schedSubmitting,setSchedSubmitting]=useState(false);const[schedCustomPrice,setSchedCustomPrice]=useState("");const[customLocation,setCustomLocation]=useState(false);const[schedLocation,setSchedLocation]=useState("");
  
  const[pendingMenlo,setPendingMenlo]=useState({}); // {[studentId]: boolean}
  const[pendingGrandfathered,setPendingGrandfathered]=useState({}); // {[studentId]: boolean}
  const[showAddStudent,setShowAddStudent]=useState(false);
  const[newStudent,setNewStudent]=useState({name:"",email:"",memberType:"public"});
  const[studentView,setStudentView]=useState("active"); // "active" | "removed"
  const[calSyncStatus,setCalSyncStatus]=useState("idle"); // "idle"|"syncing"|"done"|"error"
  const[calSyncResult,setCalSyncResult]=useState(null); // {created,skipped,emails}
  const[confirmDeleteLogin,setConfirmDeleteLogin]=useState(null); // email being confirmed for deletion
  const[showCalendar,setShowCalendar]=useState(true);
  const[showEvents,setShowEvents]=useState(true);
  const[calendarItems,setCalendarItems]=useState([]);
  const[calLoading,setCalLoading]=useState(false);
  const[weather,setWeather]=useState(null);
  const[upcomingView,setUpcomingView]=useState("upcoming");
  const[eventsData,setEventsData]=useState([]);
  const[eventsLoading,setEventsLoading]=useState(false);
  const[selectedDay,setSelectedDay]=useState(toDS(new Date()));
  const[calMonth,setCalMonth]=useState(toDS(new Date()).slice(0,7));
  const[activeMenu,setActiveMenu]=useState(null);
  const[monthDayPopover,setMonthDayPopover]=useState(null);
  const[quickBook,setQuickBook]=useState(null);
  const[weekBusyMap,setWeekBusyMap]=useState({});
  const[weekBusyLoading,setWeekBusyLoading]=useState(false);

  const earnings=getEarnings(allLessons,mockUsers,earningsRange);
  // Calendar-based earnings (non-Stanford, non-pickup, non-Menlo — mirrors Finances tab)
  const calEarnings=(()=>{
    const now=new Date();
    const items=calendarItems.filter(c=>{
      if(c.isStanford||c.isPickup)return false;
      const d=new Date(c.date+"T23:59:59");
      if(d>now)return false;
      if(earningsRange==="week"){const s=new Date(now);s.setDate(now.getDate()-now.getDay());return d>=s;}
      if(earningsRange==="month")return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      return d.getFullYear()===now.getFullYear();
    });
    return items.reduce((sum,c)=>sum+(c.earnings||0),0);
  })();
  // Upcoming calendar lessons for dashboard count (non-Stanford, non-pickup, future)
  const upcomingCalItems=calendarItems.filter(c=>!c.isPickup&&!c.isStanford&&new Date(c.date+"T12:00:00")>new Date());
  const allStudents=Object.keys(mockUsers);
  const sortedStudents=[...allStudents].sort((a,b)=>{
    const aLast=(mockUsers[a]?.name||a).split(" ").slice(-1)[0].toLowerCase();
    const bLast=(mockUsers[b]?.name||b).split(" ").slice(-1)[0].toLowerCase();
    return aLast.localeCompare(bLast);
  });
  const filteredStudents=sortedStudents.filter(email=>{
    const u=mockUsers[email]||{};
    return (u.name||email).toLowerCase().includes(studentSearch.toLowerCase())||email.toLowerCase().includes(studentSearch.toLowerCase());
  });

  const allLessonsList=Object.entries(allLessons).flatMap(([email,lessons])=>
    lessons.filter(l=>l.status!=="archived").map(l=>({...l,studentEmail:email,studentName:mockUsers[email]?.name||email,isMenlo:mockUsers[email]?.memberType==="menlo"}))
  ).sort((a,b)=>new Date(b.date)-new Date(a.date));

  // GCal event IDs that belong to portal lessons — used to deduplicate calendar views
  const portalGcalIds=new Set(allLessonsList.filter(l=>l.gcalEventId).map(l=>l.gcalEventId));

  const cancelledStatuses2=["cancelled","late_cancel","cancelled_forgiven","weather_cancel","no_show"];

  const fetchCalendarItems=async()=>{
    setCalLoading(true);
    try{
      const past=toDS(addDays(new Date(),-180));
      const future=toDS(addDays(new Date(),90));
      const r=await adminFetch("/api/earnings-calendar?start="+past+"&end="+future+"&includeFuture=true&includeStanford=true");
      const d=await r.json();
      setCalendarItems(d.events||[]);
    }catch(e){console.error("Cal fetch:",e);setCalendarItems([]);}
    setCalLoading(false);
  };

  useEffect(()=>{
    // 94303 = Palo Alto / Menlo Park area
    fetch("https://api.open-meteo.com/v1/forecast?latitude=37.4419&longitude=-122.1430&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Los_Angeles&forecast_days=2")
      .then(r=>r.json()).then(d=>{
        const wEmoji=code=>code===0?"☀️":code<=3?"⛅":code<=48?"🌫️":code<=55?"🌦️":code<=65?"🌧️":code<=75?"🌨️":code<=82?"🌦️":"⛈️";
        const wDesc=code=>code===0?"Clear":code<=3?"Partly Cloudy":code<=48?"Foggy":code<=55?"Drizzle":code<=65?"Rain":code<=75?"Snow":code<=82?"Showers":"Thunderstorms";
        const code=d.current?.weather_code??0;const temp=Math.round(d.current?.temperature_2m??0);
        // Build hourly strip: find current hour index and grab next 8 hrs
        const nowH=new Date().getHours();
        const times=d.hourly?.time||[];const temps=d.hourly?.temperature_2m||[];const codes=d.hourly?.weather_code||[];
        const todayStr=toDS(new Date());
        const hourly=[];
        for(let i=0;i<times.length&&hourly.length<8;i++){
          const t=times[i];if(!t.startsWith(todayStr)&&!t.startsWith(toDS(addDays(new Date(),1))))continue;
          const h=parseInt(t.split("T")[1]);if(t.startsWith(todayStr)&&h<nowH)continue;
          const isPM=h>=12;const disp=h===0?"12am":h===12?"12pm":h>12?(h-12)+"pm":h+"am";
          hourly.push({time:disp,temp:Math.round(temps[i]),emoji:wEmoji(codes[i]||0)});
        }
        setWeather({temp,emoji:wEmoji(code),desc:wDesc(code),hourly});
      }).catch(()=>{});
  },[]);
  // Load calendar on mount so dashboard earnings + upcoming are always populated
  useEffect(()=>{fetchCalendarItems();},[]);
  useEffect(()=>{if(tab==="lessons"&&calendarItems.length===0&&!calLoading)fetchCalendarItems();},[tab]);
  // Auto-sync calendar attendees → provisional student accounts when Students tab opens
  // Runs silently in background; results appear on next render if new accounts are created
  // Calendar lesson history for provisional students
  const[calLessons,setCalLessons]=useState({}); // email → lesson[]
  const[calLessonsLoading,setCalLessonsLoading]=useState(false);
  useEffect(()=>{
    if(!selectedStudent)return;
    const u=mockUsers[selectedStudent]||{};
    const supabaseLessons=(allLessons[selectedStudent]||[]).filter(l=>l.status!=="archived");
    // Fetch calendar history if: provisional account OR has no Supabase lessons at all
    if(!u.provisional&&supabaseLessons.length>0)return;
    if(calLessons[selectedStudent]!==undefined)return; // already fetched
    setCalLessonsLoading(true);
    adminFetch("/api/students?action=calendar-history&email="+encodeURIComponent(selectedStudent))
      .then(r=>r.json())
      .then(d=>{setCalLessons(prev=>({...prev,[selectedStudent]:d.lessons||[]}));setCalLessonsLoading(false);})
      .catch(()=>{setCalLessons(prev=>({...prev,[selectedStudent]:[]}));setCalLessonsLoading(false);});
  },[selectedStudent]);

  const calSyncedRef=React.useRef(false);
  useEffect(()=>{
    if(tab!=="students"||calSyncedRef.current)return;
    calSyncedRef.current=true;
    adminFetch("/api/students?action=sync",{method:"POST",body:JSON.stringify({})})
      .then(r=>r.json())
      .then(async d=>{
        if(d.created>0){
          const sr2=await adminFetch("/api/students?action=list").then(x=>x.json()).catch(()=>({}));
          if(sr2.students){
            const users2={};
            sr2.students.forEach(s=>{
              const se=(s.email||"").toLowerCase();
              users2[se]={name:s.name||s.email,firstName:s.first_name||"",lastName:s.last_name||"",commEmail:s.comm_email||"",skillLevel:s.skill_level||"",duprRating:s.dupr_rating||"",duprDoublesRating:s.dupr_doubles_rating||"",duprId:s.dupr_id||"",duprPlayerName:s.dupr_player_name||"",memberType:s.member_type||"public",approved:s.approved,blocked:s.blocked,grandfathered:!!(s.grandfathered),phone:s.phone||"",city:s.city||"",homeCourt:s.home_court||"",picture:s.picture||"",provisional:!!(s.provisional),source:s.source||"self_registered",calendarName:s.calendar_name||""};
            });
            setMockUsersState(users2);
          }
        }
      }).catch(()=>{});
  },[tab]);
  // Reset DUPR input when switching students
  useEffect(()=>{setDuprIdInput("");setDuprSyncStatus("idle");setDuprSyncError("");},[selectedStudent]);
  useEffect(()=>{if(tab==="lessons"&&eventsData.length===0&&!eventsLoading){const s=toDS(new Date());const e=toDS(addDays(new Date(),90));setEventsLoading(true);fetch("/api/calendar-events?start="+s+"&end="+e+"&keywords=rental,tournament").then(r=>r.json()).then(d=>{setEventsData(d.events||[]);setEventsLoading(false);}).catch(()=>setEventsLoading(false));}},[tab]);
  useEffect(()=>{
    if(tab!=="lessons"||upcomingView!=="week")return;
    const days=getWeekDays(selectedDay);
    const weekStart=days[0];const weekEnd=days[6];
    setWeekBusyLoading(true);
    fetch("/api/get-busy-times?date="+weekStart+"&endDate="+weekEnd)
      .then(r=>r.json())
      .then(d=>{
        const map={};
        (d.busy||[]).forEach(b=>{
          const dk=b.start.substring(0,10);
          if(!map[dk])map[dk]=[];
          map[dk].push(b);
        });
        setWeekBusyMap(map);
      })
      .catch(()=>{})
      .finally(()=>setWeekBusyLoading(false));
  },[tab,upcomingView,selectedDay]);

  const getWeekDays=(ref)=>{const d=new Date(ref+"T12:00:00");const dow=d.getDay();const sun=new Date(d);sun.setDate(d.getDate()-dow);return Array.from({length:7},(_,i)=>{const x=new Date(sun);x.setDate(sun.getDate()+i);return toDS(x);});};
  const getMonthGrid=(ym)=>{const[y,m]=ym.split("-").map(Number);const first=new Date(y,m-1,1);const last=new Date(y,m,0);const pad=first.getDay();const days=Array(pad).fill(null);for(let d=1;d<=last.getDate();d++)days.push(toDS(new Date(y,m-1,d)));while(days.length%7!==0)days.push(null);return days;};
  const timeStrToMins=(str)=>{if(!str)return null;const m=str.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);if(!m)return null;let h=parseInt(m[1]),mn=parseInt(m[2]);const pm=m[3].toUpperCase()==='PM';if(pm&&h!==12)h+=12;if(!pm&&h===12)h=0;return h*60+mn;};
  const getItemStartEnd=(item)=>{if(item.studentEmail){if(!item.time)return{s:null,e:null};const sep=item.time.includes(' \u2013 ')?' \u2013 ':' - ';const parts=item.time.split(sep);return{s:timeStrToMins(parts[0]),e:parts[1]?timeStrToMins(parts[1]):null};}return{s:timeStrToMins(item.startTime),e:timeStrToMins(item.endTime)};};

  const schedIsMenlo=selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo";
  const SCHED_PRICES={private:{60:schedIsMenlo?115:120,90:schedIsMenlo?170:180},semi:{60:schedIsMenlo?120:140,90:schedIsMenlo?180:210},group:{60:140,90:210},clinic:{60:35,90:35}};

  // Pre-load 30-day availability for admin calendar (mirrors student booking behaviour)
  useEffect(()=>{
    const mt=schedIsMenlo?"menlo":"public";
    const today=new Date();
    const startStr=toDS(today);
    const endStr=toDS(addDays(today,30));
    setSchedLoadingAvail(true);
    setSchedFullyBookedDays(new Set());
    setSchedSlotCounts(new Map());
    fetch("/api/get-busy-times?date="+startStr+"&endDate="+endStr+"&memberType="+mt)
      .then(r=>r.json())
      .then(data=>{
        const busyAll=data.busy||[];
        const busyByDay={};
        busyAll.forEach(b=>{const day=b.start.substring(0,10);if(!busyByDay[day])busyByDay[day]=[];busyByDay[day].push(b);});
        const fullyBooked=new Set();
        const counts=new Map();
        for(let i=0;i<=30;i++){
          const d=addDays(today,i);const ds=toDS(d);
          const busyForDay=busyByDay[ds]||[];
          const avail=getSlots(ds,mt,schedDuration).filter(s=>!busyForDay.some(b=>{const bufA=b.bufferAfter??30;const bufB=b.bufferBefore??30;return s.s<(b.endMins+bufA)&&s.e>(b.startMins-bufB);}));
          if(avail.length===0)fullyBooked.add(ds);
          else counts.set(ds,avail.length);
        }
        setSchedFullyBookedDays(fullyBooked);
        setSchedSlotCounts(counts);
        setSchedLoadingAvail(false);
      })
      .catch(()=>setSchedLoadingAvail(false));
  },[schedDuration,schedIsMenlo]);
  const schedSlots=schedDate?getSlots(schedDate,schedIsMenlo?"menlo":"public",schedDuration).filter(s=>!schedBusyTimes.some(b=>{const bufA=b.bufferAfter??30;const bufB=b.bufferBefore??30;return s.s<(b.endMins+bufA)&&s.e>(b.startMins-bufB);})):[];
  const toTime24=(mins)=>{const h=Math.floor(mins/60),m=mins%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");};
  const toTimeStr=(s,e)=>fmt(s)+" - "+fmt(e);

  const handleSchedule=async()=>{
    if(!selectedStudent||!schedDate||!schedSlot)return;
    setSchedSubmitting(true);
    const startTime=toTime24(schedSlot.s);
    const endTime=toTime24(schedSlot.e);
    const timeStr=toTimeStr(schedSlot.s,schedSlot.e);
    const student=mockUsers[selectedStudent]||{};
    const lessonLabel=schedLessonType==="private"?"Private":schedLessonType==="semi"?"Semi-Private":schedLessonType==="clinic"?"Clinic":"Group";
    const schedPartnerFull=(schedPartner.firstName+" "+schedPartner.lastName).trim();
    const memberNames=schedLessonType==="semi"?[student.name,schedPartnerFull]:(schedLessonType==="group"||schedLessonType==="clinic")?[student.name,...schedGroupMembers.slice(0,schedGroupSize-1).map(m=>(m.firstName+" "+m.lastName).trim())]:[student.name];
    const titleSuffix=schedLessonType==="clinic"?" pb clinic":schedLessonType==="group"?" pb group lesson":" pb lesson";
    const summary=memberNames.join("/")+titleSuffix;
    const location=customLocation&&schedLocation?schedLocation:(!schedIsMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063, USA":"Menlo Circus Club, 190 Park Ln, Atherton, CA 94027");
    const ticketId2=generateTicket();
    const _schedPartnerInfo=schedLessonType==="semi"&&schedPartnerFull?"\nPartner: "+schedPartnerFull+(schedPartner.email?" ("+schedPartner.email+")":""):"";
    const _schedGroupInfo=(schedLessonType==="group"||schedLessonType==="clinic")&&memberNames.length>1?"\n"+(schedLessonType==="clinic"?"Participants":"Group")+": "+memberNames.join(", "):"";
    const description="Ticket: "+ticketId2+"\nStudent: "+student.name+"\nEmail: "+selectedStudent+"\nType: "+lessonLabel+" "+schedDuration+"min\nFocus: "+(schedFocus||"Not specified")+"\nNotes: "+(schedNotes||"None")+_schedPartnerInfo+_schedGroupInfo+"\nLocation: "+location+"\nManage: https://dmpickleball.com";
    const additionalEmails2=schedLessonType==="semi"&&schedPartner.email?[schedPartner.email]:(schedLessonType==="group"||schedLessonType==="clinic")?schedGroupMembers.slice(0,schedGroupSize-1).map(m=>m.email).filter(Boolean):[];
    let eventId="";
    try{
      const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary,description,date:schedDate,startTime,endTime,location,studentEmail:selectedStudent,studentName:student.name,additionalEmails:additionalEmails2})});
      const d=await r.json();
      if(d.eventId)eventId=d.eventId;
      if(!d.attendeesAdded)console.warn("GCal attendees NOT added:",d.attendeeError||"unknown reason","emails attempted:",selectedStudent,...(additionalEmails2||[]));
      else console.log("GCal attendees added OK, count:",d.attendeeCount);
    }catch(e){console.error("GCal:",e);}
    const startISO=schedDate+"T"+startTime+":00";
    const endISO=schedDate+"T"+endTime+":00";
    const link="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(summary)+"&dates="+startISO.replace(/[-:]/g,"").slice(0,15)+"/"+endISO.replace(/[-:]/g,"").slice(0,15)+"&details="+encodeURIComponent(description)+"&location="+encodeURIComponent(location);
    const sendEmail2=(to,subject,text,replyTo,calLink,fromAlias)=>{const html=makeEmailHtml(text,calLink);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,...(replyTo?{replyTo}:{}),...(fromAlias?{fromAlias}:{})})}).catch(()=>{});};
    const partnerInfo2=schedLessonType==="semi"&&schedPartnerFull?"\nPartner: "+schedPartnerFull+(schedPartner.email?" ("+schedPartner.email+")":""):"";
    const groupInfo2=schedLessonType==="group"&&schedGroupMembers.slice(0,schedGroupSize-1).some(m=>m.firstName)?"\nGroup: "+schedGroupMembers.slice(0,schedGroupSize-1).filter(m=>m.firstName).map(m=>(m.firstName+" "+m.lastName).trim()+(m.email?" ("+m.email+")":"")).join(", "):"";
    const schedPriceTotal=schedCustomPrice?parseFloat(schedCustomPrice):schedLessonType==="clinic"?(35*schedGroupSize):(SCHED_PRICES[schedLessonType]?.[schedDuration]||0);
    const schedPriceNote=!schedCustomPrice&&schedLessonType==="semi"?" ($"+(schedPriceTotal/2)+"/person)":!schedCustomPrice&&schedLessonType==="group"?" (split equally)":"";
    const schedStudentText="Hi "+student.name+",\n\nCoach David has scheduled a lesson for you!\n\nRef: "+ticketId2+"\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+schedDuration+" min\nPrice: $"+schedPriceTotal+" total"+schedPriceNote+"\nFocus: "+(schedFocus||"Not specified")+"\nLocation: "+location+"\n\nSee you on the court!\nCoach David";
    await sendEmail2(selectedStudent,"Your lesson is booked - "+fmtDateShort(schedDate),schedStudentText,"book@dmpickleball.com",link,"book@dmpickleball.com");
    const schedAdminText="You scheduled a lesson!\n\nRef: "+ticketId2+"\nStudent: "+student.name+"\nEmail: "+selectedStudent+"\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+schedDuration+" min\nPrice: $"+schedPriceTotal+" total"+schedPriceNote+"\nFocus: "+(schedFocus||"Not specified")+partnerInfo2+groupInfo2+"\nLocation: "+location;
    await sendEmail2("david@dmpickleball.com","Scheduled: "+summary+" - "+fmtDateShort(schedDate),schedAdminText,selectedStudent,null,"noreply@dmpickleball.com");
    if(schedLessonType==="semi"&&schedPartner.email){const schedPartnerText="Hi "+schedPartnerFull+",\n\n"+student.name+" has added you to a pickleball lesson with Coach David!\n\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: Semi-Private · "+schedDuration+" min\nFocus: "+(schedFocus||"Not specified")+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail2(schedPartner.email,"You've been added to a pickleball lesson - "+fmtDateShort(schedDate),schedPartnerText,"book@dmpickleball.com",link,"book@dmpickleball.com");}
    if(schedLessonType==="group"||schedLessonType==="clinic"){for(const m of schedGroupMembers.slice(0,schedGroupSize-1)){if(m.email){const mFull=(m.firstName+" "+m.lastName).trim();const typeWord=schedLessonType==="clinic"?"clinic":"group pickleball lesson";const schedGroupText="Hi "+mFull+",\n\n"+student.name+" has added you to a pickleball "+typeWord+" with Coach David!\n\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail2(m.email,"You've been added to a pickleball "+typeWord+" - "+fmtDateShort(schedDate),schedGroupText,"book@dmpickleball.com",link,"book@dmpickleball.com");}}}
    const finalPrice=schedCustomPrice?parseFloat(schedCustomPrice):null;
    const newLesson={id:Date.now(),date:schedDate,time:timeStr,type:lessonLabel,duration:schedDuration+" min",status:"confirmed",focus:schedFocus,notes:"",photos:[],videos:[],gcalEventId:eventId,ticketId:ticketId2,customPrice:finalPrice,partnerEmail:schedLessonType==="semi"?schedPartner.email:"",members:memberNames.slice(1)};
    onAddLesson(selectedStudent,newLesson);
    setShowSchedule(false);
    setScheduleStep(1);setSchedLessonType("private");setSchedDuration(60);setSchedDate("");setSchedSlot(null);setSchedSlotIdx(-1);setSchedFocus("");setSchedNotes("");setSchedBusyTimes([]);setSchedCustomPrice("");setSchedQuickMins(null);setSchedPartner({name:"",email:""});setSchedGroupMembers([{name:"",email:""},{name:"",email:""},{name:"",email:""},{name:"",email:""}]);setSchedGroupSize(3);
    setSchedSubmitting(false);
    alert("Lesson scheduled for "+student.name+"!");
  };


  return(
    <div style={{maxWidth:1100,margin:"0 auto",padding:mob?"16px 12px":"40px 24px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      {/* Deleted lesson success toast */}
      {deletedToast&&(
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#1a3c34",color:"white",borderRadius:50,padding:"12px 28px",fontWeight:700,fontSize:"0.9rem",boxShadow:"0 4px 20px rgba(0,0,0,0.18)",zIndex:9999,display:"flex",alignItems:"center",gap:8,animation:"fadeInUp 0.25s ease"}}>
          ✓ Lesson deleted successfully
        </div>
      )}
      <div style={{marginBottom:28,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Admin Panel</div>
          <h2 style={{fontWeight:900,fontSize:"1.6rem",color:G}}>David Dashboard</h2>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:32}}>
        <div onClick={()=>{setTab("students");setSelectedStudent(null);}} style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb",cursor:"pointer",transition:"box-shadow 0.15s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Students</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:"#1a1a1a"}}>{allStudents.length}</div>
          <div style={{fontSize:"0.8rem",color:G,marginTop:4,fontWeight:600}}>View all →</div>
        </div>
        <div onClick={()=>{setTab("lessons");setUpcomingView("upcoming");}} style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb",cursor:"pointer",transition:"box-shadow 0.15s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Upcoming</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:"#1a1a1a"}}>{calLoading?"…":upcomingCalItems.length||allLessonsList.filter(l=>!isPast(l.date,l.time)&&l.status!=="cancelled").length}</div>
          <div style={{fontSize:"0.8rem",color:G,marginTop:4,fontWeight:600}}>View schedule →</div>
        </div>
      </div>

      {/* ── Admin nav: tabs on desktop, burger on mobile ── */}
      {(()=>{
        const TABS=[["students","Students"],["lessons","Lessons"],["finances","Finances"],["database","All Lessons"],["gear","Gear"],["traffic","Traffic"]];
        const isMobNav=window.innerWidth<640;
        if(!isMobNav){
          return(
            <div style={{borderBottom:"2px solid #e5e7eb",marginBottom:28,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{display:"flex",gap:0,minWidth:"max-content"}}>
                {TABS.map(([t,label])=>(
                  <button key={t} onClick={()=>{setTab(t);setSelectedStudent(null);setShowSchedule(false);setAdminMenuOpen(false);}}
                    style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t?G:"transparent"),marginBottom:-2,padding:"10px 18px",fontSize:"0.88rem",fontWeight:tab===t?700:500,color:tab===t?G:"#6b7280",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    {label}
                    {t==="students"&&pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"1px 7px",fontSize:"0.7rem",fontWeight:800,marginLeft:6}}>{pendingStudents.length}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        const activeLabel=TABS.find(([t])=>t===tab)?.[1]||"Menu";
        return(
          <div style={{marginBottom:20,position:"relative"}}>
            <button onClick={()=>setAdminMenuOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,background:"white",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"10px 16px",width:"100%",cursor:"pointer",fontWeight:700,fontSize:"0.9rem",color:"#1a1a1a"}}>
              <span style={{flex:1,textAlign:"left"}}>{activeLabel}{tab==="students"&&pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"1px 7px",fontSize:"0.7rem",fontWeight:800,marginLeft:8}}>{pendingStudents.length}</span>}</span>
              <span style={{fontSize:"1.2rem",lineHeight:1}}>{adminMenuOpen?"✕":"☰"}</span>
            </button>
            {adminMenuOpen&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"white",border:"1.5px solid #e5e7eb",borderRadius:12,zIndex:100,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>
                {TABS.map(([t,label])=>(
                  <button key={t} onClick={()=>{setTab(t);setSelectedStudent(null);setShowSchedule(false);setAdminMenuOpen(false);}}
                    style={{display:"block",width:"100%",textAlign:"left",background:tab===t?"#f0faf5":"white",border:"none",borderBottom:"1px solid #f3f4f6",padding:"12px 16px",fontSize:"0.9rem",fontWeight:tab===t?700:500,color:tab===t?G:"#374151",cursor:"pointer"}}>
                    {label}
                    {t==="students"&&pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"1px 7px",fontSize:"0.7rem",fontWeight:800,marginLeft:8}}>{pendingStudents.length}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {tab==="students"&&!selectedStudent&&(
        <div>
          {/* ── Pending requests inline section ── */}
          {pendingStudents.length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{fontWeight:800,fontSize:"0.88rem",color:"#dc2626",textTransform:"uppercase",letterSpacing:1}}>⏳ Pending Requests</div>
                <span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"1px 8px",fontSize:"0.72rem",fontWeight:800}}>{pendingStudents.length}</span>
              </div>
              {pendingStudents.map(student=>{
                const isMenloChecked=!!(pendingMenlo[student.id]);
                const isGFChecked=!!(pendingGrandfathered[student.id]);
                return(
                <div key={student.id} style={{background:"#fff8f8",borderRadius:12,border:"1.5px solid #fca5a5",padding:"16px 20px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                    {/* Student info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:"0.97rem"}}>{student.firstName&&student.lastName?student.lastName+", "+student.firstName:student.name}</div>
                      <div style={{fontSize:"0.83rem",color:"#6b7280",marginTop:2}}>{student.email}{student.commEmail&&student.commEmail!==student.email?" · "+student.commEmail:""}</div>
                      {student.phone&&<div style={{fontSize:"0.8rem",color:"#9ca3af",marginTop:1}}>📱 {formatPhone(student.phone)}{student.homeCourt?" · "+student.homeCourt:""}</div>}
                      {student.skillLevel&&<div style={{marginTop:2,fontSize:"0.75rem",color:"#9ca3af"}}>Self-rated: {(SELF_RATINGS.find(r=>r.value===student.skillLevel)||{label:student.skillLevel}).label}</div>}
                      {student.goals&&<div style={{marginTop:1,fontSize:"0.75rem",color:"#9ca3af"}}>{({fun:"Just for fun",improve:"Improve my game",compete:"Compete locally",serious:"Train seriously"})[student.goals]||student.goals}</div>}
                      {student.referralSource&&<div style={{marginTop:1,fontSize:"0.75rem",color:"#9ca3af"}}>{({word_of_mouth:"Word of mouth",club:"Club / court",instagram:"Instagram",google:"Google",other:"Other"})[student.referralSource]||student.referralSource}</div>}
                      {student.duprId&&<div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:6,background:"#e0e7ff",borderRadius:6,padding:"3px 10px"}}>
                        <span style={{fontSize:"0.65rem",fontWeight:800,color:"#0a1551",letterSpacing:1}}>DUPR</span>
                        <span style={{fontSize:"0.78rem",fontWeight:700,color:"#1e3a5f"}}>{student.duprId}</span>
                        <span style={{fontSize:"0.65rem",color:"#6b7280"}}>— will sync on approve</span>
                      </div>}
                    </div>
                    {/* Approval controls */}
                    <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end",flexShrink:0}}>
                      {/* Menlo Club checkbox — mutually exclusive with GF */}
                      <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",userSelect:"none",fontSize:"0.82rem",fontWeight:600,color:isMenloChecked?G:"#374151"}}>
                        <input type="checkbox" checked={isMenloChecked}
                          onChange={e=>{setPendingMenlo(prev=>({...prev,[student.id]:e.target.checked}));if(e.target.checked)setPendingGrandfathered(prev=>({...prev,[student.id]:false}));}}
                          style={{width:15,height:15,accentColor:G,cursor:"pointer"}}/>
                        Menlo Circus Club
                      </label>
                      {/* Grandfathered Pricing checkbox — mutually exclusive with MCC */}
                      <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",userSelect:"none",fontSize:"0.82rem",fontWeight:600,color:isGFChecked?"#92400e":"#374151"}}>
                        <input type="checkbox" checked={isGFChecked}
                          onChange={e=>{setPendingGrandfathered(prev=>({...prev,[student.id]:e.target.checked}));if(e.target.checked)setPendingMenlo(prev=>({...prev,[student.id]:false}));}}
                          style={{width:15,height:15,accentColor:"#f59e0b",cursor:"pointer"}}/>
                        Grandfathered Pricing
                      </label>
                      {/* Action buttons */}
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>onApprove(student,isMenloChecked?"menlo":"public",isGFChecked)}
                          style={{background:G,color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>
                          ✓ Approve{isMenloChecked?" (Menlo)":""}{isGFChecked?" (GF)":""}
                        </button>
                        <button onClick={()=>onDeny(student.id)}
                          style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"7px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>
                          ✕ Deny
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
              <div style={{height:1,background:"#e5e7eb",marginBottom:20}}/>
            </div>
          )}
          {/* ── View toggle: Active / Removed ── */}
          <div style={{display:"flex",gap:0,marginBottom:16,borderRadius:50,overflow:"hidden",border:"1.5px solid #e5e7eb",alignSelf:"flex-start",width:"fit-content"}}>
            {[["active","Active",filteredStudents.length],["removed","Removed",(removedStudents||[]).length]].map(([v,lbl,cnt],i)=>(
              <button key={v} onClick={()=>{setStudentView(v);setConfirmDeleteLogin(null);}} style={{background:studentView===v?(v==="removed"?"#7f1d1d":G):"white",color:studentView===v?"white":v==="removed"?"#7f1d1d":"#374151",border:"none",padding:"7px 20px",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",borderLeft:i>0?"1.5px solid #e5e7eb":"none"}}>{lbl} ({cnt})</button>
            ))}
          </div>

          {/* Active */}
          {studentView==="active"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:calSyncResult?8:16,flexWrap:"wrap",gap:8}}>
              <input placeholder="🔍 Search students..." value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} style={{...inp,marginBottom:0,maxWidth:260,flex:1}}/>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={async()=>{
                  setCalSyncStatus("syncing");setCalSyncResult(null);
                  try{
                    const r=await adminFetch("/api/students?action=sync",{method:"POST",body:JSON.stringify({})});
                    const d=await r.json();
                    if(d.error)throw new Error(d.error);
                    setCalSyncResult(d);
                    if(d.created>0){
                      // Reload students list to pick up new provisional accounts
                      const sr2=await adminFetch("/api/students?action=list").then(x=>x.json()).catch(()=>({}));
                      if(sr2.students){
                        const users2={};
                        sr2.students.forEach(s=>{
                          const se=(s.email||"").toLowerCase();
                          users2[se]={name:s.name||s.email,firstName:s.first_name||"",lastName:s.last_name||"",commEmail:s.comm_email||"",skillLevel:s.skill_level||"",duprRating:s.dupr_rating||"",duprDoublesRating:s.dupr_doubles_rating||"",duprId:s.dupr_id||"",duprPlayerName:s.dupr_player_name||"",memberType:s.member_type||"public",approved:s.approved,blocked:s.blocked,grandfathered:!!(s.grandfathered),phone:s.phone||"",city:s.city||"",homeCourt:s.home_court||"",picture:s.picture||"",provisional:!!(s.provisional),source:s.source||"self_registered",calendarName:s.calendar_name||""};
                        });
                        setMockUsersState(users2);
                      }
                    }
                    setCalSyncStatus("done");
                  }catch(e){setCalSyncStatus("error");setCalSyncResult({error:e.message});}
                }} disabled={calSyncStatus==="syncing"} style={{background:calSyncStatus==="error"?"#dc2626":calSyncStatus==="done"?"#15803d":"white",color:calSyncStatus==="error"||calSyncStatus==="done"?"white":"#374151",border:"1.5px solid "+(calSyncStatus==="error"?"#dc2626":calSyncStatus==="done"?"#15803d":"#e5e7eb"),padding:"7px 16px",borderRadius:50,cursor:calSyncStatus==="syncing"?"not-allowed":"pointer",fontWeight:600,fontSize:"0.8rem",whiteSpace:"nowrap"}}>
                  {calSyncStatus==="syncing"?"Syncing…":calSyncStatus==="done"?"Synced ✓":calSyncStatus==="error"?"Sync Error":"Sync from Calendar"}
                </button>
                <button onClick={()=>setShowAddStudent(!showAddStudent)} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>+ Add Student</button>
              </div>
            </div>
            {calSyncResult&&!calSyncResult.error&&(
              <div style={{background:calSyncResult.created>0?"#f0fdf4":"#f9fafb",border:"1.5px solid "+(calSyncResult.created>0?"#86efac":"#e5e7eb"),borderRadius:10,padding:"10px 16px",marginBottom:14,fontSize:"0.82rem",color:calSyncResult.created>0?"#15803d":"#6b7280",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <span>{calSyncResult.created>0?`✓ Created ${calSyncResult.created} new student account${calSyncResult.created===1?"":"s"} from your calendar.`:`No new students found — all calendar attendees already have accounts.`}</span>
                <button onClick={()=>{setCalSyncResult(null);setCalSyncStatus("idle");}} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:"1rem",lineHeight:1,padding:"0 4px"}}>✕</button>
              </div>
            )}
            {showAddStudent&&(
              <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:16,border:"1.5px solid #e5e7eb"}}>
                <div style={{fontWeight:700,marginBottom:12}}>Add Student Manually</div>
                <input placeholder="Full Name" value={newStudent.name} onChange={e=>setNewStudent({...newStudent,name:e.target.value})} style={inp}/>
                <input placeholder="Email Address" value={newStudent.email} onChange={e=>setNewStudent({...newStudent,email:e.target.value})} style={inp}/>
                <select value={newStudent.memberType} onChange={e=>setNewStudent({...newStudent,memberType:e.target.value})} style={{...inp,marginBottom:12}}>
                  <option value="public">General Student</option>
                  <option value="menlo">Menlo Circus Club</option>
                </select>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowAddStudent(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:600}}>Cancel</button>
                  <button onClick={()=>{if(!newStudent.name||!newStudent.email){alert("Name and email required.");return;}onAddStudent(newStudent);setNewStudent({name:"",email:"",memberType:"public"});setShowAddStudent(false);}} style={{background:G,color:"white",border:"none",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:700}}>Add Student</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gap:10}}>
              {filteredStudents.map(email=>{
                const u=mockUsers[email]||{};
                const lessons=allLessons[email]||[];
                const upcoming=lessons.filter(l=>!isPast(l.date,l.time)&&l.status!=="cancelled");
                const completed=lessons.filter(l=>isPast(l.date,l.time)||l.status==="completed");
                return(
                  <div key={email} onClick={()=>{setSelectedStudent(email);setEditingStudent(false);setEditStudentData({});setConfirmDeleteStudent(false);}} style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,transition:"all 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=G}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:42,height:42,borderRadius:"50%",overflow:"hidden",background:u.memberType==="menlo"?G:"#e8f0ee",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1rem",color:u.memberType==="menlo"?"white":G}}>
                        {u.picture?<img src={u.picture} alt={u.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:(u.name||email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:"0.97rem"}}>{u.lastName&&u.firstName?u.lastName+", "+u.firstName:u.name||email}</div>
                        <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:2}}>{email}</div>
                        {u.phone&&<div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:1}}>📱 {formatPhone(u.phone)}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {u.provisional&&<span style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #86efac",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>Auto</span>}
                      {u.memberType==="menlo"&&<span style={{background:G,color:"white",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>MCC</span>}
                      {u.grandfathered&&<span style={{background:"#fef3c7",color:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>GF</span>}
                      {u.blocked&&<span style={{background:"#dc2626",color:"white",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>Blocked</span>}
                      {u.duprDoublesRating&&<span style={{background:"#1e3a5f",color:"white",fontWeight:800,fontSize:"0.78rem",padding:"3px 10px",borderRadius:50,display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:"0.6rem",opacity:0.75,letterSpacing:0.3}}>D</span>{parseFloat(u.duprDoublesRating).toFixed(2)}</span>}
                      {u.duprRating&&<span style={{background:"#0a1551",color:"white",fontWeight:800,fontSize:"0.78rem",padding:"3px 10px",borderRadius:50,display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:"0.6rem",opacity:0.75,letterSpacing:0.3}}>S</span>{parseFloat(u.duprRating).toFixed(2)}</span>}
                      <span style={{fontSize:"0.8rem",color:"#6b7280"}}>{upcoming.length} upcoming · {completed.length} completed</span>
                      <span style={{color:G,fontSize:"1.1rem"}}>›</span>
                    </div>
                  </div>
                );
              })}
              {filteredStudents.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:"40px"}}>No students found.</div>}
            </div>
          </>}

          {/* Removed */}
          {studentView==="removed"&&(
            <div>
              <div style={{background:"#fff8f8",border:"1.5px solid #fca5a5",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:"0.82rem",color:"#7f1d1d"}}>
                Removed students can re-register unless blocked. Lesson history is always preserved.
              </div>
              <div style={{display:"grid",gap:10}}>
                {(removedStudents||[]).map(s=>{
                  const lessonCount=(allLessons[s.email]||[]).length;
                  const actionDate=s.isDenied
                    ?(s.deniedAt?new Date(s.deniedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"")
                    :(s.deleted_at?new Date(s.deleted_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"");
                  const borderCol=s.blocked?"#dc2626":s.isDenied?"#f97316":"#fca5a5";
                  return(
                    <div key={s.email} style={{background:"white",borderRadius:12,border:"1.5px solid "+borderCol,padding:"16px 20px",opacity:s.blocked?1:0.85}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:14}}>
                          <div style={{width:42,height:42,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1rem",color:"#9ca3af"}}>
                            {s.picture?<img src={s.picture} alt={s.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%",filter:"grayscale(1)"}}/>:(s.name||s.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight:700,fontSize:"0.97rem",color:"#6b7280"}}>{s.last_name&&s.first_name?s.last_name+", "+s.first_name:s.lastName&&s.firstName?s.lastName+", "+s.firstName:s.name||s.email}</div>
                            <div style={{fontSize:"0.8rem",color:"#9ca3af",marginTop:2}}>{s.email}</div>
                            <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:1}}>
                              {s.isDenied
                                ?<>{actionDate?"Denied "+actionDate:""}{s.blocked?" · Blocked — cannot re-register":" · Can re-register"}</>
                                :<>{lessonCount} lesson{lessonCount!==1?"s":""} on record{actionDate?" · Removed "+actionDate:""}{s.blocked?" · Blocked — cannot re-register":" · Can re-register"}</>
                              }
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          {s.blocked
                            ?<span style={{background:"#fef2f2",color:"#dc2626",padding:"3px 12px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>⛔ Blocked</span>
                            :<span style={{background:s.isDenied?"#fff7ed":"#fef2f2",color:s.isDenied?"#c2410c":"#9ca3af",padding:"3px 12px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>{s.isDenied?"✕ Denied":"Removed"}</span>
                          }
                          {!s.blocked&&!s.isDenied&&(
                            <button onClick={async()=>{setConfirmDeleteLogin(null);await onRestoreStudent(s.email);}}
                              style={{background:"white",color:G,border:"1.5px solid "+G,padding:"3px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.72rem",fontWeight:700}}>
                              ↩ Restore
                            </button>
                          )}
                          <button onClick={()=>onBlockRemoved&&onBlockRemoved(s.email,!s.blocked)}
                            style={{background:s.blocked?"white":"#fef2f2",color:s.blocked?"#374151":"#dc2626",border:"1.5px solid "+(s.blocked?"#d1d5db":"#fca5a5"),padding:"3px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.72rem",fontWeight:700}}>
                            {s.blocked?"Unblock":"Block"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(removedStudents||[]).length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:"40px"}}>No removed accounts.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="students"&&selectedStudent&&!showSchedule&&(
        <div>
          <button onClick={()=>{setSelectedStudent(null);setEditingStudent(false);setEditStudentData({});setConfirmDeleteStudent(false);}} style={{background:"none",border:"none",color:G,fontWeight:700,cursor:"pointer",fontSize:"0.88rem",marginBottom:20,padding:0}}>← Back to Students</button>
          <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:mob?"14px":"24px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:mockUsers[selectedStudent]?.memberType==="menlo"?G:"#e8f0ee",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1.3rem",color:mockUsers[selectedStudent]?.memberType==="menlo"?"white":G}}>
                  {(mockUsers[selectedStudent]?.name||selectedStudent).charAt(0).toUpperCase()}
                </div>
                <div>
                  {editingStudent?(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                        <input value={editStudentData.firstName||""} onChange={e=>setEditStudentData({...editStudentData,firstName:capWords(e.target.value)})} style={{...inp,marginBottom:0,fontWeight:700}} placeholder="First Name"/>
                        <input value={editStudentData.lastName||""} onChange={e=>setEditStudentData({...editStudentData,lastName:capWords(e.target.value)})} style={{...inp,marginBottom:0,fontWeight:700}} placeholder="Last Name"/>
                      </div>
                      <input value={selectedStudent} disabled style={{...inp,marginBottom:8,fontSize:"0.85rem",background:"#f3f4f6",color:"#9ca3af",cursor:"not-allowed"}} title="Google login email — cannot be changed"/>
                      <input value={editStudentData.commEmail||""} onChange={e=>setEditStudentData({...editStudentData,commEmail:e.target.value})} style={{...inp,marginBottom:8,fontSize:"0.85rem"}} placeholder="Communication Email" type="email"/>
                      <input value={editStudentData.phone||""} onChange={e=>setEditStudentData({...editStudentData,phone:formatPhoneInput(e.target.value)})} style={{...inp,marginBottom:8,fontSize:"0.85rem"}} placeholder="Phone Number"/>
                      <input value={editStudentData.city||""} onChange={e=>setEditStudentData({...editStudentData,city:e.target.value})} style={{...inp,marginBottom:8,fontSize:"0.85rem"}} placeholder="City"/>
                      <LocationInput value={editStudentData.homeCourt||""} onChange={v=>setEditStudentData({...editStudentData,homeCourt:v})} placeholder="Home Court" style={{...inp,marginBottom:8,fontSize:"0.85rem"}}/>
                    </div>
                  ):(
                    <div>
                      <div style={{fontWeight:800,fontSize:"1.1rem"}}>{mockUsers[selectedStudent]?.lastName&&mockUsers[selectedStudent]?.firstName?mockUsers[selectedStudent].lastName+", "+mockUsers[selectedStudent].firstName:mockUsers[selectedStudent]?.name||selectedStudent}</div>
                      <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>{selectedStudent}</div>
                      {mockUsers[selectedStudent]?.commEmail&&<div style={{fontSize:"0.83rem",color:"#374151",marginTop:2}}>✉️ {mockUsers[selectedStudent].commEmail}</div>}
                      {mockUsers[selectedStudent]?.phone&&<div style={{fontSize:"0.83rem",color:"#6b7280",marginTop:2}}>📱 {formatPhone(mockUsers[selectedStudent].phone)}</div>}
                      {mockUsers[selectedStudent]?.city&&<div style={{fontSize:"0.83rem",color:"#6b7280",marginTop:2}}>📍 {mockUsers[selectedStudent].city}</div>}
                      {mockUsers[selectedStudent]?.homeCourt&&<div style={{fontSize:"0.83rem",color:"#6b7280",marginTop:2}}>📍 {mockUsers[selectedStudent].homeCourt}</div>}
                      {mockUsers[selectedStudent]?.skillLevel&&<div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:2}}>Self-rated: {(SELF_RATINGS.find(r=>r.value===mockUsers[selectedStudent].skillLevel)||{label:mockUsers[selectedStudent].skillLevel}).label}</div>}
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {editingStudent?(
                  <>
                    <button onClick={()=>{setEditingStudent(false);setStudentSaveStatus("idle");}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>Cancel</button>
                    <button onClick={async()=>{
              setStudentSaveStatus("saving");
              const firstName=(editStudentData.firstName||"").trim();
              const lastName=(editStudentData.lastName||"").trim();
              const fullName=(firstName+" "+lastName).trim()||editStudentData.name||"";
              try{
                const r=await adminFetch("/api/students?action=update",{method:"POST",body:JSON.stringify({email:selectedStudent,updates:{name:fullName,first_name:firstName,last_name:lastName,comm_email:(editStudentData.commEmail||"").toLowerCase(),phone:editStudentData.phone||"",city:editStudentData.city||"",home_court:editStudentData.homeCourt||"",skill_level:editStudentData.duprRating?"":editStudentData.skillLevel||"",dupr_rating:editStudentData.duprRating||"",dupr_id:editStudentData.duprId||""}})});
                if(!r.ok)throw new Error("Save failed");
                onAddStudent({name:fullName,firstName,lastName,commEmail:(editStudentData.commEmail||"").toLowerCase(),phone:editStudentData.phone||"",city:editStudentData.city||"",homeCourt:editStudentData.homeCourt||"",skillLevel:editStudentData.duprRating?"":editStudentData.skillLevel||"",duprRating:editStudentData.duprRating||"",duprId:editStudentData.duprId||"",email:selectedStudent,memberType:mockUsers[selectedStudent]?.memberType||"public"});
                setStudentSaveStatus("idle");
                setEditingStudent(false);
              }catch{setStudentSaveStatus("error");}
            }} disabled={studentSaveStatus==="saving"} style={{background:studentSaveStatus==="error"?"#dc2626":studentSaveStatus==="saving"?"#9ca3af":G,color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:studentSaveStatus==="saving"?"not-allowed":"pointer",fontWeight:700,fontSize:"0.82rem"}}>
              {studentSaveStatus==="saving"?"Saving…":studentSaveStatus==="error"?"Retry ↩":"Save ✓"}
            </button>
                  </>
                ):(
                  <button onClick={()=>{
                    const u=mockUsers[selectedStudent]||{};
                    const nameParts=(u.name||"").split(" ");
                    const parsedFirst=nameParts[0]||"";
                    const parsedLast=nameParts.slice(1).join(" ")||"";
                    setEditStudentData({name:u.name||"",firstName:u.firstName||parsedFirst,lastName:u.lastName||parsedLast,commEmail:u.commEmail||"",phone:u.phone||"",city:u.city||"",homeCourt:u.homeCourt||"",skillLevel:u.skillLevel||"",duprRating:u.duprRating||"",duprId:u.duprId||""});
                    setDuprIdInput("");setDuprSyncStatus("idle");setDuprSyncError("");
                    setStudentSaveStatus("idle");
                    setEditingStudent(true);}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>✏️ Edit</button>
                )}
                <button onClick={()=>setShowSchedule(true)} style={{background:G,color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>+ Schedule Lesson</button>
              </div>
            </div>
            {/* ── Provisional banner ── */}
            {mockUsers[selectedStudent]?.provisional&&(
              <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontWeight:700,color:"#15803d",fontSize:"0.88rem",marginBottom:2}}>Auto-created account</div>
                  <div style={{fontSize:"0.78rem",color:"#166534"}}>This account was auto-created from your Google Calendar. Once the student registers and logs in, their profile will be enriched automatically. You can also edit their info now.</div>
                </div>
                <button onClick={async()=>{
                  await adminFetch("/api/students?action=promote",{method:"POST",body:JSON.stringify({email:selectedStudent})});
                  setMockUsersState(prev=>({...prev,[selectedStudent]:{...prev[selectedStudent],provisional:false,source:"self_registered"}}));
                }} style={{background:"#15803d",color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.8rem",whiteSpace:"nowrap"}}>
                  Mark as Full Account
                </button>
              </div>
            )}
            {/* ── Student Modifiers ── */}
            <div style={{background:"#f9fafb",borderRadius:10,border:"1.5px solid #e5e7eb",padding:"14px 16px",marginBottom:0}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Account Modifiers</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:10}}>
                {/* Menlo Club — mutually exclusive with GF */}
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none",background:mockUsers[selectedStudent]?.memberType==="menlo"?"#e8f0ee":"white",border:"1.5px solid "+(mockUsers[selectedStudent]?.memberType==="menlo"?G:"#e5e7eb"),borderRadius:50,padding:"6px 14px",fontSize:"0.8rem",fontWeight:700,color:mockUsers[selectedStudent]?.memberType==="menlo"?G:"#374151",transition:"all 0.15s"}}>
                  <input type="checkbox" checked={mockUsers[selectedStudent]?.memberType==="menlo"} onChange={()=>{const turningOn=mockUsers[selectedStudent]?.memberType!=="menlo";onToggleMenlo(selectedStudent);if(turningOn&&mockUsers[selectedStudent]?.grandfathered)onToggleGrandfathered&&onToggleGrandfathered(selectedStudent);}} style={{width:14,height:14,accentColor:G,cursor:"pointer"}}/>
                  Menlo Circus Club
                </label>
                {/* Grandfathered Pricing — mutually exclusive with MCC */}
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none",background:mockUsers[selectedStudent]?.grandfathered?"#fffbea":"white",border:"1.5px solid "+(mockUsers[selectedStudent]?.grandfathered?"#f59e0b":"#e5e7eb"),borderRadius:50,padding:"6px 14px",fontSize:"0.8rem",fontWeight:700,color:mockUsers[selectedStudent]?.grandfathered?"#92400e":"#374151",transition:"all 0.15s"}}>
                  <input type="checkbox" checked={!!mockUsers[selectedStudent]?.grandfathered} onChange={()=>{const turningOn=!mockUsers[selectedStudent]?.grandfathered;onToggleGrandfathered&&onToggleGrandfathered(selectedStudent);if(turningOn&&mockUsers[selectedStudent]?.memberType==="menlo")onToggleMenlo(selectedStudent);}} style={{width:14,height:14,accentColor:"#f59e0b",cursor:"pointer"}}/>
                  Grandfathered Pricing
                </label>
              </div>
              {mockUsers[selectedStudent]?.grandfathered&&(
                <div style={{fontSize:"0.72rem",color:"#92400e",background:"#fffbea",borderRadius:6,padding:"5px 10px",marginBottom:8}}>
                  Private: $120 / 60 min · $180 / 90 min — all other rates unchanged
                </div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>onBlockStudent(selectedStudent)} style={{background:mockUsers[selectedStudent]?.blocked?"#dc2626":"white",color:mockUsers[selectedStudent]?.blocked?"white":"#dc2626",border:"1.5px solid #dc2626",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.75rem",fontWeight:700}}>
                  {mockUsers[selectedStudent]?.blocked?"Unblock Student":"Block Student"}
                </button>
                <button onClick={()=>setConfirmDeleteStudent(true)} style={{background:"white",color:"#6b7280",border:"1.5px solid #d1d5db",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.75rem",fontWeight:700}}>⊘ Remove Student</button>
              </div>
            </div>
            {confirmDeleteStudent&&(
              <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:10,padding:"14px 18px",marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:700,color:"#991b1b",fontSize:"0.9rem"}}>Remove {mockUsers[selectedStudent]?.name||selectedStudent}?</div>
                  <div style={{fontSize:"0.8rem",color:"#b91c1c",marginTop:3}}>Their account is archived and the email is freed — they can re-register. All lesson history is preserved. You can restore them or block re-registration from the Removed tab.</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setConfirmDeleteStudent(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Cancel</button>
                  <button onClick={async()=>{await onRemoveStudent(selectedStudent);setSelectedStudent(null);setConfirmDeleteStudent(false);}} style={{background:"#dc2626",color:"white",border:"none",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>Yes, Remove</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Coach Rating ─────────────────────────────────────────── */}
          {(()=>{
            const history=(ratingHistories[selectedStudent]||[]);
            const current=history.length>0?history[history.length-1].rating:null;
            const submitRating=()=>{
              const val=parseFloat(coachRatingInput);
              if(isNaN(val)||val<1||val>7){alert("Enter a rating between 1.0 and 7.0");return;}
              const entry={id:Date.now(),rating:val,note:ratingNoteInput.trim(),date:new Date().toISOString()};
              const updated=[...history,entry];
              setRatingHistories(prev=>({...prev,[selectedStudent]:updated}));
              adminFetch("/api/students?action=update",{method:"POST",
                body:JSON.stringify({email:selectedStudent,updates:{coach_rating:val,rating_history:JSON.stringify(updated)}})}).catch(()=>{});
              setCoachRatingInput("");setRatingNoteInput("");
            };
            const deleteEntry=(id)=>{
              const updated=history.filter(e=>e.id!==id);
              setRatingHistories(prev=>({...prev,[selectedStudent]:updated}));
              const newCurrent=updated.length>0?updated[updated.length-1].rating:null;
              adminFetch("/api/students?action=update",{method:"POST",
                body:JSON.stringify({email:selectedStudent,updates:{coach_rating:newCurrent||"",rating_history:JSON.stringify(updated)}})}).catch(()=>{});
            };
            return(
              <div style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"16px 18px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2}}>Coach Rating</div>
                  {current!=null&&<div style={{background:"#e8f0ee",color:G,fontWeight:900,fontSize:"1.1rem",padding:"4px 14px",borderRadius:50}}>{current.toFixed(1)}</div>}
                </div>
                {/* Add new rating */}
                <div style={{display:"flex",gap:8,marginBottom:history.length>0?12:0}}>
                  <input type="number" step="0.1" min="1" max="7" placeholder="Rating (e.g. 3.5)" value={coachRatingInput} onChange={e=>setCoachRatingInput(e.target.value)}
                    style={{...inp,marginBottom:0,flex:"0 0 140px",fontSize:"0.85rem"}}
                    onKeyDown={e=>e.key==="Enter"&&submitRating()}/>
                  <input type="text" placeholder="Note (optional)" value={ratingNoteInput} onChange={e=>setRatingNoteInput(e.target.value)}
                    style={{...inp,marginBottom:0,flex:1,fontSize:"0.85rem"}}
                    onKeyDown={e=>e.key==="Enter"&&submitRating()}/>
                  <button onClick={submitRating} style={{background:G,color:"white",border:"none",padding:"0 18px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem",flexShrink:0}}>Submit</button>
                </div>
                {/* History */}
                {history.length>0&&(
                  <div style={{borderTop:"1px solid #f3f4f6",paddingTop:10}}>
                    <div style={{fontSize:"0.72rem",color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>History</div>
                    {[...history].reverse().map((e,i)=>(
                      <div key={e.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<history.length-1?"1px solid #f9fafb":"none"}}>
                        <span style={{fontWeight:700,fontSize:"0.88rem",color:G,minWidth:32}}>{e.rating.toFixed(1)}</span>
                        <span style={{fontSize:"0.78rem",color:"#6b7280",flex:1}}>{e.note||<span style={{color:"#d1d5db",fontStyle:"italic"}}>no note</span>}</span>
                        <span style={{fontSize:"0.72rem",color:"#9ca3af",minWidth:80,textAlign:"right"}}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</span>
                        <button onClick={()=>deleteEntry(e.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:"0.9rem",padding:"0 2px",lineHeight:1}} title="Delete">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {/* DUPR section */}
                {(()=>{
                  const storedId=mockUsers[selectedStudent]?.duprId||"";
                  const storedRating=mockUsers[selectedStudent]?.duprRating||"";
                  const storedDoubles=mockUsers[selectedStudent]?.duprDoublesRating||"";
                  const storedPlayerName=mockUsers[selectedStudent]?.duprPlayerName||"";
                  const saveDupr=async(updates)=>{
                    onAddStudent({...mockUsers[selectedStudent],email:selectedStudent,...updates});
                    adminFetch("/api/students?action=update",{method:"POST",body:JSON.stringify({email:selectedStudent,updates:Object.fromEntries(Object.entries({dupr_id:updates.duprId,dupr_rating:updates.duprRating,dupr_doubles_rating:updates.duprDoublesRating,dupr_player_name:updates.duprPlayerName}).filter(([,v])=>v!=null))})}).catch(()=>{});
                  };
                  const clearDupr=async()=>{
                    onAddStudent({...mockUsers[selectedStudent],email:selectedStudent,duprId:"",duprRating:"",duprDoublesRating:"",duprPlayerName:""});
                    adminFetch("/api/students?action=update",{method:"POST",body:JSON.stringify({email:selectedStudent,updates:{dupr_id:"",dupr_rating:"",dupr_doubles_rating:"",dupr_player_name:""}})}).catch(()=>{});
                    setDuprIdInput("");setDuprSyncStatus("idle");setDuprSyncError("✓ DUPR data cleared");setTimeout(()=>setDuprSyncError(""),3000);
                  };
                  const syncDupr=async(id)=>{
                    if(!id)return;
                    // Auto-save the ID first, then sync
                    await saveDupr({duprId:id});
                    setDuprIdInput("");
                    setDuprSyncStatus("syncing");setDuprSyncError("");
                    try{
                      const r=await fetch("/api/students?action=dupr-lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({duprId:id,email:selectedStudent})});
                      const data=await r.json();
                      if(data.error==="DUPR_NOT_CONFIGURED"){
                        setDuprSyncStatus("idle");
                        setDuprSyncError("⚠ DUPR sync not configured — add DUPR_EMAIL + DUPR_PASSWORD to Vercel env vars, or enter ratings manually below.");
                        return;
                      }
                      if(data.error){setDuprSyncStatus("error");setDuprSyncError("⚠ "+data.error);return;}
                      const updates={};
                      if(data.rating!=null)updates.duprRating=parseFloat(data.rating).toFixed(2);
                      if(data.doublesRating!=null)updates.duprDoublesRating=parseFloat(data.doublesRating).toFixed(2);
                      if(data.fullName)updates.duprPlayerName=data.fullName;
                      if(Object.keys(updates).length>0){
                        await saveDupr(updates);
                        const nameStr=data.fullName?" · "+data.fullName:"";
                        setDuprSyncStatus("success");
                        setDuprSyncError("✓ Synced"+nameStr+"  D:"+(updates.duprDoublesRating||storedDoubles||"NR")+" S:"+(updates.duprRating||storedRating||"NR"));
                      }else{setDuprSyncStatus("idle");setDuprSyncError("⚠ No ratings found for this DUPR ID.");}
                    }catch(e){setDuprSyncStatus("error");setDuprSyncError("⚠ Network error — try again.");}
                    setTimeout(()=>{setDuprSyncStatus("idle");setDuprSyncError("");},6000);
                  };
                  return(
                    <div style={{marginTop:12,background:"#f0f4ff",borderRadius:10,padding:"16px",border:"1px solid #c7d2fe"}}>
                      {/* Section label */}
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>DUPR Rating</div>
                      {/* Current ratings — large numbers, no bubbles */}
                      <div style={{display:"flex",gap:28,alignItems:"flex-end",marginBottom:storedPlayerName?8:16}}>
                        {storedDoubles
                          ?<div><div style={{fontSize:"2rem",fontWeight:900,color:"#0a1551",lineHeight:1}}>{parseFloat(storedDoubles).toFixed(2)}</div><div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",letterSpacing:0.8,marginTop:3,textTransform:"uppercase"}}>Doubles</div></div>
                          :<div><div style={{fontSize:"1rem",fontWeight:700,color:"#9ca3af"}}>—</div><div style={{fontSize:"0.65rem",fontWeight:700,color:"#9ca3af",letterSpacing:0.8,marginTop:3,textTransform:"uppercase"}}>Doubles</div></div>
                        }
                        {storedRating
                          ?<div><div style={{fontSize:"2rem",fontWeight:900,color:"#1e3a5f",lineHeight:1}}>{parseFloat(storedRating).toFixed(2)}</div><div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",letterSpacing:0.8,marginTop:3,textTransform:"uppercase"}}>Singles</div></div>
                          :<div><div style={{fontSize:"1rem",fontWeight:700,color:"#9ca3af"}}>—</div><div style={{fontSize:"0.65rem",fontWeight:700,color:"#9ca3af",letterSpacing:0.8,marginTop:3,textTransform:"uppercase"}}>Singles</div></div>
                        }
                      </div>
                      {/* DUPR player name cross-check */}
                      {storedPlayerName&&<div style={{fontSize:"0.78rem",color:"#374151",fontWeight:600,marginBottom:14,background:"#e0e7ff",borderRadius:6,padding:"5px 10px",display:"inline-block"}}>👤 {storedPlayerName}</div>}
                      {/* DUPR Player ID + Sync */}
                      <div style={{fontSize:"0.7rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>DUPR Player ID</div>
                      <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                        <input type="text" placeholder="e.g. ABC123" value={duprIdInput||storedId} onChange={e=>setDuprIdInput(e.target.value.replace(/\s/g,"").slice(0,20).toUpperCase())} style={{...inp,marginBottom:0,flex:1,fontSize:"1rem",background:"white"}}/>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
                        <button disabled={duprSyncStatus==="syncing"||!((duprIdInput.trim()||storedId))} onClick={()=>syncDupr(duprIdInput.trim()||storedId)} style={{background:"#0a1551",color:"white",border:"none",padding:"0 18px",borderRadius:8,cursor:duprSyncStatus==="syncing"||!((duprIdInput.trim()||storedId))?"not-allowed":"pointer",fontWeight:700,fontSize:"0.85rem",height:40,opacity:duprSyncStatus==="syncing"||!((duprIdInput.trim()||storedId))?0.6:1,flex:1,minWidth:120}}>
                          {duprSyncStatus==="syncing"?"Syncing…":"↻ Save ID & Sync Rating"}
                        </button>
                        {storedId&&<a href={`https://dashboard.dupr.com/dashboard/player/${storedId}/profile`} target="_blank" rel="noopener noreferrer" style={{color:"#0a1551",fontSize:"0.82rem",fontWeight:700,whiteSpace:"nowrap",padding:"0 4px",lineHeight:"40px"}}>View Profile →</a>}
                      </div>
                      {/* Manual entry — always stacked vertically */}
                      <div style={{fontSize:"0.7rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Manual Entry</div>
                      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:6}}>
                        <div>
                          <div style={{fontSize:"0.72rem",color:"#6b7280",marginBottom:4,fontWeight:600}}>Doubles Rating</div>
                          <input type="number" step="0.01" min="2" max="8" placeholder="e.g. 3.75" defaultValue={storedDoubles} key={"d_"+selectedStudent+"_"+(storedDoubles||"")} onBlur={async e=>{const v=e.target.value.trim();if(!v)return;const r=parseFloat(v);if(isNaN(r)||r<2||r>8)return;await saveDupr({duprDoublesRating:r.toFixed(2)});setDuprSyncError("✓ Doubles saved");setTimeout(()=>setDuprSyncError(""),2000);}} style={{...inp,marginBottom:0,fontSize:"1rem",background:"white",width:"100%",boxSizing:"border-box"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:"0.72rem",color:"#6b7280",marginBottom:4,fontWeight:600}}>Singles Rating</div>
                          <input type="number" step="0.01" min="2" max="8" placeholder="e.g. 3.50" defaultValue={storedRating} key={"s_"+selectedStudent+"_"+(storedRating||"")} onBlur={async e=>{const v=e.target.value.trim();if(!v)return;const r=parseFloat(v);if(isNaN(r)||r<2||r>8)return;await saveDupr({duprRating:r.toFixed(2)});setDuprSyncError("✓ Singles saved");setTimeout(()=>setDuprSyncError(""),2000);}} style={{...inp,marginBottom:0,fontSize:"1rem",background:"white",width:"100%",boxSizing:"border-box"}}/>
                        </div>
                      </div>
                      {duprSyncError&&<div style={{fontSize:"0.78rem",marginTop:8,padding:"8px 12px",borderRadius:8,background:duprSyncError.startsWith("✓")?"#dcfce7":duprSyncError.startsWith("⚠")?"#fef2f2":"#f3f4f6",color:duprSyncError.startsWith("✓")?"#16a34a":duprSyncError.startsWith("⚠")?"#dc2626":"#6b7280",fontWeight:600}}>{duprSyncError}</div>}
                      {!storedId&&!duprSyncError&&<div style={{fontSize:"0.72rem",color:"#6b7280",marginTop:4}}>Find the Player ID in the DUPR app → Profile → share icon, or from the URL on dashboard.dupr.com.</div>}
                      {(storedId||storedRating||storedDoubles)&&(
                        <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #c7d2fe"}}>
                          <button onClick={clearDupr} style={{background:"none",border:"1.5px solid #fca5a5",color:"#dc2626",borderRadius:8,padding:"7px 14px",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",width:"100%"}}>✕ Remove DUPR Data</button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}
          {/* ─────────────────────────────────────────────────────────── */}

          {(()=>{
            const supabaseLessons=(allLessons[selectedStudent]||[]).filter(l=>l.status!=="archived");
            const calHistoryLessons=calLessons[selectedStudent]||[];
            const useCalHistory=supabaseLessons.length===0&&calHistoryLessons.length>0;
            if(useCalHistory){
              return(
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2}}>Lesson History</div>
                    <span style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #86efac",padding:"2px 9px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>from Calendar</span>
                    <span style={{fontSize:"0.78rem",color:"#6b7280"}}>{calHistoryLessons.length} lessons</span>
                  </div>
                  {calHistoryLessons.map(l=>(
                    <div key={l.id} style={{background:"white",borderRadius:10,border:"1.5px solid #e5e7eb",padding:"12px 16px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:"0.9rem"}}>{fmtDateShort(l.date)}{l.time?" · "+l.time:""}</div>
                          <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:2}}>{l.type}{l.duration?" · "+l.duration:""}{l.isMenlo?" · MCC":""}</div>
                          {l.location&&<div style={{fontSize:"0.73rem",color:"#9ca3af",marginTop:1}}>{l.location}</div>}
                        </div>
                        <span style={{background:new Date(l.date)<new Date()?"#e8f0ee":"#fffbea",color:new Date(l.date)<new Date()?G:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700,flexShrink:0}}>
                          {new Date(l.date)<new Date()?"Completed":"Upcoming"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })()}
          {calLessonsLoading&&(allLessons[selectedStudent]||[]).filter(l=>l.status!=="archived").length===0&&(
            <div style={{color:"#9ca3af",fontSize:"0.85rem",padding:"20px 0",textAlign:"center"}}>Loading lesson history from calendar…</div>
          )}
          <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>
            {(allLessons[selectedStudent]||[]).filter(l=>l.status!=="archived").length>0?"Portal Lessons":""}
          </div>
          {(allLessons[selectedStudent]||[]).filter(l=>l.status!=="archived").length===0&&(calLessons[selectedStudent]||[]).length===0&&!calLessonsLoading&&<div style={{color:"#9ca3af",fontSize:"0.9rem",textAlign:"center",padding:"32px"}}>No lessons yet.</div>}
          {(allLessons[selectedStudent]||[]).filter(l=>l.status!=="archived").sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>{
            const smk="s_"+l.id;const isMenuOpen=activeMenu===smk;
            const isCancelled=cancelledStatuses2.includes(l.status);
            const missingCal=!l.gcalEventId;
            return(
            <div key={l.id} style={{background:"white",borderRadius:12,border:"1.5px solid "+(editingId===l.id||editPriceId===l.id?G:"#e5e7eb"),marginBottom:10,overflow:"hidden"}}>
              {/* Main row */}
              <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"0.93rem"}}>{fmtDateShort(l.date)} · {l.time}</div>
                  <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:2}}>{l.type} · {l.duration}{l.focus?" · "+l.focus:""}</div>
                  {l.customPrice&&<div style={{fontSize:"0.75rem",color:"#0ea5e9",marginTop:2,fontWeight:600}}>Custom: ${l.customPrice}</div>}
                  {l.notes&&editingId!==l.id&&<div style={{background:"#f9f9f6",borderRadius:6,padding:"7px 10px",marginTop:8,fontSize:"0.82rem",color:"#374151",lineHeight:1.5}}>{l.notes}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  {missingCal&&!isCancelled&&<span title="No linked Google Calendar event" style={{background:"#fff7ed",color:"#c2410c",border:"1px solid #fed7aa",padding:"2px 7px",borderRadius:50,fontSize:"0.65rem",fontWeight:700}}>⚠️ No Cal</span>}
                  {(()=>{
                    const r=l.cancelReason||(l.status==="late_cancel"?"late":l.status==="no_show"?"no_show":l.status==="weather_cancel"?"weather":l.status==="cancelled_forgiven"?"forgiven":null);
                    const isCx=l.status==="cancelled"||l.status==="late_cancel"||l.status==="no_show"||l.status==="weather_cancel"||l.status==="cancelled_forgiven";
                    const bg=l.status==="confirmed"?"#e8f0ee":l.status==="completed"?"#e8f0ee":!isCx?"#fffbea":r==="late"?"#fff7ed":r==="no_show"?"#fef2f2":r==="weather"?"#eff6ff":r==="forgiven"?"#f3f4f6":"#fef2f2";
                    const col=l.status==="confirmed"?G:l.status==="completed"?G:!isCx?"#92400e":r==="late"?"#c2410c":r==="no_show"?"#7f1d1d":r==="weather"?"#1d4ed8":r==="forgiven"?"#6b7280":"#dc2626";
                    const lbl=l.status==="confirmed"?"✓ Confirmed":l.status==="completed"?"✓ Completed":!isCx?"⏳ Pending":r==="late"?"⚠️ Late Cancel":r==="no_show"?"✕ No-Show":r==="weather"?"🌧 Weather":r==="forgiven"?"✓ Forgiven":l.cancelledByGcal?"📅 Removed":"✕ Cancelled";
                    return<span style={{background:bg,color:col,padding:"3px 9px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>{lbl}</span>;
                  })()}
                  {(()=>{const needsForgive=l.status==="late_cancel"||l.status==="no_show"||(l.status==="cancelled"&&(l.cancelReason==="late"||l.cancelReason==="no_show"));return needsForgive&&<button onClick={async()=>{onUpdateLesson(selectedStudent,l.id,{status:"cancelled",cancelReason:"forgiven"});fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{status:"cancelled",cancel_reason:"forgiven"}})}).catch(()=>{});}} style={{background:"white",color:"#6b7280",border:"1.5px solid #d1d5db",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>✓ Forgive</button>;})()}
                  <button onClick={()=>setActiveMenu(isMenuOpen?null:smk)} style={{background:isMenuOpen?"#f3f4f6":"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:"1rem",lineHeight:1,color:"#6b7280",fontWeight:700}}>⋯</button>
                </div>
              </div>
              {/* ⋯ action menu */}
              {isMenuOpen&&(
                <div style={{borderTop:"1px solid #f3f4f6",background:"#fafafa",padding:"10px 18px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <button onClick={()=>{setEditingId(editingId===l.id?null:l.id);setEditNotes(l.notes||"");setActiveMenu(null);}} style={{background:G,color:"white",border:"none",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✏️ Notes</button>
                  <button onClick={()=>{setEditPriceId(editPriceId===l.id?null:l.id);setEditPriceVal(String(l.customPrice||getRate(l.type,parseInt(l.duration))));setActiveMenu(null);}} style={{background:G,color:"white",border:"none",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>Price</button>
                  {!isCancelled&&<button onClick={()=>{setConfirmCancel(l.id);setActiveMenu(null);}} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✕ Cancel</button>}
                  <DelBtn onClick={()=>{setConfirmDelete(l.id);setActiveMenu(null);}} style={{color:"#6b7280",borderColor:"#d1d5db"}}>📦 Archive</DelBtn>
                  <span style={{flex:1}}/>
                  <button onClick={()=>setActiveMenu(null)} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:"0.8rem"}}>Close</button>
                </div>
              )}
              {/* Cancel — reason picker */}
              {confirmCancel===l.id&&(
                <div style={{background:"#fef2f2",borderTop:"1px solid #fca5a5",padding:"14px 18px"}}>
                  <div style={{fontWeight:700,color:"#991b1b",fontSize:"0.85rem",marginBottom:10}}>Why was this lesson cancelled?</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
                    {[
                      {reason:"student", label:"Student cancelled",  color:"#dc2626", border:"#fca5a5", charge:false},
                      {reason:"admin",   label:"Admin cancelled",    color:"#6b7280", border:"#d1d5db", charge:false},
                      {reason:"late",    label:"Late cancel",        color:"#c2410c", border:"#fed7aa", charge:true},
                      {reason:"no_show", label:"No-show",            color:"#7f1d1d", border:"#fca5a5", charge:true},
                      {reason:"weather", label:"Weather",            color:"#1d4ed8", border:"#93c5fd", charge:false},
                    ].map(({reason,label,color,border,charge})=>(
                      <button key={reason} disabled={cancelLoading} onClick={async()=>{
                        setCancelLoading(true);
                        // Remove from calendar
                        if(l.gcalEventId){fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",eventId:l.gcalEventId,mode:"delete"})}).catch(()=>{});}
                        // Update state + DB
                        onUpdateLesson(selectedStudent,l.id,{status:"cancelled",cancelReason:reason});
                        fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{status:"cancelled",cancel_reason:reason,cancelled_by:reason==="student"?"student":"admin",cancelled_at:new Date().toISOString()}})}).catch(()=>{});
                        // Send email for student/admin cancel
                        if(reason==="student"||reason==="admin"){await onCancelLesson(selectedStudent,l.id);}
                        setCancelLoading(false);setConfirmCancel(null);
                      }} style={{background:"white",color,border:"1.5px solid "+border,padding:"5px 13px",borderRadius:50,cursor:cancelLoading?"not-allowed":"pointer",fontSize:"0.78rem",fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,opacity:cancelLoading?0.6:1}}>
                        {label}{charge&&<span style={{fontSize:"0.65rem",opacity:0.65,fontWeight:600}}>(charge)</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
                    <button disabled={cancelLoading} onClick={async()=>{
                      setCancelLoading(true);
                      if(l.gcalEventId){fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",eventId:l.gcalEventId,mode:"delete"})}).catch(()=>{});}
                      onUpdateLesson(selectedStudent,l.id,{status:"cancelled",cancelReason:"student"});
                      fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{status:"cancelled",cancel_reason:"student",cancelled_by:"student",cancelled_at:new Date().toISOString()}})}).catch(()=>{});
                      await onCancelLesson(selectedStudent,l.id);
                      setCancelLoading(false);setConfirmCancel(null);
                      const typeMap={"Private":"private","Semi-Private":"semi","Group":"group"};
                      setSchedLessonType(typeMap[l.type]||"private");setSchedDuration(parseInt(l.duration)||60);setSchedFocus(l.focus||"");
                      setSchedDate("");setSchedSlot(null);setSchedSlotIdx(-1);setScheduleStep(1);setShowSchedule(true);
                    }} style={{background:G,color:"white",border:"none",padding:"5px 14px",borderRadius:50,cursor:cancelLoading?"not-allowed":"pointer",fontSize:"0.78rem",fontWeight:700}}>
                      Cancel & Reschedule
                    </button>
                    <button onClick={()=>setConfirmCancel(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"5px 13px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:600}}>Keep it</button>
                  </div>
                </div>
              )}
              {/* Archive confirm */}
              {confirmDelete===l.id&&(
                <div style={{background:"#f9fafb",borderTop:"2px solid #d1d5db",padding:"16px 18px"}}>
                  <div style={{fontWeight:800,color:"#374151",fontSize:"0.95rem",marginBottom:4}}>Archive this lesson?</div>
                  <div style={{fontSize:"0.82rem",color:"#6b7280",marginBottom:12}}>It will be moved to the Archived section. You can permanently delete it from there with your admin password.</div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setConfirmDelete(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Keep it</button>
                    <button onClick={async()=>{
                      // Remove from Google Calendar first
                      if(l.gcalEventId){fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",eventId:l.gcalEventId,mode:"delete"})}).catch(()=>{});}
                      await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{status:"archived"}})}).catch(e=>console.error("Archive failed:",e));
                      onUpdateLesson(selectedStudent,l.id,{status:"archived"});
                      setConfirmDelete(null);setDeletedToast(true);setTimeout(()=>setDeletedToast(false),3000);
                    }} style={{background:"#4b5563",color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>
                      Yes, Archive
                    </button>
                  </div>
                </div>
              )}
              {/* Price editor */}
              {editPriceId===l.id&&(
                <div style={{borderTop:"1px solid #e5e7eb",padding:"16px 18px",background:"#f9f9f6"}}>
                  <div style={{fontSize:"0.85rem",fontWeight:600,marginBottom:8,color:"#374151"}}>Override lesson price</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:"1rem",color:"#6b7280"}}>$</span>
                    <input type="number" value={editPriceVal} onChange={e=>setEditPriceVal(e.target.value)} style={{...inp,marginBottom:0,width:100}} placeholder="0.00"/>
                    <span style={{fontSize:"0.8rem",color:"#9ca3af"}}>Default: ${getRate(l.type,parseInt(l.duration))}</span>
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12,flexWrap:"wrap"}}>
                    <button onClick={()=>setEditPriceId(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
                    {l.customPrice&&<button onClick={async()=>{await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{custom_price:null}})});onUpdateLesson(selectedStudent,l.id,{customPrice:null});setEditPriceId(null);}} style={{background:"white",border:"1.5px solid #e5e7eb",color:"#6b7280",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Reset</button>}
                    <button onClick={async()=>{const price=parseFloat(editPriceVal);await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{custom_price:price}})});onUpdateLesson(selectedStudent,l.id,{customPrice:price});setEditPriceId(null);}} style={{background:G,color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Save Price</button>
                  </div>
                </div>
              )}
              {/* Notes editor */}
              {editingId===l.id&&(
                <div style={{borderTop:"1px solid #e5e7eb",padding:"16px 18px",background:"#f9f9f6"}}>
                  <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} placeholder="Add coaching notes..." style={{...inp,height:90,resize:"vertical",fontFamily:"inherit",background:"white"}}/>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setEditingId(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
                    <button onClick={()=>{onUpdateLesson(selectedStudent,l.id,{notes:editNotes});setEditingId(null);}} style={{background:G,color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Save Notes ✓</button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
          {/* ── Archived Lessons ─────────────────────────────────────── */}
          {(()=>{
            const archivedLessons=(allLessons[selectedStudent]||[]).filter(l=>l.status==="archived").sort((a,b)=>new Date(b.date)-new Date(a.date));
            if(archivedLessons.length===0)return null;
            return(
              <div style={{marginTop:24}}>
                <button onClick={()=>setShowArchivedLessons(v=>!v)} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:showArchivedLessons?12:0}}>
                  <span style={{fontSize:"0.75rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:2}}>📦 Archived Lessons ({archivedLessons.length})</span>
                  <span style={{fontSize:"0.7rem",color:"#9ca3af"}}>{showArchivedLessons?"▲":"▼"}</span>
                </button>
                {showArchivedLessons&&archivedLessons.map(l=>(
                  <div key={l.id} style={{background:"#f9fafb",borderRadius:10,border:"1.5px solid #e5e7eb",marginBottom:8,overflow:"hidden",opacity:0.85}}>
                    <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:"0.88rem",color:"#6b7280"}}>{fmtDateShort(l.date)} · {l.time}</div>
                        <div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:2}}>{l.type} · {l.duration}{l.focus?" · "+l.focus:""}</div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{background:"#f3f4f6",color:"#6b7280",padding:"2px 8px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>📦 Archived</span>
                        {permDeleteTarget?.id===l.id?(
                          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:"0.75rem",color:"#dc2626",fontWeight:600}}>Permanently delete?</span>
                            <button onClick={()=>{onDeleteLesson(selectedStudent,l.id);setPermDeleteTarget(null);if(l.id)fetch("/api/lessons?action=delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id})}).catch(()=>{});}} style={{background:"#dc2626",color:"white",border:"none",padding:"4px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.75rem",fontWeight:700}}>Yes, Delete</button>
                            <button onClick={()=>{setPermDeleteTarget(null);}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>Cancel</button>
                          </div>
                        ):(
                          <button onClick={()=>{setPermDeleteTarget({id:l.id,email:selectedStudent});setPermDeletePw("");setPermDeleteError("");}} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>🗑 Permanently Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {tab==="students"&&selectedStudent&&showSchedule&&(
        <div style={{maxWidth:620}}>
          <button onClick={()=>{setShowSchedule(false);setScheduleStep(1);}} style={{background:"none",border:"none",color:G,fontWeight:700,cursor:"pointer",fontSize:"0.88rem",marginBottom:20,padding:0}}>← Back to {mockUsers[selectedStudent]?.name}</button>
          <h3 style={{fontWeight:800,fontSize:"1.2rem",marginBottom:4,color:G}}>Schedule Lesson</h3>
          <p style={{color:"#6b7280",fontSize:"0.88rem",marginBottom:24}}>Scheduling for <strong>{mockUsers[selectedStudent]?.name}</strong></p>

          {(()=>{
            const isSchedPrivate=schedLessonType==="private";
            const schedStepLabels=isSchedPrivate?["Type","Date & Time","Details","Confirm"]:["Type","Date & Time","Participants","Details","Confirm"];
            return(
              <div style={{display:"flex",alignItems:"center",marginBottom:28,gap:0}}>
                {schedStepLabels.map((s,i)=>{
                  const n=i+1;
                  const active=scheduleStep===n;
                  const done=scheduleStep>n;
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",flex:i<schedStepLabels.length-1?1:"auto"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:done?G:active?G:"#e5e7eb",color:done||active?"white":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.8rem",cursor:done?"pointer":"default"}} onClick={()=>done&&setScheduleStep(n)}>
                          {done?"✓":n}
                        </div>
                        <div style={{fontSize:"0.62rem",fontWeight:600,color:active?G:done?G:"#9ca3af",whiteSpace:"nowrap"}}>{s}</div>
                      </div>
                      {i<schedStepLabels.length-1&&<div style={{flex:1,height:2,background:done?G:"#e5e7eb",margin:"0 6px",marginBottom:14}}/>}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {scheduleStep===1&&(
            <div>
              <div style={{...lbl,marginBottom:12}}>Duration</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[60,90].map(d=>(<div key={d} onClick={()=>setSchedDuration(d)} style={{background:schedDuration===d?"#e8f0ee":"white",border:"2px solid "+(schedDuration===d?G:"#e5e7eb"),borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"center",fontWeight:700,color:schedDuration===d?G:"#1a1a1a"}}>{d} min</div>))}
              </div>
              <div style={{...lbl,marginBottom:12}}>Lesson Type</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
                {[
                  {id:"private",icon:"🎯",label:"Private",total:SCHED_PRICES["private"][schedDuration],note:""},
                  {id:"semi",icon:"👥",label:"Semi-Private",total:SCHED_PRICES["semi"][schedDuration],note:"$"+(SCHED_PRICES["semi"][schedDuration]/2)+"/person"},
                  {id:"group",icon:"🏆",label:"Group",total:SCHED_PRICES["group"][schedDuration],note:"split equally"},
                  {id:"clinic",icon:"🎾",label:"Clinic",total:null,note:"$35/person × size"}
                ].map(l=>(
                  <div key={l.id} onClick={()=>setSchedLessonType(l.id)} style={{background:schedLessonType===l.id?"#e8f0ee":"white",border:"2px solid "+(schedLessonType===l.id?G:"#e5e7eb"),borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{l.icon}</div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",color:schedLessonType===l.id?G:"#1a1a1a"}}>{l.label}</div>
                    <div style={{fontWeight:800,color:G,fontSize:"0.95rem",marginTop:4}}>{l.total!=null?"$"+l.total+" total":"$35/person"}</div>
                    {l.note&&<div style={{fontSize:"0.72rem",color:"#9ca3af",marginTop:2}}>{l.note}</div>}
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,marginBottom:16}}>
                <div style={{fontSize:"0.78rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Custom Price <span style={{fontWeight:400,textTransform:"none",color:"#9ca3af"}}>(optional — leave blank to use default)</span></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:"#6b7280"}}>$</span>
                  <input type="number" value={schedCustomPrice} onChange={e=>setSchedCustomPrice(e.target.value)} placeholder={String(SCHED_PRICES[schedLessonType][schedDuration])} style={{...inp,marginBottom:0,width:120}}/>
                  {schedCustomPrice&&<span style={{fontSize:"0.78rem",color:"#f97316",fontWeight:600}}>Custom: ${schedCustomPrice}</span>}
                </div>
              </div>
              <div style={{marginTop:0,background:"#f9f9f6",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:"0.88rem"}}>Custom Location</div>
                    <div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:2}}>Override default location for this lesson</div>
                  </div>
                  <button onClick={()=>{setCustomLocation(!customLocation);setSchedLocation("");}} style={{background:customLocation?G:"white",color:customLocation?"white":"#374151",border:"1.5px solid "+(customLocation?G:"#e5e7eb"),padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>
                    {customLocation?"✓ On":"Off"}
                  </button>
                </div>
                {customLocation&&(
                  <div style={{marginTop:12}}>
                    {/* Recent locations */}
                    {JSON.parse(localStorage.getItem("recentLocations")||"[]").slice(0,3).length>0&&(
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1}}>Recent</span>
                          <span onClick={()=>{localStorage.removeItem("recentLocations");setSchedLocation("");}} style={{fontSize:"0.72rem",color:"#9ca3af",cursor:"pointer",textDecoration:"underline"}}>Clear</span>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {JSON.parse(localStorage.getItem("recentLocations")||"[]").slice(0,3).map((loc,i)=>(
                            <div key={i} onClick={()=>setSchedLocation(loc)} style={{background:schedLocation===loc?"#e8f0ee":"white",border:"1.5px solid "+(schedLocation===loc?"#1a3c34":"#e5e7eb"),padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:schedLocation===loc?700:400,color:schedLocation===loc?"#1a3c34":"#374151"}}>
                              {loc.length>45?loc.substring(0,45)+"...":loc}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <LocationInput value={schedLocation} onChange={v=>{
                      setSchedLocation(v);
                      if(v&&v.length>5){
                        const recent=JSON.parse(localStorage.getItem("recentLocations")||"[]");
                        const updated=[v,...recent.filter(r=>r!==v)].slice(0,10);
                        localStorage.setItem("recentLocations",JSON.stringify(updated));
                      }
                    }} placeholder="Search for a location..." style={inp}/>
                  </div>
                )}
              </div>
              <button onClick={()=>{
                setScheduleStep(2);
                // If launched from week-view quick-book, auto-select the pre-filled slot
                if(schedQuickMins!==null&&schedDate&&schedBusyTimes!==undefined){
                  const isMenlo=selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo";
                  const slots=getSlots(schedDate,isMenlo?"menlo":"public",schedDuration).filter(sl=>!schedBusyTimes.some(b=>{const bufA=b.bufferAfter??30;const bufB=b.bufferBefore??30;return sl.s<(b.endMins+bufA)&&sl.e>(b.startMins-bufB);}));
                  const idx=slots.findIndex(sl=>sl.s===schedQuickMins);
                  if(idx>=0){setSchedSlot(slots[idx]);setSchedSlotIdx(idx);}
                  setSchedQuickMins(null);
                }
              }} style={{width:"100%",background:G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>Next: Date & Time →</button>
            </div>
          )}

          {scheduleStep===2&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{...lbl,marginBottom:0}}>Select a Date</div>
                {schedLoadingAvail&&<span style={{fontSize:"0.75rem",color:"#9ca3af",display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:10,height:10,border:"2px solid #9ca3af",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> Checking availability…</span>}
              </div>
              <div style={{marginBottom:20,pointerEvents:schedLoadingAvail?"none":"auto",opacity:schedLoadingAvail?0.5:1,transition:"opacity 0.2s"}}>
                <CalendarPicker value={schedDate} onChange={async d=>{setSchedDate(d);setSchedSlot(null);setSchedSlotIdx(-1);setSchedLoadingSlots(true);try{const r=await fetch("/api/get-busy-times?date="+d);const data=await r.json();setSchedBusyTimes(data.busy||[]);}catch(e){setSchedBusyTimes([]);}setSchedLoadingSlots(false);}} memberType={schedIsMenlo?"menlo":"public"} fullyBookedDays={schedFullyBookedDays} slotCounts={schedSlotCounts}/>
              </div>
              {schedDate&&(
                <div style={{marginBottom:20}}>
                  <div style={{...lbl,marginBottom:10}}>Select a Time — {fmtDateShort(schedDate)}</div>
                  {schedLoadingSlots
                    ?<div style={{textAlign:"center",padding:"16px",color:"#6b7280",fontSize:"0.85rem"}}>Checking availability...</div>
                    :schedSlots.length===0
                      ?<div style={{background:"#fef2f2",borderRadius:8,padding:"12px",color:"#991b1b",fontSize:"0.85rem"}}>No available slots. Please pick another day.</div>
                      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>
                        {schedSlots.map((s,i)=>(<div key={i} onClick={()=>{setSchedSlot(s);setSchedSlotIdx(i);}} style={{background:schedSlotIdx===i?"#e8f0ee":"white",border:"2px solid "+(schedSlotIdx===i?G:"#e5e7eb"),borderRadius:10,padding:"9px",cursor:"pointer",textAlign:"center",fontWeight:schedSlotIdx===i?700:500,color:schedSlotIdx===i?G:"#374151",fontSize:"0.82rem"}}>{fmt(s.s)}</div>))}
                      </div>
                  }
                </div>
              )}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setScheduleStep(1)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={()=>setScheduleStep(3)} disabled={!schedDate||!schedSlot} style={{flex:2,background:schedDate&&schedSlot?G:"#e5e7eb",color:schedDate&&schedSlot?"white":"#9ca3af",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:schedDate&&schedSlot?"pointer":"not-allowed"}}>Next →</button>
              </div>
            </div>
          )}

          {/* Step 3: Participants (semi/group) OR Details (private) */}
          {scheduleStep===3&&schedLessonType!=="private"&&(
            <div>
              <p style={{fontSize:"0.85rem",color:"#6b7280",marginBottom:16}}>Add the other participants for this lesson.</p>
              {schedLessonType==="semi"&&(
                <div style={{background:"#f9f9f6",borderRadius:12,padding:"16px",marginBottom:16,border:"1.5px solid #e5e7eb"}}>
                  <div style={{fontWeight:700,fontSize:"0.88rem",color:G,marginBottom:12}}>Partner</div>
                  <label style={lbl}>Partner Name</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    <input value={schedPartner.firstName} onChange={e=>setSchedPartner(p=>({...p,firstName:capWords(e.target.value)}))} placeholder="First Name" style={{...inp,marginBottom:0}}/>
                    <input value={schedPartner.lastName} onChange={e=>setSchedPartner(p=>({...p,lastName:capWords(e.target.value)}))} placeholder="Last Name" style={{...inp,marginBottom:0}}/>
                  </div>
                  <label style={lbl}>Partner Email <span style={{fontWeight:400,color:"#9ca3af",textTransform:"none"}}>(optional — for confirmation email)</span></label>
                  <input type="email" value={schedPartner.email} onChange={e=>setSchedPartner(p=>({...p,email:e.target.value}))} placeholder="partner@email.com" style={{...inp,marginBottom:0}}/>
                </div>
              )}
              {(schedLessonType==="group"||schedLessonType==="clinic")&&(
                <div>
                  <div style={{...lbl,marginBottom:8}}>{schedLessonType==="clinic"?"Clinic Size":"Group Size"}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                    {(schedLessonType==="clinic"?[5,6,7,8]:[3,4,5]).map(n=>(
                      <div key={n} onClick={()=>setSchedGroupSize(n)} style={{background:schedGroupSize===n?"#e8f0ee":"white",border:"2px solid "+(schedGroupSize===n?G:"#e5e7eb"),borderRadius:10,padding:"10px 18px",cursor:"pointer",fontWeight:700,color:schedGroupSize===n?G:"#374151",fontSize:"0.9rem"}}>
                        {n} players{schedLessonType==="clinic"?` ($${35*n})`:""}
                      </div>
                    ))}
                  </div>
                  {Array.from({length:schedGroupSize-1}).map((_,i)=>(
                    <div key={i} style={{background:"#f9f9f6",borderRadius:12,padding:"14px 16px",marginBottom:10,border:"1.5px solid #e5e7eb"}}>
                      <div style={{fontWeight:700,fontSize:"0.85rem",color:G,marginBottom:10}}>Player {i+2}</div>
                      <label style={lbl}>Name</label>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                        <input value={schedGroupMembers[i]?.firstName||""} onChange={e=>{const a=[...schedGroupMembers];a[i]={...a[i],firstName:capWords(e.target.value)};setSchedGroupMembers(a);}} placeholder="First Name" style={{...inp,marginBottom:0}}/>
                        <input value={schedGroupMembers[i]?.lastName||""} onChange={e=>{const a=[...schedGroupMembers];a[i]={...a[i],lastName:capWords(e.target.value)};setSchedGroupMembers(a);}} placeholder="Last Name" style={{...inp,marginBottom:0}}/>
                      </div>
                      <label style={lbl}>Email <span style={{fontWeight:400,color:"#9ca3af",textTransform:"none"}}>(optional)</span></label>
                      <input type="email" value={schedGroupMembers[i]?.email||""} onChange={e=>{const a=[...schedGroupMembers];a[i]={...a[i],email:e.target.value};setSchedGroupMembers(a);}} placeholder="player@email.com" style={{...inp,marginBottom:0}}/>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button onClick={()=>setScheduleStep(2)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={()=>setScheduleStep(4)} style={{flex:2,background:G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer"}}>Next: Details →</button>
              </div>
            </div>
          )}

          {/* Step 3 (private) or Step 4 (semi/group): Details */}
          {((scheduleStep===3&&schedLessonType==="private")||(scheduleStep===4&&schedLessonType!=="private"))&&(
            <div>
              <div style={{marginBottom:16}}>
                <div style={{...lbl,marginBottom:6}}>Focus Area <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></div>
                <select value={schedFocus} onChange={e=>setSchedFocus(e.target.value)} style={{...inp,marginBottom:0}}>
                  <option value="">No specific focus</option>
                  {FOCUS_AREAS.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{...lbl,marginBottom:6}}>Notes <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></div>
                <textarea value={schedNotes} onChange={e=>setSchedNotes(e.target.value)} placeholder="Any notes for this lesson..." style={{...inp,height:80,resize:"vertical",fontFamily:"inherit",marginBottom:0}}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setScheduleStep(schedLessonType==="private"?2:3)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={()=>setScheduleStep(schedLessonType==="private"?4:5)} style={{flex:2,background:G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer"}}>Next: Review →</button>
              </div>
            </div>
          )}

          {/* Step 4 (private) or Step 5 (semi/group): Confirm */}
          {((scheduleStep===4&&schedLessonType==="private")||(scheduleStep===5&&schedLessonType!=="private"))&&(
            <div>
              <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:20,border:"1.5px solid #e5e7eb"}}>
                <div style={{fontWeight:700,color:G,marginBottom:12}}>Booking Summary</div>
                <div style={{fontSize:"0.9rem",color:"#374151",lineHeight:2}}>
                  <div><strong>{mockUsers[selectedStudent]?.name}</strong></div>
                  {schedLessonType==="semi"&&(schedPartner.firstName||schedPartner.lastName)&&<div>Partner: {(schedPartner.firstName+" "+schedPartner.lastName).trim()}{schedPartner.email?" · "+schedPartner.email:""}</div>}
                  {(schedLessonType==="group"||schedLessonType==="clinic")&&memberNames.length>1&&<div>{schedLessonType==="clinic"?"Participants":"Group"}: {memberNames.join(", ")}</div>}
                  <div>{fmtDate(schedDate)}</div>
                  <div>{schedSlot&&toTimeStr(schedSlot.s,schedSlot.e)}</div>
                  <div>{schedLessonType==="private"?"Private":schedLessonType==="semi"?"Semi-Private":"Group"} · {schedDuration} min</div>
                  {schedFocus&&<div style={{color:G,fontWeight:600}}>Focus: {schedFocus}</div>}
                  <div>{schedCustomPrice?"$"+schedCustomPrice+" (custom)":schedLessonType==="clinic"?"$"+(35*schedGroupSize)+" ($35 × "+schedGroupSize+")":"$"+(SCHED_PRICES[schedLessonType]?.[schedDuration]||0)+" total"}{!schedCustomPrice&&schedLessonType==="semi"?" ($"+(SCHED_PRICES["semi"][schedDuration]/2)+"/person)":!schedCustomPrice&&schedLessonType==="group"?" (split equally)":""}</div>
                  <div style={{display:"flex",alignItems:"flex-start",gap:6}}><span style={{color:"#9ca3af",fontSize:"0.8rem",fontWeight:700,paddingTop:2,whiteSpace:"nowrap"}}>📍 Location:</span><a href={customLocation&&schedLocation?"https://maps.google.com/?q="+encodeURIComponent(schedLocation):(!schedIsMenlo?"https://maps.google.com/?q=Andrew+Spinas+Park,+3003+Bay+Rd,+Redwood+City,+CA+94063":"https://maps.google.com/?q=Menlo+Circus+Club,+190+Park+Ln,+Atherton,+CA+94027")} target="_blank" rel="noreferrer" style={{color:G,fontWeight:600}}>{customLocation&&schedLocation?schedLocation:(!schedIsMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Menlo Circus Club, Atherton")}</a></div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setScheduleStep(schedLessonType==="private"?3:4)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={handleSchedule} disabled={schedSubmitting} style={{flex:2,background:schedSubmitting?"#9ca3af":G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:schedSubmitting?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {schedSubmitting&&<span style={{display:"inline-block",width:14,height:14,border:"2.5px solid white",borderTop:"2.5px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>}
                  {schedSubmitting?"Scheduling...":"Confirm & Send Confirmation ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="lessons_placeholder"&&(
        <AdminCalendarView/>
      )}
      {tab==="lessons"&&(()=>{
        const todayStr=toDS(new Date());

        // ── RSVP helpers ─────────────────────────────────────────────────────
        // Build a lookup map: gcalEventId → attendees[] from ALL calendarItems
        const calAttendeesByGcalId={};
        calendarItems.forEach(c=>{if(c.gcalEventId&&c.attendees&&c.attendees.length>0)calAttendeesByGcalId[c.gcalEventId]=c.attendees;});
        const RsvpDot=({status,email})=>{
          const dotColor=status==="accepted"?"#16a34a":status==="declined"?"#dc2626":"#d1d5db";
          const dotBorder=status==="needsAction"?"1.5px solid #9ca3af":"none";
          const label=status==="accepted"?"✓ Confirmed":status==="declined"?"✗ Declined":"No response";
          return(<span title={(email?email+": ":"")+label} style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:dotColor,border:dotBorder,flexShrink:0,cursor:"default"}}/>);
        };
        const RsvpBadge=({attendees})=>{
          if(!attendees||attendees.length===0)return null;
          return(<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f9f9f9",border:"1px solid #e5e7eb",borderRadius:50,padding:"2px 8px",fontSize:"0.7rem",color:"#6b7280",flexShrink:0}} title="Calendar RSVP status">{attendees.map((a,i)=><RsvpDot key={i} status={a.status} email={a.email}/>)}</span>);
        };

        // ── helper: render a portal lesson row ──────────────────────────────
        const menuKey=(l)=>l.id+"_"+l.studentEmail;
        const LessonRow=(l)=>{
          const mk=menuKey(l);const isMenuOpen=activeMenu===mk;
          const isCancelled=cancelledStatuses2.includes(l.status);
          const missingCal=!l.gcalEventId;
          return(
          <div key={mk} style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",marginBottom:10,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {/* Left: date + student info */}
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{background:"#e8f0ee",borderRadius:10,padding:"9px 12px",textAlign:"center",minWidth:44,flexShrink:0}}>
                  <div style={{fontSize:"1.1rem",fontWeight:900,color:G,lineHeight:1}}>{new Date(l.date+"T12:00:00").getDate()}</div>
                  <div style={{fontSize:"0.58rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{new Date(l.date+"T12:00:00").toLocaleString("default",{month:"short"})}</div>
                </div>
                <div>
                  <div onClick={()=>{setSelectedStudent(l.studentEmail);setTab("students");}} style={{fontWeight:700,fontSize:"0.95rem",cursor:"pointer",color:G,textDecoration:"underline",textDecorationColor:"transparent",transition:"text-decoration-color 0.15s"}} onMouseEnter={e=>e.target.style.textDecorationColor=G} onMouseLeave={e=>e.target.style.textDecorationColor="transparent"}>{l.studentName}</div>
                  {l.time&&<div style={{fontSize:"0.85rem",fontWeight:700,color:"#374151",marginTop:2}}>🕐 {l.time}</div>}
                  <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:1}}>{l.type}{l.duration?" · "+l.duration:""}</div>
                  {l.focus&&<div style={{fontSize:"0.75rem",color:G,marginTop:1,fontWeight:600}}>{l.focus}</div>}
                </div>
              </div>
              {/* Right: badges + actions */}
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                {missingCal&&!isCancelled&&<span title="This lesson has no linked Google Calendar event" style={{background:"#fff7ed",color:"#c2410c",border:"1px solid #fed7aa",padding:"2px 8px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>⚠️ No Cal</span>}
                {l.ticketId&&<span title={"Ticket: "+l.ticketId} style={{background:"#e8f0ee",color:G,padding:"2px 8px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>🏷 Portal</span>}
                {l.gcalEventId&&calAttendeesByGcalId[l.gcalEventId]&&<RsvpBadge attendees={calAttendeesByGcalId[l.gcalEventId]}/>}
                {l.isMenlo&&<span style={{background:G,color:"white",padding:"2px 7px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>MCC</span>}
                <span style={{background:l.status==="confirmed"?"#e8f0ee":l.status==="late_cancel"?"#fff7ed":l.status==="cancelled_forgiven"?"#f3f4f6":l.status==="cancelled"?"#fef2f2":"#fffbea",color:l.status==="confirmed"?G:l.status==="late_cancel"?"#c2410c":l.status==="cancelled_forgiven"?"#6b7280":l.status==="cancelled"?"#dc2626":"#92400e",padding:"3px 9px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>
                  {l.status==="confirmed"?"✓ Confirmed":l.status==="cancelled"?l.cancelledByGcal?"📅 Removed from Calendar":"✕ Cancelled":l.status==="late_cancel"?"⚠️ Late Cancel":l.status==="cancelled_forgiven"?"✓ Forgiven":"⏳ Pending"}
                </span>
                {l.status==="late_cancel"&&<button onClick={()=>onUpdateLesson(l.studentEmail,l.id,{status:"cancelled_forgiven"})} style={{background:"white",color:"#6b7280",border:"1.5px solid #d1d5db",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>✓ Forgive</button>}
                <button onClick={()=>setActiveMenu(isMenuOpen?null:mk)} style={{background:isMenuOpen?"#f3f4f6":"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:"1rem",lineHeight:1,color:"#6b7280",fontWeight:700}}>⋯</button>
              </div>
            </div>
            {/* ⋯ action bar */}
            {isMenuOpen&&(
              <div style={{borderTop:"1px solid #f3f4f6",background:"#fafafa",padding:"10px 18px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                {!isCancelled&&!isPast(l.date,l.time)&&<button onClick={()=>{setConfirmCancel(mk);setActiveMenu(null);}} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✕ Cancel Lesson</button>}
                <DelBtn onClick={()=>{setConfirmDelete(mk);setActiveMenu(null);}} style={{color:"#6b7280",borderColor:"#d1d5db"}}>📦 Archive</DelBtn>
                <span style={{flex:1}}/>
                <button onClick={()=>setActiveMenu(null)} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:"0.8rem"}}>Close</button>
              </div>
            )}
            {/* Cancel confirm */}
            {confirmCancel===mk&&(
              <div style={{background:"#fef2f2",borderTop:"1px solid #fca5a5",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <span style={{fontWeight:700,color:"#991b1b",fontSize:"0.88rem"}}>Cancel this lesson?</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setConfirmCancel(null)} disabled={cancelLoading} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600,opacity:cancelLoading?0.5:1}}>Keep it</button>
                  <button onClick={async()=>{setCancelLoading(true);await onCancelLesson(l.studentEmail,l.id);setCancelLoading(false);setConfirmCancel(null);}} disabled={cancelLoading} style={{background:cancelLoading?"#9ca3af":"#dc2626",color:"white",border:"none",padding:"6px 14px",borderRadius:50,cursor:cancelLoading?"not-allowed":"pointer",fontSize:"0.82rem",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                    {cancelLoading&&<span style={{display:"inline-block",width:12,height:12,border:"2px solid white",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>}
                    {cancelLoading?"Cancelling...":"Yes, Cancel"}
                  </button>
                </div>
              </div>
            )}
            {/* Archive confirm */}
            {confirmDelete===mk&&(
              <div style={{background:"#f9fafb",borderTop:"2px solid #d1d5db",padding:"16px 18px"}}>
                <div style={{fontWeight:800,color:"#374151",fontSize:"0.95rem",marginBottom:4}}>Archive this lesson?</div>
                <div style={{fontSize:"0.82rem",color:"#6b7280",marginBottom:12}}>It will be moved to the student's Archived section. You can permanently delete it there with your admin password.</div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button onClick={()=>setConfirmDelete(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Keep it</button>
                  <button onClick={async()=>{
                    await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{status:"archived"}})}).catch(e=>console.error("Archive failed:",e));
                    onUpdateLesson(l.studentEmail,l.id,{status:"archived"});
                    setConfirmDelete(null);setDeletedToast(true);setTimeout(()=>setDeletedToast(false),3000);
                  }} style={{background:"#4b5563",color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>
                    Yes, Archive
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        };

        // ── helper: render a calendar event row ──────────────────────────────
        const CalRow=(e,idx)=>{
          const d=new Date(e.date+"T12:00:00");
          const isStanford=e.isStanford||((e.summary||"").toLowerCase().includes("stanford"));
          const isMenlo=e.isMenlo;
          const rowBg=isStanford?"#fdf8ff":isMenlo?"#fffbeb":"#fafffe";
          const rowBorder=isStanford?"#e9d5ff":isMenlo?"#fde68a":"#d1fae5";
          const dateBg=isStanford?"#ede9fe":isMenlo?"#fef3c7":"#d1fae5";
          const dateColor=isStanford?"#5b21b6":isMenlo?"#92400e":"#065f46";
          const titleColor=isStanford?"#4c1d95":isMenlo?"#78350f":"#1a3c34";
          const badgeBg=isStanford?"#ede9fe":isMenlo?"#fef3c7":"#d1fae5";
          const badgeColor=isStanford?"#5b21b6":isMenlo?"#92400e":"#065f46";
          const badgeLabel=isStanford?"🎓 Stanford":isMenlo?"🏠 Menlo":"📅 Calendar";
          // Find linked student from attendee emails
          const linkedEmail=(e.attendeeEmails||[]).find(em=>mockUsers[em]);
          const linkedStudent=linkedEmail?mockUsers[linkedEmail]:null;
          const isConfirmingCalDel=confirmCalDelete===e.gcalEventId;
          return(
            <div key={"cal-"+idx} style={{background:rowBg,borderRadius:12,border:"1.5px solid "+rowBorder,marginBottom:10,overflow:"hidden"}}>
              <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{background:dateBg,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:48}}>
                    <div style={{fontSize:"1.2rem",fontWeight:900,color:dateColor,lineHeight:1}}>{d.getDate()}</div>
                    <div style={{fontSize:"0.6rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{d.toLocaleString("default",{month:"short"})}</div>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.95rem",color:titleColor}}>{e.summary}</div>
                    {linkedStudent&&(
                      <div
                        onClick={()=>{setSelectedStudent(linkedEmail);setTab("students");}}
                        style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:3,cursor:"pointer",background:G+"15",border:"1px solid "+G+"40",borderRadius:50,padding:"2px 10px 2px 4px"}}
                        onMouseEnter={ev=>ev.currentTarget.style.background=G+"25"}
                        onMouseLeave={ev=>ev.currentTarget.style.background=G+"15"}
                      >
                        {linkedStudent.picture
                          ?<img src={linkedStudent.picture} style={{width:18,height:18,borderRadius:"50%",objectFit:"cover"}}/>
                          :<div style={{width:18,height:18,borderRadius:"50%",background:G,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",fontWeight:800}}>{(linkedStudent.name||"?")[0]}</div>
                        }
                        <span style={{fontSize:"0.75rem",fontWeight:700,color:G}}>{linkedStudent.name}</span>
                      </div>
                    )}
                    {e.startTime&&<div style={{fontSize:"0.85rem",fontWeight:700,color:"#374151",marginTop:2}}>🕐 {e.startTime}{e.endTime?" – "+e.endTime:""}</div>}
                    <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:1}}>{e.category}{e.hours?" · "+e.hours+"h":""}</div>
                    {e.location&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>📍 {e.location.split(",")[0]}</div>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{background:badgeBg,color:badgeColor,padding:"3px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>{badgeLabel}</span>
                  {e.attendees&&e.attendees.length>0&&<RsvpBadge attendees={e.attendees}/>}
                  {e.gcalEventId&&!isStanford&&!isMenlo&&(
                    <DelBtn onClick={()=>setConfirmCalDelete(isConfirmingCalDel?null:e.gcalEventId)} style={{padding:"4px 8px",fontSize:"0.75rem"}}></DelBtn>
                  )}
                </div>
              </div>
              {isConfirmingCalDel&&(
                <div style={{background:"#fef2f2",borderTop:"2px solid #dc2626",padding:"14px 18px"}}>
                  <div style={{fontWeight:800,color:"#991b1b",fontSize:"0.9rem",marginBottom:3}}>Remove from Google Calendar?</div>
                  <div style={{fontSize:"0.8rem",color:"#b91c1c",marginBottom:10,fontWeight:600}}>⚠️ This is a manual calendar event — it will be permanently deleted from Google Calendar.</div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setConfirmCalDelete(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>Keep it</button>
                    <button disabled={calDeleteLoading} onClick={async()=>{
                      setCalDeleteLoading(true);
                      try{await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",eventId:e.gcalEventId,mode:"delete"})});}
                      catch(err){console.error("Cal delete failed:",err);}
                      // Remove from calendarItems state immediately
                      setCalendarItems(prev=>prev.filter(c=>c.gcalEventId!==e.gcalEventId));
                      setCalDeleteLoading(false);setConfirmCalDelete(null);
                      setDeletedToast(true);setTimeout(()=>setDeletedToast(false),3000);
                    }} style={{background:calDeleteLoading?"#9ca3af":"#dc2626",color:"white",border:"none",padding:"6px 14px",borderRadius:50,cursor:calDeleteLoading?"not-allowed":"pointer",fontSize:"0.8rem",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                      {calDeleteLoading&&<span style={{display:"inline-block",width:11,height:11,border:"2px solid white",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>}
                      {calDeleteLoading?"Deleting…":"Yes, Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        };

        // ── shared helpers ───────────────────────────────────────────────────
        const weekDays=getWeekDays(selectedDay);
        const monthGrid=getMonthGrid(calMonth);
        const dayPortal=(day)=>allLessonsList.filter(l=>l.date===day&&(filterCancelled||!cancelledStatuses2.includes(l.status)));
        // Exclude GCal events that already have a corresponding portal lesson (avoid double-display)
        const dayCalItems=(day)=>showCalendar?calendarItems.filter(e=>e.date===day&&!portalGcalIds.has(e.gcalEventId)&&(showStanford||!e.isStanford)):[];
        const hasDayActivity=(day)=>dayPortal(day).length>0||dayCalItems(day).length>0;
        const selPortal=dayPortal(selectedDay);
        const selCal=dayCalItems(selectedDay);
        const merged=[...selPortal.map(l=>({...l,_c:false})),...selCal.map((e,i)=>({...e,_c:true,_i:i}))].sort((a,b)=>a.date.localeCompare(b.date));
        const todayFull=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
        const dayLabel=(day)=>day===todayStr?"Today":day===toDS(addDays(new Date(),1))?"Tomorrow":day===toDS(addDays(new Date(),-1))?"Yesterday":fmtDate(day);

        return(
        <div>
          {/* ── Weather banner (always visible) ───────────────────────── */}
          <div style={{background:"linear-gradient(135deg,#1a3c34 0%,#2d6a5e 100%)",borderRadius:14,padding:"16px 20px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:weather?.hourly?.length?12:0}}>
              <div>
                <div style={{color:"rgba(255,255,255,0.65)",fontSize:"0.72rem",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Today · 94303</div>
                <div style={{color:"white",fontWeight:800,fontSize:"1rem",marginTop:1}}>{todayFull}</div>
              </div>
              {weather&&(
                <div style={{display:"flex",alignItems:"center",gap:9,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 16px"}}>
                  <span style={{fontSize:"1.8rem"}}>{weather.emoji}</span>
                  <div><div style={{color:"white",fontWeight:800,fontSize:"1.3rem",lineHeight:1}}>{weather.temp}°F</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:"0.75rem"}}>{weather.desc}</div></div>
                </div>
              )}
            </div>
            {weather?.hourly?.length>0&&(
              <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:1}}>
                {weather.hourly.map((h,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.1)",borderRadius:9,padding:"6px 9px",textAlign:"center",minWidth:48,flexShrink:0}}>
                    <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.62rem",fontWeight:600,marginBottom:2}}>{h.time}</div>
                    <div style={{fontSize:"1rem"}}>{h.emoji}</div>
                    <div style={{color:"white",fontWeight:700,fontSize:"0.8rem",marginTop:1}}>{h.temp}°</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Controls row: view switcher + filters ──────────────────── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:10}}>
              {[["day","Day"],["week","Week"],["month","Month"],["upcoming","Upcoming"]].map(([v,lbl])=>(
                <button key={v} onClick={()=>{setUpcomingView(v);if(v==="day")setSelectedDay(todayStr);}} style={{background:upcomingView===v?"white":"transparent",color:upcomingView===v?G:"#6b7280",border:"none",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:"0.85rem",fontWeight:upcomingView===v?700:500,boxShadow:upcomingView===v?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>{lbl}</button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              {upcomingView==="month"&&(
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button onClick={()=>{const[y,m]=calMonth.split("-").map(Number);const prev=new Date(y,m-2,1);setCalMonth(toDS(prev).slice(0,7));}} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>‹</button>
                  <span style={{fontWeight:700,fontSize:"0.88rem",color:G,minWidth:88,textAlign:"center"}}>{new Date(calMonth+"-15").toLocaleString("default",{month:"long",year:"numeric"})}</span>
                  <button onClick={()=>{const[y,m]=calMonth.split("-").map(Number);const next=new Date(y,m,1);setCalMonth(toDS(next).slice(0,7));}} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>›</button>
                </div>
              )}
              {/* Filter pills — hidden in Upcoming view */}
              {upcomingView!=="upcoming"&&<button onClick={()=>setFilterCancelled(p=>!p)} style={{background:filterCancelled?"#fef2f2":"white",color:filterCancelled?"#dc2626":"#6b7280",border:"1.5px solid "+(filterCancelled?"#fca5a5":"#e5e7eb"),padding:"5px 13px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:filterCancelled?700:500}}>
                {filterCancelled?"✕ Hide Cancelled":"Show Cancelled"}
              </button>}
              <div style={{display:"flex",alignItems:"center",gap:16,padding:"4px 12px",background:"white",border:"1.5px solid #e5e7eb",borderRadius:50,flexWrap:"wrap"}}>
                <IosSwitch on={showStanford} onClick={()=>setShowStanford(p=>!p)} label="Stanford"/>
                <div style={{width:1,height:16,background:"#e5e7eb"}}/>
                <IosSwitch on={showCalendar} onClick={()=>setShowCalendar(p=>!p)} label={calLoading?"Cal…":"Calendar"}/>
                <div style={{width:1,height:16,background:"#e5e7eb"}}/>
                <IosSwitch on={showEvents} onClick={()=>setShowEvents(p=>!p)} label={eventsLoading?"Events…":"Events"}/>
              </div>
            </div>
          </div>

          {/* ── DAY view ───────────────────────────────────────────────── */}
          {upcomingView==="day"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <button onClick={()=>setSelectedDay(toDS(addDays(new Date(selectedDay+"T12:00:00"),-1)))} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>‹</button>
                <button onClick={()=>setSelectedDay(todayStr)} style={{background:selectedDay===todayStr?G:"white",color:selectedDay===todayStr?"white":"#374151",border:"1.5px solid "+(selectedDay===todayStr?G:"#e5e7eb"),borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Today</button>
                <button onClick={()=>setSelectedDay(toDS(addDays(new Date(selectedDay+"T12:00:00"),1)))} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>›</button>
                <span style={{fontWeight:700,color:"#374151",fontSize:"0.9rem"}}>{dayLabel(selectedDay)}</span>
                <span style={{color:"#9ca3af",fontSize:"0.82rem"}}>— {merged.length} lesson{merged.length!==1?"s":""}</span>
              </div>
              {merged.length===0
                ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No lessons on {fmtDateShort(selectedDay)}.</div>
                :merged.map((l,i)=>l._c?CalRow(l,i):LessonRow(l))
              }
            </div>
          )}

          {/* ── WEEK view — time grid ──────────────────────────────────── */}
          {upcomingView==="week"&&(()=>{
            const HOUR_H=60;const GRID_S=8;
            const fmtHour=h=>h===0?"12am":h<12?h+"am":h===12?"12pm":(h-12)+"pm";
            const fmtMinLabel=mins=>{const h=Math.floor(mins/60);const m=mins%60;const pm=h>=12;const h12=h===0?12:h>12?h-12:h;return h12+(m?":"+String(m).padStart(2,"0"):"")+(pm?"pm":"am");};
            // Find latest event end hour across whole week to extend grid for Stanford
            const allWkItems=weekDays.flatMap(day=>[...dayPortal(day).map(l=>({...l,_c:false})),...dayCalItems(day).map((e,i)=>({...e,_c:true,_i:i}))]);
            const latestH=allWkItems.reduce((mx,item)=>{const{e}=getItemStartEnd(item);return e?Math.max(mx,Math.ceil(e/60)):mx;},17);
            const GRID_E=Math.max(17,latestH);
            const totalH=(GRID_E-GRID_S)*HOUR_H;
            const hours=Array.from({length:GRID_E-GRID_S},(_,i)=>GRID_S+i);
            return(
              <div>
                {/* Week nav */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                  <button onClick={()=>setSelectedDay(toDS(addDays(new Date(weekDays[0]+"T12:00:00"),-7)))} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>‹ Prev</button>
                  <button onClick={()=>setSelectedDay(todayStr)} style={{background:weekDays.includes(todayStr)?G:"white",color:weekDays.includes(todayStr)?"white":"#374151",border:"1.5px solid "+(weekDays.includes(todayStr)?G:"#e5e7eb"),borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>This Week</button>
                  <button onClick={()=>setSelectedDay(toDS(addDays(new Date(weekDays[0]+"T12:00:00"),7)))} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Next ›</button>
                  <span style={{color:"#6b7280",fontSize:"0.85rem",fontWeight:600}}>{fmtDateShort(weekDays[0])} – {fmtDateShort(weekDays[6])}</span>
                </div>
                {/* Quick-book bar */}
                {quickBook&&(
                  <div style={{background:"#e8f0ee",border:"1.5px solid "+G,borderRadius:10,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,color:G,fontSize:"0.88rem"}}>📅 {dayLabel(quickBook.day)} · {fmtMinLabel(quickBook.startMins)}</span>
                    <span style={{color:"#6b7280",fontSize:"0.82rem"}}>Select student to book:</span>
                    <select onChange={ev=>{
                      if(ev.target.value){
                        const em=ev.target.value;
                        const day=quickBook.day;
                        const startMins=quickBook.startMins;
                        // Open at step 1 so lesson type/duration can be chosen first
                        // Date is pre-filled; busy times pre-fetched in background;
                        // slot auto-selects when "Next: Date & Time →" is clicked
                        setSelectedStudent(em);
                        setSchedDate(day);
                        setSchedQuickMins(startMins);
                        setScheduleStep(1);
                        setShowSchedule(true);
                        setTab("students");
                        setQuickBook(null);
                        // Pre-fetch busy times in background so step 2 is instant
                        setSchedLoadingSlots(true);
                        fetch("/api/get-busy-times?date="+day)
                          .then(r=>r.json())
                          .then(d=>setSchedBusyTimes(d.busy||[]))
                          .catch(()=>setSchedBusyTimes([]))
                          .finally(()=>setSchedLoadingSlots(false));
                      }
                    }} defaultValue="" style={{border:"1.5px solid #d1d5db",borderRadius:8,padding:"5px 10px",fontSize:"0.82rem",background:"white",flex:1,minWidth:140}}>
                      <option value="">— pick student —</option>
                      {sortedStudents.map(em=>(<option key={em} value={em}>{mockUsers[em]?.name||em}</option>))}
                    </select>
                    <button onClick={()=>setQuickBook(null)} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:"1rem",padding:"0 4px",marginLeft:"auto"}}>✕</button>
                  </div>
                )}
                {/* Time grid — horizontally scrollable on mobile */}
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4,borderRadius:10,border:"1px solid #e5e7eb",background:"white"}}>
                  <div style={{display:"flex",minWidth:620}}>
                    {/* Time axis — labels share exact coordinate system with grid lines */}
                    <div style={{width:42,flexShrink:0,borderRight:"1px solid #f3f4f6",background:"#fafafa"}}>
                      {/* Header spacer: same height + borderBottom as day column header so grid bodies start at identical y */}
                      <div style={{height:52,borderBottom:"1px solid #e5e7eb",boxSizing:"border-box"}}/>
                      {/* Label layer mirrors grid body exactly.
                          Labels sit ABOVE their grid line (Google/Apple Calendar convention).
                          top = gridLineY - 1  +  translateY(-100%) = label bottom 1px above the line.
                          No percentage-of-font-height math → zero sub-pixel drift. */}
                      <div style={{position:"relative",height:totalH}}>
                        {hours.map(h=>(
                          <div key={h} style={{position:"absolute",top:(h-GRID_S)*HOUR_H-1,right:5,lineHeight:1,transform:"translateY(-100%)",color:(h===17&&GRID_E>17)?"#f59e0b":"#9ca3af",fontSize:"0.6rem",fontWeight:700,whiteSpace:"nowrap"}}>{fmtHour(h)}</div>
                        ))}
                        <div style={{position:"absolute",top:totalH-1,right:5,lineHeight:1,transform:"translateY(-100%)",color:"#9ca3af",fontSize:"0.6rem",fontWeight:700,whiteSpace:"nowrap"}}>{fmtHour(GRID_E)}</div>
                      </div>
                    </div>
                    {/* 7 day columns */}
                    {weekDays.map((day,di)=>{
                      const isToday=day===todayStr;
                      const d=new Date(day+"T12:00:00");
                      const dow=d.getDay();
                      const isWeekday=dow>=1&&dow<=5;
                      const wdShort=d.toLocaleString("default",{weekday:"short"});
                      const allDayItems=[...dayPortal(day).map(l=>({...l,_c:false})),...dayCalItems(day).map((e,i)=>({...e,_c:true,_i:i}))];
                      // Real availability: scheduler business rules filtered by ALL Google Calendar busy times
                      const busyForDay=weekBusyMap[day]||[];
                      const schedSlots=getSlots(day,'public',60).filter(sl=>{
                        return!busyForDay.some(b=>{
                          const bufA=b.bufferAfter||0;const bufB=b.bufferBefore||0;
                          return sl.s<(b.endMins+bufA)&&sl.e>(b.startMins-bufB);
                        });
                      });
                      const schedSlotSet=new Set(schedSlots.map(sl=>Math.floor(sl.s/60)));
                      // Available = schedulable AND not occupied by portal/cal items
                      const availHoursSet=new Set(schedSlots.map(sl=>Math.floor(sl.s/60)).filter(h=>{
                        const slotS=h*60,slotE=(h+1)*60;
                        return!allDayItems.some(item=>{const{s,e}=getItemStartEnd(item);if(s===null)return false;const ie=e||(s+60);return s<slotE&&ie>slotS;});
                      }));
                      return(
                        <div key={day} style={{flex:"1 1 0",minWidth:0,borderLeft:di===0?"none":"1px solid #e5e7eb"}}>
                          {/* Day header */}
                          <div style={{height:52,boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:isToday?G:isWeekday?"white":"#f4f4f5",borderBottom:"1px solid #e5e7eb",padding:"4px 2px"}}>
                            <div style={{fontSize:"0.6rem",fontWeight:700,color:isToday?"rgba(255,255,255,0.7)":"#9ca3af",textTransform:"uppercase",letterSpacing:"0.04em"}}>{wdShort}</div>
                            <div style={{fontSize:"1.1rem",fontWeight:900,color:isToday?"white":"#374151",lineHeight:1.2}}>{d.getDate()}</div>
                            <div style={{fontSize:"0.55rem",color:isToday?"rgba(255,255,255,0.6)":"#9ca3af"}}>{d.toLocaleString("default",{month:"short"})}</div>
                          </div>
                          {/* Grid body */}
                          <div style={{position:"relative",height:totalH}}>
                            {/* Hour row backgrounds — no border so event blocks align pixel-perfectly */}
                            {hours.map(h=>{
                              const isSchedH=h<17&&schedSlotSet.has(h);
                              const isAvailH=availHoursSet.has(h);
                              const rowBg=h>=17?"rgba(254,243,199,0.4)":isSchedH?"white":"#f4f4f5";
                              return(
                                <div
                                  key={h}
                                  style={{position:"absolute",top:(h-GRID_S)*HOUR_H,height:HOUR_H,width:"100%",background:rowBg,zIndex:0,cursor:isAvailH?"pointer":"default",transition:isAvailH?"background 0.12s":"none"}}
                                  onClick={isAvailH?()=>setQuickBook({day,startMins:h*60}):undefined}
                                  onMouseEnter={isAvailH?(ev)=>{ev.currentTarget.style.background="rgba(22,163,74,0.10)"}:undefined}
                                  onMouseLeave={isAvailH?(ev)=>{ev.currentTarget.style.background=rowBg}:undefined}
                                  title={isAvailH?"Open · "+fmtHour(h)+" – "+fmtHour(h+1)+" · click to book":undefined}
                                />
                              );
                            })}
                            {/* Grid lines as separate 1px divs at exact pixel positions — always aligned with time axis */}
                            {hours.map(h=>(
                              <div key={"gl"+h} style={{position:"absolute",top:(h-GRID_S)*HOUR_H,left:0,right:0,height:1,background:"#e5e7eb",zIndex:1,pointerEvents:"none"}}/>
                            ))}
                            {/* 5pm boundary line */}
                            {GRID_E>17&&<div style={{position:"absolute",top:(17-GRID_S)*HOUR_H,left:0,right:0,height:2,background:"#fbbf24",zIndex:1,pointerEvents:"none"}}/>}
                            {/* Bottom grid line */}
                            <div style={{position:"absolute",top:totalH,left:0,right:0,height:1,background:"#e5e7eb",zIndex:1,pointerEvents:"none"}}/>
                            {/* Current time indicator — only on today's column */}
                            {isToday&&(()=>{const now=new Date();const nowMins=now.getHours()*60+now.getMinutes();if(nowMins<GRID_S*60||nowMins>GRID_E*60)return null;const nowTop=(nowMins-GRID_S*60)/60*HOUR_H;return(<><div style={{position:"absolute",top:nowTop-1,left:0,right:0,height:2,background:"#ef4444",zIndex:9,pointerEvents:"none"}}/><div style={{position:"absolute",top:nowTop-5,left:-4,width:10,height:10,borderRadius:"50%",background:"#ef4444",zIndex:9,pointerEvents:"none"}}/></>);})()}
                            {/* Event / lesson blocks */}
                            {allDayItems.map((item,i)=>{
                              const{s,e}=getItemStartEnd(item);
                              if(s===null)return null;
                              const ie=e||(s+60);
                              const top=(s-GRID_S*60)/60*HOUR_H;
                              const ht=Math.max((ie-s)/60*HOUR_H,16);
                              if(top>=totalH||top+ht<=0)return null;
                              const isPickupItem=item.isPickup;
                              const isStanfordItem=item.isStanford||((item.summary||"").toLowerCase().includes("stanford"));
                              const isPortal=!!item.studentEmail;
                              const isCancelled=isPortal&&cancelledStatuses2.includes(item.status);
                              let bg,bd,tc,lbl,timeStr;
                              if(isPickupItem){bg="#fff7ed";bd="#fed7aa";tc="#c2410c";lbl=item.summary||"Pickup";}
                              else if(isStanfordItem){bg="#ede9fe";bd="#c4b5fd";tc="#5b21b6";lbl=item.summary;}
                              else if(!isPortal){bg="#d1fae5";bd="#6ee7b7";tc="#065f46";lbl=item.summary;}
                              else{bg=isCancelled?"#fef2f2":"#e8f0ee";bd=isCancelled?"#fca5a5":G;tc=isCancelled?"#dc2626":G;lbl=item.studentName;}
                              timeStr=isPortal?item.time:(item.startTime+(item.endTime?" – "+item.endTime:""));
                              return(
                                <div key={"ev"+i} style={{position:"absolute",top:Math.max(0,top),left:2,right:2,height:ht,boxSizing:"border-box",background:bg,border:"1.5px solid "+bd,borderRadius:6,padding:"3px 5px",overflow:"hidden",zIndex:2}}>
                                  <div style={{fontSize:"0.64rem",fontWeight:700,color:tc,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{lbl}</div>
                                  {ht>28&&<div style={{fontSize:"0.58rem",color:tc,opacity:0.75,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{timeStr}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── MONTH view ─────────────────────────────────────────────── */}
          {/* ── UPCOMING view ──────────────────────────────────────────── */}
          {upcomingView==="upcoming"&&(()=>{
            const todayDT=new Date();todayDT.setHours(0,0,0,0);
            const nowDT=new Date();
            // Helper: is a calendar item already past (for greying out today's past items)
            const isCalPast=(c)=>{
              if(c.date>todayStr)return false;
              if(c.date<todayStr)return true;
              if(!c.startTime)return false;
              const m=c.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if(!m)return false;
              let h=parseInt(m[1]);const mn=parseInt(m[2]);const ap=m[3].toUpperCase();
              if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;
              const t=new Date();t.setHours(h,mn,0,0);return nowDT>t;
            };
            // Portal: include today's lessons even if past (for greying); show today+future
            const portalFwd=allLessonsList.filter(l=>!cancelledStatuses2.includes(l.status)&&new Date(l.date+"T12:00:00")>=todayDT);
            // Calendar: include all non-pickup from today onward (excluding portal-linked events)
            const calFwd=showCalendar?calendarItems.filter(c=>!c.isPickup&&new Date(c.date+"T12:00:00")>=todayDT&&!portalGcalIds.has(c.gcalEventId)&&(showStanford||!c.isStanford)):[];
            const todayDT2=new Date(todayStr+"T00:00:00");
            const eventsFwd=showEvents?eventsData.filter(e=>new Date(e.date+"T12:00:00")>=todayDT2):[];
            const t2mins=t=>{if(!t)return 9999;const m=t.match(/(\d+):(\d+)\s*(AM|PM)/i);if(!m)return 9999;let h=parseInt(m[1]),mn=parseInt(m[2]),ap=m[3].toUpperCase();if(ap==="PM"&&h!==12)h+=12;if(ap==="AM"&&h===12)h=0;return h*60+mn;};
            const merged2=[
              ...portalFwd.map(l=>({...l,_type:"portal",_isPast:isPast(l.date,l.time),_sortKey:l.date+String(t2mins(l.time)).padStart(4,"0")})),
              ...calFwd.map((c,i)=>({...c,_type:"cal",_idx:i,_isPast:isCalPast(c),_sortKey:c.date+String(t2mins(c.startTime)).padStart(4,"0")})),
              ...eventsFwd.map(e=>({...e,_type:"event",_isPast:false,_sortKey:e.date+String(t2mins(e.startTime)).padStart(4,"0")}))
            ].sort((a,b)=>a._sortKey.localeCompare(b._sortKey));
            // Group by date
            const byDate={};
            merged2.forEach(item=>{if(!byDate[item.date])byDate[item.date]=[];byDate[item.date].push(item);});
            const dates=Object.keys(byDate).sort();
            const futureCount=merged2.filter(x=>!x._isPast).length;
            if(dates.length===0)return(
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>
                {calLoading?"Loading upcoming lessons…":"No upcoming lessons found."}
              </div>
            );
            return(
              <div>
                <div style={{fontSize:"0.78rem",color:"#9ca3af",marginBottom:16}}>{futureCount} upcoming · {merged2.length} total today &amp; forward</div>
                {dates.map(day=>{
                  const isToday2=day===todayStr;
                  const dObj=new Date(day+"T12:00:00");
                  const dayLabel2=isToday2?"Today — "+dObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}):dObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
                  return(
                    <div key={day} style={{marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <div style={{fontWeight:800,fontSize:"0.8rem",color:isToday2?G:"#374151",textTransform:"uppercase",letterSpacing:1}}>{dayLabel2}</div>
                        {isToday2&&<span style={{background:G,color:"white",fontSize:"0.65rem",fontWeight:800,padding:"1px 8px",borderRadius:50}}>TODAY</span>}
                      </div>
                      {byDate[day].map((item,i)=>{
                        const rowStyle=item._isPast?{opacity:0.45,filter:"grayscale(40%)"}:{};
                        return(
                          <div key={i} style={rowStyle}>
                            {item._type==="portal"?LessonRow(item):item._type==="event"?(()=>{
                              const isTournament=(item.summary||"").toLowerCase().includes("tournament");
                              const isRental=(item.summary||"").toLowerCase().includes("rental");
                              const tagBg=isTournament?"#fef3c7":isRental?"#e0f2fe":"#f3f4f6";
                              const tagColor=isTournament?"#92400e":isRental?"#075985":"#374151";
                              const tagLabel=isTournament?"🏆 Tournament":isRental?"🎾 Rental":"📅 Event";
                              return(
                                <div style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:14}}>
                                  <div style={{background:tagBg,borderRadius:8,padding:"8px 14px",minWidth:80,textAlign:"center",flexShrink:0}}>
                                    <div style={{fontSize:"0.65rem",fontWeight:700,color:tagColor,textTransform:"uppercase",letterSpacing:0.5}}>{isTournament?"TOURN":"RENTAL"}</div>
                                  </div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontWeight:700,fontSize:"0.92rem",color:"#1a1a1a",marginBottom:2}}>{item.summary}</div>
                                    {(item.startTime||item.endTime)&&<div style={{fontSize:"0.8rem",color:"#6b7280"}}>{item.startTime}{item.endTime&&item.endTime!==item.startTime?" – "+item.endTime:""}</div>}
                                    {item.location&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>📍 {item.location}</div>}
                                  </div>
                                  <span style={{background:tagBg,color:tagColor,fontSize:"0.7rem",fontWeight:800,padding:"3px 10px",borderRadius:50,flexShrink:0}}>{tagLabel}</span>
                                </div>
                              );
                            })():CalRow(item,item._idx??i)}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {upcomingView==="month"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(<div key={d} style={{textAlign:"center",fontSize:"0.65rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",padding:"3px 0"}}>{d}</div>))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
                {monthGrid.map((day,i)=>{
                  if(!day)return<div key={"e"+i} style={{minHeight:72}}/>;
                  const isToday=day===todayStr;const isSel=day===selectedDay||monthDayPopover===day;
                  const isPastDay=day<todayStr;
                  const dayPortalItems=dayPortal(day);
                  const dayCalEvts=dayCalItems(day);
                  const allDayItems=[...dayPortalItems,...dayCalEvts];
                  const SHOW_MAX=2;
                  const overflow=allDayItems.length>SHOW_MAX?allDayItems.length-SHOW_MAX:0;
                  const shown=allDayItems.slice(0,SHOW_MAX);
                  return(
                    <div key={day} onClick={()=>{setSelectedDay(day);setMonthDayPopover(null);}} style={{background:isSel?G:isToday?"#e8f0ee":"white",color:isSel?"white":isPastDay?"#6b7280":isToday?G:"#374151",border:"1.5px solid "+(isSel?G:isToday?G:"#e5e7eb"),borderRadius:8,padding:"5px 4px 4px",cursor:"pointer",minHeight:72,transition:"all 0.15s",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
                      <div style={{fontSize:"0.82rem",fontWeight:isSel||isToday?800:500,textAlign:"center",marginBottom:3}}>{new Date(day+"T12:00:00").getDate()}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
                        {shown.map((item,ti)=>{
                          const isStanfordItem=item.isStanford||((item.summary||"").toLowerCase().includes("stanford"));
                          const isCal=!item.studentEmail;
                          const tagBg=isSel?"rgba(255,255,255,0.25)":isStanfordItem?"#ede9fe":isCal?"#d1fae5":"#e8f0ee";
                          const tagColor=isSel?"white":isStanfordItem?"#5b21b6":isCal?"#065f46":G;
                          const label=item.studentName||(item.summary||"").split(" ").slice(0,3).join(" ");
                          return(
                            <div key={ti} style={{background:tagBg,color:tagColor,borderRadius:4,padding:"1px 4px",fontSize:"0.6rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4}} title={item.studentName||item.summary}>{label}</div>
                          );
                        })}
                        {overflow>0&&(
                          <div onClick={(ev)=>{ev.stopPropagation();setSelectedDay(day);setMonthDayPopover(p=>p===day?null:day);}} style={{fontSize:"0.6rem",color:isSel?"rgba(255,255,255,0.8)":"#6b7280",fontWeight:700,textAlign:"center",marginTop:1,cursor:"pointer"}}>+{overflow} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Popover / selected day detail */}
              <div style={{fontWeight:700,color:"#374151",marginBottom:10,fontSize:"0.88rem",display:"flex",alignItems:"center",gap:8}}>
                {dayLabel(selectedDay)}
                <span style={{color:"#9ca3af",fontWeight:400,fontSize:"0.82rem"}}>— {merged.length} item{merged.length!==1?"s":""}</span>
                {monthDayPopover&&<button onClick={()=>setMonthDayPopover(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:"0.8rem"}}>✕ Close</button>}
              </div>
              {merged.length===0
                ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"28px",textAlign:"center",color:"#9ca3af"}}>No lessons on {fmtDateShort(selectedDay)}.</div>
                :merged.map((l,i)=>l._c?CalRow(l,i):LessonRow(l))
              }
            </div>
          )}
        </div>
        );
      })()}

      {tab==="finances"&&(
        <ErrorBoundary>
          <FinancesTab
            financeRange={financeRange}
            setFinanceRange={setFinanceRange}
            includeStanford={includeStanford}
            setIncludeStanford={setIncludeStanford}
            showNetStanford={showNetStanford}
            setShowNetStanford={setShowNetStanford}
            financeData={financeData}
            setFinanceData={setFinanceData}
            financeLoading={financeLoading}
            setFinanceLoading={setFinanceLoading}
            allLessons={allLessons}
            mockUsers={mockUsers}
            onUpdateLesson={onUpdateLesson}
          />
        </ErrorBoundary>
      )}

      {tab==="gear"&&<GearAdminTab/>}

      {tab==="database"&&<LessonLedgerTab mockUsers={mockUsers} setSelectedStudent={setSelectedStudent} setTab={setTab}/>}

      {tab==="traffic"&&<TrafficTab/>}
    </div>
  );
}

// ─── TRAFFIC TAB ─────────────────────────────────────────────────────────────
function TrafficTab(){
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const G="#1a3c34";

  useEffect(()=>{
    setLoading(true);
    fetch("/api/traffic").then(r=>r.json()).then(d=>{
      if(d.error)setError(d.error);
      else setData(d);
    }).catch(()=>setError("Failed to load traffic data.")).finally(()=>setLoading(false));
  },[]);

  if(loading)return<div style={{padding:40,textAlign:"center",color:"#9ca3af"}}>Loading traffic data…</div>;
  if(error)return<div style={{padding:40,textAlign:"center",color:"#dc2626"}}>{error}</div>;
  if(!data)return null;

  const{summary,daily,topPages,devices,topCountries,topReferrers,topEvents=[],totalEvents30d=0}=data;
  const totalDevices=devices.mobile+devices.desktop+devices.tablet||1;
  const maxDaily=Math.max(...daily.map(d=>d.views),1);

  const StatCard=({label,views,sessions})=>(
    <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"18px 20px",flex:1,minWidth:130}}>
      <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{label}</div>
      <div style={{fontSize:"2rem",fontWeight:900,color:G,lineHeight:1}}>{views.toLocaleString()}</div>
      <div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:4}}>{sessions.toLocaleString()} unique session{sessions!==1?"s":""}</div>
    </div>
  );

  return(
    <div>
      {/* Summary cards */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
        <StatCard label="Today" views={summary.today.views} sessions={summary.today.sessions}/>
        <StatCard label="Last 7 days" views={summary.week.views} sessions={summary.week.sessions}/>
        <StatCard label="Last 30 days" views={summary.month.views} sessions={summary.month.sessions}/>
        <StatCard label="All time" views={summary.allTime.views} sessions={summary.allTime.sessions}/>
      </div>

      {/* 30-day bar chart */}
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:"0.88rem",color:"#374151",marginBottom:16}}>Page Views — Last 30 Days</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
          {daily.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}} title={d.date+": "+d.views+" views"}>
              <div style={{width:"100%",background:d.views>0?G:"#f3f4f6",borderRadius:"3px 3px 0 0",height:Math.max(d.views/maxDaily*72,d.views>0?3:0)}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:"0.68rem",color:"#9ca3af"}}>
          <span>{daily[0]?.date?.slice(5)}</span>
          <span>{daily[daily.length-1]?.date?.slice(5)}</span>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:20}}>
        {/* Top pages */}
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px"}}>
          <div style={{fontWeight:700,fontSize:"0.88rem",color:"#374151",marginBottom:14}}>Top Pages (30 days)</div>
          {topPages.length===0?<div style={{color:"#9ca3af",fontSize:"0.82rem"}}>No data yet</div>:topPages.map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<topPages.length-1?"1px solid #f3f4f6":"none"}}>
              <span style={{fontSize:"0.82rem",color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"75%"}}>{p.page==="/"?"Home":p.page}</span>
              <span style={{fontWeight:700,fontSize:"0.82rem",color:G,flexShrink:0}}>{p.views.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Devices */}
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px"}}>
          <div style={{fontWeight:700,fontSize:"0.88rem",color:"#374151",marginBottom:14}}>Devices (30 days)</div>
          {[["📱 Mobile",devices.mobile,"#0ea5e9"],["🖥 Desktop",devices.desktop,G],["📟 Tablet",devices.tablet,"#f97316"]].map(([label,count,color])=>(
            <div key={label} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",marginBottom:4}}>
                <span style={{color:"#374151"}}>{label}</span>
                <span style={{fontWeight:700,color}}>{Math.round(count/totalDevices*100)}%</span>
              </div>
              <div style={{background:"#f3f4f6",borderRadius:99,height:8,overflow:"hidden"}}>
                <div style={{width:Math.round(count/totalDevices*100)+"%",height:"100%",background:color,borderRadius:99,transition:"width 0.6s"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Top referrers */}
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px"}}>
          <div style={{fontWeight:700,fontSize:"0.88rem",color:"#374151",marginBottom:14}}>Top Referrers (30 days)</div>
          {topReferrers.length===0?<div style={{color:"#9ca3af",fontSize:"0.82rem"}}>No referrer data yet</div>:topReferrers.map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<topReferrers.length-1?"1px solid #f3f4f6":"none"}}>
              <span style={{fontSize:"0.82rem",color:"#374151"}}>{r.referrer}</span>
              <span style={{fontWeight:700,fontSize:"0.82rem",color:G}}>{r.views.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Top countries */}
        {topCountries.length>0&&(
          <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px"}}>
            <div style={{fontWeight:700,fontSize:"0.88rem",color:"#374151",marginBottom:14}}>Top Countries (30 days)</div>
            {topCountries.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<topCountries.length-1?"1px solid #f3f4f6":"none"}}>
                <span style={{fontSize:"0.82rem",color:"#374151"}}>{c.country}</span>
                <span style={{fontWeight:700,fontSize:"0.82rem",color:G}}>{c.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click Events */}
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{fontWeight:700,fontSize:"0.88rem",color:"#374151"}}>Click Events (30 days)</div>
          {totalEvents30d>0&&<span style={{fontSize:"0.78rem",color:"#9ca3af"}}>{totalEvents30d.toLocaleString()} total clicks</span>}
        </div>
        {topEvents.length===0?(
          <div style={{color:"#9ca3af",fontSize:"0.82rem"}}>No click events recorded yet — data will appear here once visitors start interacting with the site.</div>
        ):(()=>{
          const maxCount=Math.max(...topEvents.map(e=>e.count),1);
          const eventLabels={
            gear_discount_shop_click:"Gear — Shop Discount Brand",
            gear_bag_item_click:"Gear — Shop Bag Item",
            hero_view_rates_click:"Homepage — View Rates",
            hero_get_in_touch_click:"Homepage — Get in Touch",
            nav_book_click:"Nav — Book a Lesson",
            nav_login_click:"Nav — Login",
            register_request_submitted:"Registration — Access Requested",
          };
          return topEvents.map((e,i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",marginBottom:4}}>
                <span style={{color:"#374151",fontWeight:600}}>{eventLabels[e.event]||e.event}</span>
                <span style={{fontWeight:700,color:G,flexShrink:0,marginLeft:8}}>{e.count.toLocaleString()}</span>
              </div>
              <div style={{background:"#f3f4f6",borderRadius:99,height:7,overflow:"hidden"}}>
                <div style={{width:Math.round(e.count/maxCount*100)+"%",height:"100%",background:G,borderRadius:99,transition:"width 0.6s"}}/>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Vercel dashboard link */}
      <div style={{background:"#f0faf5",border:"1.5px solid #bbf7d0",borderRadius:12,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontWeight:700,fontSize:"0.88rem",color:G}}>Vercel Analytics</div>
          <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:2}}>Full analytics including Web Vitals, performance, and more</div>
        </div>
        <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={{background:G,color:"white",padding:"8px 18px",borderRadius:50,fontSize:"0.82rem",fontWeight:700,textDecoration:"none"}}>Open Dashboard ↗</a>
      </div>
    </div>
  );
}

// ─── ALL LESSONS DATABASE TAB ────────────────────────────────────────────────
function LessonLedgerTab({mockUsers,setSelectedStudent,setTab}){
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("all");
  const [monthFilter,setMonthFilter]=useState("all");
  const [ledgerData,setLedgerData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);

  // Load on mount
  useEffect(()=>{
    setLoading(true);
    const start="2025-01-01";
    const future=new Date();future.setDate(future.getDate()+60);
    const end=future.toISOString().slice(0,10);
    adminFetch(`/api/earnings-calendar?start=${start}&end=${end}&includeStanford=true&includeFuture=true`)
      .then(r=>r.json())
      .then(d=>{setLedgerData(d);setLoading(false);})
      .catch(e=>{setError(e.message);setLoading(false);});
  },[]);

  const events=ledgerData?.events||[];

  // Build display name for each event
  const getNames=(e)=>{
    if(e.parsedNames&&e.parsedNames.length>0)return e.parsedNames.join(", ");
    if(e.attendees&&e.attendees.length>0){
      const names=e.attendees.map(a=>a.displayName||(mockUsers[a.email]?.name)||a.email.split("@")[0]).filter(Boolean);
      if(names.length>0)return names.join(", ");
    }
    return "";
  };

  // Month options from data
  const monthSet=new Set(events.map(e=>e.date.slice(0,7)));
  const months=[...monthSet].sort((a,b)=>b.localeCompare(a));

  // Type options
  const typeSet=new Set(events.map(e=>e.type));
  const types=[...typeSet].sort();

  // Filter
  const q=search.toLowerCase().trim();
  const filtered=events.filter(e=>{
    if(typeFilter!=="all"&&e.type!==typeFilter)return false;
    if(monthFilter!=="all"&&!e.date.startsWith(monthFilter))return false;
    if(!q)return true;
    const names=getNames(e).toLowerCase();
    const emails=(e.attendeeEmails||[]).join(" ").toLowerCase();
    return names.includes(q)||emails.includes(q)||e.date.includes(q)||(e.category||"").toLowerCase().includes(q)||(e.summary||"").toLowerCase().includes(q);
  });

  // Stats
  const totalEarnings=filtered.reduce((s,e)=>s+(e.earnings||0),0);
  const pastFiltered=filtered.filter(e=>new Date(e.date)<new Date());

  // Badge for event type
  const typeBadge=(e)=>{
    if(e.isStanford)return<span style={{background:"#8C1515",color:"white",padding:"2px 8px",borderRadius:50,fontSize:"0.65rem",fontWeight:700,flexShrink:0}}>Stanford</span>;
    if(e.isMenlo)return<span style={{background:G,color:"white",padding:"2px 8px",borderRadius:50,fontSize:"0.65rem",fontWeight:700,flexShrink:0}}>MCC</span>;
    return null;
  };

  const typeColors2={private:"#e8f0ee",semi:"#e0e7ff",group:"#fef3c7",clinic:"#fce7f3",pickup:"#f3f4f6",stanford_rec:"#fdf2f2",stanford_open:"#fdf2f2"};
  const typeTextColors2={private:G,semi:"#4338ca",group:"#92400e",clinic:"#9d174d",pickup:"#6b7280",stanford_rec:"#7f1d1d",stanford_open:"#7f1d1d"};

  const fmtMonth=m=>{const[y,mo]=m.split("-");return new Date(y,parseInt(mo)-1).toLocaleDateString("en-US",{month:"long",year:"numeric"});};

  if(loading)return<div style={{textAlign:"center",padding:"60px",color:"#9ca3af"}}>Loading lesson history…</div>;
  if(error)return<div style={{textAlign:"center",padding:"60px",color:"#dc2626"}}>Error: {error}</div>;

  return(
    <div>
      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by student, date, type…"
          style={{flex:1,minWidth:200,padding:"8px 14px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:"0.85rem",outline:"none"}}/>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          style={{padding:"8px 12px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:"0.82rem",outline:"none",background:"white"}}>
          <option value="all">All Types</option>
          {types.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1).replace("_"," ")}</option>)}
        </select>
        <select value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}
          style={{padding:"8px 12px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:"0.82rem",outline:"none",background:"white"}}>
          <option value="all">All Months</option>
          {months.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
        </select>
      </div>

      {/* Summary strip */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {[
          ["Lessons",pastFiltered.length],
          ["Earnings","$"+totalEarnings.toFixed(0)],
          ["Students",new Set(filtered.flatMap(e=>e.attendeeEmails||[])).size||"—"],
        ].map(([lbl,val])=>(
          <div key={lbl} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 18px",flex:1,minWidth:100,textAlign:"center"}}>
            <div style={{fontSize:"1.2rem",fontWeight:800,color:"#1a1a1a"}}>{val}</div>
            <div style={{fontSize:"0.7rem",color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{lbl}</div>
          </div>
        ))}
        <div style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 18px",flex:1,minWidth:100,textAlign:"center"}}>
          <div style={{fontSize:"0.72rem",color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Showing</div>
          <div style={{fontSize:"0.85rem",fontWeight:700,color:"#374151"}}>{filtered.length} lesson{filtered.length!==1?"s":""}</div>
        </div>
      </div>

      {/* Lesson list */}
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
        {filtered.length===0?(
          <div style={{padding:"40px",textAlign:"center",color:"#9ca3af"}}>No lessons match your filters.</div>
        ):(
          filtered.map((e,i)=>{
            const names=getNames(e);
            const isPast=new Date(e.date)<new Date();
            const rowBg=e.isStanford?"#fdf2f2":e.isMenlo?"#f0fdf4":"white";
            const dividerColor=rowBg==="white"?"#f3f4f6":"#e5e7eb";
            // Find linked student email
            const linkedEmail=(e.attendeeEmails||[]).find(em=>mockUsers[em]);
            return(
              <div key={e.gcalEventId||i} style={{background:rowBg,borderBottom:i<filtered.length-1?"1px solid "+dividerColor:"none",padding:"12px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    {/* Date + time */}
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:"0.88rem",color:"#1a1a1a"}}>{fmtDateShort(e.date)}</span>
                      {e.startTime&&<span style={{fontSize:"0.8rem",color:"#6b7280"}}>{e.startTime}{e.endTime?" – "+e.endTime:""}</span>}
                      <span style={{background:typeColors2[e.type]||"#f3f4f6",color:typeTextColors2[e.type]||"#6b7280",padding:"1px 8px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>{e.category||e.type}</span>
                      {typeBadge(e)}
                      {!isPast&&<span style={{background:"#fffbea",color:"#92400e",padding:"1px 8px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>Upcoming</span>}
                    </div>
                    {/* Student names */}
                    {names&&<div style={{fontSize:"0.85rem",fontWeight:600,color:"#374151",marginBottom:2}}>{names}</div>}
                    {/* Location + duration */}
                    <div style={{fontSize:"0.78rem",color:"#9ca3af"}}>
                      {e.hours&&<span>{Math.round(e.hours*60)} min</span>}
                      {e.location&&<span>{e.hours?" · ":""}{e.location}</span>}
                    </div>
                  </div>
                  {/* Earnings + actions */}
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    {e.earnings>0&&(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:800,fontSize:"0.95rem",color:G}}>${e.earnings.toFixed(0)}</div>
                        {e.grossEarnings&&e.grossEarnings!==e.earnings&&<div style={{fontSize:"0.68rem",color:"#9ca3af"}}>${e.grossEarnings.toFixed(0)} gross</div>}
                      </div>
                    )}
                    {linkedEmail&&(
                      <button onClick={()=>{setSelectedStudent(linkedEmail);setTab("students");}}
                        style={{background:"#e8f0ee",color:G,border:"none",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.72rem",fontWeight:600,whiteSpace:"nowrap"}}>
                        View Student
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── GEAR ADMIN TAB ───────────────────────────────────────────────────────────
function PaddleHistoryEditor({history,setHistory,paddleName,paddleLink,paddleStart,bagName,bagDetail,bagLink,accentColor}){
  const[editIdx,setEditIdx]=useState(null);
  const[editName,setEditName]=useState("");
  const[editFrom,setEditFrom]=useState("");
  const[editTo,setEditTo]=useState("");

  const parseMonth=s=>{try{const[m,y]=(s||"").split(" ");return new Date(y,["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m));}catch{return new Date(0);}};
  const sorted=[...history].sort((a,b)=>{if(a.current)return -1;if(b.current)return 1;return parseMonth(b.from)-parseMonth(a.from);});

  const persist=async(updated)=>{
    await fetch("/api/gear",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      paddle_name:paddleName,paddle_link:paddleLink,paddle_start:paddleStart,
      bag_name:bagName,bag_detail:bagDetail,bag_link:bagLink,paddle_history:updated,accent_color:accentColor,
    })});
  };

  const saveEdit=async()=>{
    const target=sorted[editIdx];
    const updated=history.map(p=>p===target?{...p,name:editName,from:editFrom,to:editTo}:p);
    setHistory(updated);
    await persist(updated);
    setEditIdx(null);
  };

  const deleteEntry=async(target)=>{
    if(!window.confirm("Delete this paddle from history?"))return;
    const updated=history.filter(p=>p!==target);
    setHistory(updated);
    await persist(updated);
  };

  return(
    <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"22px 24px"}}>
      <div style={{fontWeight:700,fontSize:"0.92rem",color:"#374151",marginBottom:4}}>Paddle History</div>
      <p style={{fontSize:"0.78rem",color:"#9ca3af",marginBottom:16}}>Current paddle shown first. Click Edit to update any entry.</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {sorted.map((p,i)=>(
          <div key={i} style={{background:p.current?"#f0faf5":"#f9f9f6",borderRadius:8,border:"1.5px solid "+(p.current?G:"#e5e7eb"),padding:"10px 14px"}}>
            {editIdx===i?(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Paddle name" style={{border:"1.5px solid #d1d5db",borderRadius:6,padding:"6px 10px",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}}/>
                <div style={{display:"flex",gap:8}}>
                  <input value={editFrom} onChange={e=>setEditFrom(e.target.value)} placeholder="From (e.g. Jan 2024)" style={{flex:1,border:"1.5px solid #d1d5db",borderRadius:6,padding:"6px 10px",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}}/>
                  <input value={editTo} onChange={e=>setEditTo(e.target.value)} placeholder="To (e.g. Mar 2026 or Present)" style={{flex:1,border:"1.5px solid #d1d5db",borderRadius:6,padding:"6px 10px",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveEdit} style={{background:G,color:"white",border:"none",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>Save</button>
                  <button onClick={()=>setEditIdx(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:600}}>Cancel</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.9rem",color:p.current?G:"#374151"}}>{p.name}</div>
                  <div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:2}}>{p.from}{p.to?" — "+p.to:p.current?" — Present":""}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {p.current&&<span style={{background:G,color:"white",fontSize:"0.65rem",fontWeight:800,padding:"3px 9px",borderRadius:50,textTransform:"uppercase"}}>Current</span>}
                  <button onClick={()=>{setEditIdx(i);setEditName(p.name);setEditFrom(p.from);setEditTo(p.to||"");}} style={{background:"white",border:"1.5px solid #e5e7eb",color:"#374151",padding:"3px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.72rem",fontWeight:600}}>Edit</button>
                  {!p.current&&<button onClick={()=>deleteEntry(p)} style={{background:"white",border:"1.5px solid #fca5a5",color:"#dc2626",padding:"3px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.72rem",fontWeight:600}}>Delete</button>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GearAdminTab(){
  const now=new Date();
  const fmtMonth=d=>d.toLocaleString("en-US",{month:"short",year:"numeric"});

  // Load current gear from API
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");

  // Paddle fields
  const[paddleName,setPaddleName]=useState("");
  const[paddleLink,setPaddleLink]=useState("");
  const[paddleStart,setPaddleStart]=useState("");

  // Bag fields
  const[bagName,setBagName]=useState("");
  const[bagDetail,setBagDetail]=useState("");
  const[bagLink,setBagLink]=useState("");

  // History (local copy for preview/editing)
  const[history,setHistory]=useState(PADDLE_HISTORY);
  const[accentColor,setAccentColor]=useState("#f97316");

  useEffect(()=>{
    fetch("/api/gear").then(r=>r.json()).then(d=>{
      if(d.gear){
        const g=d.gear;
        setPaddleName(g.paddle_name||BAG_ITEMS[0].name);
        setPaddleLink(g.paddle_link||BAG_ITEMS[0].link);
        setPaddleStart(g.paddle_start||"Mar 2026");
        setBagName(g.bag_name||BAG_ITEMS[1].name);
        setBagDetail(g.bag_detail||BAG_ITEMS[1].detail);
        setBagLink(g.bag_link||BAG_ITEMS[1].link);
        setHistory(g.paddle_history||PADDLE_HISTORY);
        setAccentColor(g.accent_color||"#f97316");
      }else{
        // No DB data yet — prefill from hardcoded defaults
        setPaddleName(BAG_ITEMS[0].name);
        setPaddleLink(BAG_ITEMS[0].link);
        const curr=PADDLE_HISTORY.find(p=>p.current);
        setPaddleStart(curr?.from||fmtMonth(now));
        setBagName(BAG_ITEMS[1].name);
        setBagDetail(BAG_ITEMS[1].detail);
        setBagLink(BAG_ITEMS[1].link);
        setHistory(PADDLE_HISTORY);
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const handleSave=async()=>{
    if(!paddleName){setError("Paddle name is required.");return;}
    if(!paddleStart){setError("Paddle start date is required.");return;}
    setSaving(true);setError("");

    // Build updated history: retire old current, add/update new current
    const prev=history.find(p=>p.current);
    let newHistory=[...history];
    if(prev&&prev.name!==paddleName){
      // Retire the old current paddle
      newHistory=newHistory.map(p=>p.current
        ?{...p,to:paddleStart,current:false}
        :p
      );
      // Add the new paddle
      newHistory.push({name:paddleName,from:paddleStart,to:"Present",current:true});
    }else if(!prev){
      newHistory.push({name:paddleName,from:paddleStart,to:"Present",current:true});
    }else{
      // Same paddle — just update name/link/start in place
      newHistory=newHistory.map(p=>p.current?{...p,name:paddleName,from:paddleStart}:p);
    }

    try{
      const res=await fetch("/api/gear",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          paddle_name:paddleName,
          paddle_link:paddleLink,
          paddle_start:paddleStart,
          bag_name:bagName,
          bag_detail:bagDetail,
          bag_link:bagLink,
          paddle_history:newHistory,
          accent_color:accentColor,
        }),
      });
      const data=await res.json();
      if(data.success){
        setHistory(newHistory);
        setSaved(true);
        setTimeout(()=>setSaved(false),3000);
      }else{setError(data.error||"Save failed.");}
    }catch(e){setError("Save failed. Please try again.");}
    setSaving(false);
  };

  const lbl={fontSize:"0.72rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,display:"block"};
  const field={width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

  if(loading)return<div style={{textAlign:"center",padding:"60px 0",color:"#9ca3af"}}>Loading gear settings…</div>;

  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <h3 style={{fontWeight:800,fontSize:"1.15rem",color:"#1a1a1a",marginBottom:4}}>Gear Settings</h3>
      <p style={{color:"#6b7280",fontSize:"0.88rem",marginBottom:28}}>Changes save to the database and go live on the site immediately.</p>

      {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.85rem",marginBottom:16}}>{error}</div>}
      {saved&&<div style={{background:"#e8f0ee",border:"1.5px solid "+G,borderRadius:8,padding:"10px 14px",color:G,fontSize:"0.85rem",fontWeight:600,marginBottom:16}}>✓ Saved! Site updated.</div>}

      {/* Paddle */}
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"22px 24px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:36,height:36,background:"#f97316",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><PaddleIcon size={20}/></div>
          <div style={{fontWeight:800,fontSize:"1rem",color:"#1a1a1a"}}>Current Paddle</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <label style={lbl}>Paddle Name</label>
            <input value={paddleName} onChange={e=>setPaddleName(e.target.value)} style={field} placeholder="e.g. CRBN² Barrage"/>
          </div>
          <div>
            <label style={lbl}>Using Since</label>
            <input value={paddleStart} onChange={e=>setPaddleStart(e.target.value)} style={field} placeholder="e.g. Apr 2026"/>
          </div>
        </div>
        <div>
          <label style={lbl}>Shop Link</label>
          <input value={paddleLink} onChange={e=>setPaddleLink(e.target.value)} style={field} placeholder="https://…"/>
        </div>
      </div>

      {/* Bag */}
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"22px 24px",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:36,height:36,background:"#f97316",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><BagIcon size={20}/></div>
          <div style={{fontWeight:800,fontSize:"1rem",color:"#1a1a1a"}}>Current Bag</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <label style={lbl}>Bag Name</label>
            <input value={bagName} onChange={e=>setBagName(e.target.value)} style={field} placeholder="e.g. CRBN Tour Bag"/>
          </div>
          <div>
            <label style={lbl}>Detail / Colorway</label>
            <input value={bagDetail} onChange={e=>setBagDetail(e.target.value)} style={field} placeholder="e.g. Pear Colorway"/>
          </div>
        </div>
        <div>
          <label style={lbl}>Shop Link</label>
          <input value={bagLink} onChange={e=>setBagLink(e.target.value)} style={field} placeholder="https://…"/>
        </div>
      </div>

      {/* Accent Color */}
      <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"22px 24px",marginBottom:24}}>
        <div style={{fontWeight:800,fontSize:"1rem",color:"#1a1a1a",marginBottom:4}}>Highlight Color</div>
        <p style={{fontSize:"0.8rem",color:"#6b7280",marginBottom:16}}>Used for the Current badge, icons, and glow on the gear page.</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",marginBottom:14}}>
          {["#f97316","#10b981","#3b82f6","#8C1515","#ec4899","#ef4444","#eab308","#1a3c34"].map(c=>(
            <button key={c} onClick={()=>setAccentColor(c)} style={{width:32,height:32,borderRadius:"50%",background:c,border:accentColor===c?"3px solid #1a1a1a":"3px solid transparent",outline:accentColor===c?"2px solid "+c:"none",outlineOffset:2,cursor:"pointer",padding:0,transition:"transform 0.1s",transform:accentColor===c?"scale(1.15)":"scale(1)"}}/>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <label style={{fontSize:"0.72rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8}}>Custom</label>
          <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)} style={{width:40,height:32,border:"1.5px solid #e5e7eb",borderRadius:6,cursor:"pointer",padding:2,background:"white"}}/>
          <input type="text" value={accentColor} onChange={e=>{if(/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))setAccentColor(e.target.value);}} style={{width:100,border:"1.5px solid #e5e7eb",borderRadius:6,padding:"6px 10px",fontSize:"0.85rem",fontFamily:"monospace",outline:"none"}}/>
          <div style={{width:36,height:36,borderRadius:8,background:accentColor,flexShrink:0}}/>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{width:"100%",background:saving?"#9ca3af":G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontSize:"0.95rem",marginBottom:32}}>
        {saving?"Saving…":"Save Gear Settings"}
      </button>

      {/* Paddle History — editable */}
      <PaddleHistoryEditor
        history={history}
        setHistory={setHistory}
        paddleName={paddleName}
        paddleLink={paddleLink}
        paddleStart={paddleStart}
        bagName={bagName}
        bagDetail={bagDetail}
        bagLink={bagLink}
        accentColor={accentColor}
      />
    </div>
  );
}

// ─── PARTNER PORTAL ──────────────────────────────────────────────────────────
function PartnerLoginPage({onLogin}){
  const G="#1a3c34";
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const handleGoogle=()=>{
    setLoading(true);setError("");
    const popup=window.open(
      "https://accounts.google.com/o/oauth2/v2/auth?"+new URLSearchParams({
        client_id:GOOGLE_CLIENT_ID,
        redirect_uri:window.location.origin,
        response_type:"token",
        scope:"email profile",
        prompt:"select_account",
      }).toString(),
      "partnerlogin","width=520,height=650,scrollbars=yes,resizable=yes"
    );
    const t=setInterval(async()=>{
      try{
        if(popup.closed){clearInterval(t);setLoading(false);return;}
        const url=popup.location.href;
        if(url.includes(window.location.origin)&&url.includes("access_token")){
          clearInterval(t);popup.close();
          const token=new URLSearchParams(url.split("#")[1]).get("access_token");
          const info=await(await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+token}})).json();
          const email=(info.email||"").toLowerCase();
          if(PARTNER_EMAILS.includes(email)){onLogin(email);}
          else{setLoading(false);setError("Access denied. This portal is invite-only.");}
        }
      }catch(e){}
    },500);
  };
  return(
    <div style={{minHeight:"100vh",background:"#f4f9f6",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Inter',sans-serif"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src="/DMPBlogo.png" alt="DM Pickleball" style={{height:36,marginBottom:16,objectFit:"contain"}}/>
          <h2 style={{fontWeight:900,color:"#1a1a1a",marginBottom:4}}>Finance Portal</h2>
          <p style={{color:"#6b7280",fontSize:"0.85rem"}}>Authorized access only</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        <button onClick={handleGoogle} disabled={loading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:loading?"#f3f4f6":"white",color:"#374151",border:"1.5px solid #d1d5db",padding:"12px 16px",borderRadius:50,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontSize:"0.95rem"}}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading?"Signing in…":"Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
function PartnerPortal({preLoggedIn=false}){
  const G="#1a3c34";
  const[loggedIn,setLoggedIn]=useState(preLoggedIn);
  const[partnerEmail,setPartnerEmail]=useState("");
  const[financeData,setFinanceData]=useState(null);
  const[financeLoading,setFinanceLoading]=useState(false);
  const[financeRange,setFinanceRange]=useState(null);
  const[includeStanford,setIncludeStanford]=useState(false);
  const[showNetStanford,setShowNetStanford]=useState(true);
  if(!loggedIn)return<PartnerLoginPage onLogin={e=>{setLoggedIn(true);setPartnerEmail(e);}}/>;
  return(
    <div style={{fontFamily:"'Inter',sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/DMPBlogo-white.png" alt="DMPB" style={{height:34,width:"auto",display:"block"}}/>
          <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.6)",fontWeight:400}}>· Finances</span>
        </div>
        <button onClick={()=>setLoggedIn(false)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.4)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem"}}>Log out</button>
      </nav>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        <div style={{fontWeight:900,fontSize:"1.7rem",color:"#1a1a1a",marginBottom:28}}>Finance Overview</div>
        <FinancesTab
          financeRange={financeRange} setFinanceRange={setFinanceRange}
          includeStanford={includeStanford} setIncludeStanford={setIncludeStanford}
          showNetStanford={showNetStanford} setShowNetStanford={setShowNetStanford}
          financeData={financeData} setFinanceData={setFinanceData}
          financeLoading={financeLoading} setFinanceLoading={setFinanceLoading}
          allLessons={{}} mockUsers={{}} onUpdateLesson={()=>{}}
          readOnly={true}
        />
      </div>
    </div>
  );
}

// ─── Persistent admin session helpers ─────────────────────────────────────────
const ADMIN_SESSION_KEY="dm_admin_session";
const SESSION_DAYS=30;
function saveAdminSession(email,hmacToken){
  try{
    localStorage.setItem(ADMIN_SESSION_KEY,JSON.stringify({email,expiresAt:Date.now()+SESSION_DAYS*24*60*60*1000}));
    if(hmacToken)localStorage.setItem('dm_admin_token_store',hmacToken);
  }catch{}
}
function loadAdminSession(){
  try{
    const raw=localStorage.getItem(ADMIN_SESSION_KEY);
    if(!raw)return null;
    const s=JSON.parse(raw);
    if(!s||!s.email||!s.expiresAt||Date.now()>s.expiresAt){localStorage.removeItem(ADMIN_SESSION_KEY);localStorage.removeItem('dm_admin_token_store');return null;}
    // Restore HMAC token to sessionStorage so adminFetch works after page refresh
    const stored=localStorage.getItem('dm_admin_token_store');
    if(stored)sessionStorage.setItem('dm_admin_token',stored);
    return s.email;
  }catch{return null;}
}
function clearAdminSession(){try{localStorage.removeItem(ADMIN_SESSION_KEY);localStorage.removeItem('dm_admin_token_store');sessionStorage.removeItem('dm_admin_token');}catch{}}

// ─── URL routing map ──────────────────────────────────────────────────────────
const PAGE_TO_URL={
  home:"/",
  pricing:"/rates",
  gear:"/gear",
  resources:"/resources",
  contact:"/contact",
  login:"/login",
  dashboard:"/dashboard",
  booking:"/book",
  account:"/account",
  adminlogin:"/admin",
  admin:"/admin",
  partner:"/partner",
};
const URL_TO_PAGE=Object.fromEntries(Object.entries(PAGE_TO_URL).map(([p,u])=>[u,p]));
// Dedupe reversed map (admin/adminlogin both → /admin, pick adminlogin as default)
URL_TO_PAGE["/admin"]="adminlogin";

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const pathname=window.location.pathname;
  const isAdminRoute=pathname==="/admin"||pathname==="/partner";
  // Restore session from localStorage on first load
  const savedEmail=isAdminRoute?loadAdminSession():null;
  const restoredAdmin=savedEmail===ADMIN_EMAIL;
  const restoredPartner=savedEmail&&PARTNER_EMAILS.includes(savedEmail)&&savedEmail!==ADMIN_EMAIL;
  const[page,setPage]=useState(()=>{
    if(isAdminRoute&&(restoredAdmin||restoredPartner))return"admin";
    if(isAdminRoute)return"adminlogin";
    // Initialise from the current URL so direct links work
    const fromUrl=URL_TO_PAGE[pathname];
    return fromUrl||"home";
  });
  const[user,setUser]=useState(null);
  const[isAdmin,setIsAdmin]=useState(restoredAdmin);
  const[isPartner,setIsPartner]=useState(restoredPartner);
  const[allLessons,setAllLessons]=useState({});
  const[pendingStudents,setPendingStudents]=useState([]);
  const[mockUsersState,setMockUsersState]=useState({});
  const[removedStudents,setRemovedStudents]=useState([]);
  const[dbLoaded,setDbLoaded]=useState(false);
  const[locations,setLocations]=useState([]);
  const[stanfordEnabled,setStanfordEnabled]=useState(()=>{try{return localStorage.getItem("stanfordEnabled")!=="false";}catch{return true;}});

  useEffect(()=>{window.scrollTo(0,0);},[page]);

  // ── URL routing: keep browser URL in sync with page state ──────────────────
  // On first load, stamp the current page into the history entry so the back
  // button returns here instead of skipping straight to the previous website.
  useEffect(()=>{
    if(isAdminRoute)return;
    window.history.replaceState({page},document.title,window.location.pathname);
  },[]);
  useEffect(()=>{
    if(isAdminRoute)return; // admin routes manage their own URLs
    const url=PAGE_TO_URL[page]||"/";
    if(window.location.pathname!==url){
      window.history.pushState({page},`DM Pickleball — ${page}`,url);
    }
  },[page]);

  // Handle browser back/forward buttons
  useEffect(()=>{
    const onPop=(e)=>{
      const p=e.state?.page||URL_TO_PAGE[window.location.pathname]||"home";
      setPage(p);
    };
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  // ── Page view tracking — fires on every navigation, skips admin pages ──
  useEffect(()=>{
    try{
      const url=window.location.pathname||"/";
      // Don't track admin/partner portal visits (those are just you)
      if(url==="/admin"||url==="/partner")return;
      let sid=sessionStorage.getItem("_dm_sid");
      if(!sid){sid=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem("_dm_sid",sid);}
      fetch("/api/traffic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page:url,referrer:document.referrer||null,sessionId:sid})}).catch(()=>{});
    }catch{}
  },[page]);

  useEffect(()=>{
    const loadFromSupabase=async()=>{
      try{
        const [pr,lr,sr,locr,xr]=await Promise.all([
          adminFetch("/api/students?action=pending").then(r=>r.json()).catch(()=>({})),
          adminFetch("/api/lessons?action=list").then(r=>r.json()).catch(()=>({})),
          adminFetch("/api/students?action=list").then(r=>r.json()).catch(()=>({})),
          adminFetch("/api/locations?action=list").then(r=>r.json()).catch(()=>({})),
          adminFetch("/api/students?action=list-deleted").then(r=>r.json()).catch(()=>({})),
        ]);
        if(pr.requests){
          setPendingStudents(pr.requests.map(r=>({
            id:r.id,name:r.name,email:r.email,
            firstName:r.first_name||"",lastName:r.last_name||"",
            commEmail:r.comm_email||"",
            phone:r.phone,homeCourt:r.home_court,
            skillLevel:r.skill_level||"",duprRating:r.dupr_rating||"",duprId:r.dupr_id||"",
            goals:r.goals||"",referralSource:r.referral_source||"",
            requestedAt:new Date(r.requested_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
          })));
        }
        if(sr.students){
          const users={};
          const lessonsByStudent={};
          sr.students.forEach(s=>{
            const sEmail=(s.email||"").toLowerCase();
            users[sEmail]={
              name:s.name||s.email,
              firstName:s.first_name||"",
              lastName:s.last_name||"",
              commEmail:s.comm_email||"",
              skillLevel:s.skill_level||"",
              duprRating:s.dupr_rating||"",
              duprDoublesRating:s.dupr_doubles_rating||"",
              duprId:s.dupr_id||"",
              duprPlayerName:s.dupr_player_name||"",
              memberType:s.member_type||"public",
              approved:s.approved,
              blocked:s.blocked,
              grandfathered:!!(s.grandfathered),
              phone:s.phone||"",
              city:s.city||"",
              homeCourt:s.home_court||"",
              picture:s.picture||"",
              provisional:!!(s.provisional),
              source:s.source||"self_registered",
              calendarName:s.calendar_name||"",
            };
            lessonsByStudent[sEmail]=[];
          });
          if(lr.lessons){
            lr.lessons.forEach(l=>{
              const lEmail=(l.student_email||"").toLowerCase();
              if(!lessonsByStudent[lEmail])lessonsByStudent[lEmail]=[];
              lessonsByStudent[lEmail].push({
                id:l.id,date:l.date,time:l.time,type:l.type,
                duration:l.duration,status:l.status,focus:l.focus||"",
                notes:l.notes||"",photos:[],videos:[],
                gcalEventId:l.gcal_event_id||"",
                ticketId:l.ticket_id||"",
                partnerEmail:l.partner_email||"",
                groupEmails:l.group_emails||[],
                members:l.members||[],
                createdAt:l.created_at||"",
                customPrice:l.custom_price??null,
                cancelReason:l.cancel_reason||null
              });
            });
          }
          // ── GCal cross-reference ─────────────────────────────────────────────
          // Collect gcalEventIds from upcoming portal lessons (status not already resolved)
          const RESOLVED=new Set(["completed","cancelled","late_cancel","cancelled_forgiven","weather_cancel","no_show","archived"]);
          const gcalIds=[];
          Object.values(lessonsByStudent).forEach(arr=>arr.forEach(l=>{if(l.gcalEventId&&!RESOLVED.has(l.status))gcalIds.push(l.gcalEventId);}));
          if(gcalIds.length>0){
            const vr=await fetch("/api/calendar-events?action=verify&ids="+gcalIds.join(",")).then(r=>r.json()).catch(()=>({found:gcalIds}));
            const foundSet=new Set(vr.found||gcalIds);
            Object.keys(lessonsByStudent).forEach(email=>{
              lessonsByStudent[email]=lessonsByStudent[email].map(l=>{
                if(l.gcalEventId&&!foundSet.has(l.gcalEventId)&&!RESOLVED.has(l.status)){
                  // GCal event is gone — auto-cancel and silently sync Supabase
                  fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id,updates:{status:"cancelled",cancelled_by:"gcal_sync",cancelled_at:new Date().toISOString()}})}).catch(()=>{});
                  return{...l,status:"cancelled",cancelledByGcal:true};
                }
                return l;
              });
            });
          }
          // ────────────────────────────────────────────────────────────────────
          setAllLessons(lessonsByStudent);
          setMockUsersState(users);
        }
        if(locr.locations)setLocations(locr.locations);
        if(xr.students)setRemovedStudents(xr.students.map(s=>({email:s.email,name:s.name||s.email,first_name:s.first_name||"",last_name:s.last_name||"",firstName:s.first_name||"",lastName:s.last_name||"",memberType:s.member_type||"public",phone:s.phone||"",city:s.city||"",homeCourt:s.home_court||"",picture:s.picture||"",deleted_at:s.deleted_at||"",blocked:!!s.blocked,isDenied:!!s.is_denied,deniedAt:s.denied_at||""})));
      }catch(e){console.error("Supabase load error:",e);}
      setDbLoaded(true);
    };
    loadFromSupabase();
  },[]);
  const userLessons=user?allLessons[user.email]||[]:[]; const updateUser=(updatedUser)=>setUser(updatedUser);
  // Auto-sync DUPR rating in background on student login (if they have a DUPR ID)
  useEffect(()=>{
    if(!user?.duprId||!user?.email)return;
    fetch("/api/students?action=dupr-lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({duprId:user.duprId,email:user.email})})
      .then(r=>r.json())
      .then(data=>{
        if(data.error||(!data.rating&&data.doublesRating==null))return;
        const updates={};
        if(data.rating!=null)updates.duprRating=parseFloat(data.rating).toFixed(2);
        if(data.doublesRating!=null)updates.duprDoublesRating=parseFloat(data.doublesRating).toFixed(2);
        if(Object.keys(updates).length>0)setUser(prev=>prev?{...prev,...updates}:prev);
      }).catch(()=>{});
  },[user?.email, user?.duprId]);
  const cancelLesson=async(id)=>{
    const lesson=userLessons.find(l=>l.id===id);
    // Optimistic update immediately so UI reflects change right away
    const cancelNow=new Date();const lDeadline=new Date(getLessonStart(lesson.date,lesson.time).getTime()-12*60*60*1000);const withinGrace=lesson.createdAt&&((cancelNow-new Date(lesson.createdAt))/60000)<15;const cancelStatus=(!withinGrace&&cancelNow>lDeadline)?"late_cancel":"cancelled";
    setAllLessons(prev=>({...prev,[user.email]:prev[user.email].map(l=>l.id===id?{...l,status:cancelStatus}:l)}));
    // GCal removal — await this so calendar is cleaned up before modal closes
    if(lesson?.gcalEventId){
      try{await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:"cancel",eventId:lesson.gcalEventId,mode:"delete"})});}
      catch(e){console.error('Calendar cancel failed:',e);}
    }
    // Emails and DB update fire in background — don't block the UI
    const sendEmail3=(to,subject,text,fromAlias)=>{const html=makeCancelEmailHtml(text);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,...(fromAlias?{fromAlias}:{})})}).catch(()=>{});};
    const cancelLocation=user.memberType==="menlo"?"Menlo Circus Club, 190 Park Ln, Atherton":"Andrew Spinas Park, 3003 Bay Rd, Redwood City";
    const cancelDetails=(lesson.ticketId?"\nRef: "+lesson.ticketId:"")+"\nDate: "+fmtDate(lesson.date)+"\nTime: "+lesson.time+"\nType: "+lesson.type+(lesson.duration?" · "+lesson.duration:"")+"\nLocation: "+cancelLocation+(lesson.focus?"\nFocus: "+lesson.focus:"")+(lesson.members&&lesson.members.length>0?"\nWith: "+lesson.members.join(", "):"");
    const cancelMsg="Your pickleball lesson has been cancelled.\n"+cancelDetails+"\n\nIf you have any questions, reply to this email.\n\nCoach David";
    const partnerMsg="A pickleball lesson you were part of has been cancelled.\n"+cancelDetails+"\n\nIf you have any questions, reply to this email.\n\nCoach David";
    const adminCancelMsg=user.name+" cancelled their lesson.\n"+cancelDetails+"\nStudent email: "+user.email;
    const cancelSubject="Lesson Cancelled: "+lesson.type+" — "+fmtDateShort(lesson.date);
    sendEmail3(user.email,cancelSubject,"Hi "+user.name+",\n\n"+cancelMsg,"noreply@dmpickleball.com");
    sendEmail3("david@dmpickleball.com","Cancelled: "+user.name+" — "+lesson.type+" "+fmtDateShort(lesson.date),adminCancelMsg,"noreply@dmpickleball.com");
    if(lesson.partnerEmail){sendEmail3(lesson.partnerEmail,cancelSubject,"Hi,\n\n"+partnerMsg,"noreply@dmpickleball.com");}
    if(lesson.groupEmails){for(const email of lesson.groupEmails){if(email){sendEmail3(email,cancelSubject,"Hi,\n\n"+partnerMsg,"noreply@dmpickleball.com");}}}
    fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:id,updates:{status:cancelStatus,cancelled_by:"student",cancelled_at:cancelNow.toISOString()}})}).catch(e=>console.error("Update lesson status error:",e));
  };
  // Remove a lesson from state (optimistic) — called from AdminPanel delete buttons
  const deleteLesson=(email,id)=>{
    // Also evict the calendar item so it doesn't ghost as a "calendar lesson"
    const gcalId=((allLessons[email]||[]).find(x=>x.id===id)||{}).gcalEventId;
    if(gcalId)setCalendarItems(prev=>prev.filter(c=>c.gcalEventId!==gcalId));
    setAllLessons(prev=>({...prev,[email]:(prev[email]||[]).filter(x=>x.id!==id)}));
  };
  const adminCancel=async(email,id)=>{
    const lesson=(allLessons[email]||[]).find(l=>l.id===id);
    if(lesson?.gcalEventId){
      try{
        await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",eventId:lesson.gcalEventId,mode:"delete"})});
      }catch(e){console.error("Admin GCal cancel failed:",e);}
    }
    const cancelNow2=new Date();const lDeadline2=new Date(getLessonStart(lesson.date,lesson.time).getTime()-12*60*60*1000);const withinGrace2=lesson.createdAt&&((cancelNow2-new Date(lesson.createdAt))/60000)<15;const cancelStatus2=(!withinGrace2&&cancelNow2>lDeadline2)?"late_cancel":"cancelled";
    setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,status:cancelStatus2}:l)}));
    try{await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:id,updates:{status:cancelStatus2,cancelled_by:"admin",cancelled_at:cancelNow2.toISOString()}})});}catch(e){console.error("Update lesson status error:",e);}
    // Send cancellation emails
    const sendCancelEmail=(to,subject,text)=>{const html=makeCancelEmailHtml(text);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});};
    const studentName=mockUsersState[email]?.name||email;
    const adminCancelLocation=mockUsersState[email]?.memberType==="menlo"?"Menlo Circus Club, 190 Park Ln, Atherton":"Andrew Spinas Park, 3003 Bay Rd, Redwood City";
    const adminCancelDetails=(lesson.ticketId?"\nRef: "+lesson.ticketId:"")+"\nDate: "+fmtDate(lesson.date)+"\nTime: "+lesson.time+"\nType: "+lesson.type+(lesson.duration?" · "+lesson.duration:"")+"\nLocation: "+adminCancelLocation+(lesson.focus?"\nFocus: "+lesson.focus:"")+(lesson.members&&lesson.members.length>0?"\nWith: "+lesson.members.join(", "):"");
    const cancelMsg="Your pickleball lesson has been cancelled by Coach David.\n"+adminCancelDetails+"\n\nIf you have any questions, reply to this email.\n\nCoach David";
    const partnerMsg="A pickleball lesson you were part of has been cancelled.\n"+adminCancelDetails+"\n\nIf you have any questions, reply to this email.\n\nCoach David";
    const adminNotifyMsg="You cancelled "+studentName+"'s lesson.\n"+adminCancelDetails+"\nStudent email: "+email;
    const adminCancelSubject="Lesson Cancelled: "+lesson.type+" — "+fmtDateShort(lesson.date);
    sendCancelEmail(email,adminCancelSubject,"Hi "+studentName+",\n\n"+cancelMsg);
    sendCancelEmail("david@dmpickleball.com","Cancelled: "+studentName+" — "+lesson.type+" "+fmtDateShort(lesson.date),adminNotifyMsg);
    if(lesson.partnerEmail)sendCancelEmail(lesson.partnerEmail,adminCancelSubject,"Hi,\n\n"+partnerMsg);
    if(lesson.groupEmails){for(const em of lesson.groupEmails){if(em)sendCancelEmail(em,adminCancelSubject,"Hi,\n\n"+partnerMsg);}}
  };
  const addLesson=async lesson=>{
    try{
      const r=await fetch("/api/lessons?action=save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson:{...lesson,studentEmail:user.email}})});
      const data=await r.json();
      const finalLesson=data.id?{...lesson,id:data.id}:lesson;
      setAllLessons(prev=>({...prev,[user.email]:[...(prev[user.email]||[]),finalLesson]}));
    }catch(e){
      console.error("Save lesson error:",e);
      setAllLessons(prev=>({...prev,[user.email]:[...(prev[user.email]||[]),lesson]}));
    }
  };
  const updateLesson=async(email,id,updates)=>{
    setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,...updates}:l)}));
    try{
      await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:id,updates})});
    }catch(e){console.error("Update lesson error:",e);}
  };
  const approveStudent=async(student,memberType,grandfathered=false)=>{
    try{
      await adminFetch("/api/students?action=approve",{method:"POST",body:JSON.stringify({requestId:student.id,email:student.email,name:student.name,firstName:student.firstName||"",lastName:student.lastName||"",commEmail:student.commEmail||"",phone:student.phone||"",homeCourt:student.homeCourt||"",skillLevel:student.skillLevel||"",duprRating:student.duprRating||"",duprId:student.duprId||"",memberType,grandfathered,action:"approve"})});
      setAllLessons(prev=>({...prev,[student.email]:[]}));
      setMockUsersState(prev=>({...prev,[student.email]:{name:student.name,firstName:student.firstName||"",lastName:student.lastName||"",commEmail:student.commEmail||"",skillLevel:student.skillLevel||"",duprRating:student.duprRating||"",duprDoublesRating:student.duprDoublesRating||"",duprId:student.duprId||"",memberType,approved:true,grandfathered:!!grandfathered}}));
      // Auto-sync DUPR ratings if student provided a Player ID at registration
      if(student.duprId){
        fetch("/api/students?action=dupr-lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({duprId:student.duprId,email:student.email})}).then(r=>r.json()).then(data=>{
          if(!data.error&&(data.rating!=null||data.doublesRating!=null)){
            const updates={};
            if(data.rating!=null)updates.duprRating=parseFloat(data.rating).toFixed(2);
            if(data.doublesRating!=null)updates.duprDoublesRating=parseFloat(data.doublesRating).toFixed(2);
            if(data.fullName)updates.duprPlayerName=data.fullName;
            if(Object.keys(updates).length>0)setMockUsersState(prev=>({...prev,[student.email]:{...prev[student.email],...updates}}));
          }
        }).catch(()=>{});
      }
      setPendingStudents(prev=>prev.filter(s=>s.id!==student.id));
      // Send approval email to comm email if available, else Google email
      const notifyEmail=student.commEmail||student.email;
      fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:notifyEmail,subject:"Your DM Pickleball account is approved!",text:"Hi "+student.name+",\n\nYour account has been approved! You can now log in at:\nhttps://dmpickleball.com\n\nSee you on the court!\nCoach David",fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});
    }catch(e){console.error("Approve error:",e);}
  };
  const denyStudent=async id=>{
    const student=pendingStudents.find(s=>s.id===id);
    if(student){
      try{
        await adminFetch("/api/students?action=approve",{method:"POST",body:JSON.stringify({requestId:id,action:"deny"})});
      }catch(e){console.error("Deny error:",e);}
      // Add to removed list so admin can see & optionally block
      setRemovedStudents(prev=>[{
        email:student.email,name:student.name,first_name:student.firstName||"",last_name:student.lastName||"",
        firstName:student.firstName||"",lastName:student.lastName||"",
        phone:student.phone||"",skillLevel:student.skillLevel||"",picture:student.picture||"",
        isDenied:true,deniedAt:new Date().toISOString(),blocked:false
      },...prev]);
    }
    setPendingStudents(prev=>prev.filter(s=>s.id!==id));
  };
  const blockRemovedStudent=async(email,block)=>{
    // Update local removed state
    setRemovedStudents(prev=>prev.map(s=>s.email===email?{...s,blocked:block}:s));
    // Persist: upsert/remove a blocked sentinel in students table
    try{
      await fetch("/api/students?action=block-removed",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,block})});
    }catch(e){console.error("Block removed error:",e);}
  };
  const addStudent=({name,email,memberType,firstName,lastName,commEmail,phone,city,homeCourt,skillLevel,duprRating,duprDoublesRating,duprId,duprPlayerName})=>{
    setMockUsersState(prev=>{
      const existing=prev[email];
      if(existing){
        // Update existing student — merge all profile fields, preserve memberType/approved/blocked/etc.
        return{...prev,[email]:{...existing,name,firstName:firstName||"",lastName:lastName||"",commEmail:commEmail||"",phone:phone||"",city:city||"",homeCourt:homeCourt||"",skillLevel:skillLevel||"",duprRating:duprRating!=null?duprRating:existing.duprRating||"",duprDoublesRating:duprDoublesRating!=null?duprDoublesRating:existing.duprDoublesRating||"",duprId:duprId!=null?duprId:existing.duprId||"",duprPlayerName:duprPlayerName!=null?duprPlayerName:existing.duprPlayerName||"",memberType:memberType||existing.memberType}};
      }
      // New student
      return{...prev,[email]:{name,memberType:memberType||"public",approved:true,password:"",firstName:firstName||"",lastName:lastName||"",commEmail:commEmail||"",phone:phone||"",city:city||"",homeCourt:homeCourt||"",skillLevel:skillLevel||"",duprRating:duprRating||"",duprDoublesRating:duprDoublesRating||"",duprId:duprId||"",duprPlayerName:duprPlayerName||""}};
    });
    // Only initialize lessons array if this is a new student
    setAllLessons(prev=>({...prev,[email]:prev[email]||[]}));
  };
  const adminAddLesson=async(email,lesson)=>{
    try{
      const r=await fetch("/api/lessons?action=save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson:{...lesson,studentEmail:email}})});
      const data=await r.json();
      const finalLesson=data.id?{...lesson,id:data.id}:lesson;
      setAllLessons(prev=>({...prev,[email]:[...(prev[email]||[]),finalLesson]}));
    }catch(e){
      console.error("Admin save lesson error:",e);
      setAllLessons(prev=>({...prev,[email]:[...(prev[email]||[]),lesson]}));
    }
  };
  const toggleMenlo=email=>{
    const next=mockUsersState[email]?.memberType==="menlo"?"public":"menlo";
    setMockUsersState(prev=>({...prev,[email]:{...prev[email],memberType:next}}));
    fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,updates:{member_type:next}})}).catch(()=>{});
  };
  const toggleSaturday=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],saturdayEnabled:!prev[email]?.saturdayEnabled}}));
  const blockStudent=email=>{
    const next=!mockUsersState[email]?.blocked;
    setMockUsersState(prev=>({...prev,[email]:{...prev[email],blocked:next}}));
    fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,updates:{blocked:next}})}).catch(()=>{});
  };
  const toggleGrandfathered=email=>{
    const next=!mockUsersState[email]?.grandfathered;
    setMockUsersState(prev=>({...prev,[email]:{...prev[email],grandfathered:next}}));
    fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,updates:{grandfathered:next}})}).catch(()=>{});
  };
  const removeStudent=async(email)=>{
    // Archives to deleted_students, removes from students — frees email for re-registration
    await adminFetch("/api/students?action=delete",{method:"POST",body:JSON.stringify({email})});
    const u=mockUsersState[email];
    const now=new Date().toISOString();
    setRemovedStudents(prev=>[{
      email,name:u?.name||email,first_name:u?.firstName||"",last_name:u?.lastName||"",
      firstName:u?.firstName||"",lastName:u?.lastName||"",
      memberType:u?.memberType||"public",phone:u?.phone||"",city:u?.city||"",
      homeCourt:u?.homeCourt||"",picture:u?.picture||"",deleted_at:now,blocked:false
    },...prev]);
    setMockUsersState(prev=>{const next={...prev};delete next[email];return next;});
    // allLessons preserved for history
  };
  const restoreStudent=async(email)=>{
    // Moves from deleted_students back to students (active)
    await adminFetch("/api/students?action=restore",{method:"POST",body:JSON.stringify({email})});
    const s=removedStudents.find(x=>x.email===email);
    if(s){
      setMockUsersState(prev=>({...prev,[email]:{
        name:s.name,firstName:s.firstName||s.first_name||"",lastName:s.lastName||s.last_name||"",
        commEmail:s.commEmail||s.comm_email||"",skillLevel:s.skillLevel||"",duprRating:s.duprRating||s.dupr_rating||"",duprDoublesRating:s.duprDoublesRating||s.dupr_doubles_rating||"",duprId:s.duprId||s.dupr_id||"",duprPlayerName:s.duprPlayerName||s.dupr_player_name||"",
        memberType:s.memberType||"public",approved:true,blocked:false,
        phone:s.phone||"",city:s.city||"",homeCourt:s.homeCourt||"",picture:s.picture||""
      }}));
    }
    setRemovedStudents(prev=>prev.filter(x=>x.email!==email));
  };
  const logout=()=>{clearAdminSession();setUser(null);setIsAdmin(false);setIsPartner(false);setPage(isAdminRoute?"adminlogin":"home");};
  if(isPartner)return<PartnerPortal preLoggedIn/>;
  if(isAdmin)return(
    <div style={{fontFamily:"'Inter',sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/DMPBlogo-white.png" alt="DMPB" style={{height:34,width:"auto",display:"block"}}/>
          <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.6)",fontWeight:400}}>· Admin</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"3px 10px",fontSize:"0.75rem",fontWeight:800}}>{pendingStudents.length} pending</span>}
          <button onClick={logout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.4)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem"}}>Log out</button>
        </div>
      </nav>
      <AdminPanel allLessons={allLessons} onUpdateLesson={updateLesson} onCancelLesson={adminCancel} onDeleteLesson={deleteLesson} pendingStudents={pendingStudents} onApprove={approveStudent} onDeny={denyStudent} mockUsers={mockUsersState} onAddStudent={addStudent} onAddLesson={adminAddLesson} onToggleMenlo={toggleMenlo} onToggleSaturday={toggleSaturday} onBlockStudent={blockStudent} onRemoveStudent={removeStudent} removedStudents={removedStudents} onRestoreStudent={restoreStudent} onBlockRemoved={blockRemovedStudent} onToggleGrandfathered={toggleGrandfathered} stanfordEnabled={stanfordEnabled} onToggleStanford={()=>{const next=!stanfordEnabled;setStanfordEnabled(next);try{localStorage.setItem("stanfordEnabled",String(next));}catch{};}}/>
    </div>
  );
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <Analytics/>
      <Nav user={user} onLogin={()=>setPage("login")} onLogout={logout} setPage={setPage} currentPage={page}/>
      {page==="adminlogin"&&<AdminLoginPage onAdminLogin={email=>{saveAdminSession(email);if(email===ADMIN_EMAIL)setIsAdmin(true);else if(PARTNER_EMAILS.includes(email))setIsPartner(true);}}/>}
      {page==="home"&&!isAdminRoute&&<Homepage setPage={setPage}/>}
      {page==="pricing"&&<PricingPage setPage={setPage}/>}
      {page==="gear"&&<GearPage/>}
      {page==="resources"&&<ResourcesPage/>}
      {page==="contact"&&<ContactPage/>}
      {page==="login"&&<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>}
      {page==="account"&&(user?<AccountPage user={user} setPage={setPage} onUpdateUser={updateUser}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      {page==="dashboard"&&(user?<Dashboard user={user} setPage={setPage} lessons={userLessons} onCancel={cancelLesson} onUpdateLesson={(id,updates)=>updateLesson(user.email,id,updates)} dbLoaded={dbLoaded}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      {page==="booking"&&(user?<BookingPage user={user} setPage={setPage} onAddLesson={addLesson} stanfordEnabled={stanfordEnabled}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      <footer style={{textAlign:"center",padding:24,color:"#9ca3af",fontSize:"0.82rem",borderTop:"1px solid #e5e7eb",marginTop:20}}>
        © 2026 DM Pickleball — David Mok · SF Peninsula, Bay Area
      </footer>
    </div>
  );
}
// Thu Mar 12 09:07:24 PDT 2026
