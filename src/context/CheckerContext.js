import React, { createContext, useContext, useState } from "react";
import { Query } from "appwrite";
import appwriteService from "../appwrite/config";
import authService from "../appwrite/auth";

export const CheckerContext = createContext({
    subjects: [],
    fetchSubjects: () => {},
    AddSubject: () => {},
});

export const UseChecker = () => {
    return useContext(CheckerContext);
};

export const Checkprovider = ({ children }) => {
    const [subjects, setSubjects] = useState([]);

    const fetchSubjects = async (userid) => {
        try {
            

            const response = await appwriteService.getSubjects([
                Query.equal("userId", userid)
            ]);
            if (response?.documents) {
                setSubjects([...response.documents]); 
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const AddSubject = async (newSubject) => {
        try {
            const session = await authService.getCurrentUser();
            const userId = session?.$id;

            if (newSubject.trim()) {
                const createdSubject = await appwriteService.createSub({
                    Subject: newSubject,
                    userId: userId,
                });

                setSubjects((prev) => [...prev, createdSubject]);
            } else {
                console.warn("Subject is empty!");
            }
        } catch (error) {
            console.error("Error submitting subject:", error);
        }
    };

    return (
        <CheckerContext.Provider value={{ subjects, fetchSubjects, AddSubject }}>
            {children}
        </CheckerContext.Provider>
    );
};
