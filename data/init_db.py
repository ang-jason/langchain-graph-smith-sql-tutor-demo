"""Initialize SQLite database from seed.sql"""
import sqlite3
import os

DB_PATH = os.getenv("DATABASE_PATH", "./data/sample.db")
SEED_PATH = os.path.join(os.path.dirname(__file__), "seed.sql")


def init_db(db_path: str = DB_PATH) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        with open(SEED_PATH, "r") as f:
            sql = f.read()
        conn.executescript(sql)
        conn.commit()
        print(f"Database initialized at {db_path}")
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
