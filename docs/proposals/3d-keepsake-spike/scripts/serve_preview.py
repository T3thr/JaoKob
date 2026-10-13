"""Serve only the spike folder on loopback; photographs and game files stay out."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parent.parent
server = ThreadingHTTPServer(('127.0.0.1', 4174), partial(SimpleHTTPRequestHandler, directory=str(root)))
print('JaoKob preview: http://127.0.0.1:4174/preview/', flush=True)
server.serve_forever()
