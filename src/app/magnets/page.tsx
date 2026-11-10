import Link from "next/link";
import MagnetsStart from "@/components/MagnetsStart";
import PageHeader from "@/components/PageHeader";

export default function MagnetsPage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <PageHeader script="Fridge Magnets" />
      <MagnetsStart />
      <p className="mt-8 text-center text-sm">
        <Link href="/#c14" className="underline">← Back to the card</Link>
      </p>
    </main>
  );
}
