import { useState, useEffect, useRef, Fragment } from "react";

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
const inp = { padding:"11px 14px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:"0.92rem", outline:"none", background:"#fafafa", width:"100%", boxSizing:"border-box", marginBottom:12 };
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

// ─── AUTH (mock — swap for a real auth service like Supabase if needed) ───────
const MOCK_USERS = {
  "student@email.com": { password:"test123", name:"Jane Smith", memberType:"public", approved:true },
  "menlo@email.com":   { password:"test123", name:"Mike Chen",  memberType:"menlo",  approved:true },
};
const ADMIN_USER = { email:"dlogfx", password:"pejkyt-8sejFu-wyzcac" };

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
  const rows=text.split('\n').map(line=>{
    if(!line.trim())return'<div style="height:8px"></div>';
    if(/^Ref: PB-/.test(line))return`<div style="display:inline-block;background:#fef2f2;color:#991b1b;font-family:monospace;font-weight:800;font-size:0.9rem;padding:6px 14px;border-radius:6px;margin:8px 0;letter-spacing:0.5px;">${esc(line)}</div>`;
    const ci=line.indexOf(': ');
    if(ci>0&&ci<22&&!/^(Hi |See |David |Your |You |New |If |A )/.test(line)){const lbl=esc(line.slice(0,ci));const val=esc(line.slice(ci+2));return`<div style="padding:3px 0;"><span style="color:#6b7280;font-weight:700;display:inline-block;min-width:90px;">${lbl}:</span> <span style="color:#1a1a1a;">${val}</span></div>`;}
    return`<div style="padding:2px 0;color:#374151;">${esc(line)}</div>`;
  }).join('');
  return`<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#fff5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
  <div style="background:#991b1b;padding:18px 28px;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><span style="color:white;font-weight:800;font-size:1.2rem;letter-spacing:3px;">DMPB</span><span style="color:rgba(255,255,255,0.45);font-size:0.75rem;letter-spacing:1px;font-weight:400;">PICKLEBALL</span></div><div style="color:rgba(255,255,255,0.85);font-weight:700;font-size:0.95rem;">Lesson Cancelled</div></div>
  <div style="padding:28px 32px;">${rows}<div style="margin-top:22px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:0.75rem;color:#9ca3af;">DM Pickleball · <a href="https://dmpickleball.com" style="color:#991b1b;text-decoration:none;">dmpickleball.com</a></div></div>
</div></body></html>`;
}
function makeEmailHtml(text,calLink){
  const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const rows=text.split('\n').map(line=>{
    if(!line.trim())return'<div style="height:8px"></div>';
    if(/^Ref: PB-/.test(line))return`<div style="display:inline-block;background:#e8f0ee;color:#1a3c34;font-family:monospace;font-weight:800;font-size:0.9rem;padding:6px 14px;border-radius:6px;margin:8px 0;letter-spacing:0.5px;">${esc(line)}</div>`;
    const ci=line.indexOf(': ');
    if(ci>0&&ci<22&&!/^(Hi |See |David |Your |You |New )/.test(line)){const lbl=esc(line.slice(0,ci));const val=esc(line.slice(ci+2));return`<div style="padding:3px 0;"><span style="color:#6b7280;font-weight:700;display:inline-block;min-width:70px;">${lbl}:</span> <span style="color:#1a1a1a;">${val}</span></div>`;}
    return`<div style="padding:2px 0;color:#374151;">${esc(line)}</div>`;
  }).join('');
  const btn=calLink?`<div style="margin:24px 0;"><a href="${calLink}" style="display:inline-block;background:#1a3c34;color:white;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.88rem;">Add to Google Calendar</a></div>`:'';
  return`<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f4f9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
  <div style="background:#1a3c34;padding:18px 28px;display:flex;align-items:center;gap:10px;"><span style="color:white;font-weight:800;font-size:1.2rem;letter-spacing:3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">DMPB</span><span style="color:rgba(255,255,255,0.45);font-size:0.75rem;letter-spacing:1px;font-weight:400;">PICKLEBALL</span></div>
  <div style="padding:28px 32px;">${rows}${btn}<div style="margin-top:22px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:0.75rem;color:#9ca3af;">DM Pickleball · <a href="https://dmpickleball.com" style="color:#1a3c34;text-decoration:none;">dmpickleball.com</a></div></div>
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
  const goHome=()=>{if(onAdminRoute){window.location.href="/";}else{setPage("home");}};
  return(
    <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
      <div onClick={goHome} style={{cursor:"pointer",display:"flex",alignItems:"center"}}>
        <img src="/DMPBlogo-white.png" alt="DMPB" style={{height:34,width:"auto",display:"block"}}/>
      </div>
      <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
        {[["home","Home"],["pricing","Pricing"],["gear","Paddle/Gear"],["contact","Contact"]].map(([p,label])=>(
          <span key={p} onClick={()=>p==="home"?goHome():setPage(p)} style={{color:"white",cursor:"pointer",opacity:currentPage===p?1:0.7,fontWeight:currentPage===p?700:400,fontSize:"0.92rem"}}>{label}</span>
        ))}
        {user?(
          <>
            <span onClick={()=>setPage("dashboard")} style={{color:Y,cursor:"pointer",fontWeight:700,fontSize:"0.92rem"}}>My Lessons</span>
            <span onClick={()=>setPage("account")} title="Account Settings" style={{color:"white",cursor:"pointer",opacity:currentPage==="account"?1:0.7,fontSize:"1.2rem",lineHeight:1}}>⚙️</span>
            <span onClick={()=>setPage("booking")} style={{background:"rgba(255,255,255,0.15)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.88rem"}}>Book</span>
            <button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.4)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem"}}>Log out</button>
          </>
        ):(
          <button onClick={onLogin} style={{background:Y,color:G,border:"none",padding:"8px 20px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.88rem"}}>Student Login</button>
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
  const isCancelled=["cancelled","late_cancel","cancelled_forgiven"].includes(lesson.status);
  const cancellable=!isCancelled&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const withinGrace=!isCancelled&&!canCancel(lesson.date,lesson.time)&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const closed=!isCancelled&&!cancellable&&!withinGrace;
  const deadline=!isCancelled?getCancelDeadline(lesson.date,lesson.time):null;
  const[confirmCancel,setConfirmCancel]=useState(false);
  const[cancelling,setCancelling]=useState(false);
  const location=isMenlo?"Stanford Redwood City":"Andrew Spinas Park, Redwood City";
  const dateObj=new Date(lesson.date+"T12:00:00");
  const statusMap={
    confirmed:{bg:"#e8f0ee",color:G,label:"✓ Confirmed"},
    pending:{bg:"#fffbea",color:"#92400e",label:"⏳ Pending"},
    completed:{bg:"#e8f0ee",color:G,label:"✓ Completed"},
    cancelled:{bg:"#fef2f2",color:"#dc2626",label:"✕ Cancelled"},
    late_cancel:{bg:"#fff7ed",color:"#c2410c",label:"⚠️ Late Cancel"},
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
        {lesson.status==="late_cancel"&&(()=>{
          const rawPrice=lesson.customPrice!=null?lesson.customPrice:({"Private":{60:120,90:180},"Semi-Private":{60:140,90:210},"Group Lesson":{60:140,90:210},"Group":{60:140,90:210}}[lesson.type]||{})[parseInt(lesson.duration)]||120;
          const fee=Math.round(rawPrice*0.5);
          const note=encodeURIComponent("Late cancellation fee — lesson on "+fmtDateShort(lesson.date));
          const venmoUrl="https://venmo.com/"+VENMO+"?txn=pay&amount="+fee+"&note="+note;
          return(
            <div style={{padding:"0 24px 24px"}}>
              <div style={{background:"#fff7ed",border:"1.5px solid #fb923c",borderRadius:12,padding:"18px 20px"}}>
                <div style={{fontWeight:800,color:"#c2410c",fontSize:"0.92rem",marginBottom:4}}>⚠️ Late Cancellation Fee</div>
                <div style={{fontSize:"0.83rem",color:"#7c2d12",lineHeight:1.7,marginBottom:14}}>This lesson was cancelled after the 12-hour window. Per our cancellation policy, a fee of <strong>${fee}</strong> (50% of ${rawPrice}) is owed.</div>
                <a href={venmoUrl} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#3d95ce",color:"white",padding:"11px 20px",borderRadius:50,fontWeight:700,textDecoration:"none",fontSize:"0.9rem"}}>
                  Pay ${fee} via Venmo →
                </a>
                <div style={{fontSize:"0.75rem",color:"#9ca3af",textAlign:"center",marginTop:8}}>@{VENMO} · amount pre-filled in the Venmo app</div>
              </div>
            </div>
          );
        })()}
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
  const isCancelled=["cancelled","late_cancel","cancelled_forgiven"].includes(lesson.status);
  const cancellable=!isHistory&&!isCancelled&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const withinGrace=!isHistory&&!isCancelled&&!canCancel(lesson.date,lesson.time)&&canCancel(lesson.date,lesson.time,lesson.createdAt);
  const deadline=!isHistory&&!isCancelled?getCancelDeadline(lesson.date,lesson.time):null;
  const dateObj=new Date(lesson.date+"T12:00:00");
  return(
    <>
      {showModal&&<LessonModal lesson={lesson} isMenlo={!!isMenlo} onClose={()=>setShowModal(false)} onCancel={id=>{onCancel(id);setShowModal(false);}}/>}
      <div onClick={()=>setShowModal(true)}
        style={{background:"white",borderRadius:12,border:`1.5px solid ${isCancelled?"#fca5a5":"#e5e7eb"}`,marginBottom:12,cursor:"pointer",transition:"border-color 0.15s,box-shadow 0.15s",opacity:isCancelled?0.85:1}}
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
                  <span style={{background:lesson.status==="late_cancel"?"#fff7ed":lesson.status==="cancelled_forgiven"?"#f3f4f6":"#fef2f2",color:lesson.status==="late_cancel"?"#c2410c":lesson.status==="cancelled_forgiven"?"#6b7280":"#dc2626",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                    {lesson.status==="late_cancel"?"⚠️ Cancelled (late)":lesson.status==="cancelled_forgiven"?"✓ Cancelled (forgiven)":lesson.cancelledByGcal?"📅 Removed from Calendar":"✕ Cancelled"}
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
  return(
    <div>
      {/* ── Video Hero ── */}
      <div style={{position:"relative",color:"white",textAlign:"center",padding:"110px 24px 90px",overflow:"hidden",minHeight:520,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {/* Background video */}
        <video autoPlay muted loop playsInline
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}}>
          <source src="/hero.m4v" type="video/mp4"/>
        </video>
        {/* Dark overlay so text stays readable */}
        <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"linear-gradient(to bottom, rgba(0,20,14,0.70) 0%, rgba(0,20,14,0.55) 60%, rgba(0,20,14,0.75) 100%)",zIndex:1}}/>
        {/* Content */}
        <div style={{position:"relative",zIndex:2,maxWidth:660,margin:"0 auto"}}>
          <div style={{fontSize:"0.8rem",letterSpacing:3,opacity:0.8,marginBottom:14,textTransform:"uppercase"}}>Pickleball Coaching · San Francisco Peninsula, Bay Area</div>
          <h1 style={{fontSize:"3rem",fontWeight:900,lineHeight:1.15,marginBottom:16}}>Level Up With One of the<br/><span style={{color:Y}}>Bay Area's Top Competitive Pickleball Coaches</span></h1>
          <p style={{fontSize:"1.1rem",opacity:0.9,maxWidth:500,margin:"0 auto 32px",lineHeight:1.7}}>Private, semi-private & group lessons on the SF Peninsula. Personalized coaching from a tournament competitor who knows what it takes to win.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>setPage("pricing")} style={{background:Y,color:G,border:"none",padding:"13px 30px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>View Pricing</button>
            <button onClick={()=>setPage("contact")} style={{background:"transparent",color:"white",border:"2px solid rgba(255,255,255,0.5)",padding:"13px 30px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>Get in Touch</button>
          </div>
        </div>
      </div>
      <div style={{background:"white",padding:"40px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,textAlign:"center"}}>
          {[["15+","Years Tennis Experience"],["6","Years Pickleball Coaching"],["5.0+","Tournament Rating"]].map(([num,label])=>(
            <div key={label}><div style={{fontSize:"2.4rem",fontWeight:900,color:G}}>{num}</div><div style={{fontSize:"0.88rem",color:"#6b7280",marginTop:4}}>{label}</div></div>
          ))}
        </div>
      </div>
      <div style={{background:"#f4f9f6",padding:"60px 24px"}}>
        <div style={{maxWidth:760,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 2fr",gap:40,alignItems:"center"}}>
          <div style={{borderRadius:16,overflow:"hidden",aspectRatio:"3/4",boxShadow:"0 8px 32px rgba(0,96,57,0.2)"}}>
            <img src={DAVID_PHOTO} alt="David Mok — Honolulu Open Gold Medal" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
          </div>
          <div>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>About Coach David</div>
            <h2 style={{fontSize:"1.8rem",fontWeight:900,marginBottom:16,lineHeight:1.3}}>From Tennis Courts to Pickleball Pro</h2>
            <p style={{color:"#4b5563",lineHeight:1.8,marginBottom:14,fontSize:"0.97rem"}}>With 15+ years of competitive tennis experience, Coach David brings a unique edge to pickleball coaching. As a 5.0+ rated tournament player and CRBN Ambassador, Coach David has an insider's understanding of what it takes to elevate your game.</p>
            <p style={{color:"#4b5563",lineHeight:1.8,fontSize:"0.97rem"}}>Coach David specializes in coaching tennis players making the transition to pickleball — he knows exactly the habits that help and the ones that hurt. Whether you're a complete beginner or a seasoned competitor, Coach David coaches all skill levels in both doubles and singles across the SF Peninsula.</p>
            <div style={{background:"#e8f0ee",border:`1px solid ${G}20`,borderRadius:10,padding:"10px 16px",marginTop:14,display:"inline-flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:"0.83rem",fontWeight:700,color:G}}>Multiple Gold Medals · Tournament Competitor</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:14}}>
              {["Multiple Gold Medalist","Tournament Competitor","CRBN Ambassador","Tennis Convert Specialist","All Skill Levels","SF Peninsula"].map(tag=>(
                <span key={tag} style={{background:"#e8f0ee",color:G,padding:"6px 14px",borderRadius:50,fontSize:"0.8rem",fontWeight:600}}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{background:"white",padding:"60px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>What's Available</div>
            <h2 style={{fontSize:"1.8rem",fontWeight:900}}>Lesson Types</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
            {[["INDIVIDUAL","Private","1-on-1 coaching",null,null],["DUO","Semi-Private","2 students","$140 / $210","$70 / $105 per person"],["GROUP","Group Lesson","3–5 students",null,"split equally"]].map(([label,title,desc,price,sub])=>(
              <div key={title} style={{border:"2px solid #e5e7eb",borderTop:"4px solid "+G,borderRadius:12,padding:24,textAlign:"center"}}>
                <div style={{fontSize:"0.65rem",fontWeight:800,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>{label}</div>
                <div style={{fontWeight:700,marginBottom:6}}>{title}</div>
                <div style={{fontSize:"0.83rem",color:"#6b7280",marginBottom:12}}>{desc}</div>
                <div style={{fontWeight:800,color:G,fontSize:"1.1rem"}}>{price}</div>
                {sub&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:3}}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#111111",padding:"48px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#f97316",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Gear I Trust</div>
          <h2 style={{fontSize:"1.8rem",fontWeight:900,color:"white",marginBottom:12}}>Paddle & Gear Discounts</h2>
          <p style={{color:"rgba(255,255,255,0.55)",marginBottom:28,lineHeight:1.7,maxWidth:480,margin:"0 auto 28px"}}>Get discounts on the paddles and gear Coach David uses and recommends.</p>
          <button onClick={()=>setPage("gear")} style={{background:"#f97316",color:"white",border:"none",padding:"12px 28px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>View All Codes →</button>
        </div>
      </div>
      <div style={{background:`linear-gradient(135deg,${G},#0d2620)`,color:"white",textAlign:"center",padding:"60px 24px"}}>
        <h2 style={{fontSize:"1.8rem",fontWeight:900,marginBottom:12}}>Ready to Improve Your Game?</h2>
        <p style={{opacity:0.9,marginBottom:24}}>Reach out via text or call to get started.</p>
        <button onClick={()=>setPage("contact")} style={{background:Y,color:G,border:"none",padding:"13px 32px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>Contact Coach David</button>
      </div>
    </div>
  );
}

function PricingPage({setPage}){
  return(
    <div style={{maxWidth:700,margin:"0 auto",padding:"60px 24px"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Transparent Pricing</div>
        <h2 style={{fontSize:"2rem",fontWeight:900}}>Lesson Rates</h2>
        <p style={{color:"#6b7280",marginTop:8}}>SF Peninsula, Bay Area</p>
      </div>
      <div style={{display:"grid",gap:12}}>
        {[["INDIVIDUAL","Private Lesson","1-on-1 personalized coaching","$120/hr",null],["DUO","Semi-Private","2 students","$140/hr","$70/person"],["GROUP","Group Lesson","3–5 students","$140/hr","split equally"]].map(([label,title,desc,price,sub])=>(
          <div key={title} style={{background:"white",border:"1.5px solid #e5e7eb",borderLeft:"4px solid "+G,borderRadius:10,padding:"22px 28px",display:"flex",alignItems:"center",gap:20}}>
            <div style={{flex:1}}>
              <div style={{fontSize:"0.65rem",fontWeight:800,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>{label}</div>
              <div style={{fontWeight:700,fontSize:"1.05rem"}}>{title}</div>
              <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>{desc}</div>
              <div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:4}}>60 & 90 min sessions available</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:700,color:G,fontSize:"1.15rem"}}>{price}</div>
              {sub&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>{sub}</div>}
            </div>
          </div>
        ))}
        <div style={{background:"white",border:"1.5px solid #e5e7eb",borderLeft:"4px solid #9ca3af",borderRadius:10,padding:"22px 28px",display:"flex",alignItems:"center",gap:20}}>
          <div style={{flex:1}}>
            <div style={{fontSize:"0.65rem",fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>CORPORATE</div>
            <div style={{fontWeight:700,fontSize:"1.05rem"}}>Corporate Events</div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>Group clinics & events for companies and teams</div>
          </div>
          <button onClick={()=>setPage("contact")} style={{background:"none",border:"none",color:G,fontWeight:600,fontSize:"0.88rem",cursor:"pointer",flexShrink:0,padding:"8px 0",letterSpacing:"0.5px",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}>Contact for pricing <span style={{fontSize:"0.75rem"}}>→</span></button>
        </div>
      </div>
      <div style={{marginTop:48}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"0.75rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Policies</div>
          <h2 style={{fontSize:"1.6rem",fontWeight:900}}>What to Know</h2>
        </div>
        <div style={{display:"grid",gap:12}}>
          {[
            {icon:"⏰",title:"Cancellation",body:"Cancel at least 12 hours before your lesson at no charge. Cancellations can be made directly from your student dashboard."},
            {icon:"⚠️",title:"Late Cancellation",body:(
              <span>Cancellations made within the 12-hour window are subject to a <strong>50% lesson fee</strong>. Payment is due via Venmo: <a href={"https://venmo.com/"+VENMO} target="_blank" rel="noreferrer" style={{color:G,fontWeight:700,textDecoration:"none"}}>@{VENMO}</a>. The fee will be shown in your dashboard when applicable.</span>
            )},
            {icon:"✕",title:"No-Show",body:"Failing to show up without any notice will be charged the full lesson rate. Please always reach out if something comes up — life happens."},
            {icon:"🌧️",title:"Weather",body:"If conditions are unplayable, Coach David will notify you as early as possible. The lesson will be rescheduled at no charge."},
            {icon:"🕐",title:"Late Arrivals",body:"The lesson ends at its scheduled time regardless of when you arrive. Please plan to be on the court a few minutes early."},
            {icon:"💳",title:"Payment",body:"Lesson payment is due on the day of your session. Coach David accepts Venmo (@"+VENMO+"), cash, or check."},
          ].map(({icon,title,body})=>(
            <div key={title} style={{background:"white",border:"1.5px solid #e5e7eb",borderLeft:"4px solid "+G,borderRadius:10,padding:"18px 24px",display:"flex",gap:16,alignItems:"flex-start"}}>
              <span style={{fontSize:"1.1rem",flexShrink:0,marginTop:1}}>{icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:4}}>{title}</div>
                <div style={{fontSize:"0.85rem",color:"#6b7280",lineHeight:1.7}}>{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GearPage(){
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
        <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:24}}>
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
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"#f97316",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Updated March 2026</div>
            <h2 style={{fontSize:"2rem",fontWeight:900,color:"white",marginBottom:10}}>What's In My Bag</h2>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.92rem",maxWidth:420,margin:"0 auto"}}>The exact gear Coach David plays and competes with right now.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginBottom:56}}>
            {BAG_ITEMS.map(item=>(
              <div key={item.id} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:16,padding:"24px 28px",display:"flex",alignItems:"center",gap:20}}>
                <div style={{width:54,height:54,background:"#f97316",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{item.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.67rem",fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{item.label}</div>
                  <div style={{color:"white",fontWeight:800,fontSize:"1.05rem",marginBottom:2}}>{item.name}</div>
                  <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem"}}>{item.detail}</div>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer"
                  style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,255,255,0.12)",padding:"7px 14px",borderRadius:50,textDecoration:"none",fontSize:"0.78rem",fontWeight:600,whiteSpace:"nowrap"}}>
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
              {PADDLE_HISTORY.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:20,marginBottom:i<PADDLE_HISTORY.length-1?16:0,position:"relative"}}>
                  <div style={{width:50,flexShrink:0,display:"flex",justifyContent:"center"}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:p.current?"#f97316":"rgba(255,255,255,0.15)",border:`2px solid ${p.current?"#f97316":"rgba(255,255,255,0.1)"}`,boxShadow:p.current?"0 0 14px rgba(249,115,22,0.6)":"none"}}/>
                  </div>
                  <div style={{flex:1,background:p.current?"rgba(249,115,22,0.07)":"rgba(255,255,255,0.03)",border:`1.5px solid ${p.current?"rgba(249,115,22,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{color:"white",fontWeight:700,fontSize:"0.97rem"}}>{p.name}</div>
                      <div style={{color:"rgba(255,255,255,0.35)",fontSize:"0.8rem",marginTop:3}}>{p.from} — {p.to}</div>
                    </div>
                    {p.current
                      ?<span style={{background:"#f97316",color:"white",padding:"3px 12px",borderRadius:50,fontSize:"0.68rem",fontWeight:800,textTransform:"uppercase"}}>Current</span>
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
        body:JSON.stringify({...form,to:"info@dmpickleball.com",subject:"Website contact from "+form.name,fromAlias:"info@dmpickleball.com"}),
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
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontWeight:700,color:G}}>Message sent!</div>
            <div style={{color:"#6b7280",fontSize:"0.9rem",marginTop:6}}>Coach Coach David will be in touch soon.</div>
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
  const[username,setUsername]=useState("");
  const[password,setPassword]=useState("");
  const[error,setError]=useState("");
  const attempt=()=>{
    if(username===ADMIN_USER.email&&password===ADMIN_USER.password){onAdminLogin();}
    else{setError("Invalid credentials.");}
  };
  return(
    <div style={{minHeight:"100vh",background:"#f4f9f6",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"0.7rem",fontWeight:800,color:G,letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>DM Pickleball</div>
          <h2 style={{fontWeight:900,color:"#1a1a1a",marginBottom:4}}>Admin Login</h2>
          <p style={{color:"#6b7280",fontSize:"0.85rem"}}>Dashboard</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        <input style={inp} type="text" placeholder="Username" value={username} onChange={e=>{setUsername(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
        <input style={inp} type="password" placeholder="Password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
        <button onClick={attempt} style={{width:"100%",background:G,color:"white",border:"none",padding:14,borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>
          Log In →
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
      onLogin({email,name:data.student.name||(info.firstName+" "+info.lastName).trim(),firstName:data.student.first_name||info.firstName||"",lastName:data.student.last_name||info.lastName||"",commEmail:data.student.comm_email||"",memberType:data.student.member_type,approved:true,picture:info.picture||data.student.picture||"",phone:data.student.phone||"",homeCourt:data.student.home_court||"",city:data.student.city||"",skillLevel:data.student.skill_level||"",duprRating:data.student.dupr_rating||"",grandfathered:!!(data.student.grandfathered)});
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
          <button onClick={()=>{setProviderInfo(null);setLoadingProv(null);setError("");setFirstName("");setLastName("");setCommEmail("");setPhone("");setHomeCourt("");setSkillLevel("");setGoals("");setReferralSource("");setUseDupr(false);setDuprRating("");}} style={{background:"white",border:"1.5px solid #d1d5db",color:"#374151",cursor:"pointer",fontSize:"0.78rem",fontWeight:600,whiteSpace:"nowrap",padding:"5px 12px",borderRadius:20,flexShrink:0}}>← Change</button>
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
          <div style={{marginTop:8,fontSize:"0.72rem",color:"#9ca3af",paddingLeft:2}}>
            Have a DUPR rating? You'll be able to link your account after signing in.
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
          fetch("/api/students?action=request",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({email:providerInfo.email,name:fullName,firstName:firstName.trim(),lastName:lastName.trim(),commEmail:commEmail.trim().toLowerCase(),phone,homeCourt,skillLevel,goals,referralSource,duprRating:"",authProvider:providerInfo.provider})
          }).then(r=>r.json()).then(data=>{
            if(data.error==="already_exists"){setError("You already have an account. Please sign in.");return;}
            if(data.error==="already_requested"){setError("You already have a pending request. Coach Coach David will be in touch soon.");return;}
            if(data.error==="blocked"||data.student?.blocked){setError("Your registration request was not accepted. Please contact Coach David directly.");return;}
            fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:"david@dmpickleball.com",subject:"New access request: "+fullName,text:fullName+" has requested access.\nProvider: "+PROV_LABELS[providerInfo.provider]+"\nLogin Email: "+providerInfo.email+"\nComm Email: "+commEmail+"\nPhone: "+phone+"\nHome Court: "+(homeCourt||"Not specified")+"\nSkill: "+(skillLevel||"Not specified")+"\nGoal: "+(goals||"Not specified")+"\nReferral: "+(referralSource||"Not specified")+"\n\nApprove at: https://dmpickleball.com/admin",fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});
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
              style={{width:"100%",background:loadingProv===pk?"#f3f4f6":"white",color:"#374151",border:"1.5px solid #e5e7eb",padding:"13px 20px",borderRadius:50,fontWeight:700,cursor:loadingProv?"not-allowed":"pointer",fontSize:"0.95rem",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"border-color 0.12s",opacity:loadingProv&&loadingProv!==pk?0.5:1}}
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
  const[commEmail,setCommEmail]=useState(user.commEmail||"");
  const[phone,setPhone]=useState(user.phone||"");
  const[city,setCity]=useState(user.city||"");
  const[homeCourt,setHomeCourt]=useState(user.homeCourt||"");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");

  const handleSave=async()=>{
    if(!firstName||!lastName){setError("First and last name are required.");return;}
    if(commEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(commEmail)){setError("Please enter a valid communication email.");return;}
    setSaving(true);setError("");
    const fullName=firstName.trim()+" "+lastName.trim();
    try{
      const r=await fetch("/api/students?action=update",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:user.email,updates:{name:fullName,first_name:firstName.trim(),last_name:lastName.trim(),comm_email:commEmail.trim().toLowerCase(),phone,city,home_court:homeCourt}})
      });
      const data=await r.json();
      if(data.success){
        onUpdateUser({...user,name:fullName,firstName:firstName.trim(),lastName:lastName.trim(),commEmail:commEmail.trim().toLowerCase(),phone,city,homeCourt});
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
          <label style={lbl}>Google Login Email</label>
          <input value={user.email} disabled style={{...inp,background:"#f3f4f6",color:"#9ca3af",cursor:"not-allowed"}}/>
          <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:4}}>Managed by Google — used to sign in only.</div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={lbl}>Communication Email <span style={{color:"#dc2626"}}>*</span></label>
          <input value={commEmail} onChange={e=>setCommEmail(e.target.value)} style={inp} placeholder="Where to send lesson confirmations & reminders" type="email"/>
          <div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:-10,marginBottom:4}}>All lesson notifications will be sent here.</div>
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
    </div>
  );
}

function Dashboard({user,setPage,lessons,onCancel,dbLoaded}){
  const cancelledStatuses=["cancelled","late_cancel","cancelled_forgiven"];
  const upcoming=lessons.filter(l=>!isPast(l.date,l.time)&&!cancelledStatuses.includes(l.status));
  const history=lessons.filter(l=>isPast(l.date,l.time)||l.status==="completed"||cancelledStatuses.includes(l.status));
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

function BookingPage({user,setPage,onAddLesson}){
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

  const PRICES={
    private:{60:isGrandfathered?120:isMenlo?115:120, 90:isGrandfathered?180:isMenlo?172.50:180},
    semi:   {60:isMenlo?120:140, 90:isMenlo?180:210},
    group:  {60:140, 90:210},
  };
  const LESSONS=[{id:"private",icon:"🎯",label:"Private",desc:"1-on-1 coaching"},{id:"semi",icon:"👥",label:"Semi-Private",desc:"2 students"},{id:"group",icon:"🏆",label:"Group",desc:"3-5 students"}];
  const price=lessonType&&duration?PRICES[lessonType][duration]:null;
  const slots=date?getSlots(date,isMenlo?"menlo":"public",duration||60).filter(s=>!busyTimes.some(b=>{const bufA=b.bufferAfter??30;const bufB=b.bufferBefore??30;return s.s<(b.endMins+bufA)&&s.e>(b.startMins-bufB);})):[];
  const toTime24=(mins)=>{const h=Math.floor(mins/60),m=mins%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");};
  const toTimeStr=(s,e)=>fmt(s)+" - "+fmt(e);

  // Private = 3 steps (skip participants); Semi/Group = 4 steps
  const isPrivate=lessonType==="private";
  const displaySteps=isPrivate?["Type","Date & Time","Confirm"]:["Type","Date & Time","Participants","Confirm"];
  const displayStep=isPrivate&&step===4?3:step;

  const step1Done=lessonType&&duration&&(lessonType!=="group"||groupSize);
  const step2Done=date&&slot;
  const step3Done=isPrivate?true:lessonType==="semi"?(partner.firstName.trim()!==""&&partner.lastName.trim()!==""):groupMembers.slice(0,groupSize-1).every(m=>m.firstName.trim()!==""&&m.lastName.trim()!=="");
  const canConfirm=step1Done&&step2Done&&step3Done;

  const handleBook=async()=>{
    setSubmitting(true);setError("");
    const startTime=toTime24(slot.s);
    const endTime=toTime24(slot.e);
    const timeStr=toTimeStr(slot.s,slot.e);
    const lessonLabel=lessonType==="private"?"Private":lessonType==="semi"?"Semi-Private":"Group";
    const nameInitial=(first,last)=>{const f=(first||"").trim(),l=(last||"").trim();return l?f+" "+l[0].toUpperCase():f;};
    const bookerParts=user.name.trim().split(/\s+/);
    const bookerInitial=nameInitial(bookerParts[0],bookerParts.slice(1).join(" "));
    const partnerFull=(partner.firstName+" "+partner.lastName).trim();
    const memberNames=lessonType==="semi"?[user.name,partnerFull]:lessonType==="group"?[user.name,...groupMembers.slice(0,groupSize-1).map(m=>(m.firstName+" "+m.lastName).trim())]:[user.name];
    const participantInitials=lessonType==="semi"?[bookerInitial,nameInitial(partner.firstName,partner.lastName)]:lessonType==="group"?[bookerInitial,...groupMembers.slice(0,groupSize-1).map(m=>nameInitial(m.firstName,m.lastName))]:[bookerInitial];
    const summary=participantInitials.join("/")+` pb lesson`;
    const partnerInfo=lessonType==="semi"?"\nPartner: "+partnerFull+(partner.email?" ("+partner.email+")":""):"";
    const groupInfo=lessonType==="group"?"\nGroup: "+groupMembers.slice(0,groupSize-1).map(m=>(m.firstName+" "+m.lastName).trim()+(m.email?" ("+m.email+")":"")).join(", "):"";
    const partnerEmail=partner.email;
    const location=!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063, USA":"Stanford Redwood City";
    const ticketId=generateTicket();
    const description="Ticket: "+ticketId+"\nStudent: "+user.name+"\nEmail: "+user.email+"\nType: "+lessonLabel+" "+duration+"min\nFocus: "+(focus||"Not specified")+"\nNotes: "+(notes||"None")+partnerInfo+groupInfo+"\nLocation: "+location+"\nManage: https://dmpickleball.com";
    let eventId="";
    try{
      const r=await fetch("/api/create-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary,description,date,startTime,endTime,location,studentEmail:user.email,studentName:user.name})});
      const d=await r.json();
      if(d.eventId)eventId=d.eventId;
    }catch(e){console.error("GCal:",e);}
    const startISO=date+"T"+startTime+":00";
    const endISO=date+"T"+endTime+":00";
    const link="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(summary)+"&dates="+startISO.replace(/[-:]/g,"").slice(0,15)+"/"+endISO.replace(/[-:]/g,"").slice(0,15)+"&details="+encodeURIComponent(description)+"&location="+encodeURIComponent(location);
    const priceNote=lessonType==="semi"?" ($"+(price/2)+"/person)":lessonType==="group"?" (split equally)":"";
    const sendEmail=(to,subject,text,replyTo,calLink,fromAlias)=>{const html=makeEmailHtml(text,calLink);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,...(replyTo?{replyTo}:{}),...(fromAlias?{fromAlias}:{})})}).catch(()=>{});};
    const studentText="Hi "+user.name+",\n\nYour pickleball lesson is confirmed!\n\nRef: "+ticketId+"\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+duration+" min\nPrice: $"+price+" total"+priceNote+"\nFocus: "+(focus||"Not specified")+"\nLocation: "+location+"\n\nManage your booking: https://dmpickleball.com\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";
    await sendEmail(user.email,"Your lesson is booked - "+fmtDateShort(date),studentText,user.email,link,"book@dmpickleball.com");
    const adminText="New lesson booked!\n\nRef: "+ticketId+"\nStudent: "+user.name+"\nEmail: "+user.email+"\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+duration+" min\nFocus: "+(focus||"Not specified")+"\nNotes: "+(notes||"None")+partnerInfo+groupInfo+"\nPrice: $"+price+" total"+priceNote+"\nLocation: "+location;
    await sendEmail("david@dmpickleball.com","New booking: "+summary+" - "+fmtDateShort(date),adminText,user.email,null,"noreply@dmpickleball.com");
    if(lessonType==="semi"&&partnerEmail){const partnerText="Hi "+partnerFull+",\n\n"+user.name+" has added you to a pickleball lesson!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: Semi-Private · "+duration+" min\nFocus: "+(focus||"Not specified")+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail(partnerEmail,"You have been added to a pickleball lesson - "+fmtDateShort(date),partnerText,"book@dmpickleball.com",link,"book@dmpickleball.com");}
    if(lessonType==="group"){for(const m of groupMembers.slice(0,groupSize-1)){if(m.email){const mFull=(m.firstName+" "+m.lastName).trim();const groupMemberText="Hi "+mFull+",\n\n"+user.name+" has added you to a group pickleball lesson!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail(m.email,"You have been added to a group pickleball lesson - "+fmtDateShort(date),groupMemberText,"book@dmpickleball.com",link,"book@dmpickleball.com");}}}
    const newLesson={id:Date.now(),date,time:timeStr,type:lessonLabel,duration:duration+" min",status:"confirmed",focus,notes:"",photos:[],videos:[],gcalEventId:eventId,ticketId,partnerEmail:lessonType==="semi"?partnerEmail:"",groupEmails:lessonType==="group"?groupMembers.slice(0,groupSize-1).map(m=>m.email).filter(Boolean):[],members:memberNames.slice(1),createdAt:new Date().toISOString()};
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
            <div><a href={!isMenlo?"https://maps.google.com/?q=Andrew+Spinas+Park,+3003+Bay+Rd,+Redwood+City,+CA+94063":"https://maps.google.com/?q=Stanford+Redwood+City+Recreation+and+Wellness+Center"} target="_blank" rel="noreferrer" style={{color:G,fontWeight:600}}>{!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Stanford Redwood City"}</a></div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <a href={gcalLink} target="_blank" rel="noreferrer" style={{background:G,color:"white",padding:"13px",borderRadius:50,fontWeight:700,textDecoration:"none",fontSize:"0.95rem"}}>Add to Google Calendar</a>
          <button onClick={()=>setPage("dashboard")} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>View My Lessons</button>
        </div>
      </div>
    </div>
  );

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
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
            {LESSONS.map(l=>{
              const p=duration?PRICES[l.id][duration]:null;
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
          {lessonType==="group"&&(
            <div style={{marginBottom:20}}>
              <div style={{...lbl,marginBottom:8}}>Additional Participants <span style={{color:"#dc2626",fontWeight:700}}>*</span></div>
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
              <div><strong>{lessonType==="private"?"Private":lessonType==="semi"?"Semi-Private":"Group"} · {duration} min</strong></div>
              {focus&&<div style={{color:G,fontWeight:600}}>Focus: {focus}</div>}
              <div><strong>${price} total</strong>{lessonType==="semi"&&<span style={{color:"#9ca3af",fontWeight:400,fontSize:"0.85rem"}}> · ${price/2}/person</span>}{lessonType==="group"&&<span style={{color:"#9ca3af",fontWeight:400,fontSize:"0.85rem"}}> · split equally</span>}</div>
              <div><a href={!isMenlo?"https://maps.google.com/?q=Andrew+Spinas+Park,+3003+Bay+Rd,+Redwood+City,+CA+94063":"https://maps.google.com/?q=Stanford+Redwood+City+Recreation+and+Wellness+Center"} target="_blank" rel="noreferrer" style={{color:G,fontWeight:600}}>{!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Stanford Redwood City"}</a></div>
              {lessonType==="semi"&&<div>Partner: {(partner.firstName+" "+partner.lastName).trim()}</div>}
              {lessonType==="group"&&<div>Group: {[user.name,...groupMembers.slice(0,groupSize-1).map(m=>(m.firstName+" "+m.lastName).trim())].join(", ")}</div>}
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
    if(type==="Private")return duration===90?172.50:115;
    if(type==="Semi-Private")return duration===90?180:120;
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
  Object.entries(allLessons).forEach(([email,lessons])=>{
    const u=mockUsers[email]||{memberType:"public"};
    lessons.filter(l=>l.status!=="cancelled"&&l.status!=="cancelled_forgiven"&&(l.status==="late_cancel"||new Date(l.date+"T23:59:59")<now||l.status==="completed")).forEach(l=>{
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
      rows.push({email,id:l.id,name:u.name||email,date:l.date,type:l.type,duration:l.duration,gross,net,isMenlo:u.memberType==="menlo"});
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
function FinancesTab({financeRange,setFinanceRange,includeStanford,setIncludeStanford,showNetStanford,setShowNetStanford,financeData,setFinanceData,financeLoading,setFinanceLoading,allLessons,mockUsers,onUpdateLesson,onExportNial,showNialExport,setShowNialExport,nialStart,setNialStart,nialEnd,setNialEnd}){
  const now=new Date();
  const[editRow,setEditRow]=useState(null);
  const[editPriceVal,setEditPriceVal]=useState("");
  const fmtD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const[financeView,setFinanceView]=useState("month");
  const[selectedDay,setSelectedDay]=useState(fmtD(now));
  const[weekOffset,setWeekOffset]=useState(0);
  const[viewMonth,setViewMonth]=useState(now.getMonth()+1);
  const[viewYear,setViewYear]=useState(now.getFullYear());
  const[viewYearOnly,setViewYearOnly]=useState(now.getFullYear());
  const[projectedMode,setProjectedMode]=useState(false);
  const[projectedCalData,setProjectedCalData]=useState(null);
  const[projectedCalLoading,setProjectedCalLoading]=useState(false);
  const dialogRef=useRef(null);
  const editRowRef=useRef(null);
  const computeRange=(view,day,offset,mo,yr,yrOnly)=>{
    if(view==="day")return{start:day,end:day};
    if(view==="week"){const base=new Date();const ws=new Date(base);ws.setDate(base.getDate()-base.getDay()+offset*7);const we=new Date(ws);we.setDate(ws.getDate()+6);return{start:fmtD(ws),end:fmtD(we)};}
    if(view==="month"){const last=new Date(yr,mo,0).getDate();return{start:yr+"-"+String(mo).padStart(2,"0")+"-01",end:yr+"-"+String(mo).padStart(2,"0")+"-"+String(last).padStart(2,"0")};}
    return{start:yrOnly+"-01-01",end:yrOnly+"-12-31"};
  };
  const loadData=async(start,end,withStanford)=>{
    setFinanceLoading(true);
    try{const r=await fetch("/api/earnings-calendar?start="+start+"&end="+end+"&includeStanford="+(withStanford?"true":"false"));const data=await r.json();setFinanceData(data);}
    catch(e){console.error("Finance load error:",e);}
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
    fetch("/api/earnings-calendar?start="+start+"&end="+end+"&includeStanford=false&includeFuture=true")
      .then(r=>r.json()).then(data=>setProjectedCalData(data)).catch(e=>console.error("Projected load error:",e)).finally(()=>setProjectedCalLoading(false));
  },[projectedMode]);
  const handleStanfordToggle=()=>{const next=!includeStanford;setIncludeStanford(next);loadData(viewRange.start,viewRange.end,next);};
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONFULL=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const viewLabel=financeView==="day"?new Date(selectedDay+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):financeView==="week"?(()=>{const sd=new Date(viewRange.start+"T12:00:00");const ed=new Date(viewRange.end+"T12:00:00");return"Week of "+MON[sd.getMonth()]+" "+sd.getDate()+", "+sd.getFullYear();})():financeView==="month"?MONFULL[viewMonth-1]+" "+viewYear:String(viewYearOnly);
  const portalEarnings=getEarnings(allLessons,mockUsers,"custom",viewRange.start,viewRange.end);
  const typeColors={private:"#1a3c34",semi:"#0ea5e9",group:"#f97316",stanford_rec:"#8b5cf6",stanford_open:"#8b5cf6"};
  const typeLabelMap={private:"Private Lesson",semi:"Semi-Private Lesson",group:"Group Lesson"};
  const calendarLessons=(financeData?.events||[]).filter(e=>!e.isStanford&&!e.isPickup);
  const stanfordEvents=(financeData?.events||[]).filter(e=>e.isStanford);
  const[calOverrides,setCalOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem("calPriceOverrides")||"{}")}catch{return{}}});
  const[calTypeOverrides,setCalTypeOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem("calTypeOverrides")||"{}")}catch{return{}}});
  const[editTypeVal,setEditTypeVal]=useState("");
  const adjustedCalLessons=calendarLessons.map(e=>{const k=e.date+"|"+e.summary;const typeOv=calTypeOverrides[k];return{...e,...(calOverrides[k]!=null?{earnings:calOverrides[k]}:{}),...(typeOv?{type:typeOv,category:typeLabelMap[typeOv]||e.category}:{})};});
  const adjustedLessonEarnings=adjustedCalLessons.reduce((s,e)=>s+e.earnings,0);
  const stanfordAmt=includeStanford?(showNetStanford?(financeData?.stanfordNetEarnings||0):(financeData?.stanfordEarnings||0)):0;
  const totalEarnings=adjustedLessonEarnings+portalEarnings.total+stanfordAmt;
  // Build the fixed 6-month window starting from today
  const projectedMonthKeys=(()=>{
    const keys=[];
    for(let i=0;i<6;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);keys.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));}
    return keys;
  })();
  // Projected earnings: future calendar lessons + portal lessons, grouped by month
  const projectedByMonth=(()=>{
    const map={};
    projectedMonthKeys.forEach(mk=>{map[mk]={total:0,count:0,rows:[]};});
    const add=(mk,row)=>{if(!map[mk])return;map[mk].total+=row.earnings;map[mk].count++;map[mk].rows.push(row);};
    // Future calendar events (non-Stanford, non-pickup, not already covered by a portal lesson)
    const projPortalIds=new Set(Object.values(allLessons).flat().filter(l=>l.gcalEventId).map(l=>l.gcalEventId));
    (projectedCalData?.events||[]).filter(e=>!e.isStanford&&!e.isPickup&&!projPortalIds.has(e.gcalEventId)).forEach(e=>{
      const mk=e.date.substring(0,7);
      const k=e.date+"|"+e.summary;
      const earnings=calOverrides[k]!=null?calOverrides[k]:e.earnings;
      add(mk,{date:e.date,label:e.summary,category:e.category,earnings,hours:e.hours,source:"calendar"});
    });
    // Future portal lessons
    Object.entries(allLessons).forEach(([email,lessons])=>{
      const u=mockUsers[email]||{memberType:"public"};
      (lessons||[]).filter(l=>l.status!=="cancelled"&&l.status!=="cancelled_forgiven"&&new Date(l.date+"T12:00:00")>=now).forEach(l=>{
        const mk=l.date.substring(0,7);
        const mins=getDurationMins(l.duration);
        const gross=l.customPrice!=null?l.customPrice:getRate(l.type,mins,u.memberType);
        const net=l.customPrice!=null?l.customPrice:(u.memberType==="menlo"?getMenloNet(gross):gross);
        add(mk,{date:l.date,label:u.name||email,category:l.type,earnings:net,duration:l.duration,isMenlo:u.memberType==="menlo",source:"portal"});
      });
    });
    return projectedMonthKeys.map(mk=>[mk,map[mk]]);
  })();
  const projectedTotal=projectedByMonth.reduce((s,[,v])=>s+v.total,0);
  const projectedTotalCount=projectedByMonth.reduce((s,[,v])=>s+v.count,0);
  return(
    <div>
      {/* Actual / Projected toggle */}
      <div style={{display:"flex",gap:0,marginBottom:24,background:"#f3f4f6",borderRadius:50,padding:4,width:"fit-content"}}>
        <button onClick={()=>setProjectedMode(false)} style={{padding:"7px 22px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",background:!projectedMode?"white":"transparent",color:!projectedMode?"#1a3c34":"#9ca3af",boxShadow:!projectedMode?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>Actual</button>
        <button onClick={()=>setProjectedMode(true)} style={{padding:"7px 22px",borderRadius:50,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",background:projectedMode?"white":"transparent",color:projectedMode?"#1a3c34":"#9ca3af",boxShadow:projectedMode?"0 1px 4px rgba(0,0,0,0.10)":"none",transition:"all 0.15s"}}>📈 Projected</button>
      </div>
      {/* Projected View */}
      {projectedMode&&(
        <div>
          {/* Summary bar */}
          <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
            <div style={{background:"white",borderRadius:12,padding:"20px 28px",border:"1.5px solid #e5e7eb",flex:"0 0 auto"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>6-Month Projected</div>
              <div style={{fontSize:"1.9rem",fontWeight:900,color:"#1a3c34"}}>{projectedCalLoading?"…":"$"+projectedTotal.toFixed(2)}</div>
              <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:3}}>{projectedCalLoading?"Loading…":projectedTotalCount+" total lessons"}</div>
            </div>
            {/* Mini month totals bar */}
            {!projectedCalLoading&&<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"stretch"}}>
              {projectedByMonth.map(([mk,data])=>{
                const[yr,mo]=mk.split("-");
                const isCurrentMonth=now.getFullYear()===parseInt(yr)&&(now.getMonth()+1)===parseInt(mo);
                return(
                  <div key={mk} style={{background:isCurrentMonth?"#f0faf5":"white",borderRadius:10,padding:"12px 16px",border:"1.5px solid "+(isCurrentMonth?"#1a3c34":"#e5e7eb"),minWidth:90,textAlign:"center"}}>
                    <div style={{fontSize:"0.72rem",fontWeight:700,color:isCurrentMonth?"#1a3c34":"#9ca3af",textTransform:"uppercase",marginBottom:4}}>{MON[parseInt(mo)-1]}</div>
                    <div style={{fontSize:"1.1rem",fontWeight:900,color:data.count>0?"#1a3c34":"#d1d5db"}}>{data.count>0?"$"+Math.round(data.total):"—"}</div>
                    <div style={{fontSize:"0.7rem",color:"#9ca3af",marginTop:2}}>{data.count} lesson{data.count!==1?"s":""}</div>
                  </div>
                );
              })}
            </div>}
          </div>
          {/* Month-by-month breakdown */}
          {projectedCalLoading?(
            <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>Loading calendar data…</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {projectedByMonth.map(([mk,data])=>{
                const[yr,mo]=mk.split("-");
                const monthLabel=MONFULL[parseInt(mo)-1]+" "+yr;
                const isCurrentMonth=now.getFullYear()===parseInt(yr)&&(now.getMonth()+1)===parseInt(mo);
                return(
                  <div key={mk} style={{background:"white",borderRadius:12,border:"1.5px solid "+(isCurrentMonth?"#1a3c34":"#e5e7eb"),overflow:"hidden"}}>
                    <div style={{background:isCurrentMonth?"#1a3c34":"#f9f9f6",borderBottom:"1.5px solid "+(isCurrentMonth?"#1a3c34":"#e5e7eb"),padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontWeight:800,fontSize:"1rem",color:isCurrentMonth?"white":"#1a3c34"}}>{monthLabel}</span>
                        <span style={{background:isCurrentMonth?"rgba(255,255,255,0.2)":"#e5e7eb",color:isCurrentMonth?"white":"#6b7280",fontSize:"0.75rem",fontWeight:700,padding:"2px 10px",borderRadius:50}}>
                          {data.count} lesson{data.count!==1?"s":""}
                        </span>
                      </div>
                      <span style={{fontWeight:900,fontSize:"1.1rem",color:isCurrentMonth?"white":data.count>0?"#1a3c34":"#9ca3af"}}>{data.count>0?"$"+data.total.toFixed(2):"No lessons"}</span>
                    </div>
                    {data.rows.length>0&&(
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.87rem"}}>
                        <thead><tr style={{background:"#f9f9f6",borderBottom:"1px solid #e5e7eb"}}>{["Date","Description","Type","Details","Est. Income"].map(h=>(<th key={h} style={{padding:"10px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.75rem",textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
                        <tbody>
                          {data.rows.sort((a,b)=>a.date.localeCompare(b.date)).map((r,i)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f3f4f6",background:r.isMenlo?"#f0faf5":"white"}}>
                              <td style={{padding:"10px 16px",whiteSpace:"nowrap"}}>{fmtDateShort(r.date)}</td>
                              <td style={{padding:"10px 16px",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {r.label}
                                {r.isMenlo&&<span style={{background:"#1a3c34",color:"white",fontSize:"0.62rem",fontWeight:700,padding:"1px 6px",borderRadius:50,marginLeft:6}}>MCC</span>}
                              </td>
                              <td style={{padding:"10px 16px"}}>
                                <span style={{background:(typeColors[r.category?.toLowerCase()]||"#1a3c34")+"22",color:typeColors[r.category?.toLowerCase()]||"#1a3c34",padding:"2px 8px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>{r.category||"—"}</span>
                              </td>
                              <td style={{padding:"10px 16px",color:"#6b7280",fontSize:"0.82rem"}}>{r.source==="calendar"?(r.hours!=null?r.hours+"h":"—"):r.duration||"—"}</td>
                              <td style={{padding:"10px 16px",fontWeight:700,color:"#1a3c34"}}>${r.earnings.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Actual View */}
      {!projectedMode&&<>
      {/* Nial Export */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClick={()=>setShowNialExport(!showNialExport)} style={{background:"#1a1a1a",color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>⬇ Export Nial Report</button>
      </div>
      {showNialExport&&(
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:24}}>
          <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:4}}>Export Menlo Report for Nial</div>
          <div style={{fontSize:"0.83rem",color:"#6b7280",marginBottom:16}}>Select date range — shows Date, Member Name, Lesson Type, Duration.</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div><div style={{...lbl,marginBottom:4}}>Start Date</div><input type="date" value={nialStart} onChange={e=>setNialStart(e.target.value)} style={{...inp,marginBottom:0,width:"auto"}}/></div>
            <div><div style={{...lbl,marginBottom:4}}>End Date</div><input type="date" value={nialEnd} onChange={e=>setNialEnd(e.target.value)} style={{...inp,marginBottom:0,width:"auto"}}/></div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowNialExport(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
              <button onClick={onExportNial} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>⬇ Download CSV</button>
            </div>
          </div>
        </div>
      )}
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
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {includeStanford&&(
            <button onClick={()=>setShowNetStanford(!showNetStanford)} style={{background:showNetStanford?"#6d28d9":"white",color:showNetStanford?"white":"#374151",border:"1.5px solid "+(showNetStanford?"#6d28d9":"#e5e7eb"),padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>
              {showNetStanford?"Stanford: Net (after tax)":"Stanford: Gross"}
            </button>
          )}
          <button onClick={handleStanfordToggle} style={{background:includeStanford?"#8b5cf6":"white",color:includeStanford?"white":"#374151",border:"1.5px solid "+(includeStanford?"#8b5cf6":"#e5e7eb"),padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>
            {includeStanford?"✓ Stanford Included":"+ Include Stanford"}
          </button>
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
          <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Portal Lessons</div>
          <div style={{fontSize:"1.8rem",fontWeight:900,color:"#1a3c34"}}>${portalEarnings.total.toFixed(2)}</div>
          <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:4}}>{portalEarnings.rows.length} lessons</div>
        </div>
        <div style={{background:"white",borderRadius:12,padding:"20px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.7rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Calendar Lessons</div>
          <div style={{fontSize:"1.8rem",fontWeight:900,color:"#1a3c34"}}>${adjustedLessonEarnings.toFixed(2)}</div>
          <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:4}}>{calendarLessons.length} lessons</div>
        </div>
        {includeStanford&&(
          <div style={{background:"#f5f3ff",borderRadius:12,padding:"20px",border:"1.5px solid #8b5cf6"}}>
            <div style={{fontSize:"0.7rem",fontWeight:700,color:"#8b5cf6",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Stanford {showNetStanford?"(Net)":"(Gross)"}</div>
            <div style={{fontSize:"1.8rem",fontWeight:900,color:"#8b5cf6"}}>${stanfordAmt.toFixed(2)}</div>
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
                          {includeStanford&&<td style={{padding:"12px 16px",color:"#8b5cf6"}}>{mStanford.length>0?<span>${stanfordTotal.toFixed(2)}<span style={{fontSize:"0.78rem",marginLeft:4,color:"#a78bfa"}}>({mStanford.length})</span></span>:<span style={{color:"#d1d5db"}}>—</span>}</td>}
                          <td style={{padding:"12px 16px",fontWeight:700,color:"#1a3c34"}}>${rowTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{borderTop:"2px solid #e5e7eb",background:"#f9f9f6"}}>
                      <td style={{padding:"12px 16px",fontWeight:800}}>Total</td>
                      <td style={{padding:"12px 16px",fontWeight:700}}>${adjustedLessonEarnings.toFixed(2)}</td>
                      <td style={{padding:"12px 16px",color:"#6b7280",fontWeight:600}}>{(adjustedCalLessons.reduce((s,e)=>s+(e.hours||0),0)+(includeStanford?stanfordEvents.reduce((s,e)=>s+(e.hours||0),0):0)).toFixed(1)}h</td>
                      {includeStanford&&<td style={{padding:"12px 16px",fontWeight:700,color:"#8b5cf6"}}>${stanfordAmt.toFixed(2)}</td>}
                      <td style={{padding:"12px 16px",fontWeight:800,color:"#1a3c34"}}>${totalEarnings.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {financeView!=="year"&&calendarLessons.length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:"#1a3c34",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Calendar Lessons</div>
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                  <thead><tr style={{background:"#f9f9f6",borderBottom:"1.5px solid #e5e7eb"}}>{["Date","Event","Type","Hours","Earnings"].map(h=>(<th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
                  <tbody>
                    {adjustedCalLessons.map((e,i)=>{
                      const calKey=e.date+"|"+e.summary;
                      const isOverridden=calOverrides[calKey]!=null;
                      const isTypeOverridden=calTypeOverrides[calKey]!=null;
                      const openEdit=()=>{editRowRef.current={...e,isCalendar:true,calKey};setEditPriceVal(String(e.earnings));setEditTypeVal(e.type||"");dialogRef.current?.showModal();};
                      return(
                      <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                        <td style={{padding:"12px 16px"}}>{fmtDateShort(e.date)}</td>
                        <td style={{padding:"12px 16px",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</td>
                        <td onClick={openEdit} style={{padding:"12px 16px",cursor:"pointer",userSelect:"none"}} title="Click to edit type"><span style={{background:(typeColors[e.type]||"#666")+"22",color:isTypeOverridden?"#0ea5e9":(typeColors[e.type]||"#666"),padding:"2px 8px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>{e.category}</span>{isTypeOverridden&&<span style={{fontSize:"0.7rem",color:"#0ea5e9",marginLeft:4,opacity:0.7}}>✎</span>}</td>
                        <td style={{padding:"12px 16px"}}>{e.hours}h</td>
                        <td onClick={openEdit} style={{padding:"12px 16px",fontWeight:700,color:isOverridden?"#0ea5e9":"#1a3c34",cursor:"pointer",userSelect:"none"}} title="Click to edit">${typeof e.earnings==="number"?e.earnings.toFixed(2):e.earnings}<span style={{fontSize:"0.7rem",color:isOverridden?"#0ea5e9":"#9ca3af",marginLeft:5,opacity:0.7}}>✎</span></td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {financeView!=="year"&&includeStanford&&stanfordEvents.length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:"#8b5cf6",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Stanford Events</div>
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                  <thead><tr style={{background:"#faf5ff",borderBottom:"1.5px solid #e5e7eb"}}>{["Date","Event","Type","Hours",showNetStanford?"Earnings (Net)":"Earnings (Gross)"].map(h=>(<th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#8b5cf6",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
                  <tbody>
                    {stanfordEvents.map((e,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f3f4f6",background:"#faf5ff"}}>
                        <td style={{padding:"12px 16px"}}>{fmtDateShort(e.date)}</td>
                        <td style={{padding:"12px 16px",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.summary}</td>
                        <td style={{padding:"12px 16px"}}><span style={{background:"#8b5cf622",color:"#8b5cf6",padding:"2px 8px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>{e.category}</span></td>
                        <td style={{padding:"12px 16px"}}>{e.hours}h</td>
                        <td style={{padding:"12px 16px",fontWeight:700,color:"#8b5cf6"}}>${showNetStanford?(e.netEarnings??e.earnings):e.earnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {portalEarnings.rows.length>0&&(
            <div>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:"#1a3c34",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Portal Lessons</div>
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                  <thead><tr style={{background:"#f9f9f6",borderBottom:"1.5px solid #e5e7eb"}}>{["Date","Student","Type","Duration","Income"].map(h=>(<th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
                  <tbody>
                    {portalEarnings.rows.map((r,i)=>{
                      const isCustom=r.customPrice!=null;
                      return(
                      <tr key={i} style={{borderBottom:"1px solid #f3f4f6",background:r.isMenlo?"#f0faf5":"white"}}>
                        <td style={{padding:"12px 16px"}}>{fmtDateShort(r.date)}</td>
                        <td style={{padding:"12px 16px"}}>{r.name}{r.isMenlo&&<span style={{background:"#1a3c34",color:"white",fontSize:"0.65rem",fontWeight:700,padding:"1px 6px",borderRadius:50,marginLeft:6}}>MCC</span>}</td>
                        <td style={{padding:"12px 16px"}}>{r.type}</td>
                        <td style={{padding:"12px 16px"}}>{r.duration}</td>
                        <td onClick={()=>{editRowRef.current=r;setEditPriceVal(String(r.gross));dialogRef.current?.showModal();}} style={{padding:"12px 16px",fontWeight:700,color:isCustom?"#0ea5e9":"#1a3c34",cursor:"pointer",userSelect:"none"}} title="Click to edit">${typeof r.net==="number"?r.net.toFixed(2):r.net}<span style={{fontSize:"0.7rem",color:isCustom?"#0ea5e9":"#9ca3af",marginLeft:5,opacity:0.7}}>✎</span></td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <dialog ref={dialogRef} onClick={e=>{if(e.target===dialogRef.current)dialogRef.current.close();}} style={{border:"none",borderRadius:16,padding:"28px 32px",maxWidth:420,width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}}>
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
            {editRowRef.current&&!editRowRef.current.isCalendar&&<div style={{fontSize:"0.8rem",color:"#9ca3af",marginBottom:20}}>Default: ${getRate(editRowRef.current.type,parseInt(editRowRef.current.duration),editRowRef.current.isMenlo?"menlo":"public").toFixed(2)}</div>}
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
          </dialog>
          {calendarLessons.length===0&&portalEarnings.rows.length===0&&!financeLoading&&(
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
    if(s.includes("stanford"))return"#8b5cf6";
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
        {[["#1a3c34","Private Lesson"],["#0ea5e9","Semi-Private"],["#f97316","Group"],["#8b5cf6","Stanford"],["#6b7280","Other"]].map(([color,label])=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.78rem",color:"#6b7280"}}>
            <div style={{width:10,height:10,borderRadius:2,background:color}}/>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
function AdminPanel({allLessons,onUpdateLesson,onCancelLesson,onDeleteLesson,pendingStudents,onApprove,onDeny,mockUsers,onAddStudent,onAddLesson,onToggleMenlo,onToggleSaturday,onBlockStudent,onRemoveStudent,removedStudents,onRestoreStudent,onBlockRemoved,onToggleGrandfathered}){
  const[tab,setTab]=useState("students");
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
  const[showNialExport,setShowNialExport]=useState(false);
  const[nialStart,setNialStart]=useState("");
  const[nialEnd,setNialEnd]=useState("");
  const[filterCancelled,setFilterCancelled]=useState(false);
  const[editingId,setEditingId]=useState(null);const[editPriceId,setEditPriceId]=useState(null);const[editPriceVal,setEditPriceVal]=useState("");
  const[editNotes,setEditNotes]=useState("");
  const[confirmCancel,setConfirmCancel]=useState(null);const[confirmDelete,setConfirmDelete]=useState(null);const[confirmDeleteStudent,setConfirmDeleteStudent]=useState(false);const[confirmCalDelete,setConfirmCalDelete]=useState(null);const[calDeleteLoading,setCalDeleteLoading]=useState(false);
  const[deleteLoading,setDeleteLoading]=useState(false);const[deletedToast,setDeletedToast]=useState(false);
  const[cancelLoading,setCancelLoading]=useState(false);
  const[coachRatingInput,setCoachRatingInput]=useState("");
  const[ratingNoteInput,setRatingNoteInput]=useState("");
  const[ratingHistories,setRatingHistories]=useState({});// keyed by student email
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
  const[confirmDeleteLogin,setConfirmDeleteLogin]=useState(null); // email being confirmed for deletion
  const[showCalendar,setShowCalendar]=useState(true);
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
    lessons.map(l=>({...l,studentEmail:email,studentName:mockUsers[email]?.name||email,isMenlo:mockUsers[email]?.memberType==="menlo"}))
  ).sort((a,b)=>new Date(b.date)-new Date(a.date));

  // GCal event IDs that belong to portal lessons — used to deduplicate calendar views
  const portalGcalIds=new Set(allLessonsList.filter(l=>l.gcalEventId).map(l=>l.gcalEventId));

  const cancelledStatuses2=["cancelled","late_cancel","cancelled_forgiven"];

  const fetchCalendarItems=async()=>{
    setCalLoading(true);
    try{
      const past=toDS(addDays(new Date(),-180));
      const future=toDS(addDays(new Date(),90));
      const r=await fetch("/api/earnings-calendar?start="+past+"&end="+future+"&includeFuture=true&includeStanford=true");
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
  const SCHED_PRICES={private:{60:schedIsMenlo?115:120,90:schedIsMenlo?172.50:180},semi:{60:schedIsMenlo?120:140,90:schedIsMenlo?180:210},group:{60:140,90:210}};

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
    const lessonLabel=schedLessonType==="private"?"Private":schedLessonType==="semi"?"Semi-Private":"Group";
    const schedPartnerFull=(schedPartner.firstName+" "+schedPartner.lastName).trim();
    const memberNames=schedLessonType==="semi"?[student.name,schedPartnerFull]:schedLessonType==="group"?[student.name,...schedGroupMembers.slice(0,schedGroupSize-1).map(m=>(m.firstName+" "+m.lastName).trim())]:[student.name];
    const titleSuffix=schedLessonType==="group"?" pb group lesson":" pb lesson";
    const summary=memberNames.join("/")+titleSuffix;
    const location=customLocation&&schedLocation?schedLocation:(!schedIsMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063, USA":"Menlo Circus Club, 190 Park Ln, Atherton, CA 94027");
    const ticketId2=generateTicket();
    const description="Ticket: "+ticketId2+"\nStudent: "+student.name+"\nEmail: "+selectedStudent+"\nType: "+lessonLabel+" "+schedDuration+"min\nFocus: "+(schedFocus||"Not specified")+"\nNotes: "+(schedNotes||"None")+"\nLocation: "+location+"\nManage: https://dmpickleball.com";
    let eventId="";
    try{
      const r=await fetch("/api/create-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary,description,date:schedDate,startTime,endTime,location,studentEmail:selectedStudent,studentName:student.name})});
      const d=await r.json();
      if(d.eventId)eventId=d.eventId;
    }catch(e){console.error("GCal:",e);}
    const startISO=schedDate+"T"+startTime+":00";
    const endISO=schedDate+"T"+endTime+":00";
    const link="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(summary)+"&dates="+startISO.replace(/[-:]/g,"").slice(0,15)+"/"+endISO.replace(/[-:]/g,"").slice(0,15)+"&details="+encodeURIComponent(description)+"&location="+encodeURIComponent(location);
    const sendEmail2=(to,subject,text,replyTo,calLink,fromAlias)=>{const html=makeEmailHtml(text,calLink);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,...(replyTo?{replyTo}:{}),...(fromAlias?{fromAlias}:{})})}).catch(()=>{});};
    const partnerInfo2=schedLessonType==="semi"&&schedPartnerFull?"\nPartner: "+schedPartnerFull+(schedPartner.email?" ("+schedPartner.email+")":""):"";
    const groupInfo2=schedLessonType==="group"&&schedGroupMembers.slice(0,schedGroupSize-1).some(m=>m.firstName)?"\nGroup: "+schedGroupMembers.slice(0,schedGroupSize-1).filter(m=>m.firstName).map(m=>(m.firstName+" "+m.lastName).trim()+(m.email?" ("+m.email+")":"")).join(", "):"";
    const schedPriceTotal=schedCustomPrice?parseFloat(schedCustomPrice):SCHED_PRICES[schedLessonType][schedDuration];
    const schedPriceNote=!schedCustomPrice&&schedLessonType==="semi"?" ($"+(schedPriceTotal/2)+"/person)":!schedCustomPrice&&schedLessonType==="group"?" (split equally)":"";
    const schedStudentText="Hi "+student.name+",\n\nCoach David has scheduled a lesson for you!\n\nRef: "+ticketId2+"\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+schedDuration+" min\nPrice: $"+schedPriceTotal+" total"+schedPriceNote+"\nFocus: "+(schedFocus||"Not specified")+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";
    await sendEmail2(selectedStudent,"Your lesson is booked - "+fmtDateShort(schedDate),schedStudentText,"book@dmpickleball.com",link,"book@dmpickleball.com");
    const schedAdminText="You scheduled a lesson!\n\nRef: "+ticketId2+"\nStudent: "+student.name+"\nEmail: "+selectedStudent+"\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+schedDuration+" min\nPrice: $"+schedPriceTotal+" total"+schedPriceNote+"\nFocus: "+(schedFocus||"Not specified")+partnerInfo2+groupInfo2+"\nLocation: "+location;
    await sendEmail2("david@dmpickleball.com","Scheduled: "+summary+" - "+fmtDateShort(schedDate),schedAdminText,selectedStudent,null,"noreply@dmpickleball.com");
    if(schedLessonType==="semi"&&schedPartner.email){const schedPartnerText="Hi "+schedPartnerFull+",\n\n"+student.name+" has added you to a pickleball lesson with Coach David!\n\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: Semi-Private · "+schedDuration+" min\nFocus: "+(schedFocus||"Not specified")+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail2(schedPartner.email,"You've been added to a pickleball lesson - "+fmtDateShort(schedDate),schedPartnerText,"book@dmpickleball.com",link,"book@dmpickleball.com");}
    if(schedLessonType==="group"){for(const m of schedGroupMembers.slice(0,schedGroupSize-1)){if(m.email){const mFull=(m.firstName+" "+m.lastName).trim();const schedGroupText="Hi "+mFull+",\n\n"+student.name+" has added you to a group pickleball lesson with Coach David!\n\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nLocation: "+location+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398";await sendEmail2(m.email,"You've been added to a group pickleball lesson - "+fmtDateShort(schedDate),schedGroupText,"book@dmpickleball.com",link,"book@dmpickleball.com");}}}
    const finalPrice=schedCustomPrice?parseFloat(schedCustomPrice):null;
    const newLesson={id:Date.now(),date:schedDate,time:timeStr,type:lessonLabel,duration:schedDuration+" min",status:"confirmed",focus:schedFocus,notes:"",photos:[],videos:[],gcalEventId:eventId,ticketId:ticketId2,customPrice:finalPrice,partnerEmail:schedLessonType==="semi"?schedPartner.email:"",members:memberNames.slice(1)};
    onAddLesson(selectedStudent,newLesson);
    setShowSchedule(false);
    setScheduleStep(1);setSchedLessonType("private");setSchedDuration(60);setSchedDate("");setSchedSlot(null);setSchedSlotIdx(-1);setSchedFocus("");setSchedNotes("");setSchedBusyTimes([]);setSchedCustomPrice("");setSchedQuickMins(null);setSchedPartner({name:"",email:""});setSchedGroupMembers([{name:"",email:""},{name:"",email:""},{name:"",email:""},{name:"",email:""}]);setSchedGroupSize(3);
    setSchedSubmitting(false);
    alert("Lesson scheduled for "+student.name+"!");
  };

  const exportNial=()=>{
    if(!nialStart||!nialEnd){alert("Please select a date range.");return;}
    const start=new Date(nialStart+"T00:00:00");
    const end=new Date(nialEnd+"T23:59:59");
    const rows=[];
    Object.entries(allLessons).forEach(([email,lessons])=>{
      const u=mockUsers[email]||{};
      if(u.memberType!=="menlo")return;
      lessons.filter(l=>l.status!=="cancelled"&&l.status!=="cancelled_forgiven"&&(l.status==="late_cancel"||isPast(l.date,l.time)||l.status==="completed")).forEach(l=>{
        const d=new Date(l.date+"T12:00:00");
        if(d<start||d>end)return;
        const mins=parseInt(l.duration)||60;
        const gross=getRate(l.type,mins,"menlo");
        const net=getMenloNet(gross);
        rows.push({name:u.name||email,date:l.date,type:l.type,duration:l.duration,gross,net});
      });
    });
    if(!rows.length){alert("No Menlo lessons in that range.");return;}
    const lines=["Date,Student,Type,Duration,Gross,David 70%",...rows.map(r=>r.date+","+r.name+","+r.type+","+r.duration+",$"+r.gross+",$"+r.net)];
    const blob=new Blob([lines.join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="menlo_"+nialStart+"_to_"+nialEnd+".csv";a.click();
  };

  return(
    <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
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

      <div style={{display:"flex",gap:0,borderBottom:"2px solid #e5e7eb",marginBottom:28,flexWrap:"wrap"}}>
        {[["students","Students"],["lessons","Lessons"],["finances","Finances"]].map(([t,label])=>(
          <button key={t} onClick={()=>{setTab(t);setSelectedStudent(null);setShowSchedule(false);}}
            style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t?G:"transparent"),marginBottom:-2,padding:"10px 20px",fontSize:"0.88rem",fontWeight:tab===t?700:500,color:tab===t?G:"#6b7280",cursor:"pointer"}}>
            {label}
            {t==="students"&&pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"1px 7px",fontSize:"0.7rem",fontWeight:800,marginLeft:6}}>{pendingStudents.length}</span>}
          </button>
        ))}
      </div>

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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <input placeholder="🔍 Search students..." value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} style={{...inp,marginBottom:0,maxWidth:300,flex:1}}/>
              <button onClick={()=>setShowAddStudent(!showAddStudent)} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>+ Add Student</button>
            </div>
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
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {u.memberType==="menlo"&&<span style={{background:G,color:"white",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>MCC</span>}
                      {u.grandfathered&&<span style={{background:"#fef3c7",color:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>GF</span>}
                      {u.blocked&&<span style={{background:"#dc2626",color:"white",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>Blocked</span>}
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
          <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"24px",marginBottom:20}}>
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
                const r=await fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:selectedStudent,updates:{name:fullName,first_name:firstName,last_name:lastName,comm_email:(editStudentData.commEmail||"").toLowerCase(),phone:editStudentData.phone||"",city:editStudentData.city||"",home_court:editStudentData.homeCourt||"",skill_level:editStudentData.duprRating?"":editStudentData.skillLevel||"",dupr_rating:editStudentData.duprRating||""}})});
                if(!r.ok)throw new Error("Save failed");
                onAddStudent({name:fullName,firstName,lastName,commEmail:(editStudentData.commEmail||"").toLowerCase(),phone:editStudentData.phone||"",city:editStudentData.city||"",homeCourt:editStudentData.homeCourt||"",skillLevel:editStudentData.duprRating?"":editStudentData.skillLevel||"",duprRating:editStudentData.duprRating||"",email:selectedStudent,memberType:mockUsers[selectedStudent]?.memberType||"public"});
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
                    setEditStudentData({name:u.name||"",firstName:u.firstName||parsedFirst,lastName:u.lastName||parsedLast,commEmail:u.commEmail||"",phone:u.phone||"",city:u.city||"",homeCourt:u.homeCourt||"",skillLevel:u.skillLevel||"",duprRating:u.duprRating||""});
                    setStudentSaveStatus("idle");
                    setEditingStudent(true);}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>✏️ Edit</button>
                )}
                <button onClick={()=>setShowSchedule(true)} style={{background:G,color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>+ Schedule Lesson</button>
              </div>
            </div>
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
              fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},
                body:JSON.stringify({email:selectedStudent,updates:{coach_rating:val,rating_history:JSON.stringify(updated)}})}).catch(()=>{});
              setCoachRatingInput("");setRatingNoteInput("");
            };
            const deleteEntry=(id)=>{
              const updated=history.filter(e=>e.id!==id);
              setRatingHistories(prev=>({...prev,[selectedStudent]:updated}));
              const newCurrent=updated.length>0?updated[updated.length-1].rating:null;
              fetch("/api/students?action=update",{method:"POST",headers:{"Content-Type":"application/json"},
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
                {/* DUPR placeholder */}
                <div style={{marginTop:12,padding:"8px 12px",background:"#f0f4ff",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{background:"#0a1551",color:"white",fontWeight:900,fontSize:"0.68rem",letterSpacing:1.5,padding:"2px 7px",borderRadius:4}}>DUPR</span>
                  <span style={{fontSize:"0.75rem",color:"#6b7280"}}>DUPR integration coming soon — link student accounts to sync ratings automatically.</span>
                </div>
              </div>
            );
          })()}
          {/* ─────────────────────────────────────────────────────────── */}

          <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Lesson History</div>
          {(allLessons[selectedStudent]||[]).length===0&&<div style={{color:"#9ca3af",fontSize:"0.9rem",textAlign:"center",padding:"32px"}}>No lessons yet.</div>}
          {(allLessons[selectedStudent]||[]).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>{
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
                  {l.customPrice&&<div style={{fontSize:"0.75rem",color:"#0ea5e9",marginTop:2,fontWeight:600}}>💰 Custom: ${l.customPrice}</div>}
                  {l.notes&&editingId!==l.id&&<div style={{background:"#f9f9f6",borderRadius:6,padding:"7px 10px",marginTop:8,fontSize:"0.82rem",color:"#374151",lineHeight:1.5}}>{l.notes}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  {missingCal&&!isCancelled&&<span title="No linked Google Calendar event" style={{background:"#fff7ed",color:"#c2410c",border:"1px solid #fed7aa",padding:"2px 7px",borderRadius:50,fontSize:"0.65rem",fontWeight:700}}>⚠️ No Cal</span>}
                  <span style={{background:l.status==="confirmed"?"#e8f0ee":l.status==="late_cancel"?"#fff7ed":l.status==="cancelled_forgiven"?"#f3f4f6":l.status==="cancelled"?"#fef2f2":"#fffbea",color:l.status==="confirmed"?G:l.status==="late_cancel"?"#c2410c":l.status==="cancelled_forgiven"?"#6b7280":l.status==="cancelled"?"#dc2626":"#92400e",padding:"3px 9px",borderRadius:50,fontSize:"0.72rem",fontWeight:700}}>
                    {l.status==="confirmed"?"✓ Confirmed":l.status==="cancelled"?l.cancelledByGcal?"📅 Removed from Calendar":"✕ Cancelled":l.status==="late_cancel"?"⚠️ Late Cancel":l.status==="cancelled_forgiven"?"✓ Forgiven":"⏳ Pending"}
                  </span>
                  {l.status==="late_cancel"&&<button onClick={()=>onUpdateLesson(selectedStudent,l.id,{status:"cancelled_forgiven"})} style={{background:"white",color:"#6b7280",border:"1.5px solid #d1d5db",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>✓ Forgive</button>}
                  <button onClick={()=>setActiveMenu(isMenuOpen?null:smk)} style={{background:isMenuOpen?"#f3f4f6":"white",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:"1rem",lineHeight:1,color:"#6b7280",fontWeight:700}}>⋯</button>
                </div>
              </div>
              {/* ⋯ action menu */}
              {isMenuOpen&&(
                <div style={{borderTop:"1px solid #f3f4f6",background:"#fafafa",padding:"10px 18px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <button onClick={()=>{setEditingId(editingId===l.id?null:l.id);setEditNotes(l.notes||"");setActiveMenu(null);}} style={{background:G,color:"white",border:"none",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✏️ Notes</button>
                  <button onClick={()=>{setEditPriceId(editPriceId===l.id?null:l.id);setEditPriceVal(String(l.customPrice||getRate(l.type,parseInt(l.duration))));setActiveMenu(null);}} style={{background:G,color:"white",border:"none",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>💰 Price</button>
                  {!isCancelled&&<button onClick={()=>{setConfirmCancel(l.id);setActiveMenu(null);}} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✕ Cancel</button>}
                  <button onClick={()=>{setConfirmDelete(l.id);setActiveMenu(null);}} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>🗑 Delete</button>
                  <span style={{flex:1}}/>
                  <button onClick={()=>setActiveMenu(null)} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:"0.8rem"}}>Close</button>
                </div>
              )}
              {/* Cancel confirm */}
              {confirmCancel===l.id&&(
                <div style={{background:"#fef2f2",borderTop:"1px solid #fca5a5",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <span style={{fontWeight:700,color:"#991b1b",fontSize:"0.88rem"}}>Cancel this lesson?</span>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setConfirmCancel(null)} disabled={cancelLoading} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600,opacity:cancelLoading?0.5:1}}>Keep it</button>
                    <button onClick={async()=>{setCancelLoading(true);await onCancelLesson(selectedStudent,l.id);setCancelLoading(false);setConfirmCancel(null);}} disabled={cancelLoading} style={{background:cancelLoading?"#9ca3af":"#dc2626",color:"white",border:"none",padding:"6px 14px",borderRadius:50,cursor:cancelLoading?"not-allowed":"pointer",fontSize:"0.82rem",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                      {cancelLoading&&<span style={{display:"inline-block",width:12,height:12,border:"2px solid white",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>}
                      {cancelLoading?"Cancelling...":"Yes, Cancel"}
                    </button>
                  </div>
                </div>
              )}
              {/* Delete confirm */}
              {confirmDelete===l.id&&(
                <div style={{background:"#fef2f2",borderTop:"2px solid #dc2626",padding:"16px 18px"}}>
                  <div style={{fontWeight:800,color:"#991b1b",fontSize:"0.95rem",marginBottom:4}}>🗑 Delete this lesson?</div>
                  <div style={{fontSize:"0.82rem",color:"#b91c1c",marginBottom:12,fontWeight:600}}>⚠️ This is permanent and cannot be undone. The calendar event will also be removed.</div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setConfirmDelete(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Keep it</button>
                    <button onClick={()=>{
                      // Remove from UI immediately — API calls fire in background
                      onDeleteLesson(selectedStudent,l.id);
                      setConfirmDelete(null);setDeletedToast(true);setTimeout(()=>setDeletedToast(false),3000);
                      if(l.gcalEventId){fetch("/api/cancel-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:l.gcalEventId,mode:"delete"})}).catch(e=>console.error("GCal delete failed:",e));}
                      fetch("/api/lessons?action=delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id})}).catch(e=>console.error("DB delete failed:",e));
                      // Admin-only notification — no email to student on delete
                      fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:"david@dmpickleball.com",subject:"Deleted: "+(mockUsers[selectedStudent]?.name||selectedStudent)+" - "+fmtDateShort(l.date),text:"You permanently deleted a lesson.\n\nStudent: "+(mockUsers[selectedStudent]?.name||selectedStudent)+"\nDate: "+fmtDate(l.date)+"\nTime: "+(l.time||"")+"\nType: "+(l.type||""),fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});
                    }} style={{background:"#dc2626",color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>
                      Yes, Delete Permanently
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
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                {[
                  {id:"private",icon:"🎯",label:"Private",total:SCHED_PRICES["private"][schedDuration],note:""},
                  {id:"semi",icon:"👥",label:"Semi-Private",total:SCHED_PRICES["semi"][schedDuration],note:"$"+(SCHED_PRICES["semi"][schedDuration]/2)+"/person"},
                  {id:"group",icon:"🏆",label:"Group",total:SCHED_PRICES["group"][schedDuration],note:"split equally"}
                ].map(l=>(
                  <div key={l.id} onClick={()=>setSchedLessonType(l.id)} style={{background:schedLessonType===l.id?"#e8f0ee":"white",border:"2px solid "+(schedLessonType===l.id?G:"#e5e7eb"),borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{l.icon}</div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",color:schedLessonType===l.id?G:"#1a1a1a"}}>{l.label}</div>
                    <div style={{fontWeight:800,color:G,fontSize:"0.95rem",marginTop:4}}>${l.total} total</div>
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
              {schedLessonType==="group"&&(
                <div>
                  <div style={{...lbl,marginBottom:8}}>Group Size</div>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    {[3,4,5].map(n=>(
                      <div key={n} onClick={()=>setSchedGroupSize(n)} style={{background:schedGroupSize===n?"#e8f0ee":"white",border:"2px solid "+(schedGroupSize===n?G:"#e5e7eb"),borderRadius:10,padding:"10px 18px",cursor:"pointer",fontWeight:700,color:schedGroupSize===n?G:"#374151",fontSize:"0.9rem"}}>
                        {n} players
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
                  {schedLessonType==="group"&&schedGroupMembers.slice(0,schedGroupSize-1).filter(m=>m.firstName).length>0&&<div>Group: {schedGroupMembers.slice(0,schedGroupSize-1).map(m=>(m.firstName+" "+m.lastName).trim()).filter(Boolean).join(", ")}</div>}
                  <div>{fmtDate(schedDate)}</div>
                  <div>{schedSlot&&toTimeStr(schedSlot.s,schedSlot.e)}</div>
                  <div>{schedLessonType==="private"?"Private":schedLessonType==="semi"?"Semi-Private":"Group"} · {schedDuration} min</div>
                  {schedFocus&&<div style={{color:G,fontWeight:600}}>Focus: {schedFocus}</div>}
                  <div>{schedCustomPrice?"$"+schedCustomPrice+" (custom)":"$"+SCHED_PRICES[schedLessonType][schedDuration]+" total"}{!schedCustomPrice&&schedLessonType==="semi"?" ($"+(SCHED_PRICES[schedLessonType][schedDuration]/2)+"/person)":!schedCustomPrice&&schedLessonType==="group"?" (split equally)":""}</div>
                  <div>{customLocation&&schedLocation?schedLocation:(!schedIsMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Menlo Circus Club, Atherton")}</div>
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
                <button onClick={()=>{setConfirmDelete(mk);setActiveMenu(null);}} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>🗑 Delete Lesson</button>
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
            {/* Delete confirm */}
            {confirmDelete===mk&&(
              <div style={{background:"#fef2f2",borderTop:"2px solid #dc2626",padding:"16px 18px"}}>
                <div style={{fontWeight:800,color:"#991b1b",fontSize:"0.95rem",marginBottom:4}}>🗑 Delete this lesson?</div>
                <div style={{fontSize:"0.82rem",color:"#b91c1c",marginBottom:12,fontWeight:600}}>⚠️ This is permanent and cannot be undone. The calendar event will also be removed.</div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button onClick={()=>setConfirmDelete(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Keep it</button>
                  <button onClick={()=>{
                    // Remove from UI immediately — API calls fire in background
                    onDeleteLesson(l.studentEmail,l.id);
                    setConfirmDelete(null);setDeletedToast(true);setTimeout(()=>setDeletedToast(false),3000);
                    if(l.gcalEventId){fetch("/api/cancel-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:l.gcalEventId,mode:"delete"})}).catch(e=>console.error("GCal delete failed:",e));}
                    fetch("/api/lessons?action=delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:l.id})}).catch(e=>console.error("DB delete failed:",e));
                    // Admin-only notification — no email to student on delete
                    fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:"david@dmpickleball.com",subject:"Deleted: "+(mockUsers[l.studentEmail]?.name||l.studentEmail)+" - "+fmtDateShort(l.date),text:"You permanently deleted a lesson.\n\nStudent: "+(mockUsers[l.studentEmail]?.name||l.studentEmail)+"\nDate: "+fmtDate(l.date)+"\nTime: "+(l.time||"")+"\nType: "+(l.type||""),fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});
                  }} style={{background:"#dc2626",color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>
                    Yes, Delete Permanently
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
                  {e.gcalEventId&&!isStanford&&!isMenlo&&(
                    <button onClick={()=>setConfirmCalDelete(isConfirmingCalDel?null:e.gcalEventId)} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"4px 10px",borderRadius:50,cursor:"pointer",fontSize:"0.75rem",fontWeight:700}}>🗑</button>
                  )}
                </div>
              </div>
              {isConfirmingCalDel&&(
                <div style={{background:"#fef2f2",borderTop:"2px solid #dc2626",padding:"14px 18px"}}>
                  <div style={{fontWeight:800,color:"#991b1b",fontSize:"0.9rem",marginBottom:3}}>🗑 Remove from Google Calendar?</div>
                  <div style={{fontSize:"0.8rem",color:"#b91c1c",marginBottom:10,fontWeight:600}}>⚠️ This is a manual calendar event — it will be permanently deleted from Google Calendar.</div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setConfirmCalDelete(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>Keep it</button>
                    <button disabled={calDeleteLoading} onClick={async()=>{
                      setCalDeleteLoading(true);
                      try{await fetch("/api/cancel-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:e.gcalEventId,mode:"delete"})});}
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
        const dayCalItems=(day)=>showCalendar?calendarItems.filter(e=>e.date===day&&!portalGcalIds.has(e.gcalEventId)):[];
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
              {[["day","Day"],["week","Week"],["month","Month"],["upcoming","Upcoming"],["events","Events"]].map(([v,lbl])=>(
                <button key={v} onClick={()=>{setUpcomingView(v);if(v==="day")setSelectedDay(todayStr);if(v==="events"&&eventsData.length===0&&!eventsLoading){const s=toDS(new Date());const e=toDS(addDays(new Date(),90));setEventsLoading(true);fetch("/api/calendar-events?start="+s+"&end="+e+"&keywords=rental,tournament").then(r=>r.json()).then(d=>{setEventsData(d.events||[]);setEventsLoading(false);}).catch(()=>setEventsLoading(false));}}} style={{background:upcomingView===v?"white":"transparent",color:upcomingView===v?G:"#6b7280",border:"none",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:"0.85rem",fontWeight:upcomingView===v?700:500,boxShadow:upcomingView===v?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>{lbl}</button>
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
              {/* Filter pills — hidden in Upcoming/Events view */}
              {upcomingView!=="upcoming"&&upcomingView!=="events"&&<button onClick={()=>setFilterCancelled(p=>!p)} style={{background:filterCancelled?"#fef2f2":"white",color:filterCancelled?"#dc2626":"#6b7280",border:"1.5px solid "+(filterCancelled?"#fca5a5":"#e5e7eb"),padding:"5px 13px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:filterCancelled?700:500}}>
                {filterCancelled?"✕ Hide Cancelled":"Show Cancelled"}
              </button>}
              {upcomingView!=="events"&&<button onClick={()=>setShowCalendar(p=>!p)} style={{background:showCalendar?"#e8f0ee":"white",color:showCalendar?G:"#6b7280",border:"1.5px solid "+(showCalendar?G:"#e5e7eb"),padding:"5px 13px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:showCalendar?700:500}}>
                {calLoading?<span style={{display:"inline-block",width:10,height:10,border:"2px solid "+G,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",verticalAlign:"middle",marginRight:4}}/>:"📅 "}{showCalendar?"Cal On":"Cal Off"}
              </button>}
              {upcomingView==="events"&&<button onClick={()=>{const s=toDS(new Date());const e=toDS(addDays(new Date(),90));setEventsLoading(true);fetch("/api/calendar-events?start="+s+"&end="+e+"&keywords=rental,tournament").then(r=>r.json()).then(d=>{setEventsData(d.events||[]);setEventsLoading(false);}).catch(()=>setEventsLoading(false));}} style={{background:"white",color:G,border:"1.5px solid "+G,padding:"5px 13px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:600}}>↺ Refresh</button>}
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
            const calFwd=showCalendar?calendarItems.filter(c=>!c.isPickup&&new Date(c.date+"T12:00:00")>=todayDT&&!portalGcalIds.has(c.gcalEventId)):[];
            const merged2=[
              ...portalFwd.map(l=>({...l,_type:"portal",_isPast:isPast(l.date,l.time),_sortKey:l.date+(l.time||"")})),
              ...calFwd.map((c,i)=>({...c,_type:"cal",_idx:i,_isPast:isCalPast(c),_sortKey:c.date+(c.startTime||"")}))
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
                            {item._type==="portal"?LessonRow(item):CalRow(item,item._idx??i)}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── EVENTS view ────────────────────────────────────────────── */}
          {upcomingView==="events"&&(()=>{
            if(eventsLoading)return(
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>
                <span style={{display:"inline-block",width:18,height:18,border:"2px solid "+G,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",verticalAlign:"middle",marginRight:8}}/>
                Loading events…
              </div>
            );
            if(eventsData.length===0)return(
              <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:"2rem",marginBottom:12}}>🏆</div>
                <div style={{fontWeight:700,color:"#374151",marginBottom:6}}>No Upcoming Events</div>
                <div style={{color:"#9ca3af",fontSize:"0.85rem"}}>No rentals or tournaments found in the next 3 months.</div>
              </div>
            );
            // Group by date
            const evByDate={};
            eventsData.forEach(e=>{if(!evByDate[e.date])evByDate[e.date]=[];evByDate[e.date].push(e);});
            const evDates=Object.keys(evByDate).sort();
            return(
              <div>
                <div style={{fontSize:"0.78rem",color:"#9ca3af",marginBottom:16}}>{eventsData.length} event{eventsData.length!==1?"s":""} · next 3 months</div>
                {evDates.map(day=>{
                  const isToday2=day===todayStr;
                  const dObj=new Date(day+"T12:00:00");
                  const dayLabel2=isToday2?"Today — "+dObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}):dObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
                  return(
                    <div key={day} style={{marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <div style={{fontWeight:800,fontSize:"0.8rem",color:isToday2?G:"#374151",textTransform:"uppercase",letterSpacing:1}}>{dayLabel2}</div>
                        {isToday2&&<span style={{background:G,color:"white",fontSize:"0.65rem",fontWeight:800,padding:"1px 8px",borderRadius:50}}>TODAY</span>}
                      </div>
                      {evByDate[day].map((ev,i)=>{
                        const isTournament=(ev.summary||"").toLowerCase().includes("tournament");
                        const isRental=(ev.summary||"").toLowerCase().includes("rental");
                        const tagBg=isTournament?"#fef3c7":isRental?"#e0f2fe":"#f3f4f6";
                        const tagColor=isTournament?"#92400e":isRental?"#075985":"#374151";
                        const tagLabel=isTournament?"🏆 Tournament":isRental?"🎾 Rental":"📅 Event";
                        return(
                          <div key={i} style={{background:"white",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:14}}>
                            <div style={{background:tagBg,borderRadius:8,padding:"8px 14px",minWidth:80,textAlign:"center",flexShrink:0}}>
                              <div style={{fontSize:"0.65rem",fontWeight:700,color:tagColor,textTransform:"uppercase",letterSpacing:0.5}}>{isTournament?"TOURN":"RENTAL"}</div>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:"0.92rem",color:"#1a1a1a",marginBottom:2}}>{ev.summary}</div>
                              {(ev.startTime||ev.endTime)&&<div style={{fontSize:"0.8rem",color:"#6b7280"}}>{ev.startTime}{ev.endTime&&ev.endTime!==ev.startTime?" – "+ev.endTime:""}</div>}
                              {ev.location&&<div style={{fontSize:"0.75rem",color:"#9ca3af",marginTop:2}}>📍 {ev.location}</div>}
                            </div>
                            <span style={{background:tagBg,color:tagColor,fontSize:"0.7rem",fontWeight:800,padding:"3px 10px",borderRadius:50,flexShrink:0}}>{tagLabel}</span>
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
          onExportNial={exportNial}
          showNialExport={showNialExport}
          setShowNialExport={setShowNialExport}
          nialStart={nialStart}
          setNialStart={setNialStart}
          nialEnd={nialEnd}
          setNialEnd={setNialEnd}
        />
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const isAdminRoute=window.location.pathname==="/admin";
  const[page,setPage]=useState(isAdminRoute?"adminlogin":"home");
  const[user,setUser]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[allLessons,setAllLessons]=useState({});
  const[pendingStudents,setPendingStudents]=useState([]);
  const[mockUsersState,setMockUsersState]=useState({});
  const[removedStudents,setRemovedStudents]=useState([]);
  const[dbLoaded,setDbLoaded]=useState(false);
  const[locations,setLocations]=useState([]);

  useEffect(()=>{
    const loadFromSupabase=async()=>{
      try{
        const [pr,lr,sr,locr,xr]=await Promise.all([
          fetch("/api/students?action=pending").then(r=>r.json()).catch(()=>({})),
          fetch("/api/lessons?action=list").then(r=>r.json()).catch(()=>({})),
          fetch("/api/students?action=list").then(r=>r.json()).catch(()=>({})),
          fetch("/api/locations?action=list").then(r=>r.json()).catch(()=>({})),
          fetch("/api/students?action=list-deleted").then(r=>r.json()).catch(()=>({})),
        ]);
        if(pr.requests){
          setPendingStudents(pr.requests.map(r=>({
            id:r.id,name:r.name,email:r.email,
            firstName:r.first_name||"",lastName:r.last_name||"",
            commEmail:r.comm_email||"",
            phone:r.phone,homeCourt:r.home_court,
            skillLevel:r.skill_level||"",duprRating:r.dupr_rating||"",
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
              memberType:s.member_type||"public",
              approved:s.approved,
              blocked:s.blocked,
              grandfathered:!!(s.grandfathered),
              phone:s.phone||"",
              city:s.city||"",
              homeCourt:s.home_court||"",
              picture:s.picture||"",
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
                customPrice:l.custom_price??null
              });
            });
          }
          // ── GCal cross-reference ─────────────────────────────────────────────
          // Collect gcalEventIds from upcoming portal lessons (status not already resolved)
          const RESOLVED=new Set(["completed","cancelled","late_cancel"]);
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
  const cancelLesson=async(id)=>{
    const lesson=userLessons.find(l=>l.id===id);
    // Optimistic update immediately so UI reflects change right away
    const cancelNow=new Date();const lDeadline=new Date(getLessonStart(lesson.date,lesson.time).getTime()-12*60*60*1000);const withinGrace=lesson.createdAt&&((cancelNow-new Date(lesson.createdAt))/60000)<15;const cancelStatus=(!withinGrace&&cancelNow>lDeadline)?"late_cancel":"cancelled";
    setAllLessons(prev=>({...prev,[user.email]:prev[user.email].map(l=>l.id===id?{...l,status:cancelStatus}:l)}));
    // GCal removal — await this so calendar is cleaned up before modal closes
    if(lesson?.gcalEventId){
      try{await fetch('/api/cancel-booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:lesson.gcalEventId,mode:"delete"})});}
      catch(e){console.error('Calendar cancel failed:',e);}
    }
    // Emails and DB update fire in background — don't block the UI
    const sendEmail3=(to,subject,text,fromAlias)=>{const html=makeCancelEmailHtml(text);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,...(fromAlias?{fromAlias}:{})})}).catch(()=>{});};
    const cancelLocation=user.memberType==="menlo"?"Stanford Redwood City":"Andrew Spinas Park, 3003 Bay Rd, Redwood City";
    const cancelDetails=(lesson.ticketId?"\nRef: "+lesson.ticketId:"")+"\nDate: "+fmtDate(lesson.date)+"\nTime: "+lesson.time+"\nType: "+lesson.type+(lesson.duration?" · "+lesson.duration:"")+"\nLocation: "+cancelLocation+(lesson.focus?"\nFocus: "+lesson.focus:"")+(lesson.members&&lesson.members.length>0?"\nWith: "+lesson.members.join(", "):"");
    const cancelMsg="Your pickleball lesson has been cancelled.\n"+cancelDetails+"\n\nIf you have any questions, reply to this email or contact Coach David at (650) 839-3398.\n\nDavid Mok\n(650) 839-3398";
    const partnerMsg="A pickleball lesson you were part of has been cancelled.\n"+cancelDetails+"\n\nIf you have any questions, please contact Coach David at (650) 839-3398.\n\nDavid Mok\n(650) 839-3398";
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
    setAllLessons(prev=>({...prev,[email]:(prev[email]||[]).filter(x=>x.id!==id)}));
  };
  const adminCancel=async(email,id)=>{
    const lesson=(allLessons[email]||[]).find(l=>l.id===id);
    if(lesson?.gcalEventId){
      try{
        await fetch("/api/cancel-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:lesson.gcalEventId,mode:"delete"})});
      }catch(e){console.error("Admin GCal cancel failed:",e);}
    }
    const cancelNow2=new Date();const lDeadline2=new Date(getLessonStart(lesson.date,lesson.time).getTime()-12*60*60*1000);const withinGrace2=lesson.createdAt&&((cancelNow2-new Date(lesson.createdAt))/60000)<15;const cancelStatus2=(!withinGrace2&&cancelNow2>lDeadline2)?"late_cancel":"cancelled";
    setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,status:cancelStatus2}:l)}));
    try{await fetch("/api/lessons?action=update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:id,updates:{status:cancelStatus2,cancelled_by:"admin",cancelled_at:cancelNow2.toISOString()}})});}catch(e){console.error("Update lesson status error:",e);}
    // Send cancellation emails
    const sendCancelEmail=(to,subject,text)=>{const html=makeCancelEmailHtml(text);return fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,text,html,fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});};
    const studentName=mockUsersState[email]?.name||email;
    const adminCancelLocation=mockUsersState[email]?.memberType==="menlo"?"Stanford Redwood City":"Andrew Spinas Park, 3003 Bay Rd, Redwood City";
    const adminCancelDetails=(lesson.ticketId?"\nRef: "+lesson.ticketId:"")+"\nDate: "+fmtDate(lesson.date)+"\nTime: "+lesson.time+"\nType: "+lesson.type+(lesson.duration?" · "+lesson.duration:"")+"\nLocation: "+adminCancelLocation+(lesson.focus?"\nFocus: "+lesson.focus:"")+(lesson.members&&lesson.members.length>0?"\nWith: "+lesson.members.join(", "):"");
    const cancelMsg="Your pickleball lesson has been cancelled by Coach David.\n"+adminCancelDetails+"\n\nIf you have any questions, reply to this email or contact Coach David at (650) 839-3398.\n\nDavid Mok\n(650) 839-3398";
    const partnerMsg="A pickleball lesson you were part of has been cancelled.\n"+adminCancelDetails+"\n\nIf you have any questions, please contact Coach David at (650) 839-3398.\n\nDavid Mok\n(650) 839-3398";
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
      await fetch("/api/students?action=approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:student.id,email:student.email,name:student.name,firstName:student.firstName||"",lastName:student.lastName||"",commEmail:student.commEmail||"",phone:student.phone||"",homeCourt:student.homeCourt||"",skillLevel:student.skillLevel||"",duprRating:student.duprRating||"",memberType,grandfathered,action:"approve"})});
      setAllLessons(prev=>({...prev,[student.email]:[]}));
      setMockUsersState(prev=>({...prev,[student.email]:{name:student.name,firstName:student.firstName||"",lastName:student.lastName||"",commEmail:student.commEmail||"",skillLevel:student.skillLevel||"",duprRating:student.duprRating||"",memberType,approved:true,grandfathered:!!grandfathered}}));
      setPendingStudents(prev=>prev.filter(s=>s.id!==student.id));
      // Send approval email to comm email if available, else Google email
      const notifyEmail=student.commEmail||student.email;
      fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:notifyEmail,subject:"Your DM Pickleball account is approved!",text:"Hi "+student.name+",\n\nYour account has been approved! You can now log in at:\nhttps://dmpickleball.com\n\nSee you on the court!\nDavid Mok",fromAlias:"noreply@dmpickleball.com"})}).catch(()=>{});
    }catch(e){console.error("Approve error:",e);}
  };
  const denyStudent=async id=>{
    const student=pendingStudents.find(s=>s.id===id);
    if(student){
      try{
        await fetch("/api/students?action=approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:id,action:"deny"})});
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
  const addStudent=({name,email,memberType,firstName,lastName,commEmail,phone,city,homeCourt,skillLevel,duprRating})=>{
    setMockUsersState(prev=>{
      const existing=prev[email];
      if(existing){
        // Update existing student — merge all profile fields, preserve memberType/approved/blocked/etc.
        return{...prev,[email]:{...existing,name,firstName:firstName||"",lastName:lastName||"",commEmail:commEmail||"",phone:phone||"",city:city||"",homeCourt:homeCourt||"",skillLevel:skillLevel||"",duprRating:duprRating||"",memberType:memberType||existing.memberType}};
      }
      // New student
      return{...prev,[email]:{name,memberType:memberType||"public",approved:true,password:"",firstName:firstName||"",lastName:lastName||"",commEmail:commEmail||"",phone:phone||"",city:city||"",homeCourt:homeCourt||"",skillLevel:skillLevel||"",duprRating:duprRating||""}};
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
    await fetch("/api/students?action=delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
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
    await fetch("/api/students?action=restore",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
    const s=removedStudents.find(x=>x.email===email);
    if(s){
      setMockUsersState(prev=>({...prev,[email]:{
        name:s.name,firstName:s.firstName||s.first_name||"",lastName:s.lastName||s.last_name||"",
        commEmail:s.commEmail||s.comm_email||"",skillLevel:s.skillLevel||"",duprRating:"",
        memberType:s.memberType||"public",approved:true,blocked:false,
        phone:s.phone||"",city:s.city||"",homeCourt:s.homeCourt||"",picture:s.picture||""
      }}));
    }
    setRemovedStudents(prev=>prev.filter(x=>x.email!==email));
  };
  const logout=()=>{setUser(null);setIsAdmin(false);setPage("home");};
  if(isAdmin)return(
    <div style={{fontFamily:"'Josefin Sans',sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{color:Y,fontWeight:900,fontSize:"1.3rem",letterSpacing:1}}>DM <span style={{color:"white"}}>Pickleball</span> <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.6)",fontWeight:400}}>· Admin</span></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"3px 10px",fontSize:"0.75rem",fontWeight:800}}>{pendingStudents.length} pending</span>}
          <button onClick={logout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.4)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem"}}>Log out</button>
        </div>
      </nav>
      <AdminPanel allLessons={allLessons} onUpdateLesson={updateLesson} onCancelLesson={adminCancel} onDeleteLesson={deleteLesson} pendingStudents={pendingStudents} onApprove={approveStudent} onDeny={denyStudent} mockUsers={mockUsersState} onAddStudent={addStudent} onAddLesson={adminAddLesson} onToggleMenlo={toggleMenlo} onToggleSaturday={toggleSaturday} onBlockStudent={blockStudent} onRemoveStudent={removeStudent} removedStudents={removedStudents} onRestoreStudent={restoreStudent} onBlockRemoved={blockRemovedStudent} onToggleGrandfathered={toggleGrandfathered}/>
    </div>
  );
  return(
    <div style={{fontFamily:"'Josefin Sans',sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <Nav user={user} onLogin={()=>setPage("login")} onLogout={logout} setPage={setPage} currentPage={page}/>
      {page==="adminlogin"&&<AdminLoginPage onAdminLogin={()=>setIsAdmin(true)}/>}
      {page==="home"&&!isAdminRoute&&<Homepage setPage={setPage}/>}
      {page==="pricing"&&<PricingPage setPage={setPage}/>}
      {page==="gear"&&<GearPage/>}
      {page==="contact"&&<ContactPage/>}
      {page==="login"&&<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>}
      {page==="account"&&(user?<AccountPage user={user} setPage={setPage} onUpdateUser={updateUser}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      {page==="dashboard"&&(user?<Dashboard user={user} setPage={setPage} lessons={userLessons} onCancel={cancelLesson} dbLoaded={dbLoaded}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      {page==="booking"&&(user?<BookingPage user={user} setPage={setPage} onAddLesson={addLesson}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      <footer style={{textAlign:"center",padding:24,color:"#9ca3af",fontSize:"0.82rem",borderTop:"1px solid #e5e7eb",marginTop:20}}>
        © 2026 DM Pickleball — David Mok · SF Peninsula, Bay Area
      </footer>
    </div>
  );
}
// Thu Mar 12 09:07:24 PDT 2026
