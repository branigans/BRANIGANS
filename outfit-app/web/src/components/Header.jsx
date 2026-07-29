import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function Header() {
  const { user, isSubscribed, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  useEffect(() => {
    if (!user || !isSubscribed) return;
    api
      .notifications()
      .then((data) => setUnreadCount(data.unreadCount))
      .catch(() => {});
  }, [user, isSubscribed, location.pathname]);

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-name">MYFEE</span>
        <span className="brand-tagline">combina tu outfit</span>
      </div>
      {user && isSubscribed && (
        <form className="search-form" onSubmit={onSearch}>
          <input
            type="search"
            placeholder="Buscar usuarios…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      )}
      {user && (
        <nav className="nav">
          {isSubscribed && (
            <>
              <NavLink to="/" end className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                Feed
              </NavLink>
              <NavLink to="/subir" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                Subir outfit
              </NavLink>
              <NavLink to="/perfil" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                Mi perfil
              </NavLink>
              <NavLink to="/guardados" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                Guardados
              </NavLink>
              <NavLink to="/notificaciones" className={({ isActive }) => `nav-btn nav-btn-bell ${isActive ? 'active' : ''}`}>
                🔔{unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </NavLink>
              {user.isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                  Panel
                </NavLink>
              )}
            </>
          )}
          {!isSubscribed && (
            <NavLink to="/suscripcion" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              Suscripción
            </NavLink>
          )}
          <button className="nav-btn" onClick={logout}>
            Salir
          </button>
        </nav>
      )}
    </header>
  );
}
