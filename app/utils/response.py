from flask import jsonify

def success(data=None, message=None, status=200, meta=None):
    body = {'success': True}
    if message:
        body['message'] = message
    if data is not None:
        body['data'] = data
    if meta:
        body['meta'] = meta
    return jsonify(body), status

def error(message, status=400, errors=None):
    body = {'success': False, 'error': message}
    if errors:
        body['errors'] = errors
    return jsonify(body), status
