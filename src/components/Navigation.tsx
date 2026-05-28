import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Wardrobe AI
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Home
            </Link>
            <Link
              href="/wardrobe"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Wardrobe
            </Link>
            <Link
              href="/evaluate"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Evaluate
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
