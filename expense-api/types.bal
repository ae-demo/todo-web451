// Wire-shape records, matching specs/design/components/expense-api/openapi.yaml exactly.

public type ErrorPayload record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

public type User record {|
    string id;
    string name;
    string email;
    string role;
    string? managerId;
|};

public type ManagerAssignment record {|
    string managerId;
|};

public type UsersPage record {|
    int count;
    string? next;
    string? previous;
    User[] data;
|};

public type ExpenseCategory record {|
    string id;
    string name;
    boolean active;
|};

public type NewExpenseCategory record {|
    string name;
|};

public type ExpenseCategoryPatch record {|
    string name?;
    boolean active?;
|};

public type CategoriesPage record {|
    int count;
    string? next;
    string? previous;
    ExpenseCategory[] data;
|};

public type ExpenseClaim record {|
    string id;
    string employeeId;
    string categoryId;
    decimal amount;
    string claimDate;
    string description;
    string receiptUrl;
    string status;
    string? managerComment;
    string? exportedAt;
|};

public type NewExpenseClaim record {|
    string categoryId;
    decimal amount;
    string claimDate;
    string description;
    string receiptUrl;
|};

public type ClaimDecision record {|
    string comment;
|};

public type ClaimsPage record {|
    int count;
    string? next;
    string? previous;
    ExpenseClaim[] data;
|};

// Internal row shapes used only for SQL result binding.

type UserRow record {|
    string id;
    string name;
    string email;
    string role;
    string? manager_id;
|};

type CategoryRow record {|
    string id;
    string name;
    boolean active;
|};

type ClaimRow record {|
    string id;
    string employee_id;
    string category_id;
    decimal amount;
    string claim_date;
    string description;
    string receipt_url;
    string status;
    string? manager_comment;
    string? exported_at;
|};

type CountRow record {|
    int total;
|};
