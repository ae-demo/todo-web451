# Expense Claims — Design

One web application backed by one Ballerina service and its own database
covers the whole workflow: employees submit claims, managers approve or
reject them, finance exports approved claims to a payroll-ready file, and an
admin maintains manager assignments and the expense-category list. All four
roles sign in through Thunder, the platform identity provider, and the
service enforces role-scoped access on every operation.

## Context (C1)

```mermaid
graph TD
  Employee((Employee))
  Manager((Manager))
  Finance((Finance))
  Admin((Admin))

  Employee -->|submits & tracks claims| System[Expense Claims System]
  Manager -->|approves / rejects claims| System
  Finance -->|reviews & exports approved claims| System
  Admin -->|assigns managers, maintains categories| System

  System -->|sign-in| Thunder[Thunder Auth]
```

## Domain model (ER)

```mermaid
erDiagram
  USER {
    string id
    string name
    string email
    string role
    string managerId
  }
  EXPENSE_CATEGORY {
    string id
    string name
    boolean active
  }
  EXPENSE_CLAIM {
    string id
    string employeeId
    string categoryId
    decimal amount
    date claimDate
    string description
    string receiptUrl
    string status
    string managerComment
    datetime exportedAt
  }

  USER ||--o{ EXPENSE_CLAIM : "submits (employeeId)"
  USER ||--o{ USER : "manages (managerId)"
  EXPENSE_CATEGORY ||--o{ EXPENSE_CLAIM : "categorizes"
```

## Key flows

### Submit and track a claim

```mermaid
sequenceDiagram
  actor Employee
  participant WebApp as Expense Claims Web App
  participant API as Expense Claims API
  participant DB as Expense Claims Database

  Employee->>WebApp: Fill claim (amount, category, date, description, receipt)
  WebApp->>API: POST /expense-claims
  API->>DB: Insert claim (status=submitted)
  API-->>WebApp: 201 Created
  Employee->>WebApp: View "My Claims"
  WebApp->>API: GET /expense-claims?employeeId=me
  API-->>WebApp: Claims with status
```

### Manager approves or rejects a claim

```mermaid
sequenceDiagram
  actor Manager
  participant WebApp as Expense Claims Web App
  participant API as Expense Claims API
  participant DB as Expense Claims Database

  Manager->>WebApp: Open pending claims for direct reports
  WebApp->>API: GET /expense-claims?status=submitted
  API-->>WebApp: Pending claims
  Manager->>WebApp: Approve or reject with comment
  WebApp->>API: POST /expense-claims/{id}/approve or /reject
  API->>DB: Update status + comment
  API-->>WebApp: 200 OK
```

### Rejected claim edited and resubmitted

```mermaid
sequenceDiagram
  actor Employee
  participant WebApp as Expense Claims Web App
  participant API as Expense Claims API

  Employee->>WebApp: Open rejected claim, see manager comment
  Employee->>WebApp: Edit fields
  WebApp->>API: PUT /expense-claims/{id}
  API->>API: Reset status to submitted
  API-->>WebApp: 200 OK
```

### Finance exports approved claims

```mermaid
sequenceDiagram
  actor Finance
  participant WebApp as Expense Claims Web App
  participant API as Expense Claims API
  participant DB as Expense Claims Database

  Finance->>WebApp: Choose export period
  WebApp->>API: GET /expense-claims/export?from&to
  API->>DB: Query approved, un-exported claims in range
  API->>DB: Mark claims exportedAt=now
  API-->>WebApp: CSV file
```

### Admin maintains managers and categories

```mermaid
sequenceDiagram
  actor Admin
  participant WebApp as Expense Claims Web App
  participant API as Expense Claims API
  participant DB as Expense Claims Database

  Admin->>WebApp: Assign employee's manager
  WebApp->>API: PUT /users/{id}/manager
  API->>DB: Update managerId
  Admin->>WebApp: Add/deactivate expense category
  WebApp->>API: POST /expense-categories or PATCH /expense-categories/{id}
  API->>DB: Insert/update category
```

