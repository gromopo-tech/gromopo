import "./css/style.css";
import localFont from "next/font/local";
import AppShell from "./AppShell";

const nacelle = localFont({
  src: [
    { path: "../public/fonts/nacelle-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/nacelle-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/nacelle-semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/nacelle-semibolditalic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nacelle.variable} bg-e9e7d5 font-inter text-base text-black-200 antialiased`}>
        <AppShell nacelle={nacelle}>{children}</AppShell>
      </body>
    </html>
  );
}