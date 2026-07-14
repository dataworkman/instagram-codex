#!/usr/bin/env python3
"""Rebuild instagram.db from SQLAlchemy metadata while preserving existing rows."""

import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base  # noqa: E402
from app import models  # noqa: F401,E402

TABLES = ("users", "posts", "comments", "likes", "follows", "messages")


def columns(connection: sqlite3.Connection, table: str) -> list[str]:
    return [row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')]


def main() -> None:
    database = BACKEND_DIR / "instagram.db"
    temporary = BACKEND_DIR / ".instagram.rebuild.db"
    backups = BACKEND_DIR / "backups"
    backups.mkdir(exist_ok=True)
    backup = backups / f"instagram-{datetime.now():%Y%m%d-%H%M%S}.db"

    if temporary.exists():
        temporary.unlink()

    source = sqlite3.connect(database)
    source.execute("PRAGMA busy_timeout = 5000")
    with sqlite3.connect(backup) as backup_connection:
        source.backup(backup_connection)

    temporary_engine = create_engine(f"sqlite:///{temporary}")
    Base.metadata.create_all(temporary_engine)
    temporary_engine.dispose()

    destination = sqlite3.connect(temporary)
    try:
        destination.execute("PRAGMA foreign_keys = OFF")
        destination.execute("BEGIN")
        for table in TABLES:
            source_columns = set(columns(source, table))
            target_columns = columns(destination, table)
            shared = [name for name in target_columns if name in source_columns]
            if not shared:
                continue
            quoted = ", ".join(f'"{name}"' for name in shared)
            rows = source.execute(f'SELECT {quoted} FROM "{table}"').fetchall()
            placeholders = ", ".join("?" for _ in shared)
            destination.executemany(
                f'INSERT INTO "{table}" ({quoted}) VALUES ({placeholders})', rows
            )
        destination.commit()
        destination.execute("PRAGMA foreign_keys = ON")
        foreign_key_errors = destination.execute("PRAGMA foreign_key_check").fetchall()
        integrity = destination.execute("PRAGMA integrity_check").fetchone()[0]
        if foreign_key_errors or integrity != "ok":
            raise RuntimeError(
                f"database validation failed: foreign_keys={foreign_key_errors}, integrity={integrity}"
            )
    except Exception:
        destination.rollback()
        raise
    finally:
        destination.close()
        source.close()

    os.replace(temporary, database)
    with sqlite3.connect(database) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = NORMAL")
        connection.execute("PRAGMA busy_timeout = 5000")
        connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    print(f"Database rebuilt: {database}")
    print(f"Backup created: {backup}")


if __name__ == "__main__":
    main()
