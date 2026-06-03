'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 土日祝（祝日はAPIで判定）
function isWeekend(date) {
  const d = date.getDay()
  return d === 0 || d === 6
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatSlot(time) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + 45)
  return `${time} 〜 ${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`
}

export default function BookingPage() {
  const router = useRouter()
  const [liffReady, setLiffReady] = useState(false)
  const [lineUserId, setLineUserId] = useState(null)
  const [error, setError] = useState(null)

  // カレンダー
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  // 空き枠
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedTime, setSelectedTime] = useState(null)

  // フォーム
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // LIFF 初期化
  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID
    import('@line/liff').then(({ default: liff }) => {
      liff.init({ liffId }).then(() => {
        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }
        liff.getProfile().then((profile) => {
          setLineUserId(profile.userId)
          setLiffReady(true)
        })
      }).catch((e) => {
        console.error(e)
        setError('LINEへのログインが必要です。LINEアプリから開いてください。')
      })
    })
  }, [])

  // 日付選択時に空き枠を取得
  useEffect(() => {
    if (!selectedDate) return
    setSlotsLoading(true)
    setSelectedTime(null)
    fetch(`/api/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || [])
        setSlotsLoading(false)
      })
  }, [selectedDate])

  // カレンダーのセル生成
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = new Date(calYear, calMonth, 1)
  const lastDay = new Date(calYear, calMonth + 1, 0)
  const cells = []
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(calYear, calMonth, d))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !selectedDate || !selectedTime || !lineUserId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerLineId: lineUserId,
          date: selectedDate,
          time: selectedTime,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '予約に失敗しました')
        setSubmitting(false)
        return
      }
      router.push(`/status/${data.bookingId}`)
    } catch {
      setError('通信エラーが発生しました')
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#e53e3e', textAlign: 'center' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!liffReady) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', color: '#888', paddingTop: 80 }}>読み込み中...</div>
      </div>
    )
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
    setSelectedDate(null)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>✂️ 予約</h1>
        <p style={styles.subtitle}>土日・祝日 9:00〜12:00（45分）</p>

        {/* カレンダー */}
        <div style={styles.section}>
          <div style={styles.calHeader}>
            <button onClick={prevMonth} style={styles.navBtn}>‹</button>
            <span style={styles.monthLabel}>{calYear}年 {MONTHS[calMonth]}</span>
            <button onClick={nextMonth} style={styles.navBtn}>›</button>
          </div>
          <div style={styles.calGrid}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ ...styles.calDow, color: i === 0 ? '#e53e3e' : i === 6 ? '#3182ce' : '#888' }}>{d}</div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />
              const dateStr = toDateStr(date)
              const isPast = date <= today
              const isWE = isWeekend(date)
              const isSelected = dateStr === selectedDate
              const disabled = isPast || !isWE
              return (
                <button
                  key={dateStr}
                  disabled={disabled}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    ...styles.calDay,
                    ...(disabled ? styles.calDayDisabled : styles.calDayEnabled),
                    ...(isSelected ? styles.calDaySelected : {}),
                    color: date.getDay() === 0 ? '#e53e3e' : date.getDay() === 6 ? '#3182ce' : undefined,
                  }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>

        {/* 時間枠 */}
        {selectedDate && (
          <div style={styles.section}>
            <p style={styles.sectionLabel}>時間を選んでください</p>
            {slotsLoading ? (
              <p style={{ color: '#888', fontSize: 14 }}>読み込み中...</p>
            ) : slots.length === 0 ? (
              <p style={{ color: '#888', fontSize: 14 }}>この日は満枠です</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    style={{
                      ...styles.slotBtn,
                      ...(selectedTime === slot ? styles.slotBtnSelected : {}),
                    }}
                  >
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 名前入力 & 送信 */}
        {selectedDate && selectedTime && (
          <form onSubmit={handleSubmit} style={styles.section}>
            <p style={styles.sectionLabel}>お名前</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              required
              style={styles.input}
            />
            <button type="submit" disabled={submitting || !name.trim()} style={styles.submitBtn}>
              {submitting ? '送信中...' : '予約リクエストを送る'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  title: { fontSize: 22, fontWeight: 700, margin: '0 0 4px', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', margin: '0 0 24px' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#555', margin: '0 0 10px' },
  calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthLabel: { fontWeight: 600, fontSize: 15 },
  navBtn: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#555', padding: '0 8px' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  calDow: { textAlign: 'center', fontSize: 12, fontWeight: 600, paddingBottom: 4 },
  calDay: { border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 14, cursor: 'pointer', textAlign: 'center', fontWeight: 500 },
  calDayDisabled: { background: 'none', color: '#ccc', cursor: 'default' },
  calDayEnabled: { background: '#f0f0f0', color: '#333' },
  calDaySelected: { background: '#3182ce', color: '#fff !important' },
  slotBtn: { background: '#f0f0f0', border: '2px solid transparent', borderRadius: 10, padding: '12px 16px', fontSize: 15, cursor: 'pointer', textAlign: 'left', fontWeight: 500, color: '#333' },
  slotBtnSelected: { background: '#ebf8ff', borderColor: '#3182ce', color: '#2b6cb0' },
  input: { width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '12px', fontSize: 15, boxSizing: 'border-box', marginBottom: 12 },
  submitBtn: { width: '100%', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}
