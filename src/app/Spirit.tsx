/**
 * De Geest van de Berg (#38): een zwevend lichtje dat het Oog bewaakt. Enkel CSS/SVG.
 */
export function Spirit({ talking = false, size = 72 }: { talking?: boolean; size?: number }) {
  return (
    <div className={`spirit${talking ? ' talking' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id="spirit-core" cx="50%" cy="45%" r="50%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#c9f4ff" />
            <stop offset="0.7" stopColor="#9be7ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#9be7ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#spirit-core)" />
        <path d="M50 70 Q42 84 50 96 Q58 84 50 70" fill="#9be7ff" opacity="0.55" />
        <ellipse cx="41" cy="46" rx="4" ry="6" fill="#0b1026" opacity="0.75" />
        <ellipse cx="59" cy="46" rx="4" ry="6" fill="#0b1026" opacity="0.75" />
      </svg>
    </div>
  );
}
