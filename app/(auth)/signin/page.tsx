"use client";
import SigninForm from "@/components/firebase-auth/signin-form";
import Footer from "@/components/marketing/ui/footer";

export default function SigninPage() {
  return (
    <>
      <main className="flex items-center justify-center p-12 mx-auto max-w-6xl px-4 sm:px-6">
        <SigninForm />
      </main>
      <Footer />
    </>
  );
}