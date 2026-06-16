# -*- coding: utf-8 -*-
# firestore.rules に daily ランキング用コレクションの許可を追記する。
# 使い方: リポジトリのルートに置いて  python add_ranking_rule.py
import io, sys

PATH = "firestore.rules"

# トップレベル submissions ブロックの末尾（ASCIIのみ＝日本語コメントの文字化けに依存しない）
ANCHOR = (
    "      allow delete: if request.auth != null\n"
    "                    && resource.data.get('studentId', '') == request.auth.uid;\n"
    "    }"
)

BLOCK = (
    ANCHOR
    + "\n\n"
    + "    // daily leaderboard: signed-in users can read; each user writes only their own row\n"
    + "    match /leaderboard_daily/{dateKey}/scores/{userId} {\n"
    + "      allow read: if request.auth != null;\n"
    + "      allow create, update: if request.auth != null && request.auth.uid == userId;\n"
    + "      allow delete: if false;\n"
    + "    }"
)

try:
    with io.open(PATH, encoding="utf-8") as f:
        s = f.read()
except FileNotFoundError:
    print("firestore.rules が見つかりません。リポジトリのルートで実行してください。")
    sys.exit(1)

if "leaderboard_daily" in s:
    print("既に leaderboard ルールが入っています。変更なし。")
elif ANCHOR in s:
    s = s.replace(ANCHOR, BLOCK, 1)
    with io.open(PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)
    print("leaderboard ルールを追記しました。")
else:
    print("submissions ブロック末尾が見つかりませんでした。コンソールで手動追加してください。")
