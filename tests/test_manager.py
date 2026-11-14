import importlib.machinery
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

loader = importlib.machinery.SourceFileLoader('manager', str(Path(__file__).resolve().parents[1] / 'bin/omarchy-granola'))
spec = importlib.util.spec_from_loader(loader.name, loader)
m = importlib.util.module_from_spec(spec)
loader.exec_module(m)


class ManagerTests(unittest.TestCase):
    def test_manifest(self):
        good = {'schema': 1, 'version': '7.726.2', 'sha256': 'a' * 64}
        self.assertEqual(m.manifest(json.dumps(good)), good)
        for key, value in [('schema', 2), ('version', '../escape'), ('sha256', 'no')]:
            with self.assertRaises(ValueError):
                m.manifest(json.dumps(dict(good, **{key: value})))

    def test_failed_build_preserves_current(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            old = root / 'releases/1.0.0'
            old.mkdir(parents=True)
            (root / 'current').symlink_to(old)
            cache = root / 'cache'
            cache.mkdir()
            dmg = cache / 'Granola-2.0.0-mac-universal.dmg'
            dmg.write_bytes(b'test')
            release = {'version': '2.0.0', 'sha256': m.hashlib.sha256(b'test').hexdigest()}
            with patch.object(m, 'ROOT', root), patch.object(m, 'CACHE', cache), patch.object(m, 'running', return_value=False):
                with patch.object(m.subprocess, 'run', side_effect=RuntimeError('build failed')):
                    with self.assertRaises(RuntimeError):
                        m.install(release)
                self.assertEqual(m.current(), old)
                self.assertFalse((root / 'previous').exists())
                def fake_build(*args, **kwargs):
                    if 'env' in kwargs:
                        Path(kwargs['env']['GRANOLA_LINUX_HOME']).mkdir()
                with patch.object(m.subprocess, 'run', side_effect=fake_build):
                    m.install(release)
                self.assertEqual(m.current().name, '2.0.0')
                self.assertEqual((root / 'previous').resolve(), old)

    def test_active_app_defers_update(self):
        with patch.object(m, 'current', return_value=None), patch.object(m, 'running', return_value=True), patch.object(m.urllib.request, 'urlopen') as fetch:
            m.install({'version': '2.0.0'})
            fetch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
