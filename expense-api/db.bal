import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client dbClient = check new (
    host = dbHost,
    username = dbUser,
    password = dbPassword,
    database = dbName,
    port = dbPort
);

function initDb() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS expense_users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            manager_id TEXT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS expense_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT TRUE
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS expense_claims (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            claim_date TEXT NOT NULL,
            description TEXT NOT NULL,
            receipt_url TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'submitted',
            manager_comment TEXT NULL,
            exported_at TEXT NULL
        )
    `);
    return;
}

final () dbReady = check initDb();
