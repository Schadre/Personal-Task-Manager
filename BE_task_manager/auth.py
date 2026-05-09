from flask import Blueprint, redirect, url_for, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User
from authlib.integrations.flask_client import OAuth
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/google/token', methods=['POST'])
def google_token():
    token = request.json.get('token')
    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), current_app.config['GOOGLE_CLIENT_ID'])

        user = User.query.filter_by(google_id=idinfo['sub']).first()
        if not user:
            user = User(
                google_id=idinfo['sub'],
                email=idinfo['email'],
                name=idinfo.get('name', ''),
                profile_pic=idinfo.get('picture', '')
            )
            db.session.add(user)
            db.session.commit()

        login_user(user)
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'profile_pic': user.profile_pic
            }
        })
    except ValueError as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401


@auth_bp.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/auth/me')
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'name': current_user.name,
        'profile_pic': current_user.profile_pic
    })
