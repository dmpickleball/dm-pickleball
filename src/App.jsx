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

// ─── THEME ───────────────────────────────────────────────────────────────────
const G = "#006039", Y = "#f4c430";
const inp = { padding:"11px 14px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:"0.92rem", outline:"none", background:"#fafafa", width:"100%", boxSizing:"border-box", marginBottom:12 };
const lbl = { fontSize:"0.78rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5, display:"block" };

// ─── SCHEDULING DATA ─────────────────────────────────────────────────────────
const STANFORD_BLOCKS = { 2:{start:16*60,end:19*60}, 3:{start:12*60,end:13*60+30}, 4:{start:16*60,end:19*60}, 5:{start:9*60+30,end:11*60} };
const PICKUP = { 1:{buffer:14*60+35,resume:15*60+20}, 2:{buffer:14*60+35,resume:15*60+20}, 3:{buffer:14*60,resume:14*60+45}, 4:{buffer:14*60,resume:14*60+45}, 5:{buffer:14*60+35,resume:15*60+20} };
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
const ADMIN_USER = { email:"david@dmpickleball.com", password:"admin123" };

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
  const sb=STANFORD_BLOCKS[dow],pk=PICKUP[dow],slots=[];
  for(let s=8*60;s+duration<=19*60;s+=30){
    const e=s+duration;
    if(sb&&s<sb.end&&e>sb.start)continue;
    if(pk&&s<pk.resume&&e>pk.buffer)continue;
    if(memberType==="menlo"){const ok=e<=14*60||(pk&&s>=pk.resume&&e<=17*60);if(!ok)continue;}
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
      style={{background:copied?"#e8f5ee":"white",color:copied?G:"#374151",border:`1.5px solid ${copied?G:"#e5e7eb"}`,padding:"7px 16px",borderRadius:8,cursor:"pointer",fontSize:"0.82rem",fontWeight:700,whiteSpace:"nowrap",transition:"all 0.2s"}}>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#e8f5ee"}}>
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
      <div onClick={()=>setPage("home")} style={{color:Y,fontWeight:900,fontSize:"1.3rem",cursor:"pointer"}}>DM <span style={{color:"white"}}>Pickleball</span></div>
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
          <div style={{background:isHistory?"#e8f5ee":lesson.status==="confirmed"?"#e8f5ee":"#fffbea",border:`1.5px solid ${isHistory?G:lesson.status==="confirmed"?G:Y}`,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:56}}>
            <div style={{fontSize:"1.3rem",fontWeight:900,color:isHistory?G:lesson.status==="confirmed"?G:"#92400e",lineHeight:1}}>{dateObj.getDate()}</div>
            <div style={{fontSize:"0.65rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{dateObj.toLocaleString("default",{month:"short"})}</div>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:"0.97rem"}}>{lesson.type} · {lesson.duration}</div>
            <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>⏱ {lesson.time}</div>
            {lesson.focus&&<div style={{fontSize:"0.8rem",color:G,marginTop:3,fontWeight:600}}>🎯 {lesson.focus}</div>}
            {!isHistory&&(
              <div style={{marginTop:5,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                <span style={{background:lesson.status==="confirmed"?"#e8f5ee":"#fffbea",color:lesson.status==="confirmed"?G:"#92400e",padding:"2px 10px",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
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
              {lesson.notes&&<span style={{fontSize:"0.75rem",background:"#e8f5ee",color:G,padding:"3px 10px",borderRadius:50,fontWeight:600}}>📝</span>}
              {lesson.photos?.length>0&&<span style={{fontSize:"0.75rem",background:"#e8f5ee",color:G,padding:"3px 10px",borderRadius:50,fontWeight:600}}>🖼 {lesson.photos.length}</span>}
              {lesson.videos?.length>0&&<span style={{fontSize:"0.75rem",background:"#e8f5ee",color:G,padding:"3px 10px",borderRadius:50,fontWeight:600}}>🎬 {lesson.videos.length}</span>}
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
      <div style={{background:`linear-gradient(135deg,${G},#004d2e)`,color:"white",textAlign:"center",padding:"80px 24px 64px"}}>
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
            <div style={{background:"#e8f5ee",border:`1px solid ${G}20`,borderRadius:10,padding:"10px 16px",marginTop:14,display:"inline-flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:"1.1rem"}}>🥇</span>
              <span style={{fontSize:"0.83rem",fontWeight:700,color:G}}>Multiple Gold Medals · Tournament Competitor</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:14}}>
              {["Multiple Gold Medalist","Tournament Competitor","CRBN Ambassador","Tennis Convert Specialist","All Skill Levels","SF Peninsula"].map(tag=>(
                <span key={tag} style={{background:"#e8f5ee",color:G,padding:"6px 14px",borderRadius:50,fontSize:"0.8rem",fontWeight:600}}>{tag}</span>
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
      <div style={{background:`linear-gradient(135deg,${G},#004d2e)`,color:"white",textAlign:"center",padding:"60px 24px"}}>
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
          <div style={{flex:1,background:"#e8f5ee",border:`1.5px solid ${G}`,borderRadius:10,padding:"14px 18px",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>📱</div>
            <div style={{fontWeight:700,fontSize:"0.9rem"}}>Text or Call</div>
            <div style={{color:G,fontWeight:700,marginTop:4}}>(650) 839-3398</div>
          </div>
          <div style={{flex:1,background:"#e8f5ee",border:`1.5px solid ${G}`,borderRadius:10,padding:"14px 18px",textAlign:"center"}}>
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

function LoginPage({onLogin,onAdminLogin}){
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[mode,setMode]=useState("login");
  const[name,setName]=useState("");
  const[error,setError]=useState("");
  const[signedUp,setSignedUp]=useState(false);
  if(signedUp)return(
    <div style={{maxWidth:440,margin:"80px auto",padding:"0 24px",textAlign:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:40,boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎾</div>
        <h2 style={{color:G,marginBottom:10}}>Request Received!</h2>
        <p style={{color:"#6b7280",lineHeight:1.7}}>Thanks <strong>{name}</strong>! David will review your request and reach out at <strong>{email}</strong> once approved.</p>
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
          <p style={{color:"#6b7280",fontSize:"0.88rem",marginTop:6}}>{mode==="login"?"Access your lessons & booking portal":"David will approve your account"}</p>
        </div>
        {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",color:"#991b1b",fontSize:"0.88rem",marginBottom:14}}>{error}</div>}
        {mode==="signup"&&<input style={inp} type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)}/>}
        <input style={inp} type="email" placeholder="Email Address" value={email} onChange={e=>{setEmail(e.target.value);setError("");}}/>
        {mode==="login"&&<input style={inp} type="password" placeholder="Password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}}/>}
        <button onClick={()=>{
          if(mode==="login"){
            if(email.toLowerCase()===ADMIN_USER.email&&password===ADMIN_USER.password){onAdminLogin();return;}
            const u=MOCK_USERS[email.toLowerCase()];
            if(!u||u.password!==password){setError("Invalid email or password.");return;}
            if(!u.approved){setError("Your account is pending approval.");return;}
            onLogin({...u,email});
          }else{
            if(!name||!email){setError("Please fill in all fields.");return;}
            fetch(`https://formspree.io/f/${FORMSPREE_ID}`,{
              method:"POST",
              headers:{"Content-Type":"application/json","Accept":"application/json"},
              body:JSON.stringify({
                name,email,
                _subject:`New student access request: ${name}`,
                message:`${name} (${email}) has requested access to the DM Pickleball student portal. Log in to approve or deny: https://dmpickleball.com`
              })
            }).catch(()=>{});
            setSignedUp(true);
          }
        }} style={{width:"100%",background:G,color:"white",border:"none",padding:14,borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:"1rem",marginBottom:16}}>
          {mode==="login"?"Log In →":"Request Access →"}
        </button>
        <div style={{textAlign:"center",fontSize:"0.85rem",color:"#6b7280"}}>
          {mode==="login"
            ?<>Don't have access? <span onClick={()=>{setMode("signup");setError("");}} style={{color:G,fontWeight:700,cursor:"pointer"}}>Request it here</span></>
            :<>Have an account? <span onClick={()=>{setMode("login");setError("");}} style={{color:G,fontWeight:700,cursor:"pointer"}}>Log in</span></>}
        </div>
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
            <span style={{background:"#e8f5ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.78rem",fontWeight:600,marginLeft:8}}>
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
  const[lessonType,setLessonType]=useState("private");
  const[duration,setDuration]=useState(60);
  const PRICES={
    private:{60:isMenlo?115:130, 90:isMenlo?172.50:195},
    semi:{60:isMenlo?60:70, 90:isMenlo?90:105},
    group:{60:isMenlo?40:null, 90:isMenlo?60:null},
  };
  const LESSONS=[
    {id:"private",icon:"🎯",label:"Private",desc:"1-on-1 personalized coaching"},
    {id:"semi",icon:"👥",label:"Semi-Private",desc:"Always 2 students"},
    {id:"group",icon:"🏆",label:"Group",desc:isMenlo?"3–6 students":"3–5 students"},
  ];
  const price=PRICES[lessonType][duration];
  const priceLabel=lessonType==="private"?`$${price}`
    :lessonType==="semi"?`$${price}/person · $${price*2} total`
    :isMenlo?`$${price}/person`:`$${140}/total · split equally`;
  const eventMap={
    private:{60:isMenlo?"mcc-private-lesson-60-min":"private-lesson-60-min", 90:isMenlo?"mcc-private-lesson-90-min":"private-lesson-90-min"},
    semi:{60:isMenlo?"mcc-semi-private-60-min":"semi-private-60-min", 90:isMenlo?"mcc-semi-private-90-min":"semi-private-90-min"},
    group:{60:isMenlo?"mcc-group-lesson-60-min":"group-lesson-60-min", 90:isMenlo?"mcc-group-lesson-90-min":"group-lesson-90-min"},
  };
  const eventSlug=eventMap[lessonType][duration];
  const calendlyUrl=`https://calendly.com/dmpickleball/${eventSlug}?hide_gdpr_banner=1&primary_color=006039`;
  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontWeight:900,color:G,fontSize:"1.6rem"}}>Book a Lesson</h2>
        <p style={{color:"#6b7280",marginTop:4,fontSize:"0.92rem"}}>
          Pick your lesson type and duration below, then choose a time.
          <span style={{background:"#e8f5ee",color:G,padding:"2px 10px",borderRadius:50,fontSize:"0.78rem",fontWeight:600,marginLeft:8}}>
            {isMenlo?"Menlo Circus Club":"General Student"}
          </span>
        </p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {LESSONS.map(l=>{
          const p=PRICES[l.id][duration];
          const pLabel=l.id==="private"?`$${p}`
            :l.id==="semi"?`$${p}/person`
            :isMenlo?`$${p}/person`:`$${140} total`;
          return(
            <div key={l.id} onClick={()=>setLessonType(l.id)}
              style={{background:lessonType===l.id?"#e8f5ee":"white",border:`2px solid ${lessonType===l.id?G:"#e5e7eb"}`,borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
              <div style={{fontSize:28,marginBottom:6}}>{l.icon}</div>
              <div style={{fontWeight:700,fontSize:"0.95rem",color:lessonType===l.id?G:"#1a1a1a"}}>{l.label}</div>
              <div style={{fontSize:"0.78rem",color:"#6b7280",marginTop:3}}>{l.desc}</div>
              <div style={{fontWeight:800,color:G,fontSize:"1rem",marginTop:8}}>{pLabel}</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        {[60,90].map(d=>(
          <div key={d} onClick={()=>setDuration(d)}
            style={{background:duration===d?"#e8f5ee":"white",border:`2px solid ${duration===d?G:"#e5e7eb"}`,borderRadius:12,padding:"14px 20px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
            <span style={{fontWeight:700,fontSize:"1rem",color:duration===d?G:"#1a1a1a"}}>{d} min</span>
          </div>
        ))}
      </div>
      <div style={{background:"#fffbea",border:"1.5px solid #f4c430",borderRadius:8,padding:"10px 16px",marginBottom:20,fontSize:"0.85rem",color:"#7a5800"}}>
        ⚠️ <strong>Cancellation Policy:</strong> Please cancel at least 24 hours before your lesson.
      </div>
      <div style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
        <iframe
          key={calendlyUrl}
          src={calendlyUrl}
          width="100%"
          height="750"
          frameBorder="0"
          title="Book a Lesson"
          style={{display:"block"}}
        />
      </div>
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
  const students=Object.keys(allLessons);
  const[sel,setSel]=useState(students[0]);
  const[editingId,setEditingId]=useState(null);
  const[editNotes,setEditNotes]=useState("");
  const[confirmCancel,setConfirmCancel]=useState(null);
  const[tab,setTab]=useState(pendingStudents.length>0?"pending":"students");
  const[earningsRange,setEarningsRange]=useState("month");
  const[showAddStudent,setShowAddStudent]=useState(false);
  const[showAddLesson,setShowAddLesson]=useState(false);
  const[newStudent,setNewStudent]=useState({name:"",email:"",memberType:"public"});
  const[newLesson,setNewLesson]=useState({date:"",time:"",type:"Private",duration:"60",focus:"",notes:"",status:"completed"});
  const earnings=getEarnings(allLessons,mockUsers,earningsRange);
  const lessons=allLessons[sel]||[];
  const history=lessons.filter(l=>isPast(l.date,l.time)||l.status==="completed");
  const upcoming=lessons.filter(l=>!isPast(l.date,l.time)&&l.status!=="cancelled");
  const selUser=mockUsers[sel]||{};
  const exportNial=()=>{
    const rows=getEarnings(allLessons,mockUsers,"week").rows.filter(r=>r.isMenlo);
    if(!rows.length){alert("No Menlo lessons this week.");return;}
    const lines=["Date,Student,Type,Duration,Gross,David 70%",...rows.map(r=>`${r.date},${r.name},${r.type},${r.duration},$${r.gross},$${r.net}`)];
    const blob=new Blob([lines.join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="menlo_weekly_summary.csv";a.click();
  };
  return(
    <div style={{maxWidth:960,margin:"0 auto",padding:"40px 24px"}}>
      <div style={{marginBottom:28,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Admin Panel</div>
          <h2 style={{fontWeight:900,fontSize:"1.6rem",color:G}}>David's Dashboard</h2>
        </div>
        <button onClick={()=>setShowNialExport(!showNialExport)} style={{background:"#1a1a1a",color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>⬇ Export Nial Report</button>
      </div>
      {showNialExport&&(
        <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:24}}>
          <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:4}}>Export Menlo Report for Nial</div>
          <div style={{fontSize:"0.83rem",color:"#6b7280",marginBottom:16}}>Select the date range to include. Report will show: Date, Member Name, Lesson Type, Duration.</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div>
              <div style={{...lbl,marginBottom:4}}>Start Date</div>
              <input type="date" value={nialStart} onChange={e=>setNialStart(e.target.value)} style={{...inp,marginBottom:0,width:"auto"}}/>
            </div>
            <div>
              <div style={{...lbl,marginBottom:4}}>End Date</div>
              <input type="date" value={nialEnd} onChange={e=>setNialEnd(e.target.value)} style={{...inp,marginBottom:0,width:"auto"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowNialExport(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
              <button onClick={exportNial} style={{background:G,color:"white",border:"none",padding:"9px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>⬇ Download CSV</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"none"}}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:32}}>
        <div style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
            {["week","month","year"].map(r=>(
              <span key={r} onClick={()=>setEarningsRange(r)} style={{marginRight:8,cursor:"pointer",color:earningsRange===r?G:"#9ca3af",fontWeight:earningsRange===r?800:500}}>{r.charAt(0).toUpperCase()+r.slice(1)}</span>
            ))}
          </div>
          <div style={{fontSize:"2rem",fontWeight:900,color:G}}>${earnings.total.toFixed(2)}</div>
          <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:4}}>Your earnings</div>
        </div>

        <div style={{background:"#e8f5ee",borderRadius:12,padding:"20px 24px",border:`1.5px solid ${G}`}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Menlo Net (70%)</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:G}}>${earnings.menloNet.toFixed(2)}</div>
          <div style={{fontSize:"0.8rem",color:"#4b5563",marginTop:4}}>Your 70% from MCC</div>
        </div>
        <div style={{background:"white",borderRadius:12,padding:"20px 24px",border:"1.5px solid #e5e7eb"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Lessons</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:"#1a1a1a"}}>{earnings.rows.length}</div>
          <div style={{fontSize:"0.8rem",color:"#6b7280",marginTop:4}}>Completed this {earningsRange}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:0,borderBottom:"2px solid #e5e7eb",marginBottom:28,flexWrap:"wrap"}}>
        {[["pending",`Pending (${pendingStudents.length})`],["students","Students & Lessons"],["earnings","Earnings Detail"]].map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t?G:"transparent"}`,marginBottom:-2,padding:"10px 20px",fontSize:"0.88rem",fontWeight:tab===t?700:500,color:tab===t?G:"#6b7280",cursor:"pointer"}}>
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
                  {["public","menlo"].map(type=>(
                    <button key={type} onClick={()=>onApprove(student,type)}
                      style={{background:type==="menlo"?G:"#1a1a1a",color:"white",border:"none",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>
                      ✓ {type==="menlo"?"Menlo Club":"General"}
                    </button>
                  ))}
                  <button onClick={()=>onDeny(student.id)}
                    style={{background:"white",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>
                    ✕ Deny
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}
      {tab==="earnings"&&(
        <div>
          <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>Earnings Detail — This {earningsRange.charAt(0).toUpperCase()+earningsRange.slice(1)}</div>
          {earnings.rows.length===0
            ?<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"32px",textAlign:"center",color:"#9ca3af"}}>No completed lessons this {earningsRange}.</div>
            :<div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
                <thead>
                  <tr style={{background:"#f9f9f6",borderBottom:"1.5px solid #e5e7eb"}}>
                    {["Date","Student","Type","Duration","Your Cut"].map(h=>(
                      <th key={h} style={{padding:"12px 16px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.78rem",textTransform:"uppercase"}}>{h}</th>
                    ))}
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
      {tab==="students"&&(
        <>
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <span style={lbl}>Students</span>
              <button onClick={()=>setShowAddStudent(!showAddStudent)} style={{background:G,color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>+ Add Student</button>
            </div>
            {showAddStudent&&(
              <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:16,border:"1.5px solid #e5e7eb"}}>
                <div style={{fontWeight:700,marginBottom:12,fontSize:"0.92rem"}}>Add Student Manually</div>
                <input placeholder="Full Name" value={newStudent.name} onChange={e=>setNewStudent({...newStudent,name:e.target.value})} style={inp}/>
                <input placeholder="Email Address" value={newStudent.email} onChange={e=>setNewStudent({...newStudent,email:e.target.value})} style={inp}/>
                <select value={newStudent.memberType} onChange={e=>setNewStudent({...newStudent,memberType:e.target.value})} style={{...inp,marginBottom:12}}>
                  <option value="public">General Student</option>
                  <option value="menlo">Menlo Circus Club</option>
                </select>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowAddStudent(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
                  <button onClick={()=>{if(!newStudent.name||!newStudent.email){alert("Name and email required.");return;}onAddStudent(newStudent);setNewStudent({name:"",email:"",memberType:"public"});setShowAddStudent(false);}} style={{background:G,color:"white",border:"none",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Add Student</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {students.map(email=>(
                <div key={email} onClick={()=>{setSel(email);setEditingId(null);setConfirmCancel(null);setShowAddLesson(false);}}
                  style={{background:sel===email?G:"white",color:sel===email?"white":"#374151",border:`1.5px solid ${sel===email?G:"#e5e7eb"}`,padding:"8px 18px",borderRadius:50,cursor:"pointer",fontSize:"0.88rem",fontWeight:600}}>
                  {mockUsers[email]?.name||email}
                  {mockUsers[email]?.memberType==="menlo"&&<span style={{background:sel===email?"rgba(255,255,255,0.3)":"#e8f5ee",color:sel===email?"white":G,fontSize:"0.65rem",fontWeight:700,padding:"1px 6px",borderRadius:50,marginLeft:6}}>MCC</span>}
                  {mockUsers[email]?.blocked&&<span style={{background:"#dc2626",color:"white",fontSize:"0.65rem",fontWeight:700,padding:"1px 6px",borderRadius:50,marginLeft:6}}>Blocked</span>}
                  <span style={{opacity:0.6,marginLeft:6,fontSize:"0.75rem"}}>({(allLessons[email]||[]).filter(l=>isPast(l.date,l.time)).length})</span>
                </div>
              ))}
            </div>
          </div>
          {sel&&(
            <div style={{background:"white",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"20px 24px",marginBottom:20}}>
              <div style={{fontWeight:700,fontSize:"0.97rem",marginBottom:4}}>{selUser.name||sel}</div>
              <div style={{fontSize:"0.83rem",color:"#6b7280",marginBottom:14}}>{sel}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>onToggleMenlo(sel)} style={{background:selUser.memberType==="menlo"?G:"white",color:selUser.memberType==="menlo"?"white":G,border:`1.5px solid ${G}`,padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>
                  {selUser.memberType==="menlo"?"✓ Menlo Club":"Set as Menlo Club"}
                </button>
                <button onClick={()=>onToggleSaturday(sel)} style={{background:selUser.saturdayEnabled?"#1a1a1a":"white",color:selUser.saturdayEnabled?"white":"#1a1a1a",border:"1.5px solid #1a1a1a",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>
                  {selUser.saturdayEnabled?"✓ Saturday On":"Enable Saturday"}
                </button>
                <button onClick={()=>onBlockStudent(sel)} style={{background:selUser.blocked?"#dc2626":"white",color:selUser.blocked?"white":"#dc2626",border:"1.5px solid #dc2626",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>
                  {selUser.blocked?"Unblock Student":"Block Student"}
                </button>
              </div>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2}}>Lessons</div>
            <button onClick={()=>setShowAddLesson(!showAddLesson)} style={{background:"#1a1a1a",color:"white",border:"none",padding:"7px 18px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>+ Log Lesson</button>
          </div>
          {showAddLesson&&(
            <div style={{background:"#f9f9f6",borderRadius:12,padding:"20px",marginBottom:16,border:"1.5px solid #e5e7eb"}}>
              <div style={{fontWeight:700,marginBottom:12,fontSize:"0.92rem"}}>Log Lesson for {selUser.name||sel}</div>
              <input type="date" value={newLesson.date} onChange={e=>setNewLesson({...newLesson,date:e.target.value})} style={inp}/>
              <input placeholder="Time (e.g. 10:00 AM – 11:00 AM)" value={newLesson.time} onChange={e=>setNewLesson({...newLesson,time:e.target.value})} style={inp}/>
              <select value={newLesson.type} onChange={e=>setNewLesson({...newLesson,type:e.target.value})} style={{...inp,marginBottom:12}}>
                {["Private","Semi-Private","Group"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select value={newLesson.duration} onChange={e=>setNewLesson({...newLesson,duration:e.target.value})} style={{...inp,marginBottom:12}}>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
              <input placeholder="Focus area (optional)" value={newLesson.focus} onChange={e=>setNewLesson({...newLesson,focus:e.target.value})} style={inp}/>
              <textarea placeholder="Coaching notes (optional)" value={newLesson.notes} onChange={e=>setNewLesson({...newLesson,notes:e.target.value})} style={{...inp,height:80,resize:"vertical",fontFamily:"inherit"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setShowAddLesson(false)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.85rem"}}>Cancel</button>
                <button onClick={()=>{if(!newLesson.date||!newLesson.time){alert("Date and time required.");return;}onAddLesson(sel,{id:Date.now(),date:newLesson.date,time:newLesson.time,type:newLesson.type,duration:`${newLesson.duration} min`,status:"completed",focus:newLesson.focus,notes:newLesson.notes,photos:[],videos:[]});setNewLesson({date:"",time:"",type:"Private",duration:"60",focus:"",notes:"",status:"completed"});setShowAddLesson(false);}} style={{background:G,color:"white",border:"none",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>Save Lesson</button>
              </div>
            </div>
          )}
          {upcoming.length>0&&(
            <div style={{marginBottom:28}}>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Upcoming ({upcoming.length})</div>
              {upcoming.map(l=>(
                <div key={l.id} style={{background:"white",borderRadius:10,border:`1.5px solid ${confirmCancel===l.id?"#fca5a5":"#e5e7eb"}`,marginBottom:8,overflow:"hidden"}}>
                  {confirmCancel===l.id&&(
                    <div style={{background:"#fef2f2",borderBottom:"1px solid #fca5a5",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                      <span style={{fontWeight:700,color:"#991b1b",fontSize:"0.88rem"}}>Cancel this lesson for {mockUsers[sel]?.name}?</span>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setConfirmCancel(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Keep it</button>
                        <button onClick={()=>{onCancelLesson(sel,l.id);setConfirmCancel(null);}} style={{background:"#dc2626",color:"white",border:"none",padding:"6px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700}}>Yes, Cancel</button>
                      </div>
                    </div>
                  )}
                  <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontWeight:700}}>{fmtDateShort(l.date)} · {l.time}</div>
                      <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>{l.type} · {l.duration}{l.focus?` · 🎯 ${l.focus}`:""}</div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{background:l.status==="confirmed"?"#e8f5ee":"#fffbea",color:l.status==="confirmed"?G:"#92400e",padding:"3px 12px",borderRadius:50,fontSize:"0.78rem",fontWeight:700}}>
                        {l.status==="confirmed"?"✓ Confirmed":"⏳ Pending"}
                      </span>
                      <button onClick={()=>setConfirmCancel(confirmCancel===l.id?null:l.id)}
                        style={{background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fca5a5",padding:"5px 14px",borderRadius:50,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{fontSize:"0.8rem",fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Lesson History — Add Notes</div>
            {history.length===0&&<div style={{color:"#9ca3af",fontSize:"0.9rem"}}>No past lessons yet.</div>}
            {history.map(l=>(
              <div key={l.id} style={{background:"white",borderRadius:12,border:`1.5px solid ${editingId===l.id?G:"#e5e7eb"}`,marginBottom:12,overflow:"hidden"}}>
                <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.97rem"}}>{fmtDate(l.date)}</div>
                    <div style={{fontSize:"0.85rem",color:"#6b7280",marginTop:2}}>⏱ {l.time} · {l.type} · {l.duration}</div>
                    {l.focus&&<div style={{fontSize:"0.8rem",color:G,marginTop:3,fontWeight:600}}>🎯 {l.focus}</div>}
                    {l.notes&&editingId!==l.id&&<div style={{background:"#f9f9f6",borderRadius:8,padding:"10px 14px",marginTop:10,fontSize:"0.88rem",color:"#374151",lineHeight:1.7,maxWidth:460}}>{l.notes}</div>}
                    {!l.notes&&editingId!==l.id&&<div style={{fontSize:"0.82rem",color:"#9ca3af",marginTop:6,fontStyle:"italic"}}>No notes yet</div>}
                  </div>
                  <button onClick={()=>editingId===l.id?setEditingId(null):(setEditingId(l.id),setEditNotes(l.notes||""))}
                    style={{background:editingId===l.id?"#f3f4f6":G,color:editingId===l.id?"#374151":"white",border:"none",padding:"7px 16px",borderRadius:50,cursor:"pointer",fontSize:"0.82rem",fontWeight:700,whiteSpace:"nowrap"}}>
                    {editingId===l.id?"Cancel":"✏️ Edit Notes"}
                  </button>
                </div>
                {editingId===l.id&&(
                  <div style={{borderTop:"1px solid #e5e7eb",padding:"16px 20px",background:"#f9f9f6"}}>
                    <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} placeholder="Add coaching notes..."
                      style={{...inp,height:100,resize:"vertical",fontFamily:"inherit",background:"white"}}/>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setEditingId(null)} style={{background:"white",border:"1.5px solid #e5e7eb",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.88rem"}}>Cancel</button>
                      <button onClick={()=>{onUpdateLesson(sel,editingId,{notes:editNotes});setEditingId(null);}} style={{background:G,color:"white",border:"none",padding:"8px 20px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>Save Notes ✓</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const[page,setPage]=useState("home");
  const[user,setUser]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[allLessons,setAllLessons]=useState(INIT_LESSONS);
  const[pendingStudents,setPendingStudents]=useState(INIT_PENDING);
  const[mockUsersState,setMockUsersState]=useState(MOCK_USERS);
  const userLessons=user?allLessons[user.email]||[]:[];
  const cancelLesson=id=>setAllLessons(prev=>({...prev,[user.email]:prev[user.email].map(l=>l.id===id?{...l,status:"cancelled"}:l)}));
  const adminCancel=(email,id)=>setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,status:"cancelled"}:l)}));
  const addLesson=lesson=>setAllLessons(prev=>({...prev,[user.email]:[...(prev[user.email]||[]),lesson]}));
  const updateLesson=(email,id,updates)=>setAllLessons(prev=>({...prev,[email]:prev[email].map(l=>l.id===id?{...l,...updates}:l)}));
  const approveStudent=(student,memberType)=>{setAllLessons(prev=>({...prev,[student.email]:[]}));setMockUsersState(prev=>({...prev,[student.email]:{name:student.name,memberType,approved:true,password:""}}));setPendingStudents(prev=>prev.filter(s=>s.id!==student.id));};
  const denyStudent=id=>setPendingStudents(prev=>prev.filter(s=>s.id!==id));
  const addStudent=({name,email,memberType})=>{setMockUsersState(prev=>({...prev,[email]:{name,memberType,approved:true,password:""}}));setAllLessons(prev=>({...prev,[email]:[]}));};
  const adminAddLesson=(email,lesson)=>setAllLessons(prev=>({...prev,[email]:[...(prev[email]||[]),lesson]}));
  const toggleMenlo=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],memberType:prev[email]?.memberType==="menlo"?"public":"menlo"}}));
  const toggleSaturday=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],saturdayEnabled:!prev[email]?.saturdayEnabled}}));
  const blockStudent=email=>setMockUsersState(prev=>({...prev,[email]:{...prev[email],blocked:!prev[email]?.blocked}}));
  const logout=()=>{setUser(null);setIsAdmin(false);setPage("home");};
  if(isAdmin)return(
    <div style={{fontFamily:"Segoe UI,sans-serif",background:"#f4f9f6",minHeight:"100vh"}}>
      <nav style={{background:G,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{color:Y,fontWeight:900,fontSize:"1.3rem"}}>DM <span style={{color:"white"}}>Pickleball</span> <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.6)",fontWeight:400}}>· Admin</span></div>
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
      {page==="home"&&<Homepage setPage={setPage}/>}
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
