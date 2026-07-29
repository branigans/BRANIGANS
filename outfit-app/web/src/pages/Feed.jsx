import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (nextCursor) => {
    setLoading(true);
    try {
      const data = await api.feed(nextCursor);
      setPosts((prev) => (nextCursor ? [...prev, ...data.posts] : data.posts));
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(null);
  }, []);

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    await api.deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const onToggleLike = async (id, currentlyLiked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likedByMe: !currentlyLiked, likesCount: p.likesCount + (currentlyLiked ? -1 : 1) } : p
      )
    );
    try {
      currentlyLiked ? await api.unlikePost(id) : await api.likePost(id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, likedByMe: currentlyLiked, likesCount: p.likesCount + (currentlyLiked ? 1 : -1) } : p
        )
      );
    }
  };

  return (
    <div className="feed-wrap">
      <h1 className="feed-title">Outfits recientes</h1>
      {error && <p className="form-error">{error}</p>}
      {posts.length === 0 && !loading && <p className="empty-state">Todavía no hay outfits publicados. ¡Sé el primero!</p>}
      <div className="post-grid">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            canDelete={user && p.author.id === user.id}
            onDelete={onDelete}
            onToggleLike={onToggleLike}
          />
        ))}
      </div>
      {cursor && (
        <button className="btn-secondary" onClick={() => load(cursor)} disabled={loading}>
          {loading ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
