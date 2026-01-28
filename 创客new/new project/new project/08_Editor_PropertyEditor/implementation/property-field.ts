/**
 * 微信小程序可视化开发平台 - 属性字段工厂和字段类
 *
 * 定义各种属性字段类型和工厂方法
 */

import {
  PropertyType,
  PropertyValue,
  PropertyDefinition,
  PropertyTypeOptions,
  ValidationError,
  PropertyFieldRegistration,
} from './types';
import { PropertyFormatter } from './property-formatter';

/**
 * 属性字段基类
 * 定义属性字段的通用接口
 */
export abstract class PropertyField {
  protected definition: PropertyDefinition;
  protected value: PropertyValue;
  protected error?: ValidationError;

  constructor(definition: PropertyDefinition, value: PropertyValue) {
    this.definition = definition;
    this.value = value;
  }

  /**
   * 解析原始值为属性值
   */
  abstract parse(rawValue: string): PropertyValue;

  /**
   * 格式化属性值为显示字符串
   */
  abstract format(value: PropertyValue): string;

  /**
   * 验证属性值
   */
  abstract validate(value: PropertyValue): ValidationError | null;

  /**
   * 获取字段类型
   */
  getType(): PropertyType {
    return this.definition.type;
  }

  /**
   * 获取当前值
   */
  getValue(): PropertyValue {
    return this.value;
  }

  /**
   * 设置新值
   */
  setValue(value: PropertyValue): void {
    this.value = value;
  }

  /**
   * 获取错误信息
   */
  getError(): ValidationError | undefined {
    return this.error;
  }

  /**
   * 设置错误信息
   */
  setError(error: ValidationError | undefined): void {
    this.error = error;
  }

  /**
   * 获取定义
   */
  getDefinition(): PropertyDefinition {
    return this.definition;
  }
}

/**
 * 文本属性字段
 */
export class TextPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return rawValue;
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Text);
  }

  validate(value: PropertyValue): ValidationError | null {
    if (this.definition.validation) {
      return PropertyFormatter.validate(value, this.definition.validation);
    }
    return null;
  }
}

/**
 * 数字属性字段
 */
export class NumberPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    const options = (this.definition.options as any)?.numberOptions;
    return PropertyFormatter.parseNumber(rawValue, options);
  }

  format(value: PropertyValue): string {
    const options = (this.definition.options as any)?.numberOptions;
    return PropertyFormatter.format(value, PropertyType.Number, { numberFormat: options });
  }

  validate(value: PropertyValue): ValidationError | null {
    const options = (this.definition.options as any)?.numberOptions;

    // 范围验证
    if (options) {
      const rangeError = PropertyFormatter.validateRange(
        value as number,
        options.min,
        options.max
      );
      if (rangeError) return rangeError;
    }

    // 自定义规则验证
    if (this.definition.validation) {
      return PropertyFormatter.validate(value, this.definition.validation);
    }

    return null;
  }
}

/**
 * 颜色属性字段
 */
export class ColorPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseColor(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Color);
  }

  validate(value: PropertyValue): ValidationError | null {
    try {
      PropertyFormatter.parseColor(value as string);
      return null;
    } catch {
      return {
        code: 'INVALID_COLOR' as any,
        message: '无效的颜色格式',
      };
    }
  }
}

/**
 * 选择属性字段
 */
export class SelectPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    const options = (this.definition.options as any)?.selectOptions || [];
    const found = options.find((opt: any) => opt.value === rawValue);
    return found ? found.value : rawValue;
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Select);
  }

  validate(value: PropertyValue): ValidationError | null {
    const options = (this.definition.options as any)?.selectOptions || [];
    const allowedValues = options.map((opt: any) => opt.value);

    return PropertyFormatter.validateEnum(value, allowedValues);
  }

  /**
   * 获取选项列表
   */
  getOptions(): Array<{ label: string; value: PropertyValue }> {
    return (this.definition.options as any)?.selectOptions || [];
  }
}

/**
 * 复选框属性字段
 */
export class CheckboxPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseBoolean(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Checkbox);
  }

  validate(value: PropertyValue): ValidationError | null {
    return PropertyFormatter.validateType(value, PropertyType.Checkbox);
  }
}

