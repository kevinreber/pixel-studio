/* global React, window, Icon, Button, Badge, PageHeader, Segmented, Avatar */
const { useState: useStateFd } = React;

function FeedAction({ icon, count, active, onClick, label }) {
  const [hover, setHover] = useStateFd(false);
  return (
    <button onClick={onClick} title={label} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
        background: hover ? 'var(--surface-3)' : 'transparent', color: active ? 'var(--accent-text)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, transition: 'all .14s' }}>
      <Icon name={icon} size={16} stroke={2} />
      {count != null && <span className="mono">{count}</span>}
    </button>
  );
}

function FeedCard({ item, index, onOpen }) {
  const { ArtTile } = window.PS_DATA;
  const [liked, setLiked] = useStateFd(false);
  const a = item.art;
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${Math.min(index * 45, 400)}ms`,
      background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        <Avatar name={item.author} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.author}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{['2h', '5h', '8h', '1d', '2d'][index % 5]} ago · {a.model}</div>
        </div>
        <Button variant="ghost" size="iconSm" title="More"><Icon name="more" size={17} stroke={2} /></Button>
      </div>
      {/* image */}
      <div onClick={() => onOpen(a)} style={{ position: 'relative', width: '100%', aspectRatio: a.aspect === '1/1' ? '1/1' : '4/5', cursor: 'pointer' }}>
        <ArtTile art={a} radius="0" />
      </div>
      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 8px 4px' }}>
        <FeedAction icon="heart" count={a.likes + (liked ? 1 : 0)} active={liked} onClick={() => setLiked(!liked)} label="Like" />
        <FeedAction icon="comment" count={a.comments} onClick={() => onOpen(a)} label="Comment" />
        <FeedAction icon="shuffle" label="Remix" />
        <div style={{ marginLeft: 'auto' }}><FeedAction icon="bookmark" label="Save" /></div>
      </div>
      {/* caption */}
      <p style={{ margin: 0, padding: '2px 14px 14px', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-muted)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{item.author}</span> {a.prompt}
      </p>
    </div>
  );
}

function FeedPage({ onOpen }) {
  const { FEED } = window.PS_DATA;
  const [tab, setTab] = useStateFd('Following');
  return (
    <div>
      <PageHeader icon="feed" title="Your feed" subtitle="Fresh work from the people you follow"
        actions={<Segmented options={['Following', 'For you']} value={tab} onChange={setTab} />} />
      <div style={{ columns: '3 320px', columnGap: 18 }}>
        {FEED.map((item, i) => (
          <div key={i} style={{ breakInside: 'avoid', marginBottom: 18 }}>
            <FeedCard item={item} index={i} onOpen={onOpen} />
          </div>
        ))}
      </div>
      {/* caught-up footer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '40px 0 8px', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--success-soft)', color: 'var(--success)', marginBottom: 4 }}>
          <Icon name="check" size={22} stroke={2.4} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>You're all caught up</div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>You've seen every new post from people you follow.</div>
        <Button variant="outline" size="sm" icon="explore" onClick={() => setTab('For you')} style={{ marginTop: 8 }}>Discover more creators</Button>
      </div>
    </div>
  );
}

function PlaceholderPage({ icon, title, subtitle, note }) {
  return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} />
      <div style={{ display: 'grid', placeItems: 'center', padding: '70px 20px', textAlign: 'center',
        background: 'var(--surface-1)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px solid var(--border-accent)', marginBottom: 16 }}>
          <Icon name={icon} size={26} stroke={1.8} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, maxWidth: 380, fontSize: 14, lineHeight: 1.55, color: 'var(--fg-muted)' }}>{note}</p>
      </div>
    </div>
  );
}

window.FeedPage = FeedPage;
window.PlaceholderPage = PlaceholderPage;
