#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
TERRAKOYA-edu ロールシステム統合パッチ (Step 4)

このスクリプトの動作:
  1. src/lib/auth.ts の ensureUserDoc に role: null を注入
  2. src/lib/firestore.ts の saveUserProfile に role: null を注入
  3. src/app/client-layout.tsx を AuthGate で wrap
  4. 不要ファイル削除 (src/hooks/useUserRole.ts, src/lib/firebase/userRole.ts)

実行:
  cd C:\\Users\\User\\Desktop\\terrakoya-edu
  python patch-step4.py
"""
import io
import os
import sys
import re
import shutil
import glob
from datetime import datetime


def backup(path: str) -> str:
    ts = datetime.now().strftime('%Y%m%d-%H%M%S')
    bak = f'{path}.bak-{ts}'
    shutil.copy2(path, bak)
    return bak


def read_utf8(path: str) -> str:
    with io.open(path, 'r', encoding='utf-8') as f:
        return f.read()


def write_utf8(path: str, content: str) -> None:
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(content)


# === Patch 1: src/lib/auth.ts ===
def patch_auth_ts():
    path = 'src/lib/auth.ts'
    if not os.path.exists(path):
        print(f'[1/4] SKIP: {path} が見つかりません')
        return
    src = read_utf8(path)
    if 'role: null' in src:
        print(f'[1/4] SKIP: {path} は既にパッチ済み')
        return

    # ensureUserDoc 内の setDoc 引数オブジェクトに role: null を追加
    # `await setDoc(ref, {\n      uid: user.uid,` の直後に `\n      role: null,` を挿入
    pattern = re.compile(
        r'(await\s+setDoc\s*\(\s*ref\s*,\s*\{\s*\n\s*uid:\s*user\.uid,)'
    )
    m = pattern.search(src)
    if not m:
        print(f'[1/4] ERROR: {path} の setDoc パターンが見つかりません')
        return

    backup(path)
    indent = '      '  # 既存コードのインデントに合わせる
    new_src = src[:m.end()] + f'\n{indent}role: null,' + src[m.end():]
    write_utf8(path, new_src)
    print(f'[1/4] OK: {path} に role: null を注入')


# === Patch 2: src/lib/firestore.ts ===
def patch_firestore_ts():
    path = 'src/lib/firestore.ts'
    if not os.path.exists(path):
        print(f'[2/4] SKIP: {path} が見つかりません')
        return
    src = read_utf8(path)
    if 'role: null' in src:
        print(f'[2/4] SKIP: {path} は既にパッチ済み')
        return

    # saveUserProfile 内の最初の setDoc (新規作成側) に role: null を追加
    # `await setDoc(userRef, {\n      uid: user.uid,` の直後
    pattern = re.compile(
        r'(if\s*\(\s*!userSnap\.exists\(\)\s*\)\s*\{\s*\n\s*await\s+setDoc\s*\(\s*userRef\s*,\s*\{\s*\n\s*uid:\s*user\.uid,)'
    )
    m = pattern.search(src)
    if not m:
        print(f'[2/4] ERROR: {path} の saveUserProfile パターンが見つかりません')
        return

    backup(path)
    indent = '      '
    new_src = src[:m.end()] + f'\n{indent}role: null,' + src[m.end():]
    write_utf8(path, new_src)
    print(f'[2/4] OK: {path} に role: null を注入')


# === Patch 3: src/app/client-layout.tsx ===
def patch_client_layout():
    path = 'src/app/client-layout.tsx'
    if not os.path.exists(path):
        print(f'[3/4] SKIP: {path} が見つかりません')
        return
    src = read_utf8(path)
    if 'AuthGate' in src:
        print(f'[3/4] SKIP: {path} は既に AuthGate 適用済み')
        return

    backup(path)

    # import を追加 (AuthProvider import の後)
    new_src = re.sub(
        r"(import\s+\{\s*AuthProvider\s*\}\s+from\s+'@/context/AuthContext';)",
        r"\1\nimport AuthGate from '@/components/AuthGate';",
        src,
        count=1
    )

    # <AuthProvider>{children}</AuthProvider> を AuthGate で包む
    new_src = re.sub(
        r'(<AuthProvider>)\s*\n\s*\{children\}\s*\n\s*(</AuthProvider>)',
        r'\1\n        <AuthGate>{children}</AuthGate>\n      \2',
        new_src,
        count=1
    )

    if new_src == src:
        print(f'[3/4] ERROR: {path} の wrap パターンが見つかりません — 手動修正が必要')
        return

    write_utf8(path, new_src)
    print(f'[3/4] OK: {path} を AuthGate で wrap')


# === Cleanup: 旧ファイル削除 ===
def cleanup_old_files():
    targets = [
        'src/hooks/useUserRole.ts',
        'src/lib/firebase/userRole.ts',
    ]
    removed = 0
    for p in targets:
        if os.path.exists(p):
            os.remove(p)
            print(f'[4/4] DELETE: {p}')
            removed += 1
    # 空ディレクトリも削除
    for d in ['src/hooks', 'src/lib/firebase']:
        if os.path.isdir(d) and not os.listdir(d):
            os.rmdir(d)
            print(f'[4/4] DELETE empty dir: {d}')
    if removed == 0:
        print('[4/4] SKIP: 削除対象ファイル無し (既にクリーンアップ済み)')


def main():
    # プロジェクトルート判定
    if not os.path.exists('package.json') or not os.path.exists('src'):
        print('ERROR: terrakoya-edu のプロジェクトルートで実行してください')
        sys.exit(1)

    patch_auth_ts()
    patch_firestore_ts()
    patch_client_layout()
    cleanup_old_files()

    print()
    print('=== Step 4 パッチ完了 ===')
    print('次のステップ:')
    print('  1. npm run build  ← TypeScript エラーが無いか確認')
    print('  2. npm run dev    ← ローカル動作確認')


if __name__ == '__main__':
    main()
