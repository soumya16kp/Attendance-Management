import React, { useEffect, useState } from "react";
import { UseChecker } from "../context/CheckerContext";

const CircularProgress = ({ subjectid, size = 60, strokeWidth = 10 }) => {
    const { subjects } = UseChecker();
    const [percentage, setPercentage] = useState(null);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - (percentage ?? 0) / 100);

    useEffect(() => {
        if (!subjects || subjects.length === 0) return;

        const getPercentage = () => {
            let subject = subjects.find(sub => sub.$id === subjectid);
            if (!subject) return 0;

            let totalClasses = subject.Schedule
                .map(s => JSON.parse(s))
                .filter(s => s.status !== "Canceled" && s.status !== "Pending").length;
            let attendedClasses = subject.Schedule
                .map(s => JSON.parse(s))
                .filter(s => s.status === "Attended").length;

            return totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(2)) : 0;
        };

        setPercentage(getPercentage());
    }, [subjects, subjectid]);

    const getColor = () => {
        if (percentage >= 75) return "#4CAF50";
        if (percentage >= 40) return "#FFC107";
        return "#E63946";
    };

    return (
        <div className="progress-container" style={{ width: size, height: size, position: "relative" }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#ddd"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
            </svg>
            <div className="percentage-text" style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "1rem",
                fontWeight: "bold",
                color: "#333"
            }}>
                {percentage ?? 0}%
            </div>
        </div>
    );
};

export default CircularProgress;
