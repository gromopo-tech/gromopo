import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo.png";

export default function Logo() {
  return (
    <Link href="/dashboard" className="inline-flex shrink-0" aria-label="GroMoPo">
      <Image src={logo} alt="GroMoPo Logo" width={32} height={32} />
    </Link>
  );
}
