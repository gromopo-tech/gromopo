# Portfolio Polish Plan: 3-Repo Project for ML Platform/Infra Resume

## Context

You have three repos from a year-long startup attempt (Gromopo ordering platform + Chat RAG bot + Vouched on-chain reviews) that you want to feature on your resume targeting **ML Platform/Infra Engineer** roles. You are time-constrained (interview prep is the priority) and want maximum resume impact for ~2-3 days of work executable by Sonnet.

Current state (verified):

- **chat repo**: Solid stack (FastAPI + Vertex AI + Qdrant + LangChain). Import bug fixed (A1 ✅). README rewritten (A2 ✅).
- **gromopo repo**: README rewritten (A3 ✅). Owner-side chat wired via `/api/rag-proxy`. Customer-facing post-order screen at `src/app/(subdomains)/[subdomain]/order/confirmation/page.tsx` is the natural review-CTA insertion point.
- **vouched repo** (`gromopo-tech/vouched`): **Rust-only** smart contract repo (the original feedbites project has been retired) (Anchor program + IDL + tests). Concept: purchase-verified, reward-incentivized on-chain reviews ("Vouched" — customers review using the same wallet that paid). Program deployed to Solana devnet. No timestamps in `Review` struct (use slot/tx time), no Anchor events emitted (must poll `getProgramAccounts`). README updated (A4 ✅).
- **Review data reality**: Google Maps does not provide a usable API for fetching a business's reviews (rate limits + access restrictions). In production, **only the business owner** can export their own reviews (via Google Business Profile / Takeout). The chat repo currently ingests these from a local JSON file via `scripts/embed_reviews.py`. The plan reflects this reality and turns it into an asset (see Phase D).

The goal of this plan is to make the chat repo the resume headline (RAG/ML platform narrative), have gromopo provide a polished entry point that links out, and unlock the strongest single bullet point: a **multi-tenant, multi-source RAG ingestion pipeline with self-serve data onboarding** — owners upload their own Google review exports through the dashboard, customers leave on-chain reviews post-order, and both flows land in the same Qdrant store filtered per business.

Scope chosen: **~2-3 days, polish + extensibility + minimal on-chain integration**.

---

## Phase A — Critical Fixes & READMEs ✅ COMPLETE

### ~~A1. Fix the broken import in `chat`~~ ✅
Removed dead `hybrid_retriever` import. Added `_DenseRetriever` + `create_dense_retriever()` to `app/vectorstore.py`. Updated `tests/test_query.py` mock target. Committed.

### ~~A2. Rewrite `chat/README.md`~~ ✅
Complete with architecture diagram, tech stack table, repo layout, local dev setup, production considerations, roadmap.

### ~~A3. Replace `gromopo/README.md`~~ ✅
Complete with system diagram, tech stack table, local dev setup, related repos.

### ~~A4. Update `vouched/README.md`~~ ✅
Added "Part of the Gromopo System" section with paragraph, Mermaid diagram (on-chain → indexer → Qdrant → RAG flow), program ID, and links to gromopo and chat repos.

---

## Phase B — Extensibility, Observability, CI, Eval (~1 day)

Each item below is a single resume-grade signal that ML/infra hiring managers look for.

### B1. Pluggable `IngestionSource` interface in `chat`
- New file: `chat/app/ingestion/base.py` — abstract `ReviewSource` class with `ingest(business_id: str, ...) -> IngestResult` and a `ReviewRecord` dataclass with fields: `source` (literal `google_takeout` | `onchain_solana`), `business_id`, `external_id`, `author`, `rating`, `text`, `timestamp`, `extra: dict`.
- Refactor `scripts/embed_reviews.py` into `chat/app/ingestion/google_takeout.py` (implements `ReviewSource`, parses the JSON schema from Google Business Profile / Takeout exports) + a thin runner `scripts/run_ingestion.py` that takes `--source google_takeout|onchain_solana --business-id <id> --input <path>`.
- Add `chat/app/ingestion/onchain_solana.py` (see Phase C).
- **Multi-tenancy**: Qdrant payload gets `source` and `business_id` fields. Update `app/chains.py` retriever to always filter by `business_id` when the field is present in the request. Update `/query` request schema to accept `business_id`. The existing gromopo `rag-proxy` already knows the businessId — pass it through.

### B2. Structured logging + minimal tracing in `chat`
- Add `structlog` to `requirements.txt`.
- Wrap retrieval, embedding, and LLM calls with timed log entries: `event=retrieval k=N latency_ms=...`, `event=llm_call model=... input_tokens=... output_tokens=...`.
- Skip OpenTelemetry / external tracing backends — too much yak-shaving for the resume payoff. Just clean structured logs are enough.

