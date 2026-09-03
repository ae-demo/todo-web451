screen MyClaims "Employee's own submitted claims and their status"
  navbar "Expense Claims | My Claims -> MyClaims | Submit Claim -> SubmitClaim"
  heading "My Claims"
  row
    text "Track every claim you've submitted"
    right
    button "Submit Claim" primary -> SubmitClaim
  table "Date | Category | Amount | Status"
    row "2026-08-02 | Travel | 420.00 | Approved"
    row "2026-08-10 | Meals | 35.50 | Rejected"
    row "2026-08-15 | Supplies | 89.00 | Submitted"

screen SubmitClaim "Employee submits a new expense claim"
  navbar "Expense Claims | My Claims -> MyClaims | Submit Claim -> SubmitClaim"
  heading "Submit Expense Claim"
  select "Category"
  input "Amount"
  input "Date"
  textarea "Description"
  input "Attach receipt"
  row
    right
    button "Cancel" -> MyClaims
    button "Submit" primary -> MyClaims

screen ClaimDetail "A single claim, its status, and the manager's comment"
  navbar "Expense Claims | My Claims -> MyClaims | Submit Claim -> SubmitClaim"
  heading "Claim Detail"
  badge "Rejected" danger
  text "Category: Meals"
  text "Amount: 35.50"
  text "Date: 2026-08-10"
  text "Description: Team lunch with client"
  card "Manager Comment"
    text "Missing itemized receipt — please reattach and resubmit."
  row
    right
    button "Edit & Resubmit" primary -> SubmitClaim

screen Approvals "Manager reviews pending claims from direct reports"
  navbar "Expense Claims | Approvals -> Approvals"
  heading "Pending Approvals"
  table "Employee | Date | Category | Amount | Actions" -> ApprovalDetail
    row "J. Rivera | 2026-08-15 | Supplies | 89.00 | Review"
    row "A. Chen | 2026-08-18 | Travel | 210.00 | Review"

screen ApprovalDetail "Manager approves or rejects one claim with a comment"
  navbar "Expense Claims | Approvals -> Approvals"
  heading "Review Claim"
  text "Employee: J. Rivera"
  text "Category: Supplies"
  text "Amount: 89.00"
  text "Description: Office supplies for team"
  textarea "Comment"
  row
    right
    button "Reject" danger -> Approvals
    button "Approve" primary -> Approvals

screen ApprovedClaims "Finance sees all approved claims org-wide"
  navbar "Expense Claims | Approved Claims -> ApprovedClaims | Export -> Export"
  heading "Approved Claims"
  table "Employee | Date | Category | Amount | Exported"
    row "J. Rivera | 2026-08-15 | Supplies | 89.00 | No"
    row "A. Chen | 2026-08-18 | Travel | 210.00 | No"
  row
    right
    button "Export" primary -> Export

screen Export "Finance exports approved, un-exported claims for a period"
  navbar "Expense Claims | Approved Claims -> ApprovedClaims | Export -> Export"
  heading "Export to Payroll"
  input "From date"
  input "To date"
  text "12 approved claims match this period"
  row
    right
    button "Download CSV" primary

screen ManagerAssignments "Admin assigns or changes each employee's manager"
  navbar "Expense Claims | Managers -> ManagerAssignments | Categories -> Categories"
  heading "Manager Assignments"
  table "Employee | Current Manager | Actions" -> ManagerAssignments
    row "J. Rivera | (none) | Assign"
    row "A. Chen | S. Patel | Change"

screen Categories "Admin maintains the expense category list"
  navbar "Expense Claims | Managers -> ManagerAssignments | Categories -> Categories"
  heading "Expense Categories"
  row
    text "Categories employees can choose when submitting a claim"
    right
    button "Add Category" primary -> Categories
  table "Name | Active"
    row "Travel | Yes"
    row "Meals | Yes"
    row "Supplies | Yes"
    row "Entertainment | No"

flow "Submit and track claims"
  role "Employee"
  description "An employee submits a claim, tracks it, and fixes a rejected one"
  MyClaims
  SubmitClaim
  ClaimDetail

flow "Approval queue"
  role "Manager"
  description "A manager reviews and decides on pending claims from direct reports"
  Approvals
  ApprovalDetail

flow "Payroll export"
  role "Finance"
  description "Finance reviews approved claims and exports a period for payroll"
  ApprovedClaims
  Export

flow "Org setup"
  role "Admin"
  description "An admin assigns managers and maintains expense categories"
  ManagerAssignments
  Categories
