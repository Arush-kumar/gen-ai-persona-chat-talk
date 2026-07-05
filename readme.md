# 🤖 AI Persona Chat

> Chat with AI versions of **Hitesh Choudhary** and **Piyush Garg** in their unique teaching style.

This project is an LLM-powered chat application where you can switch between two AI personas and ask coding questions just like you would in a real conversation.

The goal of this project is to make the responses feel natural by recreating each person's communication style, teaching approach, and personality using publicly available content.

---

## 🌐 Live Demo

🚀 **Live Website**

https://gen-ai-persona-chat-talk.vercel.app/

🎥 **Demo Video (Twitter/X)**

## 🎥 Demo

[![Watch Demo on X](https://img.shields.io/badge/Watch-Demo_on_X-000000?style=for-the-badge&logo=x)](https://x.com/arush_v26/status/2073688908173545499?s=20)

---

# 📸 Preview

## 💻 Desktop

<p align="center">
  <img
    src="https://ik.imagekit.io/t0p8ny4dd/GenAI%20Project/Desktop%20view1.png"
    alt="Desktop View 1"
    width="900"
  />
</p>
---
<p align="center">
  <img
    src="https://ik.imagekit.io/t0p8ny4dd/GenAI%20Project/Desktop%20view2.png"
    alt="Desktop View 2"
    width="900"
  />
</p>
---
<p align="center">
  <img
    src="https://ik.imagekit.io/t0p8ny4dd/GenAI%20Project/Desktop%20view3.png"
    alt="Desktop View 3"
    width="900"
  />
</p>
---
<p align="center">
  <img
    src="https://ik.imagekit.io/t0p8ny4dd/GenAI%20Project/Desktop%20view4.png"
    alt="Desktop View 4"
    width="900"
  />
</p>

---

## 📱 Mobile

<p align="center">
  <img src="https://ik.imagekit.io/t0p8ny4dd/GenAI%20Project/mobile%20view1.png" alt="Mobile View" width="250"/>
</p>

---

# ✨ Features

- 🤖 AI-powered chat experience
- 👨‍🏫 Two AI Personas
  - Hitesh Choudhary
  - Piyush Garg
- 🔄 Switch between personas anytime
- 💬 Context-aware conversations
- 🧠 Maintains chat history
- ⚡ Fast and responsive interface
- 📱 Fully Responsive Design
- 🎨 Clean and modern UI

---

# 🛠️ Tech Stack

### Frontend

- Html
- CSS
- JavaScript

### AI

- Google Gemini / OpenAI
- Prompt Engineering
- Model used: Gemini 2.5 flash

### Deployment

- Vercel

---

# 🧠 How I Built the Personas

Instead of hardcoding answers, I studied publicly available content from both creators.

The persona was built using:

- YouTube videos
- Blogs
- Personal websites
- Social media posts
- Public interviews

The collected information helped define:

- speaking style
- vocabulary
- teaching method
- personality
- response tone

---

# 🎯 Prompt Engineering

Each chat request includes a dedicated system prompt that tells the model how the selected persona should respond.

The prompt focuses on:

- communication style
- teaching approach
- vocabulary
- personality
- response format

This helps keep the conversation consistent.

---

# 💬 Context Management

The chatbot remembers previous messages during the conversation.

This allows the AI to:

- answer follow-up questions
- maintain conversation flow
- avoid repeating information
- stay consistent with the selected persona

---

# 💡 Sample Conversation

## Hitesh Choudhary

**User**

> What is React?

**AI**

> React is just JavaScript with superpowers. Think of your UI as small reusable components. Once you understand components and state, React becomes much easier.

---

## Piyush Garg

**User**

> What is React?

**AI**

> Let's understand React from the basics. React helps us build user interfaces by breaking them into reusable components. Once you understand the component mindset, everything becomes much simpler.

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/Arush-kumar/gen-ai-persona-chat-talk
```

Go to the project folder.

```bash
cd repository-name
```

Install dependencies.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Now open:

```
http://localhost:3000
```

---

# 📁 Project Structure

```
GenAIPersonaChatTalk/
├─ .agents/
│  └─ skills/
│     └─ frontend-design/
│        ├─ LICENSE.txt
│        └─ SKILL.md
├─ .vscode/
│  └─ settings.json
├─ api/
│  ├─ constant/
│  │  └─ system_prompt.js
│  └─ chat.js
├─ public/
│  ├─ css/
│  │  ├─ chat.css
│  │  └─ style.css
│  ├─ images/
│  │  ├─ hitesh-sir.jfif
│  │  └─ piyush-sir.png
│  ├─ js/
│  │  └─ script.js
│  ├─ chat.html
│  └─ index.html
├─ .env
├─ .env.example
├─ .gitignore
├─ dev-server.js
├─ package-lock.json
├─ package.json
├─ readme.md
└─ skills-lock.json

```

---

# 🎯 Evaluation Goals

This project focuses on four important areas.

### ✅ Persona Accuracy

- Similar communication style
- Similar teaching approach
- Consistent personality

### ✅ Conversation Quality

- Context-aware replies
- Helpful answers
- Natural conversations

### ✅ Technical Implementation

- LLM integration
- Clean architecture
- Maintainable code
- Prompt engineering

### ✅ User Experience

- Responsive UI
- Easy persona switching
- Clean chat interface
- Good response formatting

---

# 🔮 Future Improvements

- Voice conversations
- Conversation history
- Streaming responses
- More AI personas
- Dark & Light themes
- RAG support
- Vector Database integration

---

# 🙏 Credits

This project is inspired by the amazing teaching style of

- Hitesh Choudhary
- Piyush Garg

The personas are created using publicly available content and are intended only for learning and demonstration purposes.

---

## ⭐ If you enjoyed this project...

Please consider giving it a **Star ⭐**.

It helps a lot and motivates me to build more projects like this.

[![GitHub Stars](https://img.shields.io/github/stars/Arush-kumar/gen-ai-persona-chat-talk?style=social)](https://github.com/Arush-kumar/gen-ai-persona-chat-talk)
