import { PaletteGenerator } from "@/components/PaletteGenerator";

export default function Home(): React.JSX.Element {
  return (
    <div className="h-screen bg-white overflow-hidden">
      <PaletteGenerator />
    </div>
  );
}
