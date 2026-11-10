import SiteNav from "./SiteNav";

export default function PageHeader({ script }: { script?: string }) {
  return (
    <>
      <SiteNav />
      <header className="pt-6 pb-4 text-center">
        <h1 className="font-title text-4xl font-semibold uppercase tracking-wide">
          Atara&apos;s Mystery Night In
        </h1>
        {script && <p className="mt-1 font-script text-[clamp(1.7rem,9vw,2.25rem)]">{script}</p>}
      </header>
    </>
  );
}
