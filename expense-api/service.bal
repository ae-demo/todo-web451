import ballerina/http;

// Every resource requires a caller identity injected by the gateway
// (X-User-Id). The header is declared optional so a missing one resolves to
// 401 from our own handler rather than a generic 400 from the framework -
// see the api-management skill.
service / on httpListener {

    resource function get expense\-claims(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            string? employeeId, string? status, int 'limit = 20, int offset = 0)
            returns http:Ok|http:Unauthorized|http:Forbidden|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User caller = check resolveCaller(x\-user\-id, x\-user\-name);
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        ClaimsPage|http:Forbidden result = check listExpenseClaims(caller, employeeId, status, pageLimit, pageOffset);
        if result is http:Forbidden {
            return result;
        }
        return <http:Ok>{body: result};
    }

    resource function post expense\-claims(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            NewExpenseClaim payload) returns http:Created|http:BadRequest|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User caller = check resolveCaller(x\-user\-id, x\-user\-name);
        ExpenseClaim|http:BadRequest result = check submitClaim(caller, payload);
        if result is http:BadRequest {
            return result;
        }
        return <http:Created>{body: result};
    }

    resource function get expense\-claims/export(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            string 'from, string to) returns http:Ok|http:BadRequest|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User _ = check resolveCaller(x\-user\-id, x\-user\-name);
        string|http:BadRequest result = check exportExpenseClaims('from, to);
        if result is http:BadRequest {
            return result;
        }
        return <http:Ok>{body: result, mediaType: "text/csv"};
    }

    resource function get expense\-claims/[string claimId](@http:Header string? x\-user\-id, @http:Header string? x\-user\-name)
            returns http:Ok|http:NotFound|http:Forbidden|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User caller = check resolveCaller(x\-user\-id, x\-user\-name);
        ExpenseClaim|http:NotFound|http:Forbidden result = check getExpenseClaim(caller, claimId);
        if result !is ExpenseClaim {
            return result;
        }
        return <http:Ok>{body: result};
    }

    resource function put expense\-claims/[string claimId](@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            NewExpenseClaim payload) returns http:Ok|http:BadRequest|http:NotFound|http:Forbidden|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User caller = check resolveCaller(x\-user\-id, x\-user\-name);
        ExpenseClaim|http:BadRequest|http:NotFound|http:Forbidden result = check updateExpenseClaim(caller, claimId, payload);
        if result !is ExpenseClaim {
            return result;
        }
        return <http:Ok>{body: result};
    }

    resource function post expense\-claims/[string claimId]/approve(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            ClaimDecision? payload) returns http:Ok|http:BadRequest|http:NotFound|http:Forbidden|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User caller = check resolveCaller(x\-user\-id, x\-user\-name);
        string? comment = payload is ClaimDecision ? payload.comment : ();
        ExpenseClaim|http:BadRequest|http:NotFound|http:Forbidden result = check approveClaim(caller, claimId, comment);
        if result !is ExpenseClaim {
            return result;
        }
        return <http:Ok>{body: result};
    }

    resource function post expense\-claims/[string claimId]/reject(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            ClaimDecision payload) returns http:Ok|http:BadRequest|http:NotFound|http:Forbidden|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User caller = check resolveCaller(x\-user\-id, x\-user\-name);
        ExpenseClaim|http:BadRequest|http:NotFound|http:Forbidden result = check rejectClaim(caller, claimId, payload.comment);
        if result !is ExpenseClaim {
            return result;
        }
        return <http:Ok>{body: result};
    }

    resource function get users(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            int 'limit = 20, int offset = 0) returns http:Ok|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User _ = check resolveCaller(x\-user\-id, x\-user\-name);
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        UsersPage result = check listUsersPage(pageLimit, pageOffset);
        return <http:Ok>{body: result};
    }

    resource function put users/[string userId]/manager(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            ManagerAssignment payload) returns http:Ok|http:BadRequest|http:NotFound|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User _ = check resolveCaller(x\-user\-id, x\-user\-name);
        User|http:BadRequest|http:NotFound result = check assignManager(userId, payload.managerId);
        if result !is User {
            return result;
        }
        return <http:Ok>{body: result};
    }

    resource function get expense\-categories(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            int 'limit = 20, int offset = 0) returns http:Ok|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User _ = check resolveCaller(x\-user\-id, x\-user\-name);
        int pageLimit = clampLimit('limit);
        int pageOffset = clampOffset(offset);
        CategoriesPage result = check listCategoriesPage(pageLimit, pageOffset);
        return <http:Ok>{body: result};
    }

    resource function post expense\-categories(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            NewExpenseCategory payload) returns http:Created|http:BadRequest|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User _ = check resolveCaller(x\-user\-id, x\-user\-name);
        ExpenseCategory|http:BadRequest result = check createCategory(payload);
        if result is http:BadRequest {
            return result;
        }
        return <http:Created>{body: result};
    }

    resource function patch expense\-categories/[string categoryId](@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            ExpenseCategoryPatch payload) returns http:Ok|http:NotFound|http:BadRequest|http:Unauthorized|error {
        if x\-user\-id is () {
            return toUnauthorized("X-User-Id header is required");
        }
        User _ = check resolveCaller(x\-user\-id, x\-user\-name);
        ExpenseCategory|http:NotFound|http:BadRequest result = check updateCategory(categoryId, payload);
        if result !is ExpenseCategory {
            return result;
        }
        return <http:Ok>{body: result};
    }
}
