import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import WyrStart from "@/components/WyrStart";

export default function RatherPage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <PageHeader script="Would You Rather" />
      <WyrStart />
      <p className="mt-8 text-center text-sm">
        <Link href="/" className="underline">← Back to the cards</Link>
      </p>
    </main>
  );
}
