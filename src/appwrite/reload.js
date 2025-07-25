import conf from "../conf/conf";
import { Client, Databases, Query } from "appwrite";

const client = new Client()
    .setEndpoint(conf.appwriteUrl)
    .setProject(conf.appwriteProjectId);

const databases = new Databases(client);


function getLastSunday() {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay());
    today.setHours(0, 0, 0, 0);
    return today.toString(); 
}

async function ReloadSchedule(userId, subjects) {
    try {
        
        const response = await databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteUserCollectionId,
            [Query.equal("userId", userId)]
        );
        const userDoc = response.documents[0];
        let lastUpdated;
        if (userDoc && userDoc.lastWeek) {
            lastUpdated = new Date(userDoc.lastWeek);
            console.log("The lastWeek ",userDoc.lastWeek);
        } else {
            lastUpdated = null;
        }
        let lastSunday = getLastSunday();

        if (!lastUpdated || (new Date() - lastUpdated) /(1000 * 60 * 60 * 24) >= 7) {
            console.log("Updating schedules...");

        for (const subject of subjects) {
            
         if (!subject.Schedule || subject.Schedule.length === 0) {
                console.warn(`No schedule for ${subject.Subject}, skipping.`);
                continue;
            }
            const parsedSchedules = subject.Schedule
                .map((entry, index) => {
                    try {
                        const parsed = JSON.parse(entry);
                        if (!parsed || !parsed.day) {
                            console.warn(`Invalid schedule at index ${index} in ${subject.Subject}:`, entry);
                            return null;
                        }
                        return parsed;
                    } catch (e) {
                        console.error(`Failed to parse schedule at index ${index} in ${subject.Subject}:`, entry);
                        return null;
                    }
                })
                .filter(entry => entry !== null);

                if (parsedSchedules.length === 0) {
                    console.warn(`All schedule entries invalid for ${subject.Subject}, skipping.`);
                    continue;
                }

                let latestScheduleDate = new Date(parsedSchedules[parsedSchedules.length - 1].day);
                latestScheduleDate.setDate(latestScheduleDate.getDate() + 7);

                if (parsedSchedules.some(entry => entry.day === latestScheduleDate.toISOString().split("T")[0])) {
                    console.log(`Skipping duplicate schedule for ${subject.Subject}`);
                    continue;
                }

                const updatedSchedules = parsedSchedules.map((entry) => {
                    const newDate = new Date(entry.day); 
                    newDate.setDate(newDate.getDate() + 7);
                    entry.day = newDate.toISOString().split("T")[0];
                    entry.status= "Pending";
                    return JSON.stringify(entry);
                });

                await databases.updateDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteCollectionId, 
                    subject.$id,
                    { Schedule: [...subject.Schedule, ...updatedSchedules] }
                );
            }

            const newLastWeek = new Date(lastSunday);
            const localDate = newLastWeek.toLocaleDateString('en-CA');

            await databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteUserCollectionId,
                userDoc.$id,
                { lastWeek: localDate }
            );
            return true;
        } else {
            console.log("Not enough time has passed, skipping update.");
            return false;
        }
    } catch (error) {
        console.error("Error during schedule reload:", error);
        return false;
    }
}


export default ReloadSchedule;
