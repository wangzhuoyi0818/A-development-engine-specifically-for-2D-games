# 运行测试脚本（带编码修复）
# 使用方法: .\run-test.ps1

# 设置编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "Running Anthropic API test...`n" -ForegroundColor Cyan

# 运行测试脚本
node test-anthropic-api.js

# 如果出错，显示错误信息
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAILED] Test failed with exit code: $LASTEXITCODE" -ForegroundColor Red
} else {
    Write-Host "`n[SUCCESS] Test completed" -ForegroundColor Green
}
