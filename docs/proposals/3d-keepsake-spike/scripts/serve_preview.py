"""Serve only the spike folder on loopback; photographs and game files stay out."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=4174)
port = parser.parse_args().port
root = Path(__file__).resolve().parent.parent
server = ThreadingHTTPServer(('127.0.0.1', port), partial(SimpleHTTPRequestHandler, directory=str(root)))
print(f'JaoKob preview: http://127.0.0.1:{port}/preview/', flush=True)
server.serve_forever()
