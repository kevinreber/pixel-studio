/* global React, window, Icon, Button, Badge, Avatar, MetricCard, AdminPanel, TimeRange, BarSeries, GroupedBars, ChartLegend, DistBar */
const { useState: useStateAt } = React;

const DAYS14 = ['5/21', '5/22', '5/23', '5/24', '5/25', '5/26', '5/27', '5/28', '5/29', '5/30', '5/31', '6/01', '6/02', '6/03'];

/* ====================== USERS ====================== */
function UsersTab() {
  const signups = [2, 1, 3, 0, 2, 4, 1, 2, 3, 1, 0, 2, 3, 2];
  const dist = [
    { label: '0 credits', count: 240, pct: 13.0, tone: 'warning' },
    { label: '1–10 credits', count: 1595, pct: 86.6, tone: 'accent' },
    { label: '11–50 credits', count: 2, pct: 0.1, tone: 'info' },
    { label: '51–200 credits', count: 3, pct: 0.2, tone: 'success' },
    { label: '200+ credits', count: 1, pct: 0.1, tone: 'neutral' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>User Activity</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--fg-muted)' }}>Engagement and account health across the platform</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          <MetricCard label="Active Today" value="214" sub="Users who generated content" icon="activity" tone="success" index={0} />
          <MetricCard label="Active This Week" value="642" sub="Last 7 days" icon="trending" tone="accent" index={1} />
          <MetricCard label="Active This Month" value="1,203" sub="Last 30 days" icon="users" index={2} />
          <MetricCard label="Inactive Users" value="1,828" sub="No activity in 30 days" icon="alert" tone="warning" index={3} />
        </div>
      </div>

      <AdminPanel icon="follow" title="Signup Trends" subtitle="Daily new user registrations" action={<Badge tone="neutral">Last 14 days</Badge>}>
        <BarSeries data={signups} labels={DAYS14} color="var(--accent)" height={170} />
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--fg-muted)' }}>
          Total <span className="mono" style={{ color: 'var(--fg)', fontWeight: 600 }}>26</span> new users this period
        </div>
      </AdminPanel>

      <AdminPanel icon="coins" title="Credit Distribution" subtitle="How credits are spread across the user base">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dist.map((d) => <DistBar key={d.label} {...d} />)}
        </div>
      </AdminPanel>
    </div>
  );
}

