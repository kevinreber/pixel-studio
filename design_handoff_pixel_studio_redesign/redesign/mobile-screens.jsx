/* global React, window, Icon, Button, Badge, Avatar, Segmented, Select, MTopBar, TopIconBtn, MSheet */
const { useState: useStateMx, useMemo: useMemoMx } = React;
const D = () => window.PS_DATA;

function MScreen({ title, sub, onMenu, right, children, pad = '14px 16px 28px' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      <MTopBar title={title} sub={sub} onMenu={onMenu} right={right} />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: pad }}>{children}</div>
    </div>
  );
}

/* ---------- gallery tile + grid ---------- */
function MTile({ art, onOpen, square }) {
  const { ArtTile } = D();
  return (
    <div style={{ breakInside: 'avoid', marginBottom: 10 }}>
      <div onClick={() => onOpen(art)} style={{ position: 'relative', width: '100%', aspectRatio: square ? '1/1' : art.aspect, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <ArtTile art={art} radius="0" />
        {art.video && <div style={{ position: 'absolute', top: 8, left: 8 }}><Badge icon="video" style={{ background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', padding: '2px 7px', fontSize: 10.5 }}>Video</Badge></div>}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 9px 7px', background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)', display: 'flex', alignItems: 'center', gap: 5, color: '#fff' }}>
          <Icon name="heart" size={13} stroke={2} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>{art.likes}</span>
        </div>
      </div>
    </div>
  );
}
function MGallery({ items, onOpen, square }) {
  return <div style={{ columns: 2, columnGap: 10 }}>{items.map((a) => <MTile key={a.id} art={a} onOpen={onOpen} square={square} />)}</div>;
}

/* horizontal chip row */
function MChips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -16px', padding: '0 16px' }}>
      {options.map((t) => {
        const on = value === t;
        return <button key={t} onClick={() => onChange(t)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: on ? 600 : 500, background: on ? 'var(--fg)' : 'var(--surface-2)', color: on ? 'var(--bg)' : 'var(--fg-muted)', border: `1px solid ${on ? 'var(--fg)' : 'var(--border)'}` }}>{t}</button>;
      })}
    </div>
  );
}

/* ===================== EXPLORE ===================== */
function MExplore({ onOpen, onMenu }) {
  const { ARTWORKS, TAGS } = D();
  const [type, setType] = useStateMx('All');
  const [tag, setTag] = useStateMx('All');
  const [q, setQ] = useStateMx('');
  const items = useMemoMx(() => {
    let l = ARTWORKS.slice();
    if (type === 'Images') l = l.filter((a) => !a.video);
    if (type === 'Videos') l = l.filter((a) => a.video);
    if (tag !== 'All') l = l.filter((a) => a.tag === tag);
    if (q) l = l.filter((a) => a.prompt.toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [type, tag, q]);
  return (
    <MScreen title="Explore" sub="1,856 community creations" onMenu={onMenu}>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Icon name="search" size={16} stroke={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creations…" style={{ width: '100%', height: 42, padding: '0 12px 0 36px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none' }} />
      </div>
      <div style={{ marginBottom: 12 }}><Segmented options={[{ value: 'All', label: 'All' }, { value: 'Images', label: 'Images', icon: 'image' }, { value: 'Videos', label: 'Videos', icon: 'video' }]} value={type} onChange={setType} size="sm" /></div>
      <div style={{ marginBottom: 16 }}><MChips options={['All', ...TAGS]} value={tag} onChange={setTag} /></div>
      <MGallery items={items} onOpen={onOpen} />
    </MScreen>
  );
}

/* ===================== FEED ===================== */
function MFeedCard({ item, onOpen, i }) {
  const { ArtTile } = D();
  const [liked, setLiked] = useStateMx(false);
  const a = item.art;
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px' }}>
        <Avatar name={item.author} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.author}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{['2h', '5h', '1d', '2d'][i % 4]} ago · {a.model}</div>
        </div>
        <Icon name="more" size={18} stroke={2} style={{ color: 'var(--fg-subtle)' }} />
      </div>
      <div onClick={() => onOpen(a)} style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}><ArtTile art={a} radius="0" /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '11px 14px 4px' }}>
        <button onClick={() => setLiked(!liked)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--accent-text)' : 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}><Icon name="heart" size={19} stroke={2} />{a.likes + (liked ? 1 : 0)}</button>
        <button onClick={() => onOpen(a)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}><Icon name="comment" size={18} stroke={2} />{a.comments}</button>
        <Icon name="shuffle" size={18} stroke={2} style={{ color: 'var(--fg-muted)' }} />
        <Icon name="bookmark" size={18} stroke={2} style={{ color: 'var(--fg-muted)', marginLeft: 'auto' }} />
      </div>
      <p style={{ margin: 0, padding: '2px 14px 13px', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}><span style={{ color: 'var(--fg)', fontWeight: 600 }}>{item.author}</span> {a.prompt}</p>
    </div>
  );
}
function MFeed({ onOpen, onMenu }) {
  const { FEED } = D();
  const [tab, setTab] = useStateMx('Following');
  return (
    <MScreen title="Your Feed" onMenu={onMenu}>
      <div style={{ marginBottom: 16 }}><Segmented options={['Following', 'For you']} value={tab} onChange={setTab} size="sm" /></div>
      {FEED.map((it, i) => <MFeedCard key={i} item={it} onOpen={onOpen} i={i} />)}
    </MScreen>
  );
}

