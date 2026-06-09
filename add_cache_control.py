import os
import json

files_to_update = {
    'src/app/api/analyze-artwork/route.ts': {
        'old': "system: systemPrompt,",
        'new': '''system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],'''
    },
    'src/app/api/chat/route.ts': {
        'old': "system: systemPrompt,",
        'new': '''system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],'''
    },
    'src/app/api/generate-4manga/route.ts': {
        'old': "messages: [{ role: 'user', content: prompt }],",
        'new': '''system: [
        {
          type: 'text',
          text: 'あなたはTERRAKOYA・漫画・アニメ創作プロジェクト向けのAI漫画制作アシスタントです。',
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [{ role: 'user', content: prompt }],'''
    },
    'src/app/api/grade-artwork/route.ts': {
        'old': "system: '",
        'new': "system: [{ type: 'text', text: '"
    }
}

for file_path, replacements in files_to_update.items():
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if replacements['old'] in content:
            new_content = content.replace(replacements['old'], replacements['new'])
            
            # grade-artwork の場合は特別処理
            if 'grade-artwork' in file_path:
                new_content = new_content.replace("',", "', cache_control: { type: 'ephemeral' } }],", 1)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"OK: {file_path}")
        else:
            print(f"NOT FOUND: {file_path}")
    else:
        print(f"ERROR: {file_path}")

print("Done!")
