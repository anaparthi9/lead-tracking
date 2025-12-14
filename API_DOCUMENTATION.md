# Vyomaa CRM - API Documentation

Base URL: `http://localhost:5000/api`

All endpoints (except authentication) require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Table of Contents
1. [Authentication](#authentication)
2. [Companies](#companies)
3. [Opportunities](#opportunities)
4. [Dashboard](#dashboard)

---

## Authentication

### Login

**POST** `/auth/login`

Login and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@vyomaa.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@vyomaa.com",
    "name": "Admin User"
  }
}
```

**Errors:**
- `400` - Email and password are required
- `401` - Invalid credentials

---

### Get Current User

**GET** `/auth/me`

Get information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@vyomaa.com",
    "name": "Admin User"
  }
}
```

**Errors:**
- `401` - No token provided / Invalid token

---

## Companies

### Get All Companies

**GET** `/companies`

Get a paginated list of companies with optional filters.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `search` (string) - Search by name, industry, or location
- `status` (string) - Filter by status: "Active" or "Inactive"
- `model` (string) - Filter by model: "EPC", "RESCO", "OPEX", "CAPEX", "Other"
- `industry` (string) - Filter by industry
- `location` (string) - Filter by location
- `minCapacity` (number) - Minimum capacity in MW
- `maxCapacity` (number) - Maximum capacity in MW

**Example:**
```
GET /companies?page=1&limit=25&status=Active&model=EPC&search=pharma
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "sr_no": 1,
      "name": "Sun Pharmaceutical Industries",
      "industry": "Pharmaceuticals",
      "location": "Mumbai",
      "re_consumption": "Solar + Storage",
      "capacity_mw": 9.5,
      "status": "Active",
      "model": "EPC",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "opportunity_id": 5,
      "sales_stage": "Proposal Issued",
      "lead_source": "Tender / RFP",
      "opportunity_status": "Open"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 536,
    "pages": 22
  }
}
```

---

### Get Company by ID

**GET** `/companies/:id`

Get detailed information about a specific company, including active and past opportunities.

**Response (200 OK):**
```json
{
  "company": {
    "id": 1,
    "sr_no": 1,
    "name": "Sun Pharmaceutical Industries",
    "industry": "Pharmaceuticals",
    "location": "Mumbai",
    "re_consumption": "Solar + Storage",
    "capacity_mw": 9.5,
    "status": "Active",
    "model": "EPC",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "activeOpportunity": {
    "id": 5,
    "company_id": 1,
    "sales_stage": "Proposal Issued",
    "lead_source": "Tender / RFP",
    "expected_mw": 9.5,
    "probability": 70,
    "owner_name": "John Doe",
    "status": "Open"
  },
  "pastOpportunities": []
}
```

**Errors:**
- `404` - Company not found

---

### Create Company

**POST** `/companies`

Create a new company.

**Request Body:**
```json
{
  "sr_no": 537,
  "name": "New Energy Company",
  "industry": "Manufacturing",
  "location": "Bangalore",
  "re_consumption": "Solar",
  "capacity_mw": 15.0,
  "status": "Active",
  "model": "RESCO"
}
```

**Required Fields:**
- `name` (string)
- `status` (string): "Active" or "Inactive"

**Response (201 Created):**
```json
{
  "id": 537,
  "sr_no": 537,
  "name": "New Energy Company",
  "industry": "Manufacturing",
  "location": "Bangalore",
  "re_consumption": "Solar",
  "capacity_mw": 15.0,
  "status": "Active",
  "model": "RESCO",
  "created_at": "2024-01-20T14:30:00Z",
  "updated_at": "2024-01-20T14:30:00Z"
}
```

---

### Update Company

**PUT** `/companies/:id`

Update an existing company.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Company Name",
  "status": "Inactive",
  "capacity_mw": 20.0
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Company Name",
  "status": "Inactive",
  "capacity_mw": 20.0,
  ...
}
```

---

### Delete Company

**DELETE** `/companies/:id`

Delete a company (this will also delete all associated opportunities).

**Response (200 OK):**
```json
{
  "message": "Company deleted successfully"
}
```

---

### Get Company Filters

**GET** `/companies/filters`

Get available filter options for industries and locations.

**Response (200 OK):**
```json
{
  "industries": [
    "Pharmaceuticals",
    "IT Services",
    "Manufacturing",
    "Automotive"
  ],
  "locations": [
    "Mumbai",
    "Bangalore",
    "Pune",
    "Delhi"
  ]
}
```

---

## Opportunities

### Get All Opportunities

**GET** `/opportunities`

Get all opportunities with optional filters.

**Query Parameters:**
- `status` (string) - Filter by status: "Open", "Won", "Lost", "On Hold"
- `sales_stage` (string) - Filter by sales stage
- `lead_source` (string) - Filter by lead source
- `owner_name` (string) - Filter by owner
- `location` (string) - Filter by company location
- `industry` (string) - Filter by company industry
- `model` (string) - Filter by company model

**Example:**
```
GET /opportunities?status=Open&sales_stage=Proposal Issued
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 5,
      "company_id": 1,
      "company_name": "Sun Pharmaceutical Industries",
      "industry": "Pharmaceuticals",
      "location": "Mumbai",
      "model": "EPC",
      "company_capacity": 9.5,
      "sales_stage": "Proposal Issued",
      "lead_source": "Tender / RFP",
      "lead_source_detail": "Government tender for solar installation",
      "acquisition_cost": 50000,
      "stage_entered_at": "2024-01-18T10:00:00Z",
      "expected_contract_date": "2024-03-15",
      "expected_mw": 9.5,
      "probability": 70,
      "value_estimate": 15000000,
      "owner_name": "John Doe",
      "status": "Open",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-18T10:00:00Z"
    }
  ]
}
```

---

### Get Opportunity by ID

**GET** `/opportunities/:id`

Get detailed information about a specific opportunity, including history and notes.

**Response (200 OK):**
```json
{
  "opportunity": {
    "id": 5,
    "company_id": 1,
    "company_name": "Sun Pharmaceutical Industries",
    "industry": "Pharmaceuticals",
    "location": "Mumbai",
    "sales_stage": "Proposal Issued",
    "lead_source": "Tender / RFP",
    "expected_mw": 9.5,
    "probability": 70,
    "owner_name": "John Doe",
    "status": "Open",
    ...
  },
  "history": [
    {
      "id": 1,
      "opportunity_id": 5,
      "from_stage": null,
      "to_stage": "Lead Qualified",
      "changed_at": "2024-01-10T09:00:00Z",
      "changed_by": "Admin User"
    },
    {
      "id": 2,
      "opportunity_id": 5,
      "from_stage": "Lead Qualified",
      "to_stage": "Proposal Issued",
      "changed_at": "2024-01-18T10:00:00Z",
      "changed_by": "Admin User"
    }
  ],
  "notes": [
    {
      "id": 1,
      "opportunity_id": 5,
      "author_name": "John Doe",
      "content": "Initial meeting went well. Client is interested.",
      "created_at": "2024-01-11T14:30:00Z"
    }
  ]
}
```

---

### Create Opportunity

**POST** `/opportunities`

Create a new opportunity for a company.

**Request Body:**
```json
{
  "company_id": 1,
  "sales_stage": "Lead Qualified",
  "lead_source": "Tender / RFP",
  "lead_source_detail": "Government tender for solar installation",
  "acquisition_cost": 50000,
  "expected_contract_date": "2024-03-15",
  "expected_mw": 9.5,
  "probability": 10,
  "value_estimate": 15000000,
  "owner_name": "John Doe"
}
```

**Required Fields:**
- `company_id` (number)
- `sales_stage` (string)
- `lead_source` (string)
- `owner_name` (string)

**Response (201 Created):**
```json
{
  "id": 6,
  "company_id": 1,
  "sales_stage": "Lead Qualified",
  ...
}
```

**Errors:**
- `400` - Company already has an active opportunity
- `404` - Company not found

---

### Update Opportunity

**PUT** `/opportunities/:id`

Update an existing opportunity.

**Request Body:** (all fields optional)
```json
{
  "lead_source": "MERCOM / Conference",
  "expected_mw": 12.0,
  "probability": 80,
  "status": "Won"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  ...updated fields...
}
```

---

### Change Opportunity Stage

**POST** `/opportunities/:id/change-stage`

Change the sales stage of an opportunity. This creates a history entry and updates the probability.

**Request Body:**
```json
{
  "new_stage": "Commercial Alignment"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "sales_stage": "Commercial Alignment",
  "probability": 60,
  "stage_entered_at": "2024-01-20T15:00:00Z",
  ...
}
```

---

### Add Note

**POST** `/opportunities/:id/notes`

Add a note to an opportunity.

**Request Body:**
```json
{
  "content": "Followed up with the client. They requested a revised proposal."
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "opportunity_id": 5,
  "author_name": "Admin User",
  "content": "Followed up with the client. They requested a revised proposal.",
  "created_at": "2024-01-20T16:00:00Z"
}
```

---

### Get Opportunity History

**GET** `/opportunities/:id/history`

Get the stage change history for an opportunity.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "opportunity_id": 5,
      "from_stage": null,
      "to_stage": "Lead Qualified",
      "changed_at": "2024-01-10T09:00:00Z",
      "changed_by": "Admin User"
    },
    {
      "id": 2,
      "opportunity_id": 5,
      "from_stage": "Lead Qualified",
      "to_stage": "Site Survey",
      "changed_at": "2024-01-15T10:00:00Z",
      "changed_by": "Admin User"
    }
  ]
}
```

