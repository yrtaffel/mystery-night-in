import BirthdayWelcome from "@/components/BirthdayWelcome";
import CardBook from "@/components/CardBook";
import PageHeader from "@/components/PageHeader";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <PageHeader script="Unknown adventure awaits!" />
      <CardBook />
      <BirthdayWelcome />
    </main>
  );
}
