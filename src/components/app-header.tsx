'use client'
import { usePathname } from 'next/navigation'
import { useState, useContext } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { ThemeSelect } from '@/components/theme-select'
import { WalletButton } from '@/components/public/solana/solana-provider'
import Image from 'next/image'
import { signOut } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { auth } from '@/lib/firebase/config';
import { RoleContext } from '@/components/private/role-provider'

const customerLinks: { label: string; path: string }[] = [
  // More links...
  { label: 'Home', path: '/' },
  { label: 'Rewards', path: '/rewards' },
]

const businessLinks: { label: string; path: string }[] = [
  // More links...
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
                  alert("Failed to sign out. Please try again.");
                }
              }}>
      Sign Out
    </Button>
  );
}

export function AppHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const role = useContext(RoleContext);

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  const isPizzaCero = pathname === '/order/pizza-cero'

  // Conditionally add Employees link for owner/admin
  let effectiveBusinessLinks = [...businessLinks];
  if (isAuthenticated && (role === 'owner' || role === 'admin')) {
    effectiveBusinessLinks = [
      { label: 'Employees', path: '/dashboard/employees' },
      ...businessLinks
    ];
  }

  return (
    <header className="relative z-50 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400">
      <div className="mx-auto flex justify-between items-center">
        {/* Left: Always render the same container for hydration consistency */}
        <div className="flex items-baseline gap-4 min-w-0">
          <Link className="text-xl hover:text-neutral-500 dark:hover:text-white whitespace-nowrap" href="/">
            <span>GroMoPo</span>
          </Link>
          <div className="hidden md:flex items-center">
            <ul className="flex gap-4 flex-nowrap items-center">
              {(isAuthenticated ? effectiveBusinessLinks : customerLinks).map(({ label, path }) => (
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
        </div>

        {/* Center: Pizza Cero Logo (only on /order/pizza-cero) or user name if authenticated */}
        {isAuthenticated ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center w-full pointer-events-none">
            <span className="pointer-events-auto font-semibold text-lg text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-neutral-900/80 px-4 py-1 rounded shadow">
              Hello, {auth.currentUser?.displayName || 'User'}
            </span>
          </div>
        ) : isPizzaCero && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center w-full pointer-events-none">
            <a
              href="https://www.pizzacero.com.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto"
            >
              <Image
                src="/images/pizza-cero-logo.png"
                alt="Pizza Cero Logo"
                width={162}
                height={54}
                className="mx-auto cursor-pointer"
                priority
              />
            </a>
          </div>
        )}

        {/* Right: Wallet, Cluster, Theme, and Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated && <WalletButton />}
          <ThemeSelect />
          <AuthButton isAuthenticated={isAuthenticated} />
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-[52px] bottom-0 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-sm">
            <div className="flex flex-col p-4 gap-4 border-t dark:border-neutral-800">
              <ul className="flex flex-col gap-4">
                {(isAuthenticated ? effectiveBusinessLinks : customerLinks).map(({ label, path }) => (
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
              <div className="flex flex-col gap-4">
                {!isAuthenticated && <WalletButton />}
                <ThemeSelect />
                <AuthButton isAuthenticated={isAuthenticated} />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
