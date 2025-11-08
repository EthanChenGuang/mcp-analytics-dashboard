# MCP Analytics Dashboard

A single-page analytics dashboard for Model Context Protocol (MCP) server statistics. Built with Next.js, React, and Recharts.

## Features

- **Time-Series Charts**: Visualize MCP server counts over time with interactive charts
- **Server Type Filtering**: Filter by local servers, remote servers, or both
- **Time Granularity**: Switch between hourly, daily, weekly, and monthly views
- **Theme Support**: Toggle between light and dark themes with preference persistence
- **Real-Time Updates**: Data reflects the latest available snapshot (updated hourly via GitHub Actions)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

This will create a static export in the `out/` directory that can be deployed to any static hosting service.

## Project Structure

```
mcp-analytics-dashboard/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard page
│   ├── about/             # About page
│   ├── layout.tsx         # Root layout with theme provider
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── charts/            # Chart components
│   ├── filters/           # Filter components
│   ├── theme/             # Theme components
│   └── layout/            # Layout components
├── lib/                   # Business logic
│   ├── api/               # API client
│   ├── utils/              # Utility functions
│   └── types/             # TypeScript types
├── public/                # Static assets
│   └── data/              # Analytics data files
└── .github/               # GitHub Actions workflows
    └── workflows/         # Data aggregation workflow
```

## Data Aggregation

Analytics data is aggregated hourly via GitHub Actions. The workflow:

1. Fetches all servers from the MCP Registry API
2. Classifies each server (local/remote/both/unknown)
3. Creates a snapshot with counts
4. Validates data integrity
5. Stores data in `public/data/analytics-latest.json`

**Important**: Data aggregation uses UTC timezone for consistency. See [UTC Timezone Handling](docs/UTC-TIMEZONE-HANDLING.md) for details.

## Documentation

- [UTC Timezone Handling](docs/UTC-TIMEZONE-HANDLING.md) - Best practices for timezone handling
- [Preventing Missing Snapshots](docs/PREVENTING-MISSING-SNAPSHOTS.md) - How to prevent and detect missing data

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Deployment

The application is configured for static export and can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Simply run `npm run build` and deploy the `out/` directory.

## License

MIT




