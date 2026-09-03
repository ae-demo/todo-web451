import ballerina/http;
import ballerina/sql;
import ballerina/uuid;

function toCategory(CategoryRow row) returns ExpenseCategory {
    return {id: row.id, name: row.name, active: row.active};
}

function getCategoryById(string categoryId) returns ExpenseCategory?|error {
    CategoryRow|error row = dbClient->queryRow(`
        SELECT id, name, active FROM expense_categories WHERE id = ${categoryId}
    `, CategoryRow);
    if row is CategoryRow {
        return toCategory(row);
    }
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

function listCategoriesPage(int pageLimit, int offset) returns CategoriesPage|error {
    CountRow countRow = check dbClient->queryRow(`SELECT COUNT(*) AS total FROM expense_categories`, CountRow);
    stream<CategoryRow, sql:Error?> rows = dbClient->query(`
        SELECT id, name, active FROM expense_categories ORDER BY name, id LIMIT ${pageLimit} OFFSET ${offset}
    `, CategoryRow);
    ExpenseCategory[] categories = [];
    check from CategoryRow row in rows
        do {
            categories.push(toCategory(row));
        };
    [string?, string?] pageLinks = buildPaginationLinks("/expense-categories", {}, pageLimit, offset, countRow.total);
    return {count: countRow.total, next: pageLinks[0], previous: pageLinks[1], data: categories};
}

function createCategory(NewExpenseCategory payload) returns ExpenseCategory|http:BadRequest|error {
    string name = payload.name.trim();
    if name.length() == 0 {
        return toBadRequest("name is required");
    }
    string categoryId = uuid:createRandomUuid();
    _ = check dbClient->execute(`
        INSERT INTO expense_categories (id, name, active) VALUES (${categoryId}, ${name}, TRUE)
    `);
    return {id: categoryId, name: name, active: true};
}

function updateCategory(string categoryId, ExpenseCategoryPatch patch) returns ExpenseCategory|http:NotFound|http:BadRequest|error {
    CategoryRow|error row = dbClient->queryRow(`
        SELECT id, name, active FROM expense_categories WHERE id = ${categoryId}
    `, CategoryRow);
    if row is sql:NoRowsError {
        return toNotFound("category not found");
    }
    if row is error {
        return row;
    }
    string newName = row.name;
    string? patchName = patch?.name;
    if patchName is string {
        string trimmed = patchName.trim();
        if trimmed.length() == 0 {
            return toBadRequest("name cannot be blank");
        }
        newName = trimmed;
    }
    boolean newActive = row.active;
    boolean? patchActive = patch?.active;
    if patchActive is boolean {
        newActive = patchActive;
    }
    _ = check dbClient->execute(`
        UPDATE expense_categories SET name = ${newName}, active = ${newActive} WHERE id = ${categoryId}
    `);
    return {id: categoryId, name: newName, active: newActive};
}
