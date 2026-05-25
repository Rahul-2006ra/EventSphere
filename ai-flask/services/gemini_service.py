"""
EventSphere - Gemini AI Service
All AI operations: description generation, recommendations, scheduling
"""

import os
import json
import google.generativeai as genai
from typing import List, Optional


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def _generate(self, prompt: str) -> str:
        """Call Gemini API and return text response"""
        response = self.model.generate_content(prompt)
        return response.text.strip()

    def _parse_json_response(self, text: str) -> dict:
        """Safely parse JSON from Gemini response"""
        # Strip markdown code blocks if present
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])
        return json.loads(text)

    # ─────────────────────────────────────────────
    # 1. EVENT DESCRIPTION GENERATOR
    # ─────────────────────────────────────────────
    def generate_event_description(
        self,
        title: str,
        category: str = "",
        venue: str = "",
        date: str = "",
        speakers: List[dict] = [],
    ) -> dict:
        """Generate a compelling event description"""

        speaker_text = ""
        if speakers:
            speaker_names = [s.get("name", "") for s in speakers if s.get("name")]
            if speaker_names:
                speaker_text = f"Featured speakers: {', '.join(speaker_names)}."

        prompt = f"""
You are an expert event copywriter. Generate a compelling, professional event description for the following event.

Event Details:
- Title: {title}
- Category: {category or "General"}
- Venue: {venue or "TBA"}
- Date: {date or "TBA"}
- {speaker_text}

Return a JSON object with these exact fields:
{{
  "shortDescription": "A 1-2 sentence compelling teaser (max 150 chars)",
  "fullDescription": "A full 3-4 paragraph engaging event description (300-500 words)",
  "highlights": ["3-5 key highlights or reasons to attend"],
  "targetAudience": "Who should attend this event",
  "callToAction": "A compelling CTA sentence"
}}

Return ONLY valid JSON, no markdown, no explanation.
"""

        text = self._generate(prompt)
        return self._parse_json_response(text)

    # ─────────────────────────────────────────────
    # 2. EVENT RECOMMENDATION SYSTEM
    # ─────────────────────────────────────────────
    def generate_recommendations(
        self,
        interests: List[str] = [],
        location: str = "",
        past_events: List[str] = [],
    ) -> dict:
        """Generate personalized event recommendations"""

        interests_text = ", ".join(interests) if interests else "general events"
        past_text = ", ".join(past_events[:5]) if past_events else "none"

        prompt = f"""
You are a smart event recommendation engine. Based on the user's profile, suggest event types and categories they would love.

User Profile:
- Interests: {interests_text}
- Location: {location or "India"}
- Past Events Attended: {past_text}

Return a JSON object with:
{{
  "recommendedCategories": ["List of 3-5 event categories most relevant to this user"],
  "recommendedTags": ["8-10 specific topic tags to search for"],
  "reasoning": "Brief explanation of why these recommendations suit this user",
  "discoveryPrompts": [
    "3 search queries the user could use to find great events"
  ]
}}

Return ONLY valid JSON, no markdown, no explanation.
"""

        text = self._generate(prompt)
        return self._parse_json_response(text)

    # ─────────────────────────────────────────────
    # 3. SMART SCHEDULE GENERATOR
    # ─────────────────────────────────────────────
    def generate_schedule(
        self,
        event_title: str,
        duration: int = 8,
        topics: List[str] = [],
        speakers: List[dict] = [],
        include_breaks: bool = True,
    ) -> dict:
        """Generate an optimized event schedule"""

        topics_text = ", ".join(topics) if topics else "general sessions"
        speaker_names = [s.get("name", f"Speaker {i+1}") for i, s in enumerate(speakers)] if speakers else []
        speakers_text = ", ".join(speaker_names) if speaker_names else "TBA"

        prompt = f"""
You are an expert event scheduler. Create a professional, optimized schedule for the following event.

Event: {event_title}
Total Duration: {duration} hours
Topics to Cover: {topics_text}
Speakers: {speakers_text}
Include Breaks: {include_breaks}

Generate a realistic schedule starting at 9:00 AM.

Return a JSON object with:
{{
  "startTime": "09:00 AM",
  "endTime": "calculated end time",
  "totalSessions": number,
  "schedule": [
    {{
      "time": "09:00 AM",
      "duration": 30,
      "title": "Session title",
      "type": "keynote|session|break|lunch|networking|workshop",
      "speaker": "Speaker name or null",
      "description": "Brief session description"
    }}
  ],
  "tips": ["2-3 scheduling tips for this event type"]
}}

Return ONLY valid JSON, no markdown, no explanation.
"""

        text = self._generate(prompt)
        return self._parse_json_response(text)
