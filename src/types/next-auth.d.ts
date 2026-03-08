import { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
    role: string;
    fullName?: string;
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}
