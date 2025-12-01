import { useEffect, useMemo, useState } from "react";
import api from "../api";

type Task = {
  id: string;                 // Cockroach bigints -> string
  title: string;
  description?: string;
  done: boolean;
  due_date: string | null;    // "YYYY-MM-DD" ali null
  created_by_username?: string;
  assigned_to_id?: number | null;
  assigned_to_username?: string | null;
};

type User = { id: number; username: string };

export default function Tasks() {
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string>("");               // "" ali "YYYY-MM-DD"
  const [assignee, setAssignee] = useState<number | "">(""); // "" ali user.id
  const [users, setUsers] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get("/api/tasks/");
    setItems(data);
  }
  async function loadUsers() {
    const { data } = await api.get("/api/users/");
    setUsers(data);
  }
  useEffect(() => { load(); loadUsers(); }, []);

  const userMap = useMemo(() => {
    const m = new Map<number, string>();
    users.forEach(u => m.set(u.id, u.username));
    return m;
  }, [users]);

  async function add() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await api.post("/api/tasks/", {
        title,
        due_date: due || null,
        assigned_to_id: assignee === "" ? null : Number(assignee),
        done: false,
      });
      setTitle("");
      setDue("");
      setAssignee("");
      await load();
    } finally { setBusy(false); }
  }

  async function toggle(id: string) {
    setItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    try { await api.post(`/api/tasks/${id}/toggle/`); }
    catch { setItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  }

  async function remove(id: string) {
    const prev = items;
    setItems(prev => prev.filter(t => t.id !== id));
    try { await api.delete(`/api/tasks/${id}/`); }
    catch { setItems(prev); }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0 }}>Moja opravila</h3>

      {/* vnosni trak */}
      <div className="input-row" style={{ flexWrap: "wrap" }}>
        <input
          className="input"
          placeholder="Dodaj novo opravilo…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
        />
        <input
          className="input"
          type="date"
          value={due}
          onChange={e => setDue(e.target.value)}
          title="Rok (due date)"
          style={{ maxWidth: 180 }}
        />
        <select
          className="input"
          value={assignee}
          onChange={e => setAssignee(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ maxWidth: 220 }}
          title="Dodeli uporabniku"
        >
          <option value="">(brez dodelitve)</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>

        <button className="btn brand" onClick={add} disabled={busy}>Dodaj</button>
      </div>

      <ul className="task-list">
        {items.map(t => (
          <li key={t.id} className="task-item">
            <button
              className={`checkbox ${t.done ? "checked" : ""}`}
              onClick={() => toggle(t.id)}
              aria-label={t.done ? "Odznači" : "Označi kot dokončano"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            <div className={`task-title ${t.done ? "done" : ""}`}>{t.title}</div>

            <div className="kv">
              {t.due_date && <span className="pill">📅 {t.due_date}</span>}
              {t.created_by_username && <span className="pill">ustvaril: {t.created_by_username}</span>}
              {(t.assigned_to_username || (t.assigned_to_id && userMap.get(t.assigned_to_id))) && (
                <span className="pill">dodeljen: {t.assigned_to_username || userMap.get(t.assigned_to_id!)}
                </span>
              )}
            </div>

            <button className="btn icon ghost" title="Izbriši" onClick={() => remove(t.id)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p style={{ color: "var(--muted)", marginTop: 12 }}>Ni opravil. Dodaj prvega! ✨</p>
      )}
    </div>
  );
}
