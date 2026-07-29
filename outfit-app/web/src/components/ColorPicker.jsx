import { useState } from 'react';
import { COLOR_MAP, colorHex } from '../lib/colors.js';

const PALETTE = Object.entries(COLOR_MAP);

export default function ColorPicker({ colors, onChange }) {
  const [customHex, setCustomHex] = useState('#2c5aa0');

  const toggle = (name) => {
    if (colors.includes(name)) onChange(colors.filter((c) => c !== name));
    else if (colors.length < 8) onChange([...colors, name]);
  };

  const addCustom = () => {
    if (!colors.includes(customHex) && colors.length < 8) onChange([...colors, customHex]);
  };

  const remove = (name) => onChange(colors.filter((c) => c !== name));

  return (
    <div className="color-picker">
      <div className="color-swatch-grid">
        {PALETTE.map(([name, hex]) => (
          <button
            type="button"
            key={name}
            className={`swatch ${colors.includes(name) ? 'selected' : ''}`}
            style={{ background: hex }}
            title={name}
            aria-label={name}
            aria-pressed={colors.includes(name)}
            onClick={() => toggle(name)}
          >
            {colors.includes(name) && <span className="swatch-check">✓</span>}
          </button>
        ))}
      </div>

      <div className="custom-color-row">
        <input
          type="color"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          aria-label="Elegir un tono exacto"
        />
        <button type="button" className="btn-secondary" onClick={addCustom}>
          Agregar este tono
        </button>
      </div>

      {colors.length > 0 && (
        <div className="tag-list">
          {colors.map((c, i) => (
            <span className="tag-chip" key={`${c}-${i}`}>
              <span className="color-dot" style={{ background: colorHex(c) || '#cfcfcf' }} />
              {c}
              <button type="button" onClick={() => remove(c)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
