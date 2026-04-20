# Evals

## 1. Why this exists

ABox should not judge progress only by “the feature runs.”

For an AI product, we must also ask:
- does it work reliably?
- does retrieval help?
- are outputs usable?
- are failures visible?
- is product quality improving?

## 2. MVP evaluation posture

Start with light but real evaluation.  
Do not wait for a perfect eval platform.

## 3. What to evaluate first

### 3.1 Job lifecycle correctness
Check:
- prompt submission creates job successfully
- valid status transitions occur
- failures land in explicit terminal states
- completed jobs link to persisted content correctly

### 3.2 Retrieval usefulness
Check:
- relevant style docs are retrieved for seed prompts
- relevant policy docs are retrieved when needed
- irrelevant chunk rate stays reasonable

### 3.3 Output quality
For a small seed prompt set, manually review:
- prompt relevance
- style adherence
- basic asset validity
- obvious policy failures

## 4. MVP metrics

### Reliability
- job creation success rate
- generation completion rate
- generation failure rate by category
- content persistence success rate

### Latency
- time to create job record
- time to transition from queued to terminal state
- time to load final content page

### Retrieval
- top-k relevance on seed prompts
- empty retrieval frequency
- retrieval latency

### Product quality
- manual score on generated outputs
- user save/return behavior later

## 5. Manual rubric for early output review

Score 1–5 on:
1. Relevance to prompt
2. Style/vibe match
3. Technical validity
4. Product usefulness
5. Safety/policy compliance

Keep this manual first.  
Do not build heavy automated scoring too early.

## 6. Seed eval set

Maintain a small set of representative prompts:
- aesthetic prompts
- style-heavy prompts
- simple prompts
- edge prompts
- mildly ambiguous prompts

Examples should cover:
- dreamy
- cinematic
- city-pop
- minimal editorial
- soft portrait
- poster/cover style

## 7. Failure taxonomy

Track failures by category:
- validation error
- auth/session error
- job creation error
- worker/provider timeout
- missing asset
- bad retrieval
- low-quality result
- safety rejection

## 8. Release gates

Before calling a milestone “done,” confirm:
- main happy path works repeatedly
- status transitions are correct
- no obvious permission leaks
- retrieval does not degrade prompt handling
- failures are debuggable

## 9. Future eval expansion

Later add:
- retrieval vs no-retrieval comparison
- evaluator-guided retry success rate
- personalization lift
- ranking quality
- content engagement metrics

## 10. Rule

> If we cannot tell whether the AI system is getting better, we are not really engineering it.
