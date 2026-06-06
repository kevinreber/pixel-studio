/* global React, window, Icon, Avatar, Badge */
const { useState: useStateSb } = React;

function Logo({ size = 30, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 'calc(var(--r-sm) + 1px)', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(140deg, var(--accent), #b388ff)', display: 'grid', placeItems: 'center',
        boxShadow: '0 4px 16px -4px var(--accent-glow)',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.35), transparent 50%)' }} />
        <Icon name="sparkles" size={size * 0.56} stroke={2.2} style={{ color: '#fff' }} />
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)' }}>Pixel Studio</span>
    </button>
  );
}

function NavItem({ item, active, onClick }) {
  const [hover, setHover] = useStateSb(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 11, width: '100%',
        padding: '8px 11px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : hover ? 'var(--surface-2)' : 'transparent',
        color: active ? 'var(--accent-text)' : hover ? 'var(--fg)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active ? 600 : 500,
        transition: 'background .14s, color .14s', textAlign: 'left',
      }}>
      {active && <span style={{ position: 'absolute', left: -9, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: 'var(--accent)' }} />}
      <Icon name={item.icon} size={18} stroke={active ? 2.2 : 1.9} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && <Badge tone="accent" style={{ padding: '1px 7px', fontSize: 10.5 }}>{item.badge}</Badge>}
    </button>
  );
}

const NAV_GROUPS = [
  { label: 'Discover', items: [
    { id: 'explore', label: 'Explore', icon: 'explore' },
    { id: 'feed', label: 'Feed', icon: 'feed' },
    { id: 'users', label: 'Users', icon: 'users' },
  ]},
  { label: 'Create', items: [
    { id: 'create', label: 'Image', icon: 'wand' },
    { id: 'video', label: 'Video', icon: 'video' },
    { id: 'sets', label: 'Sets', icon: 'layers' },
  ]},
  { label: 'Library', items: [
    { id: 'liked', label: 'Liked', icon: 'heart' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ]},
  { label: 'Manage', items: [
    { id: 'whatsnew', label: "What's New", icon: 'sparkles', badge: '3' },
    { id: 'admin', label: 'Admin', icon: 'shield' },
  ]},
];

function NavigationSidebar({ route, onNavigate, theme, onToggleTheme, onLogo, isAdmin }) {
  const navGroups = NAV_GROUPS.map((g) => g.label === 'Manage'
    ? { ...g, items: g.items.filter((it) => it.id !== 'admin' || isAdmin) }
    : g);
  return (
    <aside style={{
      width: 252, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--surface-1)', borderRight: '1px solid var(--border)',
    }}>
      {/* logo */}
      <div style={{ padding: '20px 20px 14px' }}>
        <Logo onClick={onLogo} />
      </div>

      {/* primary CTA */}
      <div style={{ padding: '0 16px 8px' }}>
        <Button variant="primary" icon="plus" onClick={() => onNavigate('create')} style={{ width: '100%', height: 40 }}>
          New creation
        </Button>
      </div>

      {/* nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {navGroups.map((g) => (
          <div key={g.label} style={{ marginBottom: 14 }}>
            <div className="u-label" style={{ padding: '0 11px', marginBottom: 6 }}>{g.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.items.map((it) => (
                <NavItem key={it.id} item={it} active={route === it.id} onClick={() => onNavigate(it.id)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* credits + account */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 13px',
          borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg, var(--accent-soft), var(--accent-soft-2))',
          border: '1px solid var(--border-accent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon name="coins" size={17} stroke={2} style={{ color: 'var(--accent-text)' }} />
            <div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1, color: 'var(--fg)' }}>2,480</div>
              <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>credits</div>
            </div>
          </div>
          <Button variant="soft" size="sm" style={{ height: 30 }}>Buy</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="Kevin Reber" size={36} ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kevin Reber</span>
              {isAdmin && <Badge tone="accent" icon="shield" style={{ padding: '0px 5px', fontSize: 9 }}>Admin</Badge>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>@reebeezie</div>
          </div>
          <button title="Toggle theme" onClick={onToggleTheme} style={{
            width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)',
            background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--fg-muted)',
          }}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} stroke={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}

window.NavigationSidebar = NavigationSidebar;
window.Logo = Logo;
