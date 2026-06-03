'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getEndTime(time) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + 45)
  return `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`
}

export default function StatusPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    const load = () => {
      fetch(`/api/status?id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setError('予約情報が見つかりませんでした')
          else setBooking(data)
        })
        .catch(() => setError('通信エラーが発生しました'))
    }
    load()
    // pending の場合は10秒ごとに自動更新
    const interval = setInterval(() => {
      if (booking?.status !== 'confirmed') load()
    }, 10000)
    return () => clearInterval(interval)
  }, [id, booking?.status])

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#e53e3e', textAlign: 'center' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', color: '#888', paddingTop: 80 }}>読み込み中...</div>
      </div>
    )
  }

  const [year, month, day] = booking.booking_date.split('-').map(Number)
  const dow = WEEKDAYS[new Date(booking.booking_date + 'T00:00:00+09:00').getDay()]
  const endTime = getEndTime(booking.booking_time)
  const [bh, bm] = booking.booking_time.split(':')
  const isPending = booking.status === 'pending'

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {isPending ? (
            <>
              <div style={styles.statusIconPending}>🕐</div>
              <h2 style={styles.statusTitle}>確認中</h2>
              <p style={styles.statusDesc}>予約リクエストを受け付けました。<br />確定次第LINEでお知らせします。</p>
            </>
          ) : (
            <>
              <div style={styles.statusIconConfirmed}>✅</div>
              <h2 style={{ ...styles.statusTitle, color: '#2f855a' }}>予約確定</h2>
              <p style={styles.statusDesc}>ご予約が確定しました！<br />当日お待ちしております。</p>
            </>
          )}
        </div>

        <div style={styles.detailBox}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>お名前</span>
            <span style={styles.detailValue}>{booking.customer_name} 様</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>日付</span>
            <span style={styles.detailValue}>{month}月{day}日（{dow}）</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>時間</span>
            <span style={styles.detailValue}>{bh}:{bm} 〜 {endTime}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>メニュー</span>
            <span style={styles.detailValue}>カット</span>
          </div>
        </div>

        {isPending && (
          <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16 }}>
            このページは自動で更新されます
          </p>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  statusIconPending: { fontSize: 48, marginBottom: 8 },
  statusIconConfirmed: { fontSize: 48, marginBottom: 8 },
  statusTitle: { fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#333' },
  statusDesc: { fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0 },
  detailBox: { background: '#f7f7f7', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 15, fontWeight: 600, color: '#333' },
}
