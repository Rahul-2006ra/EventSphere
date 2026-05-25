/**
 * EventSphere - AI Routes
 * Uses the Flask AI microservice when available and falls back to local generators.
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const FLASK_URL = process.env.FLASK_AI_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

const cleanList = (items = []) => items.map((item) => String(item || '').trim()).filter(Boolean);

const categoryTone = {
  CONFERENCE: 'industry leaders, practical sessions, and high-value networking',
  WORKSHOP: 'hands-on learning, guided exercises, and take-home resources',
  SEMINAR: 'focused expert insights, discussion, and actionable frameworks',
  MEETUP: 'community conversations, peer learning, and relaxed networking',
  FESTIVAL: 'immersive experiences, showcases, and memorable live moments',
  NETWORKING: 'curated introductions, founder conversations, and collaboration opportunities',
  SPORTS: 'high-energy competition, team spirit, and an electric crowd atmosphere',
  CONCERT: 'live performances, shared energy, and an unforgettable audience experience',
  EXHIBITION: 'showcases, demos, and direct access to creators and brands',
  OTHER: 'useful sessions, meaningful connections, and a polished event experience',
};

const generateDescriptionFallback = ({ title, category = 'OTHER', venue, date, speakers }) => {
  const speakerNames = cleanList(speakers).slice(0, 3);
  const tone = categoryTone[category] || categoryTone.OTHER;
  const place = venue ? ` at ${venue}` : '';
  const when = date ? ` on ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
  const speakerLine = speakerNames.length
    ? ` Featured voices include ${speakerNames.join(', ')}, bringing practical experience and fresh perspective to the room.`
    : '';

  return {
    shortDescription: `${title} brings together ${tone}.`,
    fullDescription: `${title}${place}${when} is designed for people who want more than a passive event. Expect ${tone}, with a program shaped around useful takeaways, smooth attendee flow, and opportunities to connect with the right people.${speakerLine}\n\nAttendees can look forward to clear sessions, thoughtful breaks, and a welcoming environment that makes it easy to learn, participate, and leave with momentum. Whether you are joining to discover ideas, meet collaborators, or build confidence in the topic, this event gives you a strong reason to be in the room.`,
    highlights: [
      'Practical sessions and clear takeaways',
      'Curated networking moments',
      'Attendee-friendly schedule and flow',
      'Professional event experience',
    ],
    tags: cleanList([category.toLowerCase(), 'networking', 'learning', 'community']),
    source: 'local-fallback',
  };
};

const toTime = (minutesFromStart) => {
  const date = new Date(2000, 0, 1, 9, 0 + minutesFromStart);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const generateScheduleFallback = ({ eventTitle, duration = 8, topics, speakers, breaks = true }) => {
  const safeDuration = Math.min(Math.max(Number(duration) || 8, 1), 24);
  const totalMinutes = safeDuration * 60;
  const topicList = cleanList(topics);
  const speakerList = cleanList(speakers);
  const coreTopics = topicList.length ? topicList : ['Opening context', 'Main session', 'Interactive discussion', 'Action planning'];
  const schedule = [];
  let cursor = 0;

  schedule.push({
    time: toTime(cursor),
    duration: 30,
    title: `Welcome and Orientation: ${eventTitle || 'Event'}`,
    type: 'opening',
    speaker: speakerList[0] || null,
    description: 'Set expectations, introduce the theme, and help attendees settle in.',
  });
  cursor += 30;

  coreTopics.forEach((topic, index) => {
    if (cursor + 60 > totalMinutes) return;
    schedule.push({
      time: toTime(cursor),
      duration: 60,
      title: topic,
      type: index === 0 ? 'keynote' : 'session',
      speaker: speakerList[index % Math.max(speakerList.length, 1)] || null,
      description: `A focused session covering ${topic.toLowerCase()} with examples and audience takeaways.`,
    });
    cursor += 60;

    if (breaks && cursor + 15 < totalMinutes && index < coreTopics.length - 1) {
      schedule.push({
        time: toTime(cursor),
        duration: 15,
        title: 'Networking Break',
        type: 'break',
        speaker: null,
        description: 'Short break for refreshments and attendee conversations.',
      });
      cursor += 15;
    }
  });

  if (cursor + 45 <= totalMinutes) {
    schedule.push({
      time: toTime(cursor),
      duration: 45,
      title: 'Panel Discussion and Q&A',
      type: 'panel',
      speaker: speakerList.length ? speakerList.join(', ') : null,
      description: 'Open discussion, audience questions, and practical next steps.',
    });
    cursor += 45;
  }

  if (cursor < totalMinutes) {
    schedule.push({
      time: toTime(cursor),
      duration: Math.min(30, totalMinutes - cursor),
      title: 'Closing Notes',
      type: 'closing',
      speaker: null,
      description: 'Summarize key ideas, thank attendees, and share follow-up actions.',
    });
  }

  return {
    startTime: '09:00 AM',
    endTime: toTime(totalMinutes),
    totalSessions: schedule.length,
    schedule,
    tips: [
      'Keep registration open at least 30 minutes before the first session.',
      'Place breaks after dense sessions to improve engagement.',
      'Reserve a few minutes at the end of each session for questions.',
    ],
    source: 'local-fallback',
  };
};

const generateRecommendationsFallback = ({ interests, location, pastEvents }) => {
  const interestList = cleanList(interests);
  const pastList = cleanList(pastEvents);
  const baseTags = [...interestList, ...pastList, 'technology', 'startup', 'design', 'career'].slice(0, 8);
  return {
    recommendedTags: [...new Set(baseTags.length ? baseTags : ['technology', 'startup', 'design', 'career'])],
    location: location || 'near you',
    reasoning: 'These recommendations balance your stated interests with popular discovery categories on EventSphere.',
    suggestions: [
      'Try searching by topic and city together for more relevant events.',
      'Save interesting events to your wishlist before booking.',
      'Look for workshops if you want hands-on learning.',
    ],
    source: 'local-fallback',
  };
};

const fallbackFor = (endpoint, data) => {
  if (endpoint === '/ai/generate-description') return generateDescriptionFallback(data);
  if (endpoint === '/ai/schedule') return generateScheduleFallback(data);
  if (endpoint === '/ai/recommendations') return generateRecommendationsFallback(data);
  return {};
};

const shouldUseLocalFallback = (err) => {
  const status = err?.response?.status;
  return !FLASK_URL || status === 404 || status === 503 || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT';
};

const proxyToFlask = async (endpoint, data, res, next) => {
  try {
    if (!FLASK_URL) {
      return res.json({ success: true, data: fallbackFor(endpoint, data) });
    }

    const response = await axios.post(`${FLASK_URL}${endpoint}`, data, {
      timeout: 12000,
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json({ success: true, data: response.data });
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      return res.json({ success: true, data: fallbackFor(endpoint, data) });
    }
    return next(err);
  }
};

router.post('/generate-description', authenticate, authorize('ORGANIZER', 'ADMIN'), async (req, res, next) => {
  const { title, category, venue, date, speakers } = req.body;
  await proxyToFlask('/ai/generate-description', { title, category, venue, date, speakers }, res, next);
});

router.post('/recommendations', authenticate, async (req, res, next) => {
  const { userId, interests, location, pastEvents } = req.body;
  await proxyToFlask('/ai/recommendations', { userId, interests, location, pastEvents }, res, next);
});

router.post('/schedule', authenticate, authorize('ORGANIZER', 'ADMIN'), async (req, res, next) => {
  const { eventTitle, duration, topics, speakers, breaks } = req.body;
  await proxyToFlask('/ai/schedule', { eventTitle, duration, topics, speakers, breaks }, res, next);
});

module.exports = router;
