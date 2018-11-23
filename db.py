import sqlite3
from sqlite3 import Error
from util import *

file = './equations.db'

def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by the db_file
    :param db_file: database file
    :return: Connection object or None
    """
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)
    return None

def format_all():
    for row in get_equations():
        cur.execute('UPDATE samples SET equation=? WHERE equation=?;', (format_expr(row), row))
        conn.commit()
    conn.close()

def insert_equation(expr):
    expr = "'" + expr + "'"
    conn = create_connection(file)
    cur = conn.cursor()
    cur.execute('SELECT equation FROM samples WHERE equation={}'.format(expr))
    if not cur.fetchall():
        cur.execute('INSERT INTO samples VALUES ({})'.format(expr))
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False

def get_equations():
    conn = create_connection(file)
    cur = conn.cursor()
    cur.execute('SELECT equation FROM samples;');
    return [row[0] for row in cur.fetchall()]
    conn.close()

def remove_equation(expr):
    expr = "'" + expr + "'"
    conn = create_connection(file)
    cur = conn.cursor()
    cur.execute('DELETE FROM samples WHERE equation={}'.format(expr))
    conn.commit()
    return True;

def in_db(expr):
    expr = "'" + expr + "'"
    conn = create_connection(file)
    cur = conn.cursor()
    cur.execute('SELECT equation FROM samples WHERE equation={}'.format(expr))
    return bool(cur.fetchall())