#!/bin/bash
# 自动化脚本：从 GDevelop 复制参考代码到各模块

# 配置
GDEVELOP_SOURCE="C:/Users/wzy16/Desktop/GDevelop-master"
TARGET_DIR="C:/Users/wzy16/Desktop/new project"

echo "🚀 开始复制 GDevelop 参考代码..."
echo "源目录: $GDEVELOP_SOURCE"
echo "目标目录: $TARGET_DIR"
echo ""

# 检查 GDevelop 源码目录是否存在
if [ ! -d "$GDEVELOP_SOURCE" ]; then
    echo "❌ 错误: GDevelop 源码目录不存在: $GDEVELOP_SOURCE"
    exit 1
fi

# 函数：复制文件到目标目录
copy_reference() {
    local module=$1
    local source_file=$2
    local target_subdir=$3

    local target_dir="$TARGET_DIR/$module/reference/$target_subdir"
    mkdir -p "$target_dir"

    if [ -f "$GDEVELOP_SOURCE/$source_file" ]; then
        cp "$GDEVELOP_SOURCE/$source_file" "$target_dir/"
        echo "  ✓ 复制: $source_file"
    elif [ -d "$GDEVELOP_SOURCE/$source_file" ]; then
        cp -r "$GDEVELOP_SOURCE/$source_file" "$target_dir/"
        echo "  ✓ 复制目录: $source_file"
    else
        echo "  ⚠ 未找到: $source_file"
    fi
}

# ==========================================
# 模块 01: 项目结构管理
# ==========================================
echo "📦 01_Core_ProjectStructure"
copy_reference "01_Core_ProjectStructure" "Core/GDCore/Project/Project.h" "core"
copy_reference "01_Core_ProjectStructure" "Core/GDCore/Project/Project.cpp" "core"
copy_reference "01_Core_ProjectStructure" "Core/GDCore/Project/Layout.h" "core"
copy_reference "01_Core_ProjectStructure" "Core/GDCore/Project/Layout.cpp" "core"
copy_reference "01_Core_ProjectStructure" "Core/GDCore/Project/Object.h" "core"
copy_reference "01_Core_ProjectStructure" "Core/GDCore/Project/Object.cpp" "core"
copy_reference "01_Core_ProjectStructure" "GDevelop.js/Bindings/Bindings.idl" "bindings"
copy_reference "01_Core_ProjectStructure" "newIDE/app/src/ProjectManager/index.js" "ide"
echo ""

# ==========================================
# 模块 02: 事件系统
# ==========================================
echo "🎯 02_Core_EventSystem"
copy_reference "02_Core_EventSystem" "Core/GDCore/Events/Event.h" "core"
copy_reference "02_Core_EventSystem" "Core/GDCore/Events/Event.cpp" "core"
copy_reference "02_Core_EventSystem" "Core/GDCore/Events/Instruction.h" "core"
copy_reference "02_Core_EventSystem" "Core/GDCore/Events/Instruction.cpp" "core"
copy_reference "02_Core_EventSystem" "Core/GDCore/Events/Builtin/StandardEvent.h" "core"
copy_reference "02_Core_EventSystem" "Core/GDCore/Events/Builtin/StandardEvent.cpp" "core"
copy_reference "02_Core_EventSystem" "newIDE/app/src/EventsSheet/index.js" "ide"
copy_reference "02_Core_EventSystem" "newIDE/app/src/EventsSheet/EventsTree.js" "ide"
copy_reference "02_Core_EventSystem" "newIDE/app/src/EventsSheet/InstructionsList" "ide"
echo ""

# ==========================================
# 模块 03: 变量系统
# ==========================================
echo "📊 03_Core_VariableSystem"
copy_reference "03_Core_VariableSystem" "Core/GDCore/Project/Variable.h" "core"
copy_reference "03_Core_VariableSystem" "Core/GDCore/Project/Variable.cpp" "core"
copy_reference "03_Core_VariableSystem" "Core/GDCore/Project/VariablesContainer.h" "core"
copy_reference "03_Core_VariableSystem" "Core/GDCore/Project/VariablesContainer.cpp" "core"
echo ""

