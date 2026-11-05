from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route("/")
def home():
    return "PFE DevSecOps Security Audit Application"

@app.route("/ping")
def ping():
    host = request.args.get("host", "127.0.0.1")

    # INTENTIONALLY VULNERABLE: OS command injection
    result = subprocess.check_output(
        f"echo PONG {host}",
        shell=True,
        text=True
    )

    return f"<pre>{result}</pre>"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
