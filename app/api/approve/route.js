import { supabase } from '@/lib/supabase'
import { sendLineMessage } from '@/lib/line'
 
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
 
function getEndTime(time) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + 45)
  return `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`
}
 
function html(body) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:sans-serif;max-width:480px;margin:48px auto;padding:0 24px;text-align:center}.card{background:#f7f7f7;border-radius:12px;padding:16px;margin:16px 0;text-align:left}.row{display:flex;justify-content:space-between;margin:8px 0}button{width:100%;background:#3182ce;color:#fff;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:600;cursor:pointer;margin-top:16px}</style></head><body>${body}</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
 
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')
 
  if (token !== process.env.APPROVAL_SECRET) {
    return html('<h2>認証エラー</h2>')
  }
 
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()
 
  if (!booking) {
    return html('<h2>予約が見つかりません</h2>')
  }
 
  if (booking.status === 'confirmed') {
    return html(`<h2>✅ すでに承認済みです</h2><p>${booking.customer_name} 様の予約は確定しています。</p>`)
  }
 
const [year, month, day] = booking.booking_date.split('-').map(Number)
const [hour, minute] = booking.booking_time.split(':')
const dow = WEEKDAYS[new Date(year, month - 1, day).getDay()]
const endTime = getEndTime(booking.booking_time)
 
  return html(`
    <h2>予約を承認しますか？</h2>
    <div class="card">
      <div class="row"><span>名前</span><strong>${booking.customer_name} 様</strong></div>
      <div class="row"><span>日付</span><strong>${month}月${day}日（${dow}）</strong></div>
      <div class="row"><span>時間</span><strong>${hour}:${minute}〜${endTime}</strong></div>
    </div>
    <form method="POST">
      <input type="hidden" name="id" value="${id}">
      <input type="hidden" name="token" value="${token}">
      <button type="submit">✅ 承認する</button>
    </form>
  `)
}
 
export async function POST(request) {
  const formData = await request.formData()
  const id = formData.get('id')
  const token = formData.get('token')
 
  if (token !== process.env.APPROVAL_SECRET) {
    return html('<h2>認証エラー</h2>')
  }
 
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()
 
  if (error || !booking) {
    return html('<h2>⚠️ 承認できませんでした</h2><p>すでに承認済みか、予約が見つかりません。</p>')
  }
 
const [year, month, day] = booking.booking_date.split('-').map(Number)
const [hour, minute] = booking.booking_time.split(':')
const endTime = getEndTime(booking.booking_time)
const dow = WEEKDAYS[new Date(year, month - 1, day).getDay()]
 
  const message = `【予約確定のお知らせ】✂️\n\n${booking.customer_name} 様\n\nご予約が確定しました！\n\n📅 ${month}月${day}日（${dow}）\n⏰ ${hour}:${minute}〜${endTime}\n\n当日お待ちしております😊`
 
  await sendLineMessage(booking.customer_line_id, message)
 
  return html(`<h2>✅ 承認しました</h2><p><strong>${booking.customer_name}</strong> 様（${month}月${day}日 ${hour}:${minute}〜）</p><p>お客様のLINEに確定通知を送りました。</p>`)
}
