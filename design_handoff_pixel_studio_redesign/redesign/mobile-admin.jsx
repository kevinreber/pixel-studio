/* global React, window, Icon, Button, Badge, Avatar, MetricCard, AdminPanel, BarSeries, GroupedBars, ChartLegend, DistBar, MTopBar */
const { useState: useStateMa } = React;
const DAYS = () => window.DAYS14 || [];

function MetricGrid({ items }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{items.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}</div>;
}

function MAdminOverview() {
  const { ADMIN_STATS, ADMIN_QUICK, P } = window.PS_DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <MetricGrid items={ADMIN_STATS.map((s) => ({ label: s.label, value: s.value, sub: s.sub, icon: s.icon, tone: s.warn ? 'warning' : undefined }))} />
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Quick actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ADMIN_QUICK.map((q) => { const c = P[q.pal].mesh[0].c; return (
            <div key={q.title} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${c} 18%, transparent)`, color: c }}><Icon name={q.icon} size={18} stroke={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 600 }}>{q.title}</div><div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{q.desc}</div></div>
              <Icon name="chevronRight" size={16} stroke={2} style={{ color: 'var(--fg-faint)' }} />
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

function MAdminUsers() {
  const dist = [
    { label: '0 credits', count: 240, pct: 13.0, tone: 'warning' },
    { label: '1–10 credits', count: 1595, pct: 86.6, tone: 'accent' },
    { label: '11–50 credits', count: 2, pct: 0.1, tone: 'info' },
    { label: '200+ credits', count: 1, pct: 0.1, tone: 'neutral' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <MetricGrid items={[
        { label: 'Active Today', value: '214', sub: 'Generated content', icon: 'activity', tone: 'success' },
        { label: 'This Week', value: '642', sub: 'Last 7 days', icon: 'trending', tone: 'accent' },
        { label: 'This Month', value: '1,203', sub: 'Last 30 days', icon: 'users' },
        { label: 'Inactive', value: '1,828', sub: '30d no activity', icon: 'alert', tone: 'warning' },
      ]} />
      <AdminPanel icon="follow" title="Signup Trends" subtitle="New users · 14 days">
        <BarSeries data={[2, 1, 3, 0, 2, 4, 1, 2, 3, 1, 0, 2, 3, 2]} labels={DAYS()} color="var(--accent)" height={140} />
      </AdminPanel>
      <AdminPanel icon="coins" title="Credit Distribution">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{dist.map((d) => <DistBar key={d.label} {...d} />)}</div>
      </AdminPanel>
    </div>
  );
}

function MAdminCredits() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <MetricGrid items={[
        { label: 'Purchased', value: '+1,240', sub: 'Today +120', icon: 'trending', tone: 'success' },
        { label: 'Spent', value: '−980', sub: 'Today −60', icon: 'coins', tone: 'danger' },
        { label: 'Net Flow', value: '+260', sub: '99 txns', icon: 'wallet', tone: 'accent' },
        { label: 'Success Rate', value: '93%', sub: 'Target 95%+', icon: 'activity', tone: 'warning' },
      ]} />
      <AdminPanel icon="coins" title="Credit Flow" subtitle="Purchased vs spent">
        <GroupedBars a={[120, 0, 240, 80, 0, 360, 120, 0, 200, 0, 80, 240, 160, 120]} b={[60, 90, 120, 40, 110, 80, 130, 70, 90, 50, 100, 60, 140, 80]} labels={DAYS()} height={140} />
        <ChartLegend items={[{ label: 'Purchased', color: 'var(--success)' }, { label: 'Spent', color: 'var(--danger)' }]} />
      </AdminPanel>
    </div>
  );
}

function MAdminModels() {
  const ranks = [
    { rank: 1, name: 'SD 3.5 Large', dot: '#8275ff', users: 8, count: 10, success: 77 },
    { rank: 2, name: 'Kandinsky 2.2', dot: '#2fcf8e', users: 2, count: 2, success: 100 },
    { rank: 3, name: 'Stable Image Core', dot: '#f6b03c', users: 1, count: 1, success: 100 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <MetricGrid items={[
        { label: 'Generations', value: '1,342', sub: 'This month', icon: 'zap' },
        { label: 'Active Models', value: '8', sub: 'In use', icon: 'cpu', tone: 'accent' },
        { label: 'Unique Users', value: '214', sub: 'Using models', icon: 'users' },
        { label: 'Avg Success', value: '94%', sub: 'All models', icon: 'activity', tone: 'success' },
      ]} />
      <AdminPanel icon="star" title="Model Rankings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ranks.map((r) => { const m = { 1: '#f6b03c', 2: '#a7adba', 3: '#cd7f4d' }[r.rank]; return (
            <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: m, width: 26 }}>#{r.rank}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div><div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{r.users} users</div></div>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{r.count}</span>
              <Badge tone={r.success >= 95 ? 'success' : 'warning'} mono>{r.success}%</Badge>
            </div>
          ); })}
        </div>
      </AdminPanel>
    </div>
  );
}

function MAdminEngagement() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <MetricGrid items={[
        { label: 'Total Follows', value: '1,204', sub: '3.9 / user', icon: 'follow', tone: 'info' },
        { label: 'Total Likes', value: '8,653', sub: '4.5 / image', icon: 'heart', tone: 'danger' },
        { label: 'Comments', value: '1,236', sub: '0.6 / image', icon: 'comment', tone: 'accent' },
        { label: 'With Followers', value: '312', sub: '1,529 without', icon: 'users' },
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 'var(--r-lg)', background: 'linear-gradient(100deg, color-mix(in oklab, var(--warning) 16%, var(--surface-1)), var(--surface-1))', border: '1px solid color-mix(in oklab, var(--warning) 28%, var(--border))' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'color-mix(in oklab, var(--warning) 22%, transparent)', color: 'var(--warning)' }}><Icon name="star" size={20} stroke={2} /></div>
        <div style={{ flex: 1 }}><div className="u-label" style={{ color: 'var(--warning)' }}>Most Followed</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>@novarte</div></div>
        <div style={{ textAlign: 'right' }}><div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>540</div><div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>followers</div></div>
      </div>
      <AdminPanel icon="trending" title="Follow Activity" subtitle="14 days">
        <BarSeries data={[1, 0, 2, 1, 0, 1, 3, 0, 1, 2, 0, 1, 1, 0]} labels={DAYS()} color="var(--info)" height={130} />
      </AdminPanel>
    </div>
  );
}

function MAdminTokens() {
  const adj = [
    { user: 'pogiboyz', amount: +500, reason: 'Failed batch refund' },
    { user: 'maplar1994', amount: -120, reason: 'Reversed purchase' },
    { user: 'novarte', amount: +1000, reason: 'Partnership grant' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AdminPanel icon="search" title="Search Users" subtitle="Adjust a credit balance">
        <div style={{ position: 'relative' }}><Icon name="search" size={16} stroke={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} /><input placeholder="Username or email…" style={{ width: '100%', height: 44, padding: '0 12px 0 36px', borderRadius: 'var(--r-md)', background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none' }} /></div>
      </AdminPanel>
      <AdminPanel icon="clock" title="Recent Adjustments">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {adj.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <Avatar name={a.user} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>@{a.user}</div><div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{a.reason}</div></div>
              <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: a.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>{a.amount > 0 ? '+' : ''}{a.amount}</span>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

function MAdminServices() {
  const services = [
    { name: 'Stable Diffusion 3.5', provider: 'Stability AI', status: 'operational', latency: '1.2s' },
    { name: 'Flux Pro 1.1', provider: 'Black Forest Labs', status: 'operational', latency: '2.4s' },
    { name: 'DALL·E 3', provider: 'OpenAI', status: 'degraded', latency: '4.8s' },
    { name: 'Runway Gen-3', provider: 'Runway', status: 'operational', latency: '8.1s' },
    { name: 'QStash Queue', provider: 'Upstash', status: 'operational', latency: '84ms' },
    { name: 'Ideogram v2', provider: 'Ideogram', status: 'down', latency: '—' },
  ];
  const map = { operational: 'var(--success)', degraded: 'var(--warning)', down: 'var(--danger)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {services.map((s) => { const c = map[s.status]; return (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: 'var(--surface-3)', color: 'var(--fg-muted)' }}><Icon name="external" size={16} stroke={2} /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{s.provider} · <span className="mono">{s.latency}</span></div></div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: c, textTransform: 'capitalize', flexShrink: 0 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{s.status}</span>
        </div>
      ); })}
    </div>
  );
}

function MAdminDeletion() {
  const logs = [
    { prompt: 'An astronaut riding a horse on Mars', model: 'sd3.5-large-turbo', by: 'reebeezie', reason: 'No reason provided' },
    { prompt: 'A futuristic cyberpunk city street with neon', model: 'dall-e-2', by: 'reebeezie', reason: 'Policy violation' },
    { prompt: 'Portrait study, soft window light, 85mm', model: 'flux-pro-1.1', by: 'kevinreber01', reason: 'User requested' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {logs.map((l, i) => (
        <div key={i} style={{ padding: 14, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 8 }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{l.prompt}</span>
            <Badge tone="neutral" style={{ flexShrink: 0 }}>{l.model}</Badge>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-subtle)' }}>
            <span>Deleted by <span style={{ color: 'var(--fg-muted)', fontWeight: 600 }}>{l.by}</span></span>
            <span style={{ fontStyle: l.reason.startsWith('No reason') ? 'italic' : 'normal' }}>{l.reason}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const M_ADMIN_TABS = ['Overview', 'Users', 'Credits', 'Models', 'Engagement', 'Tokens', 'Services', 'Deletion'];

function MAdmin({ onMenu }) {
  const [tab, setTab] = useStateMa('Overview');
  const content = () => {
    switch (tab) {
      case 'Users': return <MAdminUsers />;
      case 'Credits': return <MAdminCredits />;
      case 'Models': return <MAdminModels />;
      case 'Engagement': return <MAdminEngagement />;
      case 'Tokens': return <MAdminTokens />;
      case 'Services': return <MAdminServices />;
      case 'Deletion': return <MAdminDeletion />;
      default: return <MAdminOverview />;
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      <MTopBar title="Admin" onMenu={onMenu} right={<Badge tone="success" icon="activity">Live</Badge>} />
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '6px 12px', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {M_ADMIN_TABS.map((t) => { const on = tab === t; return (
          <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', flexShrink: 0, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: on ? 600 : 500, color: on ? 'var(--fg)' : 'var(--fg-subtle)' }}>{t}{on && <span style={{ position: 'absolute', left: 8, right: 8, bottom: 0, height: 2, borderRadius: 2, background: 'var(--accent)' }} />}</button>
        ); })}
      </div>
      <div key={tab} className="anim-fade-up" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 28px' }}>{content()}</div>
    </div>
  );
}

window.MAdmin = MAdmin;
