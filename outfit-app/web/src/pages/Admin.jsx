import { useEffect, useState } from 'react';

import { api } from '../api.js';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .adminStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!stats) return <div className="page-loading">Cargando…</div>;

  return (
    <div className="feed-wrap">
      <h1 className="feed-title">Panel</h1>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalUsers}</span>
          <span className="admin-stat-label">Usuarios registrados</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.activeSubscriptions}</span>
          <span className="admin-stat-label">Suscripciones activas</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalPosts}</span>
          <span className="admin-stat-label">Outfits publicados</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalLikes}</span>
          <span className="admin-stat-label">Likes totales</span>
        </div>
      </div>

      <h2 className="admin-subtitle">Outfits más gustados</h2>
      {stats.topPosts.length === 0 && <p className="empty-state">Todavía no hay likes.</p>}
      <ul className="admin-top-list">
        {stats.topPosts.map((p) => (
          <li key={p.id}>
            <img src={p.imageUrl} alt="" />
            <div>
              <strong>@{p.author.username}</strong>
              <span>{p.likesCount} likes</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
