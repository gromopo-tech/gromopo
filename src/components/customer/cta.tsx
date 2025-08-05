export default function Cta() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w6xl mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-x pb-8 text-3xl font-semibold md:text-4xl" data-aos="fade-up">
            Ready to modernize your business without the fees?
          </h2>
          <div className="mx-auto flex flex-col sm:flex-row gap-6 sm:justify-center">
            <div className="flex flex-col sm:flex-row gap-4" data-aos="fade-up" data-aos-delay={400}>
              <a
                className="btn bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 text-white dark:text-black hover:from-amber-400 hover:to-emerald-600 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
                href="signup"
              >
                <span className="relative inline-flex items-center">
                  Launch My Ordering Page
                  <span className="ml-1 tracking-normal transition-transform">-&gt;</span>
                </span>
              </a>
              <a
                className="btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white dark:text-black px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
                href="demo"
              >
                <span className="relative inline-flex items-center">
                  Book a 10-Min Demo
                  <span className="ml-1 tracking-normal transition-transform">-&gt;</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}