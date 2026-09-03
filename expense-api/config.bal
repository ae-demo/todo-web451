import ballerina/os;

// All settings default to a value that lets the service start with no
// required environment variables; the platform overrides these via
// EXPENSE_DB_* at deploy time (see expense-db wiring in design.json).

function readEnv(string envKey, string defaultValue) returns string {
    string value = os:getEnv(envKey);
    if value.length() == 0 {
        return defaultValue;
    }
    return value;
}

function readEnvInt(string envKey, int defaultValue) returns int {
    string value = os:getEnv(envKey);
    if value.length() == 0 {
        return defaultValue;
    }
    int|error parsed = int:fromString(value);
    if parsed is int {
        return parsed;
    }
    return defaultValue;
}

configurable string dbHost = readEnv("EXPENSE_DB_HOST", "localhost");
configurable int dbPort = readEnvInt("EXPENSE_DB_PORT", 5432);
configurable string dbName = readEnv("EXPENSE_DB_DBNAME", "expense_db");
configurable string dbUser = readEnv("EXPENSE_DB_USER", "postgres");
configurable string dbPassword = readEnv("EXPENSE_DB_PASSWORD", "postgres");

// Pagination default, kept in one place rather than repeated per handler.
configurable int defaultPageLimit = readEnvInt("EXPENSE_API_DEFAULT_PAGE_LIMIT", 20);
configurable int maxPageLimit = readEnvInt("EXPENSE_API_MAX_PAGE_LIMIT", 100);
