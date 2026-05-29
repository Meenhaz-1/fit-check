#!/usr/bin/env node

/**
 * Benchmark Runner
 * Loads compiled benchmark module and executes benchmarks
 */

const path = require('path')

async function runBenchmarks() {
  try {
    // Load the compiled benchmark module
    const benchmarkModule = require(path.join(__dirname, '../.next/server/lib/benchmark.js'))

    if (benchmarkModule.runAllBenchmarks) {
      await benchmarkModule.runAllBenchmarks()
    } else {
      console.error('Benchmark module not found or not properly compiled')
      console.log('\nRun: npm run build')
      console.log('Then: npm run benchmark')
      process.exit(1)
    }
  } catch (error) {
    console.error('Error running benchmarks:', error.message)
    console.log('\nMake sure to build first:')
    console.log('  npm run build')
    console.log('  npm run benchmark')
    process.exit(1)
  }
}

runBenchmarks()
