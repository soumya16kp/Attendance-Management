import conf from '../conf/conf.js';
import { Client, Account, ID } from "appwrite";

export class AuthService {
    client = new Client();
    account;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.account = new Account(this.client);
    }

    async createAccount({ email, password, name }) {
        try {
            console.log("Creating account for:", email);
            const userId = ID.unique();
            const userAccount = await this.account.create(userId, email, password, name);

            if (userAccount) {
                console.log("Account created successfully!");
                return this.login({ email, password }); 
            }
            return null;
        } catch (error) {
            console.error("Signup Error:", error.message);
            throw error;
        }
    }

    async login({ email, password}) {
        try {
            console.log("Attempting login...");
            await new Promise(resolve => setTimeout(resolve, 2000));

            return await this.account.createEmailPasswordSession(email, password);
        } catch (error) {
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const session = await this.account.get();
            return session;
        } catch (error) {
            console.log("Error in getCurrentUser:", error.message);
            return null;
        }
    }

    async logout() {
        try {
            console.log("Logging out...");
            await this.account.deleteSessions();
        } catch (error) {
            console.error("Logout Error:", error.message);
        }
    }
}

const authService = new AuthService();

export default authService;
