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
    const [allParsedEntries, setAllParsedEntries] = useState([]);
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
        const fetchInitialData = async () => {
            const userId = await FindUser();
            if (!userId) return;

            try {
                const subjectsResponse = await appwriteService.getSubjects([
                    Query.equal("userId", userId)
                ]);
                const allSubjects = subjectsResponse.documents;

                const entries = allSubjects.flatMap(doc =>
                    doc.Schedule.map(entry => ({
                        ...JSON.parse(entry),
                        subjectName: doc.Subject
                    }))
                );

                setAllParsedEntries(entries);

                const currentSubject = allSubjects.find(doc => doc.$id === subject.$id);
                if (currentSubject) {
                    const parsed = currentSubject.Schedule.map(e => JSON.parse(e));
                    setSchedule(parsed.sort((a, b) => new Date(a.day) - new Date(b.day)));
                }
            } catch (error) {
                console.error("Error fetching subjects:", error);
            }
        };

        fetchInitialData();
    }, [subject.$id]);

    useEffect(() => {
        if (showAllPast) {
            const pastForThisSubject = allParsedEntries.filter(e =>
                e.subjectName === subject.Subject && new Date(e.day) < now
            );
            setFilteredSchedule(pastForThisSubject.sort((a, b) => new Date(a.day) - new Date(b.day)));
        } else if (showUpcoming) {
            setFilteredSchedule(schedule.filter(e => new Date(e.day) >= now));
        } else {
            const lastWeekOnly = schedule.filter(e => {
                const d = new Date(e.day);
                return d >= lastWeekStart && d < now;
            });
            setFilteredSchedule(lastWeekOnly);
        }
        console.log("The filtered Schedule",filteredSchedule)
    }, [showAllPast, showUpcoming, schedule, allParsedEntries]);

    const FindUser = async () => {
        const session = await authService.getCurrentUser();
        return session?.$id;
    };
    const handleEditClass = (index) => {
        setEditIndex(index);
        setNewDay(schedule[index].day);
        const [start, end] = schedule[index].time.split(" - ");
        setStartTime(start);
        setEndTime(end);
        setShowModal(true);
    };

    const handleSaveClass = async () => {
        if (newDay && startTime && endTime) {
            const updatedSchedule = [...schedule];
            const newEntry = {
                day: newDay,
                time: `${startTime} - ${endTime}`,
                status: "Pending"
            };

            if (editIndex !== null) {
            
                const oldEntry = schedule[editIndex];
                updatedSchedule[editIndex] = newEntry;

                setAllParsedEntries(prev =>
                    prev.map(entry => {
                        if (
                            entry.subjectName === subject.Subject &&
                            entry.day === oldEntry.day &&
                            entry.time === oldEntry.time
                        ) {
                            return { ...newEntry, subjectName: subject.Subject };
                        }
                        return entry;
                    })
                );
            } else {
                updatedSchedule.push(newEntry);
                setAllParsedEntries(prev => [
                    ...prev,
                    { ...newEntry, subjectName: subject.Subject }
                ]);
            }

            await updateSubject(updatedSchedule, status);
            closeModal();
        }
    };

    const handleDeleteClass = async (index) => {
        const removedEntry = schedule[index];
        const updatedSchedule = schedule.filter((_, i) => i !== index);
        await updateSubject(updatedSchedule, status);

        setAllParsedEntries(prev =>
            prev.filter(entry =>
                !(
                    entry.subjectName === subject.Subject &&
                    entry.day === removedEntry.day &&
                    entry.time === removedEntry.time
                )
            )
        );
        setEditIndex(null);
    };

    const handleStatusChange = async (index, newStatus) => {
            const updatedSchedule = [...schedule];
            updatedSchedule[index].status = newStatus;
            
            const newAllEntries = allParsedEntries.map(entry => {
                if (
                    entry.subjectName === subject.Subject &&
                    entry.day === updatedSchedule[index].day &&
                    entry.time === updatedSchedule[index].time
                ) {
                    return { ...entry, status: newStatus };
                }
                return entry;
            });
        setAllParsedEntries(newAllEntries);
            
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
                            className="rename-input"
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
                <button className="add-btn" onClick={( ) => setShowModal(true)}>+ Add Class</button>
                
                <CircularProgress subjectid={subject.$id} />
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        {console.log("Here is the editIndex detail ",editIndex)}
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
