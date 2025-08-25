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
                className="rounded-lg w-full"
                style={{ width: "auto", height: "auto" }}
                priority={true}
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
    <div className="hero-images flex justify-center gap-4 mt-8 max-w-6xl mx-auto px-4">
      {images.map((image, index) => (
        <div key={index} className="flex-1 max-w-[300px]">
          <Image
            src={image.src}
            width={400}
            height={300}
            alt={image.alt}
            className="rounded-lg object-cover w-full h-auto"
            style={{ maxWidth: "100%", height: "auto" }}
            priority={true}
          />
        </div>
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
              className="pb-5 text-4xl font-semibold md:text-5xl bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent animate-gradient-x"
              data-aos="fade-up"
            >
              Growing mom and pop shops
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-lg text-emerald-800 dark:text-emerald-100 pt-4"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                An all-in-one AI assistant and ordering platform built for mom and pop shops in the food and beverage industry. Simplify orders, cut costs, and grow your business with modern tools — without the middlemen.
              </p>
              <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
                <div className="flex flex-col sm:flex-row gap-4" data-aos="fade-up" data-aos-delay={400}>
                  <a
                    className="btn group bg-gradient-to-r from-emerald-500 to-emerald-400 text-white dark:text-black hover:from-emerald-400 hover:to-emerald-300 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
                    href="signup"
                  >
                    <span className="relative inline-flex items-center">
                      Start growing
                      <span className="ml-1 tracking-normal transform transition-transform group-hover:translate-x-1">-&gt;</span>
                    </span>
                  </a>
                  <a
                    className="btn group bg-gradient-to-r from-amber-500 to-amber-400 text-white dark:text-black hover:from-amber-400 hover:to-amber-300 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
                    href="demo"
                  >
                    <span className="relative inline-flex items-center">
                      Schedule Demo
                      <span className="ml-1 tracking-normal transform transition-transform group-hover:translate-x-1">-&gt;</span>
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
