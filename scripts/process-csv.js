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
  const rawFlag = get('Flag')
  const nationality = get('Nationality')
  const club = get('Club')
  const rawClubLogo = get('Club Logo');
  const overall = get('Overall')
  const position = get('Position')

  if (!id || !name) return

  // --- NEW TRANSFORMATION LOGIC ---
  
  // 1. Photo: Standardize to FIFA Index Player IDs
  const photo = `https://fifastatic.fifaindex.com/FIFA19/images/players/5/${id}.png`;

  // 2. Flag: Extract SoFIFA ID from URL and Map to FIFA Index
  let finalFlag = rawFlag;
  const flagMatch = rawFlag.match(/\/(\d+)\.png/);
  if (flagMatch) {
    const sofifaFlagId = flagMatch[1];
    const targetFlagId =  sofifaFlagId;
    finalFlag = `https://fifastatic.fifaindex.com/FIFA19/images/flags/2/${targetFlagId}.png`;
  }

  let finalClubLogo = rawClubLogo;
  
  // Extract the ID (e.g., 241) from the SoFIFA URL
  const clubMatch = rawClubLogo.match(/\/(\d+)\.png/);
  
  if (clubMatch) {
    const clubId = clubMatch[1];
    // Reconstruct using the FIFA Index path
    finalClubLogo = `https://fifastatic.fifaindex.com/FIFA19/images/crest/3/light/${clubId}.png`;
  }

  players.push({
    id,
    name,
    photo,
    nationality,
    flag: finalFlag,
    club,
    finalClubLogo,
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