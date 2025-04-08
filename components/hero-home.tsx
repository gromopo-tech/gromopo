import Image from "next/image";
import CoffeeShopImg from "@/public/images/coffee-shop.png";
import FoodTruckImg from "@/public/images/food-truck.png";
import WineRoomImg from "@/public/images/wine-room.png";

export default function HeroHome() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-green-800),var(--color-sky-800),var(--color-green-950),var(--color-sky-950),var(--color-green-800))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              Introducing a customer-obsessed platform to grow food and beverage businesses
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-sky-800/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                Streamline order taking and eliminate lines while increasing customer satisfaction
                with our easy-to-use platform tailored specifically for mom and pop shops.
                <br></br>
                Join us today to get exclusive early access!
              </p>
              <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
                <div data-aos="fade-up" data-aos-delay={400}>
                  <a
                    className="btn group mb-4 w-full bg-linear-to-t from-orange-400 to-orange-500 bg-[length:100%_100%] bg-[bottom] text-orange-200 shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="/auth/signup"
                  >
                    <span className="relative inline-flex items-center">
                      Get early access
                      <span className="ml-1 tracking-normal text-orange-200 transition-transform group-hover:tranneutral-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-images flex justify-center gap-4 mt-8">
          <Image
            src={CoffeeShopImg}
            width={400}
            alt="Coffee Shop"
            className="rounded-lg"
          />
          <Image
            src={FoodTruckImg}
            width={400}
            alt="Food Truck"
            className="rounded-lg"
          />
          <Image
            src={WineRoomImg}
            width={400}
            alt="Wine Room"
            className="rounded-lg"
          />
          </div>
        </div>
      </div>
    </section>
  );
}
