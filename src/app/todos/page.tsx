import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch todos if the table exists (with a safe catch-all to prevent runtime crashes if table is not built yet)
  const { data: todos, error } = await supabase.from('todos').select();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
      <h1 className="text-xl font-bold text-medical-blue font-display">Supabase Database Connectivity</h1>
      {error && <p className="text-xs text-rose-400">Error: {JSON.stringify(error)}</p>}
      <ul className="space-y-2 text-sm text-slate-300">
        {todos && todos.length > 0 ? (
          todos.map((todo: any) => (
            <li key={todo.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
              {todo.name}
            </li>
          ))
        ) : (
          <li className="italic text-slate-500">No todo items found in 'todos' table.</li>
        )}
      </ul>
      <a href="/" className="text-xs font-semibold text-medical-teal hover:underline mt-4">
        &larr; Back to Dashboard
      </a>
    </div>
  )
}
