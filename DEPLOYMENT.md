# Railway Deployment Guide

## ✅ What's Been Done

Your app has been migrated from SQLite to PostgreSQL using Prisma ORM:
- ✅ Prisma schema created
- ✅ Database models configured (User, Payment, Usage)
- ✅ All routes updated to use Prisma
- ✅ Migration files generated
- ✅ Procfile created for Railway
- ✅ Code pushed to GitHub

## 🚀 Next Steps to Deploy on Railway

### Step 1: Create Railway Account & Connect GitHub
1. Go to **https://railway.app**
2. Sign up with GitHub (recommended)
3. Create a new project: **New → GitHub Repo**
4. Select your **game-creator-learn** repository
5. Click **Deploy**

Railway will automatically:
- Detect Node.js app
- Install dependencies
- Build the app

### Step 2: Add PostgreSQL Database
1. In Railway dashboard, go to your project
2. Click **+ New** → **Database** → **PostgreSQL**
3. Railway will automatically provision a PostgreSQL database
4. It will set `DATABASE_URL` environment variable automatically ✅

### Step 3: Set Environment Variables

In Railway dashboard **Variables** tab, add these:

```
JWT_SECRET=generate-a-random-secret-string-here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=your-railway-url-will-be-provided
```

⚠️ **Important**: After Railway deploys your app, it will give you a URL like `https://game-creator-prod.up.railway.app`. Update:
- `FRONTEND_URL` with this URL
- OAuth provider dashboards with your callback URLs (see below)

### Step 4: Update OAuth Provider Callbacks

After you get your Railway URL, update these providers:

**Google Cloud Console:**
- Authorized JavaScript origins: `https://your-railway-url`
- Authorized redirect URIs: `https://your-railway-url/auth/google/callback`

**Facebook Developer:**
- Valid OAuth Redirect URIs: `https://your-railway-url/auth/facebook/callback`

**GitHub Developer Settings:**
- Authorization callback URL: `https://your-railway-url/auth/github/callback`

### Step 5: Update Stripe Webhook

1. Go to **Stripe Dashboard** → **Webhooks**
2. Add endpoint: `https://your-railway-url/payments/webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook secret and add to Railway `STRIPE_WEBHOOK_SECRET`

### Step 6: Verify Deployment

1. Check Railway **Deployments** tab — should show "Success"
2. Check **Logs** tab for any errors
3. Click your app URL to load the homepage
4. Test login flow with Google/Facebook/GitHub
5. Test token purchase with Stripe test card: `4242 4242 4242 4242`

## 🔑 Generating JWT Secret

Run this in terminal to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📋 Checklist

- [ ] GitHub account connected to Railway
- [ ] PostgreSQL database created on Railway
- [ ] All 10 environment variables set
- [ ] OAuth provider callbacks updated
- [ ] Stripe webhook configured
- [ ] App deployed successfully
- [ ] Homepage loads in browser
- [ ] OAuth login tested
- [ ] Stripe payment tested
- [ ] Database records persist

## 🆘 Troubleshooting

**App won't start:**
- Check Railway Logs for errors
- Ensure `DATABASE_URL` is set
- Run `npm run prisma:generate` locally if needed

**Database connection error:**
- Verify `DATABASE_URL` environment variable is set
- Check PostgreSQL is running on Railway

**OAuth not working:**
- Verify callback URLs match in providers AND Railway config
- Check `FRONTEND_URL` is correct

**Stripe webhook fails:**
- Verify webhook endpoint URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

## 📞 Support

For issues, check:
- Railway Logs (in dashboard)
- Stripe test mode logs
- GitHub Issues on your repo

---

**Next:** Follow Step 1 to start deploying! 🎉
