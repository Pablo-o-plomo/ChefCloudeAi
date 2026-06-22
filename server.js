/**
 * Backend Server Entry Point
 * Запускается отдельно от Vite dev server
 *
 * Использование:
 * - Development: node server.js (слушает на :3001)
 * - Production: node server.js (слушает на $PORT)
 */

import app from './server/index.js'

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`✓ ChefCloud Server listening on http://${HOST}:${PORT}`)
  console.log(`  - Frontend: http://localhost:${PORT}`)
  console.log(`  - Health check: http://localhost:${PORT}/api/health`)
})
