"use client";
import { useState } from "react";
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
      window.location.replace("/dashboard/orders");
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="MsoNormal" style={{ lineHeight: "1.1" }}>
        <br />
      </div>
      <div style={{ lineHeight: "1.5" }}>
        <br />
      </div>
      <h1 className="pb-12 text-center text-3xl font-semibold">
        Signin
      </h1>
      {success ? (
        <div>
          <h2>🎉 Success!</h2>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="form-input w-full border focus:ring-1 rounded px-3 py-2"
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
                className="block text-sm font-medium"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="form-input w-full border focus:ring-1 rounded px-3 py-2"
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
              className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Signin"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}