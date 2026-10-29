import socket
import threading
import sys
import time

LISTEN_HOST = '127.0.0.1'
LISTEN_PORT = 8000
TARGET_HOST = '127.0.0.1'
TARGET_PORT = 8001

def pipe(source, destination):
    try:
        while True:
            data = source.recv(65536)
            if not data:
                break
            destination.sendall(data)
    except Exception:
        pass
    finally:
        try:
            destination.shutdown(socket.SHUT_WR)
        except Exception:
            pass

def handle_connection(client_socket):
    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.settimeout(15.0)
        server_socket.connect((TARGET_HOST, TARGET_PORT))
        server_socket.settimeout(None)

        t1 = threading.Thread(target=pipe, args=(client_socket, server_socket), daemon=True)
        t2 = threading.Thread(target=pipe, args=(server_socket, client_socket), daemon=True)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
    except Exception as e:
        pass
    finally:
        try:
            client_socket.close()
        except Exception:
            pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind((LISTEN_HOST, LISTEN_PORT))
    except Exception as e:
        print(f"Failed to bind {LISTEN_HOST}:{LISTEN_PORT}: {e}")
        sys.exit(1)

    server.listen(128)
    print(f"TCP Bridge actively listening on {LISTEN_HOST}:{LISTEN_PORT} -> {TARGET_HOST}:{TARGET_PORT}")
    sys.stdout.flush()

    while True:
        try:
            client_socket, addr = server.accept()
            client_thread = threading.Thread(target=handle_connection, args=(client_socket,), daemon=True)
            client_thread.start()
        except Exception as e:
            time.sleep(0.1)

if __name__ == '__main__':
    main()
