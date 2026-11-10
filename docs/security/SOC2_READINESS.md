# TrackFit security and SOC 2 readiness register
Owner: HAKT Industries Ltd | Created: 2026-11-10 | Status: working draft, not independently audited

## Scope and claim
TrackFit's web/mobile application, Supabase database/auth/storage, Vercel hosting, AI Coach service, transactional email, GitHub source and administrator operations are in scope. **Do not claim SOC 2 certification, SOC 2 compliance or an attestation report.** An independent CPA firm must perform an audit. Type II also requires evidence that controls operated throughout an observation period.

## Control inventory and evidence requirements

| Control | Current observation | Evidence to collect | Owner | Status |
| --- | --- | --- | --- | --- |
| Logical access | Supabase auth, RLS on core fitness tables; admin uses app_metadata | Quarterly access export, MFA evidence, RLS negative tests | HAKT | Partial |
| Privacy / consent | Separate opt-in for developer AI response logging; data-request queue | Versioned consent, timestamp, opt-out and deletion test | HAKT | Partial |
| Change management | GitHub/Vercel commits and deployments | PR approvals, CI checks, rollback test, change log | HAKT | Partial |
| Secure development | Baseline security headers; database security advisor | Dependency scan, secret scan, code review, DAST, pentest | HAKT | Partial |
| Vendor management | Supabase, Vercel, AI and email providers | Subprocessor inventory, hosting regions, DPAs, SOC reports, annual review | HAKT | Open |
| Encryption | HTTPS application | Verify storage/backup encryption, keys and transport, evidence | HAKT | Open |
| Backup / recovery | Cloud services | Backup configuration, restoration test, RPO/RTO, incident drill | HAKT | Open |
| Availability | Vercel deployment status | Uptime monitoring, alert ownership, incident log, restore rehearsal | HAKT | Open |
| Incident response | No approved incident plan evidenced | Incident severity matrix, contact chain, breach notification decision tree, tabletop | HAKT | Open |
| Retention / deletion | Authenticated request intake exists; deletion backend not complete | Data map, approved retention, deletion proof incl. storage, backups and vendors | HAKT | Open |
| User rights | Privacy requests and AI opt-out UI | Fulfilment SLA, access export, complaint handling evidence | HAKT | Partial |
| Workforce / owner | Solo operator | Annual security training, annual policy acknowledgment, joiner/leaver checklist | HAKT | Open |

## Security risks to resolve before public launch
1. **P0**: Implement verified account deletion, storage deletion and AI log deletion, without giving clients service-role access. Include session invalidation and export/retention exceptions.
2. **P0**: Validate RLS across two test accounts, including all storage buckets and admin dashboard; never use production tester data for destructive tests.
3. **P0**: Enforce MFA for administrator identities and recovery procedures.
4. **P1**: Review public SECURITY DEFINER function `consume_trackfit_ai_allowance()`: intentional signed-in access, but verify misuse/abuse and role grants. Supabase advisor lint 0029.
5. **P1**: Establish formal data retention and backup deletion limits, subprocessors, regional transfers and privacy contact.
6. **P1**: Add CI dependency/security checks and enforce branch protection; retain PR and build evidence.
7. **P1**: Set up alerting, incident response, backup restore and recovery testing.
8. **P1**: Confirm Health Connect and Apple Health permission/data handling against store policies before distribution.
9. **P2**: External penetration test and SOC 2 readiness assessment before contracting an auditor.

## Lightweight operational policies (proposed, not yet adopted)
- **Access**: unique named identities, MFA for administrators, least privilege, access review quarterly, immediate access revocation upon departure, never share keys.
- **Changes**: changes documented in GitHub, test in preview before production, record deployment and rollback, review high-risk auth/AI/privacy changes.
- **Incidents**: record discovery time, affected systems, severity, containment, evidence, communication, root cause and remediation. Notify regulators/users when required by applicable law.
- **Backups**: verify provider backups and test restore quarterly. Document restore objectives before promising uptime or recovery.
- **Vendors**: maintain subprocessor inventory and annually review security attestations, DPA, regions and breach terms.
- **Retention**: minimise data, define a schedule by data class, securely delete when no longer needed, record completion and legal exceptions.
- **Privacy**: voluntary opt-in for developer AI monitoring; record consent version, preserve opt-out, respond to access/correction/deletion requests.
- **Evidence**: save dated access reviews, advisor outputs, scans, incidents (including nil incidents), vendor reviews, restore tests and change approvals in restricted storage, not public repository.

## Latest audit evidence (2026-11-10)
- Supabase security advisor reported one warning: authenticated users can execute `public.consume_trackfit_ai_allowance()`, SECURITY DEFINER; function checks auth.uid and limits requests to 20/day.
- Core tables inspected had user-ownership RLS and admin-read policies. This is not a complete cross-user penetration test.
- Baseline HTTP security headers committed to Vercel config; verify deployed response headers.
- Account deletion and data requests can be submitted but are **not** automatically fulfilled.
- No external audit or SOC 2 report has been performed.

## Tomorrow's owner checklist
- Confirm developer programme payments and legal entity details.
- Set a real privacy/security contact email and verify inbound delivery.
- Confirm HAKT legal registration address and vendor data regions.
- Enable administrator MFA, review Supabase auth settings.
- Approve retention schedule and review these policies; arrange NZ/international privacy legal review.
