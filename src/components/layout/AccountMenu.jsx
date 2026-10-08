import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity, Brain, CalendarCheck2, ClipboardList, Gauge, LogOut,
  Menu, Settings2, Sparkles, UserRound, X,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import "./AccountMenu.css";

const links = [
  { to: "/dashboard", label: "Detailed dashboard", icon: Gauge },
  { to: "/plan", label: "Training plan", icon: CalendarCheck2 },
  { to: "/checkin", label: "Daily check-in", icon: ClipboardList },
  { to: "/logs", label: "Daily logs", icon: Activity },
  { to: "/coach/intelligence", label: "Coaching insights", icon: Brain },
  { to: "/ai", label: "AI tools", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("TrackFit member");
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!active || !user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      if (active && profile?.display_name) setName(profile.display_name);
    }
    void loadAccount();
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleLogout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (!error) setOpen(false);
  }

  return (
    <>
      <button className="account-menu-button" onClick={() => setOpen(true)} type="button" aria-label="Open all pages and account menu" aria-expanded={open} aria-controls="trackfit-menu">
        <Menu size={22} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button className="account-menu-backdrop" onClick={() => setOpen(false)} type="button" aria-label="Close menu" />
          <aside id="trackfit-menu" className="account-drawer account-drawer--open" role="dialog" aria-modal="true" aria-label="All pages and account">
            <div className="account-drawer__header">
              <div>
                <span className="tf-menu-eyebrow">TRACKFIT / YOUR SPACE</span>
                <strong>{name}</strong>
                <span>{email}</span>
              </div>
              <button onClick={() => setOpen(false)} type="button" aria-label="Close menu"><X size={22} /></button>
            </div>
            <div className="tf-menu-label"><Settings2 size={15} /> All pages</div>
            <nav aria-label="More TrackFit pages">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={location.pathname === to ? "tf-menu-current" : undefined} onClick={() => setOpen(false)}>
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <button className="account-drawer__logout" onClick={handleLogout} type="button">
              <LogOut size={19} aria-hidden="true" /><span>Log out</span>
            </button>
          </aside>
        </>
      )}
    </>
  );
}
