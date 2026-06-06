/* global React, window, Icon, Button, Badge, Avatar, PageHeader, Segmented, Select */
const { useState: useStatePf, useMemo: useMemoPf } = React;

/* uniform square gallery tile with hover overlay */
function GalleryTile({ art, onOpen, index }) {
  const [hover, setHover] = useStatePf(false);
  const { ArtTile } = window.PS_DATA;
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${Math.min(index * 26, 360)}ms` }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div onClick={() => onOpen(art)} style={{
        position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--r-md)', overflow: 'hidden', cursor: 'pointer',
        border: '1px solid var(--border)', boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-3px)' : 'none', transition: 'transform .22s var(--ease), box-shadow .22s',
        outline: hover ? '1px solid var(--border-accent)' : '1px solid transparent', outlineOffset: -1 }}>
        <ArtTile art={art} radius="0" />
        {art.video && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <Badge icon="video" style={{ background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', backdropFilter: 'blur(6px)' }}>Video</Badge>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 12,
          background: 'linear-gradient(to top, rgba(0,0,0,.78), transparent 55%)', opacity: hover ? 1 : 0, transition: 'opacity .2s' }}>
          <div style={{ display: 'flex', gap: 16, color: '#fff', fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="heart" size={15} stroke={2} />{art.likes}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="comment" size={15} stroke={2} />{art.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryGrid({ items, onOpen, emptyNode, empty }) {
  if (!items.length) {
    return emptyNode || (
      <window.EmptyState icon="image" title="Nothing here yet" subtitle={empty || 'Nothing here yet.'} />
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))', gap: 14 }}>
      {items.map((art, i) => <GalleryTile key={art.id} art={art} onOpen={onOpen} index={i} />)}
    </div>
  );
}

/* ============================ PROFILE ============================ */
const PROFILE_ITEMS = Array.from({ length: 15 }, (_, i) => ({ ...window.PS_DATA.mkArt(i + 1), aspect: '1/1' }));

function Stat({ value, label, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'var(--font-sans)' }}>
      <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)' }}>{value}</span>
      <span style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginLeft: 6 }}>{label}</span>
    </button>
  );
}

function ProfilePage({ onOpen }) {
  const [tab, setTab] = useStatePf('All');
  const items = useMemoPf(() => {
    if (tab === 'Images') return PROFILE_ITEMS.filter((a) => !a.video);
    if (tab === 'Videos') return PROFILE_ITEMS.filter((a) => a.video);
    return PROFILE_ITEMS;
  }, [tab]);
  const nImg = PROFILE_ITEMS.filter((a) => !a.video).length;
  const nVid = PROFILE_ITEMS.filter((a) => a.video).length;

  return (
    <div>
      {/* banner */}
      <div style={{ position: 'relative', height: 168, borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 120% at 20% 20%, #6d5efc55, transparent 60%), radial-gradient(50% 120% at 80% 30%, #ff6fc955, transparent 60%), linear-gradient(120deg, #1a1530, #0b0b14)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '140px' }} />
      </div>

      {/* header row */}
      <div style={{ display: 'flex', gap: 26, padding: '0 8px', marginTop: -48, position: 'relative', flexWrap: 'wrap' }}>
        <div style={{ borderRadius: '50%', border: '4px solid var(--bg)', flexShrink: 0 }}>
          <Avatar name="Kevin Reber" size={112} />
        </div>
        <div style={{ flex: 1, minWidth: 260, paddingTop: 54 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Kevin Reber</h1>
                <Badge tone="accent" icon="star" style={{ whiteSpace: 'nowrap' }}>Top Creator</Badge>
              </div>
              <div style={{ fontSize: 14, color: 'var(--fg-subtle)', marginTop: 3 }}>@reebeezie</div>
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <Button variant="outline" icon="user">Edit profile</Button>
              <Button variant="ghost" size="icon" title="Share"><Icon name="share" size={17} stroke={2} /></Button>
              <Button variant="soft" icon="layers">View sets</Button>
            </div>
          </div>

          <p style={{ margin: '14px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-muted)', maxWidth: 560 }}>
            Crafting cinematic AI worlds — neon cities, quiet gardens, and the space between.
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-subtle)' }}><Icon name="pin" size={14} stroke={2} />San Francisco</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-text)' }}><Icon name="external" size={14} stroke={2} />reebeezie.art</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--warning)', whiteSpace: 'nowrap' }}><Icon name="zap" size={14} stroke={2} />14-day streak</span>
          </div>

          <div style={{ display: 'flex', gap: 26, marginTop: 18 }}>
            <Stat value="595" label="posts" />
            <Stat value="1" label="followers" />
            <Stat value="4" label="following" />
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, borderBottom: '1px solid var(--border)', margin: '30px 0 24px' }}>
        {[['All', null], ['Images', nImg], ['Videos', nVid]].map(([t, n]) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 600 : 500, color: on ? 'var(--fg)' : 'var(--fg-subtle)' }}>
              <Icon name={t === 'Videos' ? 'video' : t === 'Images' ? 'image' : 'grid'} size={16} stroke={2} />
              {t}{n != null && <span className="mono" style={{ color: 'var(--fg-faint)', fontSize: 12.5 }}>{n}</span>}
              {on && <span style={{ position: 'absolute', left: 10, right: 10, bottom: -1, height: 2, borderRadius: 2, background: 'var(--accent)' }} />}
            </button>
          );
        })}
      </div>

      <GalleryGrid items={items} onOpen={onOpen} empty="No posts in this category." />
    </div>
  );
}

/* ============================ LIKED ============================ */
const LIKED_ITEMS = Array.from({ length: 14 }, (_, i) => ({ ...window.PS_DATA.mkArt(i + 6), id: 'liked_' + i, aspect: '1/1' }));

function LikedPage({ onOpen }) {
  const [type, setType] = useStatePf('All');
  const [sort, setSort] = useStatePf('Recently liked');
  const [showEmpty, setShowEmpty] = useStatePf(false);
  const items = useMemoPf(() => {
    if (showEmpty) return [];
    let list = LIKED_ITEMS.slice();
    if (type === 'Images') list = list.filter((a) => !a.video);
    if (type === 'Videos') list = list.filter((a) => a.video);
    if (sort === 'Most liked') list = list.slice().sort((a, b) => b.likes - a.likes);
    return list;
  }, [type, sort, showEmpty]);

  return (
    <div>
      <PageHeader icon="heart" title="Liked" subtitle="Images and videos you've hearted"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowEmpty((v) => !v)} title="Preview the empty state"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 11px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                background: showEmpty ? 'var(--warning-soft)' : 'transparent', color: showEmpty ? 'var(--warning)' : 'var(--fg-subtle)',
                border: `1px dashed ${showEmpty ? 'var(--warning)' : 'var(--border-strong)'}`, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }}>
              <Icon name="eye" size={14} stroke={2} />Preview empty
            </button>
            <Segmented options={[{ value: 'All', label: 'All' }, { value: 'Images', label: 'Images', icon: 'image' }, { value: 'Videos', label: 'Videos', icon: 'video' }]} value={type} onChange={setType} />
            <Select icon="sliders" value={sort} options={['Recently liked', 'Most liked']} onChange={setSort} />
          </div>
        } />
      <GalleryGrid items={items} onOpen={onOpen}
        emptyNode={<window.EmptyState icon="heart" title="No liked creations yet"
          subtitle="Tap the heart on any image in Explore or your Feed and it'll show up here for easy access."
          action={<Button variant="primary" icon="explore" onClick={() => onOpen && null}>Browse Explore</Button>} />} />
    </div>
  );
}

Object.assign(window, { ProfilePage, LikedPage, PROFILE_ITEMS, LIKED_ITEMS });
