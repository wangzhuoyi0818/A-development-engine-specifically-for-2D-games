# PowerShell 编码修复脚本
# 用于解决终端中文乱码问题

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# 设置代码页为 UTF-8 (65001)
chcp 65001 | Out-Null

# 设置 PowerShell 输出编码
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[SUCCESS] Encoding set to UTF-8" -ForegroundColor Green
Write-Host "Code Page: $([Console]::OutputEncoding.CodePage)" -ForegroundColor Cyan
Write-Host "Encoding: $([Console]::OutputEncoding.EncodingName)" -ForegroundColor Cyan

# Test UTF-8 display
Write-Host "`nUTF-8 test: Hello World!" -ForegroundColor Yellow
