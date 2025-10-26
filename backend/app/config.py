"""
Configuration settings loaded from environment variables.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration."""

    # Claude API
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
    CLAUDE_MAX_TOKENS = int(os.getenv("CLAUDE_MAX_TOKENS", "4096"))

    # Application
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    @classmethod
    def validate(cls):
        """Validate that required config is present."""
        if not cls.ANTHROPIC_API_KEY or cls.ANTHROPIC_API_KEY == "your_api_key_here":
            raise ValueError(
                "ANTHROPIC_API_KEY not configured! "
                "Please add your API key to the .env file. "
                "Get one at: https://console.anthropic.com/"
            )


# Validate config on import
config = Config()
