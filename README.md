# 🛡️ HealthTwin Guardian AI

### *Your Proactive Digital Health Shield*

HealthTwin Guardian AI is a state-of-the-art, personalized AI digital health twin designed to continuously monitor, advise, and protect patients. It addresses two of the most critical challenges in modern healthcare: **accidental drug/allergy conflicts** and **complex medical language barriers**.

---

## 🚀 Key Features

### 1. 💬 Profile-Aware AI Assistant
* **Contextual Healthcare**: The assistant is fully aware of the user's active health profile (including current medications, existing conditions, and allergies).
* **Proactive Warning Engine**: If a user asks a question about a symptom or medication that could conflict with their profile, the assistant flags it immediately.
* **Flexible API Routing**: Secure backend router supporting **Google Gemini**, **Groq Llama 3.3**, and **OpenRouter** APIs.

### 2. 📸 Live AI Medicine Image Scanner (Gemini Vision)
* **Real-time OCR & Analysis**: Upload or capture a photo of any medicine bottle or packaging.
* **Ingredient & Dosage Extraction**: Extracts active ingredients, drug class, standard dosage, and side effects.
* **Automatic Conflict Detection**: Automatically cross-references scanned ingredients against your allergies and medications, rendering a red/amber **"CRITICAL PROFILE CONFLICT DETECTED"** warning banner in the UI.

### 3. 🌐 Multilingual Translation & Speech Input/Output
* **9 Languages Supported**: Full support for English, Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, Spanish, and Arabic.
* **Voice Input (Speech-to-Text)**: High-speed transcription using **Groq Whisper API (`whisper-large-v3-turbo`)** directly through browser recording.
* **Premium Voice Output (Text-to-Speech)**: Converts AI responses and regional translations into ultra-realistic human voices using **OpenAI's TTS API (`tts-1` with the `shimmer` voice)**.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), TailwindCSS, Framer Motion (premium glassmorphic micro-animations).
* **Authentication**: Clerk Authentication (Secure sign-in/up and profile setup).
* **AI Core**:
  * **Image Processing & Vision**: Google Gemini 2.5 Flash API
  * **Text Synthesis & Translation**: Google Gemini 2.5 Flash / Groq Llama 3.3
  * **Voice Transcription (STT)**: Groq Whisper API
  * **Premium Vocal Synthesis (TTS)**: OpenAI TTS API

---

## ⚙️ Setup & Installation

### 1. Clone & Navigate
```bash
git clone https://github.com/teja739/HealthTwin-Guardian-AI-teja.git
cd HealthTwin-Guardian-AI-teja
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file at the root of the project:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# OpenAI API Key (For TTS Audio)
OPENAI_API_KEY=your_openai_api_key

# Groq API Key (For Whisper Speech-to-Text)
GROQ_API_KEY=your_groq_api_key

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 4. Start the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔮 Future Roadmap
* **Smart Wearable Syncing**: Sync active vitals (Heart Rate, HRV, Glucose) directly into the Digital Twin.
* **Clinic Portal**: Enable healthcare providers to push prescriptions directly to patients' HealthTwin accounts.
* **Offline Emergency SOS**: Local on-device models to diagnose symptoms and locate nearest hospitals when network access is unavailable.
