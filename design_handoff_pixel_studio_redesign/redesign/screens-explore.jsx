/* global React, window, Icon, Button, Badge, PageHeader, Segmented, Select, Avatar */
const { useState: useStateEx, useMemo: useMemoEx } = React;

function ExploreCard({ art, onOpen, index }) {
  const [hover, setHover] = useStateEx(false);
  const { ArtTile } = window.PS_DATA;
  return (
    <div
      className="anim-fade-up"
      style={{ breakInside: 'avoid', marginBottom: 16, animationDelay: `${Math.min(index * 28, 360)}ms` }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    >
      <div onClick={() => onOpen(art)} style={{
        position: 'relative', width: '100%', aspectRatio: art.aspect, borderRadius: 'var(--r-md)', overflow: 'hidden',
        cursor: 'pointer', border: '1px solid var(--border)',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-3px)' : 'none', transition: 'transform .22s var(--ease), box-shadow .22s',
        outline: hover ? '1px solid var(--border-accent)' : '1px solid transparent', outlineOffset: -1,
      }}>
        <ArtTile art={art} radius="0" />

        {/* type chip top-left */}
        {art.video && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <Badge tone="neutral" icon="video" style={{ background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', backdropFilter: 'blur(6px)' }}>Video</Badge>
          </div>
        )}

        {/* hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 13, background: 'linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.25) 45%, transparent 70%)',
          opacity: hover ? 1 : 0, transition: 'opacity .2s var(--ease)',
        }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,.92)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{art.prompt}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Avatar name={art.author} size={22} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{art.author}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <Icon name="heart" size={14} stroke={2} /> {art.likes}
            </div>
          </div>
        </div>

        {/* quick actions top-right on hover */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, opacity: hover ? 1 : 0, transform: hover ? 'none' : 'translateY(-4px)', transition: 'all .2s var(--ease)' }}>
          {['heart', 'bookmark'].map((ic) => (
            <button key={ic} onClick={(e) => e.stopPropagation()} style={{
              width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-xs)',
              background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(6px)',
            }}>
              <Icon name={ic} size={15} stroke={2} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TagRow({ tags, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
      {['All', ...tags].map((t) => {
        const on = value === t;
        return (
          <button key={t} onClick={() => onChange(t)} style={{
            flexShrink: 0, padding: '6px 13px', borderRadius: 'var(--r-full)', cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.3,
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: on ? 600 : 500,
            background: on ? 'var(--fg)' : 'var(--surface-2)',
            color: on ? 'var(--bg)' : 'var(--fg-muted)',
            border: on ? '1px solid var(--fg)' : '1px solid var(--border)',
            transition: 'all .14s var(--ease)',
          }}>{t}</button>
        );
      })}
    </div>
  );
}

function ExplorePage({ onOpen }) {
  const { ARTWORKS, MODELS_SHORT, TAGS } = window.PS_DATA;
  const [type, setType] = useStateEx('All');
  const [tag, setTag] = useStateEx('All');
  const [model, setModel] = useStateEx('All models');
  const [sort, setSort] = useStateEx('Trending');
  const [query, setQuery] = useStateEx('');

  const filtered = useMemoEx(() => {
    let list = ARTWORKS.slice();
    if (type === 'Images') list = list.filter((a) => !a.video);
    if (type === 'Videos') list = list.filter((a) => a.video);
    if (tag !== 'All') list = list.filter((a) => a.tag === tag);
    if (model !== 'All models') list = list.filter((a) => a.model === model);
    if (query) list = list.filter((a) => a.prompt.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'Most liked') list = list.slice().sort((a, b) => b.likes - a.likes);
    if (sort === 'Newest') list = list.slice().reverse();
    return list;
  }, [type, tag, model, sort, query]);

  return (
    <div>
      <PageHeader
        icon="explore" title="Explore"
        subtitle="1,856 creations from the Pixel Studio community"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={16} stroke={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search creations…" style={{
                height: 38, width: 260, padding: '0 12px 0 36px', borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--fg)',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, outline: 'none',
              }} />
            </div>
          </div>
        }
      />

      {/* filter toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Segmented options={[{ value: 'All', label: 'All' }, { value: 'Images', label: 'Images', icon: 'image' }, { value: 'Videos', label: 'Videos', icon: 'video' }]} value={type} onChange={setType} />
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <Select icon="cpu" value={model} options={['All models', ...MODELS_SHORT]} onChange={setModel} />
          <Select icon="sliders" value={sort} options={['Trending', 'Most liked', 'Newest']} onChange={setSort} />
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--fg-subtle)' }}>
            <span className="mono" style={{ color: 'var(--fg-muted)', fontWeight: 600 }}>{filtered.length}</span> results
          </div>
        </div>
        <TagRow tags={TAGS} value={tag} onChange={setTag} />
      </div>

      {/* masonry grid */}
      {filtered.length === 0 ? (
        <window.EmptyState icon="search" title="No creations found"
          subtitle={query ? `Nothing matches “${query}”. Try a different search or clear your filters.` : 'No creations match these filters. Try widening them.'}
          action={<Button variant="soft" icon="x" onClick={() => { setQuery(''); setTag('All'); setModel('All models'); setType('All'); }}>Clear filters</Button>} />
      ) : (
        <div style={{ columns: '4 240px', columnGap: 16 }}>
          {filtered.map((art, i) => <ExploreCard key={art.id} art={art} onOpen={onOpen} index={i} />)}
        </div>
      )}
    </div>
  );
}

window.ExplorePage = ExplorePage;
