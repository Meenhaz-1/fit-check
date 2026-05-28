'use client'

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wardrobe Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            1. Upload Wardrobe
          </h2>
          <p className="text-gray-600 mb-4">
            Add items from your wardrobe. AI will extract metadata (color,
            material, formality, fit).
          </p>
          <button
            onClick={() => {
              alert('Sub-Phase 1b: Coming soon')
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload Items
          </button>
        </div>

        {/* Screenshot Evaluation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            2. Evaluate Item
          </h2>
          <p className="text-gray-600 mb-4">
            Upload a screenshot or photo of an item. AI will recommend wardrobe
            pairings and give a verdict.
          </p>
          <button
            onClick={() => {
              alert('Sub-Phase 1c: Coming soon')
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Evaluate
          </button>
        </div>
      </div>

      {/* Phase Status */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">
          Phase 1a: Setup & Infrastructure
        </h3>
        <p className="text-yellow-800">
          This is the infrastructure phase. User-facing features are coming in
          Sub-Phases 1b-1e.
        </p>
        <ul className="list-disc list-inside text-yellow-800 mt-2 space-y-1">
          <li>✅ Next.js app initialized</li>
          <li>✅ Database setup ready</li>
          <li>✅ OpenAI integration ready</li>
          <li>⏳ Sub-Phase 1b: Wardrobe Upload (Coming next)</li>
        </ul>
      </div>

      {/* Development Info */}
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
