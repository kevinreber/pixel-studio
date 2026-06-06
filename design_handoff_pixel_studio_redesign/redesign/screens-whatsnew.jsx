/* global React, window, Icon, Button, Badge, PageHeader, Segmented */
const { useState: useStateWn, useMemo: useMemoWn } = React;

const WN_TYPE = {
  feature: { label: 'New Feature', tone: 'accent', icon: 'sparkles', color: 'var(--accent)' },
  improvement: { label: 'Improvement', tone: 'info', icon: 'trending', color: 'var(--info)' },
  fix: { label: 'Fix', tone: 'warning', icon: 'check', color: 'var(--warning)' },
  model: { label: 'New Model', tone: 'success', icon: 'cpu', color: 'var(--success)' },
};

const WN_ENTRIES = [
  {
    type: 'feature', date: 'February 10, 2026', version: 'v2.6.0', title: 'Stability AI Video Generation',
    desc: 'You can now create videos using Stability AI directly from the Create Video page. Choose from multiple Stability models for different styles and effects.',
    bullets: ['New Stability AI video models available', 'Multiple style options for video generation', 'Accessible from the Create Video page'],
  },
  {
    type: 'feature', date: 'January 20, 2026', version: 'v2.5.0', title: 'Achievements & Login Streaks',
    desc: 'Stay motivated with our new achievements system. Earn badges for creating content, engaging with the community, and maintaining daily login streaks.',
    bullets: ['Earn achievement badges for milestones', 'Track your daily login streak', 'View achievements on your profile'],
  },
  {
    type: 'feature', date: 'January 8, 2026', version: 'v2.4.0', title: 'Trending Content Page',
    desc: 'Discover the most popular images, videos, and creators on Pixel Studio. Filter by period to see what’s trending right now or over the past month.',
    bullets: ['See top images, videos, and creators', 'Filter by 24 hours, 48 hours, 1 week, or 1 month', 'Updated in real time'],
  },
  {
    type: 'improvement', date: 'December 18, 2025', version: 'v2.3.2', title: 'Faster generation queue',
    desc: 'We migrated the generation pipeline to a new async queue with live progress. Most images now start generating in under a second.',
    bullets: ['Real-time progress on every generation', 'Up to 3× faster queue start times', 'Multi-model comparison runs in parallel'],
  },
  {
    type: 'feature', date: 'December 2, 2025', version: 'v2.3.0', title: 'Prompt Marketplace',
    desc: 'Buy, sell, and review high-performing prompts from the community. Find a style you love and remix it in one click.',
    bullets: ['Search, purchase, and review prompts', 'Ratings and performance metrics', 'One-click remix into your own work'],
  },
  {
    type: 'fix', date: 'November 15, 2025', version: 'v2.2.4', title: 'Stability & polish',
    desc: 'A round of fixes and refinements across the app based on your feedback.',
    bullets: ['Fixed occasional set thumbnail load failures', 'Resolved comment notifications arriving twice', 'Improved image grid performance on large profiles'],
  },
];

function TimelineEntry({ e, index, latest, isLast }) {
  const t = WN_TYPE[e.type];
  return (
    <div className="anim-fade-up" style={{ position: 'relative', paddingLeft: 38, paddingBottom: 26, animationDelay: `${index * 50}ms` }}>
      {/* rail */}
      {!isLast && <span style={{ position: 'absolute', left: 11, top: 26, bottom: -2, width: 2, background: 'var(--border)' }} />}
      {/* node */}
      <span style={{ position: 'absolute', left: 4, top: 18, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)', border: `2px solid ${t.color}`, display: 'grid', placeItems: 'center' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }} />
      </span>

      <div style={{
        background: 'var(--surface-1)', borderRadius: 'var(--r-lg)', padding: '20px 22px',
        border: `1px solid ${latest ? 'var(--border-accent)' : 'var(--border)'}`,
        boxShadow: latest ? '0 10px 36px -16px var(--accent-glow)' : 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 13, flexWrap: 'wrap' }}>
          <Badge tone={t.tone} icon={t.icon} style={{ whiteSpace: 'nowrap' }}>{t.label}</Badge>
          {latest && <Badge tone="accent" style={{ whiteSpace: 'nowrap' }}>Latest</Badge>}
          <span style={{ fontSize: 13, color: 'var(--fg-subtle)', whiteSpace: 'nowrap' }}>{e.date}</span>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--fg-faint)', whiteSpace: 'nowrap' }}>{e.version}</span>
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>{e.title}</h3>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--fg-muted)', maxWidth: 640 }}>{e.desc}</p>

        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {e.bullets.map((b) => (
            <li key={b} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'start', fontSize: 14 }}>
              <span style={{ marginTop: 1, width: 18, height: 18, borderRadius: 'var(--r-xs)', display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${t.color} 16%, transparent)`, color: t.color }}>
                <Icon name="check" size={12} stroke={2.6} />
              </span>
              <span style={{ color: 'var(--fg-muted)', lineHeight: 1.5 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WhatsNewPage() {
  const [filter, setFilter] = useStateWn('All');
  const map = { All: null, Features: 'feature', Improvements: 'improvement', Fixes: 'fix' };
  const entries = useMemoWn(() => {
    const key = map[filter];
    return key ? WN_ENTRIES.filter((e) => e.type === key) : WN_ENTRIES;
  }, [filter]);

  return (
    <div>
      <PageHeader icon="sparkles" title="What's New" subtitle="The latest features and updates on Pixel Studio"
        actions={<Segmented options={['All', 'Features', 'Improvements', 'Fixes']} value={filter} onChange={setFilter} size="sm" />} />

      <div style={{ maxWidth: 820 }}>
        {entries.length === 0 ? (
          <div style={{ padding: '70px 0', textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 15 }}>No updates in this category.</div>
        ) : (
          entries.map((e, i) => <TimelineEntry key={e.version} e={e} index={i} isLast={i === entries.length - 1} latest={filter === 'All' && i === 0} />)
        )}
      </div>
    </div>
  );
}

window.WhatsNewPage = WhatsNewPage;
window.WN_ENTRIES = WN_ENTRIES;
window.WN_TYPE = WN_TYPE;
