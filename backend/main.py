import os
import json
import time
import fitz
from groq import Groq, RateLimitError
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

# --- .env se API key load ---
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("❌ ERROR: GROQ_API_KEY nahi mili! Check karo ki .env file 'backend' folder mein hai.")
else:
    print("✅ SUCCESS: API Key load ho gayi")

client = Groq(api_key=api_key)
MODEL_NAME = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

MAX_FILE_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_FILES = 5                     # free plan ki token limit ke liye

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def error_result(filename, message):
    return {
        "filename": filename, "score": 0, "verdict": "Error",
        "summary": message, "skills": [], "missing_skills": [],
        "interview_questions": [],
    }


def get_verdict(score):
    # Verdict LLM se nahi, score se nikalta hai (stable rahega)
    if score >= 70:
        return "Selected"
    if score >= 50:
        return "Waitlist"
    return "Rejected"


def analyze_with_groq(resume_text, jd_text):
    if not jd_text.strip():
        return error_result("", "No JD provided")
    if not resume_text.strip():
        return error_result("", "Empty or scanned PDF (no readable text)")

    prompt = f"""
    Compare the Resume against the Job Description (JD). Return ONLY a valid JSON object.
    JD: {jd_text[:4000]}
    Resume: {resume_text[:4000]}

    Format:
    {{
        "score": (0-100 integer),
        "skills": ["matched skill1", "matched skill2"],
        "missing_skills": ["missing1", "missing2"],
        "summary": "2-line professional summary of match",
        "interview_questions": ["Q1", "Q2", "Q3"]
    }}
    """

    try:
        completion = None
        for attempt in range(3):
            try:
                completion = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=MODEL_NAME,
                    temperature=0,
                    response_format={"type": "json_object"},
                )
                break
            except RateLimitError:
                # Free plan ki limit lagi: thoda ruko, phir dobara try
                print(f"Rate limit hit, waiting 20s (attempt {attempt + 1}/3)")
                time.sleep(20)

        if completion is None:
            return error_result("", "Rate limit reached. Please wait a minute and try again.")

        result = json.loads(completion.choices[0].message.content)

        try:
            score = int(result.get("score", 0))
        except (ValueError, TypeError):
            score = 0
        result["score"] = max(0, min(100, score))
        result["verdict"] = get_verdict(result["score"])

        result.setdefault("skills", [])
        result.setdefault("missing_skills", [])
        result.setdefault("interview_questions", [])
        result.setdefault("summary", "")
        return result
    except Exception as e:
        print(f"Groq Error: {e}")   # asli error sirf terminal mein
        return error_result("", "Analysis failed. Please try again.")


@app.get("/")
def home():
    return {"message": "ARIS Backend Running"}


@app.post("/upload-resumes")
async def upload_resumes(files: List[UploadFile] = File(...), jd: str = Form(...)):
    results = []

    for file in files[:MAX_FILES]:
        name = file.filename or "unknown"

        if not name.lower().endswith(".pdf"):
            results.append(error_result(name, "Only PDF allowed"))
            continue

        data = await file.read()
        if len(data) > MAX_FILE_SIZE:
            results.append(error_result(name, "File too large (max 5 MB)"))
            continue

        # Disk pe save nahi, seedha memory se padho (privacy)
        text = ""
        try:
            with fitz.open(stream=data, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            print(f"PDF error: {e}")
            results.append(error_result(name, "Could not read this PDF"))
            continue

        analysis = analyze_with_groq(text, jd)
        analysis["filename"] = name
        results.append(analysis)

    results.sort(key=lambda r: r.get("score", 0), reverse=True)
    return {"total": len(results), "results": results}