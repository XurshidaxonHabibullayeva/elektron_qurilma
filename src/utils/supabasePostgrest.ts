/** PostgREST / Supabase: chaqiriladigan RPC Postgresda yo‘qligida keladigan xabarlar. */
export function isMissingPostgrestRpc(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('could not find the function') ||
    m.includes('could not find the procedure') ||
    (m.includes('function') && m.includes('does not exist')) ||
    m.includes('undefined_function') ||
    m.includes('42883')
  )
}
