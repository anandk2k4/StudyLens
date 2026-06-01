"""
Structured logging setup. Import `logger` everywhere instead of print().
"""
import logging
import sys


def setup_logging(level: str = "INFO") -> logging.Logger:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    root = logging.getLogger("studylens")
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers = [handler]
    return root


logger = setup_logging()