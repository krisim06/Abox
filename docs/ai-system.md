# AI System

## 1. Purpose

This document describes the AI-specific workflow of ABox. It exists separately from `architecture.md` so the AI pipeline can evolve without turning the general architecture doc into a blob.

## 2. MVP AI posture

The MVP AI system is intentionally shallow and structured.

It should do:

1. request intake
2. optional retrieval
3. generation plan construction
4. job creation/execution
5. result evaluation
6. durable persistence

It should not yet try to be a fully autonomous multi-agent system.

## 3. AI request lifecycle

```text
User prompt
  -> Request validation
  -> Request analysis
  -> Optional retrieval
  -> Generation plan
  -> Generation job
  -> Result persistence
  -> Evaluation / status update
```

## 4. Request analysis

Purpose:

- understand user intent
- classify type of generation request
- identify whether retrieval is needed
- identify risk/safety sensitivity
- normalize input into a structured internal request

Likely outputs:

- prompt intent
- target asset type
- style hints
- policy sensitivity
- retrieval-needed boolean

## 5. Retrieval hook

Retrieval should become a callable dependency from the orchestrator, not something buried in the UI or route handler.

Initial retrieval sources:

- style guides
- policy documents
- prompt templates

Later retrieval sources:

- user taste memory
- similar successful content
- content embedding search

## 6. Generation planning

The system should convert a loose user prompt into a more structured generation plan.

Suggested plan shape:

- original prompt
- normalized prompt
- revised prompt
- style tags
- model selection hint
- negative prompt or avoidance notes if applicable
- number of candidates
- safety mode

The plan should be serializable and inspectable.

## 7. Generation execution

Execution should be asynchronous and durable.

Responsibilities:

- create/update job status
- call generation runtime/provider
- persist output
- update content record
- record failure reason if needed

## 8. Evaluation

Evaluation is the bridge between “it ran” and “it was decent.”

Initial evaluation can be simple:

- generation completed successfully
- asset exists and loads
- metadata is attached
- optional manual quality score

Next-stage evaluation:

- relevance to prompt
- visual/style adherence
- policy compliance
- retry decision

## 9. Retry policy

Do not add open-ended retries.

Initial rule:

- at most one controlled retry for a narrow failure category

Possible retry cases:

- empty/invalid asset
- provider timeout
- clearly malformed result

## 10. Future personalization

Future user taste memory can affect:

- style retrieval
- prompt construction
- candidate ranking

This should not be merged into the core workflow until:

- likes/history data is trustworthy
- retrieval is stable
- evaluation is in place

## 11. Future agent expansion

Agentic behavior should expand only after the core AI system is reliable.

Good future additions:

- retrieval-aware planner
- evaluator-guided retry
- content similarity search
- template recommendation

Premature additions to avoid:

- many-agent choreography
- giant framework-driven planners
- tool explosions with weak observability

## 12. AI system design rule

> The AI system should become smarter by adding controlled layers, not by collapsing all logic into one giant “AI” module.

