#!/usr/bin/env python3
import argparse
import http.server
import ssl


def main():
    parser = argparse.ArgumentParser(description="Serve this repo over HTTPS for LAN testing.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8443)
    parser.add_argument("--cert", default="cert.pem")
    parser.add_argument("--key", default="key.pem")
    parser.add_argument("--directory", default=".")
    args = parser.parse_args()

    handler = lambda *handler_args, **handler_kwargs: http.server.SimpleHTTPRequestHandler(  # noqa: E731
        *handler_args,
        directory=args.directory,
        **handler_kwargs,
    )

    server = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=args.cert, keyfile=args.key)
    server.socket = context.wrap_socket(server.socket, server_side=True)

    print(f"Serving HTTPS on https://{args.host}:{args.port} from {args.directory}")
    server.serve_forever()


if __name__ == "__main__":
    main()
