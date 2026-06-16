# -*- coding: utf-8 -*-
# 「アニメ」ナビ項目を「まちがい（/game-spot）」に差し替える。
#  1) public/locales/{ja,en,ar,vi}/translation.json の nav に game ラベルを追加
#  2) src/components/Navbar.tsx（2か所）と src/app/dashboard/page.tsx（1か所）の
#     /auto-animate 項目を /game-spot + nav.game に差し替え（アイコンは🔍）
# 使い方: リポジトリのルートに置いて  python add_game_nav.py
import io, os, re

# 1) 4言語の nav に game ラベルを追加（ナビは狭いので短いラベル）
LABELS = {"ja": "まちがい", "en": "Spot", "ar": "اكتشف", "vi": "Tìm khác"}
for lang, label in LABELS.items():
    p = os.path.join("public", "locales", lang, "translation.json")
    if not os.path.exists(p):
        print(f"skip (not found): {p}"); continue
    lines = io.open(p, encoding="utf-8").read().split("\n")
    if any('"game"' in ln for ln in lines):
        print(f"already has game: {lang}"); continue
    out, done = [], False
    for ln in lines:
        out.append(ln)
        if (not done) and ('"anime"' in ln) and (":" in ln):
            ws = ln[:len(ln) - len(ln.lstrip())]
            out.append(f'{ws}"game": "{label}",')
            done = True
    if done:
        io.open(p, "w", encoding="utf-8", newline="\n").write("\n".join(out))
        print(f"added game to {lang}: {label}")
    else:
        print(f"anime line not found in {lang}")

# 2) ナビの /auto-animate 項目を /game-spot + nav.game に差し替え
pat = re.compile(r"href: '/auto-animate',\s*label: t\('nav\.anime'\),(\s*)icon: '[^']*'")
repl = r"href: '/game-spot', label: t('nav.game'),\1icon: '🔍'"
for p in [os.path.join("src", "components", "Navbar.tsx"),
          os.path.join("src", "app", "dashboard", "page.tsx")]:
    if not os.path.exists(p):
        print(f"skip (not found): {p}"); continue
    s = io.open(p, encoding="utf-8").read()
    n = len(pat.findall(s))
    if n == 0:
        print(f"already swapped or not found: {p}"); continue
    s = pat.sub(repl, s)
    io.open(p, "w", encoding="utf-8", newline="\n").write(s)
    print(f"swapped {n} item(s) in {p}")

print("done.")
