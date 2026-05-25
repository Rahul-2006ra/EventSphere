"""
EventSphere - AI Routes (Flask Blueprint)
"""

from flask import Blueprint, request, jsonify
from services.ai_provider import AIProvider

ai_bp = Blueprint("ai", __name__)
ai = AIProvider()


@ai_bp.route("/generate-description", methods=["POST"])
def generate_description():
    """
    Generate a professional event description using AI
    Input: { title, category, venue, date, speakers }
    """
    try:
        data = request.get_json()
        if not data or not data.get("title"):
            return jsonify({"success": False, "message": "Event title is required"}), 400

        result = ai.generate_event_description(
            title=data.get("title", ""),
            category=data.get("category", ""),
            venue=data.get("venue", ""),
            date=data.get("date", ""),
            speakers=data.get("speakers", []),
        )

        return jsonify({"success": True, "data": result})
    except Exception as e:
        print(f"[AI Route] generate-description error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@ai_bp.route("/recommendations", methods=["POST"])
def recommendations():
    """
    Generate personalized event recommendations
    Input: { userId, interests, location, pastEvents }
    """
    try:
        data = request.get_json()

        result = ai.generate_recommendations(
            interests=data.get("interests", []),
            location=data.get("location", ""),
            past_events=data.get("pastEvents", []),
        )

        return jsonify({"success": True, "data": result})
    except Exception as e:
        print(f"[AI Route] recommendations error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@ai_bp.route("/schedule", methods=["POST"])
def generate_schedule():
    """
    Generate a smart event schedule
    Input: { eventTitle, duration, topics, speakers, breaks }
    """
    try:
        data = request.get_json()
        if not data or not data.get("eventTitle"):
            return jsonify({"success": False, "message": "Event title is required"}), 400

        result = ai.generate_schedule(
            event_title=data.get("eventTitle", ""),
            duration=data.get("duration", 8),
            topics=data.get("topics", []),
            speakers=data.get("speakers", []),
            include_breaks=data.get("breaks", True),
        )

        return jsonify({"success": True, "data": result})
    except Exception as e:
        print(f"[AI Route] schedule error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
