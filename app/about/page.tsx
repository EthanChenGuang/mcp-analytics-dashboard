import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            About MCP Analytics Dashboard
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Purpose
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                The MCP Analytics Dashboard provides real-time visibility into Model Context Protocol (MCP) 
                server statistics. It aggregates data from the public MCP Registry to help users understand 
                the growth and distribution of MCP servers over time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Sources
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                The dashboard fetches data from the{' '}
                <a 
                  href="https://registry.modelcontextprotocol.io/v0/servers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  MCP Registry API
                </a>
                , which provides a comprehensive list of all registered MCP servers.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Data is aggregated hourly via GitHub Actions, which:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-2">
                <li>Fetches all servers from the registry API using pagination</li>
                <li>Classifies each server as local (has packages), remote (has remotes), or both</li>
                <li>Counts servers by type and creates a snapshot</li>
                <li>Stores aggregated data as static JSON files</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Features
              </h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-2">
                <li><strong>Time-Series Charts:</strong> Visualize server counts over time with date on x-axis and counts on y-axis</li>
                <li><strong>Server Type Filtering:</strong> View analytics for local servers, remote servers, or both</li>
                <li><strong>Time Granularity:</strong> Switch between hourly, daily, weekly, and monthly views</li>
                <li><strong>Theme Support:</strong> Toggle between light and dark themes with preference persistence</li>
                <li><strong>Real-Time Updates:</strong> Data reflects the latest available snapshot (updated hourly)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                The dashboard is built as a static Next.js application that:
              </p>
              <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-2">
                <li>Fetches pre-aggregated analytics data from static JSON files</li>
                <li>Aggregates data client-side based on selected time granularity</li>
                <li>Filters data based on server type selection</li>
                <li>Renders interactive charts using Recharts</li>
                <li>Persists theme preferences in browser localStorage</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Server Classification
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Servers are classified based on their configuration:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-2">
                <li><strong>Local:</strong> Servers with <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">packages</code> property (installed via package managers)</li>
                <li><strong>Remote:</strong> Servers with <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">remotes</code> property (accessed via HTTP/SSE)</li>
                <li><strong>Both:</strong> Servers with both packages and remotes</li>
                <li><strong>Unknown:</strong> Servers with neither (excluded from main counts)</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/" 
                className="text-purple-600 dark:text-purple-400 hover:underline font-medium inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

