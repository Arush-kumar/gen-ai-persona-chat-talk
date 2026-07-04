import OpenAI from "openai";

import { 
  system_instruction_of_HiteshSir, 
  system_instruction_of_PiyushSir 
} from './constant/system_prompt.js';

// Initialize outside the handler to reuse the instance
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "GEMINI_API_KEY",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export default async function handler(req, res) {
  // 1. Enforce HTTP method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 2. Validate input payload
    const { message, persona, interrupted, partialReply, history, followUp } = req.body || {};

    if (followUp !== true && (!message || typeof message !== 'string' || message.trim() === '')) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    // 3. Determine persona safely
    const requestedPersona = typeof persona === 'string' ? persona.toLowerCase().trim() : '';
    let system_instruction = requestedPersona === 'piyush sir'
      ? system_instruction_of_PiyushSir
      : system_instruction_of_HiteshSir;

    // 3b. User interrupted the mentor mid-typing — ask for a natural,
    // in-character reaction (never a fixed template)
    if (interrupted === true) {
      const typedSoFar = typeof partialReply === 'string' ? partialReply.slice(0, 800) : '';
      system_instruction += `

IMPORTANT CONTEXT: Aap (mentor) abhi ek reply type kar hi rahe the ki user ne beech mein hi naya message bhej diya (interrupt kar diya).
${typedSoFar ? `Aap ab tak itna type kar chuke the: "${typedSoFar}"` : 'Aapne abhi type karna shuru hi kiya tha, kuch bheja nahi tha.'}

Apne reply ki shuruaat mein is interruption par naturally, IN CHARACTER react karo — bilkul jaise real chat mein hota hai. Har baar alag style ho, koi fixed pattern nahi:
- kabhi halka sa pyaar bhara scold ("arre ruk jaiye, pehle wo baat toh puri kar lein"),
- kabhi hasi/amusement, kabhi mock-annoyance, kabhi seedha flow ke saath chal dena,
- agar chal rahi baat serious thi aur naya message funny/off-topic hai (ya ulta), to us mood-clash ko zaroor notice karo,
- agar naya message urgent/serious hai to bina drama ke seedha usko handle karo.
Reaction ke baad: agar sahi lage to purani adhoori baat 1 line mein wrap karo, phir naye message ka jawab do. Reaction chhota aur natural rakho.`;
    }

    // 4. Call the OpenAI API (configured for Gemini) with streaming
    // 3c. Build the message list: system + recent history + current turn
    const messages = [{ role: "system", content: system_instruction }];

    if (Array.isArray(history)) {
      for (const m of history.slice(-20)) {
        if (
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim() !== ''
        ) {
          messages.push({ role: m.role, content: m.content.slice(0, 4000) });
        }
      }
    }

    if (followUp === true) {
      // user has gone quiet — the mentor nudges them, in character
      messages.push({
        role: "user",
        content: "(context note, not a real user message: user ne kaafi der se koi reply nahi kiya hai. Pichli conversation ke context mein ek CHHOTA sa natural follow-up bhejo — jaise real mentor chat mein karta hai: 'samajh aaya?', 'koi doubt to nahi?', 'try kiya kya?', ya chai ka koi halka sa taana. Har baar alag style, max 1-2 lines, koi heading/list nahi. Is note ka zikr bilkul mat karna, seedha follow-up message likho.)"
      });
    } else {
      messages.push({ role: "user", content: message.trim() });
    }

    // gemini-2.5-flash: 3.5-flash free tier allows only 20 requests/day
    const stream = await openai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages,
      // chat personas don't need thinking — faster first token, less quota
      reasoning_effort: "none",
      stream: true,
    });

    // 5. Stream chunks to the client as plain text
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) res.write(delta);
    }

    return res.end();

  } catch (error) {
    // 6. Detailed error logging on server, generic response to client
    console.error('Gemini API Error:', error);

    // If streaming already started, we can only end the response
    if (res.headersSent) {
      return res.end('\n\n_Kuch gadbad ho gayi — please try again._');
    }

    if (error?.status === 429) {
      return res.status(429).json({
        error: 'Rate limited.',
        reply: 'Abhi bahut saare messages aa gaye hai (API rate limit) — ek minute ruk ke phir try karo. ☕'
      });
    }

    return res.status(500).json({
      error: 'Something went wrong on the server.',
      reply: 'Something went wrong on the server. Please try again later.'
    });
  }
}
