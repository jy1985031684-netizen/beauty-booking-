import { supabase } from '@/lib/supabase'
import { sendLineMessage } from '@/lib/line'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getEndTime(time) {
  const [h, m] = time.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + 45)
  return `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`
}

// GET: 確認ページを表示
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  if (token !== process.env.APPROVAL_SECRET) {
    return new Response('<h2>認証エラー</h2>', {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (!booking) {
    return new Response('<h2>予約が見つかりません</h2>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (booking.status === 'confirmed') {
    return new Response(`
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body{font-family:sans-serif;max-width:480px;margin:48px auto;padding:0 24px;text-align:center}</style></head>
      <body><h2
