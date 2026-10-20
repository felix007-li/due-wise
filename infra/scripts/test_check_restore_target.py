"""Restore rehearsal accepts only local QA targets before opening any connection."""
import os
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('test_restore_runtime.py')


class RestoreTargetTest(unittest.TestCase):
    def assert_rejected(self, root, container='duewise-qa-postgres'):
        with patch.dict(os.environ, {'DUEWISE_TEST_API_URL': root,
                                    'DUEWISE_QA_POSTGRES_CONTAINER': container}):
            with patch('urllib.request.build_opener') as opener:
                with self.assertRaises(SystemExit):
                    runpy.run_path(str(SCRIPT), run_name='__main__')
                opener.assert_not_called()

    def test_remote_and_credentialed_origins_are_rejected(self):
        for root in ['https://example.test/api/v1',
                     'http://127.0.0.1:18984@external.example/api/v1',
                     'http://user:password@localhost:18984/api/v1',
                     'http://localhost:18984/api/v1?token=hidden',
                     'http://localhost:18984/wrong']:
            with self.subTest(root=root):
                self.assert_rejected(root)

    def test_non_qa_container_is_rejected(self):
        for container in ['customer-database', 'duewise-production-postgres']:
            self.assert_rejected('http://127.0.0.1:18984/api/v1', container)

    def test_named_qa_targets_pass_preflight(self):
        for container in ['duewise-qa-postgres', 'duewise-boot4-postgres']:
            with patch.dict(os.environ, {'DUEWISE_TEST_API_URL': 'http://127.0.0.1:18984/api/v1',
                                        'DUEWISE_QA_POSTGRES_CONTAINER': container}):
                with patch('urllib.request.build_opener', side_effect=RuntimeError('preflight passed')):
                    with self.assertRaisesRegex(RuntimeError, 'preflight passed'):
                        runpy.run_path(str(SCRIPT), run_name='__main__')


if __name__ == '__main__':
    unittest.main()
