# Data Retention

## Minimum retention guidance

- Users and business records: retain while account is active
- Sessions: retain revoked/expired sessions for audit investigation, then purge on a scheduled policy
- Audit logs: retain for at least 12 months
- Orders, sales, refunds, and purchase orders: retain for at least 12 months, longer if legal or contractual requirements apply
- Password reset tokens and staff invite tokens: short-lived; purge expired and used records periodically
- Notifications: retain recent delivery history for support and troubleshooting

## Purge policy

Recommended future scheduled cleanup:

- expired password reset tokens
- expired/revoked invite tokens
- very old revoked sessions
- failed/old notifications outside the troubleshooting window

Retention periods should be confirmed with legal, finance, and business requirements before production launch.
