"use client";
import SigninForm from "@/components/auth/signin-form";

export default function SigninPage() {
  return (
    <>
      <main className="flex items-center justify-center p-12 mx-auto max-w-6xl px-4 sm:px-6">
        <SigninForm />
      </main>
    </>
  );
}