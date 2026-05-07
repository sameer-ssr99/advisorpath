/**
 * Antigravity AI Advisor - Session Management Prompts
 * Handles: Checking scheduled meetings, viewing past history, scheduling new meetings
 */

const normalizeDate = (date) => {
  if (!date) return 'Not specified';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const antigravitySessionPrompt = `You are an Antigravity AI Advisor - a friendly, knowledgeable academic advising assistant.

Your role is to help students manage their advising sessions by:
1. Providing clear information about upcoming meetings
2. Summarizing past advising history
3. Helping schedule new meetings with advisors

When responding about sessions:
- Be concise and friendly
- Always confirm session details (date, time, topic, advisor name, mode)
- Highlight important dates and topics
- Suggest ideal times for follow-up sessions if relevant

Format guidelines:
- Use bullet points for lists
- Bold important dates: **April 25, 2024**
- Highlight topics with relevant emoji: 📚 Course Planning, 🎓 Prerequisites, 📊 Progress Review
- Keep responses under 200 words unless detailed explanation needed`;

/**
 * Generate recommendation for viewing upcoming sessions
 */
const getUpcomingSessionsAdvice = (sessions = []) => {
  if (!sessions || sessions.length === 0) {
    return {
      advice: "You have no upcoming advising sessions scheduled. Would you like to schedule one? I can help you find the perfect time to meet with your advisor.",
      sessions: [],
      recommendation: "Schedule a session"
    };
  }

  const formattedSessions = sessions.map(s => ({
    topic: s.topic,
    datetime: normalizeDate(s.datetime),
    advisor: s.advisor?.name || 'Advisor',
    mode: s.mode,
    location: s.location || 'TBD',
    duration: `${s.duration} minutes`,
    status: s.status
  }));

  const nextSession = formattedSessions[0];
  
  return {
    advice: `Your next advising session is coming up! **${nextSession.topic}** with ${nextSession.advisor} on **${nextSession.datetime}** (${nextSession.mode}, ${nextSession.location}). Make sure to prepare any questions you have about your academic plan.`,
    sessions: formattedSessions,
    count: formattedSessions.length,
    recommendation: "Review your next session details"
  };
};

/**
 * Generate advice for past sessions history
 */
const getPastSessionsAdvice = (pastSessions = []) => {
  if (!pastSessions || pastSessions.length === 0) {
    return {
      advice: "You haven't completed any advising sessions yet. Your first session is a great opportunity to discuss your academic goals and course planning!",
      history: [],
      recommendation: "Schedule your first session"
    };
  }

  const formattedHistory = pastSessions.map(s => ({
    topic: s.topic,
    datetime: normalizeDate(s.datetime),
    advisor: s.advisor?.name || 'Advisor',
    notes: s.notes || 'No notes recorded',
    status: s.status
  }));

  const totalSessions = formattedHistory.length;
  const mostRecentTopic = formattedHistory[0]?.topic || 'Previous session';
  
  return {
    advice: `You've completed **${totalSessions}** advising session(s). Your most recent was about **${mostRecentTopic}**. These sessions are valuable for tracking your progress and staying on course for graduation!`,
    history: formattedHistory,
    count: totalSessions,
    recommendation: "Schedule a follow-up session"
  };
};

/**
 * Generate advice for scheduling a new session
 */
const getScheduleSessionAdvice = (suggestedTopics = []) => {
  const defaultTopics = [
    "📚 Course Registration & Planning",
    "🎓 Prerequisites & Requirements",
    "📊 Academic Progress Review",
    "🎯 Career Path Discussion",
    "⚠️ Academic Performance Review",
    "📋 Graduation Requirements Check"
  ];

  const topics = suggestedTopics.length > 0 ? suggestedTopics : defaultTopics;

  return {
    advice: "I'd be happy to help you schedule a new advising session! Here are some common topics we can discuss:",
    suggestedTopics: topics,
    steps: [
      "1. Choose a topic that fits your needs",
      "2. Select your preferred advisor",
      "3. Pick a convenient date and time",
      "4. Choose meeting mode (in-person or online)",
      "5. Submit your request for approval"
    ],
    recommendation: "Start scheduling",
    tips: "💡 Tip: Schedule sessions at least 3-5 days in advance for better availability"
  };
};

/**
 * Generate session readiness check
 */
const getSessionReadinessCheck = (sessionTopic = '', completedCourses = 0) => {
  const topicPrep = {
    "course registration": [
      "✓ Review degree requirements",
      "✓ Check prerequisite status",
      "✓ List courses of interest"
    ],
    "prerequisites": [
      "✓ Note any failed courses",
      "✓ List completed courses",
      "✓ Identify gaps in knowledge"
    ],
    "progress review": [
      "✓ Gather recent grades",
      "✓ Calculate current GPA",
      "✓ List completed courses this semester"
    ],
    "career path": [
      "✓ Identify career interests",
      "✓ Research relevant courses",
      "✓ Think about internships/experience"
    ]
  };

  const prepItems = Object.entries(topicPrep)
    .find(([key]) => sessionTopic.toLowerCase().includes(key))?.[1] 
    || ["✓ Prepare your questions", "✓ Review your academic file", "✓ Consider your goals"];

  return {
    topic: sessionTopic,
    readinessItems: prepItems,
    motivation: `You're ${Math.min(completedCourses * 8, 75)}% through your journey. This session will help keep you on track!`,
    encouragement: "You've got this! Advisors are here to help, not judge. Come prepared with questions and openness to guidance."
  };
};

/**
 * Generate session reschedule advice
 */
const getRescheduleAdvice = (currentSession) => {
  if (!currentSession) {
    return {
      advice: "No session to reschedule. Would you like to schedule a new one instead?",
      recommendation: "Schedule new session"
    };
  }

  return {
    advice: `Your current session on **${normalizeDate(currentSession.datetime)}** about **${currentSession.topic}** can be rescheduled. Please suggest 2-3 alternative times, and your advisor will confirm the best option.`,
    currentSession: {
      topic: currentSession.topic,
      datetime: normalizeDate(currentSession.datetime),
      advisor: currentSession.advisor?.name || 'Advisor'
    },
    steps: [
      "Contact your advisor with alternative times",
      "Be flexible if possible",
      "Allow 24-48 hours for response"
    ],
    recommendation: "Request reschedule"
  };
};

/**
 * Main function to process session-related questions
 */
const processSessionQuery = (queryType, data = {}) => {
  const {
    sessions = [],
    pastSessions = [],
    currentSession = null,
    sessionTopic = '',
    completedCourses = 0,
    suggestedTopics = []
  } = data;

  const queryMap = {
    upcoming: () => getUpcomingSessionsAdvice(sessions),
    history: () => getPastSessionsAdvice(pastSessions),
    past: () => getPastSessionsAdvice(pastSessions),
    schedule: () => getScheduleSessionAdvice(suggestedTopics),
    newmeeting: () => getScheduleSessionAdvice(suggestedTopics),
    readiness: () => getSessionReadinessCheck(sessionTopic, completedCourses),
    prepare: () => getSessionReadinessCheck(sessionTopic, completedCourses),
    reschedule: () => getRescheduleAdvice(currentSession),
    cancel: () => ({
      advice: "Before canceling, remember that regular check-ins help you stay on track. If the time doesn't work, consider rescheduling instead. Is there a time that works better for you?",
      recommendation: "Reschedule instead"
    })
  };

  const handler = queryMap[queryType.toLowerCase()];
  return handler 
    ? handler() 
    : { advice: "I can help with your advising sessions! Ask me about viewing upcoming sessions, past history, or scheduling new meetings." };
};

module.exports = {
  antigravitySessionPrompt,
  processSessionQuery,
  getUpcomingSessionsAdvice,
  getPastSessionsAdvice,
  getScheduleSessionAdvice,
  getSessionReadinessCheck,
  getRescheduleAdvice
};
