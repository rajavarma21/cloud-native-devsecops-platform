import { useEffect, useState } from 'react'
import {
  Activity, ShieldCheck, GitBranch, Boxes, LayoutDashboard,
  Server, Settings, Bell, Search, CheckCircle2, Clock3,
  ArrowUpRight, ArrowDownRight, Container, Workflow,
  Menu, X, CircleDot, LockKeyhole, Cloud, Zap
} from 'lucide-react'
import './App.css'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Deployments', icon: GitBranch },
  { label: 'Security Center', icon: ShieldCheck },
  { label: 'Infrastructure', icon: Boxes },
  { label: 'Services', icon: Server },
]

const services = [
  { name: 'Frontend', detail: 'React · Vite', port: '5174', color: 'purple' },
  { name: 'Backend API', detail: 'Node.js · Express', port: '5001', color: 'blue' },
  { name: 'Cache layer', detail: 'Redis', port: '6379', color: 'orange' },
]

const pipeline = [
  { name: 'Source', detail: 'Git checkout', icon: GitBranch },
  { name: 'Build', detail: 'Docker image', icon: Container },
  { name: 'Security', detail: 'Vulnerability scan', icon: ShieldCheck },
  { name: 'Deploy', detail: 'Kubernetes', icon: Cloud },
]

