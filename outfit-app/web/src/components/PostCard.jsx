import { Link } from 'react-router-dom';
import ColorTags from './ColorTags.jsx';

export default function PostCard({ post, onDelete, canDelete }) {
  return (
    <article className="post-card">
      <img className="post-image" src={post.imageUrl} alt="Outfit" loading="lazy" />
      <div className="post-body">
        <Link to={`/u/${post.author.username}`} className="post-author">
          {post.author.avatarUrl && <img className="post-author-avatar" src={post.author.avatarUrl} alt="" />}
          <span>@{post.author.username}</span>
        </Link>

        <ul className="garment-list">
          {post.garments.map((g) => (
            <li key={g.id}>
              <span className="garment-name">{g.name}</span>
              <ColorTags colors={g.colors} />
            </li>
          ))}
        </ul>

        {post.stores.length > 0 && (
          <div className="post-stores">
            Tiendas: <strong>{post.stores.join(', ')}</strong>
          </div>
        )}

        {canDelete && (
          <button className="link-btn danger" onClick={() => onDelete(post.id)}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}
