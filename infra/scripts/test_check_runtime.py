"""Operational probe regression tests; no external services or credentials."""
import io
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from check_runtime import NoRedirect, probe

REQUEST_ID = '12345678-1234-4234-8234-123456789abc'


class Response(io.BytesIO):
    def __init__(self, code, body, request_id=REQUEST_ID):
        super().__init__(json.dumps(body).encode())
        self.code = code
        self.headers = {'X-Request-ID': request_id}


class RuntimeTest(unittest.TestCase):
    def run_probe(self, readiness=None, anonymous=None):
        with patch('check_runtime.build_opener') as opener:
            opener.return_value.open.side_effect = [
                Response(200, {'status': 'UP'}),
                readiness or Response(200, {'status': 'UP'}),
                anonymous or Response(401, {'code': 'UNAUTHORIZED', 'requestId': REQUEST_ID})]
            return probe('http://127.0.0.1:8080')

    def test_healthy_api(self):
        self.assertTrue(all(x['passed'] for x in self.run_probe()))

    def test_database_down_fails_readiness(self):
        results = self.run_probe(readiness=Response(503, {'status': 'DOWN'}))
        self.assertFalse(results[1]['passed'])
        self.assertTrue(results[0]['passed'])

    def test_correlation_mismatch_fails(self):
        results = self.run_probe(anonymous=Response(401, {'code': 'UNAUTHORIZED', 'requestId': 'other'}))
        self.assertFalse(results[2]['passed'])

    def test_public_private_endpoint_fails(self):
        self.assertFalse(self.run_probe(anonymous=Response(200, {}))[2]['passed'])

    def test_network_failure_fails_all_checks(self):
        with patch('check_runtime.build_opener') as opener:
            opener.return_value.open.side_effect = URLError('unavailable')
            self.assertFalse(any(x['passed'] for x in probe('http://localhost:8080')))

    def test_real_http_error_shape_is_handled(self):
        error = HTTPError('http://localhost/api/v1/bills', 401, 'Unauthorized',
                          {'X-Request-ID': REQUEST_ID},
                          io.BytesIO(json.dumps({'code': 'UNAUTHORIZED',
                                                'requestId': REQUEST_ID}).encode()))
        self.assertTrue(self.run_probe(anonymous=error)[2]['passed'])

    def test_redirects_are_not_followed(self):
        self.assertIsNone(NoRedirect().redirect_request(None, None, 302, '', {},
                                                       'https://other.example'))
        self.assertFalse(self.run_probe(readiness=Response(302, {}))[1]['passed'])

    def test_invalid_json_and_invalid_uuid_fail(self):
        malformed = Response(200, {})
        malformed.seek(0)
        malformed.write(b'not json')
        malformed.seek(0)
        self.assertFalse(self.run_probe(readiness=malformed)[1]['passed'])
        self.assertFalse(self.run_probe(anonymous=Response(
            401, {'code': 'UNAUTHORIZED', 'requestId': 'bad'}, 'bad'))[2]['passed'])

    def test_no_credentials_queries_or_paths(self):
        for origin in ['http://user:password@host', 'http://host/?token=x',
                       'http://host/api', 'file:///tmp/test', 'https://host/#secret']:
            with self.subTest(origin=origin), self.assertRaises(ValueError):
                probe(origin)


if __name__ == '__main__':
    unittest.main()
