"""
EventSphere AI provider.
Uses xAI Grok when XAI_API_KEY is set, otherwise falls back to Gemini.
"""

import json
import os
from typing import List

import requests

try:
    import google.generativeai as genai
except Exception:
    genai = None


class AIProvider:
    def __init__(self):
        self.provider = os.getenv("AI_PROVIDER", "xai").lower()
        self.xai_api_key = os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY")
        self.xai_model = os.getenv("XAI_MODEL", "grok-4.3")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")

        if self.xai_api_key:
            self.provider = "xai"
        elif self.gemini_api_key and genai:
            self.provider = "gemini"
            genai.configure(api_key=self.gemini_api_key)
            self.model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        else:
            self.provider = "local"

    def _generate(self, prompt: str) -> str:
        if self.provider == "xai":
            response = requests.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.xai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.xai_model,
                    "messages": [
                        {"role": "system", "content": "Return only valid JSON. Do not wrap JSON in markdown."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                },
                timeout=45,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()

        if self.provider == "gemini":
            response = self.model.generate_content(prompt)
            return response.text.strip()

        return ""

    def _parse_json_response(self, text: str, fallback: dict) -> dict:
        text = (text or "").strip()
        if not text:
            return fallback
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]).strip()
            if text.startswith("json"):
                text = text[4:].strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return fallback

    def generate_event_description(self, title: str, category: str = "", venue: str = "", date: str = "", speakers: List[dict] = None) -> dict:
        speakers = speakers or []
        speaker_names = [speaker.get("name", "") for speaker in speakers if speaker.get("name")]
        fallback = {
            "shortDescription": f"{title} is a practical, engaging event for learning and networking.",
            "fullDescription": f"{title} brings together curious people for useful sessions, meaningful conversations, and a polished event experience.\n\nAttendees can expect clear takeaways, relevant topics, and opportunities to connect with peers and speakers.",
            "highlights": ["Practical sessions", "Networking opportunities", "Expert-led discussions"],
            "targetAudience": "Students, professionals, founders, and enthusiasts",
            "callToAction": "Reserve your spot and be part of the experience.",
        }
        prompt = f"""
Generate a compelling professional event description.

Event Details:
- Title: {title}
- Category: {category or "General"}
- Venue: {venue or "TBA"}
- Date: {date or "TBA"}
- Featured speakers: {", ".join(speaker_names) if speaker_names else "TBA"}

Return this JSON shape:
{{
  "shortDescription": "A 1-2 sentence teaser under 150 characters",
  "fullDescription": "A 3-4 paragraph event description",
  "highlights": ["3-5 key highlights"],
  "targetAudience": "Who should attend",
  "callToAction": "A compelling CTA sentence"
}}
"""
        return self._parse_json_response(self._generate(prompt), fallback)

    def generate_recommendations(self, interests=None, location: str = "", past_events=None) -> dict:
        interests = interests or []
        past_events = past_events or []
        fallback = {
            "recommendedCategories": ["CONFERENCE", "WORKSHOP", "NETWORKING"],
            "recommendedTags": ["ai", "startup", "technology", "design", "career"],
            "reasoning": "These categories balance learning, networking, and practical discovery.",
            "discoveryPrompts": ["AI workshops near me", "startup networking events", "technology conferences in India"],
        }
        prompt = f"""
Suggest personalized event discovery recommendations.
Interests: {", ".join(interests) if interests else "general events"}
Location: {location or "India"}
Past events: {", ".join(past_events[:5]) if past_events else "none"}

Return JSON with recommendedCategories, recommendedTags, reasoning, and discoveryPrompts.
"""
        return self._parse_json_response(self._generate(prompt), fallback)

    def generate_schedule(self, event_title: str, duration: int = 8, topics=None, speakers=None, include_breaks: bool = True) -> dict:
        topics = topics or []
        speakers = speakers or []
        fallback = {
            "startTime": "09:00 AM",
            "endTime": "05:00 PM",
            "totalSessions": 4,
            "schedule": [
                {"time": "09:00 AM", "duration": 30, "title": "Registration and Welcome", "type": "networking", "speaker": None, "description": "Guest arrival and orientation."},
                {"time": "10:00 AM", "duration": 90, "title": f"Opening Session: {event_title}", "type": "keynote", "speaker": None, "description": "Main theme and context."},
                {"time": "01:00 PM", "duration": 60, "title": "Lunch and Networking", "type": "lunch", "speaker": None, "description": "Break for food and connections."},
                {"time": "03:00 PM", "duration": 90, "title": "Hands-on Session", "type": "workshop", "speaker": None, "description": "Interactive learning block."},
            ],
            "tips": ["Keep breaks visible in the agenda", "Leave buffer time for Q&A"],
        }
        prompt = f"""
Create a realistic event schedule starting at 9:00 AM.
Event: {event_title}
Duration: {duration} hours
Topics: {", ".join(topics) if topics else "general sessions"}
Speakers: {", ".join([speaker.get("name", "Speaker") for speaker in speakers]) if speakers else "TBA"}
Include breaks: {include_breaks}

Return JSON with startTime, endTime, totalSessions, schedule, and tips.
"""
        return self._parse_json_response(self._generate(prompt), fallback)
