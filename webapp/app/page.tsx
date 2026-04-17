import Image from "next/image";
import { italianno } from "./fonts";

export default function Home() {
  return (
    <main className="w-screen min-h-screen dark">
      <section className="w-screen h-screen relative bg-gray-950 text-white p-32">
        <div className="relative w-full text-center z-10">
          <p className="text-center font-semibold text-lg">vibeloop</p>
          <h1 className={`${italianno.className} z-10 w-full text-center text-6xl md:text-8xl leading-none`}>
            &quot;tech made us stay inside,<br />
            it&apos;s time to make it get us outside&quot;
          </h1>

          <div className="flex justify-center items-center gap-8 mt-8">
            <button className="cursor-pointer rounded border-4 border-white/90 bg-white/14 px-4 py-2 text-white font-bold backdrop-blur-sm transition-colors hover:border-white hover:bg-white/90 hover:text-gray-950">
              jump in
            </button>
            <button className="cursor-pointer rounded border-4 border-zinc-700/80 bg-zinc-950/55 px-4 py-2 text-lg font-semibold text-zinc-100 backdrop-blur-sm transition-colors hover:border-zinc-700 hover:bg-zinc-700/80">
              learn more
            </button>
          </div>
        </div>

        <div className="w-screen h-screen top-0 left-0 absolute flex items-center justify-center p-8 ">
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
    </main>
  );
}