/* ===================== CREATE ===================== */
function MGenTile({ done, art, ratio }) {
  const { ArtTile } = D();
  if (done && art) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <ArtTile art={art} radius="0" />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          {['download', 'heart'].map((ic) => (
            <div key={ic} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-xs)', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', backdropFilter: 'blur(6px)' }}><Icon name={ic} size={14} stroke={2} /></div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)', backgroundSize: '220% 100%', animation: 'ps-shimmer 1.4s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Icon name="sparkles" size={20} stroke={1.8} style={{ color: 'var(--fg-faint)' }} /></div>
    </div>
  );
}

function MCreate({ onMenu }) {
  const { CREATE_MODELS, P, ArtTile, ARTWORKS, CREDITS } = D();
  const [mode, setMode] = useStateMx('Image');
  const [model, setModel] = useStateMx('sd35l');
  const [picker, setPicker] = useStateMx(false);
  const [aspect, setAspect] = useStateMx('1:1');
  const [count, setCount] = useStateMx(4);
  const [prompt, setPrompt] = useStateMx('');
  const [status, setStatus] = useStateMx('idle'); // idle | generating | done
  const [results, setResults] = useStateMx([]);
  const [progress, setProgress] = useStateMx(0);
  const [lowBalance, setLowBalance] = useStateMx(false);
  const sel = CREATE_MODELS.find((m) => m.id === model);
  const aspects = [{ value: '1:1', label: '1:1' }, { value: '4:3', label: '4:3' }, { value: '3:4', label: '3:4' }, { value: '16:9', label: '16:9' }];
  const totalCost = sel.credits * (mode === 'Image' ? count : 5);
  const balance = lowBalance ? 6 : (CREDITS || 2480);
  const insufficient = totalCost > balance;
  const ratio = { '1:1': '1/1', '4:3': '4/3', '3:4': '3/4', '16:9': '16/9' }[aspect] || '1/1';
  const n = mode === 'Image' ? count : 1;

  const generate = () => {
    if (insufficient || status === 'generating') return;
    setStatus('generating'); setProgress(8);
    const started = Date.now(), dur = 2200;
    const iv = setInterval(() => setProgress(Math.min(96, ((Date.now() - started) / dur) * 100)), 120);
    setTimeout(() => {
      clearInterval(iv);
      const start = Math.floor(Math.random() * ARTWORKS.length);
      setResults(Array.from({ length: n }, (_, k) => { const b = ARTWORKS[(start + k) % ARTWORKS.length]; return { ...b, id: 'g' + k, prompt: prompt || b.prompt, video: false }; }));
      setProgress(100); setStatus('done');
    }, dur);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      <MTopBar title="Create" onMenu={onMenu} right={
        <button onClick={() => setLowBalance((v) => !v)} title="Preview out-of-credits" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 9px', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: lowBalance ? 'var(--warning-soft)' : 'transparent', color: lowBalance ? 'var(--warning)' : 'var(--fg-subtle)', border: `1px dashed ${lowBalance ? 'var(--warning)' : 'var(--border-strong)'}`, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}>
          <Icon name="eye" size={13} stroke={2} />{lowBalance ? 'Low bal' : 'Low bal?'}
        </button>
      } />

      {status !== 'idle' ? (
        /* ----- results / generating ----- */
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            {status === 'generating'
              ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'ps-spin .7s linear infinite' }} />
              : <Icon name="check" size={17} stroke={2.6} style={{ color: 'var(--success)' }} />}
            <span style={{ fontSize: 15, fontWeight: 700 }}>{status === 'generating' ? 'Generating…' : 'Complete'}</span>
            <Badge tone="neutral" style={{ marginLeft: 'auto' }}>{n} {n > 1 ? 'images' : 'image'}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border)', marginBottom: 14 }}>
            <Icon name="wand" size={14} stroke={2} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prompt || 'A bioluminescent forest at night, volumetric light'}</span>
          </div>
          {status === 'generating' && (
            <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-inset)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), #b388ff)', transition: 'width .3s linear' }} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: n === 1 ? '1fr' : '1fr 1fr', gap: 10 }}>
            {Array.from({ length: n }, (_, i) => <MGenTile key={i} done={status === 'done'} art={results[i]} ratio={ratio} />)}
          </div>
          <Button variant="outline" icon="plus" onClick={() => { setStatus('idle'); setResults([]); setProgress(0); }} style={{ width: '100%', marginTop: 16 }}>New generation</Button>
        </div>
      ) : (
        /* ----- compose ----- */
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 20px' }}>
        <div style={{ marginBottom: 18 }}><Segmented options={[{ value: 'Image', label: 'Image', icon: 'image' }, { value: 'Video', label: 'Video', icon: 'video' }]} value={mode} onChange={setMode} /></div>

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Prompt</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'Image' ? 'A bioluminescent forest at night, volumetric light…' : 'Describe the video you want to create…'} style={{ width: '100%', minHeight: 96, resize: 'vertical', padding: 12, borderRadius: 'var(--r-md)', background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 9 }}><Button variant="soft" size="sm" icon="sparkles">Enhance</Button><Button variant="ghost" size="sm" icon="shuffle">Surprise me</Button></div>

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', margin: '18px 0 8px' }}>Model</label>
        <button onClick={() => setPicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: 11, borderRadius: 'var(--r-md)', background: 'var(--accent-soft-2)', border: '1px solid var(--border-accent)', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0 }}><ArtTile art={{ ...P[sel.pal], img: sel.img }} radius="0" /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{sel.name}</div><div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{sel.provider} · <span className="mono">{sel.credits} cr</span></div></div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: 'var(--fg-subtle)' }} />
        </button>

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', margin: '18px 0 8px' }}>Aspect ratio</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {aspects.map((a) => { const on = aspect === a.value; return <button key={a.value} onClick={() => setAspect(a.value)} style={{ padding: '11px 0', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: on ? 'var(--accent-soft)' : 'var(--surface-2)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, color: on ? 'var(--accent-text)' : 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>{a.label}</button>; })}
        </div>

        {mode === 'Image' && (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', margin: '18px 0 8px' }}>Number of images</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[1, 2, 4, 8].map((nn) => { const on = count === nn; return <button key={nn} onClick={() => setCount(nn)} className="mono" style={{ padding: '10px 0', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: on ? 'var(--accent-soft)' : 'var(--surface-2)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, color: on ? 'var(--accent-text)' : 'var(--fg-muted)', fontSize: 14, fontWeight: 600 }}>{nn}</button>; })}
            </div>
          </>
        )}
        {mode === 'Video' && (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', margin: '18px 0 8px' }}>Duration</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {['4s', '6s', '8s', '10s'].map((nn, k) => { const on = k === 1; return <button key={nn} className="mono" style={{ padding: '10px 0', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: on ? 'var(--accent-soft)' : 'var(--surface-2)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, color: on ? 'var(--accent-text)' : 'var(--fg-muted)', fontSize: 14, fontWeight: 600 }}>{nn}</button>; })}
            </div>
          </>
        )}
      </div>
      )}

      {/* sticky generate */}
      {status !== 'generating' && status !== 'done' && (
      <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 14, borderTop: '1px solid var(--border)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insufficient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 'var(--r-md)', background: 'var(--danger-soft)', border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)' }}>
            <Icon name="alert" size={15} stroke={2} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>Not enough credits</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Needs <span className="mono">{totalCost}</span>, you have <span className="mono">{balance}</span>.</div></div>
            <Button variant="primary" size="sm" icon="coins">Buy</Button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div><div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>Cost</div><div className="mono" style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: insufficient ? 'var(--danger)' : 'var(--fg)' }}><Icon name="coins" size={14} stroke={2} style={{ color: insufficient ? 'var(--danger)' : 'var(--accent-text)' }} />{totalCost}</div></div>
          <Button variant="primary" icon="sparkles" size="lg" onClick={generate} style={{ flex: 1, opacity: insufficient ? 0.55 : 1, cursor: insufficient ? 'not-allowed' : 'pointer' }}>{insufficient ? 'Insufficient credits' : 'Generate'}</Button>
        </div>
      </div>
      )}

      <MSheet open={picker} onClose={() => setPicker(false)} title="Choose a model">
        <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CREATE_MODELS.map((m) => { const on = m.id === model; return (
            <button key={m.id} onClick={() => { setModel(m.id); setPicker(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', background: on ? 'var(--accent-soft)' : 'var(--surface-2)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0 }}><ArtTile art={{ ...P[m.pal], img: m.img }} radius="0" /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{m.name}</div><div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{m.provider} · <span className="mono">{m.credits} cr</span></div></div>
              {on && <Icon name="check" size={18} stroke={2.6} style={{ color: 'var(--accent-text)' }} />}
            </button>
          ); })}
        </div>
      </MSheet>
    </div>
  );
}

