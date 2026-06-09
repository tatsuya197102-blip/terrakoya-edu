#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
TERRAKOYA-edu firestore.rules 修正マージスクリプト

機能:
  1. 最新の firestore.rules.bak-* から元の内容を読み込む
  2. 既存の match /users/{userId} ブロックを「ロール制御付き」版に置換
     (既存 submissions サブコレクションは維持)
  3. match /invite_codes/{code} ブロックを直後に追加
  4. firestore.rules を UTF-8 で上書き

実行:
  cd C:\\Users\\User\\Desktop\\terrakoya-edu
  python fix-firestore-rules.py
"""
import io
import sys
import re
import glob


def main():
    # === 1. 最新バックアップから復元 ===
    backups = sorted(glob.glob('firestore.rules.bak-*'))
    if not backups:
        print('ERROR: バックアップ (firestore.rules.bak-*) が見つかりません')
        print('       これは正しいプロジェクトディレクトリですか?')
        sys.exit(1)

    latest_backup = backups[-1]
    print(f'[1/4] 復元元: {latest_backup}')

    with io.open(latest_backup, 'r', encoding='utf-8') as f:
        original = f.read()

    # 既にマージ済みなら何もしない
    if 'match /invite_codes' in original:
        print('SKIP: バックアップにも既に invite_codes が含まれています')
        sys.exit(0)

    # === 2. 既存の /users/{userId} ブロック検出 ===
    users_re = re.compile(r'match\s+/users/\{userId\}\s*\{')
    m = users_re.search(original)
    if not m:
        print('ERROR: match /users/{userId} ブロックが見つかりません')
        sys.exit(1)

    start_pos = m.start()
    brace_open_pos = m.end() - 1

    # ブロックの先頭インデント取得
    line_start = original.rfind('\n', 0, start_pos) + 1
    indent = original[line_start:start_pos]
    print(f'[2/4] /users ブロック発見 (インデント: {len(indent)} 文字)')

    # === 3. brace counting で閉じ } を特定 (submissions サブ込み) ===
    depth = 0
    close_pos = -1
    for j in range(brace_open_pos, len(original)):
        c = original[j]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                close_pos = j
                break

    if close_pos < 0:
        print('ERROR: /users ブロックの閉じ } が見つかりません')
        sys.exit(1)

    print(f'[3/4] ブロック範囲: pos {start_pos} - {close_pos}')

    # === 4. 新ブロック構築 ===
    new_users_block = (
        'match /users/{userId} {\n'
        f'{indent}  // 本人のみ自分のドキュメント読み取り可\n'
        f'{indent}  allow read: if request.auth != null && request.auth.uid == userId;\n'
        '\n'
        f'{indent}  // 作成時: role は null (自己昇格防止)\n'
        f'{indent}  allow create: if request.auth != null\n'
        f'{indent}                && request.auth.uid == userId\n'
        f'{indent}                && request.resource.data.role == null;\n'
        '\n'
        f'{indent}  // 更新時: role 変更なし OR student/other 自己昇格 OR 招待コード経由\n'
        f'{indent}  allow update: if request.auth != null\n'
        f'{indent}                && request.auth.uid == userId\n'
        f'{indent}                && (\n'
        f'{indent}                  request.resource.data.role == resource.data.role\n'
        f"{indent}                  || (request.resource.data.role in ['student', 'other']\n"
        f'{indent}                      && resource.data.role == null)\n'
        f"{indent}                  || (request.resource.data.role in ['teacher', 'parent']\n"
        f'{indent}                      && request.resource.data.inviteCodeUsed is string)\n'
        f'{indent}                );\n'
        '\n'
        f'{indent}  // 削除禁止 (admin SDK のみ)\n'
        f'{indent}  allow delete: if false;\n'
        '\n'
        f'{indent}  // 提出物サブコレクション (既存維持)\n'
        f'{indent}  match /submissions/{{submissionId}} {{\n'
        f'{indent}    allow read, write: if request.auth != null && request.auth.uid == userId;\n'
        f'{indent}  }}\n'
        f'{indent}}}'
    )

    invite_block = (
        '\n\n'
        f'{indent}// === 招待コード (teacher/parent 認証用) ===\n'
        f'{indent}match /invite_codes/{{code}} {{\n'
        f'{indent}  allow read: if request.auth != null;\n'
        f'{indent}  allow update: if request.auth != null\n'
        f'{indent}                && resource.data.usedBy == null\n'
        f'{indent}                && request.resource.data.usedBy == request.auth.uid\n'
        f'{indent}                && request.resource.data.role == resource.data.role\n'
        f'{indent}                && resource.data.expiresAt > request.time.toMillis();\n'
        f'{indent}  allow create, delete: if false;\n'
        f'{indent}}}'
    )

    # === 5. 既存ブロックを置換 + invite_codes 追加 ===
    merged = (
        original[:start_pos]
        + new_users_block
        + invite_block
        + original[close_pos + 1:]
    )

    # === 6. 書き込み ===
    with io.open('firestore.rules', 'w', encoding='utf-8') as f:
        f.write(merged)

    print('[4/4] OK: firestore.rules を正しくマージしました')
    print()
    print('--- 確認方法 ---')
    print('python -c "import io; print(io.open(\'firestore.rules\', encoding=\'utf-8\').read())"')


if __name__ == '__main__':
    main()
