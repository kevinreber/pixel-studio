/* global React, window, Icon, Button */
const { useState: useStateLg, useEffect: useEffectLg } = React;

/* Brand mark — same gradient sparkle tile as the app's Logo */
function LogoMark({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 'calc(var(--r-sm) + 2px)', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(140deg, var(--accent), #b388ff)', display: 'grid', placeItems: 'center',
      boxShadow: '0 6px 20px -5px var(--accent-glow)', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.38), transparent 50%)' }} />
      <Icon name="sparkles" size={size * 0.56} stroke={2.2} style={{ color: '#fff' }} />
    </div>
  );
}

/* Official multi-color Google "G" */
function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* Floating art tile for the showcase panel */
function ShowTile({ src, style, delay, dur }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: 'var(--r-lg)', overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-strong)',
      animation: `ps-float ${dur}s ease-in-out ${delay}s infinite`, ...style,
    }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
}

function LoginScreen() {
  const [loading, setLoading] = useStateLg(null); // 'google' | null

  const fakeAuth = (which) => {
    if (loading) return;
    setLoading(which);
    setTimeout(() => setLoading(null), 2200);
  };

  return (
    <div style={{ minHeight: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', background: 'var(--bg)' }}>

      {/* ============ LEFT — brand showcase ============ */}
      <div className="login-showcase" style={{ position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
        {/* ambient */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(700px 540px at 30% 12%, var(--accent-soft), transparent 62%), radial-gradient(620px 520px at 82% 88%, var(--accent-soft-2), transparent 66%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.45,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '60px 60px', maskImage: 'radial-gradient(120% 110% at 35% 25%, #000 30%, transparent 78%)' }} />

        {/* floating art collage */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '34%', left: '46%', width: 360, height: 360, transform: 'translate(-50%,-50%)', background: 'radial-gradient(50% 50% at 50% 50%, var(--accent-glow), transparent 70%)', filter: 'blur(38px)', opacity: 0.6 }} />
          <ShowTile src="redesign/img/art-04.jpg" delay={0.2} dur={7.4} style={{ width: 176, height: 240, top: '16%', left: '20%', zIndex: 3 }} />
          <ShowTile src="redesign/img/art-11.jpg" delay={1.3} dur={8.6} style={{ width: 160, height: 214, top: '8%', left: '54%', zIndex: 2 }} />
          <ShowTile src="redesign/img/art-19.jpg" delay={0.7} dur={7.9} style={{ width: 168, height: 232, top: '44%', left: '13%', zIndex: 2 }} />
          <ShowTile src="redesign/img/art-23.jpg" delay={1.8} dur={9.1} style={{ width: 182, height: 248, top: '40%', left: '48%', zIndex: 3 }} />
        </div>

        {/* top brand row */}
        <div style={{ position: 'relative', zIndex: 4, display: 'flex', alignItems: 'center', gap: 12, padding: '34px 40px' }}>
          <LogoMark size={32} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Pixel Studio</span>
        </div>

        {/* scrim for legibility over tiles */}
        <div style={{ position: 'absolute', zIndex: 3, left: 0, right: 0, bottom: 0, height: 320, background: 'linear-gradient(to top, var(--bg) 18%, transparent)', pointerEvents: 'none' }} />

        {/* bottom copy */}
        <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, bottom: 0, padding: '0 48px 44px' }}>
          <div className="anim-fade-up">
            <window.Badge tone="accent" icon="sparkles" style={{ padding: '5px 12px', fontSize: 12.5, whiteSpace: 'nowrap' }}>1.9M creations and counting</window.Badge>
          </div>
          <h2 className="anim-fade-up" style={{ animationDelay: '60ms', margin: '18px 0 0', fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, maxWidth: 460 }}>
            Where a sentence<br />becomes a&nbsp;
            <span style={{ background: 'linear-gradient(100deg, var(--accent), #c4a3ff 60%, #ff9ad1)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>masterpiece.</span>
          </h2>
          <div className="anim-fade-up" style={{ animationDelay: '130ms', display: 'flex', alignItems: 'center', gap: 13, marginTop: 22 }}>
            <div style={{ display: 'flex' }}>
              {['novarte', 'pogiboyz', 'studioK', 'paelma'].map((n, i) => (
                <div key={n} style={{ marginLeft: i ? -10 : 0, borderRadius: '50%', border: '2px solid var(--bg)' }}><window.Avatar name={n} size={30} /></div>
              ))}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}><strong style={{ color: 'var(--fg)' }}>12,000+</strong> creators joined this week</div>
          </div>
        </div>
      </div>

      {/* ============ RIGHT — sign-in ============ */}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: '40px 28px' }}>
        <div className="anim-fade-up" style={{ width: '100%', maxWidth: 392 }}>

          {/* compact brand mark (shown when showcase is hidden) */}
          <div className="login-compact-brand" style={{ display: 'none', alignItems: 'center', gap: 11, marginBottom: 30 }}>
            <LogoMark size={34} />
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Pixel Studio</span>
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 }}>Welcome to Pixel Studio</h1>
          <p style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--fg-muted)' }}>Sign in or create your account with Google to start creating.</p>

          {/* Google OAuth — primary */}
          <button onClick={() => fakeAuth('google')} disabled={!!loading} className="focusable" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, width: '100%', height: 50, marginTop: 30,
            background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)',
            color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            transition: 'background .16s, border-color .16s, transform .12s', opacity: loading && loading !== 'google' ? 0.55 : 1,
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--fg-faint)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}>
            {loading === 'google'
              ? <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--fg-faint)', borderTopColor: 'var(--fg)', animation: 'ps-spin .7s linear infinite' }} />
              : <GoogleG size={19} />}
            {loading === 'google' ? 'Signing in…' : <span style={{ whiteSpace: 'nowrap' }}>Continue with Google</span>}
          </button>

          <p style={{ margin: '16px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-subtle)', textAlign: 'center' }}>
            New accounts are created automatically on your first sign-in.
          </p>

          {/* footer */}
          <div style={{ marginTop: 30, paddingTop: 22, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="shield" size={15} stroke={2} style={{ color: 'var(--fg-subtle)' }} />
            <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Secure sign-in, powered by Google</span>
          </div>
        </div>

        {/* fine print pinned bottom */}
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: 'var(--fg-faint)', padding: '0 24px' }}>
          By continuing you agree to our&nbsp;
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--fg-subtle)', textDecoration: 'none' }}>Terms</a>
          &nbsp;&amp;&nbsp;
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--fg-subtle)', textDecoration: 'none' }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
