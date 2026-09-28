# -*- coding: utf-8 -*-
import functools

from flask import g, jsonify


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return jsonify({'success': False, 'error': 'Login required'}), 401
        return view(**kwargs)
    return wrapped_view
