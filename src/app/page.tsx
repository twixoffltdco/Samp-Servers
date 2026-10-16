import { RadarClient } from "@/components/radar/radar-client";
import { RadarFooter } from "@/components/radar/footer";
import { RadarHeader } from "@/components/radar/header";

export default function IndexPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <RadarHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <RadarClient />
      </main>

      <RadarFooter />
    </div>
  );
}
