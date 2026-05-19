# Supabase setup — Visionist

## 1. Create project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL**, **anon key**, **service role key**, and **JWT secret** (Settings → API).

## 2. Run migrations

In the Supabase SQL editor, run in order:

1. `migrations/20260517000001_initial_schema.sql`
2. `migrations/20260517000002_rls_policies.sql`
3. `migrations/20260517000003_new_user_trigger.sql`

Or with Supabase CLI: `supabase db push`

## 3. Environment variables

**`backend/.env`**

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Auth settings

For local development, disable **Confirm email** under Authentication → Providers → Email, or confirm users manually in the dashboard.

## 5. Verify

- `GET http://127.0.0.1:8000/health` → `"supabase_configured": true`
- Sign up in the app → rows in `profiles` and `user_style_profiles`
- Request a kombin → row in `recommendations` + `recommendation_items`
- Save to wardrobe → row in `saved_outfits`
