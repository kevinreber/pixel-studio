/* global React, window, Icon, Button, Badge, Avatar */
const { useState: useStateMd, useEffect: useEffectMd, useRef: useRefMd } = React;

function ActionBtn({ icon, label, count, active, onClick, tone }) {
  const [hover, setHover] = useStateMd(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '9px 4px', borderRadius: 'var(--r-sm)',
        border: '1px solid ' + (active ? 'var(--border-accent)' : 'var(--border)'), cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : hover ? 'var(--surface-2)' : 'transparent',
        color: active ? 'var(--accent-text)' : tone === 'danger' ? 'var(--danger)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, transition: 'all .14s' }}>
      <Icon name={icon} size={18} stroke={2} />
      {count != null ? <span className="mono">{count}</span> : label}
    </button>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, color: 'var(--fg-subtle)' }}>
        <Icon name={icon} size={14} stroke={2} />
        <span className="u-label" style={{ color: 'var(--fg-subtle)' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function ImageModal({ art, onClose }) {
  const [tab, setTab] = useStateMd('Info');
  const [liked, setLiked] = useStateMd(false);
  const [menu, setMenu] = useStateMd(false);
  const [follow, setFollow] = useStateMd(false);
  const { ArtTile } = window.PS_DATA;
  const menuRef = useRefMd(null);

  useEffectMd(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);
  useEffectMd(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!art) return null;

  return (
    <div className="anim-fade" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(10px)', padding: 28 }}>
      <div className="anim-pop" onClick={(e) => e.stopPropagation()} style={{
        display: 'flex', maxWidth: 1180, width: '100%', maxHeight: '100%', borderRadius: 'var(--r-xl)', overflow: 'hidden',
        background: 'var(--surface-1)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)' }}>

        {/* image side */}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-inset)', display: 'grid', placeItems: 'center', padding: 26 }}>
          <div style={{ position: 'relative', maxHeight: '100%', aspectRatio: art.aspect, width: 'auto', maxWidth: '100%', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ height: '72vh', aspectRatio: art.aspect }}><ArtTile art={art} radius="0" /></div>
          </div>
        </div>

        {/* info panel */}
        <div style={{ width: 408, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 16px', borderBottom: '1px solid var(--border)' }}>
            <Avatar name={art.author} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{art.author}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>@{art.author}</div>
            </div>
            <Button variant={follow ? 'outline' : 'soft'} size="sm" icon={follow ? 'following' : 'follow'} onClick={() => setFollow(!follow)}>{follow ? 'Following' : 'Follow'}</Button>
            <div ref={menuRef} style={{ position: 'relative' }}>
              <Button variant="ghost" size="iconSm" onClick={() => setMenu(!menu)}><Icon name="more" size={18} stroke={2} /></Button>
              {menu && (
                <div className="anim-pop" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60, minWidth: 180,
                  background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-pop)', padding: 5 }}>
                  {[{ i: 'external', l: 'Open original' }, { i: 'copy', l: 'Copy link' }, { i: 'alert', l: 'Report' }].map((m) => (
                    <button key={m.l} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', background: 'none', border: 'none', borderRadius: 'var(--r-xs)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, textAlign: 'left' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <Icon name={m.i} size={15} stroke={2} style={{ color: 'var(--fg-subtle)' }} />{m.l}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '5px 0' }} />
                  <button style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', background: 'none', border: 'none', borderRadius: 'var(--r-xs)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, textAlign: 'left' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-soft)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <Icon name="shield" size={15} stroke={2} />Admin delete
                  </button>
                </div>
              )}
            </div>
            <Button variant="ghost" size="iconSm" onClick={onClose}><Icon name="x" size={18} stroke={2.2} /></Button>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid var(--border)', gap: 4 }}>
            {['Info', 'Comments'].map((t) => {
              const on = tab === t;
              return (
                <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', padding: '11px 12px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? 'var(--fg)' : 'var(--fg-subtle)' }}>
                  {t === 'Comments' ? `Comments · ${art.comments}` : t}
                  {on && <span style={{ position: 'absolute', left: 6, right: 6, bottom: -1, height: 2, borderRadius: 2, background: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>

          {/* body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
            {tab === 'Info' ? (
              <div>
                <InfoRow icon="document" label="Prompt">
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg)' }}>{art.prompt}</p>
                  <Button variant="ghost" size="sm" icon="copy" style={{ marginTop: 9, marginLeft: -8 }}>Copy prompt</Button>
                </InfoRow>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <InfoRow icon="cpu" label="Model"><Badge tone="accent">{art.model}</Badge></InfoRow>
                  <InfoRow icon="palette" label="Style"><span style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>None</span></InfoRow>
                  <InfoRow icon="ratio" label="Size"><span className="mono" style={{ fontSize: 13, color: 'var(--fg-muted)' }}>1024 × 1024</span></InfoRow>
                  <InfoRow icon="layers" label="Set"><a style={{ fontSize: 13.5, color: 'var(--accent-text)', cursor: 'pointer' }}>View set →</a></InfoRow>
                  <InfoRow icon="clock" label="Created"><span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>May 21, 2026</span></InfoRow>
                  <InfoRow icon="coins" label="Cost"><span className="mono" style={{ fontSize: 13, color: 'var(--fg-muted)' }}>4 credits</span></InfoRow>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--fg-subtle)', minHeight: 160 }}>
                <div>
                  <Icon name="comment" size={28} stroke={1.6} style={{ color: 'var(--fg-faint)', marginBottom: 10 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No comments yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5 }}>Be the first to say something.</p>
                </div>
              </div>
            )}
          </div>

          {/* action bar */}
          <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionBtn icon="heart" count={art.likes + (liked ? 1 : 0)} active={liked} onClick={() => setLiked(!liked)} />
              <ActionBtn icon="shuffle" label="Remix" />
              <ActionBtn icon="download" label="Download" />
              <ActionBtn icon="bookmark" label="Save" />
              <ActionBtn icon="share" label="Share" />
            </div>
            {tab === 'Comments' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Add a comment…" style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 13.5, outline: 'none' }} />
                <Button variant="primary" size="icon"><Icon name="send" size={16} stroke={2} /></Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ImageModal = ImageModal;
