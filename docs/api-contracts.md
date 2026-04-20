# API Contracts

## Purpose

Define stable request/response shapes for the MVP API surface.

## 1. POST /api/generate

### Purpose
Create a generation request and durable async job.

### Request
```json
{
  "prompt": "dreamy city-pop album cover at night",
  "assetType": "image"
}
```

### Response
```json
{
  "contentId": "uuid",
  "jobId": "uuid",
  "status": "queued"
}
```

### Errors
- `401` unauthenticated
- `400` invalid prompt
- `500` internal job creation error

## 2. GET /api/jobs/:id

### Purpose
Fetch current job state

### Response
```json
{
  "jobId": "uuid",
  "contentId": "uuid",
  "status": "running",
  "errorMessage": null
}
```

## 3. GET /api/content/:id

### Purpose
Fetch generated or uploaded content metadata and status

### Response
```json
{
  "id": "uuid",
  "status": "completed",
  "assetType": "image",
  "prompt": "dreamy city-pop album cover at night",
  "revisedPrompt": null,
  "imageUrl": "https://...",
  "modelName": "provider/model",
  "createdAt": "timestamp"
}
```

## 4. POST /api/knowledge-documents

### Purpose
Create a retrieval source document

### Request
```json
{
  "docType": "style_guide",
  "title": "City-pop style notes",
  "body": "..."
}
```

## 5. POST /api/retrieval/test

### Purpose
Run a test retrieval query for development/admin use

### Request
```json
{
  "query": "dreamy retro city-pop aesthetic",
  "docTypes": ["style_guide", "prompt_template"]
}
```

### Response
```json
{
  "results": [
    {
      "documentId": "uuid",
      "chunkId": "uuid",
      "chunkText": "...",
      "score": 0.88
    }
  ]
}
```

## Notes
- Keep responses stable and typed
- Do not leak internal fields casually
- Route handlers remain thin even if these contracts expand
