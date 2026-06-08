import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isBusinessDay } from '@/lib/holidays'

cconst SAT_SLOTS = ['09:00', '09:45']
const SUN_SLOTS = ['09:00', '09:45', '10:30']

function getSlotsForDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const dow = new Date(year, month - 1, day).getDay()
  return dow === 6 ? SAT_SLOTS : SUN_SLOTS
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!date) {
    return NextResponse.json({ error: 'date が必要です' }, { status: 400 })
  }

  // 営業日チェック（土日祝のみ）
  if (!isBusinessDay(date)) {
    return NextResponse.json({ slots: [] })
  }

  // 当日以降のみ受付
  const today = new Date().toISOString().slice(0, 10)
  if (date <= today) {
    return NextResponse.json({ slots: [] })
  }

  // すでに予約済みの枠を取得
  const { data } = await supabase
    .from('bookings')
    .select('booking_time')
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed'])

  const booked = data?.map((b) => b.booking_time) || []
  const available = getSlotsForDate(date).filter((s) => !booked.includes(s))

  return NextResponse.json({ slots: available })
}
