# Deploy runbook (AWS)

One CloudFront URL serves everything: `/api/*` goes to a load balancer and **one** Fargate task (the backend image), and every other path goes to a private S3 bucket (the built frontend). Same origin, so there is no CORS and no mixed content.

```
browser ── https ──> CloudFront ─┬─ /api/*  ──> ALB (CloudFront IPs only) ──> 1 Fargate task :8080
                                 └─ else    ──> S3 (private, OAC)  app routes -> index.html
```

Templates: [infra/aws/ecr.yaml](../infra/aws/ecr.yaml) (image registry) and [infra/aws/app.yaml](../infra/aws/app.yaml) (everything else).
Commands below are PowerShell, run from the repo root. Never put keys in the image or in a template.

## 0. Once per machine
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi   # AWS CLI v2; then open a new terminal (or: winget install Amazon.AWSCLI)
aws configure sso                 # or: aws configure  (access key)
aws sts get-caller-identity       # check you are in the right account
$Region = "ap-southeast-1"        # Singapore; Hong Kong (ap-east-1) works too if the account has it enabled
$Stack  = "cathay-xplorers"
```
Docker Desktop must be running.

## 1. Image registry
```powershell
aws cloudformation deploy --region $Region --stack-name "$Stack-ecr" --template-file infra/aws/ecr.yaml
$Repo = aws cloudformation describe-stacks --region $Region --stack-name "$Stack-ecr" --query "Stacks[0].Outputs[?OutputKey=='RepositoryUri'].OutputValue" --output text
```

## 2. Build and push the backend image
Tags can't be reused (the repository is immutable), so each push gets a new one.
```powershell
$Tag = "$(git rev-parse --short HEAD)-$(Get-Date -Format yyyyMMddHHmm)"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Repo.Split('/')[0]
docker build --platform linux/amd64 -f backend/Dockerfile -t "${Repo}:$Tag" .
docker push "${Repo}:$Tag"
```

## 3. Keys (optional)
Skip this for the default demo: fixtures for flights, pre-written fallback stories.
To use live AI or OAG, store the key as a SecureString, pass its name in step 4, and then delete the temporary file:
```powershell
aws ssm put-parameter --region $Region --type SecureString --name /cathay-xplorers/llm-api-key --value file://llm-key.txt
aws ssm put-parameter --region $Region --type SecureString --name /cathay-xplorers/oag-api-key --value file://oag-key.txt
```

## 4. Deploy the app stack (about 10 minutes, mostly CloudFront)
```powershell
$Pl = aws ec2 describe-managed-prefix-lists --region $Region --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing --query "PrefixLists[0].PrefixListId" --output text
aws cloudformation deploy --region $Region --stack-name $Stack --template-file infra/aws/app.yaml --capabilities CAPABILITY_IAM `
  --parameter-overrides ImageUri="${Repo}:$Tag" CloudFrontPrefixListId=$Pl
```
For live stories, add these to `--parameter-overrides`:
`LlmProvider=openai LlmModel=<model> LlmLive=true LlmKeyParameterName=/cathay-xplorers/llm-api-key` (plus `LlmBaseUrl=<url>` for Gemini).
For live OAG lookups, add `OagLive=true OagKeyParameterName=/cathay-xplorers/oag-api-key`. That spends quota (1,000 requests / 30 days).

## 5. Build and upload the frontend
```powershell
function Out($k) { aws cloudformation describe-stacks --region $Region --stack-name $Stack --query "Stacks[0].Outputs[?OutputKey=='$k'].OutputValue" --output text }
$Site = Out SiteUrl; $Bucket = Out FrontendBucketName; $Dist = Out DistributionId

# Use the full site URL, not "": in PowerShell an empty value deletes the variable, and the app would fall back to localhost:8000.
$env:VITE_API_BASE_URL = $Site
npm --prefix frontend ci
npm --prefix frontend run build
Remove-Item Env:VITE_API_BASE_URL

aws s3 sync frontend/dist "s3://$Bucket" --delete --exclude index.html --cache-control "public,max-age=31536000,immutable"
aws s3 cp frontend/dist/index.html "s3://$Bucket/index.html" --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id $Dist --paths "/index.html"
```

