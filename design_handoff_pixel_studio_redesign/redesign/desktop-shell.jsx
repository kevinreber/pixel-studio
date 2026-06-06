/* global React, window, Icon, Button, Badge, Avatar */
const { useState: useStateDt, useRef: useRefDt, useEffect: useEffectDt } = React;

function useOutside(ref, onClose) {
  useEffectDt(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
}

function NotificationsPopover({ onClose }) {
  const ref = useRefDt(null);
  useOutside(ref, onClose);
  const NOTIFS = (window.PS_DATA && window.PS_DATA.NOTIFS) || [];
  const kindIcon = { like: 'heart', follow: 'follow', comment: 'comment' };
  const kindTone = { like: 'var(--danger)', follow: 'var(--info)', comment: 'var(--accent-text)' };
  return (
    <div ref={ref} className="anim-pop" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 80, width: 360,
      background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Notifications</h3>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-text)', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600 }}>Mark all read</button>
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto', padding: 6 }}>
        {NOTIFS.map((n, i) => {
          const sys = n.who === 'system';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 10px', borderRadius: 'var(--r-md)', background: n.unread ? 'var(--accent-soft-2)' : 'transparent', cursor: 'pointer' }}
              onMouseEnter={(e) => { if (!n.unread) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { if (!n.unread) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {sys ? (
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name={n.icon || 'sparkles'} size={18} stroke={2} /></div>
                ) : (
                  <>
                    <Avatar name={n.who} size={38} />
                    {n.kind && <span style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: kindTone[n.kind] }}><Icon name={kindIcon[n.kind]} size={11} stroke={2.4} /></span>}
                  </>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 600 }}>{sys ? 'Pixel Studio' : n.who}</span> <span style={{ color: 'var(--fg-muted)' }}>{n.text}</span></div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', marginTop: 2 }}>{n.time}</div>
              </div>
              {n.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AccountMenu({ onClose, theme, onToggleTheme, isAdmin, onToggleAdmin, onSignOut }) {
  const ref = useRefDt(null);
  useOutside(ref, onClose);
  const Row = ({ icon, label, onClick, right, danger }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 11px', borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', cursor: 'pointer',
      color: danger ? 'var(--danger)' : 'var(--fg)', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500 }}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'var(--danger-soft)' : 'var(--surface-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <Icon name={icon} size={17} stroke={2} style={{ color: danger ? 'var(--danger)' : 'var(--fg-subtle)' }} />
      <span style={{ flex: 1 }}>{label}</span>
      {right}
    </button>
  );
  const Toggle = ({ on }) => (
    <span style={{ width: 34, height: 20, borderRadius: 99, background: on ? 'var(--accent)' : 'var(--surface-3)', position: 'relative', transition: 'background .16s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .16s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
    </span>
  );
  return (
    <div ref={ref} className="anim-pop" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 80, width: 250,
      background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', padding: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 12px' }}>
        <Avatar name="Kevin Reber" size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Kevin Reber</span>
            {isAdmin && <Badge tone="accent" icon="shield" style={{ padding: '1px 6px', fontSize: 9.5 }}>Admin</Badge>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>@reebeezie</div>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 6px' }} />
      <Row icon="user" label="View profile" onClick={onClose} />
      <Row icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'Light appearance' : 'Dark appearance'} onClick={onToggleTheme} />
      <Row icon="shield" label="Admin access" onClick={onToggleAdmin} right={<Toggle on={isAdmin} />} />
      <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
      <Row icon="logout" label="Sign out" onClick={onSignOut} danger />
    </div>
  );
}

function DesktopTopBar({ title, theme, onToggleTheme, isAdmin, onToggleAdmin, onSignOut }) {
  const [notif, setNotif] = useStateDt(false);
  const [menu, setMenu] = useStateDt(false);
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
      height: 58, padding: '0 40px', background: 'color-mix(in oklab, var(--bg) 82%, transparent)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>
      {/* bell */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setNotif(!notif); setMenu(false); }} title="Notifications" style={{ position: 'relative', width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)',
          background: notif ? 'var(--surface-2)' : 'transparent', border: '1px solid var(--border)', color: 'var(--fg-muted)', cursor: 'pointer' }}>
          <Icon name="bell" size={18} stroke={2} />
          <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--bg)' }} />
        </button>
        {notif && <NotificationsPopover onClose={() => setNotif(false)} />}
      </div>
      {/* account */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setMenu(!menu); setNotif(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 8px 0 4px', borderRadius: 'var(--r-full)',
          background: menu ? 'var(--surface-2)' : 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <Avatar name="Kevin Reber" size={30} />
          <Icon name="chevronDown" size={15} stroke={2.2} style={{ color: 'var(--fg-subtle)' }} />
        </button>
        {menu && <AccountMenu onClose={() => setMenu(false)} theme={theme} onToggleTheme={onToggleTheme} isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} onSignOut={onSignOut} />}
      </div>
    </div>
  );
}

window.DesktopTopBar = DesktopTopBar;
