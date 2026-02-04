#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting Solana DevEx Collaboration Dashboard Demo...\n')

// Start the collaboration WebSocket server
console.log('📡 Starting WebSocket server...')
const wsServer = spawn('node', [path.join(__dirname, '..', 'api', 'collaboration-websocket.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
})

// Wait a moment for WebSocket server to start
setTimeout(() => {
  console.log('🌐 Starting Next.js development server...')
  
  // Start Next.js development server
  const nextServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  })

  // Handle process cleanup
  const cleanup = () => {
    console.log('\n🛑 Shutting down servers...')
    wsServer.kill()
    nextServer.kill()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Monitor child processes
  wsServer.on('close', (code) => {
    console.log(`\n❌ WebSocket server exited with code ${code}`)
    nextServer.kill()
    process.exit(code)
  })

  nextServer.on('close', (code) => {
    console.log(`\n❌ Next.js server exited with code ${code}`)
    wsServer.kill()
    process.exit(code)
  })

}, 2000)

console.log('\n📊 Collaboration Dashboard will be available at:')
console.log('   - Main App: http://localhost:3000')
console.log('   - Collaboration: http://localhost:3000/collaboration')
console.log('   - WebSocket: ws://localhost:3001/ws/collaboration\n')
console.log('💡 Press Ctrl+C to stop all servers')