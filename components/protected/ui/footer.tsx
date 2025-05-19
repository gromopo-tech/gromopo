import Logo from "@/components/protected/ui/logo";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        ></div>
        <div className="flex items-center justify-between py-8 md:py-12">
          {/* 1st block */}
          <div className="flex items-center space-x-2">
            <Logo />
            <span className="text-lg font-semibold text-green-800/65 transition hover:text-green-500">
              GroMoPo
            </span>
          </div>
          {/* 2nd block 
          <div className="flex items-center space-x-4">
            <a
              className="text-green-800/65 transition hover:text-green-500"
              href="/dashboard/terms"
            >
              Terms of service
            </a>
            <a
              className="text-green-800/65 transition hover:text-green-500"
              href="/dashboard/privacy"
            >
              Privacy policy
            </a>
          </div>
          */}
        </div>
      </div>
    </footer>
  );
}