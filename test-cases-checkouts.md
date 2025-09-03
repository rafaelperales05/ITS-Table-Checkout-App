# Checkouts API Test Cases

## 1. GET /api/checkouts/stats
**Expected Response:**
```json
{
  "totalActive": 5,
  "totalOverdue": 2,
  "todayCheckouts": 8,
  "totalTables": 20,
  "availableTables": 15,
  "checkedOutTables": 5,
  "averageCheckoutDurationHours": 3.5
}
```

**Test Cases:**
- PASS: Returns 200 status
- PASS: Returns all required fields
- PASS: Numbers are valid (non-negative)
- FAIL: Database connection failure → 500

## 2. GET /api/checkouts/active
**Expected Response:**
```json
[
  {
    "id": 1,
    "organizationId": 1,
    "tableId": 1,
    "checkoutTime": "2025-01-01T10:00:00Z",
    "expectedReturnTime": "2025-01-01T14:00:00Z",
    "status": "active",
    "Organization": {
      "id": 1,
      "officialName": "Student Government"
    },
    "Table": {
      "id": 1,
      "tableNumber": "T001",
      "location": "Main Hall"
    }
  }
]
```

**Test Cases:**
- PASS: Returns 200 status
- PASS: Returns array (empty if no active checkouts)
- PASS: Each checkout has Organization and Table data
- PASS: Handles missing Organization/Table gracefully
- FAIL: Database error → 500

## 3. GET /api/checkouts/overdue
**Expected Response:** Same format as active, but filtered for overdue

**Test Cases:**
- PASS: Returns 200 status
- PASS: Only returns checkouts past expectedReturnTime
- PASS: Includes Organization and Table data

## 4. GET /api/checkouts (with query params)
**Test Cases:**
- PASS: `?status=active` filters correctly
- PASS: `?overdue=true` filters correctly
- PASS: `?page=2&limit=10` paginates correctly
- PASS: Returns pagination metadata

## 5. POST /api/checkouts
**Request Body:**
```json
{
  "organizationName": "Student Government",
  "tableId": 1,
  "expectedReturnTime": "2025-01-01T18:00:00Z",
  "checkedOutBy": "John Doe"
}
```

**Test Cases:**
- PASS: Creates checkout successfully → 201
- FAIL: Missing required fields → 400
- FAIL: Table not found → 404
- FAIL: Table not available → 400
- FAIL: Organization banned → 403
- FAIL: Organization already has active checkout → 400

## 6. GET /api/checkouts/[id]
**Test Cases:**
- PASS: Valid ID returns checkout with includes → 200
- FAIL: Invalid ID → 404
- FAIL: Non-numeric ID → 400

## 7. POST /api/checkouts/[id]/return
**Request Body:**
```json
{
  "returnedBy": "Jane Doe",
  "notes": "Returned in good condition"
}
```

**Test Cases:**
- PASS: Valid return → 200
- FAIL: Checkout not found → 404
- FAIL: Checkout not active → 400
- PASS: Updates table status to available
- PASS: Sets actualReturnTime
- PASS: Handles overdue returns correctly

## Testing Order (Simplest → Most Complex)
1. `/api/health` (no database)
2. `/api/checkouts/stats` (read-only, simple queries)
3. `/api/checkouts/active` (read-only with joins)
4. `/api/checkouts/overdue` (read-only with filtering)
5. `/api/checkouts/[id]` (read-only with params)
6. `/api/checkouts` GET (read-only with complex queries)
7. `/api/checkouts` POST (write operations)
8. `/api/checkouts/[id]/return` (complex write operations)