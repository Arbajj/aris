import os
import json
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aris.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row          # rows ko dict ki tarah padh sako
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS screenings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            jd_text TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            screening_id INTEGER NOT NULL,
            filename TEXT,
            score INTEGER,
            verdict TEXT,
            summary TEXT,
            skills TEXT,
            missing_skills TEXT,
            interview_questions TEXT,
            FOREIGN KEY (screening_id) REFERENCES screenings(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()