# Logical Data Model

The following LDM(s) represents the current state of the database.

```mermaid
%%{init: {'theme':'dark'}}%%
erDiagram

USER ||--o{ NOTIFICATION : "User's notifications"
USER ||--o{ VERIFICATION_CODE : "User's verification code(s)"

USER {
    UUID id PK
    VARCHAR(255) email
    VARCHAR(255) password
    VARCHAR(255) first_name
    VARCHAR(255) last_name
    DATETIME email_verified
    DATETIME created_at
    DATETIME updated_at
}

NOTIFICATION {
    SERIAL id PK
    UUID user_id FK
    ENUM type "EMAIL, SMS, PUSH"
    VARCHAR(255) recipient
    VARCHAR(255) subject
    TEXT message
    ENUM status "PENDING, SENT, FAILED"
    DATETIME sent_at
    DATETIME created_at
    DATETIME updated_at
}

VERIFICATION_CODE {
  SERIAL id PK
  UUID user_id FK
  VARCHAR(255) code
  ENUM type "email_verification, password_reset"
  DATETIME expires_at
  DATETIME created_at
  DATETIME updated_at
}

```
