import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserInfo, UserToken } from "#/entity";
import { StorageEnum } from "#/enum";
import userService, { type SignInReq } from "@/api/services/userService";

type UserStore = {
	userInfo: Partial<UserInfo>;
	userToken: UserToken;

	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		setUserToken: (token: UserToken) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			userToken: {},
			actions: {
				setUserInfo: (userInfo) => {
					set({ userInfo });
				},
				setUserToken: (userToken) => {
					set({ userToken });
				},
				clearUserInfoAndToken() {
					set({ userInfo: {}, userToken: {} });
				},
			},
		}),
		{
			name: "userStore", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
			}),
		},
	),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useUserPermissions = () => useUserStore((state) => state.userInfo.permissions || []);
export const useUserRoles = () => useUserStore((state) => state.userInfo.roles || []);
export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
	const { setUserToken, setUserInfo } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: userService.signin,
	});

	const signIn = async (data: SignInReq) => {
		try {
			const res = await signInMutation.mutateAsync(data);
			const { user, accessToken, refreshToken } = res;

			// 适配后端数据格式：将字符串数组转换为对象数组
			const adaptedUser = {
				...user,
				// 如果roles是字符串数组，转换为对象数组
				roles:
					Array.isArray(user.roles) && user.roles.length > 0 && typeof user.roles[0] === "string"
						? (user.roles as string[]).map((role, index) => ({
								id: `role-${index}`,
								name: role,
								code: role,
							}))
						: user.roles,
				// 如果permissions是字符串数组，转换为对象数组
				permissions:
					Array.isArray(user.permissions) && user.permissions.length > 0 && typeof user.permissions[0] === "string"
						? (user.permissions as string[]).map((permission, index) => ({
								id: `permission-${index}`,
								name: permission,
								code: permission,
							}))
						: user.permissions,
				// 为用户设置默认头像
				avatar: user.avatar || "/logo.svg",
			};

			setUserToken({ accessToken, refreshToken });
			setUserInfo(adaptedUser);
		} catch (err) {
			toast.error(err.message, {
				position: "top-center",
			});
			throw err;
		}
	};

	return signIn;
};

export const useSignOut = () => {
	const { clearUserInfoAndToken } = useUserActions();
	const { userToken } = useUserStore.getState();

	const signOut = async () => {
		try {
			// 如果有refreshToken，调用后端登出接口
			if (userToken.refreshToken) {
				await userService.logout(userToken.refreshToken);
			}
		} catch (error) {
			console.error("Logout error:", error);
			// 即使登出接口失败，也要清理本地信息
		} finally {
			// 清理本地存储的用户信息和token
			clearUserInfoAndToken();
		}
	};

	return signOut;
};

export default useUserStore;
