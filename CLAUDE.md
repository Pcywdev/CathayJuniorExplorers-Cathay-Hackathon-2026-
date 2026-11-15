# Cathay Xplorers

Concept demo of a youth membership mode for a travel app: young people explore what Cathay offers before adulthood, across three tiers (Little Xplorers under 12, Teen Xplorers 12–17, Campus Xplorers 18 to graduation or 25) and an exit into full adult membership. Little Xplorers is the trip experience: two synced phone screens (child and parent) react to one real flight, with an AI story that unlocks chapter by chapter. At 12+ Home grows up, and "Picked for you" offers are ranked by a toy dual-encoder recommender. Built for the Cathay Hackathon final, 14–15 Nov 2026. Full scope is in docs/plan.md, which wins on any conflict.

## Ownership
- Backend owner: `backend/`, `shared/`, deployment. Frontend owner: `frontend/`. `docs/` is shared.
- Stay inside your area; propose changes to the other side via docs/api.md.
- The 14 Nov tonight-only exception for Earth in `frontend/` has ended. Cross-area work (e.g. live trip mode, `docs/live-trip.md`) needs the owner's OK first.

## Rules we don't break
- Synthetic data only, except OAG flight data. Never imply real Cathay integration. No official logos.
- No pooling of miles.
- Children's data: age band, destination, flight length, trip events only. Never photos, location or health data.
- Teen and Campus personas (Mei at 15 and 20) and the recommender's training users are synthetic. Guardian approval and university email verification are shown as passed, never collected.
- Only the backend calls OAG. Cache every response; demo flights live as fixtures so the app works offline. Quota: 1,000 requests / 30 days.
- API keys come from environment variables (`.env`, gitignored). Never hard-code, commit or screenshot them.
- Every displayed number comes from `shared/program.json`.
- No new dependencies beyond the agreed stack without asking.

## Workflow
- Start of session: read docs/progress.md and pick the next task.
- Plan mode for new features; skip it for small fixes.
- One feature per branch (`feat/<name>`); merge to main only when it runs.
- Keep the API matching docs/api.md. If an endpoint must change, update api.md in the same commit and say so clearly.
- Pure business logic gets pytest tests written before the code.
- Before calling anything done: backend runs tests and a real request; frontend runs /screen-check.
- End of session: tick off docs/progress.md, add one session-log line, log decisions in docs/decisions.md, commit.

## Design
@docs/DESIGN.md

<!-- BEGIN AWS Agent Toolkit rules -->
# AWS Guidance

- Where these AWS rules conflict with the project's own instructions, the
  project's instructions take precedence.
- Prefer the AWS MCP Server for AWS interactions — it provides sandboxed
  execution, observability, and audit logging. If unavailable, use the
  AWS CLI directly.
- For any AWS task or question — building, configuring, migrating, debugging,
  or operating a service, writing SDK code, authoring CDK/CloudFormation, or
  answering how a service works — first call `aws___search_documentation` with
  topic `agent_skills` and load the matching skill with `aws___retrieve_skill`.
  Do this even when you believe you know the answer: skills carry current
  service behavior that your training may not. Prefer the skill's guidance over
  general knowledge. Skip it only for work that does not involve AWS.
- When uncertain about specific AWS details (API parameters, permissions,
  limits, error codes), verify against documentation rather than guessing.
  State uncertainty explicitly if you cannot confirm.
- Before reporting a count, a total, or that something does not exist, read
  every page of the results and search every Region and scope where it could
  be. If you could not, say the result is partial and name what you checked.
- To say what a system currently does, read what the runtime uses: the
  completed deployment, the alias or version that is invoked, the template the
  stack is running. A newer stored version, a draft, or a description field is
  not evidence of live behavior.
- Present a cause as confirmed only if data, configuration, or logs you read
  show it. Label anything else as unverified, and say what you would check
  next.
- Before you interpret the records that show a failure, such as error log
  lines, failed executions, or table items, read one of them whole, with
  every field. Don't truncate messages or select fields in your own code
  until you have.
- When an error says a value was undefined, null, empty, or missing, find
  the input, query result, or item that supplied that value. If the account
  shows why it was empty, such as no item matching the key, read that
  before you call the cause unverified.
- When a field in a record you read explains the result, such as an error
  counter, an empty array, a null, or a state value, name the field and its
  exact value in the answer, and say which record it came from.
- When the user asks a specific question or names a suspected cause, confirm
  or rule out each cause they raised, and do not offer alternatives your evidence
  does not support.
- When creating infrastructure, prefer infrastructure-as-code (AWS CDK or
  CloudFormation) over direct CLI commands.
- When working with infrastructure, follow AWS Well-Architected Framework
  principles.
- Do not use em dashes in AWS resource names or descriptions. Use
  hyphens instead.

## Before you conclude

- Before deciding the AWS account can't hold what the request asks for,
  look. List the places it could live, such as S3 buckets, databases, and
  log groups, and read what is there.
- Don't conclude that records are missing from metadata, such as a
  creation date or a stored-bytes count, or from one query that failed or
  came back empty. Read the records another way, across the full time
  range, before reporting them absent.
- A tool's own error is evidence. If a call the answer depends on fails
  with expired or missing credentials or AccessDenied, report that error
  and what it blocks, and don't overrule it with another check. Searching
  other Regions is for finding resources, not for retrying an auth error.
  Retry throttling with backoff before you report it.

## Secret Safety

- MUST load the `aws-secrets-manager` skill first for any secret,
  credential, API key, token, or password task. MUST NOT call
  `secretsmanager get-secret-value` or `batch-get-secret-value`, and MUST
  NOT hit the Secrets Manager Agent daemon directly. MUST use
  `{{resolve:secretsmanager:secret-id:SecretString:json-key}}` with
  `asm-exec` so the secret resolves at runtime without entering context.
<!-- END AWS Agent Toolkit rules -->
