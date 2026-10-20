"""Tests safety guards and encryption piping with disposable command stubs, no credentials."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class BackupTest(unittest.TestCase):
    def setUp(self):
        (ROOT / '.local').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / '.local')
        self.cwd = Path(self.temp.name)
        self.bin = self.cwd / 'bin'
        self.bin.mkdir()
        self.env = {**os.environ, 'PATH': str(self.bin) + ':' + os.environ['PATH'],
                    'PGHOST': 'unused', 'PGUSER': 'test', 'PGDATABASE': 'duewise_restore_test',
                    'BACKUP_RECIPIENT': 'public-test-recipient', 'AGE_IDENTITY': 'unused-test-identity',
                    'CONFIRM_RESTORE': 'duewise_restore_test'}
        self.stub('pg_dump', "printf 'synthetic database dump'")
        self.stub('age', 'if [ "$1" = "-d" ]; then cat "$4"; else cat > "$4"; fi')
        self.stub('pg_restore', 'test -s "${@: -1}"')

    def stub(self, name, code):
        p = self.bin / name
        p.write_text('#!/bin/bash\nset -e\n' + code + '\n')
        p.chmod(0o700)

    def run_script(self, name, *args, env=None):
        return subprocess.run(['bash', str(ROOT / 'infra/scripts' / name), *args],
                              cwd=self.cwd, env=env or self.env, capture_output=True, text=True)

    def tearDown(self):
        self.temp.cleanup()

    def test_backup_encrypts_pipeline_and_restricts_permissions(self):
        result = self.run_script('backup.sh')
        self.assertEqual(0, result.returncode, result.stderr)
        files = list((self.cwd / '.local/backups').glob('*.dump.age'))
        self.assertEqual(1, len(files))
        self.assertEqual('synthetic database dump', files[0].read_text())
        self.assertEqual(0o600, files[0].stat().st_mode & 0o777)

    def test_restore_refuses_production_database(self):
        env = {**self.env, 'PGDATABASE': 'duewise', 'CONFIRM_RESTORE': 'duewise'}
        result = self.run_script('restore.sh', env=env)
        self.assertNotEqual(0, result.returncode)
        self.assertIn('restricted', result.stderr)

    def test_failed_dump_leaves_no_backup(self):
        self.stub('pg_dump', "printf 'incomplete dump'; exit 1")
        result = self.run_script('backup.sh')
        self.assertNotEqual(0, result.returncode)
        self.assertEqual([], list((self.cwd / '.local/backups').iterdir()))

    def test_failed_encryption_leaves_no_backup(self):
        self.stub('age', 'cat > "$4"; exit 1')
        result = self.run_script('backup.sh')
        self.assertNotEqual(0, result.returncode)
        self.assertEqual([], list((self.cwd / '.local/backups').iterdir()))

    def test_repeated_backups_preserve_both_archives(self):
        self.stub('date', "printf '20261020T000000Z'")
        for _ in range(2):
            result = self.run_script('backup.sh')
            self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(2, len(list((self.cwd / '.local/backups').glob('*.dump.age'))))

    def test_failed_restore_cleans_plaintext(self):
        archive = self.cwd / 'example.dump.age'
        archive.write_text('synthetic fixture')
        self.stub('pg_restore', 'exit 1')
        result = self.run_script('restore.sh', str(archive))
        self.assertNotEqual(0, result.returncode)
        self.assertEqual([], list((self.cwd / '.local/restore').iterdir()))

    def test_restore_cleans_disposable_plaintext(self):
        archive = self.cwd / 'example.dump.age'
        archive.write_text('synthetic encrypted-pipeline fixture')
        result = self.run_script('restore.sh', str(archive))
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual([], list((self.cwd / '.local/restore').iterdir()))


if __name__ == '__main__':
    unittest.main()
