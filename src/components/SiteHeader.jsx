/**
 * Cute blossom mark + wordmark — sits above the canvas stack.
 */
export default function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="site-header__brand">
        <svg
          className="site-header__mark"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="site-petal" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff8f3" />
              <stop offset="0.45" stopColor="#ffd4be" />
              <stop offset="1" stopColor="#e8a088" />
            </linearGradient>
            <radialGradient id="site-core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 24) rotate(90) scale(10)">
              <stop stopColor="#fff2ea" />
              <stop offset="1" stopColor="#f0b898" />
            </radialGradient>
          </defs>
          <g transform="translate(24 24)">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-13"
                rx="7"
                ry="11"
                fill="url(#site-petal)"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle r="8" fill="url(#site-core)" />
            <circle r="3.2" fill="#fffaf6" opacity="0.85" cx="-1.5" cy="-1.5" />
          </g>
        </svg>
        <span className="site-header__title">salma</span>
      </div>
    </header>
  );
}
