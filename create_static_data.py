import os
import sys
import json

# Firebase初期化(管理者SDKが必要だが、今回は既存のJSONがあると仮定)
# 代替案: Firestore から取得できない場合は、既存の構造でダミーデータを作成

courses_data = {
    "courses": [
        {
            "id": "course-manga-basics",
            "title": "漫画の基本",
            "description": "コマ割りから背景まで、漫画を描くための基本を学びます",
            "level": 1,
            "lessons": 10
        },
        {
            "id": "course-animation",
            "title": "アニメーション基礎",
            "description": "動きをつける原理と実践",
            "level": 2,
            "lessons": 8
        }
    ]
}

badges_data = {
    "badges": [
        {"id": "first-draw", "name": "初めて描いた", "icon": "🎨"},
        {"id": "10-submissions", "name": "10作品投稿", "icon": "🌟"},
        {"id": "gallery-featured", "name": "ギャラリー注目", "icon": "⭐"}
    ]
}

levels_data = {
    "levels": [
        {"level": 1, "xpRequired": 0, "title": "駆け出しクリエイター"},
        {"level": 2, "xpRequired": 100, "title": "成長中"},
        {"level": 3, "xpRequired": 300, "title": "実力者"},
        {"level": 4, "xpRequired": 600, "title": "ベテラン"},
        {"level": 5, "xpRequired": 1000, "title": "マスター"}
    ]
}

# src/data ディレクトリを作成
os.makedirs("src/data", exist_ok=True)

# JSONファイルを保存
with open("src/data/courses.json", "w", encoding="utf-8") as f:
    json.dump(courses_data, f, ensure_ascii=False, indent=2)

with open("src/data/badges.json", "w", encoding="utf-8") as f:
    json.dump(badges_data, f, ensure_ascii=False, indent=2)

with open("src/data/levels.json", "w", encoding="utf-8") as f:
    json.dump(levels_data, f, ensure_ascii=False, indent=2)

print("OK: Created src/data/*.json files")
