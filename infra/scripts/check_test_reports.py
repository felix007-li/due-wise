"""Release gate: backend JUnit reports must include executed PostgreSQL suites."""
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

REQUIRED = {'ca.duewise.PostgresApplicationTest', 'ca.duewise.PostgresMigrationTest'}


def verify(directory):
    counts = dict(tests=0, failures=0, errors=0, skipped=0)
    seen = set()
    reasons = []
    files = sorted(Path(directory).glob('TEST-*.xml'))
    if not files:
        reasons.append('missing_reports')
    for path in files:
        try:
            suite = ET.parse(path).getroot()
            if suite.tag != 'testsuite':
                raise ValueError()
            name = suite.attrib['name']
            cases = suite.findall('testcase')
            actual = {'tests': len(cases), **{
                key: sum(case.find(tag) is not None for case in cases)
                for key, tag in [('failures', 'failure'), ('errors', 'error'), ('skipped', 'skipped')]}}
            declared = {key: int(suite.attrib[key]) for key in counts}
            if actual != declared or any(n < 0 for n in declared.values()):
                raise ValueError()
            if name in seen:
                reasons.append('duplicate_suite')
            seen.add(name)
            if not cases:
                reasons.append('empty_suite')
            for key in counts:
                counts[key] += actual[key]
        except (ET.ParseError, KeyError, ValueError, OSError):
            reasons.append('invalid_report')
    if not REQUIRED.issubset(seen):
        reasons.append('missing_postgres_suite')
    if counts['tests'] == 0:
        reasons.append('no_executed_tests')
    if any(counts[key] for key in ('failures', 'errors', 'skipped')):
        reasons.append('unsuccessful_or_skipped_tests')
    return {'passed': not reasons, 'counts': counts, 'reasons': sorted(set(reasons))}


def main():
    result = verify(sys.argv[1] if len(sys.argv) > 1 else 'backend/build/test-results/test')
    print(json.dumps(result))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
