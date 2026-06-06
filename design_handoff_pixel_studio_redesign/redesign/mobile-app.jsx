/* global React, ReactDOM, window, IOSDevice, MBottomNav, MMenuSheet, MImageSheet */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function MobileRoot() {
  const [theme, setTheme] = useStateApp('dark');
  const [route, setRoute] = useStateApp('landing');
  const [art, setArt] = useStateApp(null);
  const [menu, setMenu] = useStateApp(false);
  const [notifs, setNotifs] = useStateApp(false);
  const [isAdmin, setIsAdmin] = useStateApp(true);
  const loggedIn = route !== 'landing';
  window.__openNotifs = () => setNotifs(true);
  const toggleAdmin = () => setIsAdmin((v) => { if (v && route === 'admin') setRoute('explore'); return !v; });

  const nav = (r) => setRoute(r);
  const openMenu = () => setMenu(true);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const screen = () => {
    switch (route) {
      case 'explore': return <window.MExplore onOpen={setArt} onMenu={openMenu} />;
      case 'feed': return <window.MFeed onOpen={setArt} onMenu={openMenu} />;
      case 'create': return <window.MCreate onMenu={openMenu} />;
      case 'video': return <window.MCreate onMenu={openMenu} />;
      case 'profile': return <window.MProfile onOpen={setArt} onMenu={openMenu} />;
      case 'liked': return <window.MLiked onOpen={setArt} onMenu={openMenu} />;
      case 'whatsnew': return <window.MWhatsNew onMenu={openMenu} />;
      case 'admin': return isAdmin ? <window.MAdmin onMenu={openMenu} /> : <window.MExplore onOpen={setArt} onMenu={openMenu} />;
      case 'users': return <window.MUsers onMenu={openMenu} />;
      case 'sets': return <window.MSets onOpen={setArt} onMenu={openMenu} />;
      default: return <window.MExplore onOpen={setArt} onMenu={openMenu} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '34px 16px',
      background: 'radial-gradient(900px 600px at 50% -5%, #18142e, #070709 60%)' }}>
      <div style={{ position: 'fixed', top: 22, left: 30, right: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6d5efc' }} />Pixel Studio · Mobile
        </div>
        {/* session toggle — review aid, not part of the product UI */}
        <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, backdropFilter: 'blur(8px)' }}>
          {[['landing', 'Logged out'], ['explore', 'Logged in']].map(([r, label]) => {
            const on = r === 'landing' ? !loggedIn : loggedIn;
            return (
              <button key={r} onClick={() => setRoute(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 13px', border: 'none', cursor: 'pointer', borderRadius: 7, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, background: on ? '#6d5efc' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,.55)', transition: 'all .15s' }}>{label}</button>
            );
          })}
        </div>
      </div>

      <IOSDevice dark={theme === 'dark'}>
        <div data-theme={theme} style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
          {route === 'landing' ? (
            <window.MLanding onEnter={() => nav('explore')} theme={theme} onToggleTheme={toggleTheme} />
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>{screen()}</div>
              <MBottomNav route={route} onNav={nav} />
            </>
          )}
          <MMenuSheet open={menu} onClose={() => setMenu(false)} onNav={nav} theme={theme} onToggleTheme={toggleTheme} isAdmin={isAdmin} onToggleAdmin={toggleAdmin} />
          <window.MNotifsSheet open={notifs} onClose={() => setNotifs(false)} />
          {art && <MImageSheet art={art} onClose={() => setArt(null)} />}
        </div>
      </IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MobileRoot />);
