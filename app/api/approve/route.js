import { supabase } from '@/lib/supabase'
import { sendLineMessage } from '@/lib/line'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getEndTime(time) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + 45)
  return `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  const html = (title, body) => `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; max-width: 480px; margin: 48px auto; padding: 0 24px; }
          h2 { font-size: 20px; }
          p { color: #555; line-height: 1.6; }
        </style>
      </head>
      <body>${body}</body>
    </html>`

  if (token !== process.env.APPROVAL_SECRET) {
    return new Response(html('エラー', '<h2>❌ 認証エラー</h2><p>URLが正しくありません。</p>'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // ステータスを confirmed に更新
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error || !booking) {
    return new Response(
      html('エラー', '<h2>⚠️ 承認できませんでした</h2><p>予約が見つからないか、すでに承認済みです。</p>'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  // お客さんへLINE通知
  const [year, month, day] = booking.booking_date.split('-').map(Number)
  const time = booking.booking_time
  const [hour, minute] = time.split(':')
  const endTime = getEndTime(time)
  const dow = WEEKDAYS[new Date(booking.booking_date + 'T00:00:00+09:00').getDay()]

  const message = `【予約確定のお知らせ】✂️

${booking.customer_name} 様

ご予約が確定しました！

📅 ${month}月${day}日（${dow}）
⏰ ${hour}:${minute}〜${endTime}

当日お待ちしております😊
ご不明な点はこのLINEにてご連絡ください。`

  await sendLineMessage(booking.customer_line_id, message)

  return new Response(
    html(
      '承認完了',
      `<h2>✅ 承認しました</h2>
       <p><strong>${booking.customer_name}</strong> 様（${month}月${day}日 ${hour}:${minute}〜）</p>
       <p>お客様のLINEに確定通知を送りました。</p>`
    ),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
