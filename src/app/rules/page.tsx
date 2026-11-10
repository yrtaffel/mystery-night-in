import PageHeader from "@/components/PageHeader";
import { BrainIcon, CATEGORY, Spoon } from "@/components/icons";

const RULES = [
  { title: "Connect from afar", text: "Close the other tabs and be present together." },
  {
    title: "Scratch it, try it",
    text: "You get a week, but no pressure. This is for fun, and technically, there are no rules.",
  },
  { title: "Save the memory", text: "Upload a photo and jot down a few lines." },
  { title: "Share it", text: "Send your photo to your adventure buddy." },
];

function KeyRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex w-10 shrink-0 justify-center">{icon}</span>
      <span className="font-title text-sm tracking-wide uppercase">{label}</span>
    </li>
  );
}

export default function RulesPage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pb-16">
      <PageHeader script="Just for you" />

      <h2 className="mt-2 mb-6 text-center font-script text-[2.6rem] leading-tight">
        <span className="swoosh">Rules</span>
      </h2>
      <ol className="space-y-6 text-center">
        {RULES.map((rule, i) => (
          <li key={rule.title}>
            <p className="font-title text-4xl font-semibold text-lavender-deep">{i + 1}</p>
            <p className="font-semibold">{rule.title}</p>
            <p className="mx-auto max-w-sm text-sm text-ink-soft">{rule.text}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 mb-6 text-center font-script text-[2.6rem] leading-tight">
        <span className="swoosh">What the icons mean</span>
      </h2>
      <ul className="mx-auto max-w-sm space-y-3">
        <KeyRow icon={<span className="font-title text-2xl font-semibold">$</span>} label="Approximate cost" />
        <KeyRow icon={<span className="text-2xl">⏰</span>} label="Best time to do it" />
        <KeyRow icon={<span className="text-2xl">⏳</span>} label="About how long it takes" />
        <KeyRow icon={<Spoon className="h-7 w-7" />} label="Spoons: energy needed (1–5)" />
        <KeyRow icon={<BrainIcon className="h-7 w-7" />} label="Brains: mental effort (1–5)" />
        {Object.entries(CATEGORY).map(([key, { label, Icon }]) => (
          <KeyRow key={key} icon={<Icon className="h-7 w-7" />} label={label} />
        ))}
      </ul>
    </main>
  );
}
