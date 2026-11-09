import CardBook from "@/components/CardBook";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <header className="pt-10 pb-4 text-center">
        <h1 className="font-title text-4xl font-semibold uppercase tracking-wide">
          Atara&apos;s Mystery Night In
        </h1>
        <p className="mt-1 font-script text-4xl">Unknown adventure awaits!</p>
      </header>
      <CardBook />
    </main>
  );
}
