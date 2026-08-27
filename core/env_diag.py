"""
core/env_diag.py
System runtime and dependency diagnostic utility for VAYU-CPI.
Safely inspects environment variables, Python/OS specifications, package versions,
and database connection targets without exposing secrets (passwords, tokens, keys).
"""

import os
import sys
import time
import platform
import re
from typing import Dict, Any

def sanitize_connection_url(url: str) -> str:
    """Masks credentials in database URIs (e.g. postgresql://user:pass@host:5432/db -> postgresql://user:***@host:5432/db)."""
    if not url:
        return "not_configured"
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", url)

def get_package_version(pkg_name: str) -> str:
    """Safely retrieves installed version of a package."""
    try:
        mod = __import__(pkg_name)
        if hasattr(mod, "__version__"):
            return str(mod.__version__)
        import importlib.metadata
        return importlib.metadata.version(pkg_name)
    except Exception:
        return "not_installed"

def get_system_diagnostics() -> Dict[str, Any]:
    """Returns runtime diagnostic information safely formatted for startup logs and debug endpoints."""
    db_url_env = os.getenv("DATABASE_URL", "")
    
    tz_name = time.tzname
    is_dst = time.daylight and time.localtime().tm_isdst > 0
    tz_offset_sec = -time.altzone if is_dst else -time.timezone
    tz_offset_hours = tz_offset_sec / 3600.0

    return {
        "python_version": sys.version.split()[0],
        "python_compiler": platform.python_compiler(),
        "os_platform": platform.platform(),
        "system_timezone": tz_name[1] if is_dst else tz_name[0],
        "utc_offset_hours": tz_offset_hours,
        "packages": {
            "fast_flights": get_package_version("fast_flights"),
            "primp": get_package_version("primp"),
            "requests": get_package_version("requests"),
            "httpx": get_package_version("httpx"),
            "pydantic": get_package_version("pydantic"),
            "fastapi": get_package_version("fastapi"),
            "sqlalchemy": get_package_version("sqlalchemy"),
            "apscheduler": get_package_version("apscheduler"),
        },
        "environment": {
            "vayu_debug_ingestion": os.getenv("VAYU_DEBUG_INGESTION", "false").lower() in ("true", "1", "yes"),
            "database_url_configured": bool(db_url_env),
            "sanitized_db_target": sanitize_connection_url(db_url_env or "sqlite:///./vayu_test.db"),
            "port": os.getenv("PORT", "8000"),
        }
    }

def print_startup_diagnostics(logger=None) -> None:
    """Logs runtime diagnostics at application startup."""
    diag = get_system_diagnostics()
    msg = (
        f"\n=======================================================\n"
        f"  VAYU-CPI RUNTIME DIAGNOSTIC SUMMARY\n"
        f"=======================================================\n"
        f"  Python Version       : {diag['python_version']} ({diag['os_platform']})\n"
        f"  System Timezone      : {diag['system_timezone']} (UTC {diag['utc_offset_hours']:+0.1f}h)\n"
        f"  fast-flights Version : {diag['packages']['fast_flights']}\n"
        f"  primp Version        : {diag['packages']['primp']}\n"
        f"  requests Version     : {diag['packages']['requests']}\n"
        f"  SQLAlchemy Version   : {diag['packages']['sqlalchemy']}\n"
        f"  Database Target      : {diag['environment']['sanitized_db_target']}\n"
        f"  Debug Ingestion Flag : {diag['environment']['vayu_debug_ingestion']}\n"
        f"=======================================================\n"
    )
    if logger:
        logger.info(msg)
    else:
        print(msg)
