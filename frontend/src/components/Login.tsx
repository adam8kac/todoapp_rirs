import { useState } from "react";
import { login } from "../auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  return (
    <div className="centered card form">
      <h3>Prijava</h3>
      {err && <p className="error">{err}</p>}
      <div className="row">
        <input className="input" placeholder="Uporabniško ime" value={username} onChange={e => setU(e.target.value)} />
        <input className="input" placeholder="Geslo" type="password" value={password} onChange={e => setP(e.target.value)} />
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button className="btn brand" onClick={async () => {
          try { await login(username, password); nav("/"); }
          catch (e:any) { setErr(e?.response?.data?.detail || "Login failed"); }
        }}>Prijava</button>
        <span className="hint">Še nimaš računa? <Link to="/register">Registracija</Link></span>
      </div>
    </div>
  );
}
