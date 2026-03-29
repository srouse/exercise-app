import type { Metadata, Viewport } from 'next'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import '@/styles/tokens-primitive.css'
import '@/styles/tokens-semantic.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Exercise App',
  description: 'Track your workout sessions',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Exercise App' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#228be6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Auth0Provider>
          <main>{children}</main>
        </Auth0Provider>
      </body>
    </html>
  )
}
