import React from 'react'

export function AppFooter({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <footer className="text-center p-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 text-xs">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        ></div>
        <div className="flex items-center justify-between py-8 md:py-12">
          {/* 1st block */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold hover:text-neutral-500 dark:hover:text-white">
              GroMoPo
            </span>
          </div>
          {/* 2nd block */}
          <div className="flex items-center space-x-4">
            <a
              className="hover:text-neutral-500 dark:hover:text-white"
              href={isAuthenticated ? ("/dashboard/privacy-policy") : ("/privacy-policy")}
            >
              Privacy policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
