import importlib.machinery
import importlib.util
import json
from pathlib import Path
import struct
import unittest

loader = importlib.machinery.SourceFileLoader('voice_patch', str(Path(__file__).resolve().parents[1] / 'bin/patch-voice-typing'))
spec = importlib.util.spec_from_loader(loader.name, loader)
m = importlib.util.module_from_spec(spec)
loader.exec_module(m)


def archive(main=b'Ny(`dictation_utils.node`)', renderer=b'return e===`darwin`?`Fn`:`ControlRight`'):
    tree = {'files': {'dist-electron': {'files': {'main': {'files': {'index.js': {'offset': '0', 'size': len(main)}}}}},
                      'dist-app': {'files': {'assets': {'files': {'test.js': {'offset': str(len(main)), 'size': len(renderer)}}}}}}}
    raw = json.dumps(tree).encode()
    header_size = 8 + len(raw)
    return struct.pack('<4I', 4, header_size, header_size - 4, len(raw)) + raw + main + renderer


class VoicePatchTests(unittest.TestCase):
    def test_preserves_offsets_and_is_idempotent(self):
        raw = archive()
        patched, changes = m.patch_archive(raw)
        self.assertEqual(len(patched), len(raw))
        self.assertIn(b'Ny(`dictation_utils.cjs`) ', patched)
        self.assertEqual(len(changes), 2)
        again, _ = m.patch_archive(patched)
        self.assertEqual(again, patched)

    def test_fails_closed_when_upstream_changes(self):
        with self.assertRaises(ValueError):
            m.patch_archive(archive(main=b'unknown native loader'))
        with self.assertRaises(ValueError):
            m.patch_archive(archive(renderer=b'unknown shortcut mapping'))


if __name__ == '__main__':
    unittest.main()
