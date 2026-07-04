import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.es.mjs';
import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11/+esm';

marked.setOptions({ breaks: true });

// render markdown → sanitize → syntax-highlight code blocks
function renderMarkdown(el, text) {
  el.innerHTML = DOMPurify.sanitize(marked.parse(text));
  el.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}

const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const title = document.getElementById('chat-title');
const avatar = document.getElementById('tutor-avatar');
const sessionLabel = document.getElementById('session-label');
const statusText = document.getElementById('status-text');
const sendBtn = form.querySelector('button');

const TUTORS = {
  'Hitesh Sir': {
    slug: 'hitesh',
    image: './images/hitesh-sir.jfif',
    catchphrase: '“Haan ji!”',
    welcome: 'Chai le aaiye aur poochhiye jo poochhna hai — career, code, ya cohort.',
    typing: 'chai bana rahe hai…',
    status: 'persona online · chai aur code',
    breakStatus: 'chai ki sip… ☕',
    chips: [
      'DSA pehle ya development?',
      'GenAI cohort kya hai?',
      'Communication skills kaise sudhaaru?',
    ],
  },
  'Piyush Sir': {
    slug: 'piyush',
    image: './images/piyush-sir.png',
    catchphrase: '“Chalo build karte hai.”',
    welcome: 'Straight practical baat hogi — projects, stack, aur career. Poochho.',
    typing: 'code likh rahe hai…',
    status: 'persona online · builder mode',
    breakStatus: 'terminal check kar rahe hai… 💻',
    chips: [
      'MERN stack roadmap batao',
      'Docker kaise seekhu?',
      'Freelancing ya job?',
    ],
  },
};

const selectedTutor = TUTORS[localStorage.getItem('selectedTutor')]
  ? localStorage.getItem('selectedTutor')
  : 'Hitesh Sir';
const tutor = TUTORS[selectedTutor];

// persona-aware chrome
document.body.dataset.persona = tutor.slug;
title.textContent = selectedTutor;
avatar.src = tutor.image;
avatar.alt = selectedTutor;
sessionLabel.textContent = `${tutor.slug}-sir — live session`;
statusText.textContent = tutor.status;
document.title = `${selectedTutor} — Chai or Cohort`;

renderWelcome();

// --- mentor switcher ---
const picker = document.getElementById('picker');
const switchBtn = document.getElementById('switch-btn');

switchBtn.addEventListener('click', () => {
  picker.hidden = false;
  picker.querySelector('.picker-card').focus();
});

function closePicker() {
  picker.hidden = true;
  switchBtn.focus();
}

picker.querySelectorAll('[data-close-picker]').forEach((el) =>
  el.addEventListener('click', closePicker)
);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !picker.hidden) closePicker();
});

picker.querySelectorAll('.picker-card').forEach((card) =>
  card.addEventListener('click', () => {
    const choice = card.dataset.tutor;
    if (choice === selectedTutor) {
      closePicker();
      return;
    }
    localStorage.setItem('selectedTutor', choice);
    window.location.reload();
  })
);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  sendMessage(input.value.trim());
});

// the reply currently being typed (if any) — so a new message can interrupt it
let activeReply = null;

// conversation memory: sent with every request so the mentor remembers
const history = [];

// follow-up nudge: if the user goes quiet after a reply, the mentor
// checks in on their own (once, until the user speaks again)
let nudgeTimer = null;
let nudgeUsed = false;

function scheduleNudge() {
  clearTimeout(nudgeTimer);
  if (nudgeUsed) return;
  const delay = 45000 + Math.random() * 45000; // 45-90s, feels random
  nudgeTimer = setTimeout(() => {
    // bad moment? (tab hidden, reply in progress, user mid-typing) — try later
    if (document.hidden || activeReply || input.value.trim() !== '') {
      scheduleNudge();
      return;
    }
    nudgeUsed = true;
    requestReply({ followUp: true });
  }, delay);
}

async function sendMessage(userMsg) {
  if (!userMsg) return;

  clearTimeout(nudgeTimer);
  nudgeUsed = false;

  // WhatsApp-style interruption: user sent a new message while the
  // mentor was still typing — cut that reply where it is and let the
  // model react to being interrupted
  let wasInterrupted = false;
  let partialReply = '';
  if (activeReply) {
    partialReply = activeReply.interrupt();
    wasInterrupted = true;
    // remember what the mentor managed to say before being cut off
    if (partialReply) history.push({ role: 'assistant', content: partialReply });
  }

  const userRow = addMessage(userMsg, 'user');
  const ticks = userRow.querySelector('.ticks');
  input.value = '';
  history.push({ role: 'user', content: userMsg });

  await requestReply({ message: userMsg, wasInterrupted, partialReply, ticks });
}

