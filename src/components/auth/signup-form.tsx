"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";


// Schema for form validation
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // Create business doc
      // Note: businessName and businessType are not collected at signup. Use sensible defaults.
      const businessRef = await addDoc(collection(db, "businesses"), {
        name: '',
        subdomain: '', // to be set up later
        businessType: 'other',
        ownerId: userCredential.user.uid,
        verified: false,
        menuUploaded: false,
        menuIntegrated: false,
        hasWallet: false,
        createdAt: new Date(),
      });

      await updateProfile(userCredential.user, { displayName: data.name });

      // Tell backend to set custom claims (admin SDK)
      const res = await fetch("/api/signup-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userCredential.user.uid, businessId: businessRef.id }),
      });
      if (!res.ok) throw new Error('Failed to set server claims');

      // Optionally send email verification (still works)
      await sendEmailVerification(userCredential.user);

      // Set server-side session cookie so middleware recognizes the user
      const idToken = await userCredential.user.getIdToken(true);
      const cookieRes = await fetch("/api/set-session-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });
      if (!cookieRes.ok) throw new Error('Failed to set session cookie');

      setSuccess(true);
      // Ensure a full reload so server-side middleware reads the new cookie
      window.location.replace('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Signup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <h1 className="pb-5 text-4xl font-semibold md:text-5xl bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-x">
      Create an account
      </h1>
      {success ? (
        <div>
          <h2>🎉 Success!</h2>
          <p>Check your email to verify your address.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Business name/type removed from signup form per request */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="name"
              {...register("name")}
              className="form-input w-full border border-black dark:border-white rounded-lg"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label 
              htmlFor="email" className="block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="form-input w-full border border-black dark:border-white rounded-lg"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register("password")}
                className="form-input w-full border border-black dark:border-white rounded-lg pr-10"
                required
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                onTouchCancel={() => setShowPassword(false)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300"
                aria-label="Hold to show password"
              >
                {/* Eye icon (static) - visible while holding via input type change */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                  <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full max-w-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white dark:text-black hover:from-amber-500 hover:to-emerald-500 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            {isSubmitting ? "Sending..." : "Register"}
          </button>
        </form>
      )}
    </div>
  );
}