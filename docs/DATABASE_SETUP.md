# Connecting the admin panel to AWS (RDS PostgreSQL)

Everything the admin panel changes — dishes, bookings, offers, settings — is stored in one
PostgreSQL database on Amazon RDS in Sydney (`ap-southeast-2`), the same region as the Amplify app. The website and admin panel both read
from it through Prisma. Follow these steps once.

**Time:** about 30 minutes, most of it waiting for RDS to start. **Cost:** a `db.t4g.micro`
instance with 20 GB is covered by the AWS Free plan; afterwards roughly US$20/month in Sydney.

---

## 1. Create the database (CloudFormation)

The template `infra/rds-postgres.yaml` creates the database, its firewall rule and settings.

### Option A — AWS Console
1. Sign in to AWS and switch the region (top right) to **Asia Pacific (Sydney) ap-southeast-2**.
2. Open **CloudFormation → Create stack → With new resources**.
3. Choose **Upload a template file** and select `infra/rds-postgres.yaml`.
4. Stack name: `jk-curryhouse-db`. Fill in the parameters:
   - **VpcId** — pick the one marked *default*.
   - **MasterPassword** — 20+ letters and numbers. Generate one with `openssl rand -hex 16`
     and store it in your password manager. You'll need it in step 2.
   - Leave the others as they are.
5. Click through and **Submit**. Wait until the status is `CREATE_COMPLETE` (10–15 min).
6. Open the stack's **Outputs** tab and copy **DatabaseUrlTemplate**.

### Option B — AWS CLI
```bash
aws cloudformation deploy \
  --region ap-southeast-2 \
  --stack-name jk-curryhouse-db \
  --template-file infra/rds-postgres.yaml \
  --parameter-overrides \
      VpcId=$(aws ec2 describe-vpcs --region ap-southeast-2 --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text) \
      MasterPassword=YOUR_LONG_PASSWORD

aws cloudformation describe-stacks --region ap-southeast-2 --stack-name jk-curryhouse-db \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseUrlTemplate'].OutputValue" --output text
```

> **Why is the database reachable from the internet?** AWS Amplify Hosting (where the site runs)
> can't be placed inside a private network, so it reaches RDS over the public internet. The
> template forces encrypted connections (TLS) and the password is the key. Use a long random one
> and never commit it. If you later move hosting to ECS/Lambda in a VPC, set `PubliclyAccessible`
> to `false` and `AllowedCidr` to your VPC range.

## 2. Point the project at it

In the template URL, replace `PASSWORD` with your master password, then put it in `.env.local`:

```
DATABASE_URL="postgresql://jkadmin:YOUR_PASSWORD@jk-curryhouse-db.xxxx.ap-southeast-2.rds.amazonaws.com:5432/jkcurryhouse?sslmode=require&connection_limit=5"
```

## 3. Create the tables and load the menu

From the project folder on your computer:

```bash
npm install            # also runs `prisma generate`
npx prisma db push     # creates all tables in RDS
npx prisma db seed     # loads the current menu (60+ dishes) and default settings
```

The seed is safe to run again — it never overwrites dishes you've edited in the admin panel.
To browse the data directly: `npx prisma studio`.

## 4. Configure AWS Amplify

**Amplify → your app → Hosting → Environment variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the URL from step 2 |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | from Cognito |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | from Cognito |
| `APP_AWS_REGION` | `ap-southeast-2` |
| `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY` | IAM user from step 6 |
| `S3_BUCKET_NAME` | `jk-curryhouse-menu-images` |
| `SES_FROM_EMAIL` | your verified sender |
| `UNSUBSCRIBE_SECRET` | output of `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | from Stripe |
| `NEXT_PUBLIC_SITE_URL` | `https://www.jkcurryhouse.co.uk` |

Use the `APP_AWS_…` names — Amplify refuses variables starting with `AWS_`.

`amplify.yml` already copies these into the server runtime and runs `prisma db push` on every
deploy, so future schema changes apply automatically. (`db push` refuses to drop data unless told
to, so a bad change fails the build rather than losing records.)

## 5. Make yourself an admin

1. **Cognito → User pools → your pool → Groups → Create group**, name it exactly `Admins`.
2. Register on the website with your email, then in **Users** open your user → **Add user to group → Admins**.
3. Sign out and back in on the website, then go to `/admin`.

Every admin API call is checked on the server: the Cognito token's signature, expiry and pool are
verified, and the user must be in `Admins`. Non-admins get `403`, signed-out requests get `401`.

## 6. IAM user for photos and emails

Create an IAM user `jk-curryhouse-app` with this policy and use its keys for `APP_AWS_*`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::jk-curryhouse-menu-images/*" },
    { "Effect": "Allow", "Action": ["ses:SendEmail"], "Resource": "*" }
  ]
}
```

S3 bucket setup (public-read bucket policy + CORS for browser uploads) is in `docs/AWS_SETUP.md`.
Add your live domain to the CORS `AllowedOrigins`, or dish-photo uploads will fail.

## 7. Stripe webhook

Stripe Dashboard → Developers → Webhooks → Add endpoint:
`https://www.jkcurryhouse.co.uk/api/stripe/webhook`, events `payment_intent.succeeded` and
`payment_intent.canceled`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 8. Check it works

1. Open `/admin` — the dashboard should load without a red error banner.
2. **Menu → Add item**, save it, then open `/menu` in another tab: the dish appears.
3. **Reservations → New booking** for today: it appears on the dashboard's *Today's bookings*.
4. **Settings → Accept online orders → off**: `/order` shows the "not taking orders" notice.

---

## Backups and recovery

- RDS takes an automatic daily backup and supports point-in-time restore within the retention
  window. The template defaults to 1 day because AWS Free plan accounts allow no more; once you
  upgrade, update the stack and set **BackupRetentionDays** to 7. Restore via **RDS → Databases → jk-curryhouse-db → Actions → Restore to point in time**.
- Deleting the stack takes a final snapshot first, and deletion protection is on, so the database
  can't be removed by accident.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Dashboard: "Sign in required" / "Admin access required" | Not in the `Admins` group, or signed in before being added — sign out and in again. |
| Dashboard: "Failed to load stats" | `DATABASE_URL` wrong or tables not created — rerun step 3. |
| `P1001: Can't reach database server` | Security group / `AllowedCidr`, or the instance is still starting. |
| `no pg_hba.conf entry … no encryption` | `?sslmode=require` missing from `DATABASE_URL`. |
| Photo upload fails | S3 CORS doesn't list your domain, or IAM policy missing `s3:PutObject`. |
| Offer emails not arriving | SES still in sandbox (only verified addresses receive mail) — request production access. |
