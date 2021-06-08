"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user_id, get_user_name, get_user_balance, get_user_value

url_signer = URLSigner(session)

@action('index')
@action.uses(db, auth.user, url_signer, 'index.html')
def index():
    return dict(
        load_posts_url = URL('load_posts', signer=url_signer),
        add_post_url = URL('add_post', signer=url_signer),
        delete_post_url = URL('delete_post', signer=url_signer),
        get_thumbs_url = URL('get_thumbs', signer=url_signer),
        set_thumbs_url = URL('set_thumbs', signer=url_signer),
        get_stock_url = URL('get_stock', signer=url_signer),
        buy_stock_url = URL('buy_stock', signer=url_signer),
        sell_stock_url = URL('sell_stock', signer=url_signer),
        url_signer = url_signer,
    )

@action('portfolio')
@action.uses(db, auth.user, url_signer, 'portfolio.html')
def portfolio():
    return dict(
        get_stocks_url = URL('get_stocks', signer=url_signer),
        get_transactions_url = URL('get_transactions', signer=url_signer),
        update_value_url = URL('update_value', signer=url_signer),
        url_signer = url_signer,
    )

@action('leaderboard')
@action.uses(db, auth.user, url_signer, 'leaderboard.html')
def leaderboard():
    return dict(
        get_users_url = URL('get_users', signer=url_signer),
        url_signer = url_signer,
    )

@action('get_stock')
@action.uses(url_signer.verify(), db)
def get_stock():
    ticker = request.params.get('ticker')
    row = db((db.stocks.ticker == ticker) &
                (db.stocks.user_id == get_user_id())).select().first()
    holding = row.holding if row is not None else 0
    average = row.average if row is not None else 0

    return dict(
        holding = holding,
        average = average,
        balance = get_user_balance(),
    )

@action('get_stocks')
@action.uses(url_signer.verify(), db)
def get_stocks():
    stocks = db(db.stocks.user_id == get_user_id()).select().as_list()

    return dict(
        stocks = stocks,
        balance = get_user_balance(),
        value = get_user_value(),
    )

@action('buy_stock', method="POST")
@action.uses(url_signer.verify(), db)
def buy_stock():
    ticker = request.json.get('ticker')
    quantity = request.json.get('quantity')
    price = request.json.get('price')
    cost = request.json.get('cost')

    # Record transaction
    id = db.transactions.insert(
        ticker = ticker,
        quantity = quantity,
        price = price,
    )
    # Update balance
    user = db.auth_user[get_user_id()]
    db(db.auth_user.id == user.id).update(balance=(user.balance - float(cost)))
    stock = db((db.stocks.ticker == ticker) &
               (db.stocks.user_id == get_user_id())).select().first()
    if stock is None:  # Stock database entry doesn't exist, so create one
        db.stocks.insert(
            ticker = ticker,
            holding = quantity,
            average = price,
        )
    else:  # Use existing entry to recalculate # holding and average price
        holding = stock.holding + int(quantity)
        average = ((stock.holding * stock.average) + float(cost)) / holding
        db(db.stocks.id == stock.id).update(holding=holding, average=average)

    return dict(
        id = id,
    )

@action('sell_stock', method="POST")
@action.uses(url_signer.verify(), db)
def sell_stock():
    ticker = request.json.get('ticker')
    quantity = request.json.get('quantity')
    price = request.json.get('price')
    cost = request.json.get('cost')

    # Record transaction
    id = db.transactions.insert(
        ticker = ticker,
        quantity = int(quantity) * -1,
        price = price,
    )
    # Update balance
    user = db.auth_user[get_user_id()]
    db(db.auth_user.id == user.id).update(balance=(user.balance + float(cost)))
    stock = db((db.stocks.ticker == ticker) &
               (db.stocks.user_id == get_user_id())).select().first()
    if stock.holding == int(quantity):  # Sold all holding stock, so delete entry
        db(db.stocks.id == stock.id).delete()
    else:  # Use existing entry to recalculate # holding and average price
        holding = stock.holding - int(quantity)
        average = ((stock.holding * stock.average) - float(cost)) / holding
        db(db.stocks.id == stock.id).update(holding=holding, average=average)

    return dict(
        id = id,
    )

@action('get_transactions')
@action.uses(url_signer.verify(), db)
def get_transactions():
    transactions = db(db.transactions.user_id == get_user_id()).select().as_list()

    return dict(transactions = transactions)

@action('update_value', method='POST')
@action.uses(url_signer.verify(), db)
def update_value():
    stock_value = request.json.get('stock_value')
    user = db.auth_user[get_user_id()]
    db(db.auth_user.id == user.id).update(value=(user.balance + stock_value))

    return dict(
    )

@action('get_users')
@action.uses(url_signer.verify(), db)
def get_users():
    users = db(db.auth_user).select().as_list()

    return dict(users = users)
