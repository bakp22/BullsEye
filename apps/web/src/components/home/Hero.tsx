import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              The Ultimate Stock Market Tracker
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              BullsEye harnesses the power of artificial intelligence to
              revolutionize the way you capture, organize, and recall your
              stock market predictions.
            </p>
            <Link href={"/stocks"}>
              <button className="button">
                Get Started
              </button>
            </Link>
          </div>
          <div className="mt-8 lg:mt-0">
            <Image
              src="/images/hero.png"
              alt="Hero"
              width={500}
              height={400}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
