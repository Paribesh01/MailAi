# MailAI — AI-Powered Email Client

> A full-stack Gmail client with AI triage, smart drafting, mail merge, read receipts, scheduled sending, and multi-account support — built with Next.js 16, Groq AI, and Gmail API.

MailAI sits on top of your Gmail inbox and uses Llama (via Groq) to triage emails, draft replies in your voice, schedule follow-ups, and filter noise — so you spend less time in email.

---

## Features

### Core Email
| Feature | Description |
|---|---|
| **Gmail sync** | Full two-way integration — read, send, archive, star, trash, spam |
| **AI triage** | Every email is automatically categorised: *Needs Attention*, *Can Wait*, or *Ignore* |
| **Multi-account** | Connect additional Gmail accounts; all mail shown together with account badge |
| **All inbox / Spam / Trash** | Dedicated views matching Gmail behaviour with restore and delete actions |
| **Thread panel** | Full thread view with inline reply, forward, archive, star, VIP, and follow-up |
| **Bulk actions** | Select multiple threads to archive, delete, move, or recategorise at once |

### AI Features
| Feature | Description |
|---|---|
| **AI draft replies** | Generates replies that match your tone, trained on your voice samples |
| **Auto writing tone** | Analyses your sent emails on first login to detect your natural style |
| **Smart replies** | Three quick-reply chips generated per thread |
| **Thread summarisation** | Condenses long threads into 2–3 sentences |
| **Draft improvement** | Tell AI "make it shorter" or "be more assertive" — it rewrites |
| **AI follow-ups** | Suggests timing and drafts follow-up messages for unanswered threads |
| **Action items** | Extracts explicit to-dos from a thread |
| **AI chat assistant** | Chat with your inbox — ask what needs attention, who hasn't replied, etc. |
| **Custom AI filters** | Create tab filters using plain English — AI reads each email to match |

### Power Features
| Feature | Description |
|---|---|
| **Send Later** | Schedule any email with presets or a custom date/time |
| **Read receipts** | Invisible tracking pixel shows when and how many times your email was opened |
| **Mail merge** | Send personalised bulk emails with `{{name}}` / `{{email}}` variables |
| **Unsubscribe manager** | Detects newsletter senders and handles List-Unsubscribe in one click |
| **VIP contacts** | Mark senders as VIP — their emails always land in Needs Attention |
| **Sender rules** | Auto-categorise by sender pattern (e.g. *@bank.com → Needs Attention) |
| **Email templates** | Save reusable email snippets with optional keyboard shortcuts |
| **Snooze** | Snooze threads; auto-unsnooze when the time comes |
| **Stats dashboard** | Category breakdown, unread count, noise ratio, top senders |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Auth** | Better Auth + Google OAuth 2.0 |
| **Database** | PostgreSQL (Neon) + Prisma 7 |
| **AI** | Groq — Llama 3.1 8B Instant / Llama 3.3 70B Versatile |
| **Email API** | Gmail API v1 via `googleapis` |
| **Encryption** | AES-256-GCM at rest, per-user HMAC-SHA256 derived keys |
| **UI** | Tailwind CSS v4 + shadcn/ui (base-ui radix) |
| **Animations** | Framer Motion |
| **Notifications** | Sonner |
| **Hosting** | Vercel (recommended) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Landing page (→ /inbox if logged in)
│   ├── login/                     # Google OAuth login
│   ├── reauth/                    # Re-auth when Gmail scopes missing
│   ├── inbox/                     # Main inbox (layout + page)
│   ├── sent/                      # Sent emails + read receipts tab
│   ├── spam/                      # Spam folder
│   ├── trash/                     # Trash folder
│   ├── scheduled/                 # Scheduled emails
│   ├── merge/                     # Mail merge
│   ├── stats/                     # Analytics dashboard
│   ├── settings/                  # User preferences
│   ├── unsubscribe/               # Unsubscribe manager
│   └── api/
│       ├── auth/[...all]/         # Better Auth (Google OAuth)
│       ├── emails/                # GET list, POST send
│       ├── threads/[threadId]/    # GET, PATCH, DELETE
│       ├── sync/                  # POST trigger Gmail sync
│       ├── search/                # Live Gmail search
│       ├── sent/                  # GET sent emails
│       ├── spam/                  # GET spam, POST not-spam/delete
│       ├── trash/                 # GET trash, POST restore/delete
│       ├── scheduled-emails/      # GET, POST, DELETE + /process
│       ├── mail-merge/            # POST bulk personalised send
│       ├── track/                 # GET list, open/[id] pixel
│       ├── custom-filters/        # GET, POST, DELETE
│       ├── linked-accounts/       # GET, DELETE, connect, callback
│       ├── vip-contacts/          # GET, POST, DELETE
│       ├── follow-ups/            # GET, PATCH
│       ├── templates/             # GET, POST, DELETE
│       ├── sender-rules/          # GET, POST, DELETE
│       ├── unsubscribe/           # POST unsubscribe action
│       ├── stats/                 # GET email analytics
│       ├── settings/              # GET, PATCH preferences
│       └── ai/
│           ├── compose/           # Compose from scratch
│           ├── draft/             # Generate reply draft
│           ├── improve/           # Improve existing draft
│           ├── summarize/         # Thread summary
│           ├── follow-up/         # Follow-up suggestion
│           ├── smart-reply/       # Quick reply chips
│           ├── actions/           # Extract action items
│           ├── chat/              # Chat with inbox context
│           ├── filter/            # AI-powered custom filter
│           ├── detect-tone/       # Detect writing tone from sent mail
│           └── categorize/        # Email categorisation
├── components/
│   ├── landing/                   # Hero, Features, Pricing, Security, etc.
│   ├── inbox/                     # InboxView, EmailList, ThreadPanel, SplitTabs, etc.
│   ├── compose/                   # ComposeModal (AI compose + schedule)
│   ├── scheduled/                 # ScheduledView
│   ├── merge/                     # MergeView
│   ├── unsubscribe/               # UnsubscribeView
│   ├── settings/                  # SettingsView
│   ├── gmail-folder/              # Shared Trash / Spam view
│   └── layout/                    # Sidebar
├── lib/
│   ├── auth.ts                    # Better Auth config
│   ├── auth-client.ts             # Client-side auth
│   ├── prisma.ts                  # Prisma client singleton
│   ├── gmail.ts                   # Gmail API wrapper + multi-account
│   ├── gmail-scopes.ts            # Scope validation
│   ├── ai.ts                      # AI categorisation + voice
│   ├── crypto.ts                  # AES-256-GCM encryption helpers
│   └── session.ts                 # Server session helpers
└── types/
    └── email.ts                   # TypeScript interfaces
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/mailai.git
cd mailai
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL (`http://localhost:3000` locally) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GROQ_API_KEY` | ✅ | Groq API key — [console.groq.com](https://console.groq.com) (free) |
| `BETTER_AUTH_SECRET` | ✅ | Random 32-byte hex string (`openssl rand -hex 32`) |
| `ENCRYPTION_SECRET` | ✅ | Random 32-byte hex string for email encryption at rest |
| `HMAC_SECRET` | ✅ | Random 32-byte hex string for OAuth state signing |

### 3. Google Cloud setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Gmail API** under *APIs & Services → Library*
3. Create an **OAuth 2.0 Client ID** under *APIs & Services → Credentials*
4. Add authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/linked-accounts/callback`
5. Copy client ID and secret into `.env`

