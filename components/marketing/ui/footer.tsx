import Logo from "@/components/marketing/ui/logo";
import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        ></div>
        <div className="grid grid-cols-2 justify-between gap-12 py-8 sm:grid-rows-[auto_auto] md:grid-cols-4 md:grid-rows-[auto_auto] md:py-12 lg:grid-cols-[repeat(4,minmax(0,140px))_1fr] lg:grid-rows-1 xl:gap-20">
          {/* 1st block */}
          <div className="flex items-center space-x-2">
            <Logo />
            <span className="text-lg font-semibold text-green-800/65 transition hover:text-green-500">
              GroMoPo
            </span>
          </div>
          {/* 2nd block */}
          <div className="flex items-center space-x-4 justify-end">
            <a
              className="text-green-800/65 transition hover:text-green-500"
              href="/terms-of-service"
            >
              Terms of service
            </a>
            <a
              className="text-green-800/65 transition hover:text-green-500"
              href="/privacy-policy"
            >
              Privacy policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
