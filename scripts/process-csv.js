import { createReadStream, writeFileSync, mkdirSync, existsSync } from 'fs'
import { createInterface } from 'readline'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const csvPath = join(__dirname, '..', 'data.csv')
const outDir = join(__dirname, '..', 'src', 'data')
const outPath = join(outDir, 'players.json')

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true })
}

const rl = createInterface({
  input: createReadStream(csvPath),
  crlfDelay: Infinity,
})

const players = []
let headers = null
let lineNum = 0

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

rl.on('line', (line) => {
  if (!line.trim()) return
  const cols = parseCSVLine(line)
  if (lineNum === 0) {
    headers = cols
    lineNum++
    return
  }
  lineNum++

  const get = (name) => {
    const idx = headers.indexOf(name)
    return idx !== -1 ? (cols[idx] || '').trim() : ''
  }

  const id = get('ID')
  const name = get('Name')
  const rawPhoto = get('Photo')
  const nationality = get('Nationality')
  const flag = get('Flag')
  const club = get('Club')
  const clubLogo = get('Club Logo')
  const overall = get('Overall')
  const position = get('Position')

  if (!id || !name) return

  // Transform photo URL: cdn.sofifa.org/players/4/19/{id}.png
  //                   -> cdn.sofifa.net/players/{id[0:3]}/{id[3:6]}/19_120.png
  function transformPhoto(url, playerId) {
    const match = url.match(/cdn\.sofifa\.org\/players\/\d+\/(\d+)\/\d+\.png/)
    if (!match) return url
    const year = match[1]
    const paddedId = playerId.padStart(6, '0')
    return `https://cdn.sofifa.net/players/${paddedId.slice(0, 3)}/${paddedId.slice(3)}/${year}_120.png`
  }

  const photo = transformPhoto(rawPhoto, id)

  players.push({
    id,
    name,
    photo,
    nationality,
    flag,
    club,
    clubLogo,
    overall: parseInt(overall) || 0,
    position,
    owners: [],
  })
})

rl.on('close', () => {
  writeFileSync(outPath, JSON.stringify(players, null, 2))
  console.log(`✅ Processed ${players.length} players -> ${outPath}`)
})

rl.on('error', (err) => {
  console.error('Error reading CSV:', err)
  process.exit(1)
})