/* ====================== CREDITS ====================== */
function CreditsTab() {
  const [range, setRange] = useStateAt('Month');
  const purchased = [120, 0, 240, 80, 0, 360, 120, 0, 200, 0, 80, 240, 160, 120];
  const spent = [60, 90, 120, 40, 110, 80, 130, 70, 90, 50, 100, 60, 140, 80];
  const success = [18, 22, 19, 26, 24, 28, 21, 25, 30, 27, 23, 29, 31, 26];
  const failed = [2, 1, 3, 1, 2, 1, 4, 2, 1, 2, 3, 1, 2, 1];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Credit Economy &amp; Generations</h3>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)' }}>Monitor credit flow and generation metrics</p>
        </div>
        <TimeRange options={['Today', 'Week', 'Month', 'All Time']} value={range} onChange={setRange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <MetricCard label="Credits Purchased" value="+1,240" sub="Today: +120" icon="trending" tone="success" index={0} />
        <MetricCard label="Credits Spent" value="−980" sub="Today: −60" icon="coins" tone="danger" index={1} />
        <MetricCard label="Credits Refunded" value="40" sub="Today: 0" icon="shuffle" tone="info" index={2} />
        <MetricCard label="Net Credit Flow" value="+260" sub="99 transactions this month" icon="wallet" tone="accent" index={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <MetricCard label="Total Generations" value="342" sub="This month" icon="zap" index={0} />
        <MetricCard label="Successful" value="318" sub="Completed generations" icon="check" tone="success" index={1} />
        <MetricCard label="Failed" value="24" sub="Failed generations" icon="x" tone="danger" index={2} />
        <MetricCard label="Success Rate" value="93%" sub="Target: 95%+" icon="activity" tone="warning" index={3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <AdminPanel icon="coins" title="Credit Flow" subtitle="Purchases vs spending">
          <GroupedBars a={purchased} b={spent} labels={DAYS14} colorA="var(--success)" colorB="var(--danger)" height={170} />
          <ChartLegend items={[{ label: 'Purchased', color: 'var(--success)' }, { label: 'Spent', color: 'var(--danger)' }]} />
        </AdminPanel>
        <AdminPanel icon="zap" title="Generation Volume" subtitle="Daily generation attempts">
          <GroupedBars a={success} b={failed} labels={DAYS14} colorA="var(--success)" colorB="var(--danger)" height={170} />
          <ChartLegend items={[{ label: 'Successful', color: 'var(--success)' }, { label: 'Failed', color: 'var(--danger)' }]} />
        </AdminPanel>
      </div>
    </div>
  );
}

/* ====================== TOKENS ====================== */
function TokensTab() {
  const [q, setQ] = useStateAt('');
  const adjustments = [
    { user: 'pogiboyz', amount: +500, admin: 'reebeezie', time: 'Jun 2, 2026, 3:14 PM', reason: 'Goodwill — failed batch refund' },
    { user: 'maplar1994', amount: -120, admin: 'reebeezie', time: 'May 30, 2026, 10:02 AM', reason: 'Reversed fraudulent purchase' },
    { user: 'novarte', amount: +1000, admin: 'kevinreber01', time: 'May 28, 2026, 6:41 PM', reason: 'Creator partnership grant' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Token Management</h3>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)' }}>Search for a user and manually adjust their credit balance</p>
      </div>

      <AdminPanel icon="search" title="Search Users" subtitle="Find a user by username or email">
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={17} stroke={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or email…" style={{ width: '100%', height: 46, padding: '0 14px 0 42px', borderRadius: 'var(--r-md)', background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none' }} />
        </div>
      </AdminPanel>

      <AdminPanel icon="clock" title="Recent Admin Adjustments" subtitle="History of manual credit changes by admins">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 2fr', gap: 16, padding: '0 4px 10px' }}>
            {['User', 'Amount', 'Admin · Time', 'Reason'].map((h) => <span key={h} className="u-label">{h}</span>)}
          </div>
          {adjustments.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 2fr', gap: 16, alignItems: 'center', padding: '13px 4px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Avatar name={a.user} size={28} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>@{a.user}</span>
              </div>
              <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: a.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>{a.amount > 0 ? '+' : ''}{a.amount}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.admin}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{a.time}</div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{a.reason}</span>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

/* ====================== MODELS ====================== */
function RankRow({ rank, name, dot, users, avg, count, change, success }) {
  const medal = { 1: '#f6b03c', 2: '#a7adba', 3: '#cd7f4d' }[rank] || 'var(--fg-subtle)';
  const up = change > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 64, flexShrink: 0 }}>
        <span className="mono" style={{ fontSize: 19, fontWeight: 700, color: medal }}>#{rank}</span>
        {change !== 0 && <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)' }}><Icon name="trending" size={11} stroke={2.3} style={{ transform: up ? 'none' : 'scaleY(-1)' }} />{Math.abs(change)}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--fg-subtle)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="users" size={12} stroke={2} />{users} users</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12} stroke={2} />{avg} avg</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{count}</div>
        <div style={{ fontSize: 11, color: up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{up ? '+' : ''}{change} ({Math.round((change / Math.max(count - change, 1)) * 100)}%)</div>
      </div>
      <Badge tone={success >= 95 ? 'success' : success >= 80 ? 'warning' : 'danger'} mono style={{ flexShrink: 0 }}>{success}%</Badge>
    </div>
  );
}

function ModelsTab() {
  const [range, setRange] = useStateAt('Month');
  const usage = [42, 38, 51, 33, 47, 62, 44, 55, 71, 58, 49, 66, 73, 61];
  const ranks = [
    { rank: 1, name: 'Stable Diffusion 3.5 Large', dot: '#8275ff', users: 8, avg: '52s', count: 10, change: -4, success: 77 },
    { rank: 2, name: 'Replicate Kandinsky 2.2', dot: '#2fcf8e', users: 2, avg: '533s', count: 2, change: +2, success: 100 },
    { rank: 3, name: 'Stable Image Core', dot: '#f6b03c', users: 1, avg: '39s', count: 1, change: -2, success: 100 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Model Popularity</h3>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)' }}>AI model usage trends and performance</p>
        </div>
        <TimeRange options={['Week', 'Month']} value={range} onChange={setRange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <MetricCard label="Total Generations" value="1,342" sub="This month" icon="zap" index={0} />
        <MetricCard label="Active Models" value="8" sub="Models in use" icon="cpu" tone="accent" index={1} />
        <MetricCard label="Unique Users" value="214" sub="Using AI models" icon="users" index={2} />
        <MetricCard label="Avg Success Rate" value="94%" sub="Across all models" icon="activity" tone="success" index={3} />
      </div>

      <AdminPanel icon="star" title="Model Rankings" subtitle="Ranked by usage, vs. previous period">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ranks.map((r) => <RankRow key={r.rank} {...r} />)}
        </div>
      </AdminPanel>

      <AdminPanel icon="trending" title="Usage Trends" subtitle="Daily generation volume across top models" action={<Badge tone="neutral">Last 14 days</Badge>}>
        <BarSeries data={usage} labels={DAYS14} color="var(--accent)" height={170} />
      </AdminPanel>
    </div>
  );
}

/* ====================== ENGAGEMENT ====================== */
function TopUserRow({ user, metric, label, rank }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderTop: rank === 0 ? 'none' : '1px solid var(--border)' }}>
      <span className="mono" style={{ width: 18, fontSize: 13, color: 'var(--fg-subtle)', fontWeight: 600 }}>{rank + 1}</span>
      <Avatar name={user} size={32} />
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>@{user}</span>
      <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{metric}</span>
      <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{label}</span>
    </div>
  );
}

