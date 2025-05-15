import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { UseChecker } from "../context/CheckerContext";
import "./Dashboard.css";

const COLORS = ["#4CAF50", "#FFC107", "#E63946", "#2196F3", "#9C27B0", "#FF5722"];

const Dashboard = () => {
    const { subjects } = UseChecker();

    // Calculate total attendance and absence percentage
    const totalClasses = subjects.reduce((sum, subject) => sum + subject.Schedule.filter(s => JSON.parse(s).status !== "Canceled").length, 0);
    const totalAttended = subjects.reduce((sum, subject) => sum + subject.Schedule.filter(s => JSON.parse(s).status === "Attended").length, 0);
    const totalAbsent = totalClasses - totalAttended;
    const attendancePercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(2) : 0;
    const absentPercentage = totalClasses > 0 ? ((totalAbsent / totalClasses) * 100).toFixed(2) : 0;

    // Function to process attendance data
    const processAttendanceData = () => {
        return subjects.map(subject => ({
            name: subject.Subject,
            attended: subject.Schedule.filter(s => JSON.parse(s).status === "Attended").length,
            total: subject.Schedule.filter(s => JSON.parse(s).status !== "Canceled").length
        }));
    };

    // Function to process pie chart data
    const processPieData = () => {
        return subjects.map(subject => {
            const totalClasses = subject.Schedule.filter(s => JSON.parse(s).status !== "Canceled").length;
            const attendedClasses = subject.Schedule.filter(s => JSON.parse(s).status === "Attended").length;
            const percentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
            return { name: subject.Subject, value: percentage };
        });
    };

    const attendanceData = processAttendanceData();
    const pieData = processPieData();

    // State for screen width detection
    const [isMobile, setIsMobile] = useState(false);

    // Update screen size on load and resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768); // Set mobile breakpoint at 768px
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Run it on mount as well

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="dashboard-container">
            {/* Summary Section */}
            <div className="dashboard-summary">
                <div className="summary-card">
                    <h3>Total Attendance</h3>
                    <p className="attendance-percentage">{attendancePercentage}%</p>
                </div>
                <div className="summary-card">
                    <h3>Total Absent</h3>
                    <p className="absent-percentage">{absentPercentage}%</p>
                </div>
                <div className="summary-card">
                    <h3>Net Attendance</h3>
                    <p className="net-attendance">{totalAttended} / {totalClasses} Classes</p>
                </div>
            </div>

            {/* Attendance Overview */}
            <div className="dashboard-card">
                <h2 className="dashboard-header">Attendance Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData} barGap={8}>
                        {/* Conditionally render the XAxis based on screen width */}
                        {!isMobile && (
                            <XAxis dataKey="name" stroke="#555" />
                        )}
                        <YAxis />
                        <Tooltip cursor={{ fill: "#444444" }} />
                        <Legend />
                        <Bar dataKey="attended" fill="#4CAF50" barSize={40} name="Attended" />
                        <Bar dataKey="total" fill="#FFC107" barSize={40} name="Total Classes" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Circular Progress for All Classes */}
            <div className="dashboard-card chart-container">
                <h2 className="dashboard-header">Attendance Distribution</h2>
                <ResponsiveContainer width={300} height={350}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;
