import sharp from "sharp"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, "..", "public")

function makeSvg(size) {
  const r = Math.round(size * 0.2)
  const inner = Math.round(size * 0.46)
  const offset = Math.round(size * 0.27)
  const innerR = Math.round(size * 0.1)
  const fontSize = Math.round(size * 0.28)
  const textY = Math.round(size * 0.65)

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0a0a0b"/>
  <rect x="${offset}" y="${offset}" width="${inner}" height="${inner}" rx="${innerR}" fill="#6366f1"/>
  <text x="${size / 2}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" text-anchor="middle">M</text>
</svg>`
}

await sharp(Buffer.from(makeSvg(192))).png().toFile(join(publicDir, "icon-192.png"))
await sharp(Buffer.from(makeSvg(512))).png().toFile(join(publicDir, "icon-512.png"))

console.log("✓ icon-192.png")
console.log("✓ icon-512.png")
