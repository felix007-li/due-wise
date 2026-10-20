"""Synthetic report fixtures verify the release gate cannot accept skipped tests."""
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

from check_test_reports import REQUIRED, verify


class ReportGateTest(unittest.TestCase):
    def setUp(self):
        local = Path(__file__).resolve().parents[2] / '.local'
        local.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=local)
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)
        for name in REQUIRED:
            self.write(name)

    def write(self, name, status=None, count=1):
        attributes = dict(name=name, tests=str(count), failures='0', errors='0', skipped='0')
        if status:
            attributes[{'failure': 'failures', 'error': 'errors', 'skipped': 'skipped'}[status]] = '1'
        suite = ET.Element('testsuite', attributes)
        for index in range(count):
            case = ET.SubElement(suite, 'testcase', name=f'test{index}')
            if status and index == 0:
                ET.SubElement(case, status)
        ET.ElementTree(suite).write(self.root / f'TEST-{name}.xml')

    def test_executed_postgres_suites_pass(self):
        self.assertTrue(verify(self.root)['passed'])

    def test_skipped_failed_and_error_tests_fail(self):
        for status in ['skipped', 'failure', 'error']:
            with self.subTest(status=status):
                self.write('ca.duewise.PostgresApplicationTest', status)
                self.assertFalse(verify(self.root)['passed'])

    def test_missing_postgres_suite_fails(self):
        (self.root / 'TEST-ca.duewise.PostgresApplicationTest.xml').unlink()
        self.assertFalse(verify(self.root)['passed'])

    def test_empty_suite_fails(self):
        self.write('ca.duewise.PostgresApplicationTest', count=0)
        self.assertFalse(verify(self.root)['passed'])

    def test_no_reports_fails(self):
        self.assertFalse(verify(self.root / 'absent')['passed'])

    def test_malformed_report_fails(self):
        (self.root / 'TEST-broken.xml').write_text('<broken')
        self.assertFalse(verify(self.root)['passed'])

    def test_misleading_summary_fails(self):
        p = self.root / 'TEST-ca.duewise.PostgresApplicationTest.xml'
        p.write_text(p.read_text().replace('skipped="0"', 'skipped="1"'))
        self.assertFalse(verify(self.root)['passed'])

    def test_duplicate_report_fails(self):
        source = next(self.root.glob('TEST-*.xml'))
        (self.root / 'TEST-duplicate.xml').write_text(source.read_text())
        self.assertFalse(verify(self.root)['passed'])


if __name__ == '__main__':
    unittest.main()
