import { useState } from "react";

// ─── IMAGE PATHS ────────────────────────────────────────────────────────────
// All images live in /public/images/ — drop your files there with these names:
const BARRAGE_IMG  = "/images/barrage.png";       // was: 1773169775757_image.png
const LOGO_CRBN    = "/images/logo-crbn.png";     // was: IMG_5034.png
const LOGO_VATIC   = "/images/logo-vatic.png";    // was: IMG_5036.png
const LOGO_SIXZERO = "/images/logo-sixzero.png";  // was: IMG_5035.png
const LOGO_ENGAGE  = "/images/logo-engage.png";   // was: IMG_5037.png
const DAVID_PHOTO  = "/images/david.jpg";         // was: 1773178886822_IMG_2962.JPG

// ─── FORMSPREE ───────────────────────────────────────────────────────────────
// 1. Go to https://formspree.io and create a free account
// 2. Create a new form → copy the form ID (looks like "xrgvkpqz")
// 3. Replace mvzwanal below with your actual ID
const FORMSPREE_ID = "mvzwanal";
const GOOGLE_CLIENT_ID = "708565807163-uu8teuc876ufboujut8vhdo34ro27v8s.apps.googleusercontent.com";

// ─── THEME ───────────────────────────────────────────────────────────────────
const G = "#1a3c34", Y = "#c0c0c0";
const inp = { padding:"11px 14px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:"0.92rem", outline:"none", background:"#fafafa", width:"100%", boxSizing:"border-box", marginBottom:12 };
const lbl = { fontSize:"0.78rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5, display:"block" };

// ─── SCHEDULING DATA ─────────────────────────────────────────────────────────
const STANFORD_BLOCKS = { 2:{start:16*60,end:17*60+30}, 3:{start:12*60,end:13*60+30}, 5:{start:9*60+30,end:11*60} };
const PICKUP = {};
const FOCUS_AREAS = ["Dinking & kitchen game","Third shot drops","Serve & return","Volleys & net play","Footwork & movement","Transition game","Overhead smash","Singles strategy","Doubles strategy","Tennis-to-pickleball transition","Drives"];

// ─── BRANDS ──────────────────────────────────────────────────────────────────
const BRANDS = [
  { id:"crbn",    name:"CRBN Pickleball",    tagline:"David's #1 Recommended Paddle",  description:"As a CRBN Ambassador, David uses and trusts CRBN paddles at every level of play — from training sessions to 5.0+ tournament competition. Use his code for a discount on your next order.", code:"DMPICKLEBALL", deal:"Discount off your order", link:"https://crbnpickleball.com",   logo:LOGO_CRBN,    logoBg:"#000000", logoPad:"20px 28px", shopBg:"#000000", shopColor:"white", codeColor:"#ffffff", codeBg:"#1a1a1a", codeText:"#9ca3af" },
  { id:"vatic",   name:"Vatic Pro",           tagline:"High Performance at Every Level", description:"Vatic Pro paddles deliver exceptional feel and control for players serious about improving their game. Trusted by competitive players across all skill levels.",                            code:"DMPICKLEBALL", deal:"Discount off your order", link:"https://vaticpro.com",         logo:LOGO_VATIC,   logoBg:"#ffffff", logoPad:"16px 24px", shopBg:"#e85d04", shopColor:"white", codeColor:"#e85d04", codeBg:"#fff5f0", codeText:"#9ca3af" },
  { id:"sixzero", name:"Six Zero Pickleball", tagline:"Engineered for Competitive Play", description:"Six Zero paddles are built for players who want precision, power, and consistency in every shot. A go-to brand for serious competitors on the court.",                                   code:"DAVIDMOK10",   deal:"10% off your order",      link:"https://sixzero.co",          logo:LOGO_SIXZERO, logoBg:"#ffffff", logoPad:"20px 24px", shopBg:"#111111", shopColor:"white", codeColor:"#111111", codeBg:"#f5f5f5", codeText:"#9ca3af" },
  { id:"engage",  name:"Engage Pickleball",   tagline:"Engage. Believe. Perform.",       description:"David is a signed Teaching Pro with Engage Pickleball. Use his code to get a discount on their full lineup of paddles and gear.",                                                         code:"20MOK",        deal:"20% off your order",      link:"https://engagepickleball.com", logo:LOGO_ENGAGE,  logoBg:"#888888", logoPad:"16px 24px", shopBg:"#111111", shopColor:"white", codeColor:"#cc0000", codeBg:"#f9f9f9", codeText:"#9ca3af" },
];

const BAG_ITEMS = [
  { id:"paddle", label:"Current Paddle", name:"CRBN² Barrage", detail:"TruFoam Core · Carbon Fiber Face", icon:"🏓", link:"https://crbnpickleball.com" },
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

const INIT_PENDING = [
  { id:1, name:"Alex Rivera",   email:"alex@email.com",  requestedAt:"Mar 8, 2026" },
  { id:2, name:"Sarah Johnson", email:"sarah@email.com", requestedAt:"Mar 9, 2026" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function toDS(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
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
  const maxStart=dow===6?10*60:16*60;for(let s=8*60;s<=maxStart;s+=30){
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
function getCancelDeadline(ds,ts){return new Date(getLessonStart(ds,ts).getTime()-24*60*60*1000);}
function fmtDeadline(d){return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+" at "+d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});}
function canCancel(ds,ts){return new Date()<getCancelDeadline(ds,ts);}
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

function CalendarPicker({value,onChange,memberType}){
  const today=new Date();today.setHours(0,0,0,0);
  const maxDate=new Date(today);maxDate.setDate(today.getDate()+30);
  const[viewing,setViewing]=useState({year:today.getFullYear(),month:today.getMonth()});
  const{year,month}=viewing;
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=new Date(year,month).toLocaleString("default",{month:"long",year:"numeric"});
  const isDisabled=day=>{const d=new Date(year,month,day);d.setHours(0,0,0,0);if(d<today||d>maxDate)return true;const dow=d.getDay();if(dow===0)return true;if(memberType==="menlo"&&dow===6)return true;return false;};
  const isSelected=day=>{if(!value)return false;const v=new Date(value+"T12:00:00");return year===v.getFullYear()&&month===v.getMonth()&&day===v.getDate();};
  const isToday=day=>{const d=new Date(year,month,day);d.setHours(0,0,0,0);return d.getTime()===today.getTime();};
  const selectDay=day=>{if(isDisabled(day))return;const d=new Date(year,month,day);onChange(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);};
  return(
    <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden",userSelect:"none"}}>
      <div style={{background:G,color:"white",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>month===0?setViewing({year:year-1,month:11}):setViewing({year,month:month-1})} style={{background:"none",border:"none",color:"white",fontSize:"1.3rem",cursor:"pointer",padding:"0 8px"}}>‹</button>
        <span style={{fontWeight:700,fontSize:"0.95rem"}}>{monthName}</span>
        <button onClick={()=>month===11?setViewing({year:year+1,month:0}):setViewing({year,month:month+1})} style={{background:"none",border:"none",color:"white",fontSize:"1.3rem",cursor:"pointer",padding:"0 8px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#e8f0ee"}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:"0.75rem",fontWeight:700,color:G}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"8px"}}>
        {Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`}/>)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const day=i+1,disabled=isDisabled(day),selected=isSelected(day),tod=isToday(day);
          return <div key={day} onClick={()=>selectDay(day)} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",margin:"2px auto",width:36,height:36,cursor:disabled?"default":"pointer",background:selected?G:"transparent",color:selected?"white":disabled?"#d1d5db":"#1a1a1a",fontWeight:tod||selected?700:400,fontSize:"0.9rem",border:tod&&!selected?`2px solid ${G}`:"2px solid transparent",opacity:disabled?0.4:1,transition:"all 0.15s"}}>{day}</div>;
        })}
      </div>
    </div>
  );
}

function Nav({user,onLogin,onLogout,setPage,currentPage}){
  return(
    <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
      <div onClick={()=>setPage("home")} style={{color:Y,fontWeight:900,fontSize:"1.3rem",letterSpacing:1,cursor:"pointer"}}>DM <span style={{color:"white"}}>Pickleball</span></div>
      <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
        {[["home","Home"],["pricing","Pricing"],["gear","Paddle/Gear"],["contact","Contact"]].map(([p,label])=>(
          <span key={p} onClick={()=>setPage(p)} style={{color:"white",cursor:"pointer",opacity:currentPage===p?1:0.7,fontWeight:currentPage===p?700:400,fontSize:"0.92rem"}}>{label}</span>
        ))}
        {user?(
          <>
            <span onClick={()=>setPage("dashboard")} style={{color:Y,cursor:"pointer",fontWeight:700,fontSize:"0.92rem"}}>My Lessons</span>
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

function LessonCard({lesson,isHistory,onCancel}){
  const[expanded,setExpanded]=useState(false);
  const[confirmCancel,setConfirmCancel]=useState(false);
  const deadline=!isHistory?getCancelDeadline(lesson.date,lesson.time):null;
  const cancellable=!isHistory&&canCancel(lesson.date,lesson.time);
  const closed=!isHistory&&!cancellable;
  const dateObj=new Date(lesson.date+"T12:00:00");
  return(
    <div style={{background:"white",borderRadius:12,border:`1.5px solid ${expanded?G:"#e5e7eb"}`,overflow:"hidden",marginBottom:12}}>
      {confirmCancel&&(
        <div style={{background:"#fef2f2",borderBottom:"1px solid #fca5a5",padding:"14px 20px"}}>
          <div style={{fontWeight:700,color:"#991b1b",marginBottom:8,fontSize:"0.9rem"}}>Cancel this lesson?</div>
          <div style={{fontSize:"0.85rem",color:"#7f1d1d",marginBottom:10}}>{lesson.type} on {fmtDateShort(lesson.date)} at {lesson.time.split("–")[0].trim()}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setConfirmCancel(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>Keep it</button>
            <button onClick={()=>{onCancel(lesson.id);setConfirmCancel(false);}} style={{background:"#dc2626",color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>Yes, Cancel</button>
          </div>
        </div>
      )}
      <div onClick={()=>isHistory&&setExpanded(!expanded)} style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:isHistory?"pointer":"default"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{background:isHistory?"#e8f0ee":lesson.status==="confirmed"?"#e8f0ee":"#fffbea",border:`1.5px solid ${isHistory?G:lesson.status==="confirmed"?G:Y}`,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:56}}>
            <div style={{fontSize:"1.3rem",fontWeight:900,color:isHistory?G:lesson.status==="confirmed"?G:"#92400e",lineHeight:1}}>{dateObj.getDate()}</div>
            <div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{dateObj.toLocaleString("default",{month:"short"})}</div>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:"0.97rem"}}>{lesson.type} · {lesson.duration}</div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>⏱ {lesson.time}</div>
            {lesson.focus&&<div style={{fontSize:"0.8rem",color:G,marginTop:3,fontWeight:600}}>🎯 {lesson.focus}</div>}
            {!isHistory&&(
              <div style={{marginTop:5,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                <span style={{background:lesson.status==="confirmed"?"#e8f0ee":"#fffbea",color:lesson.status==="confirmed"?G:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                  {lesson.status==="confirmed"?"✓ Confirmed":"⏳ Pending"}
                </span>
                {deadline&&(
                  <span style={{fontSize:"0.75rem",color:cancellable?"#6b7280":"#dc2626",background:cancellable?"#f9f9f6":"#fef2f2",padding:"2px 10px",borderRadius:50,border:`1px solid ${cancellable?"#e5e7eb":"#fca5a5"}`}}>
                    {cancellable?`Cancel by: ${fmtDeadline(deadline)}`:"⛔ Cancellation closed"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isHistory&&(
            <>
              {lesson.notes&&<span style={{fontSize:"0.75rem",background:"#e8f0ee",color:G,padding:"3px 10px",borderRadius:50,fontWeight:600}}>📝</span>}
              {lesson.photos?.length>0&&<span style={{fontSize:"0.75rem",background:"#e8f0ee",color:G,padding:"3px 10px",borderRadius:50,fontWeight:600}}>🖼 {lesson.photos.length}</span>}
              {lesson.videos?.length>0&&<span style={{fontSize:"0.75rem",background:"#e8f0ee",color:G,padding:"3px 10px",borderRadius:50,fontWeight:600}}>🎬 {lesson.videos.length}</span>}
              {!lesson.notes&&!lesson.photos?.length&&!lesson.videos?.length&&<span style={{fontSize:"0.75rem",color:"#9ca3af",fontStyle:"italic"}}>No notes yet</span>}
              <span style={{color:G,fontSize:"1.1rem"}}>{expanded?"▲":"▼"}</span>
            </>
          )}
          {!isHistory&&(
            <button onClick={e=>{e.stopPropagation();if(cancellable)setConfirmCancel(true);}}
              style={{background:closed?"#f3f4f6":"#fef2f2",color:closed?"#9ca3af":"#dc2626",border:`1.5px solid ${closed?"#e5e7eb":"#fca5a5"}`,padding:"6px 14px",borderRadius:50,fontSize:"0.8rem",fontWeight:600,cursor:closed?"not-allowed":"pointer"}}>
              {closed?"Closed":"✕ Cancel"}
            </button>
          )}
        </div>
      </div>
      {isHistory&&expanded&&(
        <div style={{borderTop:"1px solid #e5e7eb",padding:"20px"}}>
          {lesson.notes
            ?<div style={{marginBottom:16}}><div style={{...lbl,marginBottom:8}}>📝 Coaching Notes from David</div><div style={{background:"#f9f9f6",borderRadius:8,padding:"14px 16px",fontSize:"0.9rem",color:"#374151",lineHeight:1.75}}>{lesson.notes}</div></div>
            :<div style={{background:"#f9f9f6",borderRadius:8,padding:"14px 16px",fontSize:"0.88rem",color:"#9ca3af",marginBottom:16,fontStyle:"italic"}}>📝 No coaching notes yet — check back after David reviews the session.</div>
          }
          {lesson.photos?.length>0&&<div style={{marginBottom:16}}><div style={{...lbl,marginBottom:8}}>🖼 Photos</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{lesson.photos.map((_,i)=><div key={i} style={{width:80,height:80,background:"#e5e7eb",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🖼️</div>)}</div></div>}
          {lesson.videos?.length>0&&<div><div style={{...lbl,marginBottom:8}}>🎬 Videos</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{lesson.videos.map((_,i)=><div key={i} style={{width:120,height:80,background:"#1a1a1a",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>▶️</div>)}</div></div>}
          {!lesson.notes&&!lesson.photos?.length&&!lesson.videos?.length&&<div style={{textAlign:"center",color:"#9ca3af",fontSize:"0.85rem"}}>No media added yet.</div>}
        </div>
      )}
    </div>
  );
}

function Homepage({setPage}){
  return(
    <div>
      <div style={{background:`linear-gradient(135deg,${G},#0d2620)`,color:"white",textAlign:"center",padding:"80px 24px 64px"}}>
        <div style={{fontSize:"0.8rem",letterSpacing:3,opacity:0.75,marginBottom:14,textTransform:"uppercase"}}>Pickleball Coaching · San Francisco Peninsula, Bay Area</div>
        <h1 style={{fontSize:"3rem",fontWeight:900,lineHeight:1.15,marginBottom:16}}>Level Up With One of the<br/><span style={{color:Y}}>Bay Area's Top Competitive Pickleball Coaches</span></h1>
        <p style={{fontSize:"1.1rem",opacity:0.9,maxWidth:500,margin:"0 auto 32px",lineHeight:1.7}}>Private, semi-private & group lessons on the SF Peninsula. Personalized coaching from a tournament competitor who knows what it takes to win.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage("pricing")} style={{background:Y,color:G,border:"none",padding:"13px 30px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>View Pricing</button>
          <button onClick={()=>setPage("contact")} style={{background:"transparent",color:"white",border:"2px solid rgba(255,255,255,0.5)",padding:"13px 30px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>Get in Touch</button>
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
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>About David</div>
            <h2 style={{fontSize:"1.8rem",fontWeight:900,marginBottom:16,lineHeight:1.3}}>From Tennis Courts to Pickleball Pro</h2>
            <p style={{color:"#4b5563",lineHeight:1.8,marginBottom:14,fontSize:"0.97rem"}}>With 15+ years of competitive tennis experience, David Mok brings a unique edge to pickleball coaching. As a 5.0+ rated tournament player and CRBN Ambassador, David has an insider's understanding of what it takes to elevate your game.</p>
            <p style={{color:"#4b5563",lineHeight:1.8,fontSize:"0.97rem"}}>David specializes in coaching tennis players making the transition to pickleball — he knows exactly the habits that help and the ones that hurt. Whether you're a complete beginner or a seasoned competitor, David coaches all skill levels in both doubles and singles across the SF Peninsula.</p>
            <div style={{background:"#e8f0ee",border:`1px solid ${G}20`,borderRadius:10,padding:"10px 16px",marginTop:14,display:"inline-flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:"1.1rem"}}>🥇</span>
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
            {[["🎯","Private","1-on-1 coaching",null],["👥","Semi-Private","Always 2 students · $70/person","$140 / $210"],["🏆","Group Lesson","3–5 students",null]].map(([icon,title,desc,price])=>(
              <div key={title} style={{border:"2px solid #e5e7eb",borderRadius:12,padding:24,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
                <div style={{fontWeight:700,marginBottom:6}}>{title}</div>
                <div style={{fontSize:"0.83rem",color:"#6b7280",marginBottom:12}}>{desc}</div>
                <div style={{fontWeight:800,color:G,fontSize:"1.1rem"}}>{price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#111111",padding:"48px 24px"}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#f97316",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Gear I Trust</div>
          <h2 style={{fontSize:"1.8rem",fontWeight:900,color:"white",marginBottom:12}}>Paddle & Gear Discounts</h2>
          <p style={{color:"rgba(255,255,255,0.55)",marginBottom:28,lineHeight:1.7,maxWidth:480,margin:"0 auto 28px"}}>Get discounts on the paddles and gear David uses and recommends.</p>
          <button onClick={()=>setPage("gear")} style={{background:"#f97316",color:"white",border:"none",padding:"12px 28px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>View All Codes →</button>
        </div>
      </div>
      <div style={{background:`linear-gradient(135deg,${G},#0d2620)`,color:"white",textAlign:"center",padding:"60px 24px"}}>
        <h2 style={{fontSize:"1.8rem",fontWeight:900,marginBottom:12}}>Ready to Improve Your Game?</h2>
        <p style={{opacity:0.9,marginBottom:24}}>Reach out via text or call to get started.</p>
        <button onClick={()=>setPage("contact")} style={{background:Y,color:G,border:"none",padding:"13px 32px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>Contact David</button>
      </div>
    </div>
  );
}

function PricingPage(){
  return(
    <div style={{maxWidth:700,margin:"0 auto",padding:"60px 24px"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Transparent Pricing</div>
        <h2 style={{fontSize:"2rem",fontWeight:900}}>Lesson Rates</h2>
        <p style={{color:"#6b7280",marginTop:8}}>SF Peninsula, Bay Area</p>
      </div>
      <div style={{display:"grid",gap:16}}>
        {[["🎯","Private Lesson","1-on-1 personalized coaching","$130/hr"],["👥","Semi-Private","Always 2 students","$70/person/hr"],["🏆","Group Lesson","3–5 students · rate split equally","$140/hr"]].map(([icon,title,desc,price])=>(
          <div key={title} style={{background:"white",border:"2px solid #e5e7eb",borderRadius:12,padding:"24px 28px",display:"flex",alignItems:"center",gap:20}}>
            <div style={{fontSize:36}}>{icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:"1.05rem"}}>{title}</div>
              <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>{desc}</div>
              <div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:4}}>60 & 90 min sessions available</div>
            </div>
            <div style={{fontWeight:700,color:G,fontSize:"1.1rem"}}>{price}</div>
          </div>
        ))}
        <div style={{background:"white",border:"2px solid #e5e7eb",borderRadius:12,padding:"24px 28px",display:"flex",alignItems:"center",gap:20}}>
          <div style={{fontSize:36}}>🏢</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"1.05rem"}}>Corporate Events</div><div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>Group clinics & events for companies and teams</div></div>
          <div style={{fontWeight:700,color:G,fontSize:"1.05rem"}}>Contact for pricing</div>
        </div>
      </div>
      <div style={{background:"#fffbea",border:"1.5px solid #f4c430",borderRadius:10,padding:"16px 20px",marginTop:24,fontSize:"0.88rem",color:"#7a5800",textAlign:"center"}}>
        ⚠️ Cancellations must be made at least <strong>24 hours before</strong> your lesson start time.
      </div>
    </div>
  );
}

function GearPage(){
  return(
    <div style={{background:"#f5f5f3",minHeight:"100vh"}}>
      <div style={{position:"relative",width:"100%",minHeight:220,overflow:"hidden",display:"flex",alignItems:"center"}}>
        <img src={BARRAGE_IMG} alt="CRBN² Barrage" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 35%"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0.15))"}}/>
        <div style={{position:"relative",zIndex:1,padding:"32px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:960,margin:"0 auto"}}>
          <div>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{background:"#f97316",color:"white",padding:"3px 12px",borderRadius:50,fontSize:"0.68rem",fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>🔥 Pre-Order Live</span>
              <span style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.85)",padding:"3px 12px",borderRadius:50,fontSize:"0.68rem",fontWeight:600}}>Ships Mid-March</span>
            </div>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)",letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>CRBN Pickleball</div>
            <h2 style={{fontSize:"2rem",fontWeight:900,color:"white",lineHeight:1.1,marginBottom:4,letterSpacing:-0.5}}>CRBN² TRUFOAM BARRAGE</h2>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.78rem",letterSpacing:2,textTransform:"uppercase"}}>Relentless Power and Pop</p>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center",flexShrink:0,marginLeft:32}}>
            <div style={{background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"10px 18px",textAlign:"center"}}>
              <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Use Code</div>
              <div style={{color:"#f97316",fontWeight:900,fontSize:"1.05rem",letterSpacing:2}}>DMPICKLEBALL</div>
            </div>
            <a href="https://crbnpickleball.com/collections/barrage" target="_blank" rel="noreferrer"
              style={{background:"#f97316",color:"white",padding:"11px 22px",borderRadius:50,fontWeight:800,textDecoration:"none",fontSize:"0.88rem",whiteSpace:"nowrap"}}>
              Pre-Order →
            </a>
          </div>
        </div>
      </div>
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
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.92rem",maxWidth:420,margin:"0 auto"}}>The exact gear David plays and competes with right now.</p>
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

// ─── CONTACT PAGE (with real Formspree submission) ────────────────────────────
function ContactPage(){
  const[status,setStatus]=useState("idle"); // idle | sending | success | error
  const[form,setForm]=useState({name:"",email:"",phone:"",message:""});

  const handleSubmit=async()=>{
    if(!form.name||!form.email){alert("Please enter your name and email.");return;}
    setStatus("sending");
    try{
      const res=await fetch(`https://formspree.io/f/${FORMSPREE_ID}`,{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(form),
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
        <h2 style={{fontSize:"2rem",fontWeight:900}}>Contact David</h2>
        <p style={{color:"#6b7280",marginTop:8,lineHeight:1.7}}>Interested in lessons? Reach out and David will get back to you directly.</p>
      </div>
      <div style={{background:"white",borderRadius:12,padding:"28px 32px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",gap:16,marginBottom:20}}>
          <div style={{flex:1,background:"#e8f0ee",border:`1.5px solid ${G}`,borderRadius:10,padding:"14px 18px",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>📱</div>
            <div style={{fontWeight:700,fontSize:"0.9rem"}}>Text or Call</div>
            <div style={{color:G,fontWeight:700,marginTop:4}}>(650) 839-3398</div>
          </div>
          <div style={{flex:1,background:"#e8f0ee",border:`1.5px solid ${G}`,borderRadius:10,padding:"14px 18px",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>📧</div>
            <div style={{fontWeight:700,fontSize:"0.9rem"}}>Email</div>
            <div style={{color:G,fontWeight:700,marginTop:4,fontSize:"0.85rem"}}>hello@dmpickleball.com</div>
          </div>
        </div>

        {status==="success"?(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontWeight:700,color:G}}>Message sent!</div>
            <div style={{color:"#6b7280",fontSize:"0.9rem",marginTop:6}}>David will be in touch soon.</div>
          </div>
        ):status==="error"?(
          <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"14px 16px",color:"#991b1b",fontSize:"0.88rem",marginBottom:14,textAlign:"center"}}>
            Something went wrong. Please try again or reach out directly via phone.
            <button onClick={()=>setStatus("idle")} style={{display:"block",margin:"10px auto 0",background:"white",border:"1.5px solid #fca5a5",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem",color:"#991b1b"}}>Try Again</button>
          </div>
        ):(
          <>
            {[["name","text","Your Name"],["email","email","Email Address"],["phone","tel","Phone Number (optional)"]].map(([key,type,ph])=>(
              <input key={key} type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={inp}/>
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
  return(
    <div style={{minHeight:"100vh",background:"#f4f9f6",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:8}}>🏓</div>
          <h2 style={{fontWeight:900,color:G,marginBottom:4}}>Admin Login</h2>
          <p style={{color:"#6b7280",fontSize:"0.85rem"}}>DM Pickleball Dashboard</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        <input style={inp} type="text" placeholder="Username" value={username} onChange={e=>{setUsername(e.target.value);setError("");}}/>
        <input style={inp} type="password" placeholder="Password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}}/>
        <button onClick={()=>{
          if(username===ADMIN_USER.email&&password===ADMIN_USER.password){onAdminLogin();}
          else{setError("Invalid credentials.");}
        }} style={{width:"100%",background:G,color:"white",border:"none",padding:14,borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>
          Log In →
        </button>
      </div>
    </div>
  );
}
function LoginPage({onLogin,onAdminLogin}){
  const[mode,setMode]=useState("login");
  const[name,setName]=useState("");
  const[phone,setPhone]=useState("");
  const[homeCourt,setHomeCourt]=useState("");
  const[error,setError]=useState("");
  const[signedUp,setSignedUp]=useState(false);
  const[loading,setLoading]=useState(false);

  const handleGoogleLogin=()=>{
    setLoading(true);
    const params=new URLSearchParams({
      client_id:GOOGLE_CLIENT_ID,
      redirect_uri:window.location.origin,
      response_type:"token",
      scope:"email profile",
      prompt:"select_account",
    });
    const popup=window.open("https://accounts.google.com/o/oauth2/v2/auth?"+params.toString(),"google-login","width=500,height=600,scrollbars=yes");
    const timer=setInterval(()=>{
      try{
        if(popup.closed){clearInterval(timer);setLoading(false);return;}
        const url=popup.location.href;
        if(url.includes(window.location.origin)&&url.includes("access_token")){
          clearInterval(timer);
          const hash=new URLSearchParams(url.split("#")[1]);
          const token=hash.get("access_token");
          popup.close();
          fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+token}})
            .then(r=>r.json())
            .then(async info=>{
              const email=info.email.toLowerCase();window._pendingEmail=email;
              try{
                const r=await fetch("/api/get-student?email="+encodeURIComponent(email));
                const data=await r.json();
                if(!data.student){setLoading(false);setError("Your account is not approved yet. Please request access.");setMode("signup");return;}
                if(!data.student.approved){setLoading(false);setError("Your account is pending approval from David.");return;}
                if(data.student.blocked){setLoading(false);setError("Your account has been blocked. Please contact David.");return;}
                setLoading(false);
                onLogin({email,name:data.student.name||info.name,memberType:data.student.member_type,approved:true,picture:info.picture,phone:data.student.phone,homeCourt:data.student.home_court});
              }catch(e){setLoading(false);setError("Login failed. Please try again.");}
            })
            .catch(()=>{setLoading(false);setError("Google login failed. Please try again.");});
        }
      }catch(e){}
    },500);
  };

  if(signedUp)return(
    <div style={{maxWidth:440,margin:"80px auto",padding:"0 24px",textAlign:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:40,boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎾</div>
        <h2 style={{color:G,marginBottom:10}}>Request Received!</h2>
        <p style={{color:"#6b7280",lineHeight:1.7}}>Thanks <strong>{name}</strong>! David will review your request and reach out once approved.</p>
        <button onClick={()=>{setMode("login");setSignedUp(false);setError("");}} style={{marginTop:20,background:G,color:"white",border:"none",padding:"11px 28px",borderRadius:50,cursor:"pointer",fontWeight:700}}>Back to Login</button>
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:420,margin:"60px auto",padding:"0 24px"}}>
      <div style={{background:"white",borderRadius:16,padding:"36px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:8}}>🏓</div>
          <h2 style={{fontWeight:900,color:G}}>{mode==="login"?"Student Login":"Request Access"}</h2>
          <p style={{color:"#6b7280",fontSize:"0.88rem",marginTop:6}}>{mode==="login"?"Sign in with your Google account":"Fill in your details to request access"}</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:16}}>{error}</div>}
        {mode==="login"?(
          <>
            <button onClick={handleGoogleLogin} disabled={loading}
              style={{width:"100%",background:loading?"#f3f4f6":"white",color:"#374151",border:"1.5px solid #e5e7eb",padding:"13px 20px",borderRadius:50,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontSize:"0.95rem",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
              {loading?(
                <span>Connecting...</span>
              ):(
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign in with Google
                </>
              )}
            </button>
            <div style={{textAlign:"center",fontSize:"0.85rem",color:"#6b7280"}}>
              Don't have access? <span onClick={()=>{setMode("signup");setError("");}} style={{color:G,fontWeight:700,cursor:"pointer"}}>Request it here</span>
            </div>
          </>
        ):(
          <>
            <input style={inp} type="text" placeholder="Full Name (required)" value={name} onChange={e=>setName(e.target.value)}/>
            <input style={inp} type="tel" placeholder="Phone Number (required)" value={phone} onChange={e=>setPhone(e.target.value)}/>
            <input style={inp} type="text" placeholder="Home Court (optional)" value={homeCourt} onChange={e=>setHomeCourt(e.target.value)}/>
            <p style={{fontSize:"0.82rem",color:"#6b7280",marginBottom:16,lineHeight:1.6}}>You will sign in with Google. Please provide your details so David can approve your account.</p>
            <button onClick={()=>{
              if(!name||!phone){setError("Name and phone number are required.");return;}
              fetch("/api/request-access",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({email:window._pendingEmail||"",name,phone,homeCourt})
              }).then(r=>r.json()).then(data=>{
                if(data.error==="already_exists"){setError("You already have an account. Please sign in.");return;}
                if(data.error==="already_requested"){setError("You already have a pending request. David will be in touch.");return;}
                fetch("https://formspree.io/f/"+FORMSPREE_ID,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:"dmpickleball@gmail.com",_subject:"New access request: "+name,message:name+" has requested access.\nEmail: "+(window._pendingEmail||"")+"\nPhone: "+phone+"\nHome Court: "+(homeCourt||"Not specified")+"\n\nApprove at: https://dmpickleball.com/admin"})}).catch(()=>{});
                setSignedUp(true);
              }).catch(()=>setSignedUp(true));
            }} style={{width:"100%",background:G,color:"white",border:"none",padding:14,borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem",marginBottom:16}}>
              Request Access →
            </button>
            <div style={{textAlign:"center",fontSize:"0.85rem",color:"#6b7280"}}>
              Already approved? <span onClick={()=>{setMode("login");setError("");}} style={{color:G,fontWeight:700,cursor:"pointer"}}>Sign in</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Dashboard({user,setPage,lessons,onCancel}){
  const upcoming=lessons.filter(l=>!isPast(l.date,l.time)&&l.status!=="cancelled");
  const history=lessons.filter(l=>isPast(l.date,l.time)||l.status==="completed");
  return(
    <div style={{maxWidth:700,margin:"0 auto",padding:"48px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontWeight:900,color:G,fontSize:"1.6rem",marginBottom:4}}>My Lessons</h2>
          <p style={{color:"#6b7280",fontSize:"0.92rem"}}>Welcome back, <strong>{user.name}</strong> ·
            <span style={{background:"#e8f0ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.78rem",fontWeight:600,marginLeft:8}}>
              {user.memberType==="menlo"?"Menlo Circus Club":"General Student"}
            </span>
          </p>
        </div>
        <button onClick={()=>setPage("booking")} style={{background:G,color:"white",border:"none",padding:"11px 24px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.92rem"}}>+ Book a Lesson</button>
      </div>
      <div style={{marginBottom:36}}>
        <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Upcoming Lessons ({upcoming.length})</div>
        {upcoming.length===0
          ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No upcoming lessons. <span onClick={()=>setPage("booking")} style={{color:G,fontWeight:700,cursor:"pointer"}}>Book one now →</span></div>
          :upcoming.map(l=><LessonCard key={l.id} lesson={l} isHistory={false} onCancel={onCancel}/>)
        }
      </div>
      <div>
        <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Lesson History ({history.length}) · Click to expand</div>
        {history.length===0
          ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No past lessons yet.</div>
          :history.map(l=><LessonCard key={l.id} lesson={l} isHistory={true} onCancel={onCancel}/>)
        }
      </div>
    </div>
  );
}

function BookingPage({user,setPage,onAddLesson}){
  const isMenlo=user.memberType==="menlo";
  const[step,setStep]=useState(1);
  const[lessonType,setLessonType]=useState("");
  const[duration,setDuration]=useState(null);
  const[date,setDate]=useState("");
  const[slot,setSlot]=useState(null);
  const[slotIdx,setSlotIdx]=useState(-1);
  const[focus,setFocus]=useState("");
  const[notes,setNotes]=useState("");
  const[partner,setPartner]=useState({name:"",email:""});
  const[groupSize,setGroupSize]=useState(3);
  const[groupMembers,setGroupMembers]=useState([{name:"",email:""},{name:"",email:""},{name:"",email:""}]);
  const[submitting,setSubmitting]=useState(false);
  const[done,setDone]=useState(false);
  const[error,setError]=useState("");
  const[gcalLink,setGcalLink]=useState("");
  const[bookedSummary,setBookedSummary]=useState(null);
  const[busyTimes,setBusyTimes]=useState([]);
  const[loadingSlots,setLoadingSlots]=useState(false);

  const PRICES={private:{60:isMenlo?115:130,90:isMenlo?172.50:195},semi:{60:isMenlo?60:70,90:isMenlo?90:105},group:{60:140,90:210}};
  const LESSONS=[{id:"private",icon:"🎯",label:"Private",desc:"1-on-1 coaching"},{id:"semi",icon:"👥",label:"Semi-Private",desc:"Always 2 students"},{id:"group",icon:"🏆",label:"Group",desc:"3-5 students"}];
  const price=lessonType&&duration?PRICES[lessonType][duration]:null;
  const slots=date?getSlots(date,isMenlo?"menlo":"public",duration||60).filter(s=>!busyTimes.some(b=>s.s<b.endMins&&s.e>b.startMins)):[];
  const toTime24=(mins)=>{const h=Math.floor(mins/60),m=mins%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");};
  const toTimeStr=(s,e)=>fmt(s)+" - "+fmt(e);

  const STEPS=["Type & Duration","Date & Time",lessonType==="private"?"Details":"People & Details","Confirm"];
  const totalSteps=4;

  const step1Done=lessonType&&duration;
  const step2Done=date&&slot;
  const step3Done=lessonType==="private"?true:lessonType==="semi"?partner.name.trim()!=="":groupMembers.slice(0,groupSize-1).every(m=>m.name.trim()!=="");
  const canConfirm=step1Done&&step2Done&&step3Done;

  const handleBook=async()=>{
    setSubmitting(true);setError("");
    const startTime=toTime24(slot.s);
    const endTime=toTime24(slot.e);
    const timeStr=toTimeStr(slot.s,slot.e);
    const lessonLabel=lessonType==="private"?"Private":lessonType==="semi"?"Semi-Private":"Group";
    const memberNames=lessonType==="semi"?[user.name,partner.name]:lessonType==="group"?[user.name,...groupMembers.slice(0,groupSize-1).map(m=>m.name)]:[user.name];
    const titleSuffix=lessonType==="group"?" pb group lesson":" pb lesson";
    const summary=memberNames.join("/")+titleSuffix;
    const partnerInfo=lessonType==="semi"?"\nPartner: "+partner.name+(partner.email?" ("+partner.email+")":""):"";
    const groupInfo=lessonType==="group"?"\nGroup: "+groupMembers.slice(0,groupSize-1).map(m=>m.name+(m.email?" ("+m.email+")":"")).join(", "):"";
    const location=!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063, USA":"Stanford Redwood City";
    const description="Student: "+user.name+"\nEmail: "+user.email+"\nType: "+lessonLabel+" "+duration+"min\nFocus: "+(focus||"Not specified")+"\nNotes: "+(notes||"None")+partnerInfo+groupInfo+"\nLocation: "+location+"\nManage: https://dmpickleball.com";
    let eventId="";
    try{
      const r=await fetch("/api/create-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary,description,date,startTime,endTime,location,studentEmail:user.email,studentName:user.name})});
      const d=await r.json();
      if(d.eventId)eventId=d.eventId;
    }catch(e){console.error("GCal:",e);}
    const startISO=date+"T"+startTime+":00";
    const endISO=date+"T"+endTime+":00";
    const link="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(summary)+"&dates="+startISO.replace(/[-:]/g,"").slice(0,15)+"/"+endISO.replace(/[-:]/g,"").slice(0,15)+"&details="+encodeURIComponent(description)+"&location="+encodeURIComponent(location);
    try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:user.email,_replyto:user.email,_subject:"Your lesson is booked - "+fmtDateShort(date),message:"Hi "+user.name+",\n\nYour pickleball lesson is confirmed!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+duration+" min\nFocus: "+(focus||"Not specified")+"\nLocation: "+location+"\n\nManage your booking:\nhttps://dmpickleball.com\n\nAdd to Google Calendar:\n"+link+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398"})});}catch(e){}
    try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:"dmpickleball@gmail.com",_replyto:user.email,_subject:"New booking: "+summary+" - "+fmtDateShort(date),message:"New lesson booked!\n\nStudent: "+user.name+"\nEmail: "+user.email+"\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+duration+" min\nFocus: "+(focus||"Not specified")+"\nNotes: "+(notes||"None")+partnerInfo+groupInfo+"\nPrice: $"+price+"\nLocation: "+location})});}catch(e){}
    if(lessonType==="semi"&&partner.email){try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({_to:partner.email,email:partner.email,_replyto:"dmpickleball@gmail.com",_subject:"You have been added to a pickleball lesson - "+fmtDateShort(date),message:"Hi "+partner.name+",\n\n"+user.name+" has added you to a lesson!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nType: Semi-Private · "+duration+" min\nFocus: "+(focus||"Not specified")+"\nLocation: "+location+"\n\nAdd to Google Calendar:\n"+link+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398"})})}catch(e){}}
    if(lessonType==="group"){groupMembers.slice(0,groupSize-1).forEach(async m=>{if(m.email){try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:m.email,_subject:"You have been added to a group pickleball lesson - "+fmtDateShort(date),message:"Hi "+m.name+",\n\n"+user.name+" has added you to a group lesson!\n\nDate: "+fmtDate(date)+"\nTime: "+timeStr+"\nLocation: "+location+"\n\nAdd to Google Calendar:\n"+link+"\n\nSee you on the court!\nDavid Mok"})})}catch(e){}}});}
    const newLesson={id:Date.now(),date,time:timeStr,type:lessonLabel,duration:duration+" min",status:"confirmed",focus,notes:"",photos:[],videos:[],gcalEventId:eventId,partnerEmail:lessonType==="semi"?partner.email:"",groupEmails:lessonType==="group"?groupMembers.slice(0,groupSize-1).map(m=>m.email).filter(Boolean):[],members:memberNames.slice(1)};
    onAddLesson(newLesson);
    setGcalLink(link);
    setBookedSummary({date,timeStr,lessonLabel,duration,focus,price,summary});
    setSubmitting(false);
    setDone(true);
  };

  if(done)return(
    <div style={{maxWidth:560,margin:"60px auto",padding:"0 24px",textAlign:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:56,marginBottom:16}}>🎉</div>
        <h2 style={{fontWeight:900,color:G,marginBottom:8}}>You are booked!</h2>
        <p style={{color:"#6b7280",marginBottom:24,lineHeight:1.7}}>Confirmation sent to <strong>{user.email}</strong>.</p>
        <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:24,textAlign:"left"}}>
          <div style={{fontWeight:700,marginBottom:12,color:G}}>Booking Summary</div>
          <div style={{fontSize:"0.9rem",color:"#4b5563",lineHeight:2}}>
            <div>📅 {bookedSummary&&fmtDate(bookedSummary.date)}</div>
            <div>⏱ {bookedSummary?.timeStr}</div>
            <div>🎯 {bookedSummary?.lessonLabel} · {bookedSummary?.duration} min</div>
            {bookedSummary?.focus&&<div>🏓 {bookedSummary.focus}</div>}
            <div>💰 ${bookedSummary?.price}{lessonType!=="private"?" per person":""}</div>
            <div>📍 {!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Stanford Redwood City"}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <a href={gcalLink} target="_blank" rel="noreferrer" style={{background:G,color:"white",padding:"13px",borderRadius:50,fontWeight:700,textDecoration:"none",fontSize:"0.95rem"}}>📅 Add to Google Calendar</a>
          <button onClick={()=>setPage("dashboard")} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>View My Lessons</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:620,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:28}}>
        <h2 style={{fontWeight:900,color:G,fontSize:"1.6rem",marginBottom:4}}>Book a Lesson</h2>
        <p style={{color:"#6b7280",fontSize:"0.88rem"}}>Booking as <strong>{user.name}</strong> <span style={{background:"#e8f0ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:600,marginLeft:6}}>{isMenlo?"Menlo Circus Club":"General Student"}</span></p>
      </div>

      <div style={{display:"flex",alignItems:"center",marginBottom:32,gap:0}}>
        {STEPS.map((s,i)=>{
          const n=i+1;
          const active=step===n;
          const done=step>n;
          return(
            <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"auto"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:done?G:active?G:"#e5e7eb",color:done||active?"white":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.85rem",cursor:done?"pointer":"default",transition:"all 0.2s"}}
                  onClick={()=>done&&setStep(n)}>
                  {done?"✓":n}
                </div>
                <div style={{fontSize:"0.65rem",fontWeight:600,color:active?G:done?G:"#9ca3af",whiteSpace:"nowrap",textAlign:"center"}}>{s}</div>
              </div>
              {i<STEPS.length-1&&<div style={{flex:1,height:2,background:done?G:"#e5e7eb",margin:"0 8px",marginBottom:16,transition:"all 0.2s"}}/>}
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
              const pLabel=!p?"Select duration":l.id==="private"?"$"+p:l.id==="semi"?"$"+p+"/person":"$"+p+" total";
              return(<div key={l.id} onClick={()=>setLessonType(l.id)} style={{background:lessonType===l.id?"#e8f0ee":"white",border:"2px solid "+(lessonType===l.id?G:"#e5e7eb"),borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>{l.icon}</div><div style={{fontWeight:700,fontSize:"0.95rem",color:lessonType===l.id?G:"#1a1a1a"}}>{l.label}</div><div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:2,marginBottom:8}}>{l.desc}</div><div style={{fontWeight:800,color:G,fontSize:"0.95rem"}}>{pLabel}</div></div>);
            })}
          </div>
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
          <div style={{...lbl,marginBottom:12}}>Select a Date</div>
          <div style={{marginBottom:20}}>
            <CalendarPicker value={date} onChange={async d=>{setDate(d);setSlot(null);setSlotIdx(-1);setLoadingSlots(true);try{const r=await fetch("/api/get-busy-times?date="+d);const data=await r.json();setBusyTimes(data.busy||[]);}catch(e){setBusyTimes([]);}setLoadingSlots(false);}} memberType={isMenlo?"menlo":"public"}/>
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
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(1)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"14px",borderRadius:50,fontWeight:600,cursor:"pointer",fontSize:"0.95rem"}}>← Back</button>
            <button onClick={()=>setStep(3)} disabled={!step2Done} style={{flex:2,background:step2Done?G:"#e5e7eb",color:step2Done?"white":"#9ca3af",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:step2Done?"pointer":"not-allowed",fontSize:"0.95rem"}}>
              Next: {lessonType==="private"?"Add Details":"Add People"} →
            </button>
          </div>
        </div>
      )}

      {step===3&&(
        <div>
          {lessonType==="semi"&&(
            <div style={{marginBottom:20}}>
              <div style={{...lbl,marginBottom:8}}>Partner Info <span style={{color:"#dc2626",fontWeight:700}}>*</span></div>
              <div style={{background:"#f9f9f6",borderRadius:10,padding:"16px"}}>
                <input placeholder="Partner Full Name (required)" value={partner.name} onChange={e=>setPartner({...partner,name:e.target.value})} style={{...inp,marginBottom:8,border:partner.name?"1.5px solid #e5e7eb":"1.5px solid #fca5a5"}}/>
                <input placeholder="Partner Email (optional — sends calendar invite)" value={partner.email} onChange={e=>setPartner({...partner,email:e.target.value})} style={{...inp,marginBottom:0}}/>
              </div>
            </div>
          )}
          {lessonType==="group"&&(
            <div style={{marginBottom:20}}>
              <div style={{...lbl,marginBottom:10}}>Group Size</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                {[3,4,5].map(n=>(<div key={n} onClick={()=>{setGroupSize(n);}} style={{background:groupSize===n?"#e8f0ee":"white",border:"2px solid "+(groupSize===n?G:"#e5e7eb"),borderRadius:10,padding:"10px",cursor:"pointer",textAlign:"center",fontWeight:groupSize===n?700:500,color:groupSize===n?G:"#374151"}}>{n} people</div>))}
              </div>
              <div style={{...lbl,marginBottom:8}}>Group Members <span style={{color:"#dc2626",fontWeight:700}}>*</span></div>
              {Array(groupSize-1).fill(null).map((_,i)=>(
                <div key={i} style={{background:"#f9f9f6",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
                  <div style={{fontSize:"0.82rem",fontWeight:700,color:"#6b7280",marginBottom:8}}>Person {i+2}</div>
                  <input placeholder="Full Name (required)" value={groupMembers[i]?.name||""} onChange={e=>{const m=[...groupMembers];m[i]={...m[i],name:e.target.value};setGroupMembers(m);}} style={{...inp,marginBottom:8,border:groupMembers[i]?.name?"1.5px solid #e5e7eb":"1.5px solid #fca5a5"}}/>
                  <input placeholder="Email (optional — sends calendar invite)" value={groupMembers[i]?.email||""} onChange={e=>{const m=[...groupMembers];m[i]={...m[i],email:e.target.value};setGroupMembers(m);}} style={{...inp,marginBottom:0}}/>
                </div>
              ))}
            </div>
          )}
          <div style={{marginBottom:16}}>
            <div style={{...lbl,marginBottom:6}}>Focus Area <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></div>
            <select value={focus} onChange={e=>setFocus(e.target.value)} style={{...inp,marginBottom:0}}>
              <option value="">No specific focus</option>
              {FOCUS_AREAS.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{marginBottom:24}}>
            <div style={{...lbl,marginBottom:6}}>Notes for David <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none"}}>(optional)</span></div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything David should know..." style={{...inp,height:80,resize:"vertical",fontFamily:"inherit",marginBottom:0}}/>
          </div>
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
          <div style={{background:"#f9f9f6",borderRadius:12,padding:"24px",marginBottom:20,border:"1.5px solid #e5e7eb"}}>
            <div style={{fontWeight:700,color:G,marginBottom:16,fontSize:"1rem"}}>Booking Summary</div>
            <div style={{fontSize:"0.92rem",color:"#374151",lineHeight:2.2}}>
              <div>📅 {fmtDate(date)}</div>
              <div>⏱ {slot&&toTimeStr(slot.s,slot.e)}</div>
              <div>🎯 {lessonType==="private"?"Private":lessonType==="semi"?"Semi-Private":"Group"} · {duration} min</div>
              {focus&&<div>🏓 Focus: {focus}</div>}
              <div>💰 ${price}{lessonType!=="private"?" per person":""}</div>
              <div>📍 {!isMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City":"Stanford Redwood City"}</div>
              {lessonType==="semi"&&<div>👥 Partner: {partner.name}</div>}
              {lessonType==="group"&&<div>👥 Group: {[user.name,...groupMembers.slice(0,groupSize-1).map(m=>m.name)].join(", ")}</div>}
            </div>
          </div>
          <div style={{background:"#fffbea",border:"1.5px solid #f4c430",borderRadius:8,padding:"10px 16px",marginBottom:20,fontSize:"0.85rem",color:"#7a5800"}}>
            ⚠️ Cancellation Policy: Please cancel at least 24 hours before your lesson.
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(3)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"14px",borderRadius:50,fontWeight:600,cursor:"pointer",fontSize:"0.95rem"}}>← Back</button>
            <button onClick={handleBook} disabled={submitting} style={{flex:2,background:submitting?"#9ca3af":G,color:"white",border:"none",padding:"14px",borderRadius:50,fontWeight:700,cursor:submitting?"not-allowed":"pointer",fontSize:"0.95rem"}}>
              {submitting?"Booking...":"Confirm Booking ✓"}
            </button>
          </div>
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
  if(type==="Private")return duration===90?195:130;
  if(type==="Semi-Private")return duration===90?210:140;
  return duration===90?210:140;
}
function getMenloNet(gross){return Math.round(gross*0.7*100)/100;}
function getDurationMins(s){return parseInt(s)||60;}
function getEarnings(allLessons,mockUsers,range){
  const now=new Date();
  let total=0,menloGross=0,menloNet=0;
  const rows=[];
  Object.entries(allLessons).forEach(([email,lessons])=>{
    const u=mockUsers[email]||{memberType:"public"};
    lessons.filter(l=>l.status!=="cancelled"&&(isPast(l.date,l.time)||l.status==="completed")).forEach(l=>{
      const d=new Date(l.date+"T12:00:00");
      const mins=getDurationMins(l.duration);
      let inRange=false;
      if(range==="week"){const s=new Date(now);s.setDate(now.getDate()-now.getDay());inRange=d>=s&&d<=now;}
      else if(range==="month"){inRange=d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}
      else{inRange=d.getFullYear()===now.getFullYear();}
      if(!inRange)return;
      const gross=getRate(l.type,mins,u.memberType);
      const net=u.memberType==="menlo"?getMenloNet(gross):gross;
      total+=net;
      if(u.memberType==="menlo"){menloGross+=gross;menloNet+=net;}
      rows.push({email,name:u.name||email,date:l.date,type:l.type,duration:l.duration,gross,net,isMenlo:u.memberType==="menlo"});
    });
  });
  return{total,menloGross,menloNet,rows};
}

function AdminPanel({allLessons,onUpdateLesson,onCancelLesson,pendingStudents,onApprove,onDeny,mockUsers,onAddStudent,onAddLesson,onToggleMenlo,onToggleSaturday,onBlockStudent}){
  const[tab,setTab]=useState(pendingStudents.length>0?"pending":"students");
  const[studentSearch,setStudentSearch]=useState("");
  const[selectedStudent,setSelectedStudent]=useState(null);
  const[editingStudent,setEditingStudent]=useState(false);
  const[editStudentData,setEditStudentData]=useState({});
  const[showSchedule,setShowSchedule]=useState(false);
  const[earningsRange,setEarningsRange]=useState("month");
  const[showNialExport,setShowNialExport]=useState(false);
  const[nialStart,setNialStart]=useState("");
  const[nialEnd,setNialEnd]=useState("");
  const[lessonFilter,setLessonFilter]=useState("upcoming");
  const[editingId,setEditingId]=useState(null);
  const[editNotes,setEditNotes]=useState("");
  const[confirmCancel,setConfirmCancel]=useState(null);
  const[scheduleStep,setScheduleStep]=useState(1);
  const[schedLessonType,setSchedLessonType]=useState("private");
  const[schedDuration,setSchedDuration]=useState(60);
  const[schedDate,setSchedDate]=useState("");
  const[schedSlot,setSchedSlot]=useState(null);
  const[schedSlotIdx,setSchedSlotIdx]=useState(-1);
  const[schedFocus,setSchedFocus]=useState("");
  const[schedNotes,setSchedNotes]=useState("");
  const[schedPartner,setSchedPartner]=useState({name:"",email:""});
  const[schedGroupSize,setSchedGroupSize]=useState(3);
  const[schedGroupMembers,setSchedGroupMembers]=useState([{name:"",email:""},{name:"",email:""},{name:"",email:""}]);
  const[schedBusyTimes,setSchedBusyTimes]=useState([]);
  const[schedLoadingSlots,setSchedLoadingSlots]=useState(false);
  const[schedSubmitting,setSchedSubmitting]=useState(false);
  const[showAddStudent,setShowAddStudent]=useState(false);
  const[newStudent,setNewStudent]=useState({name:"",email:"",memberType:"public"});

  const earnings=getEarnings(allLessons,mockUsers,earningsRange);
  const allStudents=Object.keys(allLessons);
  const filteredStudents=allStudents.filter(email=>{
    const u=mockUsers[email]||{};
    return (u.name||email).toLowerCase().includes(studentSearch.toLowerCase())||email.toLowerCase().includes(studentSearch.toLowerCase());
  });

  const allLessonsList=Object.entries(allLessons).flatMap(([email,lessons])=>
    lessons.map(l=>({...l,studentEmail:email,studentName:mockUsers[email]?.name||email,isMenlo:mockUsers[email]?.memberType==="menlo"}))
  ).sort((a,b)=>new Date(b.date)-new Date(a.date));

  const filteredLessons=allLessonsList.filter(l=>{
    if(lessonFilter==="upcoming")return !isPast(l.date,l.time)&&l.status!=="cancelled";
    if(lessonFilter==="past")return isPast(l.date,l.time)||l.status==="completed";
    if(lessonFilter==="cancelled")return l.status==="cancelled";
    return true;
  });

  const SCHED_PRICES={private:{60:selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo"?115:130,90:selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo"?172.50:195},semi:{60:selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo"?60:70,90:selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo"?90:105},group:{60:140,90:210}};
  const schedIsMenlo=selectedStudent&&mockUsers[selectedStudent]?.memberType==="menlo";
  const schedSlots=schedDate?getSlots(schedDate,schedIsMenlo?"menlo":"public",schedDuration).filter(s=>!schedBusyTimes.some(b=>s.s<b.endMins&&s.e>b.startMins)):[];
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
    const memberNames=schedLessonType==="semi"?[student.name,schedPartner.name]:schedLessonType==="group"?[student.name,...schedGroupMembers.slice(0,schedGroupSize-1).map(m=>m.name)]:[student.name];
    const titleSuffix=schedLessonType==="group"?" pb group lesson":" pb lesson";
    const summary=memberNames.join("/")+titleSuffix;
    const location=!schedIsMenlo?"Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063, USA":"Stanford Redwood City";
    const description="Student: "+student.name+"\nEmail: "+selectedStudent+"\nType: "+lessonLabel+" "+schedDuration+"min\nFocus: "+(schedFocus||"Not specified")+"\nNotes: "+(schedNotes||"None")+"\nLocation: "+location+"\nManage: https://dmpickleball.com";
    let eventId="";
    try{
      const r=await fetch("/api/create-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary,description,date:schedDate,startTime,endTime,location,studentEmail:selectedStudent,studentName:student.name})});
      const d=await r.json();
      if(d.eventId)eventId=d.eventId;
    }catch(e){console.error("GCal:",e);}
    const startISO=schedDate+"T"+startTime+":00";
    const endISO=schedDate+"T"+endTime+":00";
    const link="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(summary)+"&dates="+startISO.replace(/[-:]/g,"").slice(0,15)+"/"+endISO.replace(/[-:]/g,"").slice(0,15)+"&details="+encodeURIComponent(description)+"&location="+encodeURIComponent(location);
    try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:selectedStudent,_replyto:"dmpickleball@gmail.com",_subject:"Your lesson is booked - "+fmtDateShort(schedDate),message:"Hi "+student.name+",\n\nDavid has scheduled a lesson for you!\n\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+schedDuration+" min\nFocus: "+(schedFocus||"Not specified")+"\nLocation: "+location+"\n\nAdd to Google Calendar:\n"+link+"\n\nSee you on the court!\nDavid Mok\n(650) 839-3398"})});}catch(e){}
    try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:"dmpickleball@gmail.com",_replyto:selectedStudent,_subject:"Scheduled: "+summary+" - "+fmtDateShort(schedDate),message:"You scheduled a lesson!\n\nStudent: "+student.name+"\nEmail: "+selectedStudent+"\nDate: "+fmtDate(schedDate)+"\nTime: "+timeStr+"\nType: "+lessonLabel+" - "+schedDuration+" min\nFocus: "+(schedFocus||"Not specified")+"\nLocation: "+location})});}catch(e){}
    const newLesson={id:Date.now(),date:schedDate,time:timeStr,type:lessonLabel,duration:schedDuration+" min",status:"confirmed",focus:schedFocus,notes:"",photos:[],videos:[],gcalEventId:eventId};
    onAddLesson(selectedStudent,newLesson);
    setShowSchedule(false);
    setSchedStep(1);setSchedLessonType("private");setSchedDuration(60);setSchedDate("");setSchedSlot(null);setSchedSlotIdx(-1);setSchedFocus("");setSchedNotes("");setSchedBusyTimes([]);
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
      lessons.filter(l=>l.status!=="cancelled"&&(isPast(l.date,l.time)||l.status==="completed")).forEach(l=>{
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
      <div style={{marginBottom:28,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Admin Panel</div>
          <h2 style={{fontWeight:900,fontSize:"1.6rem",color:G}}>David Dashboard</h2>
        </div>
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
              <button onClick={exportNial} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>⬇ Download CSV</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:32}}>
        <div style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
            {["week","month","year"].map(r=>(<span key={r} onClick={()=>setEarningsRange(r)} style={{marginRight:8,cursor:"pointer",color:earningsRange===r?G:"#9ca3af",fontWeight:earningsRange===r?800:500}}>{r.charAt(0).toUpperCase()+r.slice(1)}</span>))}
          </div>
          <div style={{fontSize:"2rem",fontWeight:900,color:G}}>${earnings.total.toFixed(2)}</div>
          <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:4}}>Your earnings</div>
        </div>
        <div style={{background:"#e8f0ee",borderRadius:12,padding:"20px 24px",border:"1.5px solid "+G}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Menlo Net (70%)</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:G}}>${earnings.menloNet.toFixed(2)}</div>
          <div style={{fontSize:"0.8rem",color:"#4b5563",marginTop:4}}>Your 70% from MCC</div>
        </div>
        <div style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Total Students</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:"#1a1a1a"}}>{allStudents.length}</div>
          <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:4}}>Active students</div>
        </div>
        <div style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Upcoming</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:"#1a1a1a"}}>{allLessonsList.filter(l=>!isPast(l.date,l.time)&&l.status!=="cancelled").length}</div>
          <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:4}}>Lessons scheduled</div>
        </div>
      </div>

      <div style={{display:"flex",gap:0,borderBottom:"2px solid #e5e7eb",marginBottom:28,flexWrap:"wrap"}}>
        {[["pending","Pending"+(pendingStudents.length>0?" ("+pendingStudents.length+")":"")],["students","Students"],["lessons","Lessons"],["earnings","Earnings"]].map(([t,label])=>(
          <button key={t} onClick={()=>{setTab(t);setSelectedStudent(null);setShowSchedule(false);}}
            style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t?G:"transparent"),marginBottom:-2,padding:"10px 20px",fontSize:"0.88rem",fontWeight:tab===t?700:500,color:tab===t?G:"#6b7280",cursor:"pointer"}}>
            {label}
            {t==="pending"&&pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"1px 7px",fontSize:"0.7rem",fontWeight:800,marginLeft:6}}>{pendingStudents.length}</span>}
          </button>
        ))}
      </div>

      {tab==="pending"&&(
        <div>
          {pendingStudents.length===0
            ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>No pending requests right now.</div>
            :pendingStudents.map(student=>(
              <div key={student.id} style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:"0.97rem"}}>{student.name}</div>
                <div style={{fontSize:"0.83rem",color:"#6b7280",marginTop:2,marginBottom:12}}>{student.email} · Requested {student.requestedAt}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:"0.78rem",fontWeight:600,color:"#6b7280"}}>Approve as:</span>
                  {["public","menlo"].map(type=>(<button key={type} onClick={()=>onApprove(student,type)} style={{background:type==="menlo"?G:"#1a1a1a",color:"white",border:"none",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✓ {type==="menlo"?"Menlo Club":"General"}</button>))}
                  <button onClick={()=>onDeny(student.id)} style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>✕ Deny</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab==="students"&&!selectedStudent&&(
        <div>
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
                <div key={email} onClick={()=>setSelectedStudent(email)} style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,transition:"all 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=G}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:u.memberType==="menlo"?G:"#e8f0ee",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1rem",color:u.memberType==="menlo"?"white":G}}>
                      {(u.name||email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:"0.97rem"}}>{u.name||email}</div>
                      <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:2}}>{email}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {u.memberType==="menlo"&&<span style={{background:G,color:"white",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>MCC</span>}
                    {u.blocked&&<span style={{background:"#dc2626",color:"white",padding:"2px 10px",borderRadius:50,fontSize:"0.7rem",fontWeight:700}}>Blocked</span>}
                    <span style={{fontSize:"0.8rem",color:"#6b7280"}}>{upcoming.length} upcoming · {completed.length} completed</span>
                    <span style={{color:G,fontSize:"1.1rem"}}>›</span>
                  </div>
                </div>
              );
            })}
            {filteredStudents.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:"40px"}}>No students found.</div>}
          </div>
        </div>
      )}

      {tab==="students"&&selectedStudent&&!showSchedule&&(
        <div>
          <button onClick={()=>setSelectedStudent(null)} style={{background:"none",border:"none",color:G,fontWeight:700,cursor:"pointer",fontSize:"0.88rem",marginBottom:20,padding:0}}>← Back to Students</button>
          <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"24px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:mockUsers[selectedStudent]?.memberType==="menlo"?G:"#e8f0ee",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1.3rem",color:mockUsers[selectedStudent]?.memberType==="menlo"?"white":G}}>
                  {(mockUsers[selectedStudent]?.name||selectedStudent).charAt(0).toUpperCase()}
                </div>
                <div>
                  {editingStudent?(
                    <div>
                      <input value={editStudentData.name||""} onChange={e=>setEditStudentData({...editStudentData,name:e.target.value})} style={{...inp,marginBottom:8,fontWeight:700,fontSize:"1rem"}} placeholder="Full Name"/>
                      <input value={editStudentData.email||""} onChange={e=>setEditStudentData({...editStudentData,email:e.target.value})} style={{...inp,marginBottom:0,fontSize:"0.85rem"}} placeholder="Email"/>
                    </div>
                  ):(
                    <div>
                      <div style={{fontWeight:800,fontSize:"1.1rem"}}>{mockUsers[selectedStudent]?.name||selectedStudent}</div>
                      <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>{selectedStudent}</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {editingStudent?(
                  <>
                    <button onClick={()=>setEditingStudent(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>Cancel</button>
                    <button onClick={()=>{onAddStudent({name:editStudentData.name,email:selectedStudent,memberType:mockUsers[selectedStudent]?.memberType||"public"});setEditingStudent(false);}} style={{background:G,color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>Save ✓</button>
                  </>
                ):(
                  <button onClick={()=>{setEditStudentData({name:mockUsers[selectedStudent]?.name||"",email:selectedStudent});setEditingStudent(true);}} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>✏️ Edit</button>
                )}
                <button onClick={()=>setShowSchedule(true)} style={{background:G,color:"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>+ Schedule Lesson</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>onToggleMenlo(selectedStudent)} style={{background:mockUsers[selectedStudent]?.memberType==="menlo"?G:"white",color:mockUsers[selectedStudent]?.memberType==="menlo"?"white":G,border:"1.5px solid "+G,padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>
                {mockUsers[selectedStudent]?.memberType==="menlo"?"✓ Menlo Club":"Set Menlo Club"}
              </button>
              <button onClick={()=>onBlockStudent(selectedStudent)} style={{background:mockUsers[selectedStudent]?.blocked?"#dc2626":"white",color:mockUsers[selectedStudent]?.blocked?"white":"#dc2626",border:"1.5px solid #dc2626",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>
                {mockUsers[selectedStudent]?.blocked?"Unblock":"Block Student"}
              </button>
            </div>
          </div>

          <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Lesson History</div>
          {(allLessons[selectedStudent]||[]).length===0&&<div style={{color:"#9ca3af",fontSize:"0.9rem",textAlign:"center",padding:"32px"}}>No lessons yet.</div>}
          {(allLessons[selectedStudent]||[]).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>(
            <div key={l.id} style={{background:"white",borderRadius:12,border:"1.5px solid "+(editingId===l.id?G:"#e5e7eb"),marginBottom:10,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:700}}>{fmtDateShort(l.date)} · {l.time}</div>
                  <div style={{fontSize:"0.83rem",color:"#6b7280",marginTop:2}}>{l.type} · {l.duration}{l.focus?" · 🎯 "+l.focus:""}</div>
                  {l.notes&&editingId!==l.id&&<div style={{background:"#f9f9f6",borderRadius:6,padding:"8px 12px",marginTop:8,fontSize:"0.85rem",color:"#374151"}}>{l.notes}</div>}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{background:l.status==="confirmed"?"#e8f0ee":l.status==="cancelled"?"#fef2f2":"#fffbea",color:l.status==="confirmed"?G:l.status==="cancelled"?"#dc2626":"#92400e",padding:"3px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                    {l.status==="confirmed"?"✓ Confirmed":l.status==="cancelled"?"✕ Cancelled":"⏳ Pending"}
                  </span>
                  {l.status!=="cancelled"&&(
                    <>
                      <button onClick={()=>editingId===l.id?setEditingId(null):(setEditingId(l.id),setEditNotes(l.notes||""))} style={{background:editingId===l.id?"#f3f4f6":G,color:editingId===l.id?"#374151":"white",border:"none",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>
                        {editingId===l.id?"Cancel":"✏️ Notes"}
                      </button>
                      {!isPast(l.date,l.time)&&(
                        <button onClick={()=>setConfirmCancel(confirmCancel===l.id?null:l.id)} style={{background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>✕ Cancel</button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {confirmCancel===l.id&&(
                <div style={{background:"#fef2f2",borderTop:"1px solid #fca5a5",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <span style={{fontWeight:700,color:"#991b1b",fontSize:"0.88rem"}}>Cancel this lesson?</span>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setConfirmCancel(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Keep it</button>
                    <button onClick={()=>{onCancelLesson(selectedStudent,l.id);setConfirmCancel(null);}} style={{background:"#dc2626",color:"white",border:"none",padding:"6px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>Yes, Cancel</button>
                  </div>
                </div>
              )}
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
          ))}
        </div>
      )}

      {tab==="students"&&selectedStudent&&showSchedule&&(
        <div style={{maxWidth:620}}>
          <button onClick={()=>{setShowSchedule(false);setSchedStep(1);}} style={{background:"none",border:"none",color:G,fontWeight:700,cursor:"pointer",fontSize:"0.88rem",marginBottom:20,padding:0}}>← Back to {mockUsers[selectedStudent]?.name}</button>
          <h3 style={{fontWeight:800,fontSize:"1.2rem",marginBottom:4,color:G}}>Schedule Lesson</h3>
          <p style={{color:"#6b7280",fontSize:"0.88rem",marginBottom:24}}>Scheduling for <strong>{mockUsers[selectedStudent]?.name}</strong></p>

          <div style={{display:"flex",alignItems:"center",marginBottom:28,gap:0}}>
            {["Type","Date & Time","Details","Confirm"].map((s,i)=>{
              const n=i+1;
              const active=scheduleStep===n;
              const done=scheduleStep>n;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",flex:i<3?1:"auto"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:done?G:active?G:"#e5e7eb",color:done||active?"white":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.8rem",cursor:done?"pointer":"default"}} onClick={()=>done&&setSchedStep(n)}>
                      {done?"✓":n}
                    </div>
                    <div style={{fontSize:"0.62rem",fontWeight:600,color:active?G:done?G:"#9ca3af",whiteSpace:"nowrap"}}>{s}</div>
                  </div>
                  {i<3&&<div style={{flex:1,height:2,background:done?G:"#e5e7eb",margin:"0 6px",marginBottom:14}}/>}
                </div>
              );
            })}
          </div>

          {scheduleStep===1&&(
            <div>
              <div style={{...lbl,marginBottom:12}}>Lesson Type</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                {[{id:"private",icon:"🎯",label:"Private"},{id:"semi",icon:"👥",label:"Semi-Private"},{id:"group",icon:"🏆",label:"Group"}].map(l=>(
                  <div key={l.id} onClick={()=>setSchedLessonType(l.id)} style={{background:schedLessonType===l.id?"#e8f0ee":"white",border:"2px solid "+(schedLessonType===l.id?G:"#e5e7eb"),borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{l.icon}</div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",color:schedLessonType===l.id?G:"#1a1a1a"}}>{l.label}</div>
                  </div>
                ))}
              </div>
              <div style={{...lbl,marginBottom:12}}>Duration</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
                {[60,90].map(d=>(<div key={d} onClick={()=>setSchedDuration(d)} style={{background:schedDuration===d?"#e8f0ee":"white",border:"2px solid "+(schedDuration===d?G:"#e5e7eb"),borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"center",fontWeight:700,color:schedDuration===d?G:"#1a1a1a"}}>{d} min</div>))}
              </div>
              <button onClick={()=>setSchedStep(2)} style={{width:"100%",background:G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"0.95rem"}}>Next: Date & Time →</button>
            </div>
          )}

          {scheduleStep===2&&(
            <div>
              <div style={{...lbl,marginBottom:12}}>Select a Date</div>
              <div style={{marginBottom:20}}>
                <CalendarPicker value={schedDate} onChange={async d=>{setSchedDate(d);setSchedSlot(null);setSchedSlotIdx(-1);setSchedLoadingSlots(true);try{const r=await fetch("/api/get-busy-times?date="+d);const data=await r.json();setSchedBusyTimes(data.busy||[]);}catch(e){setSchedBusyTimes([]);}setSchedLoadingSlots(false);}} memberType={schedIsMenlo?"menlo":"public"}/>
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
                <button onClick={()=>setSchedStep(1)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={()=>setSchedStep(3)} disabled={!schedDate||!schedSlot} style={{flex:2,background:schedDate&&schedSlot?G:"#e5e7eb",color:schedDate&&schedSlot?"white":"#9ca3af",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:schedDate&&schedSlot?"pointer":"not-allowed"}}>Next →</button>
              </div>
            </div>
          )}

          {scheduleStep===3&&(
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
                <button onClick={()=>setSchedStep(2)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={()=>setSchedStep(4)} style={{flex:2,background:G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:"pointer"}}>Next: Review →</button>
              </div>
            </div>
          )}

          {scheduleStep===4&&(
            <div>
              <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:20,border:"1.5px solid #e5e7eb"}}>
                <div style={{fontWeight:700,color:G,marginBottom:12}}>Booking Summary</div>
                <div style={{fontSize:"0.9rem",color:"#374151",lineHeight:2}}>
                  <div>👤 {mockUsers[selectedStudent]?.name}</div>
                  <div>📅 {fmtDate(schedDate)}</div>
                  <div>⏱ {schedSlot&&toTimeStr(schedSlot.s,schedSlot.e)}</div>
                  <div>🎯 {schedLessonType==="private"?"Private":schedLessonType==="semi"?"Semi-Private":"Group"} · {schedDuration} min</div>
                  {schedFocus&&<div>🏓 {schedFocus}</div>}
                  <div>💰 ${SCHED_PRICES[schedLessonType][schedDuration]}{schedLessonType!=="private"?" per person":""}</div>
                  <div>📍 {!schedIsMenlo?"Andrew Spinas Park, Redwood City":"Stanford Redwood City"}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setSchedStep(3)} style={{flex:1,background:"white",border:"1.5px solid #e5e7eb",padding:"13px",borderRadius:50,fontWeight:600,cursor:"pointer"}}>← Back</button>
                <button onClick={handleSchedule} disabled={schedSubmitting} style={{flex:2,background:schedSubmitting?"#9ca3af":G,color:"white",border:"none",padding:"13px",borderRadius:50,fontWeight:700,cursor:schedSubmitting?"not-allowed":"pointer"}}>
                  {schedSubmitting?"Scheduling...":"Confirm & Send Confirmation ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="lessons"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {[["upcoming","Upcoming"],["past","Past"],["cancelled","Cancelled"],["all","All"]].map(([f,label])=>(
              <button key={f} onClick={()=>setLessonFilter(f)} style={{background:lessonFilter===f?G:"white",color:lessonFilter===f?"white":"#374151",border:"1.5px solid "+(lessonFilter===f?G:"#e5e7eb"),padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem",fontWeight:lessonFilter===f?700:500}}>
                {label} <span style={{opacity:0.7,fontSize:"0.75rem"}}>({allLessonsList.filter(l=>{if(f==="upcoming")return !isPast(l.date,l.time)&&l.status!=="cancelled";if(f==="past")return isPast(l.date,l.time)||l.status==="completed";if(f==="cancelled")return l.status==="cancelled";return true;}).length})</span>
              </button>
            ))}
          </div>
          {filteredLessons.length===0
            ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"40px",textAlign:"center",color:"#9ca3af"}}>No lessons found.</div>
            :filteredLessons.map(l=>(
              <div key={l.id+l.studentEmail} style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"16px 20px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{background:"#e8f0ee",borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:48}}>
                    <div style={{fontSize:"1.2rem",fontWeight:900,color:G,lineHeight:1}}>{new Date(l.date+"T12:00:00").getDate()}</div>
                    <div style={{fontSize:"0.6rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{new Date(l.date+"T12:00:00").toLocaleString("default",{month:"short"})}</div>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.95rem"}}>{l.studentName}</div>
                    <div style={{fontSize:"0.82rem",color:"#6b7280",marginTop:2}}>{l.type} · {l.duration} · {l.time}</div>
                    {l.focus&&<div style={{fontSize:"0.78rem",color:G,marginTop:2,fontWeight:600}}>🎯 {l.focus}</div>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {l.isMenlo&&<span style={{background:G,color:"white",padding:"2px 8px",borderRadius:50,fontSize:"0.68rem",fontWeight:700}}>MCC</span>}
                  <span style={{background:l.status==="confirmed"?"#e8f0ee":l.status==="cancelled"?"#fef2f2":"#fffbea",color:l.status==="confirmed"?G:l.status==="cancelled"?"#dc2626":"#92400e",padding:"3px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                    {l.status==="confirmed"?"✓ Confirmed":l.status==="cancelled"?"✕ Cancelled":"⏳ Pending"}
                  </span>
                  <button onClick={()=>{setSelectedStudent(l.studentEmail);setTab("students");}} style={{background:"none",border:"1.5px solid #e5e7eb",padding:"5px 12px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:600,color:"#374151"}}>View Student</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab==="earnings"&&(
        <div>
          <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>Earnings — This {earningsRange.charAt(0).toUpperCase()+earningsRange.slice(1)}</div>
          {earnings.rows.length===0
            ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No completed lessons this {earningsRange}.</div>
            :<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                <thead>
                  <tr style={{background:"#f9f9f6",borderBottom:"1.5px solid #e5e7eb"}}>
                    {["Date","Student","Type","Duration","Your Cut"].map(h=>(<th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {earnings.rows.map((r,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f3f4f6",background:r.isMenlo?"#f0faf5":"white"}}>
                      <td style={{padding:"12px 16px"}}>{fmtDateShort(r.date)}</td>
                      <td style={{padding:"12px 16px"}}>{r.name}{r.isMenlo&&<span style={{background:G,color:"white",fontSize:"0.65rem",fontWeight:700,padding:"1px 6px",borderRadius:50,marginLeft:6}}>MCC</span>}</td>
                      <td style={{padding:"12px 16px"}}>{r.type}</td>
                      <td style={{padding:"12px 16px"}}>{r.duration}</td>
                      <td style={{padding:"12px 16px",fontWeight:700,color:G}}>${r.net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const isAdminRoute=window.location.pathname==="/admin";const[page,setPage]=useState(isAdminRoute?"adminlogin":"home");
  const[user,setUser]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[allLessons,setAllLessons]=useState(INIT_LESSONS);
  const[pendingStudents,setPendingStudents]=useState(INIT_PENDING);
  const[mockUsersState,setMockUsersState]=useState(MOCK_USERS);
  const userLessons=user?allLessons[user.email]||[]:[];
  const cancelLesson=async(id)=>{
    const lesson=userLessons.find(l=>l.id===id);
    if(lesson?.gcalEventId){
      try{await fetch('/api/cancel-booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:lesson.gcalEventId})});}
      catch(e){console.error('Calendar cancel failed:',e);}
    }
    const cancelMsg="Your pickleball lesson on "+fmtDateShort(lesson.date)+" at "+lesson.time+" has been cancelled.\n\nIf you have any questions, please contact David at (650) 839-3398.";
    try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:user.email,_subject:"Lesson Cancelled - "+fmtDateShort(lesson.date),message:"Hi "+user.name+",\n\n"+cancelMsg})});}catch(e){}
    try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:"dmpickleball@gmail.com",_subject:"Lesson Cancelled: "+user.name+" - "+fmtDateShort(lesson.date),message:user.name+" has cancelled their lesson on "+fmtDateShort(lesson.date)+" at "+lesson.time+"."})});}catch(e){}
    if(lesson.partnerEmail){try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:lesson.partnerEmail,_subject:"Lesson Cancelled - "+fmtDateShort(lesson.date),message:"Hi,\n\n"+cancelMsg})});}catch(e){}}
    if(lesson.groupEmails){lesson.groupEmails.forEach(async email=>{if(email){try{await fetch("https://formspree.io/f/mvzwanal",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email,_subject:"Lesson Cancelled - "+fmtDateShort(lesson.date),message:"Hi,\n\n"+cancelMsg})});}catch(e){}}});}
    setAllLessons(prev=>({...prev,[user.email]:prev[user.email].map(l=>l.id===id?{...l,status:"cancelled"}:l)}));
  };
  const adminCancel=async(email,id)=>{
    const lesson=(allLessons[email]||[]).find(l=>l.id===id);
    if(lesson?.gcalEventId){
      try{
        await fetch("/api/cancel-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:lesson.gcalEventId})});
      }catch(e){console.error("Admin GCal cancel failed:",e);}
    }
    setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,status:"cancelled"}:l)}));
  };
  const addLesson=async lesson=>{
    setAllLessons(prev=>({...prev,[user.email]:[...(prev[user.email]||[]),lesson]}));
    try{
      await fetch("/api/save-lesson",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson:{...lesson,studentEmail:user.email}})});
    }catch(e){console.error("Save lesson error:",e);}
  };
  const updateLesson=async(email,id,updates)=>{
    setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,...updates}:l)}));
    try{
      await fetch("/api/update-lesson",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:id,updates})});
    }catch(e){console.error("Update lesson error:",e);}
  };
  const approveStudent=async(student,memberType)=>{
    try{
      await fetch("/api/approve-student",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:student.id,email:student.email,name:student.name,phone:student.phone||"",homeCourt:student.homeCourt||"",memberType,action:"approve"})});
      setAllLessons(prev=>({...prev,[student.email]:[]}));
      setMockUsersState(prev=>({...prev,[student.email]:{name:student.name,memberType,approved:true}}));
      setPendingStudents(prev=>prev.filter(s=>s.id!==student.id));
      // Send approval email
      fetch("https://formspree.io/f/"+FORMSPREE_ID,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:student.email,_subject:"Your DM Pickleball account is approved!",message:"Hi "+student.name+",\n\nYour account has been approved! You can now log in at:\nhttps://dmpickleball.com\n\nSee you on the court!\nDavid Mok"})}).catch(()=>{});
    }catch(e){console.error("Approve error:",e);}
  };
  const denyStudent=async id=>{
    const student=pendingStudents.find(s=>s.id===id);
    if(student){
      try{
        await fetch("/api/approve-student",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:id,action:"deny"})});
      }catch(e){console.error("Deny error:",e);}
    }
    setPendingStudents(prev=>prev.filter(s=>s.id!==id));
  };
  const addStudent=({name,email,memberType})=>{setMockUsersState(prev=>({...prev,[email]:{name,memberType,approved:true,password:""}}));setAllLessons(prev=>({...prev,[email]:[]}));};
  const adminAddLesson=async(email,lesson)=>{
    setAllLessons(prev=>({...prev,[email]:[...(prev[email]||[]),lesson]}));
    try{
      await fetch("/api/save-lesson",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson:{...lesson,studentEmail:email}})});
    }catch(e){console.error("Admin save lesson error:",e);}
  };
  const toggleMenlo=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],memberType:prev[email]?.memberType==="menlo"?"public":"menlo"}}));
  const toggleSaturday=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],saturdayEnabled:!prev[email]?.saturdayEnabled}}));
  const blockStudent=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],blocked:!prev[email]?.blocked}}));
  const logout=()=>{setUser(null);setIsAdmin(false);setPage("home");};
  if(isAdmin)return(
    <div style={{fontFamily:"Segoe UI,sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{color:Y,fontWeight:900,fontSize:"1.3rem",letterSpacing:1}}>DM <span style={{color:"white"}}>Pickleball</span> <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.6)",fontWeight:400}}>· Admin</span></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {pendingStudents.length>0&&<span style={{background:"#dc2626",color:"white",borderRadius:50,padding:"3px 10px",fontSize:"0.75rem",fontWeight:800}}>{pendingStudents.length} pending</span>}
          <button onClick={logout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.4)",color:"white",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.85rem"}}>Log out</button>
        </div>
      </nav>
      <AdminPanel allLessons={allLessons} onUpdateLesson={updateLesson} onCancelLesson={adminCancel} pendingStudents={pendingStudents} onApprove={approveStudent} onDeny={denyStudent} mockUsers={mockUsersState} onAddStudent={addStudent} onAddLesson={adminAddLesson} onToggleMenlo={toggleMenlo} onToggleSaturday={toggleSaturday} onBlockStudent={blockStudent}/>
    </div>
  );
  return(
    <div style={{fontFamily:"Segoe UI,sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <Nav user={user} onLogin={()=>setPage("login")} onLogout={logout} setPage={setPage} currentPage={page}/>
      {page==="adminlogin"&&<AdminLoginPage onAdminLogin={()=>setIsAdmin(true)}/>}
      {page==="home"&&!isAdminRoute&&<Homepage setPage={setPage}/>}
      {page==="pricing"&&<PricingPage/>}
      {page==="gear"&&<GearPage/>}
      {page==="contact"&&<ContactPage/>}
      {page==="login"&&<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>}
      {page==="dashboard"&&(user?<Dashboard user={user} setPage={setPage} lessons={userLessons} onCancel={cancelLesson}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      {page==="booking"&&(user?<BookingPage user={user} setPage={setPage} onAddLesson={addLesson}/>:<LoginPage onLogin={u=>{setUser(u);setPage("dashboard");}} onAdminLogin={()=>setIsAdmin(true)}/>)}
      <footer style={{textAlign:"center",padding:24,color:"#9ca3af",fontSize:"0.82rem",borderTop:"1px solid #e5e7eb",marginTop:20}}>
        © 2026 DM Pickleball — David Mok · SF Peninsula, Bay Area
      </footer>
    </div>
  );
}
// Thu Mar 12 09:07:24 PDT 2026
