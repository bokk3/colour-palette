import { PaletteGenerator } from "@/components/PaletteGenerator";

export default function Home(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto py-8">
        <PaletteGenerator />
      </main>
    </div>
  );
}
