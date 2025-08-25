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
                className="btn group bg-gradient-to-r from-emerald-500 to-emerald-400 text-white dark:text-black hover:from-emerald-400 hover:to-emerald-300 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
                href="signup"
              >
                <span className="relative inline-flex items-center">
                  Start Growing
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
    </section>
  );
}