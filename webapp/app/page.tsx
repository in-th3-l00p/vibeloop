import Image from "next/image";
import { italianno } from "./fonts";

export default function Home() {
  return (
    <main className="w-full min-h-screen dark overflow-x-hidden">
      <section className="w-full h-screen relative bg-gray-950 text-white p-32">
        <div className="relative w-full text-center z-10">
          <p className="text-center font-semibold text-lg">vibeloop</p>
          <h1 className={`${italianno.className} z-10 w-full text-center text-6xl md:text-8xl leading-none drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]`}>
            &quot;tech made us stay inside,<br />
            it&apos;s time to make it get us outside&quot;
          </h1>

          <div className="flex justify-center items-center gap-8 mt-8">
            <a href="/dashboard" className="cursor-pointer rounded border-4 border-white/90 bg-white/14 px-4 py-2 text-white font-bold backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 hover:border-white hover:bg-white/90 hover:text-gray-950 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
              jump in
            </a>
            <a href="#about" className="cursor-pointer rounded border-4 border-zinc-700/80 bg-zinc-950/55 px-4 py-2 text-lg font-semibold text-zinc-100 backdrop-blur-sm shadow-[0_0_12px_rgba(255,255,255,0.06)] transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-700/80 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]">
              learn more
            </a>
          </div>
        </div>

        <div className="w-full h-full top-0 left-0 absolute flex items-center justify-center p-8">
          <Image
            src="/background.png"
            width={1920}
            height={1080}
            alt="game's room"
            draggable={false}
            className="object-cover w-full h-full rounded-2xl opacity-60"
            loading="eager"
          />
        </div>

      </section>

      <section id="about" className="w-full min-h-screen relative bg-gray-950 text-white flex items-center scroll-mt-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.03)_0%,_transparent_60%)]" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-8 md:px-16 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-500">
              About us
            </p>
            <h2 className={`${italianno.className} text-5xl md:text-7xl leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]`}>
              Where the real world meets the loop
            </h2>
            <div className="w-16 h-[2px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.15)]" />
          </div>

          <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
