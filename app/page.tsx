import RaceList from "@/components/race/raceList";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">QRA Race Control</h1>
          </div>
          <div className="mt-4 md:mt-0">
          </div>
        </div>
      </header>
      <RaceList />
    </div>
  );
}
