#!/usr/bin/env python3
"""
Lokal server för Inkomstdeklarationsformuläret.
Kör: python3 server.py  (eller dubbelklicka på Starta.command på Mac)
Öppna sedan: http://localhost:8000/deklarationsformular.html
"""
import http.server, urllib.request, urllib.parse, os, webbrowser, threading, sys

PORT = 8000

class ProxyHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        # Proxy /api/geocode → Nominatim (lägger till CORS-headers)
        if self.path.startswith('/api/geocode'):
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            q = params.get('q', [''])[0]
            upstream = (
                'https://nominatim.openstreetmap.org/search'
                '?format=json&addressdetails=1&limit=6&countrycodes=se&accept-language=sv'
                '&q=' + urllib.parse.quote(q)
            )
            try:
                req = urllib.request.Request(
                    upstream,
                    headers={'User-Agent': 'Deklarationsformular/1.0 (hiew.joey@gmail.com)'}
                )
                with urllib.request.urlopen(req, timeout=8) as r:
                    body = r.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'[]')
            return

        # Servera HTML/CSS/JS-filer statiskt
        super().do_GET()

    def log_message(self, fmt, *args):
        # Visa bara requests till /api/ i terminalen
        if '/api/' in args[0] if args else False:
            print(f'  {args[0]}')


def open_browser():
    import time; time.sleep(0.8)
    webbrowser.open(f'http://localhost:{PORT}/deklarationsformular.html')

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f'\n✅  Server startad på http://localhost:{PORT}')
print(f'   Öppnar formuläret i webbläsaren...\n')
print(f'   Tryck Ctrl+C för att stänga servern.\n')
threading.Thread(target=open_browser, daemon=True).start()
try:
    with http.server.HTTPServer(('', PORT), ProxyHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print('\nServern stängd.')
    sys.exit(0)
