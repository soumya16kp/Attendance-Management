import conf from "../conf/conf";
import { Client, ID, Databases, Storage,  } from "appwrite"; 

export class Service {
    client = new Client();
    databases;
    bucket;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);

        this.databases = new Databases(this.client);
        this.bucket = new Storage(this.client);
    }

    async createSub(data) {
        try {
            return await this.databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                ID.unique(),
                data
                
            );
        } catch (error) {
            console.error("Appwrite Error:", error);
            throw error;
        }
    }
    

    async updatePost
    (slug,data) {
        try {
            return await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                data
            );
        } catch (error) {
            console.log("Appwrite service :: updatePost error", error);
            return false;
        }
    }

    async deleteSubject(slug) {
        try {
            await this.databases.deleteDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            );
            return true;
        } catch (error) {
            console.log("Appwrite service :: deletePost error", error);
            return false;
        }
    }

    async getSubjects(queries) {
        try {
            return await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                queries,
            );
            
        } catch (error) {
            console.log("Appwrite service :: getSubjects error", error);
            return false;
        }
    }
    async getLastWeek(queries) {
        try {
            return await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteUserCollectionId,
                queries,
            );
            
        } catch (error) {
            console.log("Appwrite service :: getSubjects error", error);
            return false;
        }
    }
    
    
}

const service = new Service();
export default service;
