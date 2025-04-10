"use client";
import PartnersForm from "@/components/marketing/partners-form";
import Footer from "@/components/marketing/ui/footer";

export default function SignupPage() {
  return (
    <>
      <main className="flex items-center justify-center p-12 mx-auto max-w-6xl px-4 sm:px-6">
        <PartnersForm />
      </main>
      <Footer />
    </>
  );
}