function EngagementTab() {
  const follows = [1, 0, 2, 1, 0, 1, 3, 0, 1, 2, 0, 1, 1, 0];
  const topFollowers = [['novarte', '540'], ['studioK', '211'], ['pogiboyz', '12'], ['bomgaming2025', '8'], ['maplar1994', '5']];
  const topEngagement = [['novarte', '1.2k'], ['reebeezie', '865'], ['studioK', '612'], ['pogiboyz', '410'], ['kevinreber01', '233']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Social &amp; Engagement</h3>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)' }}>Platform social activity and top creators</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <MetricCard label="Total Follows" value="1,204" sub="3.9 avg per user" icon="follow" tone="info" index={0} />
        <MetricCard label="Total Likes" value="8,653" sub="4.5 avg per image" icon="heart" tone="danger" index={1} />
        <MetricCard label="Total Comments" value="1,236" sub="0.6 avg per image" icon="comment" tone="accent" index={2} />
        <MetricCard label="Users with Followers" value="312" sub="1,529 without" icon="users" index={3} />
      </div>

      {/* most followed highlight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(100deg, color-mix(in oklab, var(--warning) 16%, var(--surface-1)), var(--surface-1))', border: '1px solid color-mix(in oklab, var(--warning) 28%, var(--border))' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'color-mix(in oklab, var(--warning) 22%, transparent)', color: 'var(--warning)' }}>
          <Icon name="star" size={22} stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="u-label" style={{ color: 'var(--warning)' }}>Most Followed Creator</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 3 }}>@novarte</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>540</div>
          <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>followers</div>
        </div>
      </div>

      <AdminPanel icon="trending" title="Follow Activity" subtitle="New follow relationships per day" action={<Badge tone="neutral">Last 14 days</Badge>}>
        <BarSeries data={follows} labels={DAYS14} color="var(--info)" height={150} />
      </AdminPanel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <AdminPanel icon="users" title="Top by Followers" subtitle="Most-followed accounts">
          <div>{topFollowers.map(([u, m], i) => <TopUserRow key={u} user={u} metric={m} label="followers" rank={i} />)}</div>
        </AdminPanel>
        <AdminPanel icon="heart" title="Top by Engagement" subtitle="Most likes &amp; comments">
          <div>{topEngagement.map(([u, m], i) => <TopUserRow key={u} user={u} metric={m} label="interactions" rank={i} />)}</div>
        </AdminPanel>
      </div>
    </div>
  );
}

/* ====================== EXTERNAL SERVICES ====================== */
function ServiceCard({ name, provider, status, latency, uptime, index }) {
  const map = { operational: 'var(--success)', degraded: 'var(--warning)', down: 'var(--danger)' };
  const c = map[status];
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${index * 35}ms`, padding: 18, borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: 'var(--surface-3)', color: 'var(--fg-muted)' }}><Icon name="external" size={16} stroke={2} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{provider}</div>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: c, textTransform: 'capitalize', flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 0 3px color-mix(in oklab, ${c} 22%, transparent)` }} />{status}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div className="u-label" style={{ whiteSpace: 'nowrap' }}>Latency</div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{latency}</div>
        </div>
        <div>
          <div className="u-label" style={{ whiteSpace: 'nowrap' }}>Uptime</div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: uptime >= 99.9 ? 'var(--success)' : 'var(--warning)' }}>{uptime}%</div>
        </div>
      </div>
    </div>
  );
}

