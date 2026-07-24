# Firebase Security Specification

## 1. Data Invariants
- **Departments**: Must have a valid string name (<= 100 chars) and code (<= 20 chars).
- **Employees**: Must have a valid full_name and department.
- **Payrolls**: Must specify employee_name and non-negative numbers for salary/pay.
- **Attendances**: Must have employee_id, date, and status.
- **Users**: Must specify full_name, valid email, and role.

## 2. Dirty Dozen Payloads Test Matrix
1. Identity Spoofing in Employee (`authorId` or `userId` modified).
2. Malicious Over-sized string injection in Department Name (>1MB string).
3. Negative or NaN Salary payload in Payroll.
4. Malicious status injection in Attendance (e.g., unauthorized admin flags).
5. Unauthenticated read/write attempt on `/users/{userId}`.
6. Spoofed Email token without verification (`email_verified == false`).
7. Shadow field update in Employee (`isAdmin: true` injected).
8. Path ID poisoning (`{departmentId}` with invalid characters or long payload).
9. Modifying immutable field `createdAt`.
10. Unbounded string injection in Notes field.
11. State transition shortcut bypassing required fields.
12. Unauthenticated list query scraping.

All dirty payloads return `PERMISSION_DENIED`.