# ==========================================
# 模块 04: 资源管理
# ==========================================
echo "🖼️ 04_Core_ResourceManagement"
copy_reference "04_Core_ResourceManagement" "Core/GDCore/Project/ResourcesManager.h" "core"
copy_reference "04_Core_ResourceManagement" "Core/GDCore/Project/ResourcesManager.cpp" "core"
copy_reference "04_Core_ResourceManagement" "newIDE/app/src/ResourcesList/index.js" "ide"
echo ""

# ==========================================
# 模块 05: 页面编辑器
# ==========================================
echo "✏️ 05_Editor_PageEditor"
copy_reference "05_Editor_PageEditor" "newIDE/app/src/SceneEditor/index.js" "main"
copy_reference "05_Editor_PageEditor" "newIDE/app/src/InstancesEditor/index.js" "instances"
copy_reference "05_Editor_PageEditor" "newIDE/app/src/InstancesEditor/InstancesRenderer.js" "instances"
copy_reference "05_Editor_PageEditor" "newIDE/app/src/InstancesEditor/InstancesSelection.js" "instances"
copy_reference "05_Editor_PageEditor" "newIDE/app/src/ObjectsList/index.js" "objects"
echo ""

# ==========================================
# 模块 06: 组件编辑器
# ==========================================
echo "🧩 06_Editor_ComponentEditor"
copy_reference "06_Editor_ComponentEditor" "newIDE/app/src/ObjectEditor/index.js" "main"
copy_reference "06_Editor_ComponentEditor" "newIDE/app/src/ObjectEditor/Editors" "editors"
echo ""

# ==========================================
# 模块 07: 事件编辑器
# ==========================================
echo "🎬 07_Editor_EventEditor"
copy_reference "07_Editor_EventEditor" "newIDE/app/src/EventsSheet/index.js" "main"
copy_reference "07_Editor_EventEditor" "newIDE/app/src/EventsSheet/EventsTree.js" "main"
copy_reference "07_Editor_EventEditor" "newIDE/app/src/EventsSheet/InstructionEditor" "instruction"
copy_reference "07_Editor_EventEditor" "newIDE/app/src/EventsSheet/ParameterFields" "parameters"
echo ""

# ==========================================
# 模块 08: 属性编辑器
# ==========================================
echo "⚙️ 08_Editor_PropertyEditor"
copy_reference "08_Editor_PropertyEditor" "newIDE/app/src/PropertiesEditor/index.js" "main"
copy_reference "08_Editor_PropertyEditor" "newIDE/app/src/PropertiesEditor/PropertiesEditor.js" "main"
echo ""

# ==========================================
# 模块 09: WXML 生成器
# ==========================================
echo "📝 09_CodeGenerator_WXMLGenerator"
copy_reference "09_CodeGenerator_WXMLGenerator" "GDJS/GDJS/Events/CodeGeneration/CodeGenerator.h" "codegen"
copy_reference "09_CodeGenerator_WXMLGenerator" "GDJS/GDJS/Events/CodeGeneration/CodeGenerator.cpp" "codegen"
copy_reference "09_CodeGenerator_WXMLGenerator" "GDJS/GDJS/Events/CodeGeneration/EventsCodeGenerator.h" "codegen"
copy_reference "09_CodeGenerator_WXMLGenerator" "GDJS/GDJS/Events/CodeGeneration/EventsCodeGenerator.cpp" "codegen"
echo ""

# ==========================================
# 模块 10: WXSS 生成器
# ==========================================
echo "🎨 10_CodeGenerator_WXSSGenerator"
copy_reference "10_CodeGenerator_WXSSGenerator" "GDJS/GDJS/Events/CodeGeneration/CodeGenerator.h" "codegen"
echo ""

