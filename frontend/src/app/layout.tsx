import type { Metadata } from 'next'
import { Cormorant_Garamond, Hanken_Grotesk } from 'next/font/google'

import './globals.css'

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-cormorant',
})

export const metadata: Metadata = {
  title: 'Visionist',
  description: 'AI destekli ekonomik kombin asistanı',
}

type RootLayoutProps = {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="tr">
      <body className={`${hanken.variable} ${cormorant.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

export default RootLayout
