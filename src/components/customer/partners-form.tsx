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

export default function PartnersForm() {
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
      await addDoc(collection(db, "partners"), {
        name: data.name,
        email: data.email,
        excitement: data.excitement,
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
      <h1 className="pb-12 w-full max-w-4xl text-center bg-[length:800%_auto] bg-clip-text text-3xl font-semibold md:text-4xl">
      Interested in supporting GroMoPo?
      </h1>
      <p className="pb-12 w-full max-w-2xl text-center max-w-2xl text-lg">
      If you&apos;re an investor or industry advisor excited about growing mom and pop shops in the food and beverage industry, 
      we&apos;d love to connect. 
      <br />
      Reach out to partners@gromopo.com or leave your details below:
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
              className="form-input w-full border rounded-lg"
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
              className="form-input w-full border rounded-lg"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="w-full max-w-2xl">
              <label htmlFor="name" className="block text-sm font-medium">
                What problems excite you the most about mom and pop shops in the food and beverage industry?
              </label>
              <input
                id="excitement"
                type="excitement"
                {...register("excitement")}
                className="form-input w-full border rounded-lg"
              />
              {errors.excitement && (
                <p className="mt-1 text-sm text-red-600">{errors.excitement.message}</p>
              )}
            </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            {isSubmitting ? "Sending..." : "Join Our Journey"}
          </button>
        </form>
      )}
    </div>
  );
}