import Image from "next/image";
import AdventureCard from "@/components/AdventureCard";
import { getAdventures } from "../lib/adventures";

// Add this to force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch adventures from the database
  const adventures = await getAdventures(5);
  
  // Use database adventures if available, otherwise use fallback
  const displayAdventures = adventures.length > 0 ? adventures : [];

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Header section */}
      <header className="w-full max-w-3xl text-center sm:text-left">
        <h1 className="text-4xl font-bold mb-2">Agent 2</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Exploring agents, this time with a daily suggestion for an adventure based on the weather in Boston
        </p>
      </header>
      
      {/* Main content with adventures */}
      <main className="w-full max-w-3xl">
        <h2 className="text-2xl font-semibold mb-6">Daily Adventures</h2>
        
        <div className="space-y-6">
          {displayAdventures.map((adventure, index) => (
            <AdventureCard
              key={index}
              date={adventure.date}
              weather={adventure.weather}
              suggestion={adventure.suggestion}
              location={adventure.location}
              isToday={adventure.isToday}
              isYesterday={adventure.isYesterday}
            />
          ))}
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.ryanaubrey.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Built by ryanaubrey.com →
        </a>
      </footer>
    </div>
  );
}
