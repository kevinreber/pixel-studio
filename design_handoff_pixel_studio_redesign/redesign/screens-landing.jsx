/* global React, window, Icon, Button, Badge, Logo */
const { useState: useStateLp } = React;

// production hero images (public S3 assets used on the live landing page)
const S3 = 'https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/';
const HERO = [
  { id: 'h_tree', img: S3 + 'resized-clov1aotv003pr2ygixlp9pmi', base: ['#831843', '#2a0a1c'], mesh: [{ x: 40, y: 30, c: '#fb7185', s: 70 }, { x: 70, y: 75, c: '#f472b6', s: 55 }] },
  { id: 'h_subway', img: S3 + 'resized-clov3hb17001gr2qvnx15mvf7', base: ['#7c2d12', '#1a0a08'], mesh: [{ x: 50, y: 70, c: '#fb923c', s: 75 }, { x: 30, y: 25, c: '#fbbf24', s: 50 }] },
  { id: 'h_stargate', img: S3 + 'resized-cllfyj6la0001r2otvu0ms49w', base: ['#713f12', '#1c1206'], mesh: [{ x: 50, y: 40, c: '#fcd34d', s: 70 }, { x: 75, y: 78, c: '#fb923c', s: 50 }] },
  { id: 'h_ship', img: S3 + 'resized-clkp3riui0001r2wj7q3t8tav', base: ['#1e1b4b', '#0a0918'], mesh: [{ x: 35, y: 35, c: '#818cf8', s: 70 }, { x: 72, y: 68, c: '#38bdf8', s: 55 }] },
  { id: 'h_city', img: S3 + 'resized-clov0tnth001hr2ygj2wec2wn', base: ['#3b0764', '#15032a'], mesh: [{ x: 50, y: 70, c: '#e879f9', s: 75 }, { x: 28, y: 28, c: '#a855f7', s: 55 }] },
];

