from pathlib import Path
path = Path('src/lib/team.ts')
text = path.read_text()
needle = "\t\t['0x', (r) => r.min === 0]\n\t\t];\n\n"
if needle not in text:
    raise SystemExit('needle not found')
insert = needle + "const MODAL_VISIBLE_CLASS = 'team-builder-modal--visible';\nconst BODY_LOCK_CLASS = 'team-builder-scroll-lock';\n\n"
path.write_text(text.replace(needle, insert, 1))
