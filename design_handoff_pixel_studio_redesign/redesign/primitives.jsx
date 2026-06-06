/* global React */
const { useState, useRef, useEffect, createContext, useContext } = React;

/* ============================================================
   ICONS — simple Lucide-style stroke set
   ============================================================ */
const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  explore: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  users: '<path d="M16 19a4 4 0 0 0-8 0"/><circle cx="12" cy="8" r="3.2"/><path d="M21 19a4 4 0 0 0-3-3.8"/><path d="M3 19a4 4 0 0 1 3-3.8"/>',
  feed: '<circle cx="5" cy="19" r="1.4"/><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/>',
  wand: '<path d="m4 20 11-11"/><path d="m15 5 1.5-1.5 1 2.5 2.5 1L20 9"/><path d="M9 4.5 9.6 6m4.9 9.4.6 1.5M5.5 9 7 9.6"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10 6-3v10l-6-3z"/>',
  sets: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M9 3v18"/>',
  layers: '<path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  heart: '<path d="M12 20s-7-4.6-9.2-9C1.3 8.1 2.6 5 5.6 5c1.9 0 3.2 1.2 4.4 2.6C11.2 6.2 12.5 5 14.4 5c3 0 4.3 3.1 2.8 6-2.2 4.4-9.2 9-9.2 9Z"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  sparkles: '<path d="m12 3 1.7 4.8L18.5 9.5 13.7 11.2 12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z"/><path d="M19 14.5 19.8 17l2.2.8-2.2.8L19 21l-.8-2.4-2.2-.8 2.2-.8.8-2.5Z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 7.4 7 9 4-1.6 7-4.7 7-9V6l-7-3Z"/>',
  bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9"/><path d="M10.5 19a2 2 0 0 0 3 0"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m3.5 17 5-5 4 4 3-3 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  comment: '<path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20l1.3-4A8 8 0 1 1 21 11.5Z"/>',
  shuffle: '<path d="M4 7h3l9 10h4M4 17h3l3-3.2M14 7h6m0 0-2.5-2.5M20 7l-2.5 2.5M20 17l-2.5 2.5M20 17l-2.5-2.5"/>',
  download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/>',
  share: '<circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="m8.2 11 6.6-3.6M8.2 13l6.6 3.6"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  star: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.8 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z"/>',
  trending: '<path d="m3 16 5-5 4 4 7-8"/><path d="M16 7h5v5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3"/><path d="M15 11.5c2.4.3 6 1.4 6 3.5 0 1.7-2.7 3-6 3-1.5 0-2.9-.3-4-.7"/>',
  zap: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
  activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  play: '<path d="M7 5l12 7-12 7V5Z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>',
  compare: '<rect x="3" y="4" width="7" height="16" rx="1.6"/><rect x="14" y="4" width="7" height="16" rx="1.6"/>',
  trash: '<path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7"/>',
  document: '<path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 1v3M14 1v3M10 20v3M14 20v3M1 10h3M1 14h3M20 10h3M20 14h3"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.4-1-2.5 1-1.5 2-1.5h1a3 3 0 0 0 3-3c0-3.9-3.6-6-7-6Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
  ratio: '<rect x="3" y="3" width="18" height="18" rx="2.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.8 7.8 0 0 0 0-2l1.7-1.3-1.8-3-2 .8a7.8 7.8 0 0 0-1.8-1l-.3-2.2h-3.6l-.3 2.2a7.8 7.8 0 0 0-1.8 1l-2-.8-1.8 3L4.6 11a7.8 7.8 0 0 0 0 2l-1.7 1.3 1.8 3 2-.8a7.8 7.8 0 0 0 1.8 1l.3 2.2h3.6l.3-2.2a7.8 7.8 0 0 0 1.8-1l2 .8 1.8-3L19.4 13Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
  follow: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M18 8v6M21 11h-6"/>',
  following: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="m16 11 2 2 4-4"/>',
  pin: '<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
  send: '<path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z"/><path d="m10 13.5 5-5"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16h.01"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18M16.5 13.5h.01"/>',
  external: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="m9 15 6-6M11 9h4v4"/>',
};

function Icon({ name, size = 18, stroke = 2, className = '', style = {} }) {
  const d = ICON_PATHS[name] || '';
  return (
    <svg
      className={className}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}

/* ============================================================
   BUTTON
   ============================================================ */
function Button({ variant = 'secondary', size = 'md', icon, iconRight, children, onClick, active, title, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-sans)', fontWeight: 600, cursor: 'pointer',
    borderRadius: 'var(--r-sm)', border: '1px solid transparent', whiteSpace: 'nowrap',
    transition: 'background .16s var(--ease), border-color .16s, color .16s, transform .12s, box-shadow .16s',
    lineHeight: 1,
  };
  const sizes = {
    sm: { padding: '0 11px', height: 32, fontSize: 13 },
    md: { padding: '0 15px', height: 38, fontSize: 14 },
    lg: { padding: '0 22px', height: 46, fontSize: 15 },
    icon: { padding: 0, width: 38, height: 38 },
    iconSm: { padding: 0, width: 32, height: 32 },
  };
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--accent-fg)', boxShadow: '0 6px 20px -8px var(--accent-glow)' },
    secondary: { background: 'var(--surface-2)', color: 'var(--fg)', borderColor: 'var(--border-strong)' },
    ghost: { background: active ? 'var(--surface-2)' : 'transparent', color: active ? 'var(--fg)' : 'var(--fg-muted)' },
    soft: { background: 'var(--accent-soft)', color: 'var(--accent-text)', borderColor: 'var(--border-accent)' },
    danger: { background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'transparent' },
    outline: { background: 'transparent', color: 'var(--fg)', borderColor: 'var(--border-strong)' },
  };
  const [hover, setHover] = useState(false);
  const hoverStyle = hover ? {
    primary: { background: 'var(--accent-hover)', transform: 'translateY(-1px)' },
    secondary: { background: 'var(--surface-hover)', borderColor: 'var(--fg-faint)' },
    ghost: { background: 'var(--surface-2)', color: 'var(--fg)' },
    soft: { background: 'var(--accent-soft)', borderColor: 'var(--accent)' },
    danger: { background: 'var(--danger-soft)', borderColor: 'var(--danger)' },
    outline: { background: 'var(--surface-2)', borderColor: 'var(--fg-faint)' },
  }[variant] : {};
  const sz = sizes[size] || sizes.md;
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sz, ...variants[variant], ...hoverStyle, ...style }}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} stroke={2.1} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16} stroke={2.1} />}
    </button>
  );
}