function FloatTile({ art, style, delay, dur }) {
  const { ArtTile } = window.PS_DATA;
  return (
    <div style={{ position: 'absolute', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-strong)', animation: `ps-float ${dur}s ease-in-out ${delay}s infinite`, ...style }}>
      <ArtTile art={art} radius="0" />
    </div>
  );
}

function LandingPage({ onEnter, theme, onToggleTheme }) {
  const { ARTWORKS, ArtTile } = window.PS_DATA;
  const examples = ['An astronaut playing guitar on Mars', 'Cyberpunk Tokyo in the rain', 'Cozy cabin, snowfall, oil painting'];
  const [ex, setEx] = useStateLp(0);
  const [typed, setTyped] = useStateLp('');

  React.useEffect(() => {
    let ci = 0, del = false, timer;
    const full = examples[ex];
    const tick = () => {
      if (!del) {
        ci++; setTyped(full.slice(0, ci));
        if (ci >= full.length) { timer = setTimeout(() => { del = true; tick(); }, 1800); return; }
        timer = setTimeout(tick, 46);
      } else {
        ci -= 2; setTyped(full.slice(0, Math.max(ci, 0)));
        if (ci <= 0) { setEx((p) => (p + 1) % examples.length); return; }
        timer = setTimeout(tick, 24);
      }
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [ex]);

  const features = [
    { icon: 'cpu', c: '#6d5efc', title: '12 leading models', desc: 'Stable Diffusion, Flux, DALL·E, Ideogram and more — switch any time without leaving your flow.' },
    { icon: 'video', c: '#2dd4bf', title: 'Images & video', desc: 'Generate stills, then bring them to life with text- and image-to-video models.' },
    { icon: 'shuffle', c: '#f472b6', title: 'Remix anything', desc: 'Start from any community creation, tweak the prompt, and make it your own.' },
    { icon: 'layers', c: '#f6b03c', title: 'Organized in sets', desc: 'Every batch is saved, searchable, and easy to revisit or share as a collection.' },
    { icon: 'heart', c: '#f4594a', title: 'A real community', desc: 'Follow creators, like and comment, and build a public gallery of your best work.' },
    { icon: 'bolt', c: '#56a4ff', title: 'Fast & affordable', desc: 'Turbo models render in seconds, with transparent per-image credit pricing.' },
  ];
  const providers = ['Stability AI', 'Black Forest Labs', 'OpenAI', 'Ideogram', 'Runway', 'Luma AI'];

  // smooth-scroll to a section within the landing's scroll container
  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) { onEnter(); return; }
    let s = el.parentElement;
    while (s && s !== document.body) {
      const oy = getComputedStyle(s).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && s.scrollHeight > s.clientHeight + 4) break;
      s = s.parentElement;
    }
    if (!s || s === document.body) return;
    const r = el.getBoundingClientRect(), sr = s.getBoundingClientRect();
    const start = s.scrollTop, dist = (start + (r.top - sr.top) - 80) - start, dur = 520;
    let t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      s.scrollTop = start + dist * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const pricing = [
    { name: 'Free', price: '$0', unit: 'forever', desc: 'For trying things out.', cta: 'Start free', features: ['50 credits / month', 'Standard models', 'Public gallery', 'Community support'], featured: false },
    { name: 'Pro', price: '$18', unit: '/ mo', desc: 'For regular creators.', cta: 'Go Pro', features: ['2,500 credits / month', 'All 12 models + video', 'Private creations & sets', 'Priority generation', 'Commercial license'], featured: true },
    { name: 'Studio', price: '$49', unit: '/ mo', desc: 'For teams & power users.', cta: 'Get Studio', features: ['8,000 credits / month', 'Everything in Pro', 'API access', 'Team workspaces', 'Dedicated support'], featured: false },
  ];

  return (
    <div style={{ minHeight: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* ambient bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(900px 600px at 78% 8%, var(--accent-soft), transparent 60%), radial-gradient(700px 500px at 8% 90%, var(--accent-soft-2), transparent 65%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: theme === 'dark' ? 0.4 : 0.6,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '64px 64px', maskImage: 'radial-gradient(120% 100% at 50% 0%, #000 30%, transparent 75%)' }} />

      {/* nav */}
      <nav style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 40px', maxWidth: 1320, margin: '0 auto' }}>
        <Logo onClick={() => {}} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[['Explore', () => onEnter()], ['Models', () => go('lp-models')], ['Pricing', () => go('lp-pricing')]].map(([l, fn]) => (
            <button key={l} onClick={fn} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500 }}>{l}</button>
          ))}
          <button onClick={onToggleTheme} title="Theme" style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--fg-muted)', marginLeft: 4 }}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} stroke={2} />
          </button>
          <Button variant="ghost" onClick={onEnter}>Sign in</Button>
          <Button variant="primary" iconRight="arrowRight" onClick={onEnter}>Start creating</Button>
        </div>
      </nav>

      {/* hero */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1320, margin: '0 auto', padding: '0 40px',
        display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40, alignItems: 'center', minHeight: 'calc(100vh - 86px)' }}>
        {/* left */}
        <div>
          <div className="anim-fade-up">
            <Badge tone="accent" icon="sparkles" style={{ padding: '5px 12px', fontSize: 12.5, whiteSpace: 'nowrap' }}>1.9M creations and counting</Badge>
          </div>
          <h1 className="anim-fade-up" style={{ animationDelay: '60ms', margin: '22px 0 0', fontSize: 'clamp(40px, 5vw, 66px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.035em' }}>
            Create stunning<br />
            <span style={{ background: 'linear-gradient(100deg, var(--accent), #c4a3ff 60%, #ff9ad1)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>art &amp; video</span><br />
            from a sentence.
          </h1>
          <p className="anim-fade-up" style={{ animationDelay: '120ms', margin: '22px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--fg-muted)', maxWidth: 480 }}>
            Pixel Studio turns your ideas into images and video in seconds. Pick from 12 leading AI models — no design experience required.
          </p>

          {/* prompt bar */}
          <div className="anim-fade-up" style={{ animationDelay: '180ms', marginTop: 28, maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 7, paddingLeft: 16, borderRadius: 'var(--r-lg)',
              background: 'var(--surface-1)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)' }}>
              <Icon name="wand" size={18} stroke={2} style={{ color: 'var(--accent-text)' }} />
              <input onFocus={onEnter} readOnly value={typed} style={{ flex: 1, height: 38, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14.5, cursor: 'pointer' }} />
              <Button variant="primary" iconRight="arrowRight" onClick={onEnter}>Generate</Button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {examples.map((e, i) => (
                <button key={i} onMouseEnter={() => setEx(i)} onClick={onEnter} style={{ padding: '5px 11px', borderRadius: 'var(--r-full)', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: i === ex ? 'var(--accent-soft)' : 'var(--surface-2)', color: i === ex ? 'var(--accent-text)' : 'var(--fg-subtle)',
                  border: `1px solid ${i === ex ? 'var(--border-accent)' : 'var(--border)'}`, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 500, transition: 'all .15s' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* social proof */}
          <div className="anim-fade-up" style={{ animationDelay: '240ms', display: 'flex', alignItems: 'center', gap: 14, marginTop: 30 }}>
            <div style={{ display: 'flex' }}>
              {['novarte', 'pogiboyz', 'studioK', 'paelma'].map((n, i) => (
                <div key={n} style={{ marginLeft: i ? -10 : 0, borderRadius: '50%', border: '2px solid var(--bg)' }}><window.Avatar name={n} size={30} /></div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}><strong style={{ color: 'var(--fg)' }}>12,000+</strong> creators this week</div>
          </div>
        </div>

        {/* right — floating gallery (production hero images) */}
        <div style={{ position: 'relative', height: 580 }}>
          <div style={{ position: 'absolute', inset: '-8% 0% 0% 8%', background: 'radial-gradient(50% 45% at 60% 40%, var(--accent-glow), transparent 70%)', filter: 'blur(30px)', opacity: 0.6 }} />
          <FloatTile art={HERO[1]} delay={0.3} dur={7.6} style={{ width: 172, height: 236, top: 64, left: '30%', zIndex: 4 }} />
          <FloatTile art={HERO[2]} delay={1.4} dur={8.4} style={{ width: 160, height: 224, top: 8, left: '64%', zIndex: 3 }} />
          <FloatTile art={HERO[0]} delay={0} dur={7} style={{ width: 170, height: 248, top: 232, left: '4%', zIndex: 3 }} />
          <FloatTile art={HERO[3]} delay={1.8} dur={9} style={{ width: 160, height: 228, top: 322, left: '36%', zIndex: 2 }} />
          <FloatTile art={HERO[4]} delay={0.9} dur={8} style={{ width: 158, height: 222, top: 268, left: '68%', zIndex: 2 }} />
        </div>
      </div>

      {/* ===== sections below the fold ===== */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* stats strip */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '26px 30px', borderRadius: 'var(--r-xl)',
            background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            {[['1.9M', 'creations made'], ['12,000+', 'weekly creators'], ['12', 'AI models'], ['4.9★', 'avg rating']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-subtle)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* features */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '90px 40px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="u-label" style={{ color: 'var(--accent-text)' }}>Why Pixel Studio</div>
            <h2 style={{ margin: '10px 0 0', fontSize: 'clamp(30px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.025em' }}>Everything you need to create</h2>
            <p style={{ margin: '14px auto 0', maxWidth: 520, fontSize: 16, lineHeight: 1.55, color: 'var(--fg-muted)' }}>From first prompt to finished gallery — one fast, flexible studio.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {features.map((f) => (
              <div key={f.title} style={{ padding: 24, borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)', transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 46, height: 46, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${f.c} 18%, transparent)`, color: f.c, marginBottom: 16 }}>
                  <Icon name={f.icon} size={22} stroke={2} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 7 }}>{f.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* providers */}
        <div id="lp-models" style={{ textAlign: 'center', padding: '70px 40px 0', scrollMarginTop: 80 }}>
          <div style={{ fontSize: 13.5, color: 'var(--fg-subtle)', marginBottom: 20 }}>Powered by the world's best models</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 760, margin: '0 auto' }}>
            {providers.map((p) => (
              <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--r-full)', background: 'var(--surface-1)', border: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--fg-muted)' }}>
                <Icon name="cpu" size={15} stroke={2} style={{ color: 'var(--fg-subtle)' }} />{p}
              </span>
            ))}
          </div>
        </div>

        {/* community gallery */}
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '90px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div className="u-label" style={{ color: 'var(--accent-text)' }}>From the community</div>
              <h2 style={{ margin: '10px 0 0', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 800, letterSpacing: '-0.025em' }}>Made with Pixel Studio</h2>
            </div>
            <Button variant="outline" iconRight="arrowRight" onClick={onEnter}>Explore the gallery</Button>
          </div>
          <div style={{ columns: '5 200px', columnGap: 14 }}>
            {ARTWORKS.slice(0, 14).map((a, i) => (
              <div key={a.id} onClick={onEnter} style={{ breakInside: 'avoid', marginBottom: 14, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', aspectRatio: a.aspect }}>
                <ArtTile art={a} radius="0" />
              </div>
            ))}
          </div>
        </div>

        {/* pricing */}
        <div id="lp-pricing" style={{ maxWidth: 1120, margin: '0 auto', padding: '100px 40px 0', scrollMarginTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="u-label" style={{ color: 'var(--accent-text)' }}>Pricing</div>
            <h2 style={{ margin: '10px 0 0', fontSize: 'clamp(30px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.025em' }}>Simple, credit-based pricing</h2>
            <p style={{ margin: '14px auto 0', maxWidth: 480, fontSize: 16, lineHeight: 1.55, color: 'var(--fg-muted)' }}>Start free. Upgrade any time. Credits roll into every model and video generation.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'stretch' }}>
            {pricing.map((p) => (
              <div key={p.name} style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: 26, borderRadius: 'var(--r-xl)',
                background: p.featured ? 'linear-gradient(160deg, var(--accent-soft), var(--surface-1))' : 'var(--surface-1)',
                border: `1px solid ${p.featured ? 'var(--border-accent)' : 'var(--border)'}`,
                boxShadow: p.featured ? '0 18px 50px -18px var(--accent-glow)' : 'none' }}>
                {p.featured && <div style={{ position: 'absolute', top: 16, right: 16 }}><Badge tone="accent" icon="star" style={{ whiteSpace: 'nowrap' }}>Popular</Badge></div>}
                <div style={{ fontSize: 15, fontWeight: 600, color: p.featured ? 'var(--accent-text)' : 'var(--fg)' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '12px 0 4px' }}>
                  <span className="mono" style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em' }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: 'var(--fg-subtle)' }}>{p.unit}</span>
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 20 }}>{p.desc}</div>
                <Button variant={p.featured ? 'primary' : 'outline'} onClick={onEnter} style={{ width: '100%', marginBottom: 20 }}>{p.cta}</Button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5 }}>
                      <span style={{ marginTop: 1, width: 18, height: 18, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name="check" size={12} stroke={2.6} /></span>
                      <span style={{ color: 'var(--fg-muted)', lineHeight: 1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* final CTA */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 40px 100px' }}>
          <div style={{ position: 'relative', overflow: 'hidden', padding: '64px 40px', borderRadius: 'var(--r-2xl)', textAlign: 'center', background: 'linear-gradient(140deg, #2a1d5c, #14122b)', border: '1px solid var(--border-accent)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 60% at 50% 0%, rgba(124,112,255,.5), transparent 65%)' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Your first creation is moments away.</h2>
              <p style={{ margin: '16px auto 0', maxWidth: 460, fontSize: 16.5, lineHeight: 1.55, color: 'rgba(255,255,255,.72)' }}>Join 12,000+ creators making art and video every week. No credit card required.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30 }}>
                <Button variant="primary" size="lg" iconRight="arrowRight" onClick={onEnter}>Start creating for free</Button>
                <Button variant="outline" size="lg" onClick={onEnter} style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>Explore gallery</Button>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: 36, color: 'var(--fg-faint)', fontSize: 13 }}>© 2026 Pixel Studio AI · Crafted for creators</div>
        </div>
      </div>
    </div>
  );
}

window.LandingPage = LandingPage;
