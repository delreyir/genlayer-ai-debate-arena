"""Shared helpers and Windows compatibility shims for direct mode tests."""

import os
import sys

# ---------------------------------------------------------------------------
# Windows compatibility shim.
#
# gltest's direct-mode loader writes the VM message to a temp file, dups it onto
# stdin (fd 0), then immediately calls os.unlink(path) inside a finally block.
# On POSIX you can unlink an open file; on Windows you cannot, so the loader
# raises PermissionError [WinError 32] for every test. We make os.unlink tolerant
# of that specific case so the file is simply left for the OS to clean up.
# ---------------------------------------------------------------------------
if sys.platform == "win32":
    _orig_unlink = os.unlink

    def _safe_unlink(path, *args, **kwargs):
        try:
            return _orig_unlink(path, *args, **kwargs)
        except PermissionError:
            # File is still open (dup'd to stdin); leave it for OS-level cleanup.
            return None

    os.unlink = _safe_unlink


def to_hex(addr_bytes):
    """Convert an address to checksummed hex matching contract view output."""
    if hasattr(addr_bytes, "as_hex"):
        return addr_bytes.as_hex
    from genlayer.py.types import Address

    return Address(addr_bytes).as_hex