/* ===================== PROFILE ===================== */
function MProfile({ onOpen, onMenu }) {
  const items = window.PROFILE_ITEMS || [];
  const [tab, setTab] = useStateMx('All');
  const shown = tab === 'Images' ? items.filter((a) => !a.video) : tab === 'Videos' ? items.filter((a) => a.video) : items;
  return (
    <MScreen title="Profile" onMenu={onMenu} right={<TopIconBtn icon="share" />} pad="0 0 28px">
      <div style={{ position: 'relative', height: 110, background: 'radial-gradient(60% 130% at 20% 10%, #6d5efc55, transparent 60%), radial-gradient(50% 130% at 85% 20%, #ff6fc955, transparent 60%), linear-gradient(120deg,#1a1530,#0b0b14)' }} />
      <div style={{ padding: '0 16px', marginTop: -56, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ borderRadius: '50%', border: '4px solid var(--bg)' }}><Avatar name="Kevin Reber" size={84} /></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Button variant="outline" size="sm">Edit</Button><Button variant="soft" size="sm" icon="layers">Sets</Button></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Kevin Reber</h2>
          <Badge tone="accent" icon="star" style={{ whiteSpace: 'nowrap' }}>Top Creator</Badge>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-subtle)', marginTop: 2 }}>@reebeezie</div>
        <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-muted)' }}>Crafting cinematic AI worlds — neon cities, quiet gardens, and the space between.</p>
        <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
          {[['595', 'posts'], ['1', 'followers'], ['4', 'following']].map(([v, l]) => <div key={l}><span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{v}</span> <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{l}</span></div>)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, borderBottom: '1px solid var(--border)', margin: '18px 0 16px' }}>
        {['All', 'Images', 'Videos'].map((t) => { const on = tab === t; return <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 600 : 500, color: on ? 'var(--fg)' : 'var(--fg-subtle)' }}><Icon name={t === 'Videos' ? 'video' : t === 'Images' ? 'image' : 'grid'} size={15} stroke={2} />{t}{on && <span style={{ position: 'absolute', left: 8, right: 8, bottom: -1, height: 2, borderRadius: 2, background: 'var(--accent)' }} />}</button>; })}
      </div>
      <div style={{ padding: '0 16px' }}><MGallery items={shown} onOpen={onOpen} square /></div>
    </MScreen>
  );
}

