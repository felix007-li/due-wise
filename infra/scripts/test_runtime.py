"""Opt-in local API load/readiness check using disposable synthetic data only."""
import concurrent.futures
import datetime
import http.cookiejar
import json
import math
import os
import time
import urllib.request
import uuid
from pathlib import Path

ROOT = os.environ.get('DUEWISE_TEST_API_URL', 'http://127.0.0.1:18982/api/v1')
if not ROOT.startswith(('http://127.0.0.1:', 'http://localhost:')):
    raise SystemExit('Runtime verification is restricted to local HTTP test APIs.')
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
password = 'synthetic-runtime-test-password'

def request(path, method='GET', data=None):
    headers = {}
    if method != 'GET':
        token = request('/auth/csrf')
        headers[token['headerName']] = token['token']
        headers['Content-Type'] = 'application/json'
    body = None if data is None else json.dumps(data).encode()
    with client.open(urllib.request.Request(ROOT + path, data=body, method=method, headers=headers), timeout=30) as r:
        return json.loads(r.read()) if r.status != 204 else None

request('/auth/register', 'POST', {'email': f'runtime-{uuid.uuid4()}@example.test', 'password': password})
try:
    today = datetime.date.today()
    for index in range(20):
        request('/bills', 'POST', {'name': f'Synthetic load fixture {index}', 'amount': '12.34',
            'currency': 'CAD', 'firstDue': today.isoformat(), 'recurrence': 'monthly',
            'everyNWeeks': 1, 'monthEndPolicy': 'clamp', 'category': 'Housing',
            'subscription': False, 'active': True, 'reminderDays': [0], 'notes': 'Synthetic QA input', 'rowVersion': 0})
    paths = ['/dashboard', '/bills', f'/calendar?from={today.isoformat()}&to={(today + datetime.timedelta(days=30)).isoformat()}', '/insights']
    for path in paths:
        request(path)  # warm-up excluded and explicitly reported
    def sample(index):
        path = paths[index % len(paths)]
        start = time.perf_counter()
        request(path)
        return path.split('?')[0], (time.perf_counter() - start) * 1000
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(sample, range(100)))
    report = {'fixtureBills': 20, 'concurrency': 4, 'samples': 100, 'warmupPerEndpoint': 1, 'endpoints': {}}
    for path in paths:
        key = path.split('?')[0]
        values = sorted(v for p, v in results if p == key)
        report['endpoints'][key] = {'samples': len(values), 'p95Ms': round(values[math.ceil(len(values)*.95)-1], 2), 'maxMs': round(max(values), 2)}
    Path('docs/qa/runtime-performance.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    assert all(v['p95Ms'] < 400 for v in report['endpoints'].values()), 'API p95 exceeds 400 ms'
finally:
    request('/account', 'DELETE', {'password': password, 'confirmation': 'DELETE'})
