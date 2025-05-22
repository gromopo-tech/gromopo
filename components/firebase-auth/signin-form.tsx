"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SigninForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const idToken = await userCredential.user.getIdToken(true);
      await fetch("/api/set-session-cookie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      setSuccess(true);
      window.location.replace("/dashboard");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        alert("Error: " + error.message);
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    await fetch("/api/clear-session-cookie", { method: "POST" });
    window.location.replace("/signin");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="MsoNormal" style={{ lineHeight: "1.1" }}>
        <br />
      </div>
      <div style={{ lineHeight: "1.5" }}>
        <br />
      </div>
      <h1 className="pb-12 text-center animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-green-800),var(--color-green-800),var(--color-green-950),var(--color-green-950),var(--color-green-800))] bg-[length:800%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
        Signin
      </h1>
      {success ? (
        <div className="text-green-600">
          <h2>🎉 Success!</h2>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="form-input w-full text-gray-950"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="form-input w-full text-gray-950"
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-full bg-linear-to-t from-orange-400 to-orange-500 bg-[length:100%_100%] bg-[bottom] text-orange-200 shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
            >
              {isSubmitting ? "Sending..." : "Signin"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}