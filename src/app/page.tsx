'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          AI Wardrobe Assistant
        </h1>
        <p className="text-xl text-gray-600 mt-2">
          Phase 1 MVP - Intelligence Validation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            1. Upload Wardrobe
          </h2>
          <p className="text-gray-600 mb-4">
            Add items from your wardrobe. AI will extract metadata (color,
            material, formality, fit).
          </p>
          <Link href="/wardrobe" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">
            Upload Items
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            2. Suggest Pairing
          </h2>
          <p className="text-gray-600 mb-4">
            Upload a clothing item and get AI-powered suggestions for what pairs well with it.
          </p>
          <Link href="/wardrobe/suggest-pairing" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">
            Find Pairings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            3. Evaluate Item
          </h2>
          <p className="text-gray-600 mb-4">
            Upload a photo of your styled outfit. AI will analyze the complete look and give professional styling feedback with a verdict.
          </p>
          <Link href="/wardrobe/evaluate-item" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">
            Evaluate Outfit
          </Link>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-900 mb-2">
          Phase 1: MVP Progress
        </h3>
        <p className="text-green-800">
          AI-powered wardrobe management with professional styling feedback.
        </p>
        <ul className="list-disc list-inside text-green-800 mt-2 space-y-1">
          <li>✅ Phase 1a: Setup & Infrastructure complete</li>
          <li>✅ Phase 1b: Wardrobe Upload & Metadata Extraction</li>
          <li>✅ Phase 1d: Suggest Pairing with detailed feedback</li>
          <li>✅ Phase 1c: Evaluate Item (complete outfit analysis)</li>
          <li>⏳ Phase 1d Enhancement: Structured suggestion feedback (Next)</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          Development Notes
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>
            • Check `PHASE_1A_README.md` for setup instructions and troubleshooting
          </li>
          <li>
            • Reference `PHASE_1_BUILD_PLAN.md` for the overall roadmap
          </li>
          <li>
            • Environment variables in `.env.local` (create from `.env.local.example`)
          </li>
          <li>
            • Tests run with: `npm run test`
          </li>
        </ul>
      </div>
    </div>
  )
}
