/* global React, window, Icon, Button, Badge, PageHeader */
const { useState: useStateAd } = React;

function Sparkline({ data, color, w = 120, h = 34 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / rng) * (h - 6) - 3]);
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const id = 'sg' + color.replace(/[^a-z]/gi, '');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ s, index }) {
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${index * 40}ms`, padding: 16, borderRadius: 'var(--r-md)',
      background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="u-label" style={{ whiteSpace: 'nowrap' }}>{s.label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 'var(--r-xs)', display: 'grid', placeItems: 'center',
          background: s.warn ? 'var(--warning-soft)' : 'var(--accent-soft)', color: s.warn ? 'var(--warning)' : 'var(--accent-text)' }}>
          <Icon name={s.icon} size={15} stroke={2} />
        </div>
      </div>
      <div className="mono" style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600,
          color: s.up ? 'var(--success)' : 'var(--danger)' }}>
          <Icon name="trending" size={13} stroke={2.2} style={{ transform: s.up ? 'none' : 'scaleY(-1)' }} />{s.delta}
        </span>
        <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{s.sub}</span>
      </div>
    </div>
  );
}

function TodayTile({ t, index }) {
  const colorMap = { success: 'var(--success)', danger: 'var(--danger)', info: 'var(--info)', accent: 'var(--accent)' };
  const c = colorMap[t.tone];
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${(index + 6) * 40}ms`, padding: 16, borderRadius: 'var(--r-md)',
      background: `color-mix(in oklab, ${c} 8%, var(--surface-1))`, border: `1px solid color-mix(in oklab, ${c} 22%, var(--border))` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <span className="u-label" style={{ color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{t.label}</span>
          <div className="mono" style={{ fontSize: 23, fontWeight: 600, marginTop: 8, color: c }}>{t.value}</div>
        </div>
      </div>
      <Sparkline data={t.spark} color={c} w={150} h={32} />
    </div>
  );
}

function QuickCard({ q, index }) {
  const { P } = window.PS_DATA;
  const [hover, setHover] = useStateAd(false);
  const c = P[q.pal].mesh[0].c;
  return (
    <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      position: 'relative', textAlign: 'left', cursor: 'pointer', padding: 18, borderRadius: 'var(--r-md)', display: 'flex', gap: 14, alignItems: 'flex-start',
      background: 'var(--surface-1)', border: `1px solid ${hover ? 'var(--border-strong)' : 'var(--border)'}`,
      boxShadow: hover ? 'var(--shadow-md)' : 'none', transform: hover ? 'translateY(-2px)' : 'none',
      transition: 'all .18s var(--ease)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center',
        background: `color-mix(in oklab, ${c} 18%, transparent)`, color: c }}>
        <Icon name={q.icon} size={19} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)', marginBottom: 5 }}>{q.title}</div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{q.desc}</div>
      </div>
      <Icon name="arrowRight" size={16} stroke={2} style={{ position: 'absolute', top: 19, right: 18, color: hover ? 'var(--fg)' : 'var(--fg-subtle)', transform: hover ? 'translateX(2px)' : 'none', transition: 'all .18s' }} />
    </button>
  );
}

