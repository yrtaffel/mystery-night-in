import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import RiddleTrail from "@/components/RiddleTrail";

export default function TrailPage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <PageHeader script="The Riddle Trail" />
      <RiddleTrail />
      <p className="mt-6 text-center text-sm">
        <Link href="/#c12" className="underline">← Back to the card</Link>
      </p>
    </main>
  );
}
