#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Firestore Rules の missing field 対応版に修正

問題:
  resource.data.role == null が、role フィールド未定義の既存ユーザーで
  正しく null 判定されず、Missing or insufficient permissions エラー。

修正:
  resource.data.get('role', null) を使って明示的に欠損→nullへ変換。

実行:
  cd C:\\Users\\User\\Desktop\\terrakoya-edu
  python fix-rules-missing-field.py
  firebase deploy --only firestore:rules
"""
import io
import os
import sys
import re
import shutil
from datetime import datetime

PATH = 'firestore.rules'

if not os.path.exists(PATH):
    print(f'ERROR: {PATH} が見つかりません')
    sys.exit(1)

with io.open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# バックアップ
ts = datetime.now().strftime('%Y%m%d-%H%M%S')
shutil.copy2(PATH, f'{PATH}.bak-{ts}')
print(f'バックアップ: {PATH}.bak-{ts}')

# === /users/{userId} の allow update ブロックを置換 ===
# 既存のロジックブロックを正規表現でまるごと取り替える

old_update_pattern = re.compile(
    r"allow update:\s*if\s+request\.auth\s*!=\s*null"
    r".*?"
    r"&&\s*request\.resource\.data\.inviteCodeUsed\s+is\s+string\s*\)\s*\)\s*;",
    re.DOTALL
)

new_update_rule = (
    "allow update: if request.auth != null\n"
    "                    && request.auth.uid == userId\n"
    "                    && (\n"
    "                      // 1) role 変更なし (lastLoginAt 等の通常更新)\n"
    "                      request.resource.data.get('role', null) == resource.data.get('role', null)\n"
    "                      // 2) student/other への自己昇格 (現状 role 未設定)\n"
    "                      || (request.resource.data.get('role', null) in ['student', 'other']\n"
    "                          && resource.data.get('role', null) == null)\n"
    "                      // 3) teacher/parent への招待コード経由\n"
    "                      || (request.resource.data.get('role', null) in ['teacher', 'parent']\n"
    "                          && request.resource.data.get('inviteCodeUsed', '') is string\n"
    "                          && request.resource.data.get('inviteCodeUsed', '') != '')\n"
    "                    );"
)

new_src, n = old_update_pattern.subn(new_update_rule, src, count=1)

if n == 0:
    print('ERROR: allow update ブロックが見つかりません')
    print('既存のルールを確認してください: Get-Content -Encoding UTF8 firestore.rules')
    sys.exit(1)

# === /users/{userId} の allow create も同様に修正 (role: null OR missing) ===
old_create_pattern = re.compile(
    r"allow create:\s*if\s+request\.auth\s*!=\s*null"
    r"\s*&&\s*request\.auth\.uid\s*==\s*userId"
    r"\s*&&\s*request\.resource\.data\.role\s*==\s*null\s*;",
    re.DOTALL
)

new_create_rule = (
    "allow create: if request.auth != null\n"
    "                    && request.auth.uid == userId\n"
    "                    && request.resource.data.get('role', null) == null;"
)

new_src, n2 = old_create_pattern.subn(new_create_rule, new_src, count=1)
if n2 == 0:
    print('WARN: allow create パターンが見つかりませんでした (既に修正済みかも)')

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_src)

print('OK: firestore.rules を更新しました')
print()
print('--- 結果確認 ---')
print("python -c \"import io; print(io.open('firestore.rules', encoding='utf-8').read())\"")
print()
print('--- 次のステップ ---')
print('firebase deploy --only firestore:rules')
