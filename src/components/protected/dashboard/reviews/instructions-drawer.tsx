'use client'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'

interface InstructionsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstructionsDrawer({ open, onOpenChange }: InstructionsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl pb-8">
          <DrawerHeader>
            <DrawerTitle>How to export your Google reviews</DrawerTitle>
            <DrawerDescription>
              Follow these steps to download your reviews from Google Business Profile.
            </DrawerDescription>
          </DrawerHeader>

          <ol className="space-y-6 px-6 text-sm">
            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium">Sign in to Google Business Profile</p>
                <p className="mt-1 text-muted-foreground">
                  Go to{' '}
                  <span className="font-mono text-xs bg-muted rounded px-1">
                    business.google.com
                  </span>{' '}
                  and sign in with the Google account that manages your business.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium">Open your business profile</p>
                <p className="mt-1 text-muted-foreground">
                  Click on your business name to open the management dashboard.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-medium">Download your reviews via Google Takeout</p>
                <p className="mt-1 text-muted-foreground">
                  Go to{' '}
                  <span className="font-mono text-xs bg-muted rounded px-1">
                    takeout.google.com
                  </span>
                  , click <strong>Deselect all</strong>, then scroll down and check{' '}
                  <strong>Google Business Profile</strong>. Click{' '}
                  <strong>Next step → Create export</strong>. You&apos;ll get an email when the
                  download is ready (usually under a minute).
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <div>
                <p className="font-medium">Find the reviews file in the archive</p>
                <p className="mt-1 text-muted-foreground">
                  Unzip the downloaded archive. Look inside{' '}
                  <span className="font-mono text-xs bg-muted rounded px-1">
                    Takeout/Google Business Profile/
                  </span>{' '}
                  for a file named{' '}
                  <span className="font-mono text-xs bg-muted rounded px-1">reviews.json</span>.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                5
              </span>
              <div>
                <p className="font-medium">Drag the file onto the upload area</p>
                <p className="mt-1 text-muted-foreground">
                  Drop <span className="font-mono text-xs bg-muted rounded px-1">reviews.json</span>{' '}
                  onto the upload area on this page. You&apos;ll see a preview before anything is
                  uploaded.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