async function requestReply({ message = '', followUp = false, wasInterrupted = false, partialReply = '', ticks = null }) {
  const typingRow = addTypingIndicator();
  const controller = new AbortController();
  let typer = null;

  const thisReply = {
    interrupt() {
      controller.abort();
      typingRow.remove();
      if (typer) {
        typer.interrupt();
        return typer.getTyped();
      }
      return '';
    },
  };
  activeReply = thisReply;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        message,
        persona: selectedTutor,
        history: history.slice(-16),
        ...(followUp && { followUp: true }),
        ...(wasInterrupted && { interrupted: true, partialReply }),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      typingRow.remove();
      addMessage(data.reply || 'Kuch gadbad ho gayi — reply nahi mila. Try again?', 'bot');
      return;
    }

    // stream the reply into a human-like typer
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      if (!typer) {
        typingRow.remove();
        // message "seen" — double tick
        if (ticks) {
          ticks.textContent = '✓✓';
          ticks.classList.add('seen');
        }
        typer = createHumanTyper();
      }

      typer.push(chunk);
    }

    if (!typer) {
      typingRow.remove();
      addMessage('Kuch gadbad ho gayi — reply nahi mila. Try again?', 'bot');
    } else {
      typer.end();
      await typer.finished;
      // remember the full reply, then wait to see if the user goes quiet
      history.push({ role: 'assistant', content: typer.getTyped() });
      if (followUp) nudgeUsed = true;
      scheduleNudge();
    }
  } catch (err) {
    if (err.name === 'AbortError') return; // superseded by a newer message
    typingRow.remove();
    if (typer) {
      typer.end();
      await typer.finished;
    }
    addMessage('Server se connect nahi ho paya. Check your connection and try again.', 'bot');
  } finally {
    if (activeReply === thisReply) activeReply = null;
    input.focus();
  }
}

// ---------------------------------------------------------------
// Human-like typewriter: types the streamed reply with jittery
// speed, pauses at punctuation, occasional hesitation, and rare
// typos that get noticed, backspaced, and retyped.
// ---------------------------------------------------------------
const NEAR_KEYS = {
  a: 'sq', b: 'vn', c: 'xv', d: 'sf', e: 'wr', f: 'dg', g: 'fh',
  h: 'gj', i: 'uo', j: 'hk', k: 'jl', l: 'k', m: 'n', n: 'bm',
  o: 'ip', p: 'o', q: 'wa', r: 'et', s: 'ad', t: 'ry', u: 'yi',
  v: 'cb', w: 'qe', x: 'zc', y: 'tu', z: 'x',
};

// misspell a word: swap two inner letters or drop one
function misspell(word) {
  const i = 1 + Math.floor(Math.random() * (word.length - 2));
  if (Math.random() < 0.5) {
    return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
  }
  return word.slice(0, i) + word.slice(i + 1);
}