/* ===================== LIKED ===================== */
function MLiked({ onOpen, onMenu }) {
  const items = window.LIKED_ITEMS || [];
  const [type, setType] = useStateMx('All');
  const [showEmpty, setShowEmpty] = useStateMx(false);
  const shown = showEmpty ? [] : (type === 'Images' ? items.filter((a) => !a.video) : type === 'Videos' ? items.filter((a) => a.video) : items);
  return (
    <MScreen title="Liked" sub="Images & videos you've hearted" onMenu={onMenu}
      right={<button onClick={() => setShowEmpty((v) => !v)} title="Preview empty state" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 9px', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: showEmpty ? 'var(--warning-soft)' : 'transparent', color: showEmpty ? 'var(--warning)' : 'var(--fg-subtle)', border: `1px dashed ${showEmpty ? 'var(--warning)' : 'var(--border-strong)'}`, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}><Icon name="eye" size={13} stroke={2} />Empty?</button>}>
      <div style={{ marginBottom: 16 }}><Segmented options={[{ value: 'All', label: 'All' }, { value: 'Images', label: 'Images', icon: 'image' }, { value: 'Videos', label: 'Videos', icon: 'video' }]} value={type} onChange={setType} size="sm" /></div>
      {shown.length === 0 ? (
        <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px solid var(--border-accent)', marginBottom: 16 }}><Icon name="heart" size={25} stroke={1.8} /></div>
          <h3 style={{ margin: '0 0 7px', fontSize: 17, fontWeight: 600 }}>No liked creations yet</h3>
          <p style={{ margin: 0, maxWidth: 280, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-muted)' }}>Tap the heart on any image in Explore or your Feed and it'll show up here.</p>
          <Button variant="primary" icon="explore" style={{ marginTop: 18 }}>Browse Explore</Button>
        </div>
      ) : (
        <MGallery items={shown} onOpen={onOpen} square />
      )}
    </MScreen>
  );
}

/* ===================== WHAT'S NEW ===================== */
function MWhatsNew({ onMenu }) {
  const entries = window.WN_ENTRIES || [];
  const TYPE = window.WN_TYPE || {};
  return (
    <MScreen title="What's New" sub="Latest features & updates" onMenu={onMenu}>
      {entries.map((e, i) => { const t = TYPE[e.type]; return (
        <div key={e.version} style={{ position: 'relative', paddingLeft: 26, paddingBottom: 18 }}>
          {i < entries.length - 1 && <span style={{ position: 'absolute', left: 7, top: 22, bottom: 0, width: 2, background: 'var(--border)' }} />}
          <span style={{ position: 'absolute', left: 1, top: 16, width: 14, height: 14, borderRadius: '50%', background: 'var(--bg)', border: `2px solid ${t.color}`, display: 'grid', placeItems: 'center' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: t.color }} /></span>
          <div style={{ background: 'var(--surface-1)', border: `1px solid ${i === 0 ? 'var(--border-accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', padding: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <Badge tone={t.tone} icon={t.icon} style={{ whiteSpace: 'nowrap' }}>{t.label}</Badge>
              <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{e.date}</span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-faint)' }}>{e.version}</span>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16.5, fontWeight: 700 }}>{e.title}</h3>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-muted)' }}>{e.desc}</p>
            <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {e.bullets.map((b) => <li key={b} style={{ display: 'grid', gridTemplateColumns: '17px 1fr', gap: 9, alignItems: 'start', fontSize: 13.5 }}><span style={{ marginTop: 1, width: 17, height: 17, borderRadius: 'var(--r-xs)', display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${t.color} 16%, transparent)`, color: t.color }}><Icon name="check" size={11} stroke={2.6} /></span><span style={{ color: 'var(--fg-muted)', lineHeight: 1.45 }}>{b}</span></li>)}
            </ul>
          </div>
        </div>
      ); })}
    </MScreen>
  );
}

