# Repository Guidelines

## Project Structure & Module Organization
- Root-level static app:
  - `index.html` — UI layout and inputs.
  - `styles.css` — Styling for cards, grids, and buttons.
  - `app.js` — All client logic: fetching prices, parsing/formatting numbers, and conversion.
- No build step or bundler. Keep files small and self‑contained.

## Build, Test, and Development Commands
- Serve locally (any static server works):
  - Python: `python3 -m http.server 8000`
  - Node (if installed): `npx http-server -p 8000`
- Open: `http://localhost:8000` and use the UI.
- Quick lint (optional): use your editor’s JS/HTML/CSS linters; no repo‑enforced tooling.

## Coding Style & Naming Conventions
- JavaScript: two‑space indent, semicolons, single quotes. Avoid one‑letter names.
- Functions are small and pure where possible (e.g., `parseNumber`, `setNumberInputValue`).
- DOM IDs use snake_case (e.g., `price_btc_usd`), CSS classes use kebab-case (e.g., `coin-btn-expanded`).
- Keep changes minimal and focused; avoid introducing dependencies or build tools without discussion.

## Testing Guidelines
- No formal test framework in repo. Use a manual checklist:
  - Enter any single field, click "手动换算"，all fields update.
  - Click "一键获取汇率"，price fields fill and conversions update.
  - Switch 币种，价格标签与显示同步，计算仍可用。
  - Number inputs show plain numeric strings (no commas) and accept edits.
- If adding tests, place simple browser tests under `tests/` and document how to run them in the PR.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `fix: number input formatting`, `feat: add coin selection UI`).
- PRs should include:
  - Summary of changes and rationale.
  - Before/after screenshots or short GIFs for UI changes.
  - Repro steps and risk/rollback notes.
  - Linked issue or TODO where applicable.

## Security & Configuration Tips
- External APIs: CoinGecko/Binance/Coindesk and FX sources are public; no secrets required.
- Respect CORS; a public proxy is used as fallback. Handle timeouts and failures gracefully.
- Do not hardcode credentials. Keep network calls simple and optional for offline use.
