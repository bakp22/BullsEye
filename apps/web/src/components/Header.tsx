"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "./common/Logo";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import { UserNav } from "./common/UserNav";
import { usePathname } from "next/navigation";

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
};

const navigation: NavigationItem[] = [
  { name: "Benefits", href: "#Benefits", current: true },
  { name: "Reviews", href: "#reviews", current: false },
];

export default function Header() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Disclosure as="nav" className="bg-gradient-to-br from-[#23272f] to-[#353945] shadow-2xl rounded-3xl sticky top-0 z-30 mt-6 mx-6 px-8 border-2 border-transparent transition-all duration-300 hover:border-blue-400 hover:shadow-[0_0_40px_rgba(0,123,255,0.25)]">
      {({ open }) => (
        <>
          <div className="flex items-center h-20 px-4 sm:px-8 justify-between w-full">
            {/* Left: Only white BullsEye brand */}
            <div className="flex items-center">
              <Link href="/">
                <span className="text-2xl font-extrabold text-white tracking-tight cursor-pointer">BullsEye</span>
              </Link>
            </div>
            {/* Right: Nav Buttons and Avatar */}
            {user ? (
              <div className="hidden sm:flex gap-4 items-center">
                <Link href="/stocks">
                  <button
                    type="button"
                    className="bg-white text-[#23272f] text-lg font-semibold px-6 py-2 rounded-full border border-gray-300 shadow hover:shadow-lg hover:bg-gray-100 transition-all"
                  >
                    Stocks
                  </button>
                </Link>
                <Link href="/stocks/predict">
                  <button
                    type="button"
                    className="bg-white text-[#23272f] text-lg font-semibold px-6 py-2 rounded-full border border-gray-300 shadow hover:shadow-lg hover:bg-gray-100 transition-all"
                  >
                    Predict
                  </button>
                </Link>
                <Link href="/stocks/watchlist">
                  <button
                    type="button"
                    className="bg-white text-[#23272f] text-lg font-semibold px-6 py-2 rounded-full border border-gray-300 shadow hover:shadow-lg hover:bg-gray-100 transition-all"
                  >
                    Watchlist
                  </button>
                </Link>
                <UserNav
                  image={user?.imageUrl || ''}
                  name={user?.fullName || ''}
                  email={user?.primaryEmailAddress?.emailAddress || ''}
                />
              </div>
            ) : (
              <div className="hidden sm:flex gap-6 items-center">
                <Link
                  href="/stocks"
                  className="border rounded-lg border-solid border-[#2D2D2D] text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-[22px] py-2.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/notes"
                  className=" text-white text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-[22px] py-[11px] button"
                >
                  Sign in 
                </Link>
              </div>
            )}
            <div className="block sm:hidden">e
              {/* Mobile menu button*/}
              <DisclosureButton className="relative inline-flex  items-center justify-center rounded-md p-2 text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                {open ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </DisclosureButton>
            </div>
          </div>

          <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 flex flex-col gap-3 items-start">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className="text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal]"
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </DisclosureButton>
              ))}
              <div className="flex gap-6 items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <Link
                  href="/stocks"
                  className="border rounded-lg border-solid border-[#2D2D2D] text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-5 py-[5px]"
                >
                  Sign in
                </Link>
                <Link
                  href="/stocks"
                  className=" text-white text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-5 py-1.5 button"
                >
                  Get Started
                </Link>
              </div>
              {user && (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/stocks"
                    className="text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-5 py-[5px] border border-[#2D2D2D] rounded-lg"
                  >
                    Stocks
                  </Link>
                  <Link
                    href="/stocks/predict"
                    className="text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-5 py-[5px] border border-[#2D2D2D] rounded-lg"
                  >
                    Predict
                  </Link>
                  <Link
                    href="/stocks/watchlist"
                    className="text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-5 py-[5px] border border-[#2D2D2D] rounded-lg"
                  >
                    Watchlist
                  </Link>
                </div>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
