import React, { useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { CAvatar, CBadge, CButton, CButtonGroup, CCard, CCardBody, CCol, CProgress, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilGlobeAlt, cilPeople, cilStorage, cilSwapHorizontal, cilWallet } from '@coreui/icons'

import { downloadCsv } from 'src/utils/csv'

import { get_dashboard_summary } from 'src/api/system_service'

import avatar1 from 'src/assets/images/avatars/1.jpg'
import avatar2 from 'src/assets/images/avatars/2.jpg'
import avatar3 from 'src/assets/images/avatars/3.jpg'

const Dashboard = () => {
  const navigate = useNavigate()
  const [trafficRange, setTrafficRange] = useState('Month')
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    let alive = true
      ; (async () => {
        try {
          setSummaryError('')
          const res = await get_dashboard_summary()
          if (!alive) return
          if (res?.status === 200) setSummary(res.data)
        } catch (e) {
          if (!alive) return
          setSummary(null)
          setSummaryError(e?.response?.data?.message || e?.message || 'Failed to load dashboard data')
        }
      })()
    return () => {
      alive = false
    }
  }, [])

  const fmt = (v) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return '—'
    return n.toLocaleString()
  }

  const stats = useMemo(() => {
    const c = summary?.counts
    const usersTotal = c?.users?.total
    const usersVerified = c?.users?.verified
    const productsTotal = c?.products?.total
    const listingsTotal = c?.listings?.total
    const modelsTotal = c?.catalog?.models?.total
    const sellConfigsTotal = c?.catalog?.sell_configs?.total

    return [
      {
        label: 'TOTAL USERS',
        value: fmt(usersTotal),
        delta: Number.isFinite(Number(usersVerified)) ? `${fmt(usersVerified)} verified` : '',
        color: 'success',
        icon: cilPeople,
        to: '/users',
        spark: 'M2,26 C10,26 12,14 20,14 C28,14 28,24 36,24 C44,24 46,10 54,10 C62,10 64,24 72,24 C80,24 86,18 94,18',
      },
      {
        label: 'TOTAL PRODUCTS',
        value: fmt(productsTotal),
        delta: '',
        color: 'success',
        icon: cilWallet,
        to: '/products',
        spark: 'M2,22 C12,22 14,12 24,12 C34,12 34,20 44,20 C54,20 56,10 66,10 C76,10 80,18 94,18',
      },
      {
        label: 'LEADS GENERATED',
        value: fmt(listingsTotal),
        delta: '',
        color: 'success',
        icon: cilSwapHorizontal,
        to: '/leads',
        spark: 'M2,12 C14,12 16,18 26,18 C36,18 38,10 48,10 C58,10 60,22 70,22 C80,22 84,26 94,26',
      },
      {
        label: 'MODELS',
        value: fmt(modelsTotal),
        delta: Number.isFinite(Number(sellConfigsTotal)) ? `${fmt(sellConfigsTotal)} sell configs` : '',
        color: 'success',
        icon: cilGlobeAlt,
        to: '/models/manage',
        spark: 'M2,20 C10,20 12,10 22,10 C32,10 34,24 44,24 C54,24 56,14 66,14 C76,14 78,22 88,22 C92,22 94,20 94,20',
      },
    ]
  }, [summary])

  const nodes = useMemo(
    () => [
      {
        icon: cilStorage,
        name: 'Core SQL Master',
        region: 'US-EAST-1 (Virginia)',
        load: 24,
        health: '99.98%',
        status: 'OPTIMAL',
      },
      {
        icon: cilCloudDownload,
        name: 'CDN Edge Node',
        region: 'EU-WEST-2 (London)',
        load: 82,
        health: '99.91%',
        status: 'OPTIMAL',
      },
      {
        icon: cilSwapHorizontal,
        name: 'API Gateway V2',
        region: 'AP-SOUTH-1 (Mumbai)',
        load: 50,
        health: '99.95%',
        status: 'OPTIMAL',
      },
    ],
    [],
  )

  const timeAgo = (iso) => {
    const dt = iso ? new Date(iso) : null
    if (!dt || Number.isNaN(dt.getTime())) return ''
    const sec = Math.max(0, Math.floor((Date.now() - dt.getTime()) / 1000))
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.floor(hr / 24)
    return `${day}d ago`
  }

  const team = useMemo(() => {
    const users = Array.isArray(summary?.recent_users) ? summary.recent_users : []
    if (users.length === 0) {
      return [
        { avatar: avatar1, name: '—', action: 'No recent activity', time: '' },
        { avatar: avatar2, name: '—', action: 'No recent activity', time: '' },
        { avatar: avatar3, name: '—', action: 'No recent activity', time: '' },
      ]
    }
    return users.map((u, idx) => {
      const first = String(u?.first_name || '').trim()
      const last = String(u?.last_name || '').trim()
      const name = [first, last].filter(Boolean).join(' ') || String(u?.email || 'User')
      const email = String(u?.email || '').trim()
      const initials = (first?.[0] || email?.[0] || 'U').toUpperCase() + (last?.[0] ? last[0].toUpperCase() : '')
      return {
        // Keep a stable avatar even if no uploaded image
        avatar: idx % 3 === 0 ? avatar1 : idx % 3 === 1 ? avatar2 : avatar3,
        name,
        action: email ? `joined with ${email}` : 'joined the platform',
        time: timeAgo(u?.created_at),
        initials,
        avatar_url: u?.avatar_url,
      }
    })
  }, [summary])

  const Sparkline = ({ d, color }) => (
    <svg width="110" height="34" viewBox="0 0 96 32" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className={`text-${color}`} />
    </svg>
  )

  const StatCard = ({ label, value, delta, color, icon, spark, to }) => (
    <CCard
      className="border-0 shadow-sm rounded-4 h-100"
      role={to ? 'button' : undefined}
      tabIndex={to ? 0 : undefined}
      style={to ? { cursor: 'pointer' } : undefined}
      onClick={
        to
          ? () => {
            navigate(to)
          }
          : undefined
      }
      onKeyDown={
        to
          ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate(to)
            }
          }
          : undefined
      }
    >
      <CCardBody className="p-3">
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <div className="text-body-secondary small fw-semibold" style={{ letterSpacing: 0.6 }}>
              {label}
            </div>
            <div className="fs-3 fw-bold mt-2">{value}</div>
            {delta ? <div className={`small mt-1 text-${color}`}>{delta}</div> : null}
          </div>
          <div className="rounded-circle bg-body-tertiary d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
            <CIcon icon={icon} className={`text-${color}`} />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-2">
          <Sparkline d={spark} color={color} />
        </div>
      </CCardBody>
    </CCard>
  )

  const TrafficChart = () => (
    <svg width="100%" height="260" viewBox="0 0 720 260" aria-hidden="true">
      <defs>
        <linearGradient id="trafficFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <path
        d="M30 200 C 90 180, 120 110, 180 110 C 250 110, 280 190, 340 190 C 410 190, 430 70, 500 70 C 560 70, 600 150, 690 150"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-success"
      />
      <path
        d="M30 200 C 90 180, 120 110, 180 110 C 250 110, 280 190, 340 190 C 410 190, 430 70, 500 70 C 560 70, 600 150, 690 150 L 690 230 L 30 230 Z"
        fill="url(#trafficFill)"
        className="text-success"
      />

      <path
        d="M30 210 C 130 205, 220 200, 340 198 C 460 196, 560 194, 690 192"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 6"
        className="text-body-secondary"
        opacity="0.6"
      />

      <circle cx="500" cy="70" r="5" className="text-success" fill="currentColor" />
      <circle cx="500" cy="70" r="11" className="text-success" fill="currentColor" opacity="0.18" />

      {[
        { x: 40, t: 'JAN' },
        { x: 130, t: 'FEB' },
        { x: 220, t: 'MAR' },
        { x: 310, t: 'APR' },
        { x: 400, t: 'MAY' },
        { x: 490, t: 'JUN' },
        { x: 580, t: 'JUL' },
        { x: 670, t: 'AUG' },
      ].map((m) => (
        <text key={m.t} x={m.x} y={252} className="text-body-secondary" fontSize="11">
          {m.t}
        </text>
      ))}
    </svg>
  )

  return (
    <div className="bg-body-tertiary min-vh-100 py-4">
      <div className="container-fluid px-4">
        {summaryError ? <div className="alert alert-warning py-2">{summaryError}</div> : null}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <div className="h3 fw-bold mb-1">Performance Overview</div>
            <div className="text-body-secondary">Real-time insight into your platform ecosystem.</div>
          </div>
          <CButton
            color="success"
            className="rounded-pill px-4"
            onClick={() => {
              downloadCsv({
                filename: `dashboard_export_${new Date().toISOString().slice(0, 10)}.csv`,
                rows: [
                  ['Section', 'Label', 'Value'],
                  ...stats.map((s) => ['Stats', s.label, s.value]),
                  ...nodes.map((n) => ['Nodes', n.name, `${n.load}% load, ${n.health}`]),
                ],
              })
            }}
          >
            <CIcon icon={cilCloudDownload} className="me-2" />
            Export Data
          </CButton>
        </div>

        <CRow className="g-3 mt-2">
          {stats.map((s) => (
            <CCol key={s.label} xs={12} sm={6} lg={3}>
              <StatCard {...s} />
            </CCol>
          ))}
        </CRow>

        <CRow className="g-3 mt-3">
          <CCol xs={12} lg={8}>
            <CCard className="border-0 shadow-sm rounded-4 h-100">
              <CCardBody className="p-3 p-md-4">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                  <div>
                    <div className="fw-bold">Traffic Overview</div>
                    <div className="text-body-secondary small">Daily user engagement and acquisition metrics</div>
                  </div>
                  <CButtonGroup className="bg-body-tertiary rounded-pill p-1">
                    {['Day', 'Month', 'Year'].map((v) => (
                      <CButton
                        key={v}
                        color={trafficRange === v ? 'success' : 'light'}
                        className="rounded-pill px-3"
                        size="sm"
                        onClick={() => setTrafficRange(v)}
                      >
                        {v}
                      </CButton>
                    ))}
                  </CButtonGroup>
                </div>

                <div className="mt-3">
                  <TrafficChart />
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} lg={4}>
            <CCard className="border-0 shadow-sm rounded-4 h-100">
              <CCardBody className="p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="fw-bold">Team Live</div>
                  <CBadge color="success" className="rounded-pill">
                    LIVE UPDATES
                  </CBadge>
                </div>

                <div className="mt-3 d-grid gap-3">
                  {team.map((t) => (
                    <div key={t.name} className="d-flex gap-3">
                      {t?.avatar_url ? (
                        <CAvatar
                          src={
                            String(t.avatar_url).startsWith('http')
                              ? t.avatar_url
                              : `${import.meta.env.VITE_API_URL}uploads/${t.avatar_url}`
                          }
                          size="md"
                        />
                      ) : t?.initials ? (
                        <CAvatar color="secondary" size="md">
                          {t.initials}
                        </CAvatar>
                      ) : (
                        <CAvatar src={t.avatar} size="md" />
                      )}
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{t.name}</div>
                        <div className="text-body-secondary small">{t.action}</div>
                        <div className="text-body-secondary small mt-1">{t.time}</div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-body-tertiary rounded-4 p-3 mt-2">
                    <div className="fw-semibold">Project Status</div>
                    <div className="text-body-secondary small">Enterprise rollout phase 2</div>
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <div className="small fw-semibold text-success">72% Complete</div>
                    </div>
                    <CProgress value={72} color="success" className="mt-2" style={{ height: 8 }} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        <div className="mt-3">
          <CCard className="border-0 shadow-sm rounded-4">
            <CCardBody className="p-3 p-md-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="fw-bold">System High-Traffic Nodes</div>
                <div className="d-flex align-items-center gap-3">
                  <div className="small text-body-secondary">
                    <span className="text-success">•</span> 3 Nodes Active
                  </div>
                  <a href="#" className="small text-success text-decoration-none fw-semibold">
                    View All Cluster Data
                  </a>
                </div>
              </div>

              <div className="mt-3 d-grid gap-3">
                {nodes.map((n) => (
                  <div
                    key={n.name}
                    className="d-flex align-items-center justify-content-between gap-3 flex-wrap"
                  >
                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 260 }}>
                      <div
                        className="rounded-3 bg-body-tertiary d-flex align-items-center justify-content-center"
                        style={{ width: 42, height: 42 }}
                      >
                        <CIcon icon={n.icon} className="text-success" />
                      </div>
                      <div>
                        <div className="fw-semibold">{n.name}</div>
                        <div className="text-body-secondary small">{n.region}</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 240 }}>
                      <div className="flex-grow-1">
                        <CProgress value={n.load} color="success" style={{ height: 6 }} />
                      </div>
                      <div className="small text-body-secondary" style={{ width: 70 }}>
                        {n.load}% Load
                      </div>
                    </div>

                    <div className="text-end" style={{ minWidth: 110 }}>
                      <div className="fw-semibold">{n.health}</div>
                      <div className="small text-success fw-semibold">{n.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