### B3. Tiny eval harness in `chat`
- New file: `chat/eval/queries.jsonl` with 15-20 hand-written `(query, expected_review_ids_or_keywords)` pairs.
- New file: `chat/eval/run_eval.py` — runs each query through `/query`, computes recall@k against expected IDs, prints a markdown summary table.
- New file: `chat/eval/README.md` — one paragraph on methodology and limitations.
- This is unusually impressive for a portfolio project; almost no resume RAG demos have evals.

### B4. GitHub Actions CI in `chat`
- New file: `.github/workflows/ci.yml` — jobs: `lint` (ruff), `test` (pytest), `docker-build` (verify Dockerfile builds). Keep it simple; no deploy.
- Add a status badge to the top of the chat README.

### B5. Lightweight `gromopo` CI
- Add `.github/workflows/ci.yml` with `npm run lint` + `npm run build`. No new tests — not the resume focus.

### B6. Targeted unit tests in `chat` (write alongside new code)
The eval harness (B3) is the headline test signal for an ML system. These few unit tests cover the unglamorous-but-load-bearing seams introduced by the new code:
- `tests/test_ingestion_google_takeout.py` — fixture-based test that the Takeout JSON parser produces correct `ReviewRecord`s, including handling of missing fields, non-English text, and the no-comment case.
- `tests/test_ingestion_onchain.py` — fixture-based test of the Anchor account discriminator + deserialization (use a captured devnet account as fixture so the test doesn't need RPC).
- `tests/test_multitenant_filter.py` — confirms that a query with `business_id=A` cannot retrieve points with `business_id=B` from Qdrant. Use an in-memory Qdrant client or a small embedded fixture collection.
- Skip: integration tests with real Qdrant via testcontainers (too much setup for the resume payoff), and any frontend component tests in gromopo.

---

## Phase C — Minimal On-Chain Integration (~1 day)

This is what unlocks the "multi-source RAG pipeline" bullet. Keep it batch, not streaming.

### C1. `OnChainReviewSource` in `chat`
- New file: `chat/app/ingestion/onchain_solana.py` implementing `ReviewSource`.
- Use the `solana-py` + `anchorpy` libraries (Python-native; avoids spinning up a Node service). Add to `requirements.txt`.
- Load the IDL from `vouched/target/idl/review.json` (committed in the vouched repo — vendor a copy into `chat/app/ingestion/idl/review.json` or fetch via env-configured path so chat repo stays self-contained).
- Use `program.account.review.all()` semantics via anchorpy: call `getProgramAccounts` with the program ID, filter by the `Review` discriminator, deserialize each account.
- Map each on-chain review → `ReviewRecord` with `source="onchain_solana"`, `external_id=<account pubkey>`, `restaurant_id=<reviewee pubkey>`, `text=<comment>`, `rating=<rating>`, `timestamp=<slot time via getBlockTime>`, `extra={"reviewer": <reviewer pubkey>, "tx_signature": ...}`.
- No timestamp on the Review struct — fetch one tx signature per account via `getSignaturesForAddress` and use `getBlockTime` for that signature. This is a known scope-cut; document it in the file's docstring.

### C2. Seed a small set of devnet reviews
- Add a script `chat/scripts/seed_onchain_reviews.py` (or just a manual procedure documented in the eval README) that submits ~5-10 reviews to the vouched devnet program from a couple of test wallets, so there's something for the indexer to ingest. Cache the resulting payloads in `chat/eval/onchain_seed_data.json` for reproducible evals.
- Alternative if devnet wallet funding is annoying: write a `vouched/scripts/seed_devnet.ts` using existing test infra in `vouched/tests/`.

### C3. Run the multi-source ingest end-to-end
- `python scripts/run_ingestion.py --source google_maps` — existing flow.
- `python scripts/run_ingestion.py --source onchain_solana` — new flow, upserts on-chain reviews into the same Qdrant collection with `source=onchain_solana` payload.
- Verify with a query like "What do customers say about [restaurant]?" and confirm both sources show up in retrieved chunks (filter by `source` to demonstrate).

### C4. "Leave a Review" CTA in `gromopo`
- File: [src/app/(subdomains)/[subdomain]/order/confirmation/page.tsx](../../Documents/GitHub/gromopo/src/app/(subdomains)/[subdomain]/order/confirmation/page.tsx) lines 55-73.
- Add a button that opens a small modal: rating (1-5) + comment textarea + Submit.
- On submit: vendor the vouched IDL + program ID into `gromopo/src/lib/solana/vouched-idl.json` + a thin client at `gromopo/src/lib/solana/vouched-client.ts`. Build the `addReview` instruction using the customer's already-connected wallet, send the tx.
- Build the hook from scratch using `vouched/src/review-exports.ts` (which exports `getReviewProgram`, `REVIEW_PROGRAM_ID`) and the `@coral-xyz/anchor` pattern: `program.methods.addReview(reviewee, comment, rating).accounts({ reviewer: wallet.publicKey }).rpc()`.
- Constraint to handle: vouched PDA is `[reviewee, reviewer]` — one review per wallet per restaurant. If the user already submitted, show "You've already reviewed this restaurant".
- Do **not** wire this CTA to the indexer in real time. The story is: customer submits on-chain → next batch ingestion picks it up. That's a feature, not a bug — it's how production indexers work.

### C5. Update diagrams in all 3 READMEs to reflect the working pipeline
- Show both ingestion arrows (Google Takeout upload + on-chain) feeding into Qdrant.
- Show the gromopo → vouched tx flow.

---

## Phase D — Owner-Facing Self-Serve Review Upload (~half day to 1 day)

This is the change that makes the system credible end-to-end and gives you the strongest "data platform for non-technical users" bullet on your resume. It replaces a fictional API integration with a real onboarding flow that solves an actual constraint (Google doesn't expose a usable reviews API; only owners can export their own data).

### D1. Upload page in gromopo dashboard
- New protected route: `gromopo/src/app/(dashboard)/dashboard/reviews/upload/page.tsx` (mirrors the auth pattern of `/dashboard/gmp-chat`).
- UI: drag-and-drop file uploader for the JSON export from Google Business Profile / Takeout.
- Client-side validation: parse the JSON, show a preview card ("Found 47 reviews · avg rating 4.2 · date range 2023-01 → 2025-12 · X with comments"). Reject malformed files with a clear error.
- Submit → `POST /api/reviews/ingest` (new Next.js API route) → forwards to chat service `/ingest/google_takeout` with `business_id` from the auth context + the parsed reviews.
- Show progress + final result ("Ingested 47 reviews. Your AI assistant now has access to them.").

### D2. Instructions page / help content
- New file: `gromopo/src/app/(dashboard)/dashboard/reviews/upload/instructions.tsx` (or a `<Drawer>` on the upload page).
- Step-by-step with screenshots: "1. Sign in to Google Business Profile. 2. Manage reviews. 3. Export. 4. Drag the file here." Keep it short — a video/GIF would be ideal but a few annotated screenshots are enough.
- Link from the dashboard sidebar so it's discoverable.

### D3. Ingest endpoint in chat service
- New FastAPI endpoint: `POST /ingest/google_takeout` accepting `{business_id: str, reviews: list[dict]}`.
- Reuses `GoogleTakeoutSource` from B1 (just instantiated from in-memory data instead of file).
- Synchronous for the demo (fine for ~100 reviews); add a comment noting that production would queue this via Cloud Tasks / Pub/Sub for larger imports. Mentioning that scoping decision is itself a positive signal.
- Auth: simple shared-secret header between gromopo and chat (env var). Don't overbuild; document the auth decision.
- Returns `{ingested: int, skipped: int, errors: list}`.

### D4. Multi-tenancy verification
- Run end-to-end: log in as owner A, upload reviews → log in as owner B, upload reviews → confirm `/dashboard/gmp-chat` for owner A only retrieves owner A's reviews. Add this as a checkbox in the verification section.

---

## Critical Files Touched

**chat (most changes):**
- `app/chains.py` (fix import + add `business_id` filter)
- `app/main.py` (add `/ingest/google_takeout` endpoint, add `business_id` to query schema)
- `app/ingestion/base.py`, `app/ingestion/google_takeout.py`, `app/ingestion/onchain_solana.py` (new)
- `app/ingestion/idl/review.json` (vendored)
- `scripts/run_ingestion.py` (new), `scripts/embed_reviews.py` (deleted/migrated)
- `eval/queries.jsonl`, `eval/run_eval.py`, `eval/README.md` (new)
- `.github/workflows/ci.yml` (new)
- `requirements.txt` (+ `structlog`, `anchorpy`, `solana`)
- `README.md` (rewrite)
- `tests/test_query.py` (update mock target)
- `tests/test_ingestion_google_takeout.py`, `tests/test_ingestion_onchain.py`, `tests/test_multitenant_filter.py` (new, see B6)

**gromopo:**
- `README.md` (full rewrite ✅)
- `src/app/(dashboard)/dashboard/reviews/upload/page.tsx` (new — Phase D upload UI)
- `src/app/(dashboard)/dashboard/reviews/upload/instructions.tsx` (new)
- `src/app/api/reviews/ingest/route.ts` (new — Next.js API proxy to chat `/ingest/google_takeout`)
- `src/app/(subdomains)/[subdomain]/order/confirmation/page.tsx` (Phase C CTA + modal)
- `src/lib/solana/vouched-client.ts`, `src/lib/solana/vouched-idl.json` (new — vendored from `vouched/src/review-exports.ts` + `vouched/target/idl/review.json`)
- Sidebar nav update to add "Upload reviews" link
- `.github/workflows/ci.yml` (new)

**vouched** (`gromopo-tech/vouched` — Rust-only, no Next.js):
- `README.md` ("Part of Gromopo System" section added ✅)
- `scripts/seed_devnet.ts` (new, optional) — seed ~10 devnet reviews for reproducible evals

---

## Reuse Inventory (don't rebuild these)

- `chat/app/vectorstore.py` — Qdrant client + collection setup. Both ingestion sources use this.
- `chat/app/vertexai_models.py` — embedding + LLM clients. Reused for both sources' embedding step.
- `chat/app/query_parser.py` — already production-flavored (LLM-driven filter extraction). Surface this prominently in the README.
- `gromopo/src/components/solana/solana-provider.tsx` — wallet adapter context already wraps the app; the CTA gets the connected wallet for free.
- `vouched/src/review-exports.ts` — exports `REVIEW_PROGRAM_ID`, `getReviewProgram()`, IDL types. Vendor `vouched/target/idl/review.json` into gromopo; don't try to import across repos.
- **No pre-built TX hook** — build the `useAddReview` hook in gromopo from scratch using `program.methods.addReview(reviewee, comment, rating).accounts({ reviewer: wallet.publicKey }).rpc()` — it's ~15 lines.

---

## Resume Bullets Unlocked

After this work, you can credibly write:

- *Built a multi-tenant, multi-source RAG ingestion pipeline (Python/FastAPI + Vertex AI + Qdrant) unifying owner-uploaded review exports and on-chain Solana review data behind a pluggable `ReviewSource` interface, with per-business payload filtering for tenant isolation.*
- *Shipped a self-serve data onboarding UI letting non-technical business owners upload Google review exports directly into the vector store, bridging product UX and ML serving infra.*
- *Designed an LLM-driven query parser that extracts structured Qdrant metadata filters from natural-language questions, enabling source- and tenant-aware retrieval over heterogeneous review data.*
- *Authored a recall@k eval harness with 20 ground-truth queries to track retrieval quality across embedding/prompt changes.*
- *Implemented an off-chain indexer that polls a Solana Anchor program via `anchorpy`, deserializes account state, and upserts to a vector store — bridging on-chain data into ML serving infra.*
- *Shipped end-to-end customer flow: USDC payment on Solana → on-chain review submission → vector ingestion → owner-facing RAG insights.*

---

## Verification

After implementation:

1. **Chat repo runs from scratch**: clone fresh, follow README, `docker-compose up`, `python scripts/run_ingestion.py --source google_takeout --business-id demo --input fixtures/sample.json`, then `--source onchain_solana --business-id demo`, then `curl localhost:8080/query` (with `business_id=demo`) and see streamed response that cites both source types.
2. **Eval passes**: `python eval/run_eval.py` prints a recall@k table over the 20 seed queries.
3. **CI is green** on chat and gromopo.
4. **Gromopo upload flow**: log in as owner, navigate to `/dashboard/reviews/upload`, drag in a Google Takeout JSON, see preview + ingest confirmation, then ask a question in `/dashboard/gmp-chat` and confirm answers reference the just-uploaded reviews.
5. **Multi-tenant isolation**: log in as owner B with different reviews; confirm owner A's chat does not see owner B's reviews.
6. **Gromopo confirmation page**: complete a test order on devnet, click "Leave a Review", submit via the vouched Anchor program, see tx confirmation, then run the on-chain ingestion and confirm the new review appears in Qdrant payload (`source=onchain_solana`).
7. **READMEs render correctly on GitHub**: mermaid diagrams display, screenshots load, cross-repo links work.
8. **30-second skim test**: open each repo's GitHub page in incognito; within 30 seconds, the architecture, stack, live demo, and your role should be obvious.