function createHumanTyper() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rawSleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let target = '';       // full text received from the stream so far
  let pos = 0;           // how far into target we have typed
  let segText = '';      // text shown in the current bubble
  let typedAll = '';     // text finished in earlier bubbles of this reply
  let streamDone = false;
  let interrupted = false;
  let chaiBreakDone = false;
  let burst = 0;
  let resolveFinished;
  const finished = new Promise((r) => (resolveFinished = r));

  // sleeps in small slices so an interruption cuts pauses short
  const sleep = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !interrupted) {
      await rawSleep(Math.min(50, end - Date.now()));
    }
  };

  const setStatus = (t) => { statusText.textContent = t; };

  const newBubble = () => {
    const b = addMessage('', 'bot').querySelector('.bubble');
    b.classList.add('streaming');
    return b;
  };

  let bubble = newBubble();

  const render = () => {
    renderMarkdown(bubble, segText);
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  const typeChars = async (str, min, max) => {
    for (const ch of str) {
      if (interrupted) return;
      segText += ch;
      render();
      await sleep(min + Math.random() * (max - min));
    }
  };

  const backspaceChars = async (n) => {
    for (let i = 0; i < n; i++) {
      if (interrupted) return;
      segText = segText.slice(0, -1);
      render();
      await sleep(30 + Math.random() * 25);
    }
  };

  async function run() {
    setStatus('typing…');

    while (true) {
      if (interrupted) break;
      if (pos >= target.length) {
        if (streamDone) break;
        await sleep(40); // wait for more chunks
        continue;
      }

      // if the stream is far ahead, quietly speed up to catch up
      const backlog = target.length - pos;
      const speedup = backlog > 400 ? 0.15 : backlog > 150 ? 0.45 : 1;

      // paragraph break → finish this bubble, start a new one (like
      // people replying in 2-3 messages). Never split inside a code block.
      if (
        target.startsWith('\n\n', pos) &&
        segText.length > 80 &&
        backlog > 60 &&
        ((segText.match(/```/g) || []).length % 2 === 0)
      ) {
        bubble.classList.remove('streaming');
        render();
        typedAll += segText + '\n\n';
        pos += 2;
        while (target[pos] === '\n') pos++;
        await sleep(reduceMotion ? 60 : 450 + Math.random() * 450);
        if (interrupted) break;
        bubble = newBubble();
        segText = '';
        continue;
      }

      const next = target[pos];

      if (!reduceMotion && speedup === 1) {
        // one chai break per long reply, at a sentence boundary
        if (!chaiBreakDone && target.length > 380 && pos > 180 && '.!?'.includes(target[pos - 1])) {
          chaiBreakDone = true;
          setStatus(tutor.breakStatus);
          await sleep(1400 + Math.random() * 700);
          setStatus('typing…');
        }

        // word-level correction: type the whole word misspelled,
        // notice it, delete it, retype correctly
        if (
          Math.random() < 0.018 &&
          /[a-z]/i.test(next) &&
          (pos === 0 || /\s/.test(target[pos - 1]))
        ) {
          const m = target.slice(pos).match(/^[A-Za-z]{5,12}/);
          if (m) {
            const word = m[0];
            const wrong = misspell(word);
            await typeChars(wrong, 28, 65);
            setStatus('editing…');
            await sleep(380 + Math.random() * 320); // ...hmm, galat likha
            await backspaceChars(wrong.length);
            setStatus('typing…');
            await sleep(130);
            await typeChars(word, 35, 75);
            pos += word.length;
            continue;
          }
        }

        // rare single-char typo: neighbouring key, backspace, continue
        if (Math.random() < 0.015 && /[a-z]/i.test(next)) {
          const pool = NEAR_KEYS[next.toLowerCase()] || 'aeiou';
          let wrong = pool[Math.floor(Math.random() * pool.length)];
          if (next === next.toUpperCase()) wrong = wrong.toUpperCase();
          wrong += target.slice(pos + 1, pos + 1 + Math.floor(Math.random() * 2));

          await typeChars(wrong, 35, 80);
          setStatus('editing…');
          await sleep(280 + Math.random() * 320);
          await backspaceChars(wrong.length);
          setStatus('typing…');
          await sleep(140);
          continue;
        }

        // occasional mid-sentence hesitation
        if (Math.random() < 0.012) {
          setStatus('soch rahe hai…');
          await sleep(400 + Math.random() * 550);
          setStatus('typing…');
        }
      }

      segText += next;
      pos++;
      render();

      if (reduceMotion) {
        await sleep(3);
        continue;
      }

      // burst typing: a quick run of chars, then a micro-pause
      let delay = (8 + Math.random() * 15) * speedup;
      if (++burst >= 4 + Math.floor(Math.random() * 5)) {
        burst = 0;
        delay += 70 + Math.random() * 130;
      }
      if ('.!?'.includes(next)) delay += 200 + Math.random() * 260;
      else if (next === ',' || next === '\n') delay += 90 + Math.random() * 140;
      await sleep(delay);
    }

    bubble.classList.remove('streaming');
    render();
    // on interruption the next reply's typer owns the status line
    if (!interrupted) setStatus(tutor.status);
    resolveFinished();
  }

  run();

  return {
    push(text) { target += text; },
    end() { streamDone = true; },
    interrupt() { interrupted = true; streamDone = true; },
    getTyped() { return typedAll + segText; },
    finished,
  };
}

function renderWelcome() {
  const el = document.createElement('div');
  el.className = 'welcome';

  const catchEl = document.createElement('span');
  catchEl.className = 'welcome-catch';
  catchEl.textContent = tutor.catchphrase;

  const sub = document.createElement('p');
  sub.className = 'welcome-sub';
  sub.textContent = tutor.welcome;

  const chips = document.createElement('div');
  chips.className = 'chips';
  tutor.chips.forEach((text) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = text;
    chip.addEventListener('click', () => sendMessage(text));
    chips.appendChild(chip);
  });

  el.append(catchEl, sub, chips);
  chatBox.appendChild(el);
}

function addMessage(text, sender) {
  const row = document.createElement('div');
  row.className = `msg-row ${sender}`;

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (sender === 'bot') {
    // AI replies arrive as markdown — render it, but sanitized
    bubble.classList.add('md');
    renderMarkdown(bubble, text);
  } else {
    bubble.textContent = text;
  }

  const meta = document.createElement('span');
  meta.className = 'meta';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sender === 'bot') {
    meta.textContent = `${selectedTutor} · ${time}`;
  } else {
    meta.textContent = `${time} `;
    const ticks = document.createElement('span');
    ticks.className = 'ticks';
    ticks.textContent = '✓';
    meta.appendChild(ticks);
  }

  wrap.append(bubble, meta);

  if (sender === 'bot') {
    const img = document.createElement('img');
    img.className = 'msg-avatar';
    img.src = tutor.image;
    img.alt = '';
    row.appendChild(img);
  }

  row.appendChild(wrap);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
}

function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'msg-row bot typing-row';
  row.setAttribute('aria-label', `${selectedTutor} is typing`);

  const img = document.createElement('img');
  img.className = 'msg-avatar';
  img.src = tutor.image;
  img.alt = '';

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML =
    `<span class="typing-label"></span><span class="typing"><i></i><i></i><i></i></span>`;
  bubble.querySelector('.typing-label').textContent = tutor.typing;

  wrap.appendChild(bubble);
  row.append(img, wrap);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
}
