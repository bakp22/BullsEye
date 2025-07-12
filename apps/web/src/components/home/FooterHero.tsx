import Image from "next/image";
import Link from "next/link";
import React from "react";

const FooterHero = () => {
  return (
    <div className="bg-blue-600">
      <div className="container mx-auto py-16 px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="max-w-2xl mb-8 lg:mb-0">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Start Your Intelligent Note-Taking Journey
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Sign up now and experience the power of AI-enhanced note-taking with
              UseNotes
            </p>
            <Link href={"/stocks"}>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Started For Free
              </button>
            </Link>
          </div>
          <div>
            <Image
              src="/images/monitor.png"
              alt="hero"
              width={400}
              height={300}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterHero;
