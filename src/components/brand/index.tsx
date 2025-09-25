import { NavLink } from "react-router";
import { Icon } from "@/components/icon";
import { GLOBAL_CONFIG } from "@/global-config";

export default function Brand() {
	return (
		<NavLink to="/" className="inline-flex items-center gap-2 select-none">
			<Icon icon="mdi:star" size={22} className="text-red-500" color="#ef4444" />
			<span className="text-base font-semibold leading-tight text-foreground">
				{GLOBAL_CONFIG.appName || "数据管理平台系统端(密级)"}
			</span>
		</NavLink>
	);
}
