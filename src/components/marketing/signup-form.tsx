"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase/config"; //import auth here
//import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

// Schema for form validation
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.enum(["restaurant", "cafe", "bakery", "bar", "food-truck", "other"]),
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
      /*
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        "temporary-password"
      );

      await updateProfile(userCredential.user, {
        displayName: data.name,
      });
      
      await sendEmailVerification(userCredential.user);
      */
      // Store in Firestore
      await addDoc(collection(db, "subscribers"), {
        name: data.name,
        email: data.email,
        businessName: data.businessName,
        businessType: data.businessType,
        verified: false, // Will be updated once verified
        createdAt: new Date(),
      });

      setSuccess(true);
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
      <h1 className="pb-12 bg-clip-text text-3xl font-semibold md:text-4xl">
      Signup for early access
      </h1>
      {success ? (
        <div>
          <h2>🎉 Success!</h2>
          <p>We&apos;ll email you as soon we&apos;re ready to onboard you for early access.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="name"
              {...register("name")}
              className="form-input w-full border rounded-lg"
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
              className="form-input w-full border rounded-lg"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="businessName"
                type="businessName"
                {...register("businessName")}
                className="form-input w-full border rounded-lg"
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
                className="w-full border rounded-lg text-sm font-medium"
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            {isSubmitting ? "Sending..." : "Get Early Access"}
          </button>
        </form>
      )}
    </div>
  );
}