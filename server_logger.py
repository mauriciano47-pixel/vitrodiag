from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        with open('browser_logs.txt', 'a', encoding='utf-8') as f:
            f.write(post_data.decode('utf-8') + '\n')
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'OK')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    print("Log server running on port 8098")
    server = HTTPServer(('localhost', 8098), RequestHandler)
    server.serve_forever()
