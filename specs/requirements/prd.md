# Expense Claims — PRD

## Problem Statement

Employees who pay for business expenses out of pocket today rely on manual,
paper- or email-based processes to get reimbursed: claims get lost, managers
have no consistent way to review and approve them, and finance has no clean,
auditable list of what has actually been approved when it is time to run
payroll. The result is slow reimbursement, duplicate or missed payments, and
no record of who approved what.

## Solution

A web application where employees submit expense claims online, their manager
reviews and approves or rejects each one, and finance can see every approved
claim and export them as a file ready to hand off into the payroll process —
replacing the ad-hoc paper trail with one auditable system.

## Actors

- **Employee** — submits expense claims, attaches supporting detail, tracks
their status, and can edit and resubmit a claim their manager rejected.
- **Manager** — reviews the claims submitted by the employees who report to
them, and approves or rejects each one with a comment.
- **Finance** — sees all approved claims across the organization and exports
them, for a given period, as a file to bring into payroll.

## User Stories

1. As an Employee, I want to submit an expense claim with an amount,
 category, date, and description, so that I can request reimbursement.
2. As an Employee, I want to attach a receipt to my claim, so that my claim
 has supporting documentation.
3. As an Employee, I want to see the status of every claim I've submitted
 (pending, approved, rejected), so that I know where each one stands.
4. As an Employee, I want to see my manager's comment when a claim is
 rejected, so that I understand what to fix.
5. As an Employee, I want to edit a rejected claim and resubmit it, so that
 I can correct it without starting over.
6. As a Manager, I want to see the pending claims submitted by the employees
 who report to me, so that I know what needs my review.
7. As a Manager, I want to approve or reject a claim and leave a comment,
 so that the employee gets a clear, recorded decision.
8. As a Finance user, I want to see all approved claims across the
 organization, so that I know what is owed and to whom.
9. As a Finance user, I want to export approved claims for a given period to
 a downloadable file, so that I can bring them into payroll.
10. As a Finance user, I want exported claims to be marked as exported, so
 that the same claim is never included in two payroll exports.

## Product Decisions

- Employees and managers sign in through Thunder, the platform's single
sign-on identity provider.
- Each employee has exactly one designated manager, who is the sole approver
of that employee's claims.
- A rejected claim can be edited by the employee and resubmitted for another
review — it is not treated as final.
- "Export to payroll" produces a downloadable file (e.g. CSV) of approved
claims for a chosen period; finance takes that file into whatever payroll
system the organization uses. This project does not integrate directly
with any specific payroll product.
- Every claim carries an amount, category, date, and description; a receipt
attachment is required before a claim can be submitted. *assumed*
- Employees, managers, and finance users are notified by email when a
claim's status changes (submitted, approved, rejected). *assumed*
- All claims are in a single organization-wide currency; multi-currency
claims are not supported. *assumed*

## Out of Scope

- Direct integration with any named payroll system's API.
- Multi-level or delegated approval chains (e.g. a manager's own manager
reviewing large claims).
- Multi-currency expense claims.
- Mileage or per-diem rate calculators — claims carry a plain amount the
employee enters.

## Open Questions

1. Who sets up the employee → manager relationship — is there an admin
 function to assign managers, or is that imported from elsewhere (e.g. an
 HR system)?
2. Are there fixed expense categories (e.g. Travel, Meals, Supplies), and if
 so, who defines that list?
3. Is there a maximum claim amount or a policy limit that requires
 escalation rather than plain manager approval?

