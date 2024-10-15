from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs

# In-memory storage for incoming messages
incoming_messages = []

class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            params = parse_qs(post_data)
            
            # Extract relevant information from the Twilio webhook
            from_number = params.get('From', [''])[0]
            body = params.get('Body', [''])[0]
            
            # Store the incoming message
            incoming_messages.append({
                'from': from_number,
                'body': body
            })
            
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        if self.path == '/incoming-messages':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(incoming_messages).encode())
            
            # Clear the incoming messages after sending
            incoming_messages.clear()
        else:
            self.send_response(404)
            self.end_headers()

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f'Server running on port {port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
