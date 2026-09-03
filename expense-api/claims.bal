import ballerina/http;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function toClaim(ClaimRow row) returns ExpenseClaim {
    return {
        id: row.id,
        employeeId: row.employee_id,
        categoryId: row.category_id,
        amount: row.amount,
        claimDate: row.claim_date,
        description: row.description,
        receiptUrl: row.receipt_url,
        status: row.status,
        managerComment: row.manager_comment,
        exportedAt: row.exported_at
    };
}

function getClaimRow(string claimId) returns ClaimRow?|error {
    ClaimRow|error row = dbClient->queryRow(`
        SELECT id, employee_id, category_id, amount, claim_date, description, receipt_url, status, manager_comment, exported_at
        FROM expense_claims WHERE id = ${claimId}
    `, ClaimRow);
    if row is ClaimRow {
        return row;
    }
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

// A caller may see a claim when it is their own, or when they are the direct
// manager of the claim's employee - see thunder-authentication's manager
// scoping rule.
function canViewClaim(User caller, ClaimRow claimRow) returns boolean|error {
    if caller.id == claimRow.employee_id {
        return true;
    }
    return isDirectReport(caller.id, claimRow.employee_id);
}

function validateClaimInput(NewExpenseClaim payload) returns string|http:BadRequest|error {
    string receiptUrl = payload.receiptUrl.trim();
    if receiptUrl.length() == 0 {
        return toBadRequest("receiptUrl is required to submit a claim");
    }
    if payload.amount <= 0d {
        return toBadRequest("amount must be greater than zero");
    }
    if payload.claimDate.trim().length() == 0 {
        return toBadRequest("claimDate is required");
    }
    if payload.description.trim().length() == 0 {
        return toBadRequest("description is required");
    }
    ExpenseCategory? category = check getCategoryById(payload.categoryId);
    if category is () {
        return toBadRequest("categoryId does not reference an existing category");
    }
    if !category.active {
        return toBadRequest("categoryId refers to an inactive category");
    }
    return receiptUrl;
}

function submitClaim(User caller, NewExpenseClaim payload) returns ExpenseClaim|http:BadRequest|error {
    string|http:BadRequest validated = check validateClaimInput(payload);
    if validated is http:BadRequest {
        return validated;
    }
    string receiptUrl = validated;
    string claimId = uuid:createRandomUuid();
    _ = check dbClient->execute(`
        INSERT INTO expense_claims (id, employee_id, category_id, amount, claim_date, description, receipt_url, status, manager_comment, exported_at)
        VALUES (${claimId}, ${caller.id}, ${payload.categoryId}, ${payload.amount}, ${payload.claimDate}, ${payload.description}, ${receiptUrl}, 'submitted', NULL, NULL)
    `);
    return {
        id: claimId,
        employeeId: caller.id,
        categoryId: payload.categoryId,
        amount: payload.amount,
        claimDate: payload.claimDate,
        description: payload.description,
        receiptUrl: receiptUrl,
        status: "submitted",
        managerComment: (),
        exportedAt: ()
    };
}

function getExpenseClaim(User caller, string claimId) returns ExpenseClaim|http:NotFound|http:Forbidden|error {
    ClaimRow? row = check getClaimRow(claimId);
    if row is () {
        return toNotFound("claim not found");
    }
    boolean canView = check canViewClaim(caller, row);
    if !canView {
        return toForbidden("caller is not authorized to view this claim");
    }
    return toClaim(row);
}

function updateExpenseClaim(User caller, string claimId, NewExpenseClaim payload) returns ExpenseClaim|http:BadRequest|http:NotFound|http:Forbidden|error {
    ClaimRow? row = check getClaimRow(claimId);
    if row is () {
        return toNotFound("claim not found");
    }
    if row.employee_id != caller.id {
        return toForbidden("only the claim's own employee may edit it");
    }
    if row.status != "rejected" {
        return toBadRequest("only a rejected claim can be edited and resubmitted");
    }
    string|http:BadRequest validated = check validateClaimInput(payload);
    if validated is http:BadRequest {
        return validated;
    }
    string receiptUrl = validated;
    _ = check dbClient->execute(`
        UPDATE expense_claims
        SET category_id = ${payload.categoryId}, amount = ${payload.amount}, claim_date = ${payload.claimDate},
            description = ${payload.description}, receipt_url = ${receiptUrl}, status = 'submitted', manager_comment = NULL
        WHERE id = ${claimId}
    `);
    return {
        id: claimId,
        employeeId: row.employee_id,
        categoryId: payload.categoryId,
        amount: payload.amount,
        claimDate: payload.claimDate,
        description: payload.description,
        receiptUrl: receiptUrl,
        status: "submitted",
        managerComment: (),
        exportedAt: ()
    };
}

function approveClaim(User caller, string claimId, string? comment) returns ExpenseClaim|http:BadRequest|http:NotFound|http:Forbidden|error {
    ClaimRow? row = check getClaimRow(claimId);
    if row is () {
        return toNotFound("claim not found");
    }
    boolean isManager = check isDirectReport(caller.id, row.employee_id);
    if !isManager {
        return toForbidden("caller is not this claim's manager");
    }
    if row.status != "submitted" {
        return toBadRequest("only a submitted claim can be approved");
    }
    _ = check dbClient->execute(`
        UPDATE expense_claims SET status = 'approved', manager_comment = ${comment} WHERE id = ${claimId}
    `);
    ClaimRow updated = row;
    updated.status = "approved";
    updated.manager_comment = comment;
    return toClaim(updated);
}

function rejectClaim(User caller, string claimId, string comment) returns ExpenseClaim|http:BadRequest|http:NotFound|http:Forbidden|error {
    if comment.trim().length() == 0 {
        return toBadRequest("a comment is required to reject a claim");
    }
    ClaimRow? row = check getClaimRow(claimId);
    if row is () {
        return toNotFound("claim not found");
    }
    boolean isManager = check isDirectReport(caller.id, row.employee_id);
    if !isManager {
        return toForbidden("caller is not this claim's manager");
    }
    if row.status != "submitted" {
        return toBadRequest("only a submitted claim can be rejected");
    }
    _ = check dbClient->execute(`
        UPDATE expense_claims SET status = 'rejected', manager_comment = ${comment} WHERE id = ${claimId}
    `);
    ClaimRow updated = row;
    updated.status = "rejected";
    updated.manager_comment = comment;
    return toClaim(updated);
}

// The claims caller may see when no employeeId filter narrows it further:
// their own claims, plus their direct reports' claims.
function resolveVisibleEmployeeIds(User caller) returns string[]|error {
    string[] ids = [caller.id];
    stream<UserRow, sql:Error?> rows = dbClient->query(`
        SELECT id, name, email, role, manager_id FROM expense_users WHERE manager_id = ${caller.id}
    `, UserRow);
    check from UserRow row in rows
        do {
            ids.push(row.id);
        };
    return ids;
}

function countExpenseClaims(string[] employeeIds, string? statusParam) returns int|error {
    sql:ParameterizedQuery baseQuery = `SELECT COUNT(*) AS total FROM expense_claims WHERE employee_id = ANY(${employeeIds})`;
    sql:ParameterizedQuery fullQuery = statusParam is string
        ? sql:queryConcat(baseQuery, ` AND status = ${statusParam}`)
        : baseQuery;
    CountRow countRow = check dbClient->queryRow(fullQuery, CountRow);
    return countRow.total;
}

function fetchExpenseClaims(string[] employeeIds, string? statusParam, int pageLimit, int offset) returns ExpenseClaim[]|error {
    sql:ParameterizedQuery baseQuery = `
        SELECT id, employee_id, category_id, amount, claim_date, description, receipt_url, status, manager_comment, exported_at
        FROM expense_claims WHERE employee_id = ANY(${employeeIds})`;
    sql:ParameterizedQuery filtered = statusParam is string
        ? sql:queryConcat(baseQuery, ` AND status = ${statusParam}`)
        : baseQuery;
    sql:ParameterizedQuery paged = sql:queryConcat(filtered, ` ORDER BY claim_date DESC, id LIMIT ${pageLimit} OFFSET ${offset}`);
    stream<ClaimRow, sql:Error?> rows = dbClient->query(paged, ClaimRow);
    ExpenseClaim[] claims = [];
    check from ClaimRow row in rows
        do {
            claims.push(toClaim(row));
        };
    return claims;
}

function listExpenseClaims(User caller, string? employeeIdParam, string? statusParam, int pageLimit, int offset) returns ClaimsPage|http:Forbidden|error {
    string[] visibleEmployeeIds = check resolveVisibleEmployeeIds(caller);
    string[] scopeIds = visibleEmployeeIds;
    if employeeIdParam is string {
        if visibleEmployeeIds.indexOf(employeeIdParam) is () {
            return toForbidden("caller is not authorized to view this employee's claims");
        }
        scopeIds = [employeeIdParam];
    }
    int count = check countExpenseClaims(scopeIds, statusParam);
    ExpenseClaim[] claims = check fetchExpenseClaims(scopeIds, statusParam, pageLimit, offset);
    map<string> extraParams = {};
    if employeeIdParam is string {
        extraParams["employeeId"] = employeeIdParam;
    }
    if statusParam is string {
        extraParams["status"] = statusParam;
    }
    [string?, string?] pageLinks = buildPaginationLinks("/expense-claims", extraParams, pageLimit, offset, count);
    return {count, next: pageLinks[0], previous: pageLinks[1], data: claims};
}

function csvEscape(string value) returns string {
    boolean needsQuotes = value.includes(",") || value.includes("\"") || value.includes("\n");
    if !needsQuotes {
        return value;
    }
    string escaped = "";
    int i = 0;
    while i < value.length() {
        string ch = value.substring(i, i + 1);
        if ch == "\"" {
            escaped = escaped + "\"\"";
        } else {
            escaped = escaped + ch;
        }
        i += 1;
    }
    return "\"" + escaped + "\"";
}

function csvRow(ClaimRow row) returns string {
    string comment = row.manager_comment ?: "";
    string exportedAt = row.exported_at ?: "";
    string[] fields = [
        csvEscape(row.id),
        csvEscape(row.employee_id),
        csvEscape(row.category_id),
        row.amount.toString(),
        csvEscape(row.claim_date),
        csvEscape(row.description),
        csvEscape(row.receipt_url),
        csvEscape(row.status),
        csvEscape(comment),
        csvEscape(exportedAt)
    ];
    return string:'join(",", ...fields) + "\n";
}

// Exports approved, not-yet-exported claims in [from, to] as CSV and marks
// them exported in the same statement - a single atomic UPDATE ... RETURNING
// so a claim can never be picked up by two concurrent exports.
function exportExpenseClaims(string fromDate, string toDate) returns string|http:BadRequest|error {
    if fromDate.trim().length() == 0 || toDate.trim().length() == 0 {
        return toBadRequest("from and to are required");
    }
    if fromDate > toDate {
        return toBadRequest("from must not be after to");
    }
    string exportedAt = time:utcToString(time:utcNow());
    stream<ClaimRow, sql:Error?> rows = dbClient->query(`
        UPDATE expense_claims
        SET exported_at = ${exportedAt}
        WHERE status = 'approved' AND exported_at IS NULL
          AND claim_date >= ${fromDate} AND claim_date <= ${toDate}
        RETURNING id, employee_id, category_id, amount, claim_date, description, receipt_url, status, manager_comment, exported_at
    `, ClaimRow);
    string csv = "id,employeeId,categoryId,amount,claimDate,description,receiptUrl,status,managerComment,exportedAt\n";
    check from ClaimRow row in rows
        do {
            csv += csvRow(row);
        };
    return csv;
}
