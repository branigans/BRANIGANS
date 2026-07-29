import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, isSubscribed, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-name">BRANIGANS STYLE</span>
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
