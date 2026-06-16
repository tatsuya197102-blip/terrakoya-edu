# -*- coding: utf-8 -*-
# firestore.rules の users ブロックに games サブコレクションの許可を追記する。
# 使い方: リポジトリのルートに置いて  python add_games_rule.py
import io, sys

PATH = "firestore.rules"

ANCHOR = (
    "      match /submissions/{submissionId} {\n"
    "        allow read, write: if request.auth != null && request.auth.uid == userId;\n"
    "      }"
)

GAMES = (
    ANCHOR
    + "\n\n"
    + "      // game progress (spot-the-difference, etc.): owner only\n"
    + "      match /games/{gameId} {\n"
    + "        allow read, write: if request.auth != null && request.auth.uid == userId;\n"
    + "      }"
)

try:
    with io.open(PATH, encoding="utf-8") as f:
        s = f.read()
except FileNotFoundError:
    print("firestore.rules が見つかりません。リポジトリのルートで実行してください。")
    sys.exit(1)

if "match /games/{gameId}" in s:
    print("既に games ルールが入っています。変更なし。")
elif ANCHOR in s:
    s = s.replace(ANCHOR, GAMES, 1)
    with io.open(PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)
    print("games ルールを追記しました。")
else:
    print("submissions ブロックが見つかりませんでした。コンソールで手動追加してください。")