## 6. Check
```powershell
curl.exe -s "$Site/api/health"    # expect {"status":"ok",...}
Start-Process "$Site/demo"
```
Then open `/child` and `/parent` on two phones and turn junior mode on: both should update together.

## Redeploying
- **Backend change:** repeat steps 2 and 4. On an update, `deploy` keeps the earlier parameter values, so only `ImageUri` needs passing. The old task stops before the new one starts, so the API is down for about a minute and live trips reset.
- **Frontend change:** repeat step 5.

## Notes
- **One task, on purpose.** SSE subscribers live in memory and trips in a SQLite file inside the container, so every phone must reach the same process. Do not raise `DesiredCount`. Trips are lost whenever the task restarts; just turn junior mode on again.
- **Streams through CloudFront.** CloudFront drops an origin connection after 60 s of silence; the API sends `: ping` every 15 s, so streams stay open. The browser's EventSource reconnects on its own and replays missed events by id.
- **Who can reach the API.** The load balancer only accepts CloudFront's origin-facing addresses, and the task only accepts the load balancer. The CloudFront to ALB hop is plain HTTP: fine for synthetic demo data, but add a certificate and an HTTPS listener before carrying anything real.
- **Logs:** `aws logs tail /ecs/$Stack-api --region $Region --follow`
- **Rough cost (estimate, not checked against current pricing):** about USD 40/month while running (load balancer about 18, Fargate 0.25 vCPU / 0.5 GB about 10, three public IPv4 addresses about 11, CloudFront and S3 cents at demo traffic). Tear down when the demo is over.

## Troubleshooting
| Symptom | Likely cause | Check |
|---|---|---|
| Stack sits on `Service` for a long time, then rolls back | Task can't start: bad image tag, or app crash | `aws ecs describe-services --region $Region --cluster <ClusterName> --services <ServiceName> --query "services[0].events[:5]"` and the logs |
| `/api/...` returns 502 or 503 | No healthy task yet | Logs; target group health in the EC2 console |
| Page loads but shows no live data | Frontend built without `VITE_API_BASE_URL` (calls localhost) | Repeat step 5 with `$env:VITE_API_BASE_URL` set |
| `docker push` says the tag already exists | Reused tag | New `$Tag` (step 2) |
| `docker login` gives `400 Bad Request` | Windows PowerShell 5.1 mangles the piped password | Use the temp-config login below |
| `error storing credentials ... The stub received bad data` | Docker's Windows credential helper can't hold the long ECR token | Use the temp-config login below |

Temp-config login (works around both; keeps the token in a throwaway folder, not your normal Docker config):
```powershell
$Reg = $Repo.Split('/')[0]; $cfg = "$env:TEMP\ecr-docker"; New-Item -ItemType Directory -Force $cfg | Out-Null
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("AWS:$(aws ecr get-login-password --region $Region)"))
"{`"auths`":{`"$Reg`":{`"auth`":`"$auth`"}}}" | Out-File -Encoding ascii "$cfg\config.json"
$env:DOCKER_CONFIG = $cfg   # then docker push as usual; Remove-Item Env:DOCKER_CONFIG when done
```
| Deep link like `/demo` returns XML AccessDenied | SPA rewrite function missing | Check `SpaRewriteFunction` in the stack |

## Tear down
```powershell
aws s3 rm "s3://$Bucket" --recursive
aws cloudformation delete-stack --region $Region --stack-name $Stack
aws cloudformation wait stack-delete-complete --region $Region --stack-name $Stack
aws cloudformation delete-stack --region $Region --stack-name "$Stack-ecr"
aws ssm delete-parameter --region $Region --name /cathay-xplorers/llm-api-key   # only if created
aws ssm delete-parameter --region $Region --name /cathay-xplorers/oag-api-key   # only if created
```
