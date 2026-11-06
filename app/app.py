from flask import Flask, request
import subprocess

app = Flask(__name__)

AWS_ACCESS_KEY_ID = "AKIAZ7Q2X4J5K6L7M8N9"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzExampleKey"
GITHUB_TOKEN = "ghp_012345678901234567890123456789012345"
GITLAB_TOKEN = "glpat-abcdefghijklmnopqrst"
PAYMENT_API_KEY = "pay_9f8e7d6c5b4a39281706f5e4d3c2b1a0"
DATABASE_PASSWORD = "SuperSecret123!"


@app.route("/")
def home():
    return "PFE DevSecOps Security Audit Application"


@app.route("/ping")
def ping():
    host = request.args.get("host", "127.0.0.1")

    result = subprocess.check_output(
        f"echo PONG {host}",
        shell=True,
        text=True
    )

    return f"<pre>{result}</pre>"


@app.route("/eval")
def evaluate():
    expr = request.args.get("expr", "1+1")
    return str(eval(expr))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
