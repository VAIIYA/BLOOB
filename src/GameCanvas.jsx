import { useEffect, useRef } from 'react'

const COLORS = ['#3ecf60','#3498db','#e74c3c','#9b59b6','#f39c12','#1abc9c','#e67e22','#e91e63']

function randomBetween(a, b) { return a + Math.random() * (b - a) }

export default function GameCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    let cells = []

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function spawnCell() {
      const r = randomBetween(18, 70)
      return {
        x: randomBetween(r, canvas.width - r),
        y: randomBetween(r, canvas.height - r),
        r,
        vx: randomBetween(-0.4, 0.4),
        vy: randomBetween(-0.4, 0.4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: randomBetween(0.08, 0.22),
        name: Math.random() > 0.6 ? randomName() : '',
        label: Math.random() > 0.7,
      }
    }

    const NAMES = ['Player','Germ','Cell','Amoeba','Virus','Bacteria','Nucleus','Blob']
    function randomName() { return NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random()*999) }

    function init() {
      resize()
      cells = Array.from({ length: 35 }, spawnCell)
    }

    function drawCell(c) {
      ctx.save()
      ctx.globalAlpha = c.alpha
      // Cell body
      const grad = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.1, c.x, c.y, c.r)
      grad.addColorStop(0, lighten(c.color))
      grad.addColorStop(1, c.color)
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      // Outline
      ctx.strokeStyle = c.color
      ctx.lineWidth = 2
      ctx.globalAlpha = c.alpha * 1.5
      ctx.stroke()
      ctx.restore()

      // Name label
      if (c.label && c.name && c.r > 28) {
        ctx.save()
        ctx.globalAlpha = c.alpha * 2.5
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.round(c.r * 0.35)}px 'Exo 2', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(c.name, c.x, c.y)
        ctx.restore()
      }
    }

    function lighten(hex) {
      const r = parseInt(hex.slice(1,3),16)
      const g = parseInt(hex.slice(3,5),16)
      const b = parseInt(hex.slice(5,7),16)
      return `rgb(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)})`
    }

    // Draw grid dots
    function drawGrid() {
      ctx.save()
      ctx.globalAlpha = 0.04
      ctx.fillStyle = '#4a7a5a'
      const spacing = 40
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }

    // Draw food pellets
    let food = []
    function initFood() {
      food = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        r: randomBetween(3, 6),
      }))
    }

    function drawFood() {
      food.forEach(f => {
        ctx.save()
        ctx.globalAlpha = 0.15
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.fill()
        ctx.restore()
      })
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawGrid()
      drawFood()

      cells.forEach(c => {
        c.x += c.vx
        c.y += c.vy
        if (c.x < -c.r * 2) c.x = canvas.width + c.r
        if (c.x > canvas.width + c.r * 2) c.x = -c.r
        if (c.y < -c.r * 2) c.y = canvas.height + c.r
        if (c.y > canvas.height + c.r * 2) c.y = -c.r
        drawCell(c)
      })

      raf = requestAnimationFrame(tick)
    }

    init()
    initFood()
    tick()

    window.addEventListener('resize', () => { resize(); initFood() })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
}
