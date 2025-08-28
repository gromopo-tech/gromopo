 'use client'
 import { useState, useEffect, useRef } from 'react'
 import Link from 'next/link'
 import { WalletButton } from '@/components/solana/solana-provider'
 import { ThemeSelect } from '@/components/theme-select'
 import { getHomeUrl } from '@/lib/utils';
 import { useTheme } from 'next-themes'
 import { useWallet } from '@solana/wallet-adapter-react'

export function AppHeaderSubdomain() {
  const [homeUrl, setHomeUrl] = useState('/')
  useEffect(() => {
    setHomeUrl(getHomeUrl())
  }, [])

  const { theme } = useTheme()
  const { connected } = useWallet()
  const prevThemeRef = useRef<string | null>(null)
  const prevConnectedRef = useRef<boolean | null>(null)

  useEffect(() => {
    prevThemeRef.current = theme ?? null
  }, [theme])

  useEffect(() => {
    prevConnectedRef.current = connected ?? null
  }, [connected])

  return (
    <header className="sticky top-0 z-50 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 shadow-sm">
      <div className="mx-auto flex justify-between items-center">
        {/* Left: Always render the same container for hydration consistency */}
        <div className="flex items-baseline gap-4 min-w-0">
          <Link className="text-xl hover:text-neutral-500 dark:hover:text-white whitespace-nowrap" href={homeUrl}>
            <span>GroMoPo</span>
          </Link>
        </div>

        {/* Right: Wallet and Theme Buttons for subdomain site */}
        <div className="flex flex gap-4">
          <WalletButton />
          <ThemeSelect />
        </div>
      </div>
    </header>
  )
}
