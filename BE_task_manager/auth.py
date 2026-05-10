from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User
from authlib.integrations.flask_client import OAuth
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/google/token', methods=['POST'])
def google_token():
    if not request.is_json:
        return jsonify({'error': 'Request must be application/json'}), 400

    token = request.json.get('token')
    if not token:
        return jsonify({'error': 'Missing token parameter'}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            current_app.config['GOOGLE_CLIENT_ID']
        )

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        profile_pic = idinfo.get('picture', '')

        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                profile_pic=profile_pic
            )
            db.session.add(user)
            db.session.commit()
            current_app.logger.info(f'Created new user: {email}')
        else:
            user.name = name
            user.profile_pic = profile_pic
            db.session.commit()
            current_app.logger.info(f'Updated existing user: {email}')

        login_user(user)

        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'profile_pic': user.profile_pic
            }
        }), 200

    except Exception as e:

        current_app.logger.error(f'Unexpected error: {e}', exc_info=True)

        return jsonify({
            'error': 'Internal server error',
            'debug': str(e),
            'debug_type': type(e).__name__
        }), 500