# ==========================================
# 模块 11: JavaScript 生成器
# ==========================================
echo "⚡ 11_CodeGenerator_JSGenerator"
copy_reference "11_CodeGenerator_JSGenerator" "GDJS/GDJS/Events/CodeGeneration/EventsCodeGenerator.h" "codegen"
copy_reference "11_CodeGenerator_JSGenerator" "GDJS/GDJS/Events/CodeGeneration/EventsCodeGenerator.cpp" "codegen"
copy_reference "11_CodeGenerator_JSGenerator" "GDJS/GDJS/Events/CodeGeneration/BehaviorCodeGenerator.h" "codegen"
copy_reference "11_CodeGenerator_JSGenerator" "GDJS/GDJS/Events/CodeGeneration/BehaviorCodeGenerator.cpp" "codegen"
echo ""

# ==========================================
# 模块 12: 组件库
# ==========================================
echo "📦 12_Runtime_ComponentLibrary"
copy_reference "12_Runtime_ComponentLibrary" "Extensions/ExampleJsExtension/JsExtension.js" "example"
copy_reference "12_Runtime_ComponentLibrary" "Extensions/ExampleJsExtension/dummyruntimeobject.ts" "example"
copy_reference "12_Runtime_ComponentLibrary" "Extensions/TextObject" "text"
copy_reference "12_Runtime_ComponentLibrary" "Extensions/PrimitiveDrawing" "drawing"
echo ""

# ==========================================
# 模块 13: API 包装器
# ==========================================
echo "🔌 13_Runtime_APIWrapper"
copy_reference "13_Runtime_APIWrapper" "Extensions/ExampleJsExtension/examplejsextensiontools.ts" "example"
copy_reference "13_Runtime_APIWrapper" "Extensions/Firebase" "firebase"
copy_reference "13_Runtime_APIWrapper" "GDJS/Runtime/events-tools" "runtime"
echo ""

# ==========================================
# 模块 14: 导出器
# ==========================================
echo "📤 14_Export_MiniProgramExporter"
copy_reference "14_Export_MiniProgramExporter" "newIDE/app/src/ExportAndShare/GenericExporters" "exporters"
copy_reference "14_Export_MiniProgramExporter" "GDJS/GDJS/IDE/ExporterHelper.h" "helper"
copy_reference "14_Export_MiniProgramExporter" "GDJS/GDJS/IDE/ExporterHelper.cpp" "helper"
echo ""

# ==========================================
# 模块 15: 预览模拟器
# ==========================================
echo "👁️ 15_Preview_Simulator"
copy_reference "15_Preview_Simulator" "newIDE/app/src/Debugger/index.js" "debugger"
copy_reference "15_Preview_Simulator" "GDJS/Runtime/debugger-client" "runtime"
echo ""

# ==========================================
# 复制通用文档
# ==========================================
echo "📚 复制通用参考文档"
cp "$GDEVELOP_SOURCE/Core/GDevelop-Architecture-Overview.md" "$TARGET_DIR/reference-docs/" 2>/dev/null
cp "$GDEVELOP_SOURCE/README.md" "$TARGET_DIR/reference-docs/GDevelop-README.md" 2>/dev/null
cp "$GDEVELOP_SOURCE/LICENSE.md" "$TARGET_DIR/reference-docs/GDevelop-LICENSE.md" 2>/dev/null
echo ""

echo "✅ 复制完成！"
echo ""
echo "📁 参考代码已复制到各模块的 reference/ 目录"
echo "📖 请查看各模块的 GDEVELOP_SOURCE.md 了解文件说明"
echo ""
echo "⚠️ 注意事项:"
echo "  - 这些代码仅供参考学习使用"
echo "  - GDevelop 使用 MIT 许可证"
echo "  - 请在你的实现中保留适当的许可证声明"
echo "  - 不要直接使用这些代码，需要改写适配微信小程序"
echo ""
echo "🚀 现在你可以开始参考这些代码进行开发了！"
