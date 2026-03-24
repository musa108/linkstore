import os
import re

replacements = {
    r'(?<=\s|["''`:])bg-white(?=\s|["''`/])': 'bg-card',
    r'(?<=\s|["''`:])bg-gray-50(?=\s|["''`/])': 'bg-secondary',
    r'(?<=\s|["''`:])bg-gray-100(?=\s|["''`/])': 'bg-secondary',
    r'(?<=\s|["''`:])text-gray-900(?=\s|["''`/])': 'text-foreground',
    r'(?<=\s|["''`:])text-gray-800(?=\s|["''`/])': 'text-foreground/90',
    r'(?<=\s|["''`:])text-gray-700(?=\s|["''`/])': 'text-foreground/80',
    r'(?<=\s|["''`:])text-gray-600(?=\s|["''`/])': 'text-foreground/60',
    r'(?<=\s|["''`:])text-gray-500(?=\s|["''`/])': 'text-foreground/50',
    r'(?<=\s|["''`:])text-gray-400(?=\s|["''`/])': 'text-foreground/40',
    r'(?<=\s|["''`:])border-gray-100(?=\s|["''`/])': 'border-border/50',
    r'(?<=\s|["''`:])border-gray-200(?=\s|["''`/])': 'border-border',
    r'(?<=\s|["''`:])border-gray-300(?=\s|["''`/])': 'border-border/80',
}

base_dir = r"c:\Users\sysadmin\umar personal project\link\src"

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for pattern, replacement in replacements.items():
                content = re.sub(pattern, replacement, content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {file_path}")
print("Done!")
