# RecastAI — Product Specification

## Overview

RecastAI is a micro-SaaS that turns YouTube videos (and uploaded audio) into viral, platform-optimized content using AI. Users paste a URL, and the app produces a blog post, Twitter/X thread, LinkedIn post, and email newsletter — ready to publish.

**Repo:** [https://github.com/Jima-J9M1/recast-ai](https://github.com/Jima-J9M1/recast-ai)  
**Hosting:** Vercel (free tier)  
**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 / Supabase (auth + DB) / OpenAI GPT / Polar.sh (billing) / Supadata (transcription)

---

## Business Model


| Plan    | Price     | Limit           |
| ------- | --------- | --------------- |
| Free    | $0        | 1 video/month   |
| Starter | $19/month | 10 videos/month |
| Pro     | $49/month | Unlimited       |


Billing is managed through Polar.sh subscriptions. Each plan is a separate Polar product. Webhooks sync subscription state into the `users.plan` field.

---

## Core User Flow

```
Paste YouTube URL (or upload MP3/WAV/M4A/OGG/FLAC)
  → Supadata API fetches transcript
  → OpenAI GPT generates 4 outputs in parallel
  → User views, edits, copies, stars, or regenerates outputs
  → User publishes to their platform of choice
```

---

## Features

### Content Generation

- **YouTube → Content:** Paste any YouTube URL; transcript is fetched via Supadata; GPT generates all four formats.
- **Audio Upload:** Upload an audio file (≤4 MB); transcript is extracted then same pipeline runs.
- **Reverse Mode:** Provide a text description/topic instead of a video; GPT generates content from scratch.
- **Batch Processing:** Paste multiple YouTube URLs; processed respecting plan limits (`BATCH_LIMITS`).
- **Regeneration:** Re-run generation for any existing job with new tone, language, or custom instruction.
- **Chat with Transcript:** Interactive Q&A against the video's transcript via a chat interface on the job detail page.

### Output Formats

Each job produces four outputs:


| Format           | Description                                       |
| ---------------- | ------------------------------------------------- |
| `blog`           | Long-form SEO-ready blog post (optional SEO mode) |
| `twitter_thread` | Numbered thread optimized for engagement          |
| `linkedin`       | Professional tone post                            |
| `newsletter`     | Email-ready content                               |


### Customization

- **Tone:** Applied per-job (default, professional, casual, humorous, etc.)
- **Language:** Target output language per-job
- **SEO Mode:** Enhanced keyword targeting for blog posts (toggle per-job)
- **Brand Voice:** User-level persona, audience description, style notes, and example phrases. Applied to all generations.
- **Custom Prompt Templates:** Pro-only. Override the system prompt for any output format.

### Content Library & History

- **History:** All past jobs with status, title, and date.
- **Library:** Star any output to save it to a personal library.
- **Output Versioning:** Each regeneration creates a new version; users can restore prior versions.
- **Calendar:** Visual calendar view of content history.

### Feeds (YouTube Channel Subscriptions)

- Subscribe to YouTube channels by URL, handle, or `@name`.
- Cron job (`/api/cron/check-feeds`) runs periodically to auto-process new videos from subscribed channels.
- Each feed stores its own tone and language preferences.
- Feeds can be enabled/disabled individually.
- CRON_SECRET environment variable gates the cron endpoint.

### Team Collaboration

- Users can create a team workspace.
- Owner generates a shareable invite link (token-based, with expiry).
- Members join via `/join?token=…`.
- Owner can remove members; self-removal is prevented.
- Team members share a workspace context (`team_id` on `users`).

### Webhooks

- Users can register webhook URLs to receive job completion events.
- Each webhook has a secret for signature verification.
- Managed via `/api/webhooks`.

---

## Architecture

### Route Groups

```
src/app/
├── page.tsx                    # Landing page
├── (auth)/
│   ├── login/                  # Email/password login
│   └── signup/                 # Registration
├── (dashboard)/                # Authenticated app shell
│   ├── dashboard/              # Home — recent jobs + quick new job form
│   ├── new/                    # New job creation
│   ├── jobs/[id]/              # Job detail — outputs, chat, regenerate
│   ├── history/                # All past jobs
│   ├── library/                # Starred outputs
│   ├── brand-voice/            # Brand voice settings
│   ├── prompts/                # Custom prompt templates (Pro)
│   ├── feeds/                  # YouTube channel feed subscriptions
│   ├── calendar/               # Calendar view of content
│   ├── reverse/                # Reverse mode (text → content)
│   ├── team/                   # Team management
│   ├── billing/                # Subscription management
│   ├── upgrade/                # Plan upgrade page
│   └── settings/               # Profile settings
└── join/                       # Team invite acceptance
```

### API Routes


| Endpoint                     | Method   | Description                                        |
| ---------------------------- | -------- | -------------------------------------------------- |
| `/api/process`               | POST     | Main pipeline: fetch transcript + generate content |
| `/api/upload`                | POST     | Audio file upload + transcribe + generate          |
| `/api/reverse`               | POST     | Generate content from text description             |
| `/api/batch`                 | POST     | Batch process multiple YouTube URLs                |
| `/api/jobs/[id]/regenerate`  | POST     | Regenerate with new params; supports preview       |
| `/api/jobs/[id]/chat`        | POST     | Chat with job transcript via OpenAI                |
| `/api/jobs/[id]/restore`     | POST     | Restore a prior output version                     |
| `/api/jobs/[id]/save-output` | POST     | Persist generated output to DB                     |
| `/api/jobs/[id]/cancel`      | POST     | Cancel a pending/processing job                    |
| `/api/outputs/[id]/star`     | POST     | Toggle star on an output                           |
| `/api/brand-voice`           | GET/PUT  | Retrieve/update brand voice profile                |
| `/api/prompt-templates`      | GET/PUT  | Retrieve/update custom prompts (Pro)               |
| `/api/feeds`                 | GET/POST | List/create channel subscriptions                  |
| `/api/feeds/[id]`            | PATCH    | Enable/disable a feed                              |
| `/api/cron/check-feeds`      | GET      | Cron: auto-process feeds (secured by CRON_SECRET)  |
| `/api/library`               | GET      | Get starred outputs                                |
| `/api/team`                  | GET/POST | Get/create team                                    |
| `/api/team/invite`           | POST     | Create invite link                                 |
| `/api/team/invite/[id]`      | DELETE   | Revoke invite                                      |
| `/api/team/join`             | POST     | Accept invite token                                |
| `/api/team/members/[userId]` | DELETE   | Remove team member                                 |
| `/api/webhooks`              | GET/POST | List/create webhooks                               |
| `/api/webhooks/[id]`         | DELETE   | Delete webhook                                     |
| `/api/webhooks/polar`        | POST     | Polar subscription webhook handler                 |
| `/api/portal`                | POST     | Generate Polar customer portal URL                 |
| `/api/change-plan`           | POST     | Switch subscription tier                           |
| `/api/cancel-plan`           | POST     | Cancel or resume subscription                      |
| `/api/settings/profile`      | PATCH    | Update display name                                |
| `/api/auth/logout`           | POST     | Sign out                                           |


### Database Schema (Supabase PostgreSQL)

All tables have Row Level Security (RLS) enabled.

`**users**`

```sql
id            uuid (PK, FK auth.users)
email         text
full_name     text
avatar_url    text
plan          text  -- 'free' | 'starter' | 'pro'
polar_customer_id      text
polar_subscription_id  text
team_id       uuid (FK teams)
brand_voice   jsonb -- { persona, audience, style_notes, phrases[] }
created_at    timestamptz
```

`**jobs**`

```sql
id            uuid (PK)
user_id       uuid (FK users)
title         text
source_type   text  -- 'youtube' | 'upload'
source_url    text
status        text  -- 'pending' | 'transcribing' | 'generating' | 'completed' | 'failed' | 'cancelled'
transcript    text
error_message text
language      text
tone          text
seo_mode      boolean
created_at    timestamptz
completed_at  timestamptz
```

`**outputs**`

```sql
id         uuid (PK)
job_id     uuid (FK jobs)
type       text    -- 'blog' | 'twitter_thread' | 'linkedin' | 'newsletter'
content    text
version    integer
starred    boolean
created_at timestamptz
```

`**usage**`

```sql
id      uuid (PK)
user_id uuid (FK users)
month   text    -- 'YYYY-MM'
count   integer
UNIQUE (user_id, month)
```

`**prompt_templates**`

```sql
id         uuid (PK)
user_id    uuid (FK users)
format     text  -- matches output type
prompt     text
updated_at timestamptz
```

`**feeds**`

```sql
id         uuid (PK)
user_id    uuid (FK users)
channel_id text
rss_url    text
tone       text
language   text
active     boolean
created_at timestamptz
```

`**teams**`

```sql
id         uuid (PK)
name       text
owner_id   uuid (FK users)
created_at timestamptz
```

`**team_members**`

```sql
team_id    uuid (FK teams)  -- composite PK
user_id    uuid (FK users)  -- composite PK
role       text
joined_at  timestamptz
```

`**team_invites**`

```sql
id          uuid (PK)
team_id     uuid (FK teams)
token       text (UNIQUE)
created_by  uuid (FK users)
created_at  timestamptz
expires_at  timestamptz
accepted_at timestamptz
```

`**webhooks**`

```sql
id         uuid (PK)
user_id    uuid (FK users)
url        text
secret     text
active     boolean
created_at timestamptz
```

**DB Functions**

- `handle_new_user()` — trigger on `auth.users` insert; creates `users` row.
- `increment_usage(user_id, month)` — upsert usage counter.
- `get_user_stats(user_id)` — aggregated stats for dashboard.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Polar.sh
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_STARTER_PRODUCT_ID=
POLAR_PRO_PRODUCT_ID=

# App
NEXT_PUBLIC_APP_URL=

# Cron security
CRON_SECRET=
```

---

## Plan Limits


| Feature                 | Free    | Starter | Pro       |
| ----------------------- | ------- | ------- | --------- |
| Jobs/month              | 1       | 10      | Unlimited |
| Batch processing        | Limited | Yes     | Yes       |
| Custom prompt templates | No      | No      | Yes       |
| Brand voice             | Yes     | Yes     | Yes       |
| Audio upload            | Yes     | Yes     | Yes       |
| Reverse mode            | Yes     | Yes     | Yes       |
| Feeds                   | Yes     | Yes     | Yes       |
| Team                    | No      | Yes     | Yes       |


---

## Third-Party Integrations


| Service          | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| **Supabase**     | Auth (email/password), PostgreSQL DB, RLS       |
| **OpenAI GPT**   | Content generation + transcript chat            |
| **Supadata API** | YouTube transcript extraction                   |
| **Polar.sh**     | Subscription billing, customer portal, webhooks |
| **Vercel**       | Hosting + cron jobs                             |


---

## Key Design Decisions

- **Serverless-only:** All processing in Next.js API routes — no separate backend or queue.
- **RLS everywhere:** All DB access goes through Supabase RLS; service role key used only in server-side API routes.
- **Free tier first:** Vercel free tier + Supabase free tier keeps infrastructure cost at $0.
- **Polar for billing:** Chosen over Stripe for simpler creator-friendly setup and lower fees.
- **Output versioning:** Every regeneration appends a new version row rather than overwriting, enabling restore.
- **Brand voice as JSON:** Stored as `jsonb` on the `users` row for simplicity; no separate table needed.

