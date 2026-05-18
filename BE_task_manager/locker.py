import os
import redis
import threading
import time
import logging

logger = logging.getLogger(__name__)

redis_client = redis.Redis(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=int(os.environ.get('REDIS_PORT', 6379)),
    decode_responses=True
)


class LeaderLock:
    """Redis-based lock that stays held as long as the process is alive."""

    def __init__(self, lock_key="scheduler:leader", ttl=60):
        self.lock_key = lock_key
        self.ttl = ttl
        self.refresh_thread = None
        self.running = False

    def acquire(self):
        """Try to acquire the lock. Returns True if acquired, False otherwise."""
        if redis_client.set(self.lock_key, os.getpid(), nx=True, ex=self.ttl):
            logger.info("Leadership lock acquired. Starting refresh thread.")
            self.running = True
            self.refresh_thread = threading.Thread(
                target=self._refresh_loop, daemon=True)
            self.refresh_thread.start()
            return True
        else:
            logger.debug("Leadership lock is held by another worker.")
            return False

    def _refresh_loop(self):
        """Refresh the lock every (ttl/2) seconds."""
        while self.running:
            time.sleep(self.ttl / 2)
            if self.running:
                redis_client.expire(self.lock_key, self.ttl)
                logger.debug("Lock refreshed.")

    def release(self):
        """Release the lock (called on shutdown)."""
        self.running = False
        if self.refresh_thread:
            self.refresh_thread.join(timeout=2)
        redis_client.delete(self.lock_key)
        logger.info("Leadership lock released.")


leader_lock = LeaderLock()
