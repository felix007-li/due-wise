"""Read-only API operational probe. Exit nonzero on any failed check.

Point DUEWISE_MONITOR_API_URL at the private API origin (not the public frontend).
Output contains check names/results only, never response bodies or credentials.
"""
import json
import os
import sys
import uuid
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe(base, timeout=5):
    url = urlsplit(base)
    if (url.scheme not in ('http', 'https') or not url.hostname or url.username
            or url.password or url.query or url.fragment or url.path not in ('', '/')):
        raise ValueError('Expected an HTTP(S) API origin without credentials, path or query.')
    opener = build_opener(NoRedirect())
    results = []
    for name, path, expected in [('liveness', '/health', 200),
                                 ('readiness', '/actuator/health', 200),
                                 ('anonymous_correlation', '/api/v1/bills', 401)]:
        passed = False
        try:
            try:
                response = opener.open(base.rstrip('/') + path, timeout=timeout)
            except HTTPError as error:
                response = error
            with response:
                body = json.loads(response.read(65537))
                passed = response.code == expected
                if expected == 200:
                    passed = passed and body.get('status') == 'UP'
                else:
                    request_id = response.headers.get('X-Request-ID')
                    uuid.UUID(request_id or '')
                    passed = (passed and body.get('code') == 'UNAUTHORIZED'
                              and body.get('requestId') == request_id)
        except (URLError, OSError, ValueError, TypeError, AttributeError):
            passed = False
        results.append({'check': name, 'passed': bool(passed)})
    return results


def main():
    try:
        results = probe(os.environ.get('DUEWISE_MONITOR_API_URL', 'http://127.0.0.1:8080'))
    except ValueError:
        print(json.dumps({'passed': False, 'error': 'invalid_api_origin'}))
        return 1
    passed = all(result['passed'] for result in results)
    print(json.dumps({'passed': passed, 'checks': results}))
    return 0 if passed else 1


if __name__ == '__main__':
    sys.exit(main())
