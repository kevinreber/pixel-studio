/* global React, ReactDOM, window */
const { useState: useStateApp } = React;

const PLACEHOLDERS = {
  users: { icon: 'users', title: 'Users', subtitle: 'Find and follow other creators', note: 'The user directory keeps its list layout — now on the shared elevation + accent system, with the search field promoted into the page header.' },
  video: { icon: 'video', title: 'Create video', subtitle: 'Generate video from text or an image', note: 'Same prompt-first layout as Create images, with the single model-gallery selection pattern and a live cost estimate.' },
  sets: { icon: 'layers', title: 'Sets', subtitle: 'Your generation batches', note: 'The sets table gains real thumbnail previews, mono timestamps, and the unified row styling used across the app.' },
  liked: { icon: 'heart', title: 'Liked', subtitle: 'Everything you’ve hearted', note: 'A masonry gallery identical to Explore, scoped to your likes.' },
  profile: { icon: 'user', title: 'Profile', subtitle: 'Your public gallery', note: 'Profile header + ALL / Images / Videos tabs over the same masonry grid and hover overlays.' },
  whatsnew: { icon: 'sparkles', title: "What's new", subtitle: 'Product changelog', note: 'A clean editorial changelog with the indigo accent for version tags and dates.' },
};

function App() {
  const [route, setRoute] = useStateApp('landing');
  const [theme, setTheme] = useStateApp('dark');
  const [modalArt, setModalArt] = useStateApp(null);
  const [isAdmin, setIsAdmin] = useStateApp(true);
  const loggedIn = route !== 'landing';

  const nav = (r) => { setRoute(r); window.scrollTo?.(0, 0); };
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleAdmin = () => setIsAdmin((v) => { if (v && route === 'admin') setRoute('explore'); return !v; });

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const screen = () => {
    switch (route) {
      case 'explore': return <window.ExplorePage onOpen={setModalArt} />;
      case 'feed': return <window.FeedPage onOpen={setModalArt} />;
      case 'create': return <window.CreatePage />;
      case 'admin': return isAdmin ? <window.AdminPage /> : <window.ExplorePage onOpen={setModalArt} />;
      case 'profile': return <window.ProfilePage onOpen={setModalArt} />;
      case 'liked': return <window.LikedPage onOpen={setModalArt} />;
      case 'whatsnew': return <window.WhatsNewPage />;
      default: return <window.PlaceholderPage {...PLACEHOLDERS[route]} />;
    }
  };

  return (
    <div data-theme={theme} style={{ height: '100%', background: 'var(--bg)', color: 'var(--fg)' }}>
      {route === 'landing' ? (
        <div style={{ height: '100%', overflowY: 'auto' }}>
          <window.LandingPage onEnter={() => nav('explore')} theme={theme} onToggleTheme={toggleTheme} />
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100%', overflowX: 'hidden' }}>
          <window.NavigationSidebar route={route} onNavigate={nav} theme={theme} onToggleTheme={toggleTheme} onLogo={() => nav('landing')} isAdmin={isAdmin} />
          <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
            <window.DesktopTopBar theme={theme} onToggleTheme={toggleTheme} isAdmin={isAdmin} onToggleAdmin={toggleAdmin} onSignOut={() => nav('landing')} />
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 40px 80px' }}>
              {screen()}
            </div>
          </main>
        </div>
      )}
      {modalArt && <window.ImageModal art={modalArt} onClose={() => setModalArt(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