/**
 * 开关属性字段
 */
export class SwitchPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseBoolean(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Switch);
  }

  validate(value: PropertyValue): ValidationError | null {
    return PropertyFormatter.validateType(value, PropertyType.Switch);
  }
}

/**
 * 滑块属性字段
 */
export class SliderPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseNumber(rawValue);
  }

  format(value: PropertyValue): string {
    const options = (this.definition.options as any)?.sliderOptions;
    return PropertyFormatter.format(value, PropertyType.Slider, { numberFormat: options });
  }

  validate(value: PropertyValue): ValidationError | null {
    const options = (this.definition.options as any)?.sliderOptions;
    return PropertyFormatter.validateRange(value as number, options?.min, options?.max);
  }

  /**
   * 获取滑块配置
   */
  getSliderConfig(): any {
    return (this.definition.options as any)?.sliderOptions;
  }
}

/**
 * 评分属性字段
 */
export class RatingPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseNumber(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Rating);
  }

  validate(value: PropertyValue): ValidationError | null {
    // 评分通常是 1-5
    return PropertyFormatter.validateRange(value as number, 1, 5);
  }
}

/**
 * 日期属性字段
 */
export class DatePropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseDate(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Date);
  }

  validate(value: PropertyValue): ValidationError | null {
    try {
      PropertyFormatter.parseDate(value as string);
      return null;
    } catch {
      return {
        code: 'INVALID_DATE' as any,
        message: '无效的日期格式',
      };
    }
  }
}

/**
 * 时间属性字段
 */
export class TimePropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseTime(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Time);
  }

  validate(value: PropertyValue): ValidationError | null {
    try {
      PropertyFormatter.parseTime(value as string);
      return null;
    } catch {
      return {
        code: 'INVALID_TIME' as any,
        message: '无效的时间格式',
      };
    }
  }
}

/**
 * 日期时间属性字段
 */
export class DateTimePropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseDateTime(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.DateTime);
  }

  validate(value: PropertyValue): ValidationError | null {
    try {
      PropertyFormatter.parseDateTime(value as string);
      return null;
    } catch {
      return {
        code: 'INVALID_DATETIME' as any,
        message: '无效的日期时间格式',
      };
    }
  }
}

/**
 * JSON属性字段
 */
export class JsonPropertyField extends PropertyField {
  parse(rawValue: string): PropertyValue {
    return PropertyFormatter.parseJson(rawValue);
  }

  format(value: PropertyValue): string {
    return PropertyFormatter.format(value, PropertyType.Json);
  }

  validate(value: PropertyValue): ValidationError | null {
    try {
      JSON.stringify(value);
      return null;
    } catch {
      return {
        code: 'INVALID_JSON' as any,
        message: '无效的 JSON 格式',
      };
    }
  }
}

/**
 * 属性字段工厂
 * 根据类型创建相应的属性字段实例
 */
export class PropertyFieldFactory {
  private static registrations: Map<PropertyType, PropertyFieldRegistration> = new Map();

  static {
    // 注册内置字段类型
    PropertyFieldFactory.registerBuiltInFields();
  }

