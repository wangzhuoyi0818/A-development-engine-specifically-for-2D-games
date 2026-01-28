/**
 * 辅助函数
 */

import { MiniProgramExporter } from './exporter';
import type {
  MiniProgramProject,
} from '../../01_Core_ProjectStructure/implementation/types';
import type { ExporterOptions, ExportResult } from './types';

/**
 * 创建导出器实例
 * @param options 导出选项
 * @returns 导出器实例
 */
export function createExporter(options?: Partial<ExporterOptions>): MiniProgramExporter {
  return new MiniProgramExporter(options);
}

/**
 * 快速导出项目
 * @param project 项目对象
 * @param outputPath 输出路径
 * @param options 导出选项
 * @returns 导出结果
 */
export async function quickExport(
  project: MiniProgramProject,
  outputPath: string,
  options?: Partial<ExporterOptions>
): Promise<ExportResult> {
  const exporter = createExporter(options);
  return await exporter.export(project, outputPath);
}
