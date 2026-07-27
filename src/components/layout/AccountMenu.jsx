import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, LogOut, Menu, UserRound, X } from "lucide-react";
import { supabase } from "../../services/supabase";
import "./AccountMenu.css";

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("TrackFit member");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!active || !user) return;

      setEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (active && profile?.display_name) setName(profile.display_name);
    }

    void loadAccount();
    return () => {
      active = false;
    };
  }, [open]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpen(false);
  }

  return (
    <>
      <button className="account-menu-button" onClick={() => setOpen(true)} type="button" aria-label="Open account menu">
        <Menu size={23} />
      </button>

      {open && <button className="account-menu-backdrop" onClick={() => setOpen(false)} type="button" aria-label="Close account menu" />}

      <aside className={open ? "account-drawer account-drawer--open" : "account-drawer"} aria-hidden={!open}>
        <div className="account-drawer__header">
          <div>
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          <button onClick={() => setOpen(false)} type="button" aria-label="Close menu"><X size={22} /></button>
        </div>

        <nav>
          <Link to="/logs" onClick={() => setOpen(false)}>
            <ClipboardList size={20} />
            <span>Daily logs</span>
          </Link>
          <Link to="/profile" onClick={() => setOpen(false)}>
            <UserRound size={20} />
            <span>Profile setup</span>
          </Link>
        </nav>

        <button className="account-drawer__logout" onClick={handleLogout} type="button">
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </aside>
    </>
  );
}
