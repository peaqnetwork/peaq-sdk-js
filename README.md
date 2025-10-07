## peaq-sdk-js

Monorepo (npm workspaces) for peaq SDK packages.

### Requirements
- Node 18+

### Install
```bash
npm install
```

### Typecheck (project references)
```bash
npm run typecheck
```

### Build all packages
```bash
npm run build --workspaces
```

### Clean build outputs
```bash
npm run clean --workspaces
```

### Pack tarballs
```bash
# Pack specific workspaces
npm pack -w @peaq-network/sdk -w @peaq-network/msf -w @peaq-network/rwa

# Pack all workspaces
npm pack -ws
```

### Outputs (per package)
- Bundled entry: `dist/index.js` (built with tsup)
- Per-file ESM: `dist/esm/**` (built with tsc)
- Exports include curated subpaths, e.g. `@peaq-network/sdk/types`