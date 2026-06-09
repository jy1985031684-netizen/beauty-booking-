import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { notifyOwner, sendLineMessage } from '@/lib/line'
import { isBusinessDay } from '@/lib/holidays'

const SAT_SLOTS = ['09:00', '09:45']
const SUN_SLOTS = ['09:00', '09:45', '10:30']

function getSlotsForDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const dow = new Date(year, month - 1, day).getDay()
  return dow === 6 ? SAT_SLOTS : SUN_SLOTS
}

export async function POST(request) {
  const { customerName, customerLineId, date, time } = await request.json()

  if (!customerName || !customerLineId || !date || !time) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  // バリデーション
  if (!isBusinessDay(date) || !getSlotsForDate(date).includes(time)) {
    return NextResponse.json({ error: '無効な日時です' }, { status: 400 })
  }

  // 二重予約チェック
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_date', date)
    .eq('booking_time', time)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'この時間はすでに予約済みです' }, { status: 409 })
  }

  // 予約を作成
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_name: customerName,
      customer_line_id: customerLineId,
      booking_date: date,
      booking_time: time,
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  }

  // 日時を人間が読みやすい形式に変換
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':')
  const endDate = new Date(year, month - 1, day, Number(hour), Number(minute) + 45)
  const endTime = `${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, '0')}`
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const dow = weekdays[new Date(year, month - 1, day).getDay()]

  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/approve?id=${booking.id}&token=${process.env.APPROVAL_SECRET}`
  const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/status/${booking.id}`

  const notifyMessage = `
【新規予約リクエスト】
名前：${customerName}
日時：${month}月${day}日（${dow}）${hour}:${minute}〜${endTime}

━━ お店確認文（コピペ用）━━
お疲れ様です！
${month}月${day}日${hour}:${minute}から1人予約をお願いしたいのですが、いかがでしょうか。
━━━━━━━━━━━━━━━━

▶ 承認する：${approvalUrl}
▶ 予約状況：${statusUrl}`

  const customerMessage = `【予約リクエスト受付】✂️\n\n${customerName} 様\n\nご予約リクエストを受け付けました！\n\n📅 ${month}月${day}日（${dow}）\n⏰ ${hour}:${minute}〜${endTime}\n\nオーナー確認後に確定通知をお送りします。\n\n▶ 予約状況を確認：${statusUrl}`
  await sendLineMessage(customerLineId, customerMessage)
console.log('LINE notify result:', notifyResult)

  return NextResponse.json({ bookingId: booking.id })
}
