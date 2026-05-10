# Claude Code Planning Mode — Usage Guide

## The Core Loop

Every piece of work follows three steps. Never skip straight to Execute.

```
EXPLORE  →  PLAN  →  EXECUTE
(Opus)      (Opus)   (Sonnet)
```

### Step 1: EXPLORE (Opus)

**Purpose:** Understand the problem space before committing to an approach.
**Model:** Opus (switch in VS Code: Cmd+Shift+P → "Claude: Select Model")
**What happens:** Claude reads files, asks clarifying questions, identifies constraints.
**You do NOT write code in this step.**

**Prompt pattern:**
```
I'm starting Phase N: <name>. Read CLAUDE.md and .claude/rules/<relevant>.md, and the Phase N Handoff section in docs/plans/00N-slug.md.

Explore the current state of the repo and help me understand what we need to build. Specifically:
- What exists already that we can build on?
- What are the key technical decisions we need to make?
- What are the constraints or gotchas for this component?
- What dependencies does this phase have on prior phases?

Do NOT write any code yet. Just investigate and report back.
```

**Concrete example — Phase 2 (Spark preprocessing):**
```
I'm starting Phase 2: PySpark preprocessing pipeline.

The raw ESA data is in Parquet format. Explore:
- Read a sample of the raw data and describe the schema, column types,
  and any quality issues (nulls, duplicates, timestamp gaps)
- What windowing strategy does Telemanom expect as input?
  (check the model code we dropped in during Phase 4)
- What's the right partitioning scheme for the output Parquet
  given downstream Ray will read one channel at a time?

Don't write pipeline code yet — just investigate and summarize findings.
```

### Step 2: PLAN (Opus)

**Purpose:** Lock down the approach, tradeoffs, and file-level scope before touching code.
**Model:** Still Opus.
**Output:** A plan file saved to `docs/plans/NNN-slug.md`.

**Prompt pattern:**
```
Based on what we just explored, write a plan for this phase.

Save it to docs/plans/NNN-<slug>.md using the template in
docs/plans/000-TEMPLATE.md.

The plan should include:
- Concrete file paths that will be created or modified
- The implementation order (what gets built first)
- How to validate each step before moving to the next
- Any tradeoffs you considered and why you chose this approach

I'll review before we start executing.
```

**Concrete example:**
```
Based on the Spark exploration, write a plan for the preprocessing pipeline.

Save it to docs/plans/002-spark-preprocessing.md.

Key constraints to address in the plan:
- Must work in local[2] mode on sample data AND on Dataproc with full data
- Output must be partitioned by mission_id/channel_id for Ray to read
- Need a --sample-fraction CLI arg that defaults to 0.01
- Integration test that validates output schema against what the model expects
```

**After Claude writes the plan:** Review it. Push back on anything that feels wrong.
This is the cheapest place to catch mistakes — before any code exists.

### Step 3: EXECUTE

**Purpose:** Implement the approved plan, one step at a time.

Switch to Sonnet. Let it implement efficiently.
```
Execute step N of plan docs/plans/NNN-slug.md.

Write the code and any tests if applicable, then validate and commit the changes before moving on.
```

**When things go sideways during execution:**
```
Stop. This isn't working as planned because <reason>.

Switch to exploration mode — investigate <the issue> and then
propose an amendment to the plan in docs/plans/002-spark-preprocessing.md.
Don't keep writing code until we've updated the plan.
```

---

## Prompt Patterns for Common Situations

### Starting a new phase
```
I'm starting Phase N: <name>. Read CLAUDE.md and .claude/rules/<relevant>.md, and the Phase N Handoff section in docs/plans/00N-slug.md.

Explore the current state of the repo and help me understand what we need to build. Specifically:
- What exists already that we can build on?
- What are the key technical decisions we need to make?
- What are the constraints or gotchas for this component?
- What dependencies does this phase have on prior phases?

Do NOT write any code yet. Just investigate and report back.
```

