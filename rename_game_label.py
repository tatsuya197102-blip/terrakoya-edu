# -*- coding: utf-8 -*-
# nav.game のラベルを「ゲーム / Game / لعبة / Trò chơi」に変更する。
# 使い方: リポジトリのルートに置いて  python rename_game_label.py
import io, os

CHANGES = {
    "ja": ("まちがい", "ゲーム"),
    "en": ("Spot", "Game"),
    "ar": ("اكتشف", "لعبة"),
    "vi": ("Tìm khác", "Trò chơi"),
}
for lang, (old, new) in CHANGES.items():
    p = os.path.join("public", "locales", lang, "translation.json")
    if not os.path.exists(p):
        print(f"skip (not found): {p}"); continue
    s = io.open(p, encoding="utf-8").read()
    a, b = f'"game": "{old}"', f'"game": "{new}"'
    if a in s:
        io.open(p, "w", encoding="utf-8", newline="\n").write(s.replace(a, b, 1))
        print(f"{lang}: {old} -> {new}")
    elif b in s:
        print(f"{lang}: already {new}")
    else:
        print(f"{lang}: '{old}' not found")
print("done.")
