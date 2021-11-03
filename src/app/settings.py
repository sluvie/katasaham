from os.path import join, dirname, realpath

UPLOAD_PATH = join(dirname(realpath(__file__)), 'static/uploads/')

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5499,
    "user": "katasaham",
    "password": "katasaham",
    "database": "katasahamdb"
}

APP_CONFIG = {
    "title": "Kata Saham"
}