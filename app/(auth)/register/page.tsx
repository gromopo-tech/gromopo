"use client";
import RegisterForm from "@/components/firebase-auth/register-form";
import Footer from "@/components/marketing/ui/footer";

export default function RegisterPage() {
  return (
    <>
      <main className="flex items-center justify-center p-12 mx-auto max-w-6xl px-4 sm:px-6">
        <RegisterForm />
      </main>
      <Footer />
    </>
  );
}