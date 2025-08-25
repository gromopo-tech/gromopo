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
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.enum(["restaurant", "cafe", "bakery", "bar", "food-truck", "other"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignupForm() {
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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // Create business doc
      const businessRef = await addDoc(collection(db, "businesses"), {
        name: data.businessName,
        subdomain: '', // to be set up later
        businessType: data.businessType,
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
      Signup for early access
      </h1>
      {success ? (
        <div>
          <h2>🎉 Success!</h2>
          <p>Check your email to verify your address.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="businessName"
              type="businessName"
              {...register("businessName")}
              className="form-input w-full border border-black dark:border-white rounded-lg"
              required
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="business type" className="block text-sm font-medium">
              Business Type 
            </label>
            <select
              id="businessType"
              {...register("businessType")}
              className="w-full border border-black dark:border-white rounded-lg cursor-pointer"
            >
              <option value=""></option>
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Cafe</option>
              <option value="bakery">Bakery</option>
              <option value="bar">Bar</option>
              <option value="food-truck">Food Truck</option>
              <option value="other">Other</option>
            </select>
            {errors.businessType && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
                  )}
          </div>
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
            <input
              id="password"
              type="password"
              {...register("password")}
              className="form-input w-full border border-black dark:border-white rounded-lg"
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full max-w-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white dark:text-black hover:from-amber-500 hover:to-emerald-500 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            {isSubmitting ? "Sending..." : "Get Early Access"}
          </button>
        </form>
      )}
    </div>
  );
}