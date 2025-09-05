import { useCallback, useEffect, useState } from "react";
import type { UserProfileAttribute } from "#/keycloak";
import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";

interface UserProfileFieldProps {
	attribute: UserProfileAttribute;
	value: string | string[] | undefined;
	onChange: (value: string | string[]) => void;
	disabled?: boolean;
}

export function UserProfileField({ attribute, value, onChange, disabled = false }: UserProfileFieldProps) {
	// 将值转换为数组格式
	const getValueArray = useCallback((): string[] => {
		if (Array.isArray(value)) {
			return value;
		}
		if (typeof value === "string" && value) {
			return [value];
		}
		return [];
	}, [value]);

	const [values, setValues] = useState<string[]>(getValueArray());

	// 当外部值变化时，更新内部状态
	useEffect(() => {
		setValues(getValueArray());
	}, [getValueArray]);

	// 当值发生变化时通知父组件
	const notifyChange = (newValues: string[]) => {
		setValues(newValues);
		if (attribute.multivalued) {
			onChange(newValues);
		} else {
			onChange(newValues.length > 0 ? newValues[0] : "");
		}
	};

	// 获取预定义的选项（从validations中获取）
	const getPredefinedOptions = useCallback((): string[] => {
		// 首先检查validations.options.options
		if (attribute.validations?.options?.options) {
			const options = attribute.validations.options.options;
			if (Array.isArray(options)) {
				return options as string[];
			}
		}

		// 如果没有找到validations中的选项，再检查annotations.inputOptions
		if (attribute.annotations?.inputOptions) {
			// inputOptions可能是一个字符串数组
			if (Array.isArray(attribute.annotations.inputOptions)) {
				return attribute.annotations.inputOptions as string[];
			}
			// inputOptions也可能是一个逗号分隔的字符串
			if (typeof attribute.annotations.inputOptions === "string") {
				return (attribute.annotations.inputOptions as string).split(",").map((opt) => opt.trim());
			}
			// 如果inputOptions是对象，尝试获取values属性
			if (typeof attribute.annotations.inputOptions === "object") {
				const inputOptions = attribute.annotations.inputOptions as Record<string, any>;
				if (Array.isArray(inputOptions.values)) {
					return inputOptions.values as string[];
				}
			}
		}

		// 如果没有预定义选项，返回空数组
		return [];
	}, [attribute.annotations, attribute.validations]);

	// 添加值
	const handleAddValue = (option: string) => {
		if (attribute.multivalued) {
			// 多值属性：添加到数组中（如果尚未存在）
			if (!values.includes(option)) {
				notifyChange([...values, option]);
			}
		} else {
			// 单值属性：直接设置值
			notifyChange([option]);
		}
	};

	// 删除值
	const handleRemoveValue = (option: string) => {
		if (attribute.multivalued) {
			// 多值属性：从数组中移除
			const newValues = values.filter((v) => v !== option);
			notifyChange(newValues);
		} else {
			// 单值属性：清空值
			notifyChange([]);
		}
	};

	// 获取可用的选项（未被选择的选项）
	const getAvailableOptions = useCallback((): string[] => {
		const predefinedOptions = getPredefinedOptions();
		if (predefinedOptions.length > 0) {
			// 返回未被选择的选项
			return predefinedOptions.filter((option) => !values.includes(option));
		}
		// 如果没有预定义选项，返回空数组
		return [];
	}, [getPredefinedOptions, values]);

	const predefinedOptions = getPredefinedOptions();
	const availableOptions = getAvailableOptions();

	return (
		<div className="space-y-2">
			<Label>
				{attribute.displayName || attribute.name}
				{attribute.required?.roles && attribute.required.roles.length > 0 && (
					<span className="text-destructive ml-1">*</span>
				)}
			</Label>

			{/* 已选择的值 */}
			<div className="flex flex-wrap gap-2">
				{values.map((value) => (
					<Badge key={value} variant="default">
						{value}
						{!disabled && (
							<Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => handleRemoveValue(value)}>
								<Icon icon="mdi:close" size={12} />
							</Button>
						)}
					</Badge>
				))}
				{values.length === 0 && <span className="text-muted-foreground text-sm">-</span>}
			</div>

			{/* 可用的选项 */}
			{!disabled && predefinedOptions.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{availableOptions.map((option) => (
						<Badge
							key={option}
							variant="outline"
							className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
							onClick={() => handleAddValue(option)}
						>
							{option}
							<Icon icon="mdi:plus" size={12} className="ml-1" />
						</Badge>
					))}
				</div>
			)}

			{/* 如果没有预定义选项，显示提示信息 */}
			{!disabled && predefinedOptions.length === 0 && (
				<p className="text-sm text-muted-foreground">该属性没有预定义选项，当前实现为自由输入模式</p>
			)}

			{attribute.multivalued && predefinedOptions.length > 0 && (
				<p className="text-sm text-muted-foreground">这是一个多值属性，可以从预定义选项中选择多个值</p>
			)}
		</div>
	);
}
