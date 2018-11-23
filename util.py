from math import *
from operator import *
from generator import *
from db import *
import random
import base64

operators = ['+', '-', '*', '/', '%', ')', '(', '^']
vars = ['x', 'y']
    
def sample_slope(x0, x1, y0, y1, x_step, y_step):
    expr = random.choice(get_equations())
    return (expr, generate_slopes(expr, x0, x1, y0, y1, x_step, y_step))

def random_slope(x0, x1, y0, y1, x_step, y_step):
    expr = random_expr()
    slopes = generate_slopes(expr, x0, x1, y0, y1, x_step, y_step, True)
    slopes, interesting = slopes[1], slopes[0]
    if not interesting:
        return random_slope(x0, x1, y0, y1, x_step, y_step)
    return (expr, generate_slopes(expr, x0, x1, y0, y1, x_step, y_step))

def frange(start, end, step):
    while start < end:
        yield start
        start += step

def generate_slopes(expr, x0, x1, y0, y1, x_step, y_step, check_interesting=False):
    expr = expr.replace('^', '**')
    slope0 = None
    interesting = False #checks whether all slopes are the same
    slopes = []
    for y in frange(y0, y1, y_step):
        temp = []
        for x in frange(x0, x1, x_step):
            try:
                slope = eval(expr)
                if isinstance(slope, complex):
                    slope = "NaN"
                temp.append(slope)
            except ZeroDivisionError:
                temp.append('inf')
            except BaseException as e:
                temp.append("NaN")
            if slope0 is None:
                slope0 = temp[-1]
            if temp[-1] != slope0:
                interesting = True
        slopes.append(temp)
    if check_interesting:
        return (interesting, slopes)
    return slopes

def format_expr(expr):
    if is_float(expr):
        return str(expr)
    expr = expr.lower().replace(' ', '')
    result = ''
    current = ''
    unclosed_parens = 0
    while len(expr) > 0:
        char = expr[0]
        expr = expr[1:]
        if current == '':
            current = char
        elif is_float(current) or current == '.' or current in ['pi', 'e']:
            if (char.isdigit() or char == '.') and current not in ['pi', 'e']:
                current += char
            elif char in operators:
                result += current
                if unclosed_parens:
                    current += ')'
                    unclosed_parens -= 1
                current = char
            else:
                result += current
                if unclosed_parens:
                    current += ')'
                    unclosed_parens -= 1
                result += '*'
                current = char
                if char == '(':
                    result += char
                    current = ''
        elif current in operators:
            result += current 
            current = char
            if char == '(':
                result += char
                current = ''
        elif current in vars:
            if unclosed_parens:
                current += ')'
                unclosed_parens -= 1
            if char in operators:
                result += current
                current = char
            else:
                result += current
                result += '*'
                current = char
                if char == '(':
                    result += char
                    current = ''
        else: #assume current is a function
            if char == '(':
                result += current
                result += char
                current = ''
            elif char.isdigit() or char == '.' or char in vars:
                result += current
                result += '('
                unclosed_parens += 1
                current = char
            else:
                current += char
    result += current
    while unclosed_parens:
        result += ')'
        unclosed_parens -= 1
    return result

def is_float(str):
    try:
        float(str)
        return True
    except ValueError:
        return False
            
def str_to_float(str):
    if is_float(str):
        return float(str)
    return str

def sec(x):
    return 1/cos(x)

def csc(x):
    return 1/sin(x)

def cot(x):
    return 1/tan(x)

def ln(x):
    return log(x)

def reciprocal(x):
    return 1/x

def div(x, y):
    return x/y
    
def check_password(encoded):
    return str(base64.b64decode(encoded))[2: -1] == "cs61afall2018"