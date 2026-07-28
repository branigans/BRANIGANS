import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/suscripcion');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={onSubmit}>
        <h1>Crear cuenta</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          Nombre para mostrar
          <input required value={form.displayName} onChange={update('displayName')} />
        </label>
        <label>
          Usuario
          <input required placeholder="sin espacios, ej. juanp" value={form.username} onChange={update('username')} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={update('email')} />
        </label>
        <label>
          Contraseña
          <input type="password" required minLength={8} value={form.password} onChange={update('password')} />
        </label>
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="form-hint">
          ¿Ya tienes cuenta? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
