/* global React, window, Icon, Badge, Avatar */
const { useState: useStateMs } = React;

/* status-bar + dynamic-island clearance */
const TOP_PAD = 56;
const BOTTOM_PAD = 26;

function MTopBar({ title, onMenu, right, sub }) {
  return (
    <div style={{ flexShrink: 0, paddingTop: TOP_PAD, paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
      background: 'var(--bg)', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onMenu && (
          <button onClick={onMenu} style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', color: 'var(--fg)', cursor: 'pointer', marginLeft: -6 }}>
            <Icon name="grid" size={20} stroke={2} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          {sub && <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 1 }}>{sub}</div>}
        </div>
        {right && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{right}</div>}
        <TopIconBtn icon="bell" badge onClick={() => window.__openNotifs && window.__openNotifs()} />
      </div>
    </div>
  );
}

function TopIconBtn({ icon, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ position: 'relative', width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}>
      <Icon name={icon} size={18} stroke={2} />
      {badge && <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--bg)' }} />}
    </button>
  );
}

const M_NAV = [
  { id: 'explore', label: 'Explore', icon: 'explore' },
  { id: 'feed', label: 'Feed', icon: 'feed' },
  { id: 'create', label: 'Create', icon: 'plus', fab: true },
  { id: 'liked', label: 'Liked', icon: 'heart' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

function MBottomNav({ route, onNav }) {
  return (
    <div style={{ flexShrink: 0, paddingBottom: BOTTOM_PAD, paddingTop: 8, background: 'color-mix(in oklab, var(--bg) 86%, transparent)',
      backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative', zIndex: 5 }}>
      {M_NAV.map((n) => {
        const on = route === n.id;
        if (n.fab) {
          return (
            <button key={n.id} onClick={() => onNav(n.id)} style={{ width: 50, height: 50, borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', marginTop: -16,
              background: 'linear-gradient(140deg, var(--accent), #b388ff)', color: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px -6px var(--accent-glow)' }}>
              <Icon name="plus" size={24} stroke={2.4} />
            </button>
          );
        }
        return (
          <button key={n.id} onClick={() => onNav(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 60, background: 'none', border: 'none', cursor: 'pointer',
            color: on ? 'var(--accent-text)' : 'var(--fg-subtle)' }}>
            <Icon name={n.icon} size={21} stroke={on ? 2.3 : 1.9} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* generic bottom sheet */
function MSheet({ open, onClose, children, height = 'auto', title }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', animation: 'ps-fade .2s' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-1)', borderRadius: '22px 22px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
        maxHeight: '88%', height, display: 'flex', flexDirection: 'column', paddingBottom: BOTTOM_PAD, animation: 'ps-sheet-up .28s var(--ease-out)', boxShadow: '0 -20px 50px -10px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}><span style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--border-strong)' }} /></div>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 8px' }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
            <button onClick={onClose} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)', background: 'var(--surface-3)', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer' }}><Icon name="x" size={16} stroke={2.2} /></button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

const MENU_GENERAL = [
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'video', label: 'Create Video', icon: 'video' },
  { id: 'sets', label: 'Sets', icon: 'layers' },
  { id: 'whatsnew', label: "What's New", icon: 'sparkles', badge: '3' },
  { id: 'landing', label: 'View landing page', icon: 'external' },
];
const MENU_ADMIN = [
  { id: 'admin', label: 'Admin Dashboard', icon: 'shield' },
];

function MenuRow({ m, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 12px', borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg)', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, width: '100%' }}>
      <Icon name={m.icon} size={20} stroke={2} style={{ color: 'var(--fg-muted)' }} />
      <span style={{ flex: 1 }}>{m.label}</span>
      {m.badge && <Badge tone="accent" style={{ padding: '1px 7px', fontSize: 10.5 }}>{m.badge}</Badge>}
      <Icon name="chevronRight" size={16} stroke={2} style={{ color: 'var(--fg-faint)' }} />
    </button>
  );
}

function MMenuSheet({ open, onClose, onNav, theme, onToggleTheme, isAdmin, onToggleAdmin }) {
  return (
    <MSheet open={open} onClose={onClose} title="Pixel Studio">
      {/* account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 16px' }}>
        <Avatar name="Kevin Reber" size={44} ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Kevin Reber</span>
            {isAdmin && <Badge tone="accent" icon="shield" style={{ padding: '1px 7px', fontSize: 10 }}>Admin</Badge>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>@reebeezie</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 'var(--r-full)', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)' }}>
          <Icon name="coins" size={14} stroke={2} style={{ color: 'var(--accent-text)' }} />
          <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>2,480</span>
        </div>
      </div>

      <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {MENU_GENERAL.map((m) => <MenuRow key={m.id} m={m} onClick={() => { onNav(m.id); onClose(); }} />)}

        {/* role-gated admin section */}
        {isAdmin && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 12px 6px' }}>
              <span className="u-label" style={{ color: 'var(--accent-text)' }}>Admin</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {MENU_ADMIN.map((m) => (
              <button key={m.id} onClick={() => { onNav(m.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 12px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft-2)', border: '1px solid var(--border-accent)', cursor: 'pointer', color: 'var(--fg)', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, width: '100%', marginBottom: 2 }}>
                <Icon name={m.icon} size={20} stroke={2} style={{ color: 'var(--accent-text)' }} />
                <span style={{ flex: 1 }}>{m.label}</span>
                <Icon name="chevronRight" size={16} stroke={2} style={{ color: 'var(--accent-text)' }} />
              </button>
            ))}
          </>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
        <button onClick={onToggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 12px', borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg)', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500 }}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} stroke={2} style={{ color: 'var(--fg-muted)' }} />
          <span style={{ flex: 1 }}>{theme === 'dark' ? 'Light appearance' : 'Dark appearance'}</span>
        </button>
        {/* demo-only: preview the non-admin experience */}
        <button onClick={onToggleAdmin} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 12px', borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500 }}>
          <Icon name="eye" size={18} stroke={2} />
          <span style={{ flex: 1 }}>{isAdmin ? 'Preview as standard user' : 'Exit preview (you are admin)'}</span>
        </button>
      </div>
    </MSheet>
  );
}

function MNotifsSheet({ open, onClose }) {
  const NOTIFS = (window.PS_DATA && window.PS_DATA.NOTIFS) || [];
  const kindIcon = { like: 'heart', follow: 'follow', comment: 'comment' };
  const kindTone = { like: 'var(--danger)', follow: 'var(--info)', comment: 'var(--accent)' };
  return (
    <MSheet open={open} onClose={onClose} title="Notifications">
      <div style={{ padding: '4px 8px 8px', display: 'flex', flexDirection: 'column' }}>
        {NOTIFS.map((n, i) => {
          const sys = n.who === 'system';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 'var(--r-md)', background: n.unread ? 'var(--accent-soft-2)' : 'transparent' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {sys ? (
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name={n.icon || 'sparkles'} size={18} stroke={2} /></div>
                ) : (
                  <>
                    <Avatar name={n.who} size={38} />
                    {n.kind && <span style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-1)', display: 'grid', placeItems: 'center', color: kindTone[n.kind] }}><Icon name={kindIcon[n.kind]} size={11} stroke={2.4} /></span>}
                  </>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.4, color: 'var(--fg)' }}><span style={{ fontWeight: 600 }}>{sys ? 'Pixel Studio' : n.who}</span> <span style={{ color: 'var(--fg-muted)' }}>{n.text}</span></div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', marginTop: 2 }}>{n.time}</div>
              </div>
              {n.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </MSheet>
  );
}

Object.assign(window, { MTopBar, TopIconBtn, MBottomNav, MSheet, MMenuSheet, MNotifsSheet, M_TOP_PAD: TOP_PAD, M_BOTTOM_PAD: BOTTOM_PAD });