  /**
   * 注册内置字段类型
   */
  private static registerBuiltInFields(): void {
    // Text
    this.registrations.set(PropertyType.Text, {
      type: PropertyType.Text,
      parse: (rawValue) => rawValue,
      format: (value) => PropertyFormatter.format(value, PropertyType.Text),
      validate: (value) => {
        // Text 类型默认验证通过
        return null;
      },
      component: TextPropertyField,
    });

    // Number
    this.registrations.set(PropertyType.Number, {
      type: PropertyType.Number,
      parse: (rawValue, options) => {
        const numberOptions = (options as any)?.numberOptions;
        return PropertyFormatter.parseNumber(rawValue, numberOptions);
      },
      format: (value, options) => {
        const numberOptions = (options as any)?.numberOptions;
        return PropertyFormatter.format(value, PropertyType.Number, { numberFormat: numberOptions });
      },
      validate: (value) => PropertyFormatter.validateType(value, PropertyType.Number),
      component: NumberPropertyField,
    });

    // Color
    this.registrations.set(PropertyType.Color, {
      type: PropertyType.Color,
      parse: (rawValue) => PropertyFormatter.parseColor(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Color),
      validate: () => null,
      component: ColorPropertyField,
    });

    // Select
    this.registrations.set(PropertyType.Select, {
      type: PropertyType.Select,
      parse: (rawValue) => rawValue,
      format: (value) => PropertyFormatter.format(value, PropertyType.Select),
      validate: () => null,
      component: SelectPropertyField,
    });

    // Checkbox
    this.registrations.set(PropertyType.Checkbox, {
      type: PropertyType.Checkbox,
      parse: (rawValue) => PropertyFormatter.parseBoolean(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Checkbox),
      validate: () => null,
      component: CheckboxPropertyField,
    });

    // Switch
    this.registrations.set(PropertyType.Switch, {
      type: PropertyType.Switch,
      parse: (rawValue) => PropertyFormatter.parseBoolean(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Switch),
      validate: () => null,
      component: SwitchPropertyField,
    });

    // Slider
    this.registrations.set(PropertyType.Slider, {
      type: PropertyType.Slider,
      parse: (rawValue) => PropertyFormatter.parseNumber(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Slider),
      validate: () => null,
      component: SliderPropertyField,
    });

    // Date
    this.registrations.set(PropertyType.Date, {
      type: PropertyType.Date,
      parse: (rawValue) => PropertyFormatter.parseDate(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Date),
      validate: () => null,
      component: DatePropertyField,
    });

    // Time
    this.registrations.set(PropertyType.Time, {
      type: PropertyType.Time,
      parse: (rawValue) => PropertyFormatter.parseTime(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Time),
      validate: () => null,
      component: TimePropertyField,
    });

    // DateTime
    this.registrations.set(PropertyType.DateTime, {
      type: PropertyType.DateTime,
      parse: (rawValue) => PropertyFormatter.parseDateTime(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.DateTime),
      validate: () => null,
      component: DateTimePropertyField,
    });

    // Json
    this.registrations.set(PropertyType.Json, {
      type: PropertyType.Json,
      parse: (rawValue) => PropertyFormatter.parseJson(rawValue),
      format: (value) => PropertyFormatter.format(value, PropertyType.Json),
      validate: () => null,
      component: JsonPropertyField,
    });
  }

  /**
   * 注册自定义字段类型
   */
  static register(registration: PropertyFieldRegistration): void {
    this.registrations.set(registration.type, registration);
  }

  /**
   * 创建属性字段实例
   */
  static create(
    type: PropertyType,
    definition: PropertyDefinition,
    value: PropertyValue
  ): PropertyField {
    const registration = this.registrations.get(type);

    if (!registration) {
      throw new Error(`未知属性类型: ${type}`);
    }

    // 如果有自定义组件类，使用它
    if (registration.component) {
      const FieldClass = registration.component as any;
      return new FieldClass(definition, value);
    }

    // 创建通用属性字段
    return new GenericPropertyField(definition, value, registration);
  }

  /**
   * 获取注册信息
   */
  static getRegistration(type: PropertyType): PropertyFieldRegistration | undefined {
    return this.registrations.get(type);
  }

  /**
   * 获取所有注册类型
   */
  static getAllTypes(): PropertyType[] {
    return Array.from(this.registrations.keys());
  }
}

/**
 * 通用属性字段
 * 使用注册信息来实现解析、格式化和验证
 */
class GenericPropertyField extends PropertyField {
  private registration: PropertyFieldRegistration;

  constructor(
    definition: PropertyDefinition,
    value: PropertyValue,
    registration: PropertyFieldRegistration
  ) {
    super(definition, value);
    this.registration = registration;
  }

  parse(rawValue: string): PropertyValue {
    return this.registration.parse(rawValue, this.definition.options);
  }

  format(value: PropertyValue): string {
    return this.registration.format(value, this.definition.options);
  }

  validate(value: PropertyValue): ValidationError | null {
    return this.registration.validate(value, this.definition.options);
  }
}
