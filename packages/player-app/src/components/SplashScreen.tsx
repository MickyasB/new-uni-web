// React import omitted to prevent unused import TS6133 warning

export default function SplashScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      position: 'relative',
      background: 'linear-gradient(185deg, #0e3094 0%, #1b154a 50%, #4f0b8c 100%)',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      color: '#ffffff',
    }}>
      {/* Styles Injection for Custom Animations */}
      <style>{`
        @keyframes float-bubble-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5px, -15px) scale(1.03); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float-bubble-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -20px) scale(0.98); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float-bubble-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8px, -10px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .bubble {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 70%, rgba(255, 255, 255, 0) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.25);
          font-weight: 700;
          user-select: none;
          box-shadow: inset 2px 2px 6px rgba(255, 255, 255, 0.1), inset -2px -2px 6px rgba(0, 0, 0, 0.2);
        }
        .bubble-b7 {
          width: 80px; height: 80px; top: 18%; left: 8%;
          font-size: 0.95rem;
          animation: float-bubble-1 7s ease-in-out infinite;
        }
        .bubble-o65 {
          width: 110px; height: 110px; top: 12%; right: 10%;
          font-size: 1.15rem;
          animation: float-bubble-2 9s ease-in-out infinite;
        }
        .bubble-g51 {
          width: 90px; height: 90px; top: 45%; right: 5%;
          font-size: 1rem;
          animation: float-bubble-3 8s ease-in-out infinite;
        }
        .bubble-n44 {
          width: 100px; height: 100px; bottom: 20%; right: 8%;
          font-size: 1.05rem;
          animation: float-bubble-1 10s ease-in-out infinite;
        }
        .bubble-i22 {
          width: 95px; height: 95px; bottom: 15%; left: 10%;
          font-size: 1.05rem;
          animation: float-bubble-2 8.5s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Translucent Bubbles */}
      <div className="bubble bubble-b7">B-7</div>
      <div className="bubble bubble-o65">O-65</div>
      <div className="bubble bubble-g51">G-51</div>
      <div className="bubble bubble-n44">N-44</div>
      <div className="bubble bubble-i22">I-22</div>

      {/* Centered Shield Badge Logo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        marginBottom: '2.5rem'
      }}>
        {/* Crisp Golden-Crimson SVG Badge */}
        <div style={{ filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5))' }}>
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="74" fill="url(#dark-shield-grad)" stroke="url(#gold-shield-grad)" strokeWidth="6" />
            <circle cx="80" cy="80" r="70" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.5" />
            
            {/* Crimson Inner Sphere */}
            <circle cx="80" cy="80" r="62" fill="url(#crimson-shield-grad)" stroke="url(#gold-highlight-grad)" strokeWidth="2.5" />
            
            {/* Highlight Shine Curve */}
            <path d="M23 62 C 53 28, 107 28, 137 62 C 107 47, 53 47, 23 62 Z" fill="#ffffff" fillOpacity="0.15" />
            
            {/* Inner dashed ring */}
            <circle cx="80" cy="80" r="52" stroke="url(#gold-shield-grad)" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* BINGO text */}
            <text x="80" y="70" textAnchor="middle" fill="#ffffff" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="21" letterSpacing="1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>BINGO</text>
            
            {/* Pill Container for 10:20 */}
            <rect x="36" y="81" width="88" height="22" rx="11" fill="url(#gold-shield-grad)" />
            <text x="80" y="97" textAnchor="middle" fill="#0c0e15" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="15">10:20</text>
            
            <defs>
              <radialGradient id="dark-shield-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 80) rotate(90) scale(74)">
                <stop offset="0%" stopColor="#2c3040" />
                <stop offset="100%" stopColor="#0d0e14" />
              </radialGradient>
              <linearGradient id="gold-shield-grad" x1="80" y1="6" x2="80" y2="154" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffe259" />
                <stop offset="100%" stopColor="#ffa751" />
              </linearGradient>
              <linearGradient id="gold-highlight-grad" x1="80" y1="18" x2="80" y2="142" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ffe259" stopOpacity="0.2" />
              </linearGradient>
              <radialGradient id="crimson-shield-grad" cx="55" cy="55" r="75" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 80) rotate(90) scale(62)">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="60%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Big White App Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginTop: '1.5rem',
          textAlign: 'center',
          textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontFamily: "'Inter', sans-serif"
        }}>
          BINGO 10:20
        </h1>

        {/* Subtitle - Languages */}
        <p style={{
          fontSize: '1.15rem',
          color: 'rgba(255, 255, 255, 0.75)',
          marginTop: '0.4rem',
          fontWeight: 500,
          textAlign: 'center',
          letterSpacing: '0.02em'
        }}>
          ብትግርኛ / በአማርኛ
        </p>
      </div>

      {/* Loading / Connecting Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        position: 'absolute',
        bottom: '8%'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          borderTop: '3px solid #ffffff',
          borderRadius: '50%',
          animation: 'spin-loader 1s linear infinite',
        }} />
        <p style={{
          marginTop: '0.75rem',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          Connecting...
        </p>
      </div>

      {/* Footer Version Tag */}
      <div style={{
        position: 'absolute',
        bottom: '2.5%',
        padding: '0.35rem 0.95rem',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: 500,
        letterSpacing: '0.04em'
      }}>
        Version 2.1.0
      </div>
    </div>
  );
}
