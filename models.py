"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_user_id():
    return auth.current_user.get('id') if auth.current_user else None

def get_user_name():
    r = db(db.auth_user.email == get_user_email()).select().first()
    name = r.first_name + " " + r.last_name if r is not None else "Unknown"
    return name if auth.current_user else None

def get_user_balance():
    return auth.current_user.get('balance') if auth.current_user else None

def get_user_value():
    return auth.current_user.get('value') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table(
    'posts',
    Field('email', default=get_user_email),
    Field('full_name', default=get_user_name),
    Field('content'),
)

db.define_table(
    'thumbs',
    Field('post_id', 'reference posts'),
    Field('user_id', 'reference auth_user', default=get_user_id),
    Field('full_name', default=get_user_name),
    Field('up', 'boolean', default=False),
    Field('down', 'boolean', default=False),
)

db.define_table(
    'stocks',
    Field('user_id', 'reference auth_user', default=get_user_id),
    Field('ticker', 'string'),
    Field('holding', 'integer'),
    Field('average', 'double'),
)

db.define_table(
    'transactions',
    Field('user_id', 'reference auth_user', default=get_user_id),
    Field('time', default=get_time),
    Field('ticker', 'string'),
    Field('quantity', 'integer'),
    Field('price', 'double'),
)

db.commit()
