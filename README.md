# Time Machine Earth

An interactive historical atlas from 3000 BCE to today: one map, one timeline.

```bash
npm install
npm run dev      # http://localhost:5395
npm test         # date conversion, interval queries, geometry, search, quiz
npm run build
```

## Data

- **Borders**: [historical-basemaps](https://github.com/aourednik/historical-basemaps) (GPL-3.0), 48 snapshots from 3000 BCE to 2010. They are loaded per snapshot from jsDelivr and cached in IndexedDB. The map shows the latest snapshot at or before the selected year. Borders are never interpolated.
- **Base map**: Natural Earth (public domain). Optional relief layer from Esri.
- **Curated records** (`src/data/`): civilizations, events, cities, country histories, sites and trade routes. Every record cites its source. Known dataset conflicts are listed in `src/data/atlas.ts`.
- `npm run build-index` regenerates `src/data/generated/territory-index.json`, the name, year, precision and area index used by search and quizzes.

Dates are stored as astronomical years (1 BCE = 0) so that arithmetic works across the BCE/CE boundary. See `src/lib/chrono.ts`.

## Licences

The historical boundary data is © A. Ourednik and contributors, licensed GPL-3.0. `src/data/generated/territory-index.json` is derived from it and is distributed under the same GPL-3.0 terms. Natural Earth is public domain. Relief tiles are © Esri and need attribution, which the map shows. Credits are shown in the map's attribution control and on the in-app Sources page.
