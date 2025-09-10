export default function Features() {
  const features = [
    {
      title: 'Streamlined Online Ordering',
      description: 'Accept orders via QR code or link — no app required. Simple for your customers, efficient for you.',
    },
    {
      title: 'USDC-Native Payments',
      description: 'Enjoy near-zero transaction fees with instant digital dollar payments. Keep more of what you earn.',
    },
    {
      title: 'Tailored for Mom & Pop Shops',
      description: 'Whether you run a café, food truck, or corner restaurant — our tools are designed for you.',
    },
    {
      title: 'Instant Setup',
      description: 'Launch your ordering page in minutes. Our platform works out of the box so you can focus on food.',
    },
    {

      title: 'AI Assistant for Smarter Business Decisions (Coming Soon)',
      description: 'Get personalized suggestions based on customer feedback and order trends. Know what’s working, what needs fixing, and how to stock smarter — powered by real-time data.',
    },
    {
      title: 'Built-in Loyalty Features (Coming Soon)',
      description: 'Encourage repeat visits with simple, automated rewards — no punch cards required.',
    },
  ];

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t py-12 md:py-20">
          <div className="mx-auto max-w-3xl pb-4 text-center md:pb-12">
            <h2 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-x">
              Everything You Need — Nothing You Don’t
            </h2>
            <p className="text-lg text-emerald-800 dark:text-emerald-100 pt-4">
              Simple, powerful tools to help local food businesses thrive.
            </p>
          </div>
          <div className="mx-auto grid max-w-sm gap-12 sm:max-w-none sm:grid-cols-2 md:gap-x-14 md:gap-y-16 lg:grid-cols-3">
            {features.map((item, index) => (
              <article key={index}>
                <h3 className="mb-1 text-lg font-semibold text-amber-700 dark:text-amber-300">
                  {item.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}