# Engineering Rules

## 1. Core mindset

Build ABox like an early-stage startup product that may need to survive real growth.  
Do not build it like a hackathon demo.  
Do not build it like a big-company science project either.

The posture is:
- pragmatic
- clean
- incremental
- explainable

## 2. Rewrite policy

1. Audit before rewrite
2. Preserve working auth unless clearly broken
3. Preserve working storage flows unless they conflict with the new model
4. Prefer selective refactor over emotional restart
5. Do not introduce large new abstractions without a concrete need

## 3. Layering rules

Always separate:
- UI layer
- route/API layer
- service/orchestration layer
- DB/persistence layer
- AI/retrieval/evaluation layer

### Forbidden patterns
- business logic inside page components
- raw DB access scattered across UI files
- AI orchestration logic inside route handlers
- hidden coupling between retrieval and rendering

## 4. Route handler rules

Route handlers should:
- authenticate
- parse input
- call service layer
- return stable responses

They should not:
- contain multi-step business logic
- embed retrieval logic directly
- perform large inline SQL operations
- become dumping grounds for the whole feature

## 5. Database rules

- Use additive migrations when possible
- Avoid destructive schema changes without strong justification
- Document migration purpose clearly
- Keep ownership fields explicit
- Let RLS do real work, not cosmetic work
- Never trust client ownership claims

## 6. TypeScript rules

- Prefer explicit domain types
- Type service inputs/outputs
- Avoid vague `any`/unknown unless necessary and narrowed safely
- Keep function contracts readable
- Favor small typed modules over giant “utils” files

## 7. AI system rules

- Start with shallow workflows before building complex agents
- Generation is async by default
- Retrieval is a separate concern from generation execution
- Evaluation should exist before heavy autonomy
- Tool boundaries should be explicit and future MCP-compatible
- Do not add buzzword architecture just to sound advanced

## 8. Code quality rules

Prefer:
- focused modules
- explicit naming
- predictable async flows
- comments that explain intent, not obvious syntax
- easy-to-review diffs

Avoid:
- giant files
- duplicated query logic
- mixed concerns
- dead code
- “temporary” hacks with no cleanup plan

## 9. Documentation rules

For any meaningful feature:
- update schema docs if schema changes
- update architecture docs if boundaries change
- update implementation plan if roadmap order changes
- update eval docs if quality criteria change

## 10. Product rules

- Keep MVP scope tight
- Make tradeoffs explicit
- Do not optimize for imaginary scale
- Do optimize for future clarity
- Every major change should answer:
  - why this is needed
  - why now
  - what future problem it prevents

## 11. Review rule

If a change makes the code faster to write but much harder to reason about later, reject it unless there is a very strong reason.