/* ============================================================
   BADGE / PILL / CHIP
   ============================================================ */
function Badge({ children, tone = 'neutral', icon, mono, style = {} }) {
  const tones = {
    neutral: { bg: 'var(--surface-3)', fg: 'var(--fg-muted)', bd: 'var(--border)' },
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text)', bd: 'var(--border-accent)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)', bd: 'transparent' },
    warning: { bg: 'var(--warning-soft)', fg: 'var(--warning)', bd: 'transparent' },
    danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)', bd: 'transparent' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)', bd: 'transparent' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 11.5, fontWeight: 600,
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', lineHeight: 1.3, ...style,
    }}>
      {icon && <Icon name={icon} size={12} stroke={2.3} />}
      {children}
    </span>
  );
}

/* ============================================================
   PAGE HEADER — consistent across every screen
   ============================================================ */
function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {icon && (
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center',
            background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px solid var(--border-accent)', flexShrink: 0,
          }}>
            <Icon name={icon} size={21} stroke={2} />
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h1>
          {subtitle && <p style={{ margin: '5px 0 0', fontSize: 14, color: 'var(--fg-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>}
    </div>
  );
}

/* ============================================================
   SEGMENTED CONTROL
   ============================================================ */
function Segmented({ options, value, onChange, size = 'md' }) {
  const h = size === 'sm' ? 32 : 38;
  const fs = size === 'sm' ? 12.5 : 13.5;
  return (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2, background: 'var(--surface-inset)',
      borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
    }}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const ic = typeof o === 'object' ? o.icon : null;
        const on = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, height: h - 8, padding: '0 12px',
            border: 'none', cursor: 'pointer', borderRadius: 'calc(var(--r-sm) - 2px)',
            fontFamily: 'var(--font-sans)', fontSize: fs, fontWeight: 600,
            background: on ? 'var(--surface-3)' : 'transparent',
            color: on ? 'var(--fg)' : 'var(--fg-subtle)',
            boxShadow: on ? 'var(--shadow-sm)' : 'none',
            transition: 'all .15s var(--ease)',
          }}>
            {ic && <Icon name={ic} size={14} stroke={2.2} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   SELECT (custom dropdown)
   ============================================================ */
function Select({ value, options, onChange, icon, width = 'auto' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = options.find((o) => (typeof o === 'string' ? o : o.value) === value);
  const curLabel = typeof current === 'string' ? current : current?.label || value;
  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 38, padding: '0 12px',
        background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)',
        color: 'var(--fg)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500,
      }}>
        {icon && <Icon name={icon} size={15} stroke={2} style={{ color: 'var(--fg-subtle)' }} />}
        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>{curLabel}</span>
        <Icon name="chevronDown" size={15} stroke={2.2} style={{ color: 'var(--fg-subtle)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
      </button>
      {open && (
        <div className="anim-pop" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: '100%', zIndex: 50,
          background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-pop)', padding: 5, maxHeight: 280, overflowY: 'auto',
        }}>
          {options.map((o) => {
            const v = typeof o === 'string' ? o : o.value;
            const l = typeof o === 'string' ? o : o.label;
            const on = v === value;
            return (
              <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px',
                background: on ? 'var(--accent-soft)' : 'transparent', border: 'none', borderRadius: 'var(--r-xs)',
                color: on ? 'var(--accent-text)' : 'var(--fg)', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: on ? 600 : 500, whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ flex: 1 }}>{l}</span>
                {on && <Icon name="check" size={15} stroke={2.4} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AVATAR
   ============================================================ */
function Avatar({ name, src, size = 36, ring }) {
  const initials = (name || '?').slice(0, 1).toUpperCase();
  const hue = ((name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 47) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'grid', placeItems: 'center', overflow: 'hidden',
      background: src ? `center/cover url(${src})` : `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
      color: '#fff', fontWeight: 700, fontSize: size * 0.4,
      boxShadow: ring ? '0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent)' : 'none',
    }}>
      {!src && initials}
    </div>
  );
}

/* small helper: scroll-reveal wrapper */
function Reveal({ children, delay = 0, style = {} }) {
  return <div className="anim-fade-up" style={{ animationDelay: `${delay}ms`, ...style }}>{children}</div>;
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ icon = 'sparkles', title, subtitle, action, compact }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: compact ? '48px 20px' : '76px 20px' }}>
      <div style={{ width: 60, height: 60, borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px solid var(--border-accent)', marginBottom: 18 }}>
        <Icon name={icon} size={27} stroke={1.8} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, maxWidth: 360, fontSize: 14, lineHeight: 1.55, color: 'var(--fg-muted)' }}>{subtitle}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

Object.assign(window, { Icon, Button, Badge, PageHeader, Segmented, Select, Avatar, Reveal, EmptyState });
