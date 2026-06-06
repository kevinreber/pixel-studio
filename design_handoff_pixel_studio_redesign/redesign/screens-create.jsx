/* global React, window, Icon, Button, Badge, PageHeader, Segmented, Select */
const { useState: useStateCr } = React;

/* skeleton tile shown while a generation is in flight */
function GenSkeleton({ aspect }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: aspect, borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)', backgroundSize: '220% 100%', animation: 'ps-shimmer 1.4s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Icon name="sparkles" size={22} stroke={1.8} style={{ color: 'var(--fg-faint)' }} />
      </div>
    </div>
  );
}

/* the generation results / in-progress panel */
function GenResults({ status, results, count, aspect, prompt, sel, progress, onNew }) {
  const { ArtTile } = window.PS_DATA;
  const ratio = { '1:1': '1/1', '4:3': '4/3', '3:4': '3/4', '16:9': '16/9' }[aspect] || '1/1';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {status === 'generating'
            ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'ps-spin .7s linear infinite', flexShrink: 0 }} />
            : <Icon name="check" size={18} stroke={2.6} style={{ color: 'var(--success)', flexShrink: 0 }} />}
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>{status === 'generating' ? 'Generating…' : 'Generation complete'}</h3>
          <Badge tone="neutral" style={{ flexShrink: 0 }}>{count} {count > 1 ? 'images' : 'image'}</Badge>
        </div>
        <Button variant="outline" size="sm" icon="plus" onClick={onNew}>New generation</Button>
      </div>

      {/* prompt + model recap */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border)', marginBottom: 16 }}>
        <Icon name="wand" size={15} stroke={2} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: 'var(--fg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prompt || 'A bioluminescent forest at night, floating spores, cinematic'}</span>
        <Badge tone="accent" style={{ flexShrink: 0 }}>{sel.name}</Badge>
      </div>

      {/* progress bar while generating */}
      {status === 'generating' && (
        <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-inset)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), #b388ff)', transition: 'width .3s linear' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: count >= 3 ? 'repeat(auto-fill, minmax(200px, 1fr))' : `repeat(${count}, 1fr)`, gap: 14 }}>
        {status === 'generating'
          ? Array.from({ length: count }, (_, i) => <GenSkeleton key={i} aspect={ratio} />)
          : results.map((a, i) => (
              <div key={i} className="anim-fade-up" style={{ animationDelay: `${i * 50}ms`, position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <ArtTile art={a} radius="0" />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  {['download', 'heart', 'shuffle'].map((ic) => (
                    <div key={ic} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-xs)', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                      <Icon name={ic} size={15} stroke={2} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

const ASPECTS = [
  { value: '1:1', label: '1:1', w: 18, h: 18, px: '1024×1024' },
  { value: '4:3', label: '4:3', w: 20, h: 15, px: '1152×896' },
  { value: '3:4', label: '3:4', w: 15, h: 20, px: '896×1152' },
  { value: '16:9', label: '16:9', w: 22, h: 12, px: '1344×768' },
];

const TAG_TONE = { Flagship: 'accent', Pro: 'accent', Fast: 'info', Value: 'success' };

function ModelCard({ m, selected, onSelect, compare }) {
  const [hover, setHover] = useStateCr(false);
  const { P, ArtTile } = window.PS_DATA;
  return (
    <button onClick={() => onSelect(m.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', textAlign: 'left', cursor: 'pointer', padding: 11,
        borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 10,
        background: selected ? 'var(--accent-soft)' : 'var(--surface-1)',
        border: `1px solid ${selected ? 'var(--accent)' : hover ? 'var(--border-strong)' : 'var(--border)'}`,
        boxShadow: selected ? '0 8px 28px -10px var(--accent-glow)' : hover ? 'var(--shadow-md)' : 'none',
        transition: 'all .18s var(--ease)', fontFamily: 'var(--font-sans)',
      }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
        <ArtTile art={{ ...P[m.pal], img: m.img, prompt: '' }} radius="0" />
        <span className="mono" style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 'var(--r-full)',
          background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(6px)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="coins" size={11} stroke={2.3} />{m.credits}
        </span>
        {(selected || compare) && (
          <div style={{
            position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: compare ? 5 : '50%',
            display: 'grid', placeItems: 'center',
            background: selected ? 'var(--accent)' : 'rgba(0,0,0,.5)',
            border: selected ? 'none' : '1.5px solid rgba(255,255,255,.6)', backdropFilter: 'blur(4px)',
          }}>
            {selected && <Icon name="check" size={14} stroke={3} style={{ color: '#fff' }} />}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.3, marginBottom: 5 }}>{m.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{m.provider}</span>
          {m.tag && <Badge tone={TAG_TONE[m.tag] || 'neutral'} style={{ padding: '1px 7px', fontSize: 10.5 }}>{m.tag}</Badge>}
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--fg-muted)' }}>{m.desc}</p>
      </div>
    </button>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>{children}</span>
      {hint && <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{hint}</span>}
    </div>
  );
}

function CreatePage() {
  const { CREATE_MODELS, ARTWORKS, CREDITS } = window.PS_DATA;
  const [model, setModel] = useStateCr('sd35l');
  const [aspect, setAspect] = useStateCr('1:1');
  const [count, setCount] = useStateCr(4);
  const [style, setStyle] = useStateCr('None');
  const [prompt, setPrompt] = useStateCr('');
  const [compare, setCompare] = useStateCr(false);
  const [provider, setProvider] = useStateCr('All');
  const [advOpen, setAdvOpen] = useStateCr(false);
  const [status, setStatus] = useStateCr('idle'); // idle | generating | done
  const [results, setResults] = useStateCr([]);
  const [progress, setProgress] = useStateCr(0);
  const [lowBalance, setLowBalance] = useStateCr(false);

  const sel = CREATE_MODELS.find((m) => m.id === model);
  const providers = ['All', ...Array.from(new Set(CREATE_MODELS.map((m) => m.provider)))];
  const shown = provider === 'All' ? CREATE_MODELS : CREATE_MODELS.filter((m) => m.provider === provider);
  const totalCost = sel.credits * count;
  const balance = lowBalance ? 6 : CREDITS;
  const insufficient = totalCost > balance;

  const generate = () => {
    if (insufficient || status === 'generating') return;
    setStatus('generating');
    setProgress(8);
    const started = Date.now();
    const dur = 2200;
    const iv = setInterval(() => {
      const p = Math.min(96, ((Date.now() - started) / dur) * 100);
      setProgress(p);
    }, 120);
    setTimeout(() => {
      clearInterval(iv);
      const start = Math.floor(Math.random() * ARTWORKS.length);
      const out = Array.from({ length: count }, (_, k) => {
        const base = ARTWORKS[(start + k) % ARTWORKS.length];
        return { ...base, id: 'gen_' + k, prompt: prompt || base.prompt, video: false, author: 'reebeezie' };
      });
      setResults(out);
      setProgress(100);
      setStatus('done');
    }, dur);
  };

  return (
    <div>
      <PageHeader icon="wand" title="Create images" subtitle="Describe an idea, pick a model, and generate."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setLowBalance((v) => !v)} title="Preview the out-of-credits state"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 11px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                background: lowBalance ? 'var(--warning-soft)' : 'transparent', color: lowBalance ? 'var(--warning)' : 'var(--fg-subtle)',
                border: `1px dashed ${lowBalance ? 'var(--warning)' : 'var(--border-strong)'}`, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }}>
              <Icon name="eye" size={14} stroke={2} />{lowBalance ? 'Low balance: on' : 'Preview low balance'}
            </button>
            <Button variant="outline" icon="compare" active={compare} onClick={() => setCompare(!compare)}>{compare ? 'Comparing' : 'Compare models'}</Button>
          </div>
        } />

      <div style={{ display: 'grid', gridTemplateColumns: '388px 1fr', gap: 24, alignItems: 'start' }}>
        {/* LEFT — compose */}
        <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 18,
          background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 18, boxShadow: 'var(--shadow-md)' }}>

          {/* prompt first */}
          <div>
            <FieldLabel hint={`${prompt.length}/500`}>Prompt</FieldLabel>
            <div style={{ position: 'relative' }}>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={500}
                placeholder="A bioluminescent forest at night, floating spores, cinematic volumetric light…"
                style={{ width: '100%', minHeight: 110, resize: 'vertical', padding: '12px 13px', borderRadius: 'var(--r-md)',
                  background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)',
                  fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
              <Button variant="soft" size="sm" icon="sparkles">Enhance</Button>
              <Button variant="ghost" size="sm" icon="shuffle">Surprise me</Button>
            </div>
          </div>

          {/* selected model summary (NOT a duplicate selector) */}
          <div>
            <FieldLabel>Model</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--accent-soft-2)', border: '1px solid var(--border-accent)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0 }}>
                <window.PS_DATA.ArtTile art={{ ...window.PS_DATA.P[sel.pal], img: sel.img }} radius="0" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sel.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{sel.provider} · <span className="mono">{sel.credits} cr</span></div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 600 }}>Pick →</span>
            </div>
          </div>

          {/* aspect ratio */}
          <div>
            <FieldLabel>Aspect ratio</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {ASPECTS.map((a) => {
                const on = aspect === a.value;
                return (
                  <button key={a.value} onClick={() => setAspect(a.value)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '11px 4px', cursor: 'pointer',
                    borderRadius: 'var(--r-sm)', background: on ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, transition: 'all .15s var(--ease)',
                  }}>
                    <div style={{ width: a.w, height: a.h, borderRadius: 3, border: `1.5px solid ${on ? 'var(--accent-text)' : 'var(--fg-subtle)'}` }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--accent-text)' : 'var(--fg-muted)' }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 7, textAlign: 'center' }}>{ASPECTS.find((a) => a.value === aspect).px}</div>
          </div>

          {/* count + style row */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Images</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 38, borderRadius: 'var(--r-sm)', border: '1px solid var(--border-strong)', background: 'var(--surface-2)', overflow: 'hidden' }}>
                <button onClick={() => setCount(Math.max(1, count - 1))} style={{ width: 38, height: '100%', border: 'none', background: 'transparent', color: 'var(--fg-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="x" size={13} stroke={2.5} style={{ transform: 'rotate(45deg)' }} /></button>
                <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{count}</div>
                <button onClick={() => setCount(Math.min(8, count + 1))} style={{ width: 38, height: '100%', border: 'none', background: 'transparent', color: 'var(--fg-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="plus" size={14} stroke={2.5} /></button>
              </div>
            </div>
            <div style={{ flex: 1.4 }}>
              <FieldLabel>Style</FieldLabel>
              <Select value={style} options={['None', 'Cinematic', 'Anime', 'Photographic', '3D Render', 'Watercolor']} onChange={setStyle} width="100%" />
            </div>
          </div>

          {/* advanced */}
          <div>
            <button onClick={() => setAdvOpen(!advOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
              <Icon name="settings" size={15} stroke={2} />
              <span style={{ whiteSpace: 'nowrap' }}>Advanced options</span>
              <Icon name="chevronDown" size={15} stroke={2.2} style={{ marginLeft: 'auto', transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
            </button>
            {advOpen && (
              <div className="anim-fade" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{ l: 'Negative prompt', v: 'blurry, low quality' }, { l: 'Seed', v: 'Random' }].map((f) => (
                  <div key={f.l}>
                    <FieldLabel>{f.l}</FieldLabel>
                    <input defaultValue={f.v === 'Random' ? '' : f.v} placeholder={f.v} style={{ width: '100%', height: 36, padding: '0 11px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* sticky footer */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insufficient && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--danger-soft)', border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)' }}>
                <Icon name="alert" size={16} stroke={2} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--danger)' }}>Not enough credits</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Needs <span className="mono">{totalCost}</span>, you have <span className="mono">{balance}</span>.</div>
                </div>
                <Button variant="primary" size="sm" icon="coins">Buy credits</Button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Total cost</div>
                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 17, fontWeight: 600, color: insufficient ? 'var(--danger)' : 'var(--fg)' }}>
                  <Icon name="coins" size={15} stroke={2} style={{ color: insufficient ? 'var(--danger)' : 'var(--accent-text)' }} />{totalCost}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-subtle)' }}>{compare ? '· compare' : `· ${sel.credits}×${count}`}</span>
                </div>
              </div>
              <Button variant="primary" icon={status === 'generating' ? null : 'sparkles'} size="lg" onClick={generate}
                style={{ flex: 1, opacity: insufficient || status === 'generating' ? 0.55 : 1, cursor: insufficient || status === 'generating' ? 'not-allowed' : 'pointer' }}>
                {status === 'generating' ? 'Generating…' : insufficient ? 'Insufficient credits' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT — results when generating, else the model gallery (single selection surface) */}
        <div>
          {status !== 'idle' ? (
            <GenResults status={status} results={results} count={count} aspect={aspect} prompt={prompt} sel={sel} progress={progress} onNew={() => { setStatus('idle'); setResults([]); setProgress(0); }} />
          ) : (
          <React.Fragment>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>{compare ? 'Select models' : 'Choose a model'}</h3>
              <Badge tone="neutral">{shown.length}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', minWidth: 0 }}>
              {providers.map((p) => {
                const on = provider === p;
                return (
                  <button key={p} onClick={() => setProvider(p)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 'var(--r-full)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: on ? 600 : 500, background: on ? 'var(--surface-3)' : 'transparent', color: on ? 'var(--fg)' : 'var(--fg-subtle)', border: `1px solid ${on ? 'var(--border-strong)' : 'transparent'}` }}>{p}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {shown.map((m) => <ModelCard key={m.id} m={m} selected={model === m.id} compare={compare} onSelect={setModel} />)}
          </div>
          </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

window.CreatePage = CreatePage;
