import { useEffect, useState } from 'react';
import { api } from '../api.js';
import PostCard from '../components/PostCard.jsx';

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .savedPosts()
      .then((data) => setPosts(data.posts))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const onToggleLike = async (id, currentlyLiked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likedByMe: !currentlyLiked, likesCount: p.likesCount + (currentlyLiked ? -1 : 1) } : p
      )
    );
    currentlyLiked ? await api.unlikePost(id) : await api.likePost(id);
  };

  const onToggleSave = async (id) => {
    await api.unsavePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="feed-wrap">
      <h1 className="feed-title">Outfits guardados</h1>
      {error && <p className="form-error">{error}</p>}
      {!loading && posts.length === 0 && <p className="empty-state">Todavía no has guardado ningún outfit.</p>}
      <div className="post-grid">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            canDelete={false}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>
    </div>
  );
}