---

## Dashboard

### Get Dashboard Summary

**GET** `/dashboard/summary`

Get pipeline summary metrics including total opportunities, capacity by stage, and model distribution.

**Query Parameters:**
- `start_date` (string) - Filter opportunities created after this date
- `end_date` (string) - Filter opportunities created before this date
- `location` (string) - Filter by company location
- `industry` (string) - Filter by company industry
- `model` (string) - Filter by company model
- `status` (string) - Filter by company status

**Response (200 OK):**
```json
{
  "summary": {
    "total_opportunities": 25,
    "total_capacity_mw": 287.5,
    "avg_probability": 45.2
  },
  "by_stage": [
    {
      "sales_stage": "Lead Qualified",
      "count": 5,
      "capacity_mw": 50.0,
      "avg_probability": 10
    },
    {
      "sales_stage": "Proposal Issued",
      "count": 3,
      "capacity_mw": 35.5,
      "avg_probability": 70
    }
  ],
  "by_model": [
    {
      "model": "EPC",
      "count": 12,
      "capacity_mw": 120.5
    },
    {
      "model": "RESCO",
      "count": 8,
      "capacity_mw": 95.0
    }
  ]
}
```

---

### Get Conversion Metrics

**GET** `/dashboard/conversions`

Get conversion metrics including overall conversion rate and conversion by lead source.

