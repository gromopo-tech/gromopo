"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, auth } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";


// Schema for form validation
const schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
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

  // Normalize business name to a DNS-safe subdomain
  const toSubdomain = (name: string) => {
    const slug = name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")    // remove punctuation but keep spaces and hyphens
  .trim()
  .replace(/\s+/g, "-")            // spaces -> hyphen
  .replace(/^-+|-+$/g, "")         // trim hyphens
  .replace(/-+/g, "-")             // collapse multiple hyphens
  .slice(0, 63);                     // DNS label max length
    return slug;
  };

  // Create a normalized version for uniqueness checking (strips all punctuation/spaces)
  const toNormalizedKey = (name: string) => {
    return name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");      // remove all non-alphanumeric
  };

  // Reserved subdomains that should not be allowed
  const RESERVED = new Set([
    "www", "admin", "api", "app", "static", "assets", "dashboard", "order", "orders", "auth", "login", "signup"
  ]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Generate and validate subdomain first (cheap client-side UX)
      const subdomain = toSubdomain(data.businessName);
      const normalizedKey = toNormalizedKey(data.businessName);
      
      if (!subdomain) {
        toast.error("Business name results in an invalid subdomain.");
        setIsSubmitting(false);
        return;
      }
      if (RESERVED.has(subdomain)) {
        toast.error("That subdomain is reserved. Please choose another name.");
        setIsSubmitting(false);
        return;
      }
      
      // Check if normalized business name is already taken (ignores punctuation/spacing)
      const q = query(collection(db, "businesses"), where("normalizedName", "==", normalizedKey));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error("That business name is already taken (ignoring punctuation and spacing).");
        setIsSubmitting(false);
        return;
      }

      // Create user account first
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });

      // Get ID token to authenticate with server
      const idToken = await userCredential.user.getIdToken();

      // Create business via server route (enforces uniqueness atomically)
      const res = await fetch("/api/signup-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idToken, 
          businessName: data.businessName,
          subdomain,
          normalizedName: normalizedKey
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          toast.error("That subdomain is already taken.");
        } else {
          toast.error(errorData.error || 'Failed to create business.');
        }
        // Delete the user account since business creation failed
        await userCredential.user.delete();
        setIsSubmitting(false);
        return;
      }

      // Optionally send email verification (still works)
      await sendEmailVerification(userCredential.user);

      // Send verification and show success UI.  Do NOT set the session cookie or redirect here.
      // We'll let the user verify their email first, then they can click "Continue" which will
      // reload the user, check emailVerified and set the session cookie + redirect.
      setSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error('Signup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification email
  const resendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('No user available to resend verification.');
        return;
      }
      await sendEmailVerification(user);
      toast.success('Verification email sent.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to resend verification email.');
    }
  };

  // Continue: reload user, check emailVerified, then set session cookie + redirect
  const continueAfterVerification = async () => {
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('No user available.');
        return;
      }
      await user.reload();
      if (!user.emailVerified) {
        toast.error('Email not verified yet. Please check your inbox.');
        return;
      }

      const idToken = await user.getIdToken(true);
      const cookieRes = await fetch("/api/set-session-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });
      if (!cookieRes.ok) throw new Error('Failed to set session cookie');

      // Redirect so middleware picks up the new session cookie
      window.location.replace('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to continue to dashboard.');
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
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={resendVerification}
              className="btn border bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded cursor-pointer"
            >
              Resend verification email
            </button>
            <button
              type="button"
              onClick={continueAfterVerification}
              className="btn bg-emerald-500 text-white px-3 py-1 rounded cursor-pointer"
            >
              I'm verified — Continue
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="business-name"
              type="text"
              {...register("businessName")}
              className="form-input w-full border border-black dark:border-white rounded-lg"
              required
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
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