/* ===================== USERS ===================== */
function MUsers({ onMenu }) {
  const { USERS } = D();
  return (
    <MScreen title="Users" sub="Find creators to follow" onMenu={onMenu}>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Icon name="search" size={16} stroke={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} />
        <input placeholder="Search by username or name…" style={{ width: '100%', height: 42, padding: '0 12px 0 36px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {USERS.map((u) => <MUserRow key={u.handle} u={u} />)}
      </div>
    </MScreen>
  );
}
function MUserRow({ u }) {
  const [f, setF] = useStateMx(u.following);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
      <Avatar name={u.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.handle}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{u.followers} followers · {u.images} images</div>
      </div>
      <Button variant={f ? 'outline' : 'soft'} size="sm" icon={f ? 'following' : 'follow'} onClick={() => setF(!f)}>{f ? 'Following' : 'Follow'}</Button>
    </div>
  );
}

/* ===================== SETS ===================== */
function MSets({ onOpen, onMenu }) {
  const { mkArt } = D();
  const sets = [
    { model: 'sd3.5-large', prompt: 'A futuristic cyberpunk city street with neon signs', n: 2, date: 'Feb 7', art: mkArt(0) },
    { model: 'dall-e-3', prompt: 'A serene Japanese garden at sunset with cherry blossoms', n: 3, date: 'Jan 18', art: mkArt(1) },
    { model: 'runway-gen4', prompt: 'A serene lake at dawn with mist rising, cinematic camera', n: 1, date: 'Jan 18', art: { ...mkArt(7), video: true } },
    { model: 'flux-pro-1.1', prompt: 'Bioluminescent forest with floating spores, deep emerald', n: 4, date: 'Jan 15', art: mkArt(8) },
  ];
  const { ArtTile } = D();
  return (
    <MScreen title="My Sets" sub="Your generation batches" onMenu={onMenu}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sets.map((s, i) => (
          <div key={i} onClick={() => onOpen(s.art)} style={{ display: 'flex', gap: 12, padding: 11, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}><ArtTile art={s.art} radius="0" />{s.art.video && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Icon name="play" size={16} stroke={2} style={{ color: '#fff' }} /></div>}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Badge tone="neutral" icon="cpu" style={{ marginBottom: 5 }}>{s.model}</Badge>
              <p style={{ margin: '0 0 5px', fontSize: 13, color: 'var(--fg)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{s.prompt}</p>
              <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{s.n} {s.art.video ? 'video' : 'images'} · {s.date}, 2026</div>
            </div>
          </div>
        ))}
      </div>
    </MScreen>
  );
}

/* ===================== IMAGE DETAIL (full sheet) ===================== */
function MImageSheet({ art, onClose }) {
  const { ArtTile } = D();
  const [liked, setLiked] = useStateMx(false);
  const [follow, setFollow] = useStateMx(false);
  if (!art) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'ps-sheet-up .3s var(--ease-out)' }}>
      <div style={{ flexShrink: 0, paddingTop: window.M_TOP_PAD, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
        <button onClick={onClose} style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: 'none', color: 'var(--fg)', cursor: 'pointer' }}><Icon name="chevronLeft" size={20} stroke={2.2} /></button>
        <Avatar name={art.author} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{art.author}</div></div>
        <Button variant={follow ? 'outline' : 'soft'} size="sm" icon={follow ? 'following' : 'follow'} onClick={() => setFollow(!follow)}>{follow ? 'Following' : 'Follow'}</Button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: window.M_BOTTOM_PAD }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: art.aspect }}><ArtTile art={art} radius="0" /></div>
        <div style={{ display: 'flex', gap: 8, padding: 14, borderBottom: '1px solid var(--border)' }}>
          {[['heart', art.likes + (liked ? 1 : 0), liked], ['shuffle', 'Remix'], ['download', 'Save'], ['share', 'Share']].map(([ic, lab, act], k) => (
            <button key={k} onClick={ic === 'heart' ? () => setLiked(!liked) : undefined} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '9px 4px', borderRadius: 'var(--r-sm)', border: `1px solid ${act ? 'var(--border-accent)' : 'var(--border)'}`, background: act ? 'var(--accent-soft)' : 'transparent', color: act ? 'var(--accent-text)' : 'var(--fg-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600 }}><Icon name={ic} size={18} stroke={2} />{typeof lab === 'number' ? <span className="mono">{lab}</span> : lab}</button>
          ))}
        </div>
        <div style={{ padding: 16 }}>
          <div className="u-label" style={{ marginBottom: 7 }}>Prompt</div>
          <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55, color: 'var(--fg)' }}>{art.prompt}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><div className="u-label" style={{ marginBottom: 5 }}>Model</div><Badge tone="accent">{art.model}</Badge></div>
            <div><div className="u-label" style={{ marginBottom: 5 }}>Size</div><span className="mono" style={{ fontSize: 13, color: 'var(--fg-muted)' }}>1024 × 1024</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== LANDING ===================== */
