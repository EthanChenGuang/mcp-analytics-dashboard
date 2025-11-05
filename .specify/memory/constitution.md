# MCP Registry UI Constitution

## Core Principles

### I. Static Website

The project must be built as a static website with no server-side rendering or runtime dependencies. All content and functionality must be delivered as static HTML, CSS, and JavaScript files that can be served from any static hosting service.

### II. Responsive Design

All user interfaces must be fully responsive and work seamlessly across desktop, tablet, and mobile devices. Mobile-first approach preferred; breakpoints must be tested across common device sizes.

### III. Minimal Dependencies Unless Required

Dependencies should be kept to an absolute minimum. Only add dependencies when they are essential for core functionality. Prefer native browser APIs and vanilla JavaScript over frameworks when possible. All dependency additions must be justified.

## Development Standards

### Build & Deployment

- Use static site generators or build tools that produce static output
- Build artifacts must be completely static (no server requirements)
- Optimize assets for fast loading and minimal bandwidth

### Code Quality

- Write clean, maintainable code following web standards
- Ensure accessibility (WCAG compliance where applicable)
- Validate HTML and CSS for standards compliance

## Governance

This constitution supersedes all other development practices. All pull requests and code reviews must verify compliance with these principles. Any deviation from these principles requires explicit justification and documentation.

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27
