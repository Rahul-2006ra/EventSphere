"""
EventSphere - Flask AI Microservice
Handles all AI operations using Grok/xAI or Gemini API
"""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from routes.ai_routes import ai_bp

load_dotenv()

app = Flask(__name__)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
CORS(app, origins=allowed_origins or "*")

# Register blueprints
app.register_blueprint(ai_bp, url_prefix="/ai")


@app.route("/health")
def health():
    return {"status": "healthy", "service": "EventSphere AI"}, 200


@app.errorhandler(404)
def not_found(e):
    return {"success": False, "message": "Route not found"}, 404


@app.errorhandler(500)
def server_error(e):
    return {"success": False, "message": "Internal server error"}, 500


if __name__ == "__main__":
    port = int(os.getenv("PORT") or os.getenv("FLASK_PORT", 8000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    print(f"[EventSphere AI] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
