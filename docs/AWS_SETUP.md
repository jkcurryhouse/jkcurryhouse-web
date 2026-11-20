# AWS Infrastructure Setup — JK Curryhouse

## CloudFront CDN

### Create Distribution
1. CloudFront → Create distribution
2. **Origin:** your AWS Amplify app URL (e.g. `main.xxxxxxxxx.amplifyapp.com`)
3. **Viewer protocol policy:** Redirect HTTP to HTTPS
4. **Allowed HTTP methods:** GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
5. **Cache policy:** CachingOptimized for static assets; CachingDisabled for API routes
6. **Compress objects:** Yes

### Cache behaviours (in order)
| Path Pattern | Cache Policy | Origin Request |
|---|---|---|
| `/api/*` | CachingDisabled | AllViewer |
| `/_next/static/*` | CachingOptimized (1 year) | — |
| `*.js`, `*.css` | CachingOptimized | — |
| `Default (*)` | CachingDisabled | AllViewer |

### Price class
- EU, North America (covers UK traffic cheaply)

---

## Route 53 DNS

### Register or transfer domain
1. Route 53 → Registered domains → Register domain (or transfer)
2. Register `jkcurryhouse.co.uk` (or `.com`)

### Create hosted zone
1. Route 53 → Hosted zones → Create hosted zone
2. Domain: `jkcurryhouse.co.uk`
3. Note the 4 NS records — add these to your domain registrar if transferring

### DNS records
| Name | Type | Value |
|---|---|---|
| `jkcurryhouse.co.uk` | A (Alias) | CloudFront distribution |
| `www.jkcurryhouse.co.uk` | CNAME | CloudFront distribution domain |
| `jkcurryhouse.co.uk` | MX | Your email provider |
| `_dmarc.jkcurryhouse.co.uk` | TXT | `v=DMARC1; p=none; rua=mailto:hello@jkcurryhouse.co.uk` |

### SSL Certificate (ACM)
1. ACM → Request certificate (must be in **us-east-1** for CloudFront)
2. Domain names: `jkcurryhouse.co.uk`, `*.jkcurryhouse.co.uk`
3. Validation: DNS → ACM gives you a CNAME to add in Route 53
4. Wait ~5 minutes → status becomes Issued
5. Attach to CloudFront distribution

---

## S3 Bucket (Menu Images)

### Create bucket
1. S3 → Create bucket → `jk-curryhouse-menu-images` → eu-west-2
2. **Block public access:** Uncheck "Block all public access" (images must be public)
3. Acknowledge warning → Create

### Bucket policy (public read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::jk-curryhouse-menu-images/*"
    }
  ]
}
```

### CORS (for browser direct uploads)
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://www.jkcurryhouse.co.uk", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### IAM policy for Next.js app
Create an IAM user `jk-curryhouse-app` with this policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::jk-curryhouse-menu-images/*"
    },
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*"
    }
  ]
}
```

---

## AWS Amplify (Hosting)

### Connect GitHub
1. Amplify → New app → Host web app → GitHub
2. Select `jk-curryhouse` repo → `main` branch
3. Build settings: already configured in `amplify.yml`

### Environment variables
Set all vars from `.env.local.example` in Amplify → App settings → Environment variables

### Custom domain
1. Amplify → Domain management → Add domain → `jkcurryhouse.co.uk`
2. Amplify creates the CloudFront distribution automatically OR point your Route 53 records to Amplify's domain

---

## Cognito User Pool

### Admin group setup
1. Cognito → User Pools → [your pool] → Groups → Create group
2. Name: `Admins`, Description: Restaurant staff admin access
3. Precedence: 1

### Add admin user
1. Cognito → User Pools → [your pool] → Users → Find user
2. Actions → Add to group → Admins

### App client settings
- Auth flows: `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
- No client secret (public client for browser)
- Token validity: Access 1h, ID 1h, Refresh 30d

---

## AWS SES (Email)

### Verify sender domain
1. SES → Verified identities → Create identity → Domain
2. Domain: `jkcurryhouse.co.uk`
3. Add the DKIM CNAME records to Route 53

### Exit sandbox (for production)
1. SES → Account dashboard → Request production access
2. Describe use case: transactional order/reservation confirmations
3. Approval usually within 24 hours

### Recommended sending limits
- Max send rate: 14/second (default)
- Daily quota: 50,000 (default after approval)
