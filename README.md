# MailAI — AI-Powered Email Management

> An open-source clone of [Upstream.do](https://www.upstream.do/) built with Next.js 16, Better Auth, Gmail API, and Claude AI.

MailAI is a full-stack email client that sits on top of your Gmail inbox and uses Claude to triage emails, draft replies in your voice, schedule follow-ups, and filter out noise — so you spend less time in email and more time on things that matter.

---

## Features

| Feature | Description |
|---|---|
| **Smart inbox splitting** | Claude categorises every email into *Needs Attention*, *Can Wait*, or *Ignore* |
| **AI draft replies** | Generates replies that sound like you, trained on your past emails |
| **AI follow-ups** | Suggests follow-up timing and drafts the message for unanswered threads |
| **Noise filtering** | Cold emails, newsletters, and automated alerts are silently moved aside |
| **Thread summarisation** | Condenses long threads into 2-3 sentences |
| **Improve any draft** | Tell the AI to "make it shorter" or "be more assertive" and it rewrites instantly |
| **Gmail sync** | Full two-way Gmail integration — read, send, archive, star, trash |
| **Dark mode** | System-aware theme with manual toggle |
| **Beautiful landing page** | Animated hero, feature cards, testimonials, and pricing |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Auth** | Better Auth + Google OAuth 2.0 |
| **Database** | PostgreSQL + Prisma 7 |
| **AI** | Anthropic Claude (claude-sonnet-4-6 / claude-haiku-4-5) |
| **Email API** | Gmail API v1 via `googleapis` |
| **UI** | Tailwind CSS v4 + shadcn/ui (base-ui) |
| **Animations** | Framer Motion |
| **Notifications** | Sonner |
| **Hosting** | Vercel (recommended) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page (→ /inbox if logged in)
│   ├── login/page.tsx            # Google OAuth login
│   ├── inbox/
│   │   ├── layout.tsx            # Auth guard + sidebar
│   │   └── page.tsx              # Main inbox view
│   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Settings page
│   └── api/
│       ├── auth/[...all]/        # Better Auth handler
│       ├── emails/               # GET list, POST send
│       ├── threads/[threadId]/   # GET, PATCH, DELETE
│       ├── sync/                 # POST trigger Gmail sync
│       ├── search/               # Live Gmail search
│       ├── follow-ups/           # GET list, PATCH done
│       ├── labels/               # GET, POST
│       ├── settings/             # GET, PATCH preferences
│       └── ai/
│           ├── draft/            # AI reply drafting
│           ├── follow-up/        # AI follow-up suggestion
│           ├── summarize/        # Thread summarisation
│           └── improve/          # Draft improvement
├── components/
│   ├── landing/                  # Landing page sections
│   ├── inbox/                    # InboxView, EmailList, ThreadPanel, AiDraftPanel, etc.
│   ├── compose/                  # ComposeModal
│   ├── settings/                 # SettingsView
│   └── layout/                  # Sidebar
├── lib/
│   ├── auth.ts                   # Better Auth config
│   ├── auth-client.ts            # Client-side auth hooks
│   ├── prisma.ts                 # Prisma client singleton
│   ├── gmail.ts                  # Gmail API wrapper
│   ├── ai.ts                     # Claude AI functions
│   └── session.ts                # Server session helpers
├── types/
│   └── email.ts                  # TypeScript types
└── generated/
    └── prisma/                   # Auto-generated Prisma client
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/mailai.git
cd mailai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PostgreSQL database
DATABASE_URL=postgresql://user:password@localhost:5432/mailai

# Google OAuth credentials
# Create at: https://console.cloud.google.com
# → APIs & Services → Credentials → OAuth 2.0 Client IDs
# → Authorised redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Anthropic API key
# Get at: https://console.anthropic.com
ANTHROPIC_API_KEY=

# Better Auth secret (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET=
```

### 3. Set up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable **Gmail API** under *APIs & Services → Library*
4. Create **OAuth 2.0 credentials** under *APIs & Services → Credentials*
5. Add authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the client ID and secret into `.env`

**Required Gmail scopes** (requested automatically during sign-in):
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.labels`

### 4. Set up the database

```bash
# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

### 6. Sync your inbox

After signing in, click the **sync button** (↻) in the inbox header to pull your Gmail threads. The first sync categorises up to 50 threads using Claude.

---

## Key API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/sync` | Sync Gmail → DB, AI categorise new threads |
| `GET` | `/api/emails` | List threads (with category/star/archive filters) |
| `GET` | `/api/threads/:id` | Get thread with all emails |
| `PATCH` | `/api/threads/:id` | Archive, star, snooze, recategorise |
| `POST` | `/api/emails` | Send an email |
| `GET` | `/api/search?q=` | Live search via Gmail API |
| `POST` | `/api/ai/draft` | Generate AI reply draft |
| `POST` | `/api/ai/improve` | Improve an existing draft |
| `POST` | `/api/ai/summarize` | Summarise a thread |
| `POST` | `/api/ai/follow-up` | AI-schedule a follow-up |
| `GET` | `/api/follow-ups` | List pending follow-ups |

---

## AI Features

All AI features use **Claude** via the Anthropic SDK.

### Email triage (`/api/sync`)
On every sync, new threads are passed to `categorizeEmail()` which uses `claude-sonnet-4-6` to assign one of:
- `NEEDS_ATTENTION` — urgent, requires a reply
- `CAN_WAIT` — low urgency, informational
- `IGNORE` — cold outreach, newsletters, automated alerts

### Reply drafting (`/api/ai/draft`)
`draftReply()` receives the full thread history and your writing samples (from Settings → AI Voice Training), then generates a reply that matches your tone and style.

### Follow-up suggestions (`/api/ai/follow-up`)
`suggestFollowUp()` reads the thread and decides both the ideal follow-up timing and the message text. You can also override both manually.

### Draft improvement (`/api/ai/improve`)
`improvedraft()` takes your existing draft and a natural language instruction ("be more concise", "add a meeting request") and rewrites it.

---

## Deployment

### Vercel (recommended)

```bash
npx vercel
```

Set all environment variables in the Vercel dashboard. Use [Vercel Postgres](https://vercel.com/storage/postgres) or [Supabase](https://supabase.com) for the database.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's base URL |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key |
| `BETTER_AUTH_SECRET` | ✅ | Random secret for session signing |

---

## Contributing

PRs are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes
4. Push and open a PR

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

Built with [Claude Code](https://claude.ai/code) · Inspired by [Upstream.do](https://www.upstream.do/)
