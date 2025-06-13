"use client";
import Image from "next/image";
import { useState, useEffect } from 'react';

const HeroImages = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = [
    { src: "/images/coffee-shop.png", alt: "Coffee Shop" },
    { src: "/images/food-truck.png", alt: "Food Truck" },
    { src: "/images/wine-room.png", alt: "Wine Room" }
  ];

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px is a common breakpoint for tablets
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-advance slideshow on mobile
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isMobile, images.length]);

  if (isMobile) {
    // Mobile view - slideshow
    return (
      <div className="hero-slideshow relative w-full max-w-[400px] mx-auto mt-8 overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <Image
                src={image.src}
                width={400}
                height={300}
                alt={image.alt}
                className="rounded-lg w-full h-[300px]"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        
        {/* Slide indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-gray-800' : 'bg-gray-300'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop view - side by side images
  return (
    <div className="hero-images flex justify-center gap-4 mt-8 max-w-6xl mx-auto">
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.src}
          width={400}
          height={300}
          alt={image.alt}
          className="rounded-lg object-cover w-[300px] h-[225px] md:w-[400px] md:h-[300px]"
          priority={index === 0}
        />
      ))}
    </div>
  );
};

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
              Growing food and beverage businesses
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-sky-800/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                Streamline ordering and reward loyalty to keep your customers coming back for more.
                <br></br>
                Join us today to get exclusive early access!
              </p>
              <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
                <div data-aos="fade-up" data-aos-delay={400}>
                  <a
                    className="btn group mb-4 w-full bg-linear-to-t from-orange-400 to-orange-500 bg-[length:100%_100%] bg-[bottom] text-orange-200 shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="signup"
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
          <HeroImages />
        </div>
      </div>
    </section>
  );
}
