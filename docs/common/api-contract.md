# API Contract

## Overview

This document defines standards for API communication between frontend clients and backend services
in applications built with this framework. It establishes conventions for requests, responses,
errors, and security.

**Audience:** Backend implementers, frontend developers, QA engineers.

**Stability:** API changes should be communicated; breaking changes require coordination.

## Authentication & Authorization

### Supported Mechanisms

1. **Cookie-based sessions** (same-origin deployments)
   - Session cookies (HttpOnly, Secure, SameSite)
   - Automatically included with requests
   - No client-side token storage

2. **Bearer tokens** (cross-origin or token-based auth)
   - Tokens obtained via OAuth or similar flow
   - Stored in memory only (never localStorage)
   - Sent in Authorization header

**Client responsibilities:**

- Detect available authentication mechanism
- Include appropriate credentials with requests
- Handle session expiration gracefully

### Authorization

- APIs should enforce least-privilege access
- Frontend should handle 403 responses by hiding unavailable features
- Scope-based authorization recommended for granular access

## Request Standards

### HTTP Methods

- Use appropriate verbs: GET (read), POST (create), PUT/PATCH (update), DELETE
- GET requests must be idempotent and safe to retry
- Mutating operations should use POST/PUT/PATCH with appropriate idempotency keys

### Headers

**Required:**

- `Content-Type: application/json` for requests with body
- `Accept: application/json` for JSON responses

**Optional:**

- `Authorization: Bearer {token}` when using token auth
- Correlation ID headers for request tracing

### Query Parameters

- Use for filtering, pagination, sorting
- Document all supported parameters
- Validate on server; ignore unknown parameters

### Request Bodies

- JSON format with consistent structure
- Include required fields; optional fields clearly documented
- Validation errors return structured error response

## Response Standards

### Success Responses

- `200 OK` for successful GET/PUT/PATCH/DELETE
- `201 Created` for successful POST with Location header
- `204 No Content` for successful DELETE with no body

**JSON structure:**

```json
{
  "data": ...               // Primary response data
  "meta": { ... }          // Optional metadata (pagination, etc.)
  "_links": { ... }        // Optional HAL-style links
}
```

### Pagination

- Use cursor-based pagination for large datasets
- Response includes next/previous page cursors or URLs
- Clients follow links rather than constructing page numbers

**Example:**

```json
{
  "data": [...],
  "_links": {
    "next": { "href": "/api/items?cursor=abc" },
    "prev": { "href": "/api/items?cursor=xyz" }
  }
}
```

### Error Responses

**Standard format:**

```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable description",
    "details": { ... }       // Optional additional context
  }
}
```

**Common error codes:**

- `INVALID_REQUEST` — validation failed
- `UNAUTHENTICATED` — login required
- `FORBIDDEN` — insufficient permissions
- `NOT_FOUND` — resource doesn't exist
- `RATE_LIMITED` — too many requests
- `INTERNAL_ERROR` — server malfunction
- `SERVICE_UNAVAILABLE` — temporarily unavailable

**HTTP status mapping:**

- 4xx — client errors (fixable by user)
- 5xx — server errors (retry may succeed)

### Network Errors

- Offline, CORS, timeout not part of HTTP response
- Client should catch and show appropriate UI

## Caching

**Recommended headers:**

- `Cache-Control: private, max-age=300` for user-specific data
- `Cache-Control: public, max-age=3600` for shared data
- `ETag` or `Last-Modified` for conditional requests
- `Vary: Authorization` when responses vary by auth status

Clients may use `If-None-Match` for revalidation.

## Rate Limiting

- Implement rate limiting on sensitive endpoints
- Return `429 Too Many Requests` when limit exceeded
- Include `Retry-After` header with seconds to wait
- Consider returning rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `X-RateLimit-Reset`

## CORS

For cross-origin deployments:

```http
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

Wildcard `*` not allowed when using credentials.

## Data Privacy & Security

- All traffic must use HTTPS
- Minimize Personal Identifiable Information (PII) in responses
- Implement access control per resource
- Log security events but avoid sensitive data in logs
- Support data deletion requests (GDPR compliance)

## Monitoring & Observability

**Backend should emit:**

- Request rate per endpoint
- Error rate by status code and error type
- Response time percentiles (p50, p95, p99)
- Authentication failure rate

**Correlation:**

- Accept `X-Request-ID` header from client, echo in responses
- Log request ID with all server logs for tracing

## Implementation Guidance

### For Backend Teams

- Provide API documentation (OpenAPI/Swagger recommended)
- Include example requests and responses for all endpoints
- Implement consistent error format across all endpoints
- Add comprehensive validation with clear error messages
- Write integration tests covering error paths
- Consider versioning strategy early (path-based or header-based)

### For Frontend Teams

- Centralize API client with consistent error handling
- Implement retry logic with exponential backoff for 429 and 5xx
- Add request cancellation for long-running operations
- Cache responses appropriately based on Cache-Control
- Write contract tests against mock servers
- Monitor API performance in production

## Contract Testing

Frontend should verify:

- Successful requests parse correctly
- Error responses handled gracefully
- Pagination works through all pages
- Authentication flows function
- Rate limiting triggers backoff

Backend should provide:

- API specification document
- Example responses
- Test fixtures or mock server
- Contract test suite (optional but recommended)
