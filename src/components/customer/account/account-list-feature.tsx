'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../../solana/solana-provider'

export default function AccountListFeature() {
  const { publicKey, connected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (connected && publicKey) {
      router.push(`/rewards/${publicKey.toBase58()}`)
    }
  }, [connected, publicKey, router])

  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <h1 className="text-2xl font-bold">Connect your wallet to continue</h1>
        <WalletButton />
      </div>
    </div>
  )
}
