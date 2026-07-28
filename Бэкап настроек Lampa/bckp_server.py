from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import os

# ================= CONFIGURATION =================
CONFIG = {
    "server_ip": "0.0.0.0",
    "server_port": 9999,
    "backup_folder": "/opt/lampac/wwwroot/backup"  # Путь к папке с бэкапами на сервере
}
# =================================================

class BackupHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        parsed_url = urlparse(self.path)
        query_params = parse_qs(parsed_url.query)

        # Получаем имя устройства
        device_name = query_params.get('device', [''])[0]

        # Очищаем имя для безопасности путей (оставляем буквы, цифры, дефисы и подчеркивания)
        device_name = "".join(c for c in device_name if c.isalnum() or c in ('_', '-'))

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        # Сохраняем, если передано валидное имя (игнорируем попытки перезаписать default)
        if device_name and device_name != 'default':
            folder = CONFIG["backup_folder"].rstrip('/')
            filename = f'{folder}/settings_{device_name}.txt'

            # Убедимся, что папка для бэкапов существует
            os.makedirs(folder, exist_ok=True)

            with open(filename, 'wb') as f:
                f.write(post_data)

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"success":true}')
        else:
            self.send_response(400)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"success":false, "error":"Invalid device name"}')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server_address = (CONFIG["server_ip"], CONFIG["server_port"])
    httpd = HTTPServer(server_address, BackupHandler)
    print(f"Backup server started on {CONFIG['server_ip']}:{CONFIG['server_port']}, folder: {CONFIG['backup_folder']}")
    httpd.serve_forever()
