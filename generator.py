import random

functions = ['add', 'sub', 'mul',
    'div', 'pow', 'sin', 'cos', 'tan',
    'atan', 'asin', 'acos', 'mod', 'reciprocal', 
    'ln']

operators = {'add': '+', 'sub': '-', 'mul': '*', 'div': '/', 'pow': '^', 'mod': '%'}

numbers = ['x', 'y']*9 + ['e', 'pi'] + list(range(2, 4))

def random_expr(prob=1):
    if random.random() < prob:
        f = random.choice(functions)
        if f in operators:
            return '({0}{1}{2})'.format(random_expr(prob*0.75), operators[f], random_expr(prob*0.75))
        elif f == 'reciprocal':
            return '1/{}'.format(random_expr(prob*0.75))
        else:
            return '{0}({1})'.format(f, random_expr(prob*0.75))
    return str(random.choice(numbers))