import Image from "next/image";

const benefits = [
  {
    title: "AI-Powered Algorithms",
    description: "Automatically generate concise predicictions of the market using advanced AI technology.",
    image: "/images/bot.png",
  },
  {
    title: "Smart Organization",
    description: "Easily organize and categorize your stocks with our seamless watchlist feautre",
    image: "/images/cloudSync.png",
  },
  {
    title: "Real-time Feed",
    description: "Access your market data across all devices with seamless cloud synchronization.",
    image: "/images/monitor.png",
  },
  {
    title: "Stock Integration",
    description: "Track stock prices and market data alongside and conjure up your own strategies.",
    image: "/images/stock.png",
  },
];

const Benefits = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose BullsEye?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Predict stock prices with our advanced AI model and stay ahead of the market no matter what curveballs the market throws at you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Image
                    src={benefit.image}
                    width={60}
                    height={60}
                    alt={benefit.title}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
