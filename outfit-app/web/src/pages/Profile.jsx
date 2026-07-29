import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Profile({ own = false }) {
  const { username } = useParams();
  const { user: me, setUser, refresh } = useAuth();
  const targetUsername = own ? me?.username : username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [followBusy, setFollowBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [portalBusy, setPortalBusy] = useState(false);

  const load = async () => {
    if (!targetUsername) return;
    try {
      const data = await api.profile(targetUsername);
      setProfile(data.user);
      setPosts(data.posts);
      setBio(data.user.bio || '');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUsername]);

  const toggleFollow = async () => {
    setFollowBusy(true);
    try {
      if (profile.isFollowedByMe) {
        await api.unfollow(profile.username);
      } else {
        await api.follow(profile.username);
      }
      await load();
    } finally {
      setFollowBusy(false);
    }
  };

  const saveBio = async () => {
    const data = await api.updateMe({ bio });
    setUser(data.user);
    setEditing(false);
    load();
  };

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const data = await api.uploadAvatar(formData);
    setUser(data.user);
    load();
  };

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

  const openBillingPortal = async () => {
    setPortalBusy(true);
    try {
      const { url } = await api.billingPortal();
      window.location.href = url;
    } finally {
      setPortalBusy(false);
    }
  };

  if (error) return <p className="form-error">{error}</p>;
  if (!profile) return <div className="page-loading">Cargando…</div>;

  const isOwn = me && profile.id === me.id;

  return (
    <div className="profile-wrap">
      <div className="profile-header">
        <div className="profile-avatar-block">
          <img className="profile-avatar" src={profile.avatarUrl || '/default-avatar.svg'} alt="" />
          {isOwn && (
            <label className="link-btn">
              Cambiar foto
              <input type="file" accept="image/*" hidden onChange={onAvatar} />
            </label>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile.displayName}</h1>
          <p className="profile-username">@{profile.username}</p>

          {editing ? (
            <div className="bio-editor">
              <textarea value={bio} maxLength={280} onChange={(e) => setBio(e.target.value)} />
              <button className="btn-secondary" onClick={saveBio}>
                Guardar
              </button>
            </div>
          ) : (
            <p className="profile-bio">{profile.bio || (isOwn ? 'Agrega una bio' : '')}</p>
          )}

          {isOwn && !editing && (
            <button className="link-btn" onClick={() => setEditing(true)}>
              Editar bio
            </button>
          )}

          {profile.favoriteStores.length > 0 && (
            <p className="profile-stores">Tiendas favoritas: {profile.favoriteStores.join(', ')}</p>
          )}

          <div className="profile-stats">
            <span>
              <strong>{profile.posts}</strong> outfits
            </span>
            <span>
              <strong>{profile.followers}</strong> seguidores
            </span>
            <span>
              <strong>{profile.following}</strong> siguiendo
            </span>
          </div>

          {!isOwn && (
            <button className="btn-primary" onClick={toggleFollow} disabled={followBusy}>
              {profile.isFollowedByMe ? 'Dejar de seguir' : 'Seguir'}
            </button>
          )}

          {isOwn && (
            <button className="btn-secondary" onClick={openBillingPortal} disabled={portalBusy}>
              {portalBusy ? 'Abriendo…' : 'Gestionar suscripción'}
            </button>
          )}
        </div>
      </div>

      <div className="post-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} canDelete={isOwn} onDelete={onDelete} onToggleLike={onToggleLike} />
        ))}
      </div>
      {posts.length === 0 && <p className="empty-state">Aún no hay outfits publicados.</p>}
    </div>
  );
}
