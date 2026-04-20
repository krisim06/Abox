# Retrieval-Augmented Generation (RAG)

## 1. Purpose

RAG in ABox exists to improve generation quality and consistency by supplying relevant context before generation.

The goal is not academic completeness.  
The goal is practical product benefit.

## 2. Initial retrieval use cases

### 2.1 Style retrieval
Examples:
- city-pop aesthetic notes
- dreamy editorial references
- color/composition guidance

### 2.2 Policy retrieval
Examples:
- disallowed request categories
- risky transformation guidance
- brand/person likeness guardrails if applicable

### 2.3 Prompt template retrieval
Examples:
- proven prompt structures
- template building blocks
- negative prompt conventions where useful

## 3. Initial knowledge types

Supported first:
- `style_guide`
- `policy`
- `prompt_template`

Deferred:
- user taste memory
- result exemplar retrieval
- larger content discovery retrieval

## 4. Data model

### Source documents
`knowledge_documents`
- full source text
- type
- visibility
- metadata

### Retrieval units
`knowledge_chunks`
- chunk text
- chunk order
- embedding
- metadata

## 5. Chunking strategy

Initial chunking should be simple and explainable.

Guidance:
- chunk by paragraphs/sections, not arbitrary tiny fragments
- preserve semantic coherence
- attach chunk metadata like document type/title/index
- avoid over-chunking early

Desired properties:
- enough context to be useful
- small enough to retrieve precisely

## 6. Embedding strategy

Use a single text embedding pipeline for:
- chunk embeddings
- retrieval query embeddings

Important:
- embedding generation should live behind a dedicated interface
- embedding model choice may change later
- callers should not depend on provider-specific details

Example interface:
- `embedText(text: string): Promise<number[]>`

## 7. Retrieval flow

```text
User prompt
  -> query embedding
  -> similarity search over knowledge_chunks
  -> optional filtering by doc_type / visibility
  -> top-k chunks
  -> returned to orchestrator
```

## 8. Visibility rules

### system
Application-owned foundational documents

### public
Potentially shared/common docs

### private
User-owned docs; should only be retrievable by the owner

Private retrieval should remain permission-aware from the start.

## 9. MVP retrieval rules

- retrieval is optional, not mandatory for every request
- top-k should stay small and understandable
- no fancy reranking required yet unless retrieval quality is obviously weak
- keep document seeding manual at first if needed

## 10. Seed content recommendations

Create a small, high-signal seed set:
- 5–10 style guides
- 3–5 policy docs
- 5–10 prompt templates

Better to have a small good set than a large messy corpus.

## 11. Failure modes to watch

- empty retrieval on clearly relevant prompts
- wrong document type dominating results
- low-signal noisy chunks
- permission leaks on private docs
- generation plan ignoring retrieved context

## 12. Future enhancements

- metadata filtering
- reranking
- retrieval analytics
- user taste retrieval
- content similarity retrieval
- hybrid keyword + vector search if justified

## 13. Design rule

> Retrieval should be a clean subsystem with clear ownership, not a hidden prompt hack.
