import PageHeader from "@/components/PageHeader";
import ProgressView from "@/components/ProgressView";

export default function ProgressPage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <PageHeader script="Look how far you've come!" />
      <ProgressView />
    </main>
  );
}
