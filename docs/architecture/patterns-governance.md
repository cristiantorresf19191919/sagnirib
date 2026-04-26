# Patterns governance

Authoritative source: Addendum 002 §4–§7. This file restates the rules for this repo and hosts Pattern Decision Records (PDRs).

## Pattern decision rules

- Use a pattern only when there is a real problem it solves. Decorative usage = audit fail.
- Patterns enabled by default: Server-first, Provider/Composition, Factory (SEO), Policy/Guard (skeletons), Repository (folders).
- Patterns gated by PDR: Adapter, Builder, Strategy, Observer/Event Bus (real bus), Command/Action, Mapper/DTO, State Machine.

## PDR template

```
# Pattern Decision Record · <feature-or-module>

Problem:
Pattern chosen:
Alternatives considered:
Why this pattern applies:
Why this is not over-engineering:
Layer affected: app | core | shared | features | server | tests
Server / client boundary:
Files created or modified:
Tests required:
Risks:
Owner:
Status: proposed | accepted | implemented | audited | rejected
```

## Active PDRs
_(none yet — added when first feature lands)_
