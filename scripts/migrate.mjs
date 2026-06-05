/**
 * Migration runner — run once after providing Supabase personal access token.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your-token node scripts/migrate.mjs
 *
 * Get your token at: https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'sutfchttltwsqmxewsna'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!TOKEN) {
  console.error('❌ Set SUPABASE_ACCESS_TOKEN environment variable first.')
  console.error('   Get it from: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const migrations = [
  join(__dirname, '../supabase/migrations/001_initial.sql'),
  join(__dirname, '../supabase/migrations/002_increment_usage.sql'),
]

async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  return res.json()
}

console.log('🚀 Running migrations...\n')

for (const file of migrations) {
  const name = file.split(/[\\/]/).pop()
  process.stdout.write(`  Running ${name}... `)
  try {
    const sql = readFileSync(file, 'utf8')
    await runSQL(sql)
    console.log('✅')
  } catch (err) {
    console.log('❌')
    console.error(`  Error: ${err.message}`)
    process.exit(1)
  }
}

console.log('\n✅ All migrations completed!')
console.log('   Your Supabase database is ready.\n')
