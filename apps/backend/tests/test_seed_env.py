import importlib.util
import os
import sys
import types
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch


def load_seed_module():
    sys.modules.setdefault("bcrypt", types.SimpleNamespace())
    sys.modules.setdefault("psycopg", types.SimpleNamespace())
    sys.modules.setdefault("app.config", types.SimpleNamespace(get_settings=lambda: None))

    seed_path = Path(__file__).resolve().parents[1] / "scripts" / "seed.py"
    spec = importlib.util.spec_from_file_location("seed", seed_path)
    seed = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(seed)
    return seed


class SeedEnvTest(unittest.TestCase):
    def test_load_local_env_includes_web_env_files_with_backend_priority(self):
        seed = load_seed_module()

        with TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir) / "repo"
            backend_root = repo_root / "apps" / "backend"
            web_root = repo_root / "apps" / "web"
            backend_root.mkdir(parents=True)
            web_root.mkdir(parents=True)

            (backend_root / ".env").write_text("ADMIN_EMAIL=backend@example.com\n", encoding="utf-8")
            (repo_root / ".env").write_text("ADMIN_EMAIL=root@example.com\nBACKEND_DATABASE_URL=root-db\n", encoding="utf-8")
            (web_root / ".env.local").write_text(
                "ADMIN_EMAIL=web-local@example.com\nADMIN_PASSWORD=web-local-password\n",
                encoding="utf-8",
            )
            (web_root / ".env").write_text("ADMIN_PASSWORD=web-password\n", encoding="utf-8")

            with patch.object(seed, "BACKEND_ROOT", backend_root), patch.dict(os.environ, {}, clear=True):
                seed.load_local_env()

                self.assertEqual(os.environ["ADMIN_EMAIL"], "backend@example.com")
                self.assertEqual(os.environ["BACKEND_DATABASE_URL"], "root-db")
                self.assertEqual(os.environ["ADMIN_PASSWORD"], "web-local-password")


if __name__ == "__main__":
    unittest.main()
