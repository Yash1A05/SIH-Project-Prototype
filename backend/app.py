from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

@app.route("/")
def home():
    return "Blue Carbon MRV Backend is running!"

@app.route("/api/test")
def api_test():
    return jsonify({
        "status": "success",
        "message": "React can connect to Flask!",
        "project": "Blue Carbon MRV"
    })

if __name__ == "__main__":
    app.run(debug=True)