**Query Parameters:**
- `start_date` (string)
- `end_date` (string)

**Response (200 OK):**
```json
{
  "overall": {
    "won_count": 8,
    "total_count": 50,
    "conversion_rate": 16.0
  },
  "stage_transitions": [
    {
      "from_stage": "Lead Qualified",
      "to_stage": "Pre-Feasibility",
      "transition_count": 25
    }
  ],
  "by_lead_source": [
    {
      "lead_source": "Tender / RFP",
      "won_count": 5,
      "total_count": 20,
      "conversion_rate": 25.0
    },
    {
      "lead_source": "MERCOM / Conference",
      "won_count": 2,
      "total_count": 15,
      "conversion_rate": 13.3
    }
  ]
}
```

---

### Get Lead Source Metrics

**GET** `/dashboard/lead-sources`

Get detailed metrics for each lead source including opportunity count, capacity, acquisition cost, and CAC.

**Query Parameters:**
- `start_date` (string)
- `end_date` (string)

**Response (200 OK):**
```json
{
  "data": [
    {
      "lead_source": "Tender / RFP",
      "opportunity_count": 20,
      "total_capacity_mw": 150.5,
      "avg_capacity_mw": 7.525,
      "total_acquisition_cost": 500000,
      "avg_acquisition_cost": 25000,
      "won_count": 5,
      "cac_per_contract": 100000
    },
    {
      "lead_source": "MERCOM / Conference",
      "opportunity_count": 15,
      "total_capacity_mw": 95.0,
      "avg_capacity_mw": 6.33,
      "total_acquisition_cost": 300000,
      "avg_acquisition_cost": 20000,
      "won_count": 2,
      "cac_per_contract": 150000
    }
  ]
}
```

---

### Get Duration Metrics

**GET** `/dashboard/durations`

Get average duration metrics including time from lead to contract and time in each stage.

**Query Parameters:**
- `start_date` (string)
- `end_date` (string)

**Response (200 OK):**
```json
{
  "avg_lead_to_contract_days": 120.5,
  "by_stage": [
    {
      "stage": "Lead Qualified",
      "avg_days": 15.5,
      "min_days": 5,
      "max_days": 30,
      "sample_size": 10
    },
    {
      "stage": "Pre-Feasibility",
      "avg_days": 12.0,
      "min_days": 7,
      "max_days": 20,
      "sample_size": 8
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "stack": "..." // Only in development mode
}
```

---

## Sales Stages (Enum)

- Lead Qualified
- Pre-Feasibility
- Site Survey
- Technical Feasibility Report
- Business Case & ROI
- Commercial Alignment
- Proposal Issued
- Negotiation & Compliance
- Documentation & Signing

## Lead Sources (Enum)

- Tender / RFP
- MERCOM / Conference
- Existing Customer
- Referrals & Partners
- Other

## Company Models (Enum)

- EPC
- RESCO
- OPEX
- CAPEX
- Other

## Company Status (Enum)

- Active
- Inactive

## Opportunity Status (Enum)

- Open
- Won
- Lost
- On Hold

---

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider implementing rate limiting to prevent abuse.

## Pagination

For endpoints that support pagination:
- Default page size: 50
- Maximum page size: 100
- Page numbers start at 1

---

**API Version:** 1.0.0
**Last Updated:** 2024-01-20
