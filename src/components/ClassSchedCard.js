import  { useEffect, useState } from "react";
import "./ClassSchedCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import CircularProgress from "./Calculator";
import appwriteService from "../appwrite/config";
import authService from "../appwrite/auth";
import { UseChecker } from "../context/CheckerContext";
import { Query } from "appwrite";

const ClassScheduleCard = ({ subject }) => {
    const { fetchSubjects } = UseChecker();
    const [schedule, setSchedule] = useState([]);
    const [filteredSchedule, setFilteredSchedule] = useState([]);
    const [status, setStatus] = useState("closed");
    const [showModal, setShowModal] = useState(false);
    const [newDay, setNewDay] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [editIndex, setEditIndex] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [rename, setRename] = useState(false);
    const [newName, setNewName] = useState(subject.Subject);
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [showAllPast, setShowAllPast] = useState(false);

    const statusOptions = ["Attended", "Absent", "Canceled", "Pending"];
    const now = new Date();
    const lastWeekStart = new Date();
    lastWeekStart.setDate(now.getDate() - 7);

    useEffect(() => {
        if (subject?.Schedule) {
            const parsedSchedule = subject.Schedule.map(entry => JSON.parse(entry));
            const sortedSchedule = parsedSchedule.sort((a, b) => new Date(a.day) - new Date(b.day));
            setSchedule(sortedSchedule);
        }
    }, [subject]);

    useEffect(() => {
        const fetchSchedule = async () => {
            const userId = await FindUser();
            if (!userId) return;
            if (showAllPast) {
                try {
                    const response = await appwriteService.getLastWeek([
                        Query.equal("userId", userId)
                    ]);
                    
                    const lastday = new Date(response?.documents?.[0]?.lastWeek);

                    console.log("The Last Day is ",lastday);
                    const scheduleResponse = await appwriteService.getSubjects([Query.equal("userId", userId)]);
                    // console.log(scheduleResponse);
                    const alldata= scheduleResponse.documents

                    const allEntries = alldata.flatMap(doc =>
                        doc.Schedule.map(entry => ({
                            ...JSON.parse(entry),
                            subjectName: doc.Subject
                        }))
                    );

                    const pastForThisSubject = allEntries.filter(e =>
                        e.subjectName === subject.Subject &&
                        new Date(e.day) < lastday
                    );

                    const sorted = pastForThisSubject.sort((a, b) => new Date(a.day) - new Date(b.day));
                    setFilteredSchedule(sorted);
                } catch (error) {
                    console.error("Error fetching all past classes:", error);
                }
            } else if (showUpcoming) {
                const upcoming = schedule.filter(e => new Date(e.day) >= now);
                setFilteredSchedule(upcoming);
            } else {
    
                const lastWeekOnly = schedule.filter(e => {
                    const d = new Date(e.day);
                    return d >= lastWeekStart && d < now;
                });
                setFilteredSchedule(lastWeekOnly);
            }
        };

        fetchSchedule();
    }, [schedule, showUpcoming, showAllPast]);

    const FindUser = async () => {
        const session = await authService.getCurrentUser();
        return session?.$id;
    };

    const handleSaveClass = async () => {
        if (newDay && startTime && endTime) {
            const updatedSchedule = [...schedule];
            const newEntry = { day: newDay, time: `${startTime} - ${endTime}`, status: "Pending" };

            if (editIndex !== null) {
                updatedSchedule[editIndex] = newEntry;
            } else {
                updatedSchedule.push(newEntry);
            }

            await updateSubject(updatedSchedule, status);
            closeModal();
        }
    };

    const handleDeleteClass = async (index) => {
        const updatedSchedule = schedule.filter((_, i) => i !== index);
        await updateSubject(updatedSchedule, status);
    };

    const handleStatusChange = async (index, newStatus) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[index].status = newStatus;
        await updateSubject(updatedSchedule, status);
    };

    const updateSubject = async (updatedSchedule, updatedStatus) => {
        try {
            await appwriteService.updatePost(subject.$id, {
                Subject: subject.Subject,
                userId: subject.userId,
                Schedule: updatedSchedule.map(entry => JSON.stringify(entry)),
                status: updatedStatus
            });

            setSchedule(updatedSchedule);
            setStatus(updatedStatus);
            const userid = await FindUser();
            fetchSubjects(userid);
        } catch (error) {
            console.error("Error updating schedule:", error);
        }
    };

    const handleEditClass = (index) => {
        setEditIndex(index);
        setNewDay(schedule[index].day);
        const [start, end] = schedule[index].time.split(" - ");
        setStartTime(start);
        setEndTime(end);
        setShowModal(true);
    };

    const handleRenameSubject = async () => {
        try {
            await appwriteService.updatePost(subject.$id, {
                Subject: newName,
                userId: subject.userId,
                Schedule: subject.Schedule,
                status: subject.status
            });

            setRename(false);
            const userid = await FindUser();
            fetchSubjects(userid);
        } catch (error) {
            console.error("Error renaming subject:", error);
        }
    };

    const handleDeleteSubject = async () => {
        try {
            await appwriteService.deleteSubject(subject.$id);
            const userid = await FindUser();
            fetchSubjects(userid);
        } catch (error) {
            console.error("Error deleting subject:", error);
        }
    };

    const closeModal = () => {
        setNewDay("");
        setStartTime("");
        setEndTime("");
        setEditIndex(null);
        setShowModal(false);
    };

    return (
        <div className="card">
            <div className="subject-header">
                <h2 className="subject">
                    {rename ? (
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRenameSubject}
                            autoFocus
                        />
                    ) : (
                        subject.Subject
                    )}
                </h2>

                <div className="menu-container">
                    <button className="menu-btn" onClick={() => setShowOptions(!showOptions)}>
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    {showOptions && (
                        <div className="dropdown-menu">
                            <button onClick={() => setRename(true)}>Rename</button>
                            <button onClick={handleDeleteSubject}>Delete</button>
                            <button onClick={() => {
                                setShowUpcoming(!showUpcoming);
                                setShowAllPast(false);
                            }}>
                                {showUpcoming ? "Show Last Week" : "Show Upcoming"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="schedule-container">
                <div>
                    {showUpcoming ? 
                    <button
                        className="secondary-btn"
                        onClick={() => {
                            setShowAllPast(true);
                            setShowUpcoming(false);
                        }}
                    >
                        Show All Past Classes
                    </button>:
                        <button
                        className="secondary-btn"
                        onClick={() => {
                            setShowAllPast(false);
                            setShowUpcoming(true);
                        }}
                    >
                        Show Upcoming Classes
                    </button>
                    }
                </div>
                <div className="schedule">
                    {filteredSchedule.length > 0 ? (
                        filteredSchedule.map((entry, index) => (
                            <div key={index} className="schedule-item">
                                <div className="class-info">
                                    <span className="day">{entry.day}</span>
                                    <span className="time">{entry.time}</span>
                                </div>

                                <select
                                    className={`status ${entry.status.toLowerCase()}`}
                                    value={entry.status}
                                    onChange={(e) => handleStatusChange(index, e.target.value)}
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>

                                <div className="actions">
                                    <button className="icon-btn edit-btn" onClick={() => handleEditClass(index)}>
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button className="icon-btn delete-btn" onClick={() => handleDeleteClass(index)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No classes scheduled</p>
                    )}
                </div>
            </div>

            <div className="BelowBar">
                <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Class</button>
                
                <CircularProgress subjectid={subject.$id} />
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{editIndex !== null ? "Edit Class" : "Add Class"}</h2>

                        <div className="input-group">
                            <label>Select Date:</label>
                            <input
                                type="date"
                                value={newDay}
                                onChange={(e) => setNewDay(e.target.value)}
                            />
                        </div>

                        <div className="input-group time-picker">
                            <div>
                                <label>Start Time:</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>End Time:</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-buttons">
                            <button className="save-btn" onClick={handleSaveClass}>Save</button>
                            <button className="close-btn" onClick={closeModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassScheduleCard;
