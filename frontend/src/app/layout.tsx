import type { Metadata } from 'next'
import { Hanken_Grotesk } from 'next/font/google'

import './globals.css'

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
})

export const metadata: Metadata = {
  title: 'Stil & Ekonomi',
  description: 'AI destekli ekonomik kombin asistanı',
}

type RootLayoutProps = {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="tr">
      <body className={`${hanken.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

export default RootLayout
