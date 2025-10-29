from collections.abc import Callable, Iterable, Sequence
import functools
from typing import final
from urllib.parse import urljoin
from wsgiref.types import StartResponse, WSGIEnvironment

from werkzeug import Request, Response
from werkzeug.exceptions import HTTPException, NotFound
from werkzeug.routing import Map, Rule

from .config import Config


NCSI_RESPONSES = {
    "connecttest.txt": "Microsoft Connect Test",
    "ncsi.txt": "Microsoft NCSI",
}


def format_hosts(port: int, hostnames: Sequence[str]):
    def acknowledge_trailing_dot(it: Iterable[str]):
        for hostname in it:
            yield hostname
            yield hostname.removesuffix(".")

    def insert_port(it: Iterable[str]):
        for hostname in it:
            yield hostname if port == 80 else  f"{hostname}:{port}"

    return insert_port(acknowledge_trailing_dot(hostnames))


@final
class Bouncer:
    def __init__(self, config: Config, friendly_hostname: str):
        self.config = config
        port = config.bouncer_port

        ncsi_template = functools.partial(Rule, "/<name>", endpoint=self.ncsi, methods=["GET"])
        ncsi_hosts = set(format_hosts(port, self.config.ncsi_hosts))
        ncsi_rules = [ncsi_template(host=host) for host in ncsi_hosts]

        mdns_routes = [("/", ["GET"]), ("/ktp/hello", ["POST"])]
        mdns_hosts = set(format_hosts(port, [friendly_hostname]))
        mdns_rules = [
            Rule(route, endpoint=self.redirect, methods=methods, host=host)
            for route, methods in mdns_routes
            for host in mdns_hosts
        ]

        self.url_map = Map([*ncsi_rules, *mdns_rules], host_matching=True)

    def dispatch_request(self, request: Request):
        adapter = self.url_map.bind_to_environ(request.environ)
        try:
            rule, values = adapter.match(return_rule=True)
            endpoint: Callable[[Request], Response] = rule.endpoint  # pyright: ignore[reportAny]
            return endpoint(request, **values)
        except HTTPException as exc:
            return exc

    def __call__(self, environ: WSGIEnvironment, start_response: StartResponse):
        request = Request(environ)
        response = self.dispatch_request(request)
        return response(environ, start_response)

    def ncsi(self, _request: Request, *, name: str) -> Response:
        try:
            response = NCSI_RESPONSES[name]
        except KeyError:
            raise NotFound()
        return Response(response, 200, content_type="text/plain")

    def redirect(self, request: Request):
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Location": urljoin(self.config.canonical_url, request.full_path),
        }
        return Response(status=307, headers=headers)
