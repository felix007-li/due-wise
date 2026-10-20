"""Real encrypted PostgreSQL restore with API-created synthetic source/payment facts."""
import datetime
import http.cookiejar
import json
import os
import re
import subprocess
import urllib.request
from urllib.parse import urlsplit
import uuid
from pathlib import Path

root = os.environ.get('DUEWISE_TEST_API_URL', 'http://127.0.0.1:18982/api/v1').rstrip('/')
container = os.environ.get('DUEWISE_QA_POSTGRES_CONTAINER', 'duewise-qa-postgres')
target = urlsplit(root)
if (target.scheme != 'http' or target.hostname not in ('127.0.0.1', 'localhost')
        or target.username or target.password or target.query or target.fragment
        or target.path != '/api/v1'):
    raise SystemExit('Restore verification requires a local HTTP test API.')
if not re.fullmatch(r'duewise-(?:qa|boot4)(?:-[a-z0-9]+)*-postgres', container):
    raise SystemExit('Restore verification requires a named DueWise QA PostgreSQL container.')
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
password = 'synthetic-restore-test-password'
def call(path, method='GET', data=None):
    headers = {}
    if method != 'GET':
        token = call('/auth/csrf')
        headers = {token['headerName']: token['token'], 'Content-Type': 'application/json'}
    with client.open(urllib.request.Request(root + path, method=method, headers=headers,
            data=None if data is None else json.dumps(data).encode()), timeout=30) as r:
        return json.loads(r.read()) if r.status != 204 else None
call('/auth/register', 'POST', {'email': f'restore-{uuid.uuid4()}@example.test', 'password': password})
try:
    call('/bills', 'POST', {'name': 'Synthetic restore golden fixture', 'amount': '10.0050', 'currency': 'CAD',
        'firstDue': datetime.date.today().isoformat(), 'recurrence': 'monthly', 'everyNWeeks': 1,
        'monthEndPolicy': 'clamp', 'category': 'Housing', 'subscription': False, 'active': True,
        'reminderDays': [0], 'notes': 'Synthetic, not verified financial data', 'rowVersion': 0})
    dashboard = call('/dashboard')
    assert dashboard['roundedCurrencyAmounts']['CAD'] == '10.00'
    call('/occurrences/' + dashboard['upcoming'][0]['id'] + '/pay', 'POST')
    call('/reminders')
    export = call('/account/export')
    assert export['bills'][0]['amount'] == '10.0050' and len(export['payments']) == 1
    result = subprocess.run(['docker', 'exec', '-e', 'PGUSER=duewise_qa', '-e', 'PGDATABASE=duewise_qa',
        '-e', 'PGPASSWORD=synthetic-qa-only', '-e', 'DUEWISE_SYNTHETIC_QA_ONLY=yes',
        container, 'bash', '/tmp/rehearse_restore.sh'], check=True, text=True, capture_output=True)
    Path('docs/qa/restore-rehearsal.txt').write_text('API golden input: CAD 10.0050 → CAD 10.00; one recorded payment. All data synthetic.\n' + result.stdout)
    print(result.stdout)
finally:
    call('/account', 'DELETE', {'password': password, 'confirmation': 'DELETE'})
