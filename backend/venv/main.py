import os
import uuid
import fitz
import json
from groq import Groq
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv  # <-- New Import

# .env file se variables load karne ke liye
load_dotenv() 

# Environment variable se key uthao
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

MODEL_NAME = "llama-3.3-70b-versatile"

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def analyze_with_groq(resume_text, jd_text):
    if not jd_text.strip():
        return {"score": 0, "summary": "No JD provided",
                "skills": [], "missing_skills": [],
                "verdict": "N/A", "interview_questions": []}
    
    if not resume_text.strip():
        return {"score": 0, "summary": "Empty PDF",
                "skills": [], "missing_skills": [],
                "verdict": "N/A", "interview_questions": []}

    prompt = f"""
    Compare the Resume against the Job Description (JD). Return ONLY a valid JSON object.
    JD: {jd_text}
    Resume: {resume_text[:4000]}

    Format:
    {{
        "score": (0-100 integer),
        "skills": ["matched skill1", "matched skill2"],
        "missing_skills": ["missing1", "missing2"],
        "summary": "2-line professional summary of match",
        "verdict": "Selected or Waitlist or Rejected",
        "interview_questions": ["Q1", "Q2", "Q3"]
    }}
    """

    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)
        result.setdefault("missing_skills", [])
        result.setdefault("interview_questions", [])
        result.setdefault("verdict", "N/A")
        result.setdefault("score", 0)
        return result
    except Exception as e:
        print(f"Groq Error: {e}")
        return {"score": 0, "summary": f"Error: {str(e)}",
                "skills": [], "missing_skills": [],
                "verdict": "Error", "interview_questions": []}

@app.get("/")
def home():
    return {"message": "ARIS Backend Running"}

@app.post("/upload-resumes")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    jd: str = Form(...)
):
    results = []

    for file in files:
        if not file.filename.endswith(".pdf"):
            results.append({
                "filename": file.filename,
                "score": 0, "verdict": "Error",
                "summary": "Only PDF allowed",
                "skills": [], "missing_skills": [],
                "interview_questions": []
            })
            continue

        unique_name = f"{str(uuid.uuid4())[:8]}_{file.filename}"
        path = os.path.join(UPLOAD_DIR, unique_name)

        with open(path, "wb") as f:
            f.write(await file.read())

        text = ""
        try:
            with fitz.open(path) as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            results.append({
                "filename": file.filename,
                "score": 0, "verdict": "Error",
                "summary": f"PDF read error: {str(e)}",
                "skills": [], "missing_skills": [],
                "interview_questions": []
            })
            continue

        analysis = analyze_with_groq(text, jd)
        analysis["filename"] = file.filename
        results.append(analysis)

    return {
        "total": len(results),
        "results": results
    }