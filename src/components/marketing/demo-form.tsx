"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { toast } from 'sonner';

// Schema for form validation
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  excitement: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function DemoForm() {
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
      // Store in Firestore
      await addDoc(collection(db, "demos"), {
        name: data.name,
        email: data.email,
        createdAt: new Date(),
      });

      setSuccess(true);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error("Error: " + error.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      <h1 className="pb-12 w-full max-w-4xl text-center font-semibold md:text-5xl bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-x">
      Schedule a 10-Minute Demo
      </h1>
      <p className="pb-12 w-full text-center text-lg text-emerald-800 dark:text-emerald-100">
      If you&apos;re interested in a demo or have any questions, 
      <br />
      reach out to demos@gromopo.com or leave your details below:
      </p>
      {success ? (
        <div>
          <h2>🎉 Excellent!</h2>
          <p>We&apos;ll email you to connect.</p>
        </div>
      ) : (
        // center the form
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col items-center">
          <div className="w-full max-w-2xl">
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
          <div className="w-full max-w-2xl">
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full max-w-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white dark:text-black hover:from-amber-500 hover:to-emerald-500 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            {isSubmitting ? "Sending..." : "Join Our Journey"}
          </button>
        </form>
      )}
    </div>
  );
}