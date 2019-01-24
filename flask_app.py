from flask import Flask, render_template, request, jsonify
from util import *
from db import *

app = Flask(__name__, static_folder='static', static_url_path='')

@app.route("/")
def main():
    return render_template("index.html")

@app.route("/slope_field", methods=["POST"])
def slope_field():
    form = {key: str_to_float(value) for key,value in request.form.items()}
    if 'expr' in form:
        form['expr'] = format_expr(form['expr'])
        field = (form['expr'], generate_slopes(**form))
    else:
        field = sample_slope(**form)
    return jsonify({"dydx": field[0], "slopes": field[1]})

@app.route("/random", methods=["POST"])
def random():
    form = {key: str_to_float(value) for key,value in request.form.items()}
    field = random_slope(**form)
    return jsonify({"dydx": field[0], "slopes": field[1]})

@app.route("/save", methods=["POST"])
def save():
    return str(insert_equation(request.form['expr']))

@app.route("/list", methods=["GET"])
def list():
    return jsonify({"list": get_equations()})

@app.route("/remove", methods=["POST"])
def remove():
    if check_password(request.form["password"]):
        return str(remove_equation(request.form['expr']))
    return "False"

@app.route("/inspect_point", methods=["POST"])
def inspect_point():
    x, y = float(request.form['x']), float(request.form['y'])
    dydx = generate_slopes(request.form['expr'],
        x, x + 1, y, y + 1, 1, 1)[0][0]
    return jsonify({"dydx": dydx})

@app.route("/eqn_in_db", methods=["POST"])
def eqn_in_db():
    return str(in_db(request.form['expr']))

if __name__ == "__main__":
    app.run(debug=True)