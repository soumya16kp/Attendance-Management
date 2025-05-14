import React, { useEffect, useState } from "react";
import { UseChecker } from "../context/CheckerContext";
import authService from "../appwrite/auth";
import "./History.css";

function HistoryPage() {
  const { subjects } = UseChecker();
  const [user, setUser] = useState(null);
  const [calendar, setCalendar] = useState({ dateRange: [], subjects: [] });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchUser = async () => {
      const session = await authService.getCurrentUser();
      setUser(session);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!subjects || subjects.length === 0) return;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), selectedMonth, 1);
    const lastDayOfMonth = new Date(today.getFullYear(), selectedMonth + 1, 0);

    const dateRange = [];
    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d).toISOString().split("T")[0]);
    }

    const processed = subjects.map((subject) => {
      const parsedSchedule = subject.Schedule.map((entry) => JSON.parse(entry));
      const dateStatusMap = {};
      parsedSchedule.forEach((entry) => {
        dateStatusMap[entry.day] = entry.status;
      });
      return {
        ...subject,
        dateStatusMap,
      };
    });

    setCalendar({ dateRange, subjects: processed });
  }, [subjects, selectedMonth]);

  return (
    <div className="history-page">
      <div className="month-selector">
        <label>Select Month: </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <div className="Infor">
          <div className="info-item">
            <div className="attendance-dot attended"></div>
            <span>Attended</span>
          </div>
          <div className="info-item">
            <div className="attendance-dot absent"></div>
            <span>Absent</span>
          </div>
          <div className="info-item">
            <div className="attendance-dot canceled"></div>
            <span>Canceled</span>
          </div>
        </div>

      </div>

      <div className="history-grid-wrapper">
        <div className="history-grid">
          {/* SUBJECT COLUMN */}
          <div className="subject-column">
            <div className="subject-cell">Subject</div>
            {calendar.subjects.map((subject) => (
              <div key={subject.$id} className="subject-label">
                {subject.Subject}
              </div>
            ))}
          </div>

          {/* DATES COLUMN */}
          <div className="dates-section">
            <div className="date-row">
              {calendar.dateRange.map((date) => (
                <div key={date} className="date-cell">
                  {date.slice(8)}
                </div>
              ))}
            </div>

            {calendar.subjects.map((subject) => (
              <div key={subject.$id} className="attendance-row">
                {calendar.dateRange.map((date) => {
                  const status = subject.dateStatusMap[date];
                  let className = "attendance-box";
                  if (status === "Attended") className += " attended";
                  else if (status === "Absent") className += " absent";
                  else if (status === "Canceled") className += "canceled";

                  return (
                    <div className="attendance-box" key={subject.$id + date}>
                    <div
                        className={`attendance-dot ${
                        status === "Attended" ? "attended" : status === "Absent" ? "absent" : status === "Canceled"?"canceled":"none"
                        }`}
                        title={status ? `${subject.Subject} (${status})` : ""}
                    ></div>
                    </div>

                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
