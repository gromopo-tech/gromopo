import { toast } from 'sonner'
import * as React from 'react'

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

export function useTransactionToast() {
  return (signature: string) => {
    toast('Transaction sent', {
      description: <ExplorerLink transaction={signature} label="View Transaction" />,
    })
  }
}