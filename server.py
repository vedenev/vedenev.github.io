#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Dec 30 12:46:03 2020

@author: vedenev
"""

import http.server, ssl

#server_address = ('0.0.0.0', 8000)
#httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
#httpd.socket = ssl.wrap_socket(httpd.socket,
#                               server_side=True,
#                               certfile='localhost.pem',
#                               ssl_version=ssl.PROTOCOL_TLS)
#print('started')
#httpd.serve_forever()

from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import ssl

httpd = HTTPServer(('0.0.0.0', 4443), SimpleHTTPRequestHandler)

httpd.socket = ssl.wrap_socket (httpd.socket, certfile='localhost.pem', server_side=True)

print('started')
httpd.serve_forever()