function ExternalServicesTab() {
  const services = [
    { name: 'Stable Diffusion 3.5', provider: 'Stability AI', status: 'operational', latency: '1.2s', uptime: 99.98 },
    { name: 'Flux Pro 1.1', provider: 'Black Forest Labs', status: 'operational', latency: '2.4s', uptime: 99.92 },
    { name: 'DALL·E 3', provider: 'OpenAI', status: 'degraded', latency: '4.8s', uptime: 99.4 },
    { name: 'Runway Gen-3', provider: 'Runway', status: 'operational', latency: '8.1s', uptime: 99.87 },
    { name: 'Dream Machine', provider: 'Luma AI', status: 'operational', latency: '6.3s', uptime: 99.95 },
    { name: 'QStash Queue', provider: 'Upstash', status: 'operational', latency: '84ms', uptime: 100 },
    { name: 'Redis Cache', provider: 'Upstash', status: 'operational', latency: '12ms', uptime: 100 },
    { name: 'Ideogram v2', provider: 'Ideogram', status: 'down', latency: '—', uptime: 96.2 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>External Services</h3>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)' }}>Health and latency of connected model providers &amp; infrastructure</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="success" icon="check">6 operational</Badge>
          <Badge tone="warning">1 degraded</Badge>
          <Badge tone="danger">1 down</Badge>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {services.map((s, i) => <ServiceCard key={s.name} {...s} index={i} />)}
      </div>
    </div>
  );
}

/* ====================== DELETION LOGS ====================== */
function DeletionLogsTab() {
  const logs = [
    { prompt: 'An astronaut riding a horse on Mars, cinematic lighting', model: 'sd3.5-large-turbo', by: 'reebeezie', user: 'kevinreber01', time: 'Jan 19, 2026, 4:15 PM', reason: 'No reason provided' },
    { prompt: 'A futuristic cyberpunk city street with neon signs and flying cars', model: 'dall-e-2', by: 'reebeezie', user: 'kevinreber01', time: 'Jan 19, 2026, 4:11 PM', reason: 'Policy violation — copyrighted character' },
    { prompt: 'Portrait study, soft window light, 85mm', model: 'flux-pro-1.1', by: 'kevinreber01', user: 'maplar1994', time: 'Jan 18, 2026, 9:02 AM', reason: 'User requested removal' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AdminPanel icon="trash" title="Deletion Logs" subtitle={`History of removed images and videos (${logs.length} total)`}
        action={<div style={{ position: 'relative' }}><Icon name="search" size={15} stroke={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} /><input placeholder="Filter…" style={{ height: 36, width: 200, padding: '0 12px 0 34px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)', border: '1px solid var(--border-strong)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none' }} /></div>}>
        <div>
          {logs.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.6fr auto', gap: 18, alignItems: 'center', padding: '15px 4px', borderTop: '1px solid var(--border)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.prompt}</span>
                  <Badge tone="neutral" style={{ flexShrink: 0 }}>{l.model}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-subtle)' }}>
                  <Icon name="user" size={12} stroke={2} />{l.user} · {l.time}
                </div>
              </div>
              <div>
                <div className="u-label">Deleted by</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>{l.by}</div>
              </div>
              <div style={{ fontSize: 13, color: l.reason.startsWith('No reason') ? 'var(--fg-subtle)' : 'var(--fg-muted)', fontStyle: l.reason.startsWith('No reason') ? 'italic' : 'normal' }}>{l.reason}</div>
              <Button variant="ghost" size="sm" icon="eye">Details</Button>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

/* ====================== ROUTER ====================== */
function AdminTabContent({ tab }) {
  switch (tab) {
    case 'Users': return <UsersTab />;
    case 'Credits': return <CreditsTab />;
    case 'Tokens': return <TokensTab />;
    case 'Models': return <ModelsTab />;
    case 'Engagement': return <EngagementTab />;
    case 'External Services': return <ExternalServicesTab />;
    case 'Deletion Logs': return <DeletionLogsTab />;
    default: return null;
  }
}

window.AdminTabContent = AdminTabContent;
window.DAYS14 = DAYS14;
