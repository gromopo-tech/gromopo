export default function Cta() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -mb-24 ml-20 -transky-x-1/2"
        aria-hidden="true"
      >
      </div>
      <div className="max-w6xl mx-auto px-4 sm:px-6">
        <div className="bg-linear-to-r from-transparent via-fuchsia-500 py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent animate-gradient-x pb-8 text-3xl font-semibold text-transparent md:text-4xl"
              data-aos="fade-up"
            >
              Join the customer-first platform
            </h2>
            <div className="mx-auto flex flex-col sm:flex-row gap-6 sm:justify-center">
              <div className="flex flex-col sm:flex-row gap-4" data-aos="fade-up" data-aos-delay={400}>
                <a
                  className="btn bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white dark:text-black hover:from-fuchsia-600 hover:to-cyan-500 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400"
                  href="signup"
                >
                  <span className="relative inline-flex items-center">
                    Get early access
                    <span className="ml-1 tracking-normal transition-transform">
                      -&gt;
                    </span>
                  </span>
                </a>
                <a
                  className="btn bg-cyan-100 text-cyan-800 hover:bg-cyan-200 text-black px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
                  href="partners"
                >
                  <span className="relative inline-flex items-center">
                    Investors & Advisors
                    <span className="ml-1 tracking-normal transition-transform">
                      -&gt;
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
