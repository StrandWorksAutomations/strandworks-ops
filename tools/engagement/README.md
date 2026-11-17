# Kinetic Clinician engagement sync

Reads comments from every connected network into the dashboard's Engagement page
(`/engagement`), applies the decisions made there, and sends an approved reply on the
networks whose sign-in allows it. Nothing is sent without an approval made in the
dashboard, and no reply text is generated here.

Requires Node 22 or later. No packages to install. Nothing is scheduled: run it by hand.

## Run

Put the variables below in a private file outside the repository, then from the repository root:

```sh
node --env-file=/path/to/engagement.env tools/engagement/sync.mjs --dry-run   # read and print counts; write nothing, send nothing
node --env-file=/path/to/engagement.env tools/engagement/sync.mjs --no-send   # read and apply decisions; send nothing
node --env-file=/path/to/engagement.env tools/engagement/sync.mjs             # read, apply decisions, send approved replies
```

Tests (mocked; they contact no network and no database):

```sh
node --test "tools/engagement/test/*.test.mjs"
```

The tables come from `supabase/migrations/20261117_kc_engagement_inbox.sql`, which must be
applied to the dashboard's Supabase project before the first run that is not `--dry-run`.

## Environment variables

| Variable | Used for |
|---|---|
| `SUPABASE_URL` | Dashboard database address. Required except with `--dry-run`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard database service key. Required except with `--dry-run`. |
| `KC_FB_PAGE_TOKEN` | Facebook Page comments and replies; also Instagram comments and replies. |
| `KC_FB_APP_SECRET` | Optional. Only if the Facebook app has "Require app secret" turned on. |
| `KC_YOUTUBE_API_KEY` | Reading YouTube comments. It cannot reply. |
| `KC_LINKEDIN_TOKEN` | LinkedIn company page comments and replies. |
| `KC_LINKEDIN_VERSION` | Optional. LinkedIn API version as `YYYYMM` when the built-in default has been retired. |

A missing variable never stops the run. That network is marked "not connected" on the
Engagement page with the step to take, and the other networks are still read.

## What each run does

1. Reads recent comments (last 14 days) from each connected network and saves new ones.
   A comment the account has already answered on the network is closed.
2. Records, per network, whether it is connected and when it was last read.
3. Reopens snoozed comments whose time has passed.
4. Applies the decisions queued in the dashboard: save, approve, dismiss, snooze.
5. Sends approved replies, at most 5 per run, on Facebook, Instagram, and LinkedIn when
   its token is present. YouTube and TikTok replies are always posted by hand.

Before a Facebook or Instagram reply is sent, the comment is read again. If its text
changed, or the Page already replied, the reply is held and the comment returns to the
dashboard with the reason. If a send fails without a clear answer from the network, the
comment is marked "send outcome unknown" and is not retried until it is approved again.

## Owner sign-in checklist

### Facebook
1. Sign in as the Kinetic Clinician Page admin using the existing Facebook connect step
   (`page_api.py connect` in the Facebook review tool).
2. Approve the Kinetic Clinician Page with `pages_read_engagement`,
   `pages_read_user_content` and `pages_manage_engagement`.
3. Put the resulting Page access token in `KC_FB_PAGE_TOKEN`.
4. If the Facebook app requires an app secret, also set `KC_FB_APP_SECRET`.

### Instagram
1. In Meta Business Suite, confirm the Kinetic Clinician Instagram professional account
   is linked to the Kinetic Clinician Facebook Page.
2. Sign in again as the Page admin and also grant `instagram_basic`,
   `instagram_manage_comments` and `pages_read_engagement`.
3. Replace `KC_FB_PAGE_TOKEN` with the new Page token. Instagram uses the same variable.

### YouTube
1. In the Google Cloud console, enable "YouTube Data API v3" for a project.
2. Create an API key (APIs & Services → Credentials) restricted to YouTube Data API v3.
3. Put it in `KC_YOUTUBE_API_KEY`.
4. Replying needs an OAuth sign-in, which is not set up. Approve saves your wording in
   the dashboard; post it by hand in YouTube Studio, then dismiss the comment.

### LinkedIn
1. Create or open a LinkedIn developer app owned by the Kinetic Clinician company page
   (organization 146763118).
2. On the app's Products tab, request the Community Management API and wait for
   LinkedIn's approval. Nothing can be read before that approval.
3. Sign in as a company page admin and grant `r_organization_social` and
   `w_organization_social`.
4. Put the access token in `KC_LINKEDIN_TOKEN`. LinkedIn tokens expire after about 60
   days; when the page shows LinkedIn as not connected again, repeat step 3.

### TikTok
There is no public API for reading comments on a normal business account, so nothing is
read. Answer TikTok comments in the Metricool inbox or the TikTok app.
