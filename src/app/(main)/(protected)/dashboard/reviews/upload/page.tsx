'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { InstructionsDrawer } from '@/components/protected/dashboard/reviews/instructions-drawer'
import Link from 'next/link'

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}

interface ReviewPreview {
  fileCount: number
  total: number
  withText: number
  avgRating: number
  earliest: string
  latest: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractReviews(data: unknown, fileName: string): any[] {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`${fileName}: not a valid JSON object.`)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = data as Record<string, any>
  if (Array.isArray(obj.reviews)) return obj.reviews
  // Some Takeout exports wrap differently — handle bare arrays too
  if (Array.isArray(data)) return data as unknown[]
  throw new Error(`${fileName}: no "reviews" array found.`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPreview(allReviews: any[], fileCount: number): ReviewPreview {
  let ratingSum = 0
  let ratingCount = 0
  let withText = 0
  const dates: number[] = []

  for (const r of allReviews) {
    const comment = (r.comment ?? '').trim()
    const star = STAR_MAP[r.starRating ?? '']
    if (!comment || !star || !r.name?.split('/').pop()) continue

    withText++
    ratingSum += star
    ratingCount++
    const ts = r.createTime ? Date.parse(r.createTime) : NaN
    if (!isNaN(ts)) dates.push(ts)
  }

  if (withText === 0) {
    throw new Error(
      `No reviewable entries found across ${fileCount} file${fileCount === 1 ? '' : 's'} ` +
      `(${allReviews.length} total rows). Reviews must have a text comment and star rating.`
    )
  }

  return {
    fileCount,
    total: allReviews.length,
    withText,
    avgRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
    earliest: dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : 'unknown',
    latest: dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : 'unknown',
    raw: allReviews,
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsText(file)
  })
}

export default function UploadReviewsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<ReviewPreview | null>(null)
  const [ingesting, setIngesting] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleFiles(files: FileList | File[]) {
    const fileList = Array.from(files).filter(
      (f) => f.name.endsWith('.json') || f.type === 'application/json'
    )
    if (fileList.length === 0) {
      toast.error('Please select JSON files.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allReviews: any[] = []
    const errors: string[] = []

    await Promise.all(
      fileList.map(async (file) => {
        try {
          const text = await readFileAsText(file)
          const data = JSON.parse(text)
          const reviews = extractReviews(data, file.name)
          allReviews.push(...reviews)
        } catch (err) {
          errors.push(err instanceof Error ? err.message : `${file.name}: parse error`)
        }
      })
    )

    if (errors.length > 0) {
      toast.error(errors.join('\n'))
      if (allReviews.length === 0) { setPreview(null); return }
    }

    try {
      setPreview(buildPreview(allReviews, fileList.length - errors.length))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not build preview.')
      setPreview(null)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  async function handleIngest() {
    if (!preview) return
    const user = auth.currentUser
    if (!user) { toast.error('Not signed in.'); return }

    setIngesting(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/reviews/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ reviews: preview.raw }),
      })

      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Ingest failed.'); return }

      toast.success(
        `Ingested ${body.ingested} review${body.ingested === 1 ? '' : 's'}. ` +
        `Your AI assistant now has access to them.`,
        { action: { label: 'Open ChatGMP', onClick: () => window.location.href = '/dashboard/chat-gmp' } }
      )
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error('Network error — could not reach the ingest service.')
    } finally {
      setIngesting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Google Reviews</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Export your reviews from Google Business Profile and drop them here to power your AI
            assistant. Google Takeout splits reviews across multiple files — you can drop them all
            at once.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
          How do I get this file?
        </Button>
      </div>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer
          ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <svg
          className="mb-3 h-10 w-10 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm font-medium">Drop your reviews JSON files here</p>
        <p className="mt-1 text-xs text-muted-foreground">or click to browse — multiple files supported</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
        />
      </div>

      {/* Preview card */}
      {preview && (
        <div className="mt-6 rounded-lg border bg-card p-5 space-y-3">
          <h2 className="font-semibold">
            Preview
            {preview.fileCount > 1 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                across {preview.fileCount} files
              </span>
            )}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Total reviews across all files</dt>
            <dd className="font-medium">{preview.total}</dd>
            <dt className="text-muted-foreground">With text (will be ingested)</dt>
            <dd className="font-medium">{preview.withText}</dd>
            <dt className="text-muted-foreground">Average rating</dt>
            <dd className="font-medium">{'★'.repeat(Math.round(preview.avgRating))} {preview.avgRating} / 5</dd>
            <dt className="text-muted-foreground">Date range</dt>
            <dd className="font-medium">{preview.earliest} → {preview.latest}</dd>
          </dl>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleIngest} disabled={ingesting}>
              {ingesting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Ingesting…
                </span>
              ) : (
                `Ingest ${preview.withText} review${preview.withText === 1 ? '' : 's'}`
              )}
            </Button>
            {ingesting && (
              <p className="text-xs text-muted-foreground">
                This takes ~30s for 100 reviews — please wait.
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Reviews without text comments are skipped. Re-uploading the same file is safe —
            duplicates are detected and overwritten.
          </p>
        </div>
      )}

      {!preview && (
        <p className="mt-4 text-sm text-muted-foreground">
          Once ingested, visit{' '}
          <Link href="/dashboard/chat-gmp" className="text-primary underline underline-offset-2">
            ChatGMP
          </Link>{' '}
          to ask questions about your reviews.
        </p>
      )}

      <InstructionsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
