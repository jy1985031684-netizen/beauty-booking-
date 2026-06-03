// LINE Notify — 自分のLINEに通知
export async function sendLineNotify(message) {
  const res = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${process.env.LINE_NOTIFY_TOKEN}`,
    },
    body: new URLSearchParams({ message }),
  })
  return res.ok
}

// LINE Messaging API — お客さんのLINEに自動送信
export async function sendLineMessage(userId, message) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: message }],
    }),
  })
  return res.ok
}
