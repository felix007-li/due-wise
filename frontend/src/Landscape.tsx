/** Code-native illustration, with no remote assets or tracking. */
export function Landscape() {
  return (
    <svg
      className="welcome-landscape"
      viewBox="0 0 400 300"
      role="img"
      aria-label="A quiet lake between forested mountains"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#fbf8e9" />
          <stop offset="1" stopColor="#e9eddd" />
        </linearGradient>
        <linearGradient id="water" x2="0" y2="1">
          <stop stopColor="#a2ba9e" />
          <stop offset="1" stopColor="#f6f4e4" />
        </linearGradient>
        <path
          id="pine"
          d="M0 0 13 23 8 23 22 42 14 42 30 65 6 65 6 82-6 82-6 65-30 65-14 42-22 42-8 23-13 23Z"
        />
      </defs>
      <rect width="400" height="300" fill="url(#sky)" />
      <circle cx="220" cy="65" r="28" fill="#f8e5b9" />
      <path d="M0 100 70 53 145 88 219 57 300 96 400 47V230H0" fill="#d6ddc7" />
      <path d="m0 111 78-34 105 47 91-39 126 30v150H0" fill="#b5c6aa" />
      <path d="m0 142 100-35 94 47 111-41 95 43v105H0" fill="#90ad90" />
      <path d="M0 191q105-56 200-15t200-2v126H0" fill="url(#water)" />
      <path d="M0 211q78-24 136 5t146 5 118-12v91H0" fill="#e8e9d3" />
      <path
        d="M108 300q72-43 141-60t-15-29q-25-7 3-14"
        fill="none"
        stroke="#fbf9e9"
        strokeWidth="15"
      />
      <g fill="#315a40">
        <use href="#pine" transform="translate(25 72) scale(1.9)" />
        <use href="#pine" transform="translate(63 110) scale(1.3)" />
        <use href="#pine" transform="translate(91 148) scale(.9)" />
        <use href="#pine" transform="translate(379 79) scale(1.6)" />
        <use href="#pine" transform="translate(335 119) scale(1.1)" />
      </g>
      <g fill="#5b805c">
        <use href="#pine" transform="translate(128 151) scale(.58)" />
        <use href="#pine" transform="translate(306 147) scale(.75)" />
        <use href="#pine" transform="translate(288 160) scale(.5)" />
      </g>
      <path d="M0 252q46-30 101-4t91 52H0" fill="#d4ddbe" />
      <path d="M400 248q-59-18-109 20l-35 32h144" fill="#d4ddbe" />
    </svg>
  );
}
