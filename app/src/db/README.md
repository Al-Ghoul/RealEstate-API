# Logical Data Model

The following LDM(s) represents the current state of the database.

```mermaid
%%{init: {'theme':'dark'}}%%
erDiagram

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

```
