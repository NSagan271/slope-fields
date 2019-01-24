from sqlalchemy import create_engine
from util import *

file = './equations.db'

SQLALCHEMY_DATABASE_URI = "mysql+mysqlconnector://{username}:{password}@{hostname}/{databasename}".format(
    username="NaomiSagan",
    password="cs61@fall2018",
    hostname="NaomiSagan.mysql.pythonanywhere-services.com",
    databasename="NaomiSagan$equations"
)

engine= create_engine(SQLALCHEMY_DATABASE_URI)


def create_connection():
    """ create a database connection to the SQLite database
        specified by the db_file
    :param db_file: database file
    :return: Connection object or None
    """
    return engine.connect()

def format_all():
    con = create_connection();
    for row in get_equations():
        conn.execute('UPDATE samples SET equation=%s WHERE equation=%s;', (format_expr(row), row))
    con.close()

def insert_equation(expr):
    con = create_connection()
    result = con.execute('SELECT equation FROM samples WHERE equation=%s;', expr)
    if not result.fetchall():
        con.execute('INSERT INTO samples VALUES (%s)', expr)
        con.close()
        return True
    con.close()
    return False

def get_equations():
    con = create_connection()
    result = con.execute('SELECT equation FROM samples;');
    return [row[0] for row in result]
    con.close()

def remove_equation(expr):
    con = create_connection()
    con.execute('DELETE FROM samples WHERE equation=%s', expr)
    con.close()
    return True;

def in_db(expr):
    con = create_connection()
    print(expr)
    result = con.execute('SELECT equation FROM samples WHERE equation=%s', expr)
    con.close()
    return bool(result.fetchall())