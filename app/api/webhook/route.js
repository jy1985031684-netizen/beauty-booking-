import { NextResponse } from 'next/server'

export async function POST(request) {
  const body = await request.json()
  const events = body.events || []
  
  for (const event of events) {
    if (event.source?.userId) {
      console.log('LINE USER ID:', event.source.userId)
    }
  }
  
  return NextResponse.json({ ok: true })
}
