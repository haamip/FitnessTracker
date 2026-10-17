# TrackFit delivery: merge as we go

This is the default working agreement for TrackFit.

1. Make a small feature branch and open a focused pull request.
2. Run lint, build and automated tests; ensure the production dependency security audit has no critical findings.
3. Review production-facing changes (especially data retention, privacy, safety, auth, billing) before merging.
4. **Merge as soon as the change is green and reviewed.** Avoid stacking weeks of unrelated changes in unmerged PRs.
5. Verify the production deployment, smoke-test the affected feature on mobile, and confirm that saved customer data is intact.
6. If a dependency upgrade or feature fails checks, fix it before merging rather than suppressing the checks.
7. For multi-part features, merge safe incremental foundations, label unfinished features, and don't claim they are live until native/plugin integration is operational.

Standard order: fix critical vulnerabilities → merge dependency updates → merge workout improvements → merge daily/weekly coaching → merge wearable foundation → native integrations → nutrition.

Default branch: `ui-app-shell`; production deploys from the reviewed mainline.
