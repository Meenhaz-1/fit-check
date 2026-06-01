# Fit Check

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square)

---

## The problem

Most people buy clothes they never wear. They look good on the hanger, or on someone else in the store, but once home the piece doesn't work, wrong for their colouring, wrong for their body shape, clashes with everything they own.

The usual options are a friend's or spouse's opinion, a stylist (expensive), or going with your gut (the reason the pile exists in the first place).

## What Fit Check does

Fit Check is an AI outfit evaluator that gives you an honest, personalised verdict before you commit.

Upload a photo of an outfit or item. The app detects what you're wearing, scores it across cohesion, colour harmony, proportion, and formality, then tells you plainly: **buy it or don't**.

The verdict is tailored to you. Set up a profile with your body shape, skin tone, and aesthetic, and every evaluation answers the question that actually matters: *does this work for me specifically?*

---

## Screenshots

| Purchase Consultant | Outfit Builder |
|---|---|
| ![Purchase Consultant](docs/screenshots/Purchase%20Consultant.jpeg) | ![Outfit Builder](docs/screenshots/Outfit%20Builder.jpeg) |

---

## Key features

- **Outfit scoring** — four-dimension analysis with a clear buy/don't buy verdict
- **Profile-aware feedback** — yes/no on whether an item suits your body, colouring, and style
- **Wardrobe builder** — save items and see what you own
- **Outfit pairing** — AI-generated combinations from your existing wardrobe
- **Two style perspectives** — Heritage Minimalist (timeless) or Trend-Forward (current)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, TypeScript |
| AI | OpenAI GPT-4o Vision |
| Styling | Tailwind CSS |
| Storage | File-based (JSON + local image store) |

---

## Getting started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Setup

```bash
git clone https://github.com/Meenhaz-1/fit-check.git
cd fit-check
npm install
```

Create `.env.local`:

```
OPENAI_API_KEY=
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |

---

## License

MIT
