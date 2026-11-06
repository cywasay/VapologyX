const STREETS = ["M-10 70 330 40", "M-10 170 330 150", "M90-10 120 250", "M230-10 210 250", "M-10 120 120 110"];

// A drawn map: streets, a route, and a pin that drops onto the store.
export function StoreMap() {
  return <div className="home-map" aria-hidden="true">
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice">
      <g className="home-map-streets">{STREETS.map(path => <path key={path} pathLength="100" d={path} />)}</g>
      <path className="home-map-route" pathLength="100" d="M40 214 112 160 168 168 218 112" />
      <g className="home-pin" transform="translate(218 112)">
        <ellipse className="home-pin-ripple" rx="7" ry="2.6" />
        <ellipse className="home-pin-ripple" rx="7" ry="2.6" />
        <g className="home-pin-drop">
          <path className="home-pin-shape" d="M0 0C-4-7-12-13-12-22a12 12 0 1 1 24 0C12-13 4-7 0 0Z" />
          <circle className="home-pin-hole" cy="-22" r="4.6" />
        </g>
      </g>
    </svg>
  </div>;
}