function App() {
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState(false)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

  const [apiHealth, setApiHealth] = useState('checking')
  const [redisHealth, setRedisHealth] = useState('checking')

  useEffect(() => {
    let active = true

    async function checkHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/health/ready`)
        const data = await response.json()

        if (!active) return

        if (response.ok && data.status === 'ready') {
          setApiHealth('healthy')
          setRedisHealth(data.dependencies?.redis === 'connected' ? 'healthy' : 'unavailable')
        } else {
          setApiHealth('unavailable')
          setRedisHealth('unavailable')
        }
      } catch {
        if (!active) return
        setApiHealth('unavailable')
        setRedisHealth('unavailable')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 15000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [API_BASE_URL])
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Zap size={22} fill="currentColor" /></div>
          <div>
            <strong>Cloud<span>Forge</span></strong>
            <small>DEVSECOPS PLATFORM</small>
          </div>
          <button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace">
          <div className="workspace-avatar">C</div>
          <div className="workspace-copy"><strong>Cloud Native Platform</strong><small>Personal workspace</small></div>
          <CircleDot size={15} className="workspace-dot" />
        </div>

        <div className="nav-label">PLATFORM</div>
        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? 'nav-active' : ''}`}
              onClick={() => { setActive(label); setMobileOpen(false) }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Security Center' && <span className="nav-count">2</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><ShieldCheck size={20} /></div>
            <strong>Security first.</strong>
            <p>Build securely. Ship confidently.</p>
            <span className="security-tag"><span /> Security-aware workflow</span>
          </div>
          <button className="nav-item settings-item" onClick={() => setActive('Settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <div className="profile">
            <div className="profile-avatar">DV</div>
            <div className="profile-copy"><strong>DevOps Engineer</strong><small>Platform administrator</small></div>
            <CircleDot size={13} className="online-dot" />
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            <div className="breadcrumb">Platform <span>/</span> <strong>{active}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="environment"><span /> LOCAL ENVIRONMENT <ChevronMark /></div>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice(!notice)}>
              <Bell size={19} /><i />
            </button>
            <div className="top-avatar">DV</div>
          </div>
        </header>

        {notice && <div className="notice-popover">You're all caught up. No new notifications.</div>}

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> CLOUD-NATIVE CONTROL PLANE</div>
              <h1>{active === 'Overview' ? <>Your platform, <span>in control.</span></> : active}</h1>
              <p className="welcome-description">
                {active === 'Overview'
                  ? 'A unified view of application health, delivery pipelines, and security posture.'
                  : `Explore your ${active.toLowerCase()} workspace and platform status.`}
              </p>
            </div>
            <button className="primary-button" onClick={() => setNotice(true)}>
              <Activity size={17} /> Platform status <span className="button-live-dot" />
            </button>
          </section>

          <section className="status-banner">
  <div className="status-icon">
    <CheckCircle2 size={21} />
  </div>

  <div className="status-copy">
    <strong>
      {apiHealth === 'checking'
        ? 'Checking backend health…'
        : apiHealth === 'healthy'
          ? 'CloudForge API is healthy'
          : 'CloudForge API is unavailable'}
    </strong>

    <span>
      {redisHealth === 'healthy'
        ? 'Redis is connected and readiness checks are passing.'
        : redisHealth === 'checking'
          ? 'Checking Redis connectivity…'
          : 'Redis is unavailable or the API readiness check failed.'}
    </span>
  </div>

  <span className="status-pill">
    <span />
    {apiHealth === 'healthy' && redisHealth === 'healthy'
      ? 'API + REDIS READY'
      : apiHealth === 'checking' || redisHealth === 'checking'
        ? 'CHECKING'
        : 'DEGRADED'}
  </span>
</section>
          <section className="metrics-grid">
            <MetricCard title="Services configured" value="03" change="Frontend, API & cache" icon={Boxes} tone="purple" trend="up" />
            <MetricCard title="Pipeline stages" value="04" change="Build → scan → deploy" icon={Workflow} tone="blue" trend="up" />
            <MetricCard title="Security layers" value="04" change="Planned security controls" icon={ShieldCheck} tone="green" trend="up" />
            <MetricCard title="Cloud resources" value="00" change="No AWS resources created" icon={Cloud} tone="orange" trend="flat" />
          </section>

          <section className="content-grid">
            <div className="panel pipeline-panel">
              <div className="panel-heading">
                <div><div className="panel-kicker">DELIVERY</div><h2>CI/CD pipeline</h2></div>
                <span className="subtle-badge"><Clock3 size={13} /> Planned workflow</span>
              </div>
              <p className="panel-description">The delivery journey from source code to production.</p>
              <div className="pipeline-list">
                {pipeline.map(({ name, detail, icon: Icon }, index) => (
                  <div className="pipeline-step" key={name}>
                    <div className={`pipeline-icon step-${index}`}><Icon size={19} /></div>
                    <div className="pipeline-copy"><strong>{name}</strong><span>{detail}</span></div>
                    <span className="step-number">0{index + 1}</span>
                    {index < pipeline.length - 1 && <div className="pipeline-connector" />}
                  </div>
                ))}
              </div>
              <div className="pipeline-footer"><Zap size={15} /><span>Jenkins automation will be connected in a later milestone.</span></div>
            </div>

            <div className="panel services-panel">
              <div className="panel-heading">
                <div><div className="panel-kicker">RUNTIME</div><h2>Service architecture</h2></div>
                <span className="count-badge">03 components</span>
              </div>
              <p className="panel-description">The core building blocks of this platform.</p>
              <div className="service-list">
                {services.map((service) => (
                  <div className="service-row" key={service.name}>
                    <div className={`service-icon ${service.color}`}>
                      {service.name === 'Frontend' ? <LayoutDashboard size={19} /> : service.name === 'Backend API' ? <Server size={19} /> : <Boxes size={19} />}
                    </div>
                    <div className="service-copy"><strong>{service.name}</strong><span>{service.detail}</span></div>
                    <div className="service-port">:{service.port}</div>
                    <span className="planned-dot" title="Integration pending" />
                  </div>
                ))}
              </div>
              <div className="service-footer"><span className="legend-dot" /> Integration status will update after health checks are connected.</div>
            </div>
          </section>

          <section className="bottom-grid">
            <div className="panel security-panel">
              <div className="panel-heading">
                <div><div className="panel-kicker">DEVSECOPS</div><h2>Security posture</h2></div>
                <ShieldCheck size={20} className="heading-icon" />
              </div>
              <div className="security-score">
                <div className="score-ring"><div><strong>--</strong><span>NOT SCANNED</span></div></div>
                <div className="score-copy"><strong>Security scanning not connected</strong><p>Trivy, dependency auditing, and code analysis will be added to the pipeline.</p></div>
              </div>
              <div className="security-tags"><span><LockKeyhole size={13} /> Dependency audit</span><span><ShieldCheck size={13} /> Container scan</span></div>
            </div>

            <div className="panel roadmap-panel">
              <div className="panel-heading">
                <div><div className="panel-kicker">UP NEXT</div><h2>Build roadmap</h2></div>
                <span className="subtle-badge">Phase 01 / 06</span>
              </div>
              <div className="roadmap-item roadmap-current"><div className="roadmap-marker"><CheckCircle2 size={16} /></div><div><strong>Frontend foundation</strong><span>React application scaffold</span></div><span className="roadmap-state">IN PROGRESS</span></div>
              <div className="roadmap-item"><div className="roadmap-marker"><Server size={16} /></div><div><strong>API + Redis</strong><span>Health checks and caching</span></div><span className="roadmap-state pending">NEXT</span></div>
              <div className="roadmap-item"><div className="roadmap-marker"><Container size={16} /></div><div><strong>Container platform</strong><span>Docker and Compose</span></div><span className="roadmap-state pending">PLANNED</span></div>
              <div className="roadmap-item"><div className="roadmap-marker"><GitBranch size={16} /></div><div><strong>Secure delivery</strong><span>Jenkins and security gates</span></div><span className="roadmap-state pending">PLANNED</span></div>
            </div>
          </section>

          <footer className="footer"><div className="footer-brand"><Zap size={15} /> CloudForge <span>· DevSecOps portfolio project</span></div><div><span className="footer-dot" /> Local demo <span className="footer-divider">|</span> Built for secure delivery</div></footer>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ title, value, change, icon: Icon, tone, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-top"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><ArrowUpRight size={16} className="metric-arrow" /></div>
      <div className="metric-value">{value}</div>
      <div className="metric-title">{title}</div>
      <div className={`metric-change ${trend === 'flat' ? 'neutral' : ''}`}>
        {trend === 'flat' ? <CircleDot size={13} /> : <ArrowDownRight size={13} />}
        {change}
      </div>
    </div>
  )
}

function ChevronMark() {
  return <span className="chevron-mark">⌄</span>
}

export default App
