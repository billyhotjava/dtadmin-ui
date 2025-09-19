<<<<<<< HEAD
import DataPlatformImg from "@/assets/images/background/data-platform-tech.svg";
import { Icon } from "@/components/icon";
=======
import { Navigate } from "react-router";
import TechDataBackground from "@/assets/images/background/tech-data-platform.svg";
>>>>>>> origin/1.0.0
import LocalePicker from "@/components/locale-picker";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { useUserToken } from "@/store/userStore";
<<<<<<< HEAD
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
=======
>>>>>>> origin/1.0.0
import LoginForm from "./login-form";
import { LoginProvider } from "./providers/login-provider";
import RegisterForm from "./register-form";
import ResetForm from "./reset-form";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

function LoginPage() {
	const { t } = useTranslation();
	const token = useUserToken();
	const { t, i18n } = useTranslation();

	if (token.accessToken) {
		return <Navigate to={GLOBAL_CONFIG.defaultRoute} replace />;
	}

	const brandLabel = i18n.language?.toLowerCase().startsWith("zh") ? "数据管理平台(密级)" : "Data Platform Manager";
	const brandLabelFromLocale = t("sys.login.brandName", {
		defaultValue: brandLabel,
	});

	return (
		<div className="relative grid min-h-svh lg:grid-cols-2 bg-background">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
<<<<<<< HEAD
					<div className="flex items-center gap-2 text-xl font-semibold text-foreground">
						<Icon icon="lucide:star" size={28} className="text-primary" />
						<span>{t("sys.login.brandTitle")}</span>
=======
					<div className="flex items-center gap-3 font-medium cursor-default">
						<Star className="h-8 w-8 text-primary" fill="currentColor" strokeWidth={1.5} />
						<span className="text-lg font-semibold leading-tight text-foreground">{brandLabelFromLocale}</span>
>>>>>>> origin/1.0.0
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginProvider>
							<LoginForm />
							<RegisterForm />
							<ResetForm />
						</LoginProvider>
					</div>
				</div>
			</div>

			<div className="relative hidden bg-background-paper lg:block">
				<img
<<<<<<< HEAD
					src={DataPlatformImg}
					alt="technology driven data platform illustration"
=======
					src={TechDataBackground}
					alt={t("sys.login.brandIllustrationAlt", {
						defaultValue: "Futuristic data platform visualization",
					})}
>>>>>>> origin/1.0.0
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
				/>
			</div>

			<div className="absolute right-2 top-0 flex flex-row hidden">
				<LocalePicker />
				<SettingButton />
			</div>
		</div>
	);
}
export default LoginPage;
