# RISEx on-ramp — regular user, desktop prototype

Interactive web prototype of the Figma row **“Regular user flow (No Crossmint’s account)”** in
section `2. Design - On Ramp Flow` (`90:5843`, page Assignment `76:29`). Desktop only.

Static site, no build step, no network calls, no real OAuth, wallet or payment API.

## Run locally

```bash
cd prototypes/onramp-regular-desktop
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/ in Chrome. Serve over HTTP(S): the RISEx tab and the TopPay tab
sync through `localStorage`, which needs both pages on the same origin.

## Deploy

Live: https://chinchin12345.github.io/risex-onramp-prototype/ (GitHub Pages, repo `Chinchin12345/risex-onramp-prototype`).


Upload this folder as-is to any static HTTPS host (GitHub Pages, Netlify, Cloudflare Pages…).
`index.html` is the entry point; `toppay.html` must sit next to it.

## Files

| File | Role |
|---|---|
| `index.html`, `assets/risex.css`, `assets/risex.js` | RISEx tab: Trade (01) and modals 02–07, plus the completion states |
| `toppay.html`, `assets/toppay.css`, `assets/toppay.js` | External provider tab (08) with copy, QR download and the “Simulate payment” demo control |
| `assets/store.js` | Shared demo state, illustrative rate and limits |
| `assets/icons.js`, `assets/icons/` | Icons exported from Figma (`RISEx/Icon/*`) |
| `assets/brand/` | Logos, avatar, chart raster and illustrative QR exported from Figma |
| `assets/fonts/` | Geist / Geist Mono (self-hosted, OFL) |

## Demo data (illustrative, not a real quote)

- 2.580.313 VND = 100.00 USDC at a demo rate of 25,803.13 VND per USDC; presets $25/$50/$100/$200 use the same rate.
- Bank Transfer limit $4k → max 103.212.520 VND; minimum 1 USDC (25.803 VND).
- Before: Acct. Equity $23.72, Collat. Margin $23.70, Available 15.09 USDC, leverage 0.73x.
  After one default deposit: $123.72, $123.70, 115.09 USDC, 0.14x.
- TopPay account number and recipient are demo placeholders; the QR is the non-scannable pattern from Figma.

State is kept in `localStorage` for 30 minutes (so a refresh mid-payment returns to the same
order); **Restart demo** clears it.
