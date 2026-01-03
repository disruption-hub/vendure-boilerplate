import Link from 'next/link'

export default function FlowChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a281a] via-[#041410] to-[#02070b] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">FlowChat</h1>
          <p className="text-xl text-white/75 mb-8">
            Chat interface coming soon
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-full bg-[#7bff3a] text-[#061101] font-semibold hover:bg-[#63ff0f] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
