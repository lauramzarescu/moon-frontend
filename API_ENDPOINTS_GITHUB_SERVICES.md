# API Endpoint Reference: GitHub, Service Deployments, and Service Repositories

Base mounts (from server index):
- /v1/github → general GitHub endpoints
- /v1/github/services → service-repository linking endpoints
- /v1/github/deployments → service deployment endpoints

All endpoints return JSON.

---

## GitHub Endpoints (/v1/github)

### 1) GET /v1/github/repositories
- Query
  - org: string (optional) — GitHub org login to list repos from; if omitted, lists authenticated user’s repos
- Request body: none
- Response 200: Array of repositories
  - Each item:
    - id: number
    - name: string
    - full_name: string
    - private: boolean
    - owner: string
    - default_branch: string
    - html_url: string
- Error responses:
  - 500: { message: string }

### 2) GET /v1/github/commits/:repo
- Path params
  - repo: string (required)
- Query: none
- Request body: none
- Response 200: Latest commit for the repo’s default configured branch
  - {
    - sha: string
    - message: string
    - authorName: string | null
    - authorEmail: string | null
    - date: string | null (ISO)
    - url: string
  }
- Error responses:
  - 500: { message: string }

### 3) GET /v1/github/commits/:repo/:branch
- Path params
  - repo: string (required)
  - branch: string (required)
- Query: none
- Request body: none
- Response 200: Latest commit on the specified branch
  - {
    - sha: string
    - message: string
    - authorName: string | null
    - authorEmail: string | null
    - date: string | null (ISO)
    - url: string
  }
- Error responses:
  - 500: { message: string }

---

## Service Repository Endpoints (/v1/github/services)

### 1) POST /v1/github/services/repository
- Query: none
- Request body (JSON)
  - repo: string (required)
  - serviceArn: string (required)
- Response 201: ServiceRepository record (created/upserted)
  - {
    - id: string (UUID)
    - serviceArn: string
    - owner: string
    - repo: string
    - createdAt: string (ISO datetime)
    - updatedAt: string (ISO datetime)
    - organizationId: string
  }
- Error responses:
  - 400: { message: string } (e.g., missing GITHUB_OWNER or organization context)
  - 500: { message: string }

### 2) GET /v1/github/services/repositories
- Query: none
- Request body: none
- Response 200: Array<ServiceRepository>
  - Each item:
    - id: string (UUID)
    - serviceArn: string
    - owner: string
    - repo: string
    - createdAt: string (ISO datetime)
    - updatedAt: string (ISO datetime)
    - organizationId: string
- Error responses:
  - 400: { message: string } (e.g., missing organization context)
  - 500: { message: string }

### 3) GET /v1/github/services/:id/repository
- Path params
  - id: string (UUID; required)
- Query: none
- Request body: none
- Response 200: ServiceRepository
  - {
    - id: string (UUID)
    - serviceArn: string
    - owner: string
    - repo: string
    - createdAt: string (ISO datetime)
    - updatedAt: string (ISO datetime)
    - organizationId: string
  }
- Error responses:
  - 400: { message: string } (e.g., missing organization context)
  - 404: { message: string }

### 4) DELETE /v1/github/services/:id/repository
- Path params
  - id: string (UUID; required)
- Query: none
- Request body: none
- Response 200: Deleted ServiceRepository record
  - {
    - id: string (UUID)
    - serviceArn: string
    - owner: string
    - repo: string
    - createdAt: string (ISO datetime)
    - updatedAt: string (ISO datetime)
    - organizationId: string
  }
- Error responses:
  - 400: { message: string } (e.g., missing organization context)
  - 500: { message: string }

---

## Service Deployment Endpoints (/v1/github/deployments)

Note: In line with the project’s ECS identifier preference, id represents the ECS serviceArn (string).

### 1) GET /v1/github/deployments/services/:id/latest-commit
- Path params
  - id: string (required; ECS serviceArn)
- Query: none
- Request body: none
- Response 200: Latest commit for the linked repository’s default branch
  - {
    - sha: string
    - message: string
    - authorName: string | null
    - authorEmail: string | null
    - date: string | null (ISO)
    - url: string
  }
- Error responses:
  - 400: { message: string } (e.g., missing organization context)
  - 500: { message: string }

### 2) GET /v1/github/deployments/services/:id/latest-commit/:branch
- Path params
  - id: string (required; ECS serviceArn)
  - branch: string (required)
- Query: none
- Request body: none
- Response 200: Latest commit on the specified branch for the linked repository
  - {
    - sha: string
    - message: string
    - authorName: string | null
    - authorEmail: string | null
    - date: string | null (ISO)
    - url: string
  }
- Error responses:
  - 400: { message: string } (e.g., missing organization context)
  - 500: { message: string }

---

## Notes
- Content-Type for requests with bodies: application/json
- All error responses follow a simple shape: { message: string }

