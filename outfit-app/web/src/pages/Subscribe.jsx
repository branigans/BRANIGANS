import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Subscribe() {
  const { user, isSubscribed, refresh } = useAuth();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.get('estado') === 'exito') {
      // Stripe procesa el webhook de forma asíncrona; reintenta unos segundos por si aún no llega.
      const t = setTimeout(refresh, 2500);
      return () => clearTimeout(t);
    }
  }, [params, refresh]);

  const onSubscribe = async () => {
    setError('');
    setBusy(true);
    try {
      const { url } = await api.createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="auth-wrap">
        <div className="card">
          <h1>Ya tienes acceso Premium</h1>
          <p>Tu suscripción está activa. Disfruta el feed de outfits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="card subscribe-card">
        <h1>Desbloquea MYFEE</h1>
        <p className="subscribe-lead">
          Hola{user ? `, ${user.displayName}` : ''}. Suscríbete para ver el feed de outfits, subir los tuyos y
          seguir a otras personas con buen gusto.
        </p>
        <ul className="subscribe-list">
          <li>Explora combinaciones reales de otros usuarios</li>
          <li>Sube tus outfits con su paleta de colores exacta</li>
          <li>Sigue a quien te inspire — sin likes, sin ruido</li>
        </ul>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary" onClick={onSubscribe} disabled={busy}>
          {busy ? 'Redirigiendo a pago…' : 'Suscribirme'}
        </button>
        {params.get('estado') === 'cancelado' && <p className="form-hint">Pago cancelado. Puedes intentarlo de nuevo.</p>}
      </div>
    </div>
  );
}
