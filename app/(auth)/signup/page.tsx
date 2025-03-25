export const metadata = {
  title: "Sign Up - Open PRO",
  description: "Page description",
};

import Link from "next/link";

export default function SignUp() {

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-green-200),var(--color-sky-200),var(--color-green-50),var(--color-sky-300),var(--color-green-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Create an account
            </h1>
          </div>
          {/* Contact form */}
          <form className="mx-auto max-w-[400px]">
            <div className="space-y-5">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-sky-200/65"
                  htmlFor="name"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-input w-full"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-sky-200/65"
                  htmlFor="name"
                >
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="company"
                  type="text"
                  className="form-input w-full"
                  placeholder="Your business name"
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-sky-200/65 border-sky-200/65"
                  htmlFor="business type"
                >
                  Business Type 
                  </label>
          <select
            id="business-type"
            className="w-full rounded-lg text-sm font-medium text-sky-200/65 bg-transparent"
          >
            <option value="restaurant">Restaurant</option>
            <option value="sky">sky/Coffee Shop</option>
            <option value="bakery">Bakery</option>
            <option value="bar">Bar/Pub</option>
            <option value="food-truck">Food Truck</option>
            <option value="other">Other</option>
          </select>
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-sky-200/65"
                  htmlFor="email"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input w-full"
                  placeholder="Your work email"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-sky-200/65"
                  htmlFor="password"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input w-full"
                  placeholder="Password (at least 10 characters)"
                />
              </div>
            </div>
            <div className="mt-6 space-y-5">
              <button className="btn w-full bg-linear-to-t from-sky-600 to-sky-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]">
                Register
              </button>
              <div className="flex items-center gap-3 text-center text-sm italic text-green-600 before:h-px before:flex-1 before:bg-linear-to-r before:from-transparent before:via-green-400/25 after:h-px after:flex-1 after:bg-linear-to-r after:from-transparent after:via-green-400/25">
                or
              </div>
              <button className="btn relative w-full bg-linear-to-b from-green-800 to-green-800/60 bg-[length:100%_100%] bg-[bottom] text-green-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-green-800),var(--color-green-700),var(--color-green-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%]">
                Sign In with Google
              </button>
            </div>
          </form>
          {/* Bottom link */}
          <div className="mt-6 text-center text-sm text-sky-200/65">
            Already have an account?{" "}
            <Link className="font-medium text-sky-500" href="/signin">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
