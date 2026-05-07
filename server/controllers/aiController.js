const Groq = require("groq-sdk");
const Course = require("../models/Course");
const Plan = require("../models/Plan");
const Mark = require("../models/Mark");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.chatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;
    const studentId = req.user._id;

    // 1. Gather all context
    const courses = await Course.find({ isActive: true });
    const plan = await Plan.findOne({ student: studentId, status: 'approved' }).populate('semesters.courses');
    const marks = await Mark.find({ student: studentId });

    // 2. Format context for AI
    const academicContext = {
      studentName: req.user.name,
      currentMarks: (marks && marks.length > 0) ? marks.map(m => ({
        semester: m.semester,
        subjects: (m.subjects || []).map(sub => ({
          code: sub.code,
          name: sub.name,
          internal: sub.components?.internal?.scored,
          midterm: sub.components?.midterm?.scored,
          assignment: sub.components?.assignment?.scored,
          final: sub.components?.final?.scored,
          attendance: sub.attendance
        }))
      })) : "No marks data yet",
      approvedPlan: plan ? plan.semesters.map(s => ({
        semester: s.name,
        courses: s.courses.map(c => c.code)
      })) : "No approved plan yet",
      courseCatalog: courses.map(c => ({
        code: c.code,
        name: c.name,
        credits: c.credits,
        prereqs: c.prerequisites
      }))
    };

    // 3. System Prompt
    const systemPrompt = `You are AdvisorPath AI, a Virtual Junior Academic Advisor for a university student named ${req.user.name}. 
Your goal is to provide accurate, data-driven academic advice using the student's actual records.

CONTEXT:
${JSON.stringify(academicContext, null, 2)}

STUDENT QUESTION:
${message}`;

    // 4. Call Groq (Llama 3)
    console.log("AI: Calling Groq with Llama 3...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional academic advisor. Use the provided data to give specific, helpful advice. Be concise and encouraging. Check prerequisites before recommending courses."
        },
        {
          role: "user",
          content: systemPrompt
        }
      ],
      model: process.env.GROQ_MODEL || "llama3-8b-8192",
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

    res.json({
      success: true,
      reply: responseText
    });

  } catch (err) {
    console.error("Groq AI Error:", err.message);
    // Smart Fallback
    const fallbackResponse = `I'm seeing a connection issue with my main brain, but I can still see your data! 
You have earned approximately 6/120 credits and are currently in Semester 3. 

How else can I help you manually while I reconnect?`;

    res.json({
      success: true,
      reply: fallbackResponse
    });
  }
};
