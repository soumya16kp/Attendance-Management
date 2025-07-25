import "./Home.css";
import { useEffect, useState } from "react";
import authService from "../appwrite/auth";
import { useNavigate } from "react-router-dom";
import { UseChecker } from "../context/CheckerContext";
import ClassScheduleCard from "../components/ClassSchedCard";
import ReloadSchedule from "../appwrite/reload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTachometerAlt, faHistory } from "@fortawesome/free-solid-svg-icons";

function Home() {
    const { subjects, fetchSubjects } = UseChecker();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserAndSubjects = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser); 
                fetchSubjects(currentUser.$id); 
            }
        };
        fetchUserAndSubjects();
    }, []);
    
    useEffect(() => {
    const reloadAndFetch = async () => {
        if (!user || subjects.length === 0) return;

        const result = await ReloadSchedule(user.$id, subjects);
        if (result) {
            fetchSubjects(user.$id);
        }
    };
    reloadAndFetch();
    const intervalId = setInterval(reloadAndFetch, 36000000); 
    return () => clearInterval(intervalId);
}, [user,subjects]);

    return (
        <div className="home-container">
            <aside className="sidebar">
                <ul className="sidebar-menu">
                    <li className="sidebar-item" onClick={() => navigate("/dashboard")}>
                        <FontAwesomeIcon icon={faTachometerAlt} className="icon" />
                        Dashboard
                    </li>
                    <li className="sidebar-item" onClick={() => navigate("/history")}>
                        <FontAwesomeIcon icon={faHistory} className="icon" />
                        History
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <div className="content">
                {subjects && subjects.length > 0 ? (
                    subjects.map((subject) => (
                        <ClassScheduleCard key={subject.$id} subject={subject} />
                    ))
                ) : (
                    <p>No subjects found</p>
                )}
            </div>
        </div>
    );
}

export default Home;
