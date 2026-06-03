export const metadata = {
  title: '予約',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif", background: '#f7f7f7' }}>
        {children}
      </body>
    </html>
  )
}