### Resuming after a break
```
I'm picking up where I left off on Phase N. Read the current plan at
docs/plans/NNN-slug.md and check what's been implemented vs what remains.
Summarize the current state and what the next step is.
```

### Asking for tradeoff analysis
```
I need to decide between <option A> and <option B> for <component>.

Use the tradeoff format from CLAUDE.md:
- 2-3 options (include "do nothing" if reasonable)
- Effort, risk, impact, maintenance burden for each
- Opinionated recommendation mapped to project goals
  (portfolio readability, M1 8GB local dev, GCP deployment target)
- Ask for my approval before assuming a direction
```

### "I'm stuck on something"
```
I'm trying to <goal> but hitting <problem>. Here's what I've tried: <attempts>.

Before suggesting fixes, help me understand WHY this is happening.
Then propose a fix that aligns with our existing architecture.
```

### Asking Claude to review (Opus)

**First, choose review depth based on scope:**

For a **big review** (end of a phase, multi-file change, pre-merge):
```
Review the changes in this branch in BIG CHANGE mode.

Here are the changed files:
$(git diff main --name-only)

Go section-by-section:
1. Architecture: boundaries, coupling, data flow, scaling concerns
2. Code Quality: DRY violations, error handling, edge cases, over/under-engineering
3. Tests: coverage gaps, assertion strength, missing failure paths
4. Performance: data access patterns, hot paths, memory

Up to 4 issues per section. For each issue: file/line ref, 2-3 options
(including "do nothing"), effort/risk/impact for each, your recommendation.
One section at a time — wait for my response before moving to the next.
```

For a **small review** (single file, quick sanity check):
```
Review <file> in SMALL CHANGE mode.

One key concern per area (architecture, code quality, tests, performance) —
4 items max. Only flag things that are actually wrong or risky, not style nits.
```

### Wiring components together
```
Phase N produced <output>. Phase M needs to consume it.
Explore both sides and write an integration plan that connects them.
Pay attention to: data format compatibility, error handling at the boundary,
and how to test the integration without running the full pipeline.
```

### Closing out a phase
```
Phase N is complete. Before we wrap:
1. Update docs/plans/NNN-slug.md status to Complete
2. Update README.md to reflect what's now built and runnable —
   only claim what actually works right now
3. If this phase added GCP-relevant infra (Spark job, Ray config,
   Cloud Run service), add a placeholder or update docs/deployment.md
4. Make sure any new make/just targets are documented in the README
5. Summarize what Phase N+1 will need from what we just built
```


---

## Model Selection Quick Reference

| Task | Model / Approach | Why |
|------|-----------------|-----|
| Exploring a new phase | Opus | Needs judgment, reading comprehension |
| Writing a plan | Opus | Architectural decisions, tradeoff analysis |
| Reviewing code or plans | Opus | Needs critical eye, catches subtle issues |
| Scaffolding implementation | Sonnet | Straightforward code generation, faster |
| Writing tests (first one) | You | Learn the pattern, then Claude Code for rest |
| Writing tests (rest) | Sonnet | Mechanical once the pattern is established |
| Debugging a specific error | Sonnet | Usually localized, doesn't need big picture |
| Refactoring across files | Opus | Needs to hold full context, make judgment calls |
| Writing docs/README | Sonnet | Content is defined, just needs writing |
| "This isn't working, help" | Opus | Needs to diagnose, may require plan changes |
| "Explain this concept" | Opus | Teaching mode, not code generation |

---

## Session Hygiene

- **Start every session** with: "Read CLAUDE.md" — this reloads project context.
  Claude Code does load rules automatically, but explicitly prompting it to read
  CLAUDE.md ensures the high-level context is fresh.
- **One phase per session** when possible. Context window gets muddied across phases.
- **Save progress to plan files** — if you're mid-phase and ending a session,
  ask Claude to update the plan with current status before closing.
- **Don't let Sonnet make architectural decisions** — if it starts proposing
  structural changes during execution, stop and switch to Opus.
- **If Claude forgets constraints**, paste the specific rule from .claude/rules/
  into the prompt. The rules files are auto-loaded but reinforcement helps.