import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'justo ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .notifications()
      .then((data) => setNotifications(data.notifications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    api.markNotificationsRead().catch(() => {});
  }, []);

  return (
    <div className="feed-wrap">
      <h1 className="feed-title">Notificaciones</h1>
      {error && <p className="form-error">{error}</p>}
      {!loading && notifications.length === 0 && <p className="empty-state">No tienes notificaciones todavía.</p>}

      <ul className="notification-list">
        {notifications.map((n) => (
          <li key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
            <Link to={`/u/${n.actor.username}`}>
              <img className="post-author-avatar" src={n.actor.avatarUrl || '/default-avatar.svg'} alt="" />
            </Link>
            <div className="notification-text">
              <span>
                <Link to={`/u/${n.actor.username}`}>
                  <strong>@{n.actor.username}</strong>
                </Link>{' '}
                {n.type === 'follow' ? 'empezó a seguirte' : 'le dio like a tu outfit'}
              </span>
              <span className="notification-time">{timeAgo(n.createdAt)}</span>
            </div>
            {n.post && <img className="notification-thumb" src={n.post.imageUrl} alt="" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
