import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import ColorPicker from '../components/ColorPicker.jsx';

function TagField({ label, placeholder, values, onChange }) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const val = draft.trim();
    if (val && !values.includes(val)) onChange([...values, val]);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div className="tag-field">
      <label>{label}</label>
      <input
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
      />
      {values.length > 0 && (
        <div className="tag-list">
          {values.map((v, i) => (
            <span className="tag-chip" key={`${v}-${i}`}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [garments, setGarments] = useState([{ name: '', colors: [] }]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const updateGarment = (i, patch) => {
    setGarments((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  };

  const addGarment = () => setGarments((prev) => [...prev, { name: '', colors: [] }]);
  const removeGarment = (i) => setGarments((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!image) return setError('Sube una foto del outfit');
    const cleaned = garments.filter((g) => g.name.trim() && g.colors.length > 0);
    if (cleaned.length === 0) return setError('Agrega al menos una prenda con nombre y colores');

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('garments', JSON.stringify(cleaned));
      formData.append('stores', JSON.stringify(stores));
      await api.createPost(formData);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="upload-wrap">
      <form className="card upload-card" onSubmit={onSubmit}>
        <h1>Subir outfit</h1>
        {error && <p className="form-error">{error}</p>}

        <label className="image-picker">
          {preview ? <img src={preview} alt="Vista previa" /> : <span>Elegir foto del outfit</span>}
          <input type="file" accept="image/*" onChange={onImage} hidden />
        </label>

        {garments.map((g, i) => (
          <div className="garment-editor" key={i}>
            <div className="garment-editor-head">
              <input
                placeholder='Prenda, ej. "Playera de algodón cuello redondo"'
                value={g.name}
                onChange={(e) => updateGarment(i, { name: e.target.value })}
              />
              {garments.length > 1 && (
                <button type="button" className="link-btn danger" onClick={() => removeGarment(i)}>
                  Quitar
                </button>
              )}
            </div>
            <label className="color-picker-label">Colores</label>
            <ColorPicker colors={g.colors} onChange={(colors) => updateGarment(i, { colors })} />
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={addGarment}>
          + Agregar otra prenda
        </button>

        <TagField label="Tiendas favoritas" placeholder="ej. Zara" values={stores} onChange={setStores} />

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Publicando…' : 'Publicar outfit'}
        </button>
      </form>
    </div>
  );
}
