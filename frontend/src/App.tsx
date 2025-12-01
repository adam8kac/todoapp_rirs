import { Outlet, Link, useNavigate } from "react-router-dom";
import { isAuthed, logout } from "./auth";
import { useEffect, useState } from "react";

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function App() {
  const nav = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme());

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-badge">✓</div>
          <div>RIRS Todo App</div>
        </div>

        <nav className="nav">
          {/* THEME TOGGLE */}
          <label className="switch" title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              aria-label="Toggle theme"
            />
            <span className="slider"></span>
            <span className="thumb"></span>
          </label>

          {isAuthed() ? (
            <>
              <Link to="/">Tasks</Link>
              <button className="btn" onClick={() => { logout(); nav("/login"); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
