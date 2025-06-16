'use client'

import * as React from 'react'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AppAlert } from '@/components/app-alert'
import { useConnection } from '@solana/wallet-adapter-react'

export function ExplorerLink({
  className,
  label = '',
  address,
  transaction,
  block,
}: {
  className?: string
  label: string
  address?: string
  transaction?: string
  block?: string
}) {
  let url = 'https://explorer.solana.com/'
  if (address) url += `address/${address}`
  else if (transaction) url += `tx/${transaction}`
  else if (block) url += `block/${block}`
  url += '?cluster=devnet'
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono`}
    >
      {label}
    </a>
  )
}

export function ClusterChecker({ children }: { children: ReactNode }) {
  const { connection } = useConnection()
  const [version, setVersion] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    connection
      .getVersion()
      .then((v) => {
        setVersion(v['solana-core'])
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [connection])

  if (loading) return null
  if (error || !version) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        }
      >
        Error connecting to cluster.
      </AppAlert>
    )
  }
  return <>{children}</>
}
