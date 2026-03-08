export function AnimatedSeaBackground() {
  return (
    <svg
      className="fixed inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06170e" />
          <stop offset="60%" stopColor="#0a2214" />
          <stop offset="100%" stopColor="#113a22" />
        </linearGradient>

        <radialGradient id="moonGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cdebd5" />
          <stop offset="40%" stopColor="#a3d9b6" />
          <stop offset="100%" stopColor="#0a2214" stopOpacity="0" />
        </radialGradient>

        <pattern
          id="fishNet"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#228b50"
            strokeWidth="0.75"
            opacity="0.3"
          />
          <circle cx="0" cy="0" r="1.5" fill="#113a22" opacity="0.5" />
        </pattern>

        <radialGradient id="netMaskGrad" cx="50%" cy="50%" r="70%">
          <stop offset="30%" stopColor="black" />
          <stop offset="100%" stopColor="white" />
        </radialGradient>
        <mask id="netMask">
          <rect width="100%" height="100%" fill="url(#netMaskGrad)" />
        </mask>
      </defs>

      <rect width="100%" height="100%" fill="url(#skyGrad)" />

      <g fill="#a3d9b6">
        <circle className="animate-twinkle" cx="300" cy="200" r="1.5" />
        <circle className="animate-twinkle-delay-1" cx="800" cy="150" r="2" />
        <circle className="animate-twinkle-delay-2" cx="1200" cy="300" r="1" />
        <circle className="animate-twinkle" cx="1600" cy="180" r="2.5" />
        <circle className="animate-twinkle-delay-1" cx="500" cy="400" r="1.5" />
        <circle
          className="animate-twinkle-delay-2"
          cx="1800"
          cy="450"
          r="1.5"
        />
        <circle className="animate-twinkle" cx="100" cy="500" r="2" />
        <circle className="animate-twinkle-delay-1" cx="950" cy="100" r="1" />
        <circle
          className="animate-twinkle-delay-2"
          cx="1450"
          cy="350"
          r="1.5"
        />
      </g>

      <g transform="translate(1400, 350)">
        <circle cx="0" cy="0" r="250" fill="url(#moonGrad)" opacity="0.4" />
        <circle cx="0" cy="0" r="60" fill="#e2f5e7" opacity="0.9">
          <animate
            attributeName="opacity"
            values="0.8;0.95;0.8"
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g
        className="animate-birds"
        fill="none"
        stroke="#87bc9b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      >
        <path d="M0,0 Q10,-10 20,0 Q10,-5 0,0" />
        <path d="M-30,20 Q-20,10 -10,20 Q-20,15 -30,20" />
        <path d="M10,25 Q20,15 30,25 Q20,20 10,25" />
      </g>

      <path
        className="animate-wave-back"
        fill="#0c2e1b"
        d="M0,650 C480,550 1440,750 1920,650 C2400,550 3360,750 3840,650 L3840,1080 L0,1080 Z"
      />

      <path
        className="animate-wave-mid"
        fill="#13472a"
        d="M0,750 C480,850 1440,650 1920,750 C2400,850 3360,650 3840,750 L3840,1080 L0,1080 Z"
      />

      <g className="animate-boat">
        <path
          d="M -80,20 Q 0,40 80,20 Q 0,10 -80,20 Z"
          fill="#081f12"
          opacity="0.5"
        />

        <path
          d="M -90,-15 Q 0,15 90,-15 Q 80,5 0,5 Q -80,5 -90,-15 Z"
          fill="#05140c"
        />

        <path
          d="M -85,-13 Q 0,12 85,-13"
          fill="none"
          stroke="#1c5e39"
          strokeWidth="1.5"
        />

        <path d="M -50,-10 Q -40,-35 -25,-10 Z" fill="#05140c" />

        <path
          d="M -65,-36 Q -40,-50 -15,-36 Q -40,-39 -65,-36 Z"
          fill="#05140c"
        />

        <path
          d="M -35,-25 Q -10,-10 10,-5"
          fill="none"
          stroke="#05140c"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M -20,-20 Q 50,-60 140,-10"
          fill="none"
          stroke="#05140c"
          strokeWidth="2"
        />

        <line
          x1="140"
          y1="-10"
          x2="140"
          y2="80"
          stroke="#87bc9b"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          opacity="0.6"
        />

        <path d="M 65,-12 L 68,-22 L 76,-22 L 79,-12 Z" fill="#05140c" />
        <circle cx="72" cy="-17" r="8" fill="#e8d87d" opacity="0.4">
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="72" cy="-17" r="2.5" fill="#fffbe6" />
      </g>

      <path
        className="animate-wave-front"
        fill="#1b613a"
        d="M0,850 C240,750 720,950 960,850 C1200,750 1680,950 1920,850 C2160,750 2640,950 2880,850 C3120,750 3600,950 3840,850 L3840,1080 L0,1080 Z"
      />

      <path
        className="animate-wave-ripple"
        fill="#207545"
        opacity="0.7"
        d="M0,900 C300,800 660,1000 960,900 C1260,800 1620,1000 1920,900 C2220,800 2580,1000 2880,900 C3180,800 3540,1000 3840,900 L3840,1080 L0,1080 Z"
      />

      <rect
        className="pointer-events-none"
        width="100%"
        height="100%"
        fill="url(#fishNet)"
        mask="url(#netMask)"
      />
    </svg>
  );
}