/* ---- shared building blocks for all tabs ---- */
function MetricCard({ label, value, sub, icon, tone, index = 0 }) {
  const toneMap = { success: 'var(--success)', danger: 'var(--danger)', info: 'var(--info)', accent: 'var(--accent-text)', warning: 'var(--warning)' };
  const vc = tone ? toneMap[tone] : 'var(--fg)';
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${index * 35}ms`, padding: 16, borderRadius: 'var(--r-md)',
      background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <span className="u-label" style={{ whiteSpace: 'nowrap' }}>{label}</span>
        {icon && <div style={{ width: 28, height: 28, borderRadius: 'var(--r-xs)', display: 'grid', placeItems: 'center', background: tone ? `color-mix(in oklab, ${vc} 14%, transparent)` : 'var(--accent-soft)', color: tone ? vc : 'var(--accent-text)' }}><Icon name={icon} size={14} stroke={2} /></div>}
      </div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: vc }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 9 }}>{sub}</div>}
    </div>
  );
}

function AdminPanel({ icon, title, subtitle, action, children, style = {} }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          {icon && <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name={icon} size={16} stroke={2} /></div>}
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function TimeRange({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button key={o} onClick={() => onChange(o)} style={{ height: 30, padding: '0 13px', border: 'none', cursor: 'pointer', borderRadius: 'calc(var(--r-sm) - 2px)',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, background: on ? 'var(--surface-3)' : 'transparent', color: on ? 'var(--fg)' : 'var(--fg-subtle)', boxShadow: on ? 'var(--shadow-sm)' : 'none', transition: 'all .15s' }}>{o}</button>
        );
      })}
    </div>
  );
}

// single-series bar chart with x labels
function BarSeries({ data, labels, color = 'var(--accent)', height = 180 }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div key={i} title={`${labels[i]}: ${d}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div className="anim-fade-up" style={{ animationDelay: `${i * 24}ms`, height: `${(d / max) * 100}%`, minHeight: d > 0 ? 4 : 0, borderRadius: '5px 5px 2px 2px',
              background: `linear-gradient(180deg, ${color}, color-mix(in oklab, ${color} 55%, transparent))` }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {labels.map((l, i) => <div key={i} className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: 'var(--fg-faint)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{i % 2 === 0 ? l : ''}</div>)}
      </div>
    </div>
  );
}

// grouped two-series bars
function GroupedBars({ a, b, labels, colorA = 'var(--success)', colorB = 'var(--danger)', height = 180 }) {
  const max = Math.max(...a, ...b, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height, padding: '0 2px' }}>
      {labels.map((l, i) => (
        <div key={i} title={l} style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%' }}>
          <div className="anim-fade-up" style={{ animationDelay: `${i * 22}ms`, flex: 1, height: `${(a[i] / max) * 100}%`, minHeight: a[i] > 0 ? 3 : 0, borderRadius: '3px 3px 1px 1px', background: colorA }} />
          <div className="anim-fade-up" style={{ animationDelay: `${i * 22 + 60}ms`, flex: 1, height: `${(b[i] / max) * 100}%`, minHeight: b[i] > 0 ? 3 : 0, borderRadius: '3px 3px 1px 1px', background: colorB }} />
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ items }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 14 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fg-muted)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: it.color }} />{it.label}
        </div>
      ))}
    </div>
  );
}

function DistBar({ label, count, pct, tone }) {
  const toneMap = { warning: 'var(--warning)', accent: 'var(--accent)', success: 'var(--success)', info: 'var(--info)', neutral: 'var(--fg-subtle)' };
  const c = toneMap[tone] || 'var(--accent)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: tone === 'warning' ? 'var(--warning)' : 'var(--fg)' }}>{label}</span>
        <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}><span className="mono" style={{ color: 'var(--fg)', fontWeight: 600 }}>{count.toLocaleString()}</span> users ({pct}%)</span>
      </div>
      <div style={{ height: 8, borderRadius: 5, background: 'var(--surface-inset)', overflow: 'hidden' }}>
        <div className="anim-fade-up" style={{ width: `${Math.max(pct, 1.5)}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${c}, color-mix(in oklab, ${c} 60%, transparent))` }} />
      </div>
    </div>
  );
}

Object.assign(window, { MetricCard, AdminPanel, TimeRange, BarSeries, GroupedBars, ChartLegend, DistBar });

function OverviewTab() {
  const { ADMIN_STATS, ADMIN_TODAY, ADMIN_QUICK, MODEL_USAGE } = window.PS_DATA;
  return (
    <div>
      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
        {ADMIN_STATS.map((s, i) => <StatCard key={s.label} s={s} index={i} />)}
      </div>

      {/* today tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
        {ADMIN_TODAY.map((t, i) => <TodayTile key={t.label} t={t} index={i} />)}
      </div>

      {/* two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Quick actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {ADMIN_QUICK.map((q, i) => <QuickCard key={q.title} q={q} index={i} />)}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>Model usage</h3>
            <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>last 30 days</span>
          </div>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {MODEL_USAGE.map((m, i) => (
              <div key={m.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{m.gens.toLocaleString()}</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: 'var(--surface-inset)', overflow: 'hidden' }}>
                  <div className="anim-fade" style={{ width: `${m.pct}%`, height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, var(--accent), #b388ff)`, opacity: 1 - i * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  const { ADMIN_TABS } = window.PS_DATA;
  const [tab, setTab] = useStateAd('Overview');
  return (
    <div>
      <PageHeader icon="shield" title="Admin dashboard" subtitle="Manage and monitor platform content"
        actions={<Badge tone="success" icon="activity">Live</Badge>} />

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {ADMIN_TABS.map((t) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', flexShrink: 0, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? 'var(--fg)' : 'var(--fg-subtle)' }}>
              {t}
              {on && <span style={{ position: 'absolute', left: 8, right: 8, bottom: -1, height: 2, borderRadius: 2, background: 'var(--accent)' }} />}
            </button>
          );
        })}
      </div>

      <div key={tab} className="anim-fade-up">
        {tab === 'Overview' ? <OverviewTab /> : <window.AdminTabContent tab={tab} />}
      </div>
    </div>
  );
}

window.AdminPage = AdminPage;
