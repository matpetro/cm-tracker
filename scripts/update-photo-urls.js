import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const filePath = join(__dirname, '..', 'src', 'data', 'players.json')

function transformPhotoUrl(oldUrl) {
  // Match old format: https://cdn.sofifa.org/players/4/19/{id}.png
  const match = oldUrl.match(/cdn\.sofifa\.org\/players\/\d+\/(\d+)\/(\d+)\.png/)
  if (!match) return oldUrl
  const year = match[1]           // e.g. "19"
  const id = match[2].padStart(6, '0') // e.g. "020801"
  const part1 = id.slice(0, 3)    // "020"
  const part2 = id.slice(3)       // "801"
  return `https://cdn.sofifa.net/players/${part1}/${part2}/${year}_120.png`
}

const players = JSON.parse(readFileSync(filePath, 'utf8'))

let updated = 0
const result = players.map((p) => {
  if (!p.photo || !p.photo.includes('cdn.sofifa.org')) return p
  const newPhoto = transformPhotoUrl(p.photo)
  if (newPhoto !== p.photo) updated++
  return { ...p, photo: newPhoto }
})

writeFileSync(filePath, JSON.stringify(result, null, 2))
console.log(`✅ Updated ${updated} photo URLs in players.json`)
