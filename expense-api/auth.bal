import ballerina/sql;

// specs/design/security.json: coldStartRole. A first-time caller gets a
// people record created at this role - this service owns its own people
// records because no directory is published for this project.
const string COLD_START_ROLE = "Employee";

function toUser(UserRow row) returns User {
    return {id: row.id, name: row.name, email: row.email, role: row.role, managerId: row.manager_id};
}

function getUserById(string userId) returns User?|error {
    UserRow|error row = dbClient->queryRow(`
        SELECT id, name, email, role, manager_id FROM expense_users WHERE id = ${userId}
    `, UserRow);
    if row is UserRow {
        return toUser(row);
    }
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

// Resolves the caller's own people record, creating one at the cold-start
// role on first sign-in. Keyed on X-User-Id (the opaque IdP subject); display
// fields are filled from X-User-Name when the gateway provided it.
function resolveCaller(string userId, string? userName) returns User|error {
    User? existing = check getUserById(userId);
    if existing is User {
        return existing;
    }
    string displayName = userName is string && userName.trim().length() > 0 ? userName : userId;
    _ = check dbClient->execute(`
        INSERT INTO expense_users (id, name, email, role, manager_id)
        VALUES (${userId}, ${displayName}, ${displayName}, ${COLD_START_ROLE}, NULL)
    `);
    return {id: userId, name: displayName, email: displayName, role: COLD_START_ROLE, managerId: ()};
}

// True when employeeId's stored manager_id is managerId - the sole authority
// this service uses for "is this caller the claim owner's manager".
function isDirectReport(string managerId, string employeeId) returns boolean|error {
    User? employee = check getUserById(employeeId);
    if employee is () {
        return false;
    }
    string? employeeManagerId = employee.managerId;
    return employeeManagerId is string && employeeManagerId == managerId;
}
