# Dependency review — 2026-10-20

The user explicitly approved migration from the originally specified Spring Boot 3.5 stack to Boot 4.0.8 to resolve the strict security gate. No commercial dependency subscription was purchased and no deployment was authorized by that approval.

The final packaged archive passes Trivy 0.76.0 `rootfs --scanners vuln --severity HIGH,CRITICAL --exit-code 1`: zero high/critical findings, process exit 0. No ignore files, severity exceptions or `ignore-unfixed` suppression were added. Evidence: backend-security-boot4.json; archive/report SHA-256 hashes, scanner database timestamps and packaged dependency versions: backend-security-boot4-summary.json. This is a Java-archive result, not a final container-image scan or a claim of absence of every vulnerability.

Resolved runtime: Boot 4.0.8, Framework 7.0.9, Tomcat 11.0.27, Jackson 3 BOM 3.1.8, Jackson 2 BOM 2.21.7 (for transitive consumers), PostgreSQL JDBC 42.7.13, springdoc 3.0.3. Jackson 3 now handles application JSON; explicit BigDecimal string serialization preserves financial precision. Flyway, web/security test starters and Testcontainers imports/artifacts were migrated with the platform.

The initial Boot 4 default-BOM scan still reported eight high/critical Tomcat/Jackson findings. That failed report is retained as backend-security-boot4-initial.json. Same-family Tomcat/Jackson patch overrides above clear them; tests were rerun after patching. Original Boot 3 evidence, backend-security.json, is historical and is not the current archive's report.

Original Spring MVC CVE-2026-47884 and CVE-2026-47890 affected Framework 6.2.19. Official fixes are public in 7.0.9, while 6.2.20 requires Enterprise Support. They no longer appear in the patched Boot 4 archive scan. The application uses REST JSON, not XsltView or SSE view fragments; that applicability note was not used to suppress the old strict gate.

Sources checked for the migration:
- [Spring XsltView advisory](https://spring.io/security/cve-2026-47884/)
- [Spring SSE advisory](https://spring.io/security/cve-2026-47890/)
- [Official Boot 4 migration guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Boot 4.0 managed coordinates](https://docs.spring.io/spring-boot/4.0/appendix/dependency-versions/coordinates.html)
- [Tomcat 11 security advisories](https://tomcat.apache.org/security-11.html)
- [Springdoc compatibility matrix](https://springdoc.org/#what-is-the-compatibility-matrix-of-springdoc-openapi-with-spring-boot)

Release blockers remain: final non-root image builds/scans, actual hosted CI execution, and deployed monitoring/alert delivery. Host buildx writes were previously denied; no privilege override or alternate build configuration has been used to bypass that denial.
