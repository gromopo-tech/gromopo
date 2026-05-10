'use client'
 import { usePathname } from 'next/navigation'
 import { useState, useEffect } from 'react'
 import { onAuthStateChanged } from 'firebase/auth'
 import Link from 'next/link'
 import { Button } from '@/components/ui/button'
 import { Menu, X } from 'lucide-react'
 import { ThemeSelect } from '@/components/theme-select'
 import { signOut } from 'firebase/auth';
 import { useRouter } from 'next/navigation';
 import { auth } from '@/lib/firebase/config';
 import { toast } from 'sonner';
 import { getHomeUrl } from '@/lib/utils';
 import { useContext } from 'react'
 import { RoleContext } from './protected/role-provider'

const customerLinks: { label: string; path: string }[] = [
  // More links...
  //{ label: 'Explore', path: '/explore' },
]

const businessLinks: { label: string; path: string }[] = [
  // More links...
  { label: 'Employees', path: '/dashboard/employees' },
  { label: 'Menus', path: '/dashboard/menus' },
  { label: 'Orders', path: '/dashboard/orders' },
]

function AuthButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  return !isAuthenticated ? (
    <Link href="/signin">
      <Button variant="outline" size="sm">Sign In</Button>
    </Link>
  ) : (
    <Button variant="outline" size="sm" onClick={async () => {
                try {
                  await signOut(auth);
                  await fetch("/api/clear-session-cookie", { method: "POST" });
                  router.push("/signin");
                } catch (error) {
                  console.error("Error signing out:", error);
                  toast.error("Failed to sign out. Please try again.");
                }
              }}>
      Sign Out
    </Button>
  );
}

export function AppHeaderMain({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [homeUrl, setHomeUrl] = useState('/')
  const [isClient, setIsClient] = useState(false)
  // client-side auth state so header updates immediately on sign-in/out
  const [clientAuth, setClientAuth] = useState<boolean>(isAuthenticated)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState<boolean>(false)

  useEffect(() => {
    setIsClient(true)
    setHomeUrl(getHomeUrl())
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setClientAuth(!!user)
      setDisplayName(user?.displayName || null)
      setEmailVerified(user?.emailVerified || false)
    })
    return () => unsub()
  }, [])

  // close mobile menu when the user signs out
  useEffect(() => {
    if (clientAuth === false) setShowMenu(false)
  }, [clientAuth])

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  let effectiveBusinessLinks = [...businessLinks];

  const role = useContext(RoleContext)
  if (clientAuth && role === 'owner') {
    effectiveBusinessLinks = [
      { label: 'ChatGMP', path: '/dashboard/chat-gmp' },
      ...businessLinks
    ]
  }


  return (
    <header className="sticky top-0 z-50 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 shadow-sm">
      <div className="mx-auto flex justify-between items-center">
        {/* Left: Always render the same container for hydration consistency */}
        <div className="flex items-baseline gap-4 min-w-0">
          <Link className="text-xl hover:text-neutral-500 dark:hover:text-white whitespace-nowrap" href={homeUrl}>
            <span>GroMoPo</span>
          </Link>
          <div className="hidden md:flex items-center">
            <ul className="flex gap-4 flex-nowrap items-center">
      {((clientAuth && emailVerified) ? effectiveBusinessLinks : customerLinks).map(({ label, path }) => (
                <li key={path}>
                  <Link
                    className={`hover:text-neutral-500 dark:hover:text-white ${isActive(path) ? 'text-neutral-500 dark:text-white' : ''}`}
                    href={path}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {(isAuthenticated && emailVerified) && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
              {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          )}
        </div>

    {clientAuth && displayName ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center w-full pointer-events-none">
            {emailVerified ? (
              <span className="pointer-events-auto font-semibold text-lg text-neutral-700 dark:text-neutral-200 px-4 py-1 rounded">
                Hello, {displayName}
              </span>
            ) : (
              <span className="pointer-events-auto font-medium text-sm text-amber-600 dark:text-amber-400 px-4 py-1 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                Please verify your email to access dashboard features
              </span>
            )}
          </div>
        ) : null}

        {/* Right: Theme and Auth Buttons for main site */}
        <div className="flex flex gap-4">
          {isClient && <AuthButton isAuthenticated={clientAuth} />}
          <ThemeSelect />
        </div>

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-[52px] bottom-0 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-sm">
            <div className="flex flex-col p-4 gap-4 border-t dark:border-neutral-800">
              <ul className="flex flex-col gap-4">
                {((clientAuth && emailVerified) ? effectiveBusinessLinks : customerLinks).map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`hover:text-neutral-500 dark:hover:text-white block text-lg py-2  ${isActive(path) ? 'text-neutral-500 dark:text-white' : ''} `}
                      href={path}
                      onClick={() => setShowMenu(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
