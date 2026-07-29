import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError('');
    api
      .searchUsers(q)
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="feed-wrap">
      <h1 className="feed-title">Buscar usuarios{q ? `: "${q}"` : ''}</h1>
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="empty-state">Buscando…</p>}
      {!loading && q && users.length === 0 && <p className="empty-state">No encontramos a nadie con ese nombre.</p>}

      <ul className="search-results">
        {users.map((u) => (
          <li key={u.id}>
            <Link to={`/u/${u.username}`} className="search-result">
              <img className="post-author-avatar" src={u.avatarUrl || '/default-avatar.svg'} alt="" />
              <div>
                <strong>{u.displayName}</strong>
                <span>@{u.username}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
