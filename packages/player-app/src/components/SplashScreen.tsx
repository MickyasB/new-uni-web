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
      background: 'linear-gradient(170deg, #060D1A 0%, #0B1426 30%, #132240 60%, #1A3060 100%)',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      color: '#ffffff',
    }}>
      {/* Ambient Light Rays */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '500px',
        height: '500px',
        marginTop: '-310px',
        marginLeft: '-250px',
        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(229,161,0,0.05) 20deg, transparent 40deg, transparent 90deg, rgba(229,161,0,0.03) 110deg, transparent 130deg, transparent 180deg, rgba(229,161,0,0.05) 200deg, transparent 220deg, transparent 270deg, rgba(229,161,0,0.03) 290deg, transparent 310deg)',
        borderRadius: '50%',
        animation: 'glow-pulse 20s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Subtle Gold Particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`p-${i}`}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #E5A100 0%, rgba(229,161,0,0.4) 60%, transparent 100%)',
            pointerEvents: 'none',
            left: `${(i * 8) + Math.random() * 4}%`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            animation: `particle-rise ${5 + (i % 4)}s linear infinite`,
            animationDelay: `${(i % 4) * 1}s`,
            opacity: 0.5,
          }}
        />
      ))}

      {/* Central Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
        position: 'relative',
        animation: 'entrance-scale 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Orbit Container */}
        <div style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

          {/* Orbiting Balls */}
          {[
            { letter: 'B', color: 'linear-gradient(135deg, #2563eb, #1d4ed8)', delay: '0s' },
            { letter: 'I', color: 'linear-gradient(135deg, #dc2626, #b91c1c)', delay: '-2.4s' },
            { letter: 'N', color: 'linear-gradient(135deg, #059669, #047857)', delay: '-4.8s' },
            { letter: 'G', color: 'linear-gradient(135deg, #7c3aed, #6d28d9)', delay: '-7.2s' },
            { letter: 'O', color: 'linear-gradient(135deg, #E5A100, #C48800)', delay: '-9.6s' },
          ].map((ball, i) => (
            <div
              key={`ob-${i}`}
              style={{
                position: 'absolute',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                boxShadow: '0 0 20px rgba(229, 161, 0, 0.1), inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.15)',
                background: ball.color,
                animation: 'orbit-ball-anim 12s linear infinite',
                animationDelay: ball.delay,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {ball.letter}
            </div>
          ))}

          {/* Inner Rings */}
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            border: '1px solid rgba(229, 161, 0, 0.1)',
          }} />
          <div style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '1px dashed rgba(229, 161, 0, 0.06)',
          }} />

          {/* Central Logo */}
          <div className="super-bingo-hero-logo" style={{ position: 'absolute' }}>
            <img
              src="./logo.svg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.svg'; }}
              alt="Super Bingo"
              className="super-bingo-logo-img super-bingo-logo-img-lg"
            />
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: '0.3rem',
          fontWeight: 600,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Play · Match · Win
        </p>

        {/* Language Tags */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
        }}>
          {['ብትግርኛ', 'በአማርኛ', 'Afaan Oromoo'].map((lang, i) => (
            <span key={i} style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              background: 'rgba(229, 161, 0, 0.08)',
              border: '1px solid rgba(229, 161, 0, 0.2)',
              fontSize: '0.72rem',
              color: '#E5A100',
              fontWeight: 600,
            }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Loading Section */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 10,
        width: '80%',
        maxWidth: '280px',
      }}>
        <div style={{
          width: '100%',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #E5A100, #C48800)',
            borderRadius: '4px',
            animation: 'load-progress 2s ease-out infinite',
          }} />
        </div>

        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Loading...
        </p>
      </div>

      {/* Version Badge */}
      <div style={{
        position: 'absolute',
        bottom: '3%',
        padding: '0.3rem 0.9rem',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.68rem',
        color: 'rgba(255, 255, 255, 0.35)',
        fontWeight: 500,
        letterSpacing: '0.06em',
      }}>
        Super Bingo v2.2
      </div>
    </div>
  );
}
