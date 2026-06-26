import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("classes")
    .select("id")
    .limit(1);

  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <h1 className="text-3xl font-bold">
        Supabase connection test
      </h1>

      {error ? (
        <div className="mt-6 rounded-xl bg-amber-950 p-4 text-amber-200">
          <p className="font-bold">
            Supabase responded
          </p>

          <p className="mt-2">
            {error.message}
          </p>

          <p className="mt-2 text-sm">
            An error saying that the classes table does
            not exist is expected for now.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-emerald-950 p-4 text-emerald-200">
          Supabase is connected.
        </div>
      )}
    </main>
  );
}