const M_S3 = 'https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/';
const M_HERO = [
  { id: 'mh1', img: M_S3 + 'resized-clov1aotv003pr2ygixlp9pmi', base: ['#831843', '#2a0a1c'], mesh: [{ x: 40, y: 30, c: '#fb7185', s: 70 }] },
  { id: 'mh2', img: M_S3 + 'resized-clov3hb17001gr2qvnx15mvf7', base: ['#7c2d12', '#1a0a08'], mesh: [{ x: 50, y: 70, c: '#fb923c', s: 75 }] },
  { id: 'mh3', img: M_S3 + 'resized-cllfyj6la0001r2otvu0ms49w', base: ['#713f12', '#1c1206'], mesh: [{ x: 50, y: 40, c: '#fcd34d', s: 70 }] },
  { id: 'mh4', img: M_S3 + 'resized-clkp3riui0001r2wj7q3t8tav', base: ['#1e1b4b', '#0a0918'], mesh: [{ x: 35, y: 35, c: '#818cf8', s: 70 }] },
  { id: 'mh5', img: M_S3 + 'resized-clov0tnth001hr2ygj2wec2wn', base: ['#3b0764', '#15032a'], mesh: [{ x: 50, y: 70, c: '#e879f9', s: 75 }] },
];

function MMarqueeCol({ arts, dir, dur }) {
  const { ArtTile } = D();
  const loop = [...arts, ...arts];
  return (
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: `ps-marquee-${dir} ${dur}s linear infinite` }}>
        {loop.map((a, i) => (
          <div key={i} style={{ aspectRatio: '3/4', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-strong)', flexShrink: 0 }}>
            <ArtTile art={a} radius="0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MTypePrompt() {
  const prompts = window.LANDING_PROMPTS || ['A neon cyberpunk city in the rain', 'A serene Japanese garden at sunset', 'An astronaut on a glowing alien shore'];
  const [txt, setTxt] = useStateMx('');
  const [pi, setPi] = useStateMx(0);
  React.useEffect(() => {
    let ci = 0, del = false, timer;
    const full = prompts[pi];
    const tick = () => {
      if (!del) {
        ci++;
        setTxt(full.slice(0, ci));
        if (ci >= full.length) { timer = setTimeout(() => { del = true; tick(); }, 1500); return; }
        timer = setTimeout(tick, 42);
      } else {
        ci -= 2;
        setTxt(full.slice(0, Math.max(ci, 0)));
        if (ci <= 0) { setPi((p) => (p + 1) % prompts.length); return; }
        timer = setTimeout(tick, 22);
      }
    };
    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, [pi]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)' }}>
      <Icon name="wand" size={17} stroke={2} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13.5, color: 'var(--fg)', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>{txt}<span style={{ animation: 'ps-caret 1s steps(1) infinite', color: 'var(--accent-text)', fontWeight: 700 }}>|</span></span>
    </div>
  );
}

function MReveal({ children, delay = 0 }) {
  // transform-only entrance — opacity stays 1, so content can never get stuck invisible
  return <div className="anim-fade-up" style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

function MStatChip({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 21, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function MLanding({ onEnter, theme, onToggleTheme }) {
  const { ARTWORKS, ArtTile, CREATE_MODELS } = D();
  const features = [
    { icon: 'cpu', c: '#6d5efc', title: '12 leading models', desc: 'Stable Diffusion, Flux, DALL·E, Ideogram and more — switch any time.' },
    { icon: 'video', c: '#2dd4bf', title: 'Images & video', desc: 'Generate stills or bring them to life with text-to-video.' },
    { icon: 'shuffle', c: '#f472b6', title: 'Remix anything', desc: 'Start from any community creation and make it your own.' },
    { icon: 'layers', c: '#f6b03c', title: 'Organize in sets', desc: 'Every batch saved, searchable, and easy to revisit.' },
  ];
  const providers = ['Stability AI', 'Black Forest Labs', 'OpenAI', 'Ideogram', 'Runway', 'Luma AI'];
  return (
    <div data-mscroll style={{ position: 'relative', height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      {/* top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${window.M_TOP_PAD - 8}px 20px 12px`, background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>
        <window.Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onToggleTheme} style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--fg-muted)', cursor: 'pointer' }}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} stroke={2} /></button>
          <Button variant="primary" size="sm" onClick={onEnter}>Sign in</Button>
        </div>
      </div>

      {/* HERO with marquee backdrop */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 20 }}>
        {/* marquee columns */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 10, padding: '0 14px', opacity: theme === 'dark' ? 0.34 : 0.5, maskImage: 'linear-gradient(to bottom, transparent, #000 8%, #000 55%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 8%, #000 55%, transparent 92%)' }}>
          <MMarqueeCol arts={[M_HERO[0], M_HERO[2], M_HERO[4]]} dir="up" dur={34} />
          <MMarqueeCol arts={[M_HERO[1], M_HERO[3], M_HERO[0]]} dir="down" dur={42} />
          <MMarqueeCol arts={[M_HERO[4], M_HERO[1], M_HERO[2]]} dir="up" dur={38} />
        </div>
        {/* hero content */}
        <div style={{ position: 'relative', padding: '20px 22px 30px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex' }}><Badge tone="accent" icon="sparkles" style={{ whiteSpace: 'nowrap', background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)' }}>1.9M creations and counting</Badge></div>
          <h1 style={{ margin: '18px 0 0', fontSize: 40, fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.035em' }}>Create stunning <span style={{ background: 'linear-gradient(100deg,var(--accent),#c4a3ff 55%,#ff9ad1)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>art &amp; video</span> from a sentence.</h1>
          <p style={{ margin: '16px auto 0', maxWidth: 320, fontSize: 15, lineHeight: 1.55, color: 'var(--fg-muted)' }}>Turn your ideas into images and video in seconds. No design experience required.</p>
          <div style={{ marginTop: 22 }}><MTypePrompt /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <Button variant="primary" size="lg" iconRight="arrowRight" onClick={onEnter} style={{ width: '100%' }}>Start creating — it's free</Button>
            <Button variant="outline" size="lg" onClick={onEnter} style={{ width: '100%' }}>Explore the gallery</Button>
          </div>
          {/* social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 22 }}>
            <div style={{ display: 'flex' }}>
              {['novarte', 'pogiboyz', 'studioK', 'paelma'].map((n, i) => <div key={n} style={{ marginLeft: i ? -9 : 0, borderRadius: '50%', border: '2px solid var(--bg)' }}><Avatar name={n} size={28} /></div>)}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', textAlign: 'left' }}><strong style={{ color: 'var(--fg)' }}>12,000+</strong> creators<br />this week</div>
          </div>
        </div>
      </div>

      {/* stats bar */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '18px 16px', margin: '0 16px', borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <MStatChip value="1.9M" label="creations" />
        <span style={{ width: 1, height: 30, background: 'var(--border)' }} />
        <MStatChip value="12" label="AI models" />
        <span style={{ width: 1, height: 30, background: 'var(--border)' }} />
        <MStatChip value="4.9★" label="rating" />
      </div>

      {/* features */}
      <div style={{ padding: '40px 20px 8px' }}>
        <MReveal>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div className="u-label" style={{ color: 'var(--accent-text)' }}>Why Pixel Studio</div>
            <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Everything you need to create</h2>
          </div>
        </MReveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map((f, i) => (
            <MReveal key={f.title} delay={i * 70}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${f.c} 18%, transparent)`, color: f.c }}><Icon name={f.icon} size={20} stroke={2} /></div>
                <div><div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4 }}>{f.title}</div><div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-muted)' }}>{f.desc}</div></div>
              </div>
            </MReveal>
          ))}
        </div>
      </div>

      {/* providers */}
      <div style={{ padding: '34px 20px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 12.5, color: 'var(--fg-subtle)', marginBottom: 16 }}>Powered by the world's best models</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {providers.map((p) => (
            <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 'var(--r-full)', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-muted)' }}><Icon name="cpu" size={13} stroke={2} style={{ color: 'var(--fg-subtle)' }} />{p}</span>
          ))}
        </div>
      </div>

      {/* community gallery */}
      <div style={{ padding: '40px 0 8px' }}>
        <MReveal>
          <div style={{ textAlign: 'center', padding: '0 20px', marginBottom: 20 }}>
            <div className="u-label" style={{ color: 'var(--accent-text)' }}>From the community</div>
            <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Made with Pixel Studio</h2>
          </div>
        </MReveal>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 6px', scrollbarWidth: 'none' }}>
          {[2, 7, 11, 0, 9, 13].map((i) => (
            <div key={i} onClick={onEnter} style={{ flexShrink: 0, width: 150, aspectRatio: '3/4', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border-strong)', cursor: 'pointer', position: 'relative' }}>
              <ArtTile art={ARTWORKS[i]} radius="0" />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 10px 9px', background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={ARTWORKS[i].author} size={18} /><span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{ARTWORKS[i].author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* pricing */}
      <div style={{ padding: '40px 20px 0' }}>
        <MReveal>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div className="u-label" style={{ color: 'var(--accent-text)' }}>Pricing</div>
            <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Simple, credit-based pricing</h2>
          </div>
        </MReveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { name: 'Free', price: '$0', unit: 'forever', desc: 'For trying things out.', cta: 'Start free', features: ['50 credits / month', 'Standard models', 'Public gallery'], featured: false },
            { name: 'Pro', price: '$18', unit: '/ mo', desc: 'For regular creators.', cta: 'Go Pro', features: ['2,500 credits / month', 'All 12 models + video', 'Private creations & sets', 'Priority generation'], featured: true },
            { name: 'Studio', price: '$49', unit: '/ mo', desc: 'For teams & power users.', cta: 'Get Studio', features: ['8,000 credits / month', 'Everything in Pro', 'API access', 'Team workspaces'], featured: false },
          ].map((p) => (
            <div key={p.name} style={{ position: 'relative', padding: 20, borderRadius: 'var(--r-xl)',
              background: p.featured ? 'linear-gradient(160deg, var(--accent-soft), var(--surface-1))' : 'var(--surface-1)',
              border: `1px solid ${p.featured ? 'var(--border-accent)' : 'var(--border)'}` }}>
              {p.featured && <div style={{ position: 'absolute', top: 16, right: 16 }}><Badge tone="accent" icon="star" style={{ whiteSpace: 'nowrap' }}>Popular</Badge></div>}
              <div style={{ fontSize: 14.5, fontWeight: 600, color: p.featured ? 'var(--accent-text)' : 'var(--fg)' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '8px 0 3px' }}>
                <span className="mono" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em' }}>{p.price}</span>
                <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>{p.unit}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>{p.desc}</div>
              <Button variant={p.featured ? 'primary' : 'outline'} onClick={onEnter} style={{ width: '100%', marginBottom: 16 }}>{p.cta}</Button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13 }}>
                    <span style={{ marginTop: 1, width: 17, height: 17, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name="check" size={11} stroke={2.6} /></span>
                    <span style={{ color: 'var(--fg-muted)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* final CTA */}
      <div style={{ padding: '40px 20px', marginTop: 12 }}>
        <div style={{ position: 'relative', overflow: 'hidden', padding: '34px 24px', borderRadius: 'var(--r-2xl)', textAlign: 'center', background: 'linear-gradient(150deg, #2a1d5c, #14122b)', border: '1px solid var(--border-accent)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 50% 0%, rgba(124,112,255,.5), transparent 65%)' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Your first creation is moments away.</h2>
            <p style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.5, color: 'rgba(255,255,255,.72)' }}>Join 12,000+ creators. No credit card required.</p>
            <Button variant="primary" size="lg" iconRight="arrowRight" onClick={onEnter} style={{ width: '100%', marginTop: 22 }}>Start creating for free</Button>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: `28px 0 ${window.M_BOTTOM_PAD + 10}px`, color: 'var(--fg-faint)', fontSize: 12 }}>© 2026 Pixel Studio AI</div>
      </div>
    </div>
  );
}

Object.assign(window, { MExplore, MFeed, MCreate, MProfile, MLiked, MWhatsNew, MUsers, MSets, MImageSheet, MLanding });
