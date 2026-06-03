// LINE Messaging API — メッセージ送信（オーナー・お客さん共通）
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

// オーナー（自分）に通知
export async function notifyOwner(message) {
  const ownerId = process.env.LINE_OWNER_USER_ID
  if (!ownerId) {
    console.warn('LINE_OWNER_USER_ID が未設定です')
    return false
  }
  return sendLineMessage(ownerId, message)
}
