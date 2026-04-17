import Image from "next/image";
import { italianno } from "./fonts";

export default function Home() {
  return (
    <main className="w-screen min-h-screen">
      <section className="w-screen h-screen relative bg-gray-950 p-32">
        <div className="relative w-full text-center z-10">
          <p className="text-center font-semibold text-lg">vibeloop</p>
          <h1 className={`${italianno.className} z-10 w-full text-center text-6xl md:text-8xl leading-none`}>
            tech made us stay inside,<br />
            it&apos;s time to make it get us outside
          </h1>
        </div>

        <div className="w-screen h-screen top-0 left-0 absolute flex items-center justify-center p-8 ">
          <Image
            src="/background.png"
            width={1920}
            height={1080}
            alt="game's room"
            className="object-cover w-full h-full rounded-2xl opacity-60"
          />
        </div>

      </section>
    </main>
  );
}