**Required Gmail scopes** (requested automatically on sign-in):
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.labels
```

### 4. Database setup

```bash
# Apply all migrations
npx prisma migrate deploy

# (or for local dev with Neon, use db push)
npx prisma db push

# Inspect data
npx prisma studio
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, then click the **↻** sync button to pull your Gmail threads.

---

## Key API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/sync` | Sync Gmail → DB, AI-categorise new threads |
| `GET` | `/api/emails` | List threads (category / star / archive / snooze filters) |
| `GET` | `/api/threads/:id` | Full thread with all emails |
| `PATCH` | `/api/threads/:id` | Archive, star, snooze, recategorise, mark read |
| `DELETE` | `/api/threads/:id` | Move to Gmail trash |
| `POST` | `/api/emails` | Send email (auto-injects read receipt pixel) |
| `GET` | `/api/search?q=` | Live Gmail search |
| `POST` | `/api/scheduled-emails` | Schedule an email |
| `POST` | `/api/scheduled-emails/process` | Send all due scheduled emails |
| `POST` | `/api/mail-merge` | Bulk send with `{{variable}}` personalisation |
| `GET` | `/api/track` | List email open tracking records |
| `GET` | `/api/track/open/:id` | 1×1 tracking pixel (records open) |
| `POST` | `/api/ai/draft` | Generate AI reply draft |
| `POST` | `/api/ai/detect-tone` | Detect writing tone from sent emails |
| `POST` | `/api/ai/filter` | AI-powered custom filter matching |
| `GET` | `/api/linked-accounts/connect` | Start OAuth for additional Gmail account |

---

## Security

- **Email content encrypted at rest** — AES-256-GCM with per-user HMAC-SHA256 derived keys. Bodies, snippets, and summaries stored encrypted in PostgreSQL.
- **HTTPS in transit** — all communication over TLS; Groq API policy prohibits training on your data.
- **Cascade delete** — deleting your account removes all emails, threads, and preferences from the database.
- **OAuth state signing** — multi-account linking uses HMAC-SHA256 signed state parameters (10-minute expiry) to prevent CSRF.

---

## Deployment

### Vercel (recommended)

```bash
npx vercel
```

Set all environment variables in the Vercel dashboard. Use [Neon](https://neon.tech) for the database (serverless PostgreSQL, free tier available).

> **Note for Neon users:** Use `npx prisma db push` instead of `migrate dev` — Neon's serverless pooler can time out on advisory locks used by `migrate dev`. For production migrations use `migrate deploy` or manually apply SQL and mark with `migrate resolve --applied`.

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

## Contributing

PRs are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes
4. Push and open a PR

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

Built with [Claude Code](https://claude.ai/code)
