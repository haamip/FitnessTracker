import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckInRepository } from "../../services/repositories/trackfitDataLayer";
import { getOperationalDate, SHIFT_MODE_EVENT } from "../../services/shift/shiftModeService";

const keyFor = (user, day) => `trackfit:checkin-reminder:${user}:${day}`;
const FOUR_HOURS = 4 * 60 * 60 * 1000;

export default function DailyCheckInGate({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function evaluate() {
      const user = CheckInRepository.getActiveUser();
      const day = getOperationalDate();
      if (!user || location.pathname === "/checkin" || location.pathname.startsWith("/settings/")) {
        setOpen(false); return;
      }
      const done = CheckInRepository.getAll().some(row => row.date === day);
      const deferredUntil = Number(localStorage.getItem(keyFor(user, day)) || 0);
      setOpen(!done && Date.now() >= deferredUntil);
    }
    evaluate();
    window.addEventListener(SHIFT_MODE_EVENT, evaluate);
    window.addEventListener("focus", evaluate);
    return () => {
      window.removeEventListener(SHIFT_MODE_EVENT, evaluate);
      window.removeEventListener("focus", evaluate);
    };
  }, [location.pathname]);
  function later() {
    const user = CheckInRepository.getActiveUser();
    if (user) localStorage.setItem(keyFor(user, getOperationalDate()), String(Date.now() + FOUR_HOURS));
    setOpen(false);
  }
  return <>
    {children}
    {open && <div role="presentation" style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.72)",display:"grid",placeItems:"center",padding:20}}>
      <section role="dialog" aria-modal="true" aria-labelledby="daily-checkin-reminder-title" style={{background:"#19221c",color:"#fff",border:"1px solid #6c876d",borderRadius:20,padding:24,maxWidth:420,width:"100%",boxShadow:"0 12px 50px #0009"}}>
        <h2 id="daily-checkin-reminder-title">How are you feeling today?</h2>
        <p>Take a minute to check in. Your coach uses your logged recovery and training to make better suggestions.</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:20}}>
          <Link to="/checkin" onClick={()=>setOpen(false)} style={{background:"#d3ff67",color:"#182015",borderRadius:12,padding:"12px 16px",fontWeight:800}}>Start check-in</Link>
          <button type="button" onClick={later} style={{background:"transparent",color:"#fff",border:"1px solid #b4bdb4",borderRadius:12,padding:"12px 16px"}}>Remind me later</button>
        </div>
      </section>
    </div>}
  </>;
}
