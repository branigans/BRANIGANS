import { colorHex } from '../lib/colors.js';

export default function ColorTags({ colors }) {
  return (
    <div className="color-tags">
      {colors.map((c, i) => {
        const hex = colorHex(c);
        return (
          <span className="color-tag" key={`${c}-${i}`}>
            <span className="color-dot" style={{ background: hex || '#cfcfcf' }} />
            {c}
          </span>
        );
      })}
    </div>
  );
}
