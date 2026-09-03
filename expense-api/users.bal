import ballerina/http;
import ballerina/sql;

function listUsersPage(int pageLimit, int offset) returns UsersPage|error {
    CountRow countRow = check dbClient->queryRow(`SELECT COUNT(*) AS total FROM expense_users`, CountRow);
    stream<UserRow, sql:Error?> rows = dbClient->query(`
        SELECT id, name, email, role, manager_id FROM expense_users ORDER BY name, id LIMIT ${pageLimit} OFFSET ${offset}
    `, UserRow);
    User[] users = [];
    check from UserRow row in rows
        do {
            users.push(toUser(row));
        };
    [string?, string?] pageLinks = buildPaginationLinks("/users", {}, pageLimit, offset, countRow.total);
    return {count: countRow.total, next: pageLinks[0], previous: pageLinks[1], data: users};
}

function assignManager(string userId, string managerId) returns User|http:BadRequest|http:NotFound|error {
    User? target = check getUserById(userId);
    if target is () {
        return toNotFound("user not found");
    }
    if managerId == userId {
        return toBadRequest("a user cannot be their own manager");
    }
    User? manager = check getUserById(managerId);
    if manager is () {
        return toBadRequest("managerId does not reference an existing user");
    }
    boolean cycle = check createsCycle(userId, managerId);
    if cycle {
        return toBadRequest("assignment would create a management cycle");
    }
    _ = check dbClient->execute(`UPDATE expense_users SET manager_id = ${managerId} WHERE id = ${userId}`);
    return {id: target.id, name: target.name, email: target.email, role: target.role, managerId: managerId};
}

// Walks the candidate manager's own chain of managers; a cycle exists if it
// ever reaches back to the user being assigned.
function createsCycle(string userId, string candidateManagerId) returns boolean|error {
    string? current = candidateManagerId;
    int guard = 0;
    while current is string && guard < 100 {
        if current == userId {
            return true;
        }
        User? currentUser = check getUserById(current);
        if currentUser is () {
            return false;
        }
        current = currentUser.managerId;
        guard += 1;
    }
    return false;
}
