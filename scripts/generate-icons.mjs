import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#4F46E5') // indigo-600
  gradient.addColorStop(1, '#7C3AED') // violet-600

  // Draw rounded rectangle background
  const radius = size * 0.2
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(size - radius, 0)
  ctx.quadraticCurveTo(size, 0, size, radius)
  ctx.lineTo(size, size - radius)
  ctx.quadraticCurveTo(size, size, size - radius, size)
  ctx.lineTo(radius, size)
  ctx.quadraticCurveTo(0, size, 0, size - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  // Draw emoji 🎯
  ctx.font = `${size * 0.6}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🎯', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

// Generate icons
const sizes = [192, 512]
sizes.forEach((size) => {
  const buffer = generateIcon(size)
  writeFileSync(`public/icons/icon-${size}.png`, buffer)
  console.log(`✅ Generated icon-${size}.png`)
})

console.log('🎉 All icons generated!')
