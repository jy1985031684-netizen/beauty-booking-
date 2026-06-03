import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id が必要です' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookings')
    .select('status, customer_name, booking_date, booking_time')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  return NextResponse.json(